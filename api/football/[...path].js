export default async function handler(req, res) {
  const { path = [] } = req.query;
  const qs = new URLSearchParams(req.query);
  qs.delete('path');
  const suffix = Array.isArray(path) ? path.join('/') : String(path || '');
  const url = `https://api.football-data.org/v4/${suffix}${qs.toString() ? `?${qs}` : ''}`;
  try {
    const upstream = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Futhub/1.0 (+football-proxy)',
        ...(process.env.FOOTBALL_DATA_API_KEY ? { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY } : {}),
      },
    });
    const body = await upstream.text();
    res.status(upstream.status).setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json').send(body);
  } catch (e) {
    res.status(502).json({ error: 'Bad gateway', details: e.message });
  }
}
