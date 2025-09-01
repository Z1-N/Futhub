import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const DEBUG_PROXY = process.env.DEBUG_PROXY === 'true';
const STANDINGS_CACHE_TTL_SECS = Number(process.env.STANDINGS_CACHE_TTL_SECS || 180);
const UPCOMING_CACHE_TTL_SECS = Number(process.env.UPCOMING_CACHE_TTL_SECS || 120);

// In-memory cache and pending promise dedupe
const standingsCache = new Map(); // key: leagueCode, value: { data, updatedAt }
const pendingFetches = new Map(); // key: leagueCode, value: Promise
const upcomingCache = new Map(); // key: `${leagueCode}-${days}`, value: { data, updatedAt }

async function fetchWithTimeout(url, { timeout = 6000, headers } = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function normalizeStandings(json) {
  const out = { entries: [] };
  if (!json) return out;
  let groups = [];
  if (Array.isArray(json.children)) groups = json.children;
  if (!groups.length && json.standings) groups = [json];
  let entries = [];
  for (const g of groups) {
    const gEntries = g?.standings?.entries || g?.entries || [];
    if (Array.isArray(gEntries)) entries = entries.concat(gEntries);
  }
  if (!entries.length && json?.standings?.entries) entries = json.standings.entries;

  out.entries = entries.map((e, idx) => {
    const team = e.team || e?.teamRecord?.team || {};
    const statsArr = e.stats || e.team?.record?.items?.[0]?.stats || [];
    const stats = {};
    for (const s of statsArr || []) {
      if (!s || typeof s !== 'object') continue;
      stats[s.name] = s.value;
    }
    // Derive points and goal difference if missing
    const wins = Number.isFinite(stats.wins) ? stats.wins : null;
    const draws = Number.isFinite(stats.ties) ? stats.ties : (Number.isFinite(stats.draws) ? stats.draws : null);
    const gf = Number.isFinite(stats.goalsFor) ? stats.goalsFor : (Number.isFinite(stats.pointsFor) ? stats.pointsFor : null);
    const ga = Number.isFinite(stats.goalsAgainst) ? stats.goalsAgainst : (Number.isFinite(stats.pointsAgainst) ? stats.pointsAgainst : null);
    const computedPts = (Number.isFinite(wins) && Number.isFinite(draws)) ? (wins * 3 + draws) : null;
    const computedGD = (Number.isFinite(gf) && Number.isFinite(ga)) ? (gf - ga) : null;
    return {
      rank: e.rank || stats.rank || idx + 1,
      team: {
        id: team.id,
        name: team.displayName || team.name,
        logo: team.logos?.[0]?.href || team.logo || '',
      },
      P: stats.gamesPlayed ?? stats.played ?? null,
      W: wins,
      D: draws,
      L: stats.losses ?? null,
      GF: gf,
      GA: ga,
      GD: stats.goalDifferential ?? stats.pointDifferential ?? computedGD,
      Pts: stats.points ?? stats.totalPoints ?? computedPts,
    };
  });
  return out;
}

async function getStandings(leagueCode) {
  // Dedupe parallel requests
  if (pendingFetches.has(leagueCode)) return pendingFetches.get(leagueCode);
  const p = (async () => {
    const webUrl = `https://site.web.api.espn.com/apis/v2/sports/soccer/${leagueCode}/standings`;
    const headers = { 'Accept': 'application/json', 'User-Agent': 'Futhub/1.0 (+standings-cache)' };
  try {
      const webRes = await fetchWithTimeout(webUrl, { timeout: 6500, headers });
      if (webRes.ok) {
        const json = await webRes.json();
        const norm = normalizeStandings(json);
        if (norm.entries.length) {
      return { ok: true, data: norm, isFallback: false };
        }
      }
    } catch (e) {
      if (DEBUG_PROXY) console.warn('Standings web fetch failed:', e.message);
    }

    // Fallback: teams list (no stats) to avoid empty UI
    const teamsUrl = `http://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/teams`;
  try {
      const tRes = await fetchWithTimeout(teamsUrl, { timeout: 6000, headers });
      if (tRes.ok) {
        const tJson = await tRes.json();
        const teams = tJson?.sports?.[0]?.leagues?.[0]?.teams || [];
        const entries = teams.map((t, i) => ({
          rank: i + 1,
          team: {
            id: t?.team?.id,
            name: t?.team?.displayName || t?.team?.name,
            logo: t?.team?.logos?.[0]?.href || t?.team?.logo || '',
          },
          P: null, W: null, D: null, L: null, GF: null, GA: null, GD: null, Pts: null,
        }));
    return { ok: true, data: { entries }, isFallback: true };
      }
    } catch (e) {
      if (DEBUG_PROXY) console.warn('Standings teams fallback failed:', e.message);
    }
    return { ok: false, error: 'Failed to load standings' };
  })();
  pendingFetches.set(leagueCode, p);
  try {
    return await p;
  } finally {
    pendingFetches.delete(leagueCode);
  }
}

// Cached standings endpoint with stale-while-revalidate
app.get('/api/standings/:league', async (req, res) => {
  const code = req.params.league;
  const now = Date.now();
  const cached = standingsCache.get(code);
  const fresh = cached && now - cached.updatedAt < STANDINGS_CACHE_TTL_SECS * 1000;

  if (fresh) {
    // Return fresh cache immediately
    return res.json({ league: code, updatedAt: cached.updatedAt, entries: cached.data.entries, stale: false });
  }

  try {
    const result = await getStandings(code);
    if (result.ok) {
      if (!result.isFallback || !cached) {
        standingsCache.set(code, { data: result.data, updatedAt: now });
      }
      // If it was a fallback and we have cache, serve cache as stale to keep points visible
      if (result.isFallback && cached) {
        return res.json({ league: code, updatedAt: cached.updatedAt, entries: cached.data.entries, stale: true });
      }
      return res.json({ league: code, updatedAt: now, entries: result.data.entries, stale: false });
    }
  } catch (e) {
    // fall through to stale if any
  }

  if (cached) {
    // Serve stale cache as fallback
    return res.json({ league: code, updatedAt: cached.updatedAt, entries: cached.data.entries, stale: true });
  }
  res.status(502).json({ error: 'Standings unavailable' });
});

// Basic health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Diagnostics: check upstreams quickly
app.get('/api/diag', async (_req, res) => {
  const result = { now: Date.now(), upstreams: {} };
  try {
    const r1 = await fetchWithTimeout('http://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard', { timeout: 4000, headers: { 'Accept': 'application/json', 'User-Agent': 'Futhub/1.0 (+diag)' } });
    result.upstreams.espnSite = { ok: r1.ok, status: r1.status };
  } catch (e) {
    result.upstreams.espnSite = { ok: false, error: e.message };
  }

  try {
    const r2 = await fetchWithTimeout('https://site.web.api.espn.com/apis/v2/sports/soccer/eng.1/standings', { timeout: 4000, headers: { 'Accept': 'application/json', 'User-Agent': 'Futhub/1.0 (+diag)' } });
    result.upstreams.espnWeb = { ok: r2.ok, status: r2.status };
  } catch (e) {
    result.upstreams.espnWeb = { ok: false, error: e.message };
  }

  if (process.env.FOOTBALL_DATA_API_KEY) {
    try {
      const r3 = await fetchWithTimeout('https://api.football-data.org/v4/matches?limit=1', { timeout: 4000, headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY, 'Accept': 'application/json', 'User-Agent': 'Futhub/1.0 (+diag)' } });
      result.upstreams.footballData = { ok: r3.ok, status: r3.status };
    } catch (e) {
      result.upstreams.footballData = { ok: false, error: e.message };
    }
  } else {
    result.upstreams.footballData = { ok: false, error: 'FOOTBALL_DATA_API_KEY not set' };
  }

  res.json(result);
});

// Upcoming matches for a league across next N days (default 7)
app.get('/api/upcoming/:league', async (req, res) => {
  const leagueCode = req.params.league;
  const days = Math.min(Number(req.query.days || 7), 14); // cap at 14 days
  const cacheKey = `${leagueCode}-${days}`;
  const now = Date.now();
  const cached = upcomingCache.get(cacheKey);
  if (cached && now - cached.updatedAt < UPCOMING_CACHE_TTL_SECS * 1000) {
    return res.json({ league: leagueCode, days, updatedAt: cached.updatedAt, matches: cached.data });
  }

  const headers = { 'Accept': 'application/json', 'User-Agent': 'Futhub/1.0 (+upcoming)' };
  function fmt(d) {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const dd = `${d.getDate()}`.padStart(2, '0');
    return `${y}${m}${dd}`;
  }
  // Prefer ESPN-provided calendar days to ensure we query valid event days (handles intl breaks)
  const start = new Date();
  start.setHours(0,0,0,0);
  let calendarDates = [];
  try {
    const rootUrl = `http://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/scoreboard`;
    const rootRes = await fetchWithTimeout(rootUrl, { timeout: 6500, headers });
    if (rootRes.ok) {
      const rootJson = await rootRes.json();
      const cal = rootJson?.leagues?.[0]?.calendar || [];
      if (Array.isArray(cal) && cal.length) {
        const startMid = new Date(start);
        calendarDates = cal
          .map((s) => new Date(s))
          .filter((d) => d instanceof Date && !isNaN(d) && d >= startMid)
          .slice(0, days);
      }
    }
  } catch {
    // ignore calendar errors; we'll fallback to sequential days below
  }

  const fetches = [];
  if (calendarDates.length) {
    for (const dt of calendarDates) {
      const url = `http://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/scoreboard?dates=${fmt(dt)}`;
      fetches.push(
        fetchWithTimeout(url, { timeout: 6500, headers })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      );
    }
  } else {
    // Fallback: query sequential days (may yield empty during intl breaks)
    for (let i = 0; i < days; i++) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + i);
      const url = `http://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/scoreboard?dates=${fmt(dt)}`;
      fetches.push(
        fetchWithTimeout(url, { timeout: 6500, headers })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      );
    }
  }

  const jsons = await Promise.all(fetches);
  const matches = [];
  for (const data of jsons) {
    const events = data?.events || [];
    for (const ev of events) {
      const comp = ev.competitions?.[0];
      const status = ev.status?.type?.state; // 'pre','in','post'
      if (status !== 'pre') continue; // upcoming only
      const [home, away] = (comp?.competitors || []).sort((a,b)=> (a.homeAway === 'home' ? -1 : 1));
      matches.push({
        id: ev.id,
        date: ev.date,
        status: 'SCHEDULED',
        statusDetail: ev.status?.type?.shortDetail || '',
        home: { id: home?.team?.id, name: home?.team?.displayName || home?.team?.name, short: home?.team?.shortDisplayName || home?.team?.abbreviation, logo: home?.team?.logo },
        away: { id: away?.team?.id, name: away?.team?.displayName || away?.team?.name, short: away?.team?.shortDisplayName || away?.team?.abbreviation, logo: away?.team?.logo },
        venue: comp?.venue?.fullName || '',
      });
    }
  }
  // sort by date asc
  matches.sort((a,b) => new Date(a.date) - new Date(b.date));
  const payload = matches;
  upcomingCache.set(cacheKey, { data: payload, updatedAt: now });
  res.json({ league: leagueCode, days, updatedAt: now, matches: payload });
});

// Upcoming matches for a team ID within a league for next N days
app.get('/api/upcoming/:league/team/:teamId', async (req, res) => {
  const { league, teamId } = req.params;
  const days = Math.min(Number(req.query.days || 7), 14);
  try {
    const r = await fetch(`http://localhost:${process.env.PORT || 3000}/api/upcoming/${league}?days=${days}`);
    const json = await r.json();
    const filtered = (json.matches || []).filter((m) => m.home.id === teamId || m.away.id === teamId);
    res.json({ league, teamId, days, updatedAt: json.updatedAt, matches: filtered });
  } catch (e) {
    res.status(502).json({ error: 'Failed to load team matches' });
  }
});

// Team summary: recent results, upcoming fixtures, and performance
app.get('/api/team/:league/:teamId', async (req, res) => {
  const { league, teamId } = req.params;
  const recentCount = Math.min(Number(req.query.recent || 5), 10);
  const upcomingCount = Math.min(Number(req.query.upcoming || 5), 10);
  const headers = { 'Accept': 'application/json', 'User-Agent': 'Futhub/1.0 (+team)' };

  // Helper to map an event+competitors to a normalized match with result
  function toMatch(ev) {
    const comp = ev.competitions?.[0];
    const [home, away] = (comp?.competitors || []).sort((a,b)=> (a.homeAway === 'home' ? -1 : 1));
    const isHome = home?.team?.id === teamId;
    const self = isHome ? home : away;
    const opp = isHome ? away : home;
    const status = ev.status?.type?.state; // 'pre','in','post'
    const selfScore = Number(self?.score ?? 0);
    const oppScore = Number(opp?.score ?? 0);
    let result = 'U';
    if (status === 'post') {
      if (selfScore > oppScore) result = 'W';
      else if (selfScore < oppScore) result = 'L';
      else result = 'D';
    }
    return {
      id: ev.id,
      date: ev.date,
      status: status === 'pre' ? 'SCHEDULED' : (status === 'in' ? 'LIVE' : 'FINISHED'),
  home: { id: home?.team?.id, name: home?.team?.displayName || home?.team?.name, short: home?.team?.shortDisplayName || home?.team?.abbreviation, logo: home?.team?.logo, color: home?.team?.color, altColor: home?.team?.alternateColor },
  away: { id: away?.team?.id, name: away?.team?.displayName || away?.team?.name, short: away?.team?.shortDisplayName || away?.team?.abbreviation, logo: away?.team?.logo, color: away?.team?.color, altColor: away?.team?.alternateColor },
      isHome,
      score: status !== 'pre' ? `${home?.score ?? 0}-${away?.score ?? 0}` : null,
      result,
      venue: comp?.venue?.fullName || '',
    };
  }

  // 1) Recent results: walk ESPN calendar backwards until we collect enough 'post' matches
  let recent = [];
  let teamInfo = null;
  try {
    const rootUrl = `http://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard`;
    const rootRes = await fetchWithTimeout(rootUrl, { timeout: 6500, headers });
    if (rootRes.ok) {
      const rootJson = await rootRes.json();
      const cal = rootJson?.leagues?.[0]?.calendar || [];
      const today = new Date();
      const pastDays = cal
        .map((s) => new Date(s))
        .filter((d) => d instanceof Date && !isNaN(d) && d <= today)
        .sort((a,b) => b - a); // newest first
      for (const dt of pastDays) {
        const url = `http://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${dt.getFullYear()}${String(dt.getMonth()+1).padStart(2,'0')}${String(dt.getDate()).padStart(2,'0')}`;
        // eslint-disable-next-line no-await-in-loop
        const data = await fetchWithTimeout(url, { timeout: 6500, headers }).then(r => r.ok ? r.json() : null).catch(() => null);
        const events = data?.events || [];
        for (const ev of events) {
          const comp = ev.competitions?.[0];
          const comps = comp?.competitors || [];
          if (!comps.some(c => c?.team?.id === teamId)) continue;
          if (ev.status?.type?.state !== 'post') continue;
          const m = toMatch(ev);
          if (!teamInfo) {
            const t = comps.find(c => c.team?.id === teamId)?.team;
            teamInfo = { id: t?.id, name: t?.displayName || t?.name, logo: t?.logo, color: t?.color, altColor: t?.alternateColor };
          }
          recent.push(m);
          if (recent.length >= recentCount) break;
        }
        if (recent.length >= recentCount) break;
      }
    }
  } catch {
    // ignore, we'll still try upcoming and team info fallback
  }

  // 2) Upcoming fixtures: reuse our existing local endpoint to filter team matches
  let upcoming = [];
  try {
    const r = await fetch(`http://localhost:${process.env.PORT || 3000}/api/upcoming/${league}/team/${teamId}?days=14`);
    const j = await r.json();
    upcoming = (j.matches || []).slice(0, upcomingCount);
    if (!teamInfo && upcoming.length) {
      const first = upcoming[0];
      const t = first.home.id === teamId ? first.home : first.away;
      teamInfo = { id: t.id, name: t.name, logo: t.logo, color: t.color, altColor: t.altColor };
    }
  } catch {
    // ignore
  }

  // 3) Fallback team info if still missing
  if (!teamInfo) {
    try {
      const tRes = await fetchWithTimeout(`http://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams/${teamId}`, { timeout: 6000, headers });
      if (tRes.ok) {
        const tJson = await tRes.json();
  const t = tJson?.team;
  teamInfo = { id: t?.id, name: t?.displayName || t?.name, logo: t?.logos?.[0]?.href || t?.logo, color: t?.color, altColor: t?.alternateColor };
      }
    } catch {
      // keep null
    }
  }

  // 4) Compute performance from recent matches
  let performance = { last5: '', points: 0, gf: 0, ga: 0, gd: 0, winRate: 0 };
  if (recent.length) {
    const last5 = recent.slice(0, 5);
    let pts = 0, gf = 0, ga = 0, wins = 0;
    for (const m of last5) {
      const [hs, as] = (m.score || '0-0').split('-').map((n) => Number(n) || 0);
      gf += m.isHome ? hs : as;
      ga += m.isHome ? as : hs;
      if (m.result === 'W') { pts += 3; wins += 1; }
      else if (m.result === 'D') { pts += 1; }
    }
    performance = {
      last5: last5.map(m => m.result).join(''),
      points: pts,
      gf,
      ga,
      gd: gf - ga,
      winRate: Math.round((wins / last5.length) * 100),
    };
  }

  res.json({ team: teamInfo, recent, upcoming, performance });
});

// Proxy to Football-Data API, injecting the API key from env
const target = 'https://api.football-data.org/v4';
const apiKey = process.env.FOOTBALL_DATA_API_KEY;

if (!apiKey) {
  // eslint-disable-next-line no-console
  console.warn('FOOTBALL_DATA_API_KEY is not set. Requests to /api/football/* will fail.');
}

app.use(
  '/api/football',
  createProxyMiddleware({
    target,
    changeOrigin: true,
    secure: true,
    pathRewrite: {
      '^/api/football': '',
    },
    onProxyReq: (proxyReq, req) => {
      if (apiKey) {
        proxyReq.setHeader('X-Auth-Token', apiKey);
      }
      // ensure JSON response
      proxyReq.setHeader('Accept', 'application/json');
      proxyReq.setHeader('User-Agent', 'Futhub/1.0 (+local-dev)');
      if (DEBUG_PROXY) {
        // eslint-disable-next-line no-console
        console.log(`Proxying ${req.method} ${req.url} with auth header set`);
      }
    },
    onProxyRes: (proxyRes, req) => {
      const { statusCode } = proxyRes;
      if (statusCode && statusCode >= 400) {
        let body = '';
        proxyRes.on('data', (chunk) => {
          try {
            body += chunk.toString('utf8');
          } catch {
            // ignore
          }
        });
        proxyRes.on('end', () => {
          // eslint-disable-next-line no-console
          console.warn(`Upstream ${req.method} ${req.url} -> ${statusCode} ${body ? `body: ${body}` : ''}`);
        });
      }
    },
    onError: (err, _req, res) => {
      // eslint-disable-next-line no-console
      console.error('Proxy error:', err.message);
      res.status(502).json({ error: 'Bad gateway', details: err.message });
    },
  })
);

// Proxy to ESPN soccer API (no auth required)
const espnTarget = 'http://site.api.espn.com/apis/site/v2/sports/soccer';
app.use(
  '/api/espn/soccer',
  createProxyMiddleware({
    target: espnTarget,
    changeOrigin: true,
    secure: false,
    pathRewrite: {
      '^/api/espn/soccer': '',
    },
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader('Accept', 'application/json');
      proxyReq.setHeader('User-Agent', 'Futhub/1.0 (+espn-proxy)');
      if (DEBUG_PROXY) {
        // eslint-disable-next-line no-console
        console.log(`Proxying ESPN ${req.method} ${req.url}`);
      }
    },
    onError: (err, _req, res) => {
      // eslint-disable-next-line no-console
      console.error('ESPN proxy error:', err.message);
      res.status(502).json({ error: 'Bad gateway', details: err.message });
    },
  })
);

// ESPN web API (v2) for standings and richer data
const espnWebTarget = 'https://site.web.api.espn.com/apis/v2/sports/soccer';
app.use(
  '/api/espn2/soccer',
  createProxyMiddleware({
    target: espnWebTarget,
    changeOrigin: true,
    secure: true,
    pathRewrite: {
      '^/api/espn2/soccer': '',
    },
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader('Accept', 'application/json');
      proxyReq.setHeader('User-Agent', 'Futhub/1.0 (+espn-web-proxy)');
      if (DEBUG_PROXY) {
        // eslint-disable-next-line no-console
        console.log(`Proxying ESPN2 ${req.method} ${req.url}`);
      }
    },
    onError: (err, _req, res) => {
      // eslint-disable-next-line no-console
      console.error('ESPN2 proxy error:', err.message);
      res.status(502).json({ error: 'Bad gateway', details: err.message });
    },
  })
);

// In production, serve the built client from /dist
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  const distPath = path.resolve(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}${isProduction ? ' (production)' : ''}`);
});
