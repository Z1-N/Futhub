import { useEffect, useState } from 'react';
import { ESPN_SITE_BASE, fetchJSON, yyyymmdd } from '../utils/espn';
import { motion } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// API key is now injected server-side via proxy; do not store it here.
const leagueColors = {
  'Premier League': 'from-purple-600 to-indigo-600',
  'Bundesliga': 'from-red-600 to-yellow-500',
  'Serie A': 'from-blue-700 to-teal-500',
  'La Liga': 'from-red-500 to-purple-600',
  'Ligue 1': 'from-blue-600 to-yellow-400',
  'Champions League': 'from-blue-900 to-indigo-700',
};

const leagues = [
  { code: 'eng.1', name: 'Premier League', crestId: 'PL' },
  { code: 'ger.1', name: 'Bundesliga', crestId: 'BL1' },
  { code: 'ita.1', name: 'Serie A', crestId: 'SA' },
  { code: 'esp.1', name: 'La Liga', crestId: 'PD' },
  { code: 'fra.1', name: 'Ligue 1', crestId: 'FL1' },
];
// ESPN proxy base
const espnBase = ESPN_SITE_BASE;


const MainMatchResult = () => {
  const [leagueMatches, setLeagueMatches] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchLeagueMatches = async (league, isMounted) => {
  // ESPN scoreboard provides events with competitors and status
  const url = `${espnBase}/${league.code}/scoreboard?dates=${yyyymmdd()}`;

    try {
      const data = await fetchJSON(url);
      const events = data?.events || [];

  const filteredMatches = events.map((ev) => {
        const [home, away] = ev.competitions?.[0]?.competitors?.sort((a,b)=> (a.homeAway === 'home' ? -1 : 1)) || [];
        const statusType = ev.status?.type?.state; // 'pre','in','post'
        const statusDetail = ev.status?.type?.shortDetail || '';
        return {
          id: ev.id,
          utcDate: ev.date,
          status: statusType === 'in' ? 'LIVE' : statusType === 'post' ? 'FINISHED' : 'SCHEDULED',
          score: {
            fullTime: {
              home: Number(home?.score ?? 0),
              away: Number(away?.score ?? 0),
            },
          },
          homeTeam: {
    name: home?.team?.displayName || home?.team?.name,
    short: home?.team?.shortDisplayName || home?.team?.abbreviation || home?.team?.displayName || home?.team?.name,
            crest: home?.team?.logo || '',
          },
          awayTeam: {
    name: away?.team?.displayName || away?.team?.name,
    short: away?.team?.shortDisplayName || away?.team?.abbreviation || away?.team?.displayName || away?.team?.name,
            crest: away?.team?.logo || '',
          },
          statusDetail,
        };
      });

      if (isMounted) {
        return { leagueName: league.name, matches: filteredMatches };
      }
    } catch (error) {
      console.error(`Error fetching matches for ${league.name}:`, error.message);
      if (isMounted) {
        return { leagueName: league.name, matches: [], failed: true };
      }
    }
  };

  useEffect(() => {
    let isMounted = true; // Track if component is mounted
    const maxRetries = 3; // Max number of retries for failed leagues

    const fetchAllMatches = async () => {
      const allMatches = {};
      let failedLeagues = [...leagues];

      for (let retry = 1; retry <= maxRetries && failedLeagues.length > 0; retry++) {
        const results = await Promise.all(
          failedLeagues.map((league) => fetchLeagueMatches(league, isMounted))
        );

        results.forEach((result) => {
          if (result && !result.failed) {
            allMatches[result.leagueName] = result.matches;
          }
        });

        // Update failed leagues for next retry
        failedLeagues = results
          .filter((result) => result && result.failed)
          .map((result) => leagues.find((l) => l.name === result.leagueName));
      }

      if (isMounted) {
        setLeagueMatches(allMatches);
        setLoading(false);
      }
    };

    fetchAllMatches();

    return () => {
      isMounted = false; // Clean up flag on unmount
    };
  }, []);

  return (
    <div className="main-section p-3 sm:p-4 rounded-lg min-h-screen">
      <h1 className="text-2xl sm:text-3xl text-gray-900 dark:text-white text-center font-anton mb-4 sm:mb-6">Latest Matches</h1>
      {loading ? (
        <>
          <div className="text-center text-gray-500">Fetching matches...</div>
          <ul className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
            {[...Array(6)].map((_, index) => (
              <li key={index} className="p-4 sm:p-6 rounded-2xl border border-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur shadow-sm">
                <div className="grid grid-cols-3 items-center gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Skeleton circle width={32} height={32} />
                    <div className="flex-1 min-w-0">
                      <Skeleton height={14} width={120} />
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <Skeleton height={28} width={80} />
                    <div className="mt-1">
                      <Skeleton height={10} width={90} />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 min-w-0">
                    <div className="flex-1 min-w-0 text-right">
                      <Skeleton height={14} width={120} />
                    </div>
                    <Skeleton circle width={32} height={32} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : Object.keys(leagueMatches).length > 0 ? (
        Object.keys(leagueMatches).map((league) => (
          <div key={league} className="mb-5 sm:mb-8">
            <h2
              className={`text-lg sm:text-xl font-anton text-white p-2 sm:p-4 rounded-md mb-2 sm:mb-4 bg-gradient-to-r ${leagueColors[league]}`}
            >
              <img
                src={`https://crests.football-data.org/${leagues.find((l) => l.name === league)?.crestId}.png`}
                alt={league}
                className="w-10 h-10 sm:w-12 sm:h-12 px-1 inline-block mr-2"
              />
              {league}
            </h2>

            <ul className="space-y-2 sm:space-y-4">
              {leagueMatches[league].map((match, index) => (
                <motion.li
                  key={index}
                  className={`p-4 sm:p-6 rounded-2xl border border-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur shadow-sm`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="grid grid-cols-3 items-center gap-3">
                    {/* Home */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex items-center justify-center rounded-lg ring-1 ring-black/10 dark:ring-white/10 overflow-hidden bg-transparent">
                        {match.homeTeam.crest && (
                          <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                        )}
                      </span>
                      <span className="font-anton text-sm sm:text-base text-gray-900 dark:text-white truncate" title={match.homeTeam.name}>
                        <span className="sm:hidden">{match.homeTeam.short || match.homeTeam.name}</span>
                        <span className="hidden sm:inline">{match.homeTeam.name}</span>
                      </span>
                    </div>

                    {/* Center score pill */}
                    <div className="flex flex-col items-center justify-center">
                      {match.status === 'LIVE' && (
                        <div className="mb-1 inline-flex items-center gap-1 text-red-600 font-semibold text-[11px] sm:text-xs">
                          <span className="relative inline-flex">
                            <span className="absolute inline-flex w-2.5 h-2.5 bg-red-500 rounded-full opacity-75 animate-ping"></span>
                            <span className="relative inline-flex w-2.5 h-2.5 bg-red-600 rounded-full"></span>
                          </span>
                          LIVE
                          <span className="text-gray-500 dark:text-gray-400 font-roboto">{match.statusDetail}</span>
                        </div>
                      )}
                      {match.status === 'FINISHED' && (
                        <div className="mb-1 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] sm:text-xs">FT</div>
                      )}
                      <div
                        className={`inline-flex items-center gap-3 px-3 py-1.5 rounded-xl border text-sm sm:text-base font-anton ${
                          match.status === 'LIVE'
                            ? 'bg-red-500/10 border-red-500/40 text-red-700 dark:text-red-400'
                            : match.status === 'FINISHED'
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-gray-900/5 dark:bg-white/10 border-white/10 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {match.status === 'SCHEDULED' ? (
                          <span className="font-roboto text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            {new Date(match.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <>
                            <span>{match.score.fullTime.home}</span>
                            <span className="opacity-70">—</span>
                            <span>{match.score.fullTime.away}</span>
                          </>
                        )}
                      </div>
                      {match.status === 'SCHEDULED' && (
                        <div className="mt-1 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-roboto">
                          {new Date(match.utcDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Away */}
                    <div className="flex items-center justify-end gap-2 min-w-0">
                      <span className="font-anton text-sm sm:text-base text-gray-900 dark:text-white truncate text-right" title={match.awayTeam.name}>
                        <span className="sm:hidden">{match.awayTeam.short || match.awayTeam.name}</span>
                        <span className="hidden sm:inline">{match.awayTeam.name}</span>
                      </span>
                      <span className="inline-flex items-center justify-center rounded-lg ring-1 ring-black/10 dark:ring-white/10 overflow-hidden bg-transparent">
                        {match.awayTeam.crest && (
                          <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                        )}
                      </span>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <div className="text-center text-gray-600 dark:text-gray-400">No matches found</div>
      )}
    </div>
  );
};

export default MainMatchResult;
