import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi';

const leagues = [
  { id: 'PL', code: 'eng.1', name: 'Premier League' },
  { id: 'BL1', code: 'ger.1', name: 'Bundesliga' },
  { id: 'SA', code: 'ita.1', name: 'Serie A' },
  { id: 'PD', code: 'esp.1', name: 'La Liga' },
  { id: 'FL1', code: 'fra.1', name: 'Ligue 1' },
  { id: 'CL', code: 'uefa.champions', name: 'Champions League' },
];

export default function LeagueUpcoming({ leagueId, onTeamClick }) {
  const [selected, setSelected] = useState(leagueId || 'PL');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0,10)); // 'YYYY-MM-DD'

  useEffect(() => { if (leagueId) setSelected(leagueId); }, [leagueId]);

  const load = async (signal) => {
    setError('');
    setLoading(true);
    const code = leagues.find((l) => l.id === selected)?.code;
    if (!code) return;
    try {
      // Fetch exact date from ESPN scoreboard and map
      const yyyymmdd = (selectedDate || new Date().toISOString().slice(0,10)).replace(/-/g, '');
      const resp = await axios.get(`/api/espn/soccer/${code}/scoreboard?dates=${yyyymmdd}`, { signal });
      const events = resp.data?.events || [];
      const mapped = events
        .map((ev) => {
          const [home, away] = ev.competitions?.[0]?.competitors?.sort((a,b)=> (a.homeAway === 'home' ? -1 : 1)) || [];
          const state = ev.status?.type?.state; // 'pre','in','post'
          return {
            id: ev.id,
            date: ev.date,
            status: state === 'pre' ? 'SCHEDULED' : state === 'in' ? 'LIVE' : 'FINISHED',
            home: { id: home?.team?.id, name: home?.team?.displayName || home?.team?.name, short: home?.team?.shortDisplayName || home?.team?.abbreviation, logo: home?.team?.logo },
            away: { id: away?.team?.id, name: away?.team?.displayName || away?.team?.name, short: away?.team?.shortDisplayName || away?.team?.abbreviation, logo: away?.team?.logo },
          };
        })
        .filter(m => m.status === 'SCHEDULED'); // Upcoming-only
      setMatches(mapped);
    } catch (e) {
      if (!axios.isCancel(e)) setError('Failed to load upcoming matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, selectedDate]);

  const onSelect = (id) => {
    setSelected(id);
    try { localStorage.setItem('league', id); } catch {}
  };

  const dayPresets = [
    { label: 'Today', value: 1 },
    { label: '3d', value: 3 },
    { label: 'Week', value: 7 },
    { label: '2W', value: 14 },
  ];

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

  // Group matches by date for cleaner sections
  const grouped = useMemo(() => {
    const groups = {};
    for (const m of matches || []) {
      const d = new Date(m.date);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }
    // sort groups by date asc and each group by time asc
    return Object.entries(groups)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([k, arr]) => ({
        dateKey: k,
        label: new Date(k).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
        items: arr.sort((a, b) => new Date(a.date) - new Date(b.date)),
      }));
  }, [matches]);

  return (
  <div className="rounded-2xl border border-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur p-4 md:p-5 lg:p-6 text-gray-900 dark:text-white">
      <div className={`rounded-xl border border-white/10 bg-gradient-to-r ${accent} text-white p-3.5 md:p-4 mb-3 md:mb-4 shadow-sm`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-anton text-lg md:text-xl">Upcoming</h2>
              <span className="text-xs md:text-sm opacity-90">{leagues.find(l=>l.id===selected)?.name}</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center">
            <div className="inline-flex items-center gap-0.5 rounded-xl bg-white/10 ring-1 ring-white/25 p-0.5">
              {leagues.map((l) => (
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
  <DateControls selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
      </div>

      {loading ? (
        <ul className="space-y-3 md:space-y-4">
          {[...Array(5)].map((_, i) => (
            <li key={i} className="rounded-xl border border-white/10 bg-gray-50 dark:bg-gray-900/60 p-2.5">
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
        <div className="text-sm opacity-80">No upcoming fixtures in this window.</div>
      ) : (
        <div className="space-y-5">
          {grouped.map((g, gi) => (
            <div key={g.dateKey}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs md:text-sm px-2 py-0.5 rounded-full border border-white/10 bg-gray-900/5 dark:bg-white/10 text-gray-700 dark:text-gray-200">{g.label}</span>
                <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
              </div>
              <ul className="space-y-3 md:space-y-4">
                {g.items.map((m, i) => (
                  <motion.li
                    key={m.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: (gi * 0.02) + (i * 0.02) }}
                    whileHover={{ y: -2 }}
                    className="rounded-xl border border-white/10 bg-gray-50 dark:bg-gray-900/60 p-3 md:p-3.5 lg:p-4 shadow-sm"
                  >
                    <div className="grid grid-cols-3 items-center gap-2 md:gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex items-center justify-center rounded-md ring-1 ring-black/10 dark:ring-white/10 overflow-hidden bg-white dark:bg-gray-800">
                          {m.home.logo && <img src={m.home.logo} alt={m.home.name} className="w-6 h-6 object-contain" />}
                        </span>
                        <button onClick={() => onTeamClick?.(m.home)} className="text-sm truncate text-left hover:underline" title={m.home.name}>
                          <span className="sm:hidden">{m.home.short || m.home.name}</span>
                          <span className="hidden sm:inline">{m.home.name}</span>
                        </button>
                      </div>
                      <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-gray-900/5 dark:bg-white/10 border-white/10 font-anton text-sm">
                          <span>{new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 min-w-0">
                        <button onClick={() => onTeamClick?.(m.away)} className="text-sm truncate text-right hover:underline" title={m.away.name}>
                          <span className="sm:hidden">{m.away.short || m.away.name}</span>
                          <span className="hidden sm:inline">{m.away.name}</span>
                        </button>
                        <span className="inline-flex items-center justify-center rounded-md ring-1 ring-black/10 dark:ring-white/10 overflow-hidden bg-white dark:bg-gray-800">
                          {m.away.logo && <img src={m.away.logo} alt={m.away.name} className="w-6 h-6 object-contain" />}
                        </span>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Inline subcomponent for cleaner arrows/date UX
function DateControls({ selectedDate, setSelectedDate }) {
  const inputRef = useRef(null);
  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      el.showPicker();
    } else {
      el.focus();
      el.click();
    }
  };
  const fmt = new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
      <div className="inline-flex items-center gap-2">
        <button
          onClick={() => {
            const base = selectedDate ? new Date(selectedDate) : new Date();
            base.setDate(base.getDate() - 1);
            setSelectedDate(base.toISOString().slice(0,10));
          }}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 ring-1 ring-white/25 hover:bg-white/20"
          aria-label="Previous day"
        >
          <FiChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={openPicker} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 ring-1 ring-white/25 hover:bg-white/20 text-sm md:text-base font-medium">
          <FiCalendar className="w-4 h-4" />
          <span>{fmt}</span>
        </button>
        <button
          onClick={() => {
            const base = selectedDate ? new Date(selectedDate) : new Date();
            base.setDate(base.getDate() + 1);
            setSelectedDate(base.toISOString().slice(0,10));
          }}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 ring-1 ring-white/25 hover:bg-white/20"
          aria-label="Next day"
        >
          <FiChevronRight className="w-4 h-4" />
        </button>
        <button onClick={() => setSelectedDate(new Date().toISOString().slice(0,10))} className="ml-1 text-xs underline">
          Today
        </button>
        <input
          ref={inputRef}
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value || new Date().toISOString().slice(0,10))}
          className="absolute opacity-0 pointer-events-none w-0 h-0"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
      <div className="flex-1" />
    </div>
  );
}

DateControls.propTypes = {
  selectedDate: PropTypes.string.isRequired,
  setSelectedDate: PropTypes.func.isRequired,
};

LeagueUpcoming.propTypes = {
  leagueId: PropTypes.string,
  onTeamClick: PropTypes.func,
};
