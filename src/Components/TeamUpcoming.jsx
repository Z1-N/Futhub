import { useEffect, useState } from 'react';
import { ESPN_SITE_BASE, fetchJSON, yyyymmdd } from '../utils/espn';
import PropTypes from 'prop-types';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function TeamUpcoming({ leagueCode, team, onClose }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!team?.id || !leagueCode) return;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError('');
      try {
        const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; });
  const jsons = await Promise.all(days.map(d => fetchJSON(`${ESPN_SITE_BASE}/${leagueCode}/scoreboard?dates=${yyyymmdd(d)}`, { signal: controller.signal }).catch(()=>null)));
        const out = [];
        for (const data of jsons) {
          const events = data?.events || [];
          for (const ev of events) {
            const comp = ev.competitions?.[0];
            const comps = comp?.competitors || [];
            if (!comps.some(c => c?.team?.id === String(team.id))) continue;
            const status = ev.status?.type?.state;
            if (status !== 'pre') continue;
            const [home, away] = comps.sort((a,b)=> (a.homeAway === 'home' ? -1 : 1));
            out.push({ id: ev.id, date: ev.date, home: { name: home?.team?.displayName || home?.team?.name, logo: home?.team?.logo }, away: { name: away?.team?.displayName || away?.team?.name, logo: away?.team?.logo } });
          }
        }
        setMatches(out);
      } catch (e) {
        if (e?.name !== 'AbortError') setError('Failed to load team fixtures');
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [team?.id, leagueCode]);

  return (
  <div className="rounded-2xl border border-white/10 bg-white/80 dark:bg-gray-900/70 backdrop-blur p-4 md:p-5 text-gray-900 dark:text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {team?.logo && <img src={team.logo} alt={team.name} className="w-6 h-6" />}
          <h3 className="font-anton text-lg truncate">{team?.name || 'Team'}</h3>
        </div>
        <button onClick={onClose} className="text-sm px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700">Close</button>
      </div>

      {loading ? (
        <ul className="space-y-3 md:space-y-4">
          {[...Array(4)].map((_, i) => (
            <li key={i} className="rounded-lg border border-white/10 bg-gray-50 dark:bg-gray-900/60 p-2.5">
              <div className="grid grid-cols-3 items-center gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Skeleton circle width={20} height={20} />
                  <Skeleton width={110} height={14} />
                </div>
                <div className="text-center">
                  <Skeleton width={80} height={28} />
                  <div className="mt-1">
                    <Skeleton width={90} height={10} />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 min-w-0">
                  <Skeleton width={110} height={14} />
                  <Skeleton circle width={20} height={20} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : matches.length === 0 ? (
        <div className="text-sm opacity-80">No upcoming fixtures.</div>
      ) : (
  <ul className="space-y-3 md:space-y-4">
          {matches.map((m) => (
            <li key={m.id} className="rounded-lg border border-white/10 bg-gray-50 dark:bg-gray-900/60 p-2.5">
              <div className="grid grid-cols-3 items-center gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center justify-center rounded-md ring-1 ring-black/10 dark:ring-white/10 overflow-hidden bg-transparent">
                    {m.home.logo && <img src={m.home.logo} alt={m.home.name} className="w-5 h-5 object-contain" />}
                  </span>
                  <span className="text-sm truncate">{m.home.name}</span>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-gray-900/5 dark:bg-white/10 border-white/10 font-anton text-sm">
                    <span>{new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{new Date(m.date).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center justify-end gap-2 min-w-0">
                  <span className="text-sm truncate text-right">{m.away.name}</span>
                  <span className="inline-flex items-center justify-center rounded-md ring-1 ring-black/10 dark:ring-white/10 overflow-hidden bg-transparent">
                    {m.away.logo && <img src={m.away.logo} alt={m.away.name} className="w-5 h-5 object-contain" />}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

TeamUpcoming.propTypes = {
  leagueCode: PropTypes.string.isRequired,
  team: PropTypes.shape({ id: PropTypes.string, name: PropTypes.string, logo: PropTypes.string }),
  onClose: PropTypes.func,
};
