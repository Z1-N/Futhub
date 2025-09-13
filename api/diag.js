export default async function handler(_req, res) {
  const out = { now: Date.now(), upstreams: {}, proxies: {} };
  try {
    const r1 = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard', { headers: { 'Accept': 'application/json' } });
    out.upstreams.espnSite = { ok: r1.ok, status: r1.status };
  } catch (e) { out.upstreams.espnSite = { ok: false, error: e.message }; }
  try {
    const r2 = await fetch('https://site.web.api.espn.com/apis/v2/sports/soccer/eng.1/standings', { headers: { 'Accept': 'application/json' } });
    out.upstreams.espnWeb = { ok: r2.ok, status: r2.status };
  } catch (e) { out.upstreams.espnWeb = { ok: false, error: e.message }; }
  try {
    const p1 = await fetch('http://localhost:3000/api/espn/soccer/eng.1/scoreboard', { headers: { 'Accept': 'application/json' } });
    const b1 = await p1.text();
    out.proxies.localSite = { status: p1.status, contentType: p1.headers.get('content-type'), snippet: b1.slice(0, 120) };
  } catch (e) { out.proxies.localSite = { error: e.message }; }
  try {
    const p2 = await fetch('http://localhost:3000/api/espn2/soccer/eng.1/standings', { headers: { 'Accept': 'application/json' } });
    const b2 = await p2.text();
    out.proxies.localWeb = { status: p2.status, contentType: p2.headers.get('content-type'), snippet: b2.slice(0, 120) };
  } catch (e) { out.proxies.localWeb = { error: e.message }; }
  res.status(200).json(out);
}
