import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { motion } from 'framer-motion';
import { FiActivity } from 'react-icons/fi';

const leagueMap = [
  { id: 'PL', code: 'eng.1', name: 'Premier League' },
  { id: 'BL1', code: 'ger.1', name: 'Bundesliga' },
  { id: 'SA', code: 'ita.1', name: 'Serie A' },
  { id: 'PD', code: 'esp.1', name: 'La Liga' },
  { id: 'FL1', code: 'fra.1', name: 'Ligue 1' },
  { id: 'CL', code: 'uefa.champions', name: 'Champions League' },
];

const espnBase = '/api/espn/soccer';

export default function Live({ leagueId }) {
  const [selected, setSelected] = useState(leagueId || 'PL');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (leagueId && leagueId !== selected) setSelected(leagueId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId]);

  const league = useMemo(() => leagueMap.find((l) => l.id === selected) || leagueMap[0], [selected]);

  // Accent gradient per league for a modern header look
  const leagueAccents = {
    PL: 'from-purple-600 to-indigo-600',
    BL1: 'from-red-600 to-yellow-500',
    SA: 'from-blue-700 to-teal-500',
    PD: 'from-red-500 to-purple-600',
    FL1: 'from-blue-600 to-yellow-400',
    CL: 'from-blue-900 to-indigo-700',
  };
  const accent = leagueAccents[selected] || 'from-blue-600 to-cyan-600';

  const fetchLive = async (signal) => {
    setError('');
    try {
    const { data } = await axios.get(`${espnBase}/${league.code}/scoreboard`, { signal });
      const live = (data?.events || []).filter((ev) => ev?.status?.type?.state === 'in').map((ev) => {
        const [home, away] = ev.competitions?.[0]?.competitors?.sort((a,b)=> (a.homeAway === 'home' ? -1 : 1)) || [];
        return {
          id: ev.id,
          league: league.name,
          minute: ev.status?.type?.shortDetail || 'Live',
      home: { name: home?.team?.displayName || home?.team?.name, short: home?.team?.shortDisplayName || home?.team?.abbreviation, logo: home?.team?.logo, score: Number(home?.score ?? 0) },
      away: { name: away?.team?.displayName || away?.team?.name, short: away?.team?.shortDisplayName || away?.team?.abbreviation, logo: away?.team?.logo, score: Number(away?.score ?? 0) },
        };
      });
      setEvents(live);
    } catch (e) {
      if (!axios.isCancel(e)) setError('Failed to load live scores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchLive(controller.signal);
    const id = setInterval(() => fetchLive(controller.signal), 45000);
    return () => { clearInterval(id); controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league.code]);

  const onSelect = (id) => {
    setSelected(id);
    try { localStorage.setItem('league', id); } catch {}
  };

  return (
  <div className="rounded-2xl border border-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur p-3 sm:p-4 md:p-5 lg:p-6 text-gray-900 dark:text-white">
      <div className={`rounded-xl border border-white/10 bg-gradient-to-r ${accent} text-white p-3.5 md:p-4 mb-3 md:mb-4 shadow-sm`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <FiActivity className="w-5 h-5" />
            <h2 className="font-anton text-lg md:text-xl">Live</h2>
            <span className="text-xs md:text-sm opacity-90">{league.name}</span>
          </div>
          <div className="hidden sm:flex items-center">
            <div className="inline-flex items-center gap-0.5 rounded-xl bg-white/10 ring-1 ring-white/25 p-0.5">
              {leagueMap.map((l) => (
                <button
                  key={l.id}
                  onClick={() => onSelect(l.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${selected === l.id ? 'bg-white text-gray-900 shadow-sm' : 'text-white/90 hover:text-white'}`}
                  title={l.name}
                >
                  {l.id}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-3 md:space-y-4">
          {[...Array(4)].map((_, i) => (
            <li key={i} className="rounded-xl border border-white/10 bg-gray-50 dark:bg-gray-900/60 p-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton circle width={10} height={10} />
                  <Skeleton width={60} height={12} />
                </div>
                <Skeleton width={80} height={12} />
              </div>
              <div className="mt-2 grid grid-cols-3 items-center gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Skeleton circle width={20} height={20} />
                  <Skeleton width={100} height={14} />
                </div>
                <div className="text-center">
                  <Skeleton width={80} height={28} />
                </div>
                <div className="flex items-center justify-end gap-2 min-w-0">
                  <Skeleton width={100} height={14} />
                  <Skeleton circle width={20} height={20} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : events.length === 0 ? (
        <div className="text-sm opacity-80">No live matches right now.</div>
      ) : (
        <ul className="space-y-3 md:space-y-4">
          {events.map((m, i) => (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
              className="rounded-xl border border-white/10 bg-gray-50 dark:bg-gray-900/60 p-2.5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative inline-flex">
                    <span className="absolute inline-flex w-2.5 h-2.5 bg-red-500 rounded-full opacity-75 animate-ping"></span>
                    <span className="relative inline-flex w-2.5 h-2.5 bg-red-600 rounded-full"></span>
                  </span>
                  <span className="text-[11px] sm:text-xs text-red-100 font-semibold bg-red-600/20 px-2 py-0.5 rounded-full ring-1 ring-red-500/30">Live</span>
                </div>
                <div className="text-[11px] sm:text-xs opacity-80">{m.minute}</div>
              </div>
              <div className="mt-2 grid grid-cols-3 items-center gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center justify-center rounded-md ring-1 ring-black/10 dark:ring-white/10 overflow-hidden bg-white dark:bg-gray-800">
                    {m.home.logo && <img src={m.home.logo} alt={m.home.name} className="w-5 h-5 object-contain" />}
                  </span>
                  <span className="text-sm truncate font-anton" title={m.home.name}>
                    <span className="sm:hidden">{m.home.short || m.home.name}</span>
                    <span className="hidden sm:inline">{m.home.name}</span>
                  </span>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-xl border bg-red-500/10 border-red-500/40 text-red-700 dark:text-red-400 font-anton">
                    <span>{m.home.score}</span>
                    <span className="opacity-70">—</span>
                    <span>{m.away.score}</span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 min-w-0">
                  <span className="text-sm truncate font-anton text-right" title={m.away.name}>
                    <span className="sm:hidden">{m.away.short || m.away.name}</span>
                    <span className="hidden sm:inline">{m.away.name}</span>
                  </span>
                  <span className="inline-flex items-center justify-center rounded-md ring-1 ring-black/10 dark:ring-white/10 overflow-hidden bg-white dark:bg-gray-800">
                    {m.away.logo && <img src={m.away.logo} alt={m.away.name} className="w-5 h-5 object-contain" />}
                  </span>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

Live.propTypes = {
  leagueId: PropTypes.string,
};
