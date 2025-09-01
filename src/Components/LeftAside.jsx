import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const leagues = [
  {id: 'CL', name: 'Champions League', icon: <img alt="" loading="lazy" width="16" height="16" decoding="async" data-nimg="1" src="https://www.fotmob.com/_next/image?url=https%3A%2F%2Fimages.fotmob.com%2Fimage_resources%2Flogo%2Fleaguelogo%2Fdark%2F42.png&amp;w=32&amp;q=75" /> },
  { id: 'PL', name: 'Premier League', icon: <img alt="" loading="lazy" width="16" height="16" decoding="async" data-nimg="1" src="https://www.fotmob.com/_next/image?url=https%3A%2F%2Fimages.fotmob.com%2Fimage_resources%2Flogo%2Fleaguelogo%2Fdark%2F47.png&amp;w=32&amp;q=75" /> },
  { id: 'PD', name: 'La Liga', icon: <img alt="" loading="lazy" width="16" height="16" decoding="async" data-nimg="1" src="https://www.fotmob.com/_next/image?url=https%3A%2F%2Fimages.fotmob.com%2Fimage_resources%2Flogo%2Fleaguelogo%2Fdark%2F87.png&amp;w=32&amp;q=75" /> },
  { id: 'SA', name: 'Serie A', icon: <img alt="" loading="lazy" width="16" height="16" decoding="async" data-nimg="1" src="https://www.fotmob.com/_next/image?url=https%3A%2F%2Fimages.fotmob.com%2Fimage_resources%2Flogo%2Fleaguelogo%2Fdark%2F55.png&amp;w=32&amp;q=75" /> },
  { id: 'BL1', name: 'Bundesliga', icon: <img alt="" loading="lazy" width="16" height="16" decoding="async" data-nimg="1" src="https://www.fotmob.com/_next/image?url=https%3A%2F%2Fimages.fotmob.com%2Fimage_resources%2Flogo%2Fleaguelogo%2Fdark%2F54.png&amp;w=32&amp;q=75" /> },
  { id: 'FL1', name: 'Ligue 1', icon: <img alt="" loading="lazy" width="16" height="16" decoding="async" data-nimg="1" src="https://www.fotmob.com/_next/image?url=https%3A%2F%2Fimages.fotmob.com%2Fimage_resources%2Flogo%2Fleaguelogo%2Fdark%2F53.png&amp;w=32&amp;q=75" /> },
  // Removed Eredivisie (DED) and Primeira Liga (PPL) per request
];

const LeftAside = ({ onLeagueClick }) => {
  return (
    <div className="m-4 md:m-0 text-white w-52">
  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 backdrop-blur p-5 lg:p-6 shadow-sm">
        <h2 className="font-anton mb-4 text-gray-900 dark:text-white">Top Leagues</h2>
        <ul className="mb-2 space-y-2">
          {leagues.map((league) => (
            <motion.li
              key={league.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to="/LeagueTable"
                onClick={() => onLeagueClick(league.id)}
                className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 transition-colors"
              >
                <span className="inline-block">{league.icon}</span>
                <span className="ml-2 inline-block">{league.name}</span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
};

LeftAside.propTypes = {
  onLeagueClick: PropTypes.func.isRequired,
};

export default LeftAside;
