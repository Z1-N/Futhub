export default async function handler(req, res) {
  const { path = [] } = req.query;
  const qs = new URLSearchParams(req.query);
  qs.delete('path');
  const suffix = Array.isArray(path) ? path.join('/') : String(path || '');
  const url = `http://site.api.espn.com/apis/site/v2/sports/soccer/${suffix}${qs.toString() ? `?${qs}` : ''}`;
  try {
    const upstream = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Futhub/1.0 (+espn-proxy)' },
    });
    const body = await upstream.text();
    res.status(upstream.status).setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json').send(body);
  } catch (e) {
    res.status(502).json({ error: 'Bad gateway', details: e.message });
  }
}
