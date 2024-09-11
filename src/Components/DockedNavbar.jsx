import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaNewspaper, FaEnvelope, FaTable, FaFutbol } from 'react-icons/fa';

const DockedNavbar = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation(); // Use location to determine the active link

  const handleScroll = () => {
    if (window.scrollY > lastScrollY) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
    setLastScrollY(window.scrollY);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  const linkClass = (path) => 
    `flex flex-col items-center ${location.pathname === path ? 'text-yellow-400' : 'text-white'}`;

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 bg-indigo-600 text-white flex justify-around items-center p-4 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      } md:hidden`}
      aria-label="Navigation"
    >
      <Link to="/News" className={linkClass("/News")}>
        <FaNewspaper size={28} />
        <span className="text-sm">News</span>
      </Link>
      <Link to="/Contact" className={linkClass("/Contact")}>
        <FaEnvelope size={28} />
        <span className="text-sm">Contact Us</span>
      </Link>
      <Link to="/LeagueTable" className={linkClass("/LeagueTable")}>
        <FaTable size={28} />
        <span className="text-sm">League Tables</span>
      </Link>
      <Link to="/" className={linkClass("/")}>
        <FaFutbol size={28} />
        <span className="text-sm">Matches</span>
      </Link>
    </nav>
  );
};

export default DockedNavbar;
