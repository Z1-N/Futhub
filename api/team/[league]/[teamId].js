function fmt(d) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getDate()}`.padStart(2, '0');
  return `${y}${m}${dd}`;
}

function toMatch(ev, teamId) {
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

export default async function handler(req, res) {
  const { league, teamId } = req.query;
  const recentCount = Math.min(Number(req.query.recent || 5), 10);
  const upcomingCount = Math.min(Number(req.query.upcoming || 5), 10);
  const headers = { 'Accept': 'application/json', 'User-Agent': 'Futhub/1.0 (+team)' };

  // Recent: walk calendar backwards
  let recent = [];
  let teamInfo = null;
  try {
    const rootUrl = `http://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard`;
    const rootRes = await fetch(rootUrl, { headers });
    if (rootRes.ok) {
      const rootJson = await rootRes.json();
      const cal = rootJson?.leagues?.[0]?.calendar || [];
      const today = new Date();
      const pastDays = cal
        .map((s) => new Date(s))
        .filter((d) => d instanceof Date && !isNaN(d) && d <= today)
        .sort((a,b) => b - a);
      for (const dt of pastDays) {
        const url = `http://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${fmt(dt)}`;
        // eslint-disable-next-line no-await-in-loop
        const data = await fetch(url, { headers }).then(r => (r.ok ? r.json() : null)).catch(() => null);
        const events = data?.events || [];
        for (const ev of events) {
          const comp = ev.competitions?.[0];
          const comps = comp?.competitors || [];
          if (!comps.some(c => c?.team?.id === teamId)) continue;
          if (ev.status?.type?.state !== 'post') continue;
          const m = toMatch(ev, teamId);
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
  } catch {}

  // Upcoming: query next 14 days and filter
  let upcoming = [];
  try {
    const start = new Date();
    start.setHours(0,0,0,0);
    const fetches = [];
    for (let i = 0; i < 14; i++) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + i);
      const url = `http://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${fmt(dt)}`;
      fetches.push(fetch(url, { headers }).then(r => (r.ok ? r.json() : null)).catch(() => null));
    }
    const jsons = await Promise.all(fetches);
    const all = [];
    for (const data of jsons) {
      const events = data?.events || [];
      for (const ev of events) {
        const comp = ev.competitions?.[0];
        const comps = comp?.competitors || [];
        if (!comps.some(c => c?.team?.id === teamId)) continue;
        const status = ev.status?.type?.state;
        if (status !== 'pre') continue;
        all.push(toMatch(ev, teamId));
      }
    }
    upcoming = all.slice(0, upcomingCount);
    if (!teamInfo && upcoming.length) {
      const first = upcoming[0];
      const t = first.home.id === teamId ? first.home : first.away;
      teamInfo = { id: t.id, name: t.name, logo: t.logo, color: t.color, altColor: t.altColor };
    }
  } catch {}

  // Performance
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
    performance = { last5: last5.map(m => m.result).join(''), points: pts, gf, ga, gd: gf - ga, winRate: Math.round((wins / last5.length) * 100) };
  }

  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
  res.status(200).json({ team: teamInfo, recent, upcoming, performance });
}
