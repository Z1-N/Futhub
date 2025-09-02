function fmt(d) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getDate()}`.padStart(2, '0');
  return `${y}${m}${dd}`;
}

export default async function handler(req, res) {
  const { league, teamId } = req.query;
  const days = Math.min(Number(req.query.days || 7), 14);
  const headers = { 'Accept': 'application/json', 'User-Agent': 'Futhub/1.0 (+upcoming-team)' };
  try {
    const start = new Date();
    start.setHours(0,0,0,0);
    const fetches = [];
    for (let i = 0; i < days; i++) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + i);
      const url = `http://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${fmt(dt)}`;
      fetches.push(fetch(url, { headers }).then(r => (r.ok ? r.json() : null)).catch(() => null));
    }
    const jsons = await Promise.all(fetches);
    const matches = [];
    for (const data of jsons) {
      const events = data?.events || [];
      for (const ev of events) {
        const comp = ev.competitions?.[0];
        const comps = comp?.competitors || [];
        if (!comps.some(c => c?.team?.id === teamId)) continue;
        const status = ev.status?.type?.state;
        if (status !== 'pre') continue;
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
    matches.sort((a,b) => new Date(a.date) - new Date(b.date));
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.status(200).json({ league, teamId, days, updatedAt: Date.now(), matches });
  } catch (e) {
    res.status(502).json({ error: 'Failed to load team upcoming', details: e.message });
  }
}
