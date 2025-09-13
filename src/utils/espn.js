// Minimal client-side ESPN fetch helpers. Note: ESPN endpoints may block some origins.
// If CORS blocks requests, set VITE_CORS_PROXY in .env to a CORS proxy (own instance ideally).
// Example: VITE_CORS_PROXY=https://your-proxy.example.com/

const CORS_PROXY = import.meta.env.VITE_CORS_PROXY || '';

export const ESPN_SITE_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
export const ESPN_WEB_BASE = 'https://site.web.api.espn.com/apis/v2/sports/soccer';

export function withProxy(url) {
  if (!CORS_PROXY) return url;
  // Ensure single slash join
  return CORS_PROXY.replace(/\/$/, '') + '/' + url.replace(/^\//, '');
}

export async function fetchJSON(url, init = {}) {
  const headers = { 'Accept': 'application/json', ...(init.headers || {}) };
  const res = await fetch(withProxy(url), { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.body = text.slice(0, 300);
    throw err;
  }
  return res.json();
}

export function yyyymmdd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}
