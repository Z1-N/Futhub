function fmt(d) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getDate()}`.padStart(2, '0');
  return `${y}${m}${dd}`;
}

export default async function handler(req, res) {
  const { league } = req.query;
  const days = Math.min(Number(req.query.days || 7), 14);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const headers = { 'Accept': 'application/json', 'User-Agent': 'Futhub/1.0 (+upcoming)' };

  const fetches = [];
  for (let i = 0; i < days; i++) {
    const dt = new Date(start);
    dt.setDate(start.getDate() + i);
    const url = `http://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${fmt(dt)}`;
    fetches.push(fetch(url, { headers }).then(r => (r.ok ? r.json() : null)).catch(() => null));
  }

  try {
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
    matches.sort((a,b) => new Date(a.date) - new Date(b.date));
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.status(200).json({ league, days, updatedAt: Date.now(), matches });
  } catch (e) {
    res.status(502).json({ error: 'Failed to load upcoming', details: e.message });
  }
}
