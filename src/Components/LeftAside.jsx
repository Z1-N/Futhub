
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
  { id: 'DED', name: 'Eredivisie', icon: <img alt="" loading="lazy" width="16" height="16" decoding="async" data-nimg="1" src="https://www.fotmob.com/_next/image?url=https%3A%2F%2Fimages.fotmob.com%2Fimage_resources%2Flogo%2Fleaguelogo%2Fdark%2F58.png&amp;w=32&amp;q=75" /> },
  { id: 'PPL', name: 'Primeira Liga', icon: <img alt="" loading="lazy" width="16" height="16" decoding="async" data-nimg="1" src="https://www.fotmob.com/_next/image?url=https%3A%2F%2Fimages.fotmob.com%2Fimage_resources%2Flogo%2Fleaguelogo%2Fdark%2F61.png&amp;w=32&amp;q=75" /> },
];


const LeftAside = ({ onLeagueClick }) => {
  return (
    <div className="bg-gray-800 m-8  text-white p-4 rounded-lg shadow-lg w-52">
      <h2 className=" font-anton mb-4">Top Leagues</h2>
      <ul className="mb-6">
        {leagues.map((league, index) => (
          <motion.li
            key={index}
            className="mb-2 p-2 text-xs bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }} 
            onClick={() => onLeagueClick(league.id)}
          >
            <div className='inline'>{league.icon}</div>
            <Link  to="/LeagueTable">
            <span className="ml-2 inline">{league.name}</span>
            </Link>
          </motion.li>
        ))}
      </ul>
    </div>
  );
};

LeftAside.propTypes = {
  onLeagueClick: PropTypes.func.isRequired,
};

export default LeftAside;