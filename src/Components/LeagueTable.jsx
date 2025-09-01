import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Cached normalized standings endpoint
const cachedStandingsBase = '/api/standings';

const leagueColors = {
  'PL': 'from-purple-600 to-indigo-600',
  'BL1': 'from-red-600 to-yellow-500',
  'SA': 'from-blue-700 to-teal-500',
  'PD': 'from-red-500 to-purple-600',
  'FL1': 'from-blue-600 to-yellow-400',
  'CL': 'from-blue-900 to-indigo-700'
};

// Qualifier thresholds per league (approximate typical slots)
const qualifiersConfig = {
  PL: { cl: 4, el: 1, ecl: 1, rel: 3 },
  BL1: { cl: 4, el: 1, ecl: 1, rel: 2 },
  SA: { cl: 4, el: 1, ecl: 1, rel: 3 },
  PD: { cl: 4, el: 1, ecl: 1, rel: 3 },
  FL1: { cl: 3, el: 1, ecl: 1, rel: 2 },
  CL: { top: 2, next: 2 },
};

const leaguesList = [
  { id: 'PL', code: 'eng.1', name: 'Premier League' },
  { id: 'BL1', code: 'ger.1', name: 'Bundesliga' },
  { id: 'SA', code: 'ita.1', name: 'Serie A' },
  { id: 'PD', code: 'esp.1', name: 'La Liga' },
  { id: 'FL1', code: 'fra.1', name: 'Ligue 1' },
  { id: 'CL', code: 'uefa.champions', name: 'Champions League' },
];

const LeagueTable = ({ leagueId, onLeagueChange }) => {
  const navigate = useNavigate();
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counter, setCounter] = useState(45);
  const [currentLeagueId, setCurrentLeagueId] = useState(leagueId);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    if (leagueId !== currentLeagueId) {
      setCurrentLeagueId(leagueId);
      try { localStorage.setItem('league', leagueId); } catch {}
    }
  }, [leagueId]);

  useEffect(() => {
  const fetchStandings = async () => {
      if (!currentLeagueId) return;

      // Use cached normalized standings API
      const leagueCode = leaguesList.find(l => l.id === currentLeagueId)?.code;
      if (!leagueCode) return;
      const options = { method: 'GET', url: `${cachedStandingsBase}/${leagueCode}` };

      try {
        const response = await axios.request(options);
        const entries = response.data?.entries || [];
        setUpdatedAt(response.data?.updatedAt || null);
        setStale(Boolean(response.data?.stale));
        const mapped = entries.map((row) => ({
          position: row.rank ?? '-',
          team: { id: row.team?.id, name: row.team?.name, crest: row.team?.logo },
          playedGames: row.P ?? '-',
          won: row.W ?? '-',
          draw: row.D ?? '-',
          lost: row.L ?? '-',
          goalsFor: row.GF ?? '-',
          goalsAgainst: row.GA ?? '-',
          goalDifference: row.GD ?? '-',
          points: row.Pts ?? '-',
        }));
  setStandings(mapped);
  setLoading(false);
      } catch (error) {
        console.error('Error fetching league standings:', error.message);
        setLoading(false);
      }
    };

    fetchStandings();
  }, [currentLeagueId]);

  useEffect(() => {
    if (counter > 0) {
      const timer = setTimeout(() => setCounter(counter - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [counter]);

  const backgroundClass = leagueColors[currentLeagueId] || 'from-gray-600 to-gray-900';
  const leagueName = useMemo(() => leaguesList.find(l => l.id === currentLeagueId)?.name || 'League', [currentLeagueId]);

  // League selection is controlled externally (LeftAside)

  const handleTeamClick = (teamId) => {
    if (!teamId) return;
    navigate(`/team/${currentLeagueId}/${teamId}`);
  };

  return (
    <div className={`min-h-screen p-2 md:p-4 text-white`}>
      {/* Header */}
      <div className={`rounded-2xl overflow-hidden mb-3 md:mb-6 shadow-sm border border-white/10`}>
        <div className={`bg-gradient-to-r ${backgroundClass} px-4 md:px-6 py-4 md:py-6`}> 
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-anton tracking-wide">{leagueName}</h1>
              <p className="text-xs md:text-sm text-white/80">Standings • {new Date().toLocaleDateString()}</p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-[11px] md:text-xs text-white/90">
              {updatedAt && (
                <span className="px-2 py-1 rounded-md bg-white/20 border border-white/30">Updated {new Date(updatedAt).toLocaleTimeString()}</span>
              )}
              {stale && <span className="px-2 py-1 rounded-md bg-amber-400/20 border border-amber-300/40">cached</span>}
            </div>
          </div>
        </div>
        {/* League chooser removed; controlled via LeftAside */}
      </div>

      {/* Mobile-only league selector */}
      <div className="md:hidden mb-3">
        <label htmlFor="mobile-league" className="sr-only">Select league</label>
        <div className="relative">
          <select
            id="mobile-league"
            value={currentLeagueId}
            onChange={(e) => {
              const id = e.target.value;
              setCurrentLeagueId(id);
              setLoading(true);
              try { localStorage.setItem('league', id); } catch {}
              if (typeof onLeagueChange === 'function') onLeagueChange(id);
            }}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 backdrop-blur px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {leaguesList.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur p-3 md:p-4">
          <div className="mb-2 h-8">
            <Skeleton height={32} width={160} baseColor="#e5e7eb" highlightColor="#f3f4f6" enableAnimation />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[2rem_minmax(0,1fr)_2rem_2rem_0_0_0_0_0_3rem] sm:grid-cols-[2rem_minmax(0,1fr)_2rem_2rem_2rem_2rem_2rem_2rem_2rem_3rem] gap-2 items-center">
                <Skeleton height={20} />
                <div className="flex items-center gap-2">
                  <Skeleton circle height={20} width={20} />
                  <Skeleton height={16} width={140} />
                </div>
                {Array.from({ length: 7 }).map((__, j) => (
                  <Skeleton key={j} height={16} />
                ))}
                <Skeleton height={22} />
              </div>
            ))}
          </div>
        </div>
      ) : standings.length === 0 ? (
        <div className="text-center text-lg md:text-2xl text-gray-900 dark:text-white font-semibold">
          No Data Available
        </div>
      ) : (
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="overflow-x-auto rounded-xl border border-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur p-2 md:p-4"
      >
        <table className="min-w-full text-left font-roboto text-xs md:text-sm font-light text-gray-900 dark:text-gray-100">
          <thead>
            <tr className="bg-gray-100/70 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 pl-5 md:py-3 md:pl-6 pr-2 md:pr-4">#</th>
              <th className="py-2 px-2 md:py-3 md:px-4">Team</th>
              <th className="py-2 px-2 md:py-3 md:px-4">P</th>
              <th className="py-2 px-2 md:py-3 md:px-4">W</th>
              <th className="hidden sm:table-cell py-2 px-2 md:py-3 md:px-4">D</th>
              <th className="hidden sm:table-cell py-2 px-2 md:py-3 md:px-4">L</th>
              <th className="hidden sm:table-cell py-2 px-2 md:py-3 md:px-4">GF</th>
              <th className="hidden sm:table-cell py-2 px-2 md:py-3 md:px-4">GA</th>
              <th className="hidden sm:table-cell py-2 px-2 md:py-3 md:px-4">GD</th>
              <th className="py-2 px-2 md:py-3 md:px-4">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, index) => (
              <motion.tr
                key={team.team.id}
                className="relative bg-white/70 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer"
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                onClick={() => handleTeamClick(team.team.id)}
                title={`Open ${team.team.name}`}
              >
                <td className="relative py-2 pl-5 pr-2 md:py-3 md:pl-6 md:pr-4 font-semibold text-gray-900 dark:text-gray-100">
                  {(() => {
                    const cfg = qualifiersConfig[currentLeagueId] || qualifiersConfig.PL;
                    let cls = 'bg-transparent';
                    if (currentLeagueId === 'CL') {
                      if (index < cfg.top) cls = 'bg-blue-500';
                      else if (index < cfg.top + cfg.next) cls = 'bg-amber-500';
                    } else {
                      const totalTop = cfg.cl + cfg.el + cfg.ecl;
                      if (index < cfg.cl) cls = 'bg-blue-500';
                      else if (index < cfg.cl + cfg.el) cls = 'bg-amber-500';
                      else if (index < totalTop) cls = 'bg-green-600';
                      else if (index >= Math.max(standings.length - cfg.rel, 0)) cls = 'bg-red-500';
                    }
                    return <div className={`absolute left-0 top-0 h-full w-1.5 ${cls}`}></div>;
                  })()}
                  {team.position}
                </td>
                <td className="py-2 px-2 md:py-3 md:px-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center rounded-md ring-1 ring-black/10 dark:ring-white/10 overflow-hidden bg-white dark:bg-gray-800">
                      <img
                        src={team.team.crest}
                        alt={team.team.name}
                        className="w-5 h-5 md:w-6 md:h-6 object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    </span>
                    <span className="text-gray-900 dark:text-gray-100 truncate max-w-[14ch] sm:max-w-none">{team.team.name}</span>
                  </div>
                </td>
                <td className="py-2 px-2 md:py-3 md:px-4">{team.playedGames ?? '-'}</td>
                <td className="py-2 px-2 md:py-3 md:px-4">{team.won ?? '-'}</td>
                <td className="hidden sm:table-cell py-2 px-2 md:py-3 md:px-4">{team.draw ?? '-'}</td>
                <td className="hidden sm:table-cell py-2 px-2 md:py-3 md:px-4">{team.lost ?? '-'}</td>
                <td className="hidden sm:table-cell py-2 px-2 md:py-3 md:px-4">{team.goalsFor ?? '-'}</td>
                <td className="hidden sm:table-cell py-2 px-2 md:py-3 md:px-4">{team.goalsAgainst ?? '-'}</td>
                <td className="hidden sm:table-cell py-2 px-2 md:py-3 md:px-4">{team.goalDifference ?? '-'}</td>
                <td className="py-2 px-2 md:py-3 md:px-4 font-bold">
                  <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-gray-900 text-white dark:bg-white dark:text-gray-900 min-w-[2.25rem]">
                    {team.points ?? '-'}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 md:mt-8">
          <h2 className="text-lg md:text-2xl font-bold mb-2 md:mb-4">Legend</h2>
          {currentLeagueId === 'CL' ? (
            <ul className="space-y-1.5">
              <li className="flex items-center text-xs md:text-sm">
                <span className="w-2.5 h-2.5 rounded bg-blue-500 mr-2"></span>
                <span className="text-gray-800 dark:text-gray-200">Top spots</span>
              </li>
              <li className="flex items-center text-xs md:text-sm">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 mr-2"></span>
                <span className="text-gray-800 dark:text-gray-200">Runners-up</span>
              </li>
            </ul>
          ) : (
            <ul className="space-y-1.5">
              <li className="flex items-center text-xs md:text-sm">
                <span className="w-2.5 h-2.5 rounded bg-blue-500 mr-2"></span>
                <span className="text-gray-800 dark:text-gray-200">Champions League</span>
              </li>
              <li className="flex items-center text-xs md:text-sm">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 mr-2"></span>
                <span className="text-gray-800 dark:text-gray-200">Europa League</span>
              </li>
              <li className="flex items-center text-xs md:text-sm">
                <span className="w-2.5 h-2.5 rounded bg-green-600 mr-2"></span>
                <span className="text-gray-800 dark:text-gray-200">Conference League</span>
              </li>
              <li className="flex items-center text-xs md:text-sm">
                <span className="w-2.5 h-2.5 rounded bg-red-500 mr-2"></span>
                <span className="text-gray-800 dark:text-gray-200">Relegation</span>
              </li>
            </ul>
          )}
        </div>
      </motion.div>
    )}
  </div>
);
};

LeagueTable.propTypes = {
  leagueId: PropTypes.string.isRequired,
  onLeagueChange: PropTypes.func,
};

export default LeagueTable;
