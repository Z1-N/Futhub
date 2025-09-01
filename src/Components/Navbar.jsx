import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiActivity, FiUsers, FiTable, FiFileText, FiMail } from 'react-icons/fi';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Enforce dark theme (removed light mode toggle)
    try {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } catch {}
  }, []);

  const navItems = [
    { label: 'Home', to: '/', icon: <FiHome className="h-4 w-4" /> },
    { label: 'Live', to: '/Live', icon: <FiActivity className="h-4 w-4" /> },
    { label: 'Teams', to: '/Teams', icon: <FiUsers className="h-4 w-4" /> },
    { label: 'Table', to: '/LeagueTable', icon: <FiTable className="h-4 w-4" /> },
    { label: 'News', to: '/News', icon: <FiFileText className="h-4 w-4" /> },
    { label: 'Contact', to: '/Contact', icon: <FiMail className="h-4 w-4" /> },
  ];

  return (
    <motion.nav
      className="sticky top-0 z-50 mb-4 md:mb-6 px-3 md:px-4 pt-3"
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Glass card */}
        <div className="rounded-2xl border border-white/10 bg-white/70 dark:bg-gray-900/70 backdrop-blur shadow-md">
          <div className="flex items-center justify-between px-3 md:px-5 py-2.5">
            {/* Brand */}
            <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
              <img
                src="/favicon.svg"
                alt="FutHub logo"
                className="h-8 w-8 rounded-lg border border-white/20 shadow-sm group-hover:opacity-90"
                loading="eager"
                decoding="sync"
              />
              <span className="text-xl md:text-2xl font-anton tracking-wide text-gray-900 dark:text-white">
                Futhub<span className="text-yellow-500">.</span>
              </span>
            </button>

            {/* Quick nav with icons */}
            <ul className="hidden md:flex items-center gap-1.5">
              {navItems.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <li key={item.to}>
                    <button
                      onClick={() => navigate(item.to)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors text-sm ${
                        active
                          ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
                          : 'bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800'
                      }`}
                      title={item.label}
                    >
                      {item.icon}
                      <span className="hidden lg:inline">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          {/* Accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500" />
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;