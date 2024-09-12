import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const apiKey = '458f5babb2934ba9afab0d467264ff3a';
const baseURL = 'https://web-production-6fc64.up.railway.app/api.football-data.org/v4/competitions';

const leagueColors = {
  'PL': 'from-purple-600 to-indigo-600',
  'BL1': 'from-red-600 to-yellow-500',
  'SA': 'from-blue-700 to-teal-500',
  'PD': 'from-red-500 to-purple-600',
  'FL1': 'from-blue-600 to-yellow-400',
  'CL': 'from-blue-900 to-indigo-700'
};

const leaguesList = [
  { id: 'PL', name: 'Premier League' },
  { id: 'BL1', name: 'Bundesliga' },
  { id: 'SA', name: 'Serie A' },
  { id: 'PD', name: 'La Liga' },
  { id: 'FL1', name: 'Ligue 1' },
  { id: 'CL', name: 'Champions League' },
];

const LeagueTable = ({ leagueId }) => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counter, setCounter] = useState(45);
  const [currentLeagueId, setCurrentLeagueId] = useState(leagueId);

  useEffect(() => {
    if (leagueId !== currentLeagueId) {
      setCurrentLeagueId(leagueId);
    }
  }, [leagueId]);

  useEffect(() => {
    const fetchStandings = async () => {
      if (!currentLeagueId) return;

      const options = {
        method: 'GET',
        url: `${baseURL}/${currentLeagueId}/standings`,
        headers: {
          'X-Auth-Token': apiKey
        }
      };

      try {
        const response = await axios.request(options);
        setStandings(response.data.standings[0]?.table || []);
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

  return (
    <div className={`min-h-screen p-4 m-2 md:p-8 bg-gradient-to-br ${backgroundClass} text-white rounded-lg`}>
      <h1 className="text-2xl md:text-4xl font-anton text-center mb-4 md:mb-8">League Table</h1>

      {/* Dropdown for small screens */}
      <div className="block md:hidden mb-4">
        <label htmlFor="leagueSelect" className="block text-center mb-2">Select League:</label>
        <select
          id="leagueSelect"
          value={currentLeagueId}
          onChange={(e) => {
            setCurrentLeagueId(e.target.value);
          }}
          className="w-full bg-gray-800 text-white p-2 rounded"
        >
          {leaguesList.map(league => (
            <option key={league.id} value={league.id}>
              {league.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : standings.length === 0 ? (
        <div className="text-center text-lg md:text-2xl text-white font-semibold">
          No Data Available <br />
          Please select a league from the dropdown after <br />
          <span className="text-sm md:text-lg text-red-500"> {counter} seconds</span>
        </div>
      ) : (
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="overflow-x-auto"
      >
        <table className="min-w-full text-left font-roboto text-xs md:text-sm font-light">
          <thead>
            <tr className="bg-indigo-500 font-roboto">
              <th className="py-1 px-2 md:py-2 md:px-4">#</th>
              <th className="py-1 px-2 md:py-2 md:px-4">Team</th>
              <th className="py-1 px-2 md:py-2 md:px-4">P</th>
              <th className="py-1 px-2 md:py-2 md:px-4">W</th>
              <th className="hidden sm:table-cell py-1 px-2 md:py-2 md:px-4">D</th>
              <th className="hidden sm:table-cell py-1 px-2 md:py-2 md:px-4">L</th>
              <th className="hidden sm:table-cell py-1 px-2 md:py-2 md:px-4">GF</th>
              <th className="hidden sm:table-cell py-1 px-2 md:py-2 md:px-4">GA</th>
              <th className="hidden sm:table-cell py-1 px-2 md:py-2 md:px-4">GD</th>
              <th className="py-1 px-2 md:py-2 md:px-4">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, index) => (
              <motion.tr
                key={team.team.id}
                className="relative bg-gray-100/50 font-normal backdrop-blur-lg text-black font-roboto"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <td className="relative py-1 px-2 md:py-2 md:px-4 font-bold">
                  <div
                    className={`absolute left-0 top-0 h-full w-2 ${
                      index < 4 ? 'bg-blue-500' : // Champions League qualification
                      index < 6 ? 'bg-amber-500' : // Europa League qualification
                      index < 7 ? 'bg-green-600' : // Conference League qualification
                      index >= standings.length - 3 ? 'bg-red-500' : // Relegation
                      'bg-transparent'
                    }`}
                  ></div>
                  {team.position}
                </td>
                <td className="py-1 px-2 md:py-2 md:px-4 flex items-center space-x-2">
                  <img
                    src={team.team.crest}
                    alt={team.team.name}
                    className="w-4 h-4 md:w-6 md:h-6"
                  />
                  <span>{team.team.name}</span>
                </td>
                <td className="py-1 px-2 md:py-2 md:px-4">{team.playedGames}</td>
                <td className="py-1 px-2 md:py-2 md:px-4">{team.won}</td>
                <td className="hidden sm:table-cell py-1 px-2 md:py-2 md:px-4">{team.draw}</td>
                <td className="hidden sm:table-cell py-1 px-2 md:py-2 md:px-4">{team.lost}</td>
                <td className="hidden sm:table-cell py-1 px-2 md:py-2 md:px-4">{team.goalsFor}</td>
                <td className="hidden sm:table-cell py-1 px-2 md:py-2 md:px-4">{team.goalsAgainst}</td>
                <td className="hidden sm:table-cell py-1 px-2 md:py-2 md:px-4">{team.goalDifference}</td>
                <td className="py-1 px-2 md:py-2 md:px-4 font-bold">{team.points}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 md:mt-8">
          <h2 className="text-lg md:text-2xl font-bold mb-2 md:mb-4">Key Guide</h2>
          <ul className="space-y-1 md:space-y-2">
            <li className="flex items-center">
              <span className="w-3 h-3 md:w-4 md:h-4 bg-blue-500 inline-block mr-1 md:mr-2"></span>
              <span>Champions League Qualification</span>
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 md:w-4 md:h-4 bg-amber-500 inline-block mr-1 md:mr-2"></span>
              <span>Europa League Qualification</span>
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 md:w-4 md:h-4 bg-green-600 inline-block mr-1 md:mr-2"></span>
              <span>Conference League Qualification</span>
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 md:w-4 md:h-4 bg-red-500 inline-block mr-1 md:mr-2"></span>
              <span>Relegation</span>
            </li>
          </ul>
        </div>
      </motion.div>
    )}
  </div>
);
};

LeagueTable.propTypes = {
  leagueId: PropTypes.string.isRequired,
};

export default LeagueTable;
