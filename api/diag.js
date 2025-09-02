export default async function handler(_req, res) {
  const out = { now: Date.now(), upstreams: {} };
  try {
    const r1 = await fetch('http://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard', { headers: { 'Accept': 'application/json' } });
    out.upstreams.espnSite = { ok: r1.ok, status: r1.status };
  } catch (e) { out.upstreams.espnSite = { ok: false, error: e.message }; }
  try {
    const r2 = await fetch('https://site.web.api.espn.com/apis/v2/sports/soccer/eng.1/standings', { headers: { 'Accept': 'application/json' } });
    out.upstreams.espnWeb = { ok: r2.ok, status: r2.status };
  } catch (e) { out.upstreams.espnWeb = { ok: false, error: e.message }; }
  res.status(200).json(out);
}
