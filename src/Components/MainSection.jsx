import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const apiKey = '458f5babb2934ba9afab0d467264ff3a';
const leagueColors = {
  'Premier League': 'from-purple-600 to-indigo-600',
  'Bundesliga': 'from-red-600 to-yellow-500',
  'Serie A': 'from-blue-700 to-teal-500',
  'La Liga': 'from-red-500 to-purple-600',
  'Ligue 1': 'from-blue-600 to-yellow-400',
  'Champions League': 'from-blue-900 to-indigo-700',
};

const leagues = [
  { id: 'PL', name: 'Premier League' },
  { id: 'BL1', name: 'Bundesliga' },
  { id: 'SA', name: 'Serie A' },
  { id: 'PD', name: 'La Liga' },
  { id: 'FL1', name: 'Ligue 1' },
  { id: 'CL', name: 'Champions League' },
];
const baseURL = 'https://web-production-6fc64.up.railway.app/api.football-data.org/v4/competitions';

const MainMatchResult = () => {
  const [leagueMatches, setLeagueMatches] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchMatchesWithRetry = async (options, retries = 3, delay = 1000) => {
    const controller = new AbortController();
    const { signal } = controller;
    try {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const response = await axios.request({ ...options, signal });
          return response.data;
        } catch (error) {
          if (axios.isCancel(error)) {
            throw new Error('Request cancelled');
          }
          if (attempt === retries) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
      }
    } finally {
      controller.abort();
    }
  };

  const fetchLeagueMatches = async (league, isMounted) => {
    const options = {
      method: 'GET',
      url: `${baseURL}/${league.id}/matches`,
      headers: {
        'X-Auth-Token': apiKey,
      },
      params: {
        status: 'FINISHED,LIVE,SCHEDULED',
      },
    };

    try {
      const data = await fetchMatchesWithRetry(options);
      console.log(`Fetched matches for ${league.name}:`, data.matches);

      const leagueMatchday = data.matches.length > 0 ? data.matches[0].season.currentMatchday : null;
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const filteredMatches = data.matches.filter((match) => {
        const matchDate = new Date(match.utcDate);
        return (
          match.homeTeam.name &&
          match.awayTeam.name &&
          ((match.status === 'FINISHED' && matchDate >= twoDaysAgo) ||
            match.status === 'LIVE' ||
            (['TIMED', 'SCHEDULED'].includes(match.status) && match.matchday === leagueMatchday))
        );
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
    <div className="main-section p-4 bg-slate-800 rounded-lg min-h-screen">
      <h1 className="text-2xl sm:text-3xl text-white text-center font-anton mb-4 sm:mb-6">Upcoming Match Schedule</h1>
      {loading ? (
        <>
          <div className="text-center text-gray-500">Fetching matches...</div>
          {[...Array(9)].map((_, index) => (
            <div key={index} className="bg-gray-700 animate-pulse my-2 sm:my-4 h-10 sm:h-12 rounded-md"></div>
          ))}
        </>
      ) : Object.keys(leagueMatches).length > 0 ? (
        Object.keys(leagueMatches).map((league) => (
          <div key={league} className="mb-6 sm:mb-8">
            <h2
              className={`text-lg sm:text-xl font-anton text-white p-2 sm:p-4 rounded-md mb-2 sm:mb-4 bg-gradient-to-r ${leagueColors[league]}`}
            >
              <img
                src={`https://crests.football-data.org/${leagues.find((l) => l.name === league).id}.png`}
                alt={league}
                className="w-10 h-10 sm:w-12 sm:h-12 px-1 inline-block mr-2"
              />
              {league}
            </h2>

            <ul className="space-y-2 sm:space-y-4">
              {leagueMatches[league].map((match, index) => (
                <motion.li
                  key={index}
                  className={`p-4 sm:p-6 rounded-lg shadow-md flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r ${leagueColors[league]}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex items-center font-anton space-x-2 sm:space-x-4" style={{ flexBasis: '35%' }}>
                    <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="w-8 h-8 sm:w-10 sm:h-10" />
                    <span className="text-sm sm:text-lg text-white">{match.homeTeam.name}</span>
                  </div>
                  <div className="text-center my-2 sm:my-0" style={{ flexBasis: '30%' }}>
                    <div className="text-xs sm:text-sm font-roboto">
                      {match.status === 'LIVE' ? (
                        <div className="flex items-center font-roboto space-x-2">
                          <div className="relative w-3 h-3">
                            <div className="absolute inline-flex w-full h-full bg-red-500 rounded-full opacity-75 animate-ping"></div>
                            <div className="relative inline-flex w-3 h-3 bg-red-600 rounded-full"></div>
                          </div>
                          <span className="text-red-600 font-semibold">Live</span>
                          {match.score.fullTime.home} - {match.score.fullTime.away}
                        </div>
                      ) : match.status === 'FINISHED' ? (
                        <span className="text-green-500 font-roboto">FT {match.score.fullTime.home} - {match.score.fullTime.away}</span>
                      ) : (
                        <div className="bg-white/30 backdrop-blur-md backdrop-filter font-anton text-xs sm:text-sm mx-4 sm:mx-8 px-4 sm:px-6 py-0.5 rounded-xl">
                          <span>
                            {new Date(match.utcDate).toLocaleDateString()}
                            <br />
                            {new Date(match.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center font-anton justify-end space-x-2 sm:space-x-4" style={{ flexBasis: '35%' }}>
                    <span className="text-sm sm:text-lg text-white">{match.awayTeam.name}</span>
                    <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="w-8 h-8 sm:w-10 sm:h-10" />
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500">No matches found</div>
      )}
    </div>
  );
};

export default MainMatchResult;
