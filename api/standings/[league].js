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

export default async function handler(req, res) {
  const { league } = req.query;
  const url = `https://site.web.api.espn.com/apis/v2/sports/soccer/${league}/standings`;
  try {
    const r = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'Futhub/1.0 (+standings)' } });
    if (!r.ok) return res.status(r.status).json({ error: 'upstream error' });
    const json = await r.json();
    const data = normalizeStandings(json);
  res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ league, updatedAt: Date.now(), entries: data.entries, stale: false });
  } catch (e) {
    res.status(502).json({ error: 'Failed to load standings', details: e.message });
  }
}
