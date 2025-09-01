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

  const linkClass = (path) => {
    const active = location.pathname === path;
    const base = 'flex flex-col items-center';
    const color = active ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white';
    return `${base} ${color}`;
  };

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 border-t border-white/10 bg-white/80 dark:bg-gray-900/70 backdrop-blur text-gray-900 dark:text-white flex justify-around items-center p-2.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      } md:hidden`}
      aria-label="Navigation"
    >
      <Link to="/News" className={linkClass("/News")}>
        <FaNewspaper size={28} />
        <span className="text-xs">News</span>
      </Link>
      <Link to="/Contact" className={linkClass("/Contact")}>
        <FaEnvelope size={28} />
        <span className="text-xs">Contact</span>
      </Link>
      <Link to="/LeagueTable" className={linkClass("/LeagueTable")}>
        <FaTable size={28} />
        <span className="text-xs">Table</span>
      </Link>
      <Link to="/" className={linkClass("/")}>
        <FaFutbol size={28} />
        <span className="text-xs">Matches</span>
      </Link>
    </nav>
  );
};

export default DockedNavbar;
