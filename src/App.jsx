import { useEffect, useState } from "react";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import Navbar from "./Components/Navbar";
import LeftAside from "./Components/LeftAside";
import RightAside from "./Components/RightAside";
import MainMatchResult from "./Components/MainSection";
import LeagueTable from "./Components/LeagueTable";
import Live from "./Components/Live";
import Teams from "./Components/Teams";
import LeagueUpcoming from "./Components/LeagueUpcoming";
import TeamUpcoming from "./Components/TeamUpcoming";
import TeamPage from "./Components/TeamPage";
import News from "./Components/News";
import ContactUs from "./Components/ContactUs";
import Footer from "./Components/Footer";
import DockedNavbar from "./Components/DockedNavbar";
import { lazy, Suspense } from 'react';

function App() {
  const [selectedLeague, setSelectedLeague] = useState(() => localStorage.getItem('league') || 'PL'); // Default to Premier League
  const [teamPanel, setTeamPanel] = useState(null); // kept for mobile fallback

  useEffect(() => {
    // Sync when Navbar changes league via localStorage
    const onStorage = (e) => {
      if (e.key === 'league') {
        setSelectedLeague(e.newValue || 'PL');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleLeagueClick = (leagueId) => {
    setSelectedLeague(leagueId);
  };
  const leagueCodeById = (id) => ({ PL:'eng.1', BL1:'ger.1', SA:'ita.1', PD:'esp.1', FL1:'fra.1', CL:'uefa.champions' }[id]);
  
  const location = useLocation();
  
  // Determine whether to hide the main grid layout or not
  const isSpecialPage = location.pathname === '/News' || location.pathname === '/Contact';
  const isTeamPage = location.pathname.startsWith('/team');

  return (
  <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-100 to-white dark:from-gray-900 dark:to-black transition-colors">
      {/* Navbar for larger screens */}
      <Navbar />
      
      {/* Main Content */}
        <div className="flex-grow">
          <div className={`${isTeamPage ? 'max-w-[100rem]' : 'max-w-[90rem]'} mx-auto px-4 md:px-8 xl:px-10`}>
            {/* Render for larger screens */}
            <div className={`hidden md:grid ${isSpecialPage ? 'grid-cols-1' : isTeamPage ? 'md:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,3fr)]' : 'md:grid-cols-[16rem_minmax(0,1fr)_14rem] xl:grid-cols-[18rem_minmax(0,1fr)_16rem]'} ${isTeamPage ? 'gap-8 xl:gap-10' : 'gap-6 lg:gap-8'}`}>
    {!isSpecialPage && (
            <>
              <div className="hidden md:block sticky top-24 self-start"><LeftAside onLeagueClick={handleLeagueClick} /></div>
              <div className="col-span-1">
                <Routes>
                  <Route path="/LeagueTable" element={<LeagueTable leagueId={selectedLeague} onLeagueChange={setSelectedLeague} />} />
      <Route path="/League" element={
                    <div className="space-y-4">
                      <LeagueUpcoming
                        leagueId={selectedLeague}
        onTeamClick={(t)=> window.location.assign(`/team/${selectedLeague}/${t.id}`)}
                      />
                    </div>
                  } />
      <Route path="/team/:leagueId/:teamId" element={<TeamPage />} />
                  <Route path="/Live" element={<Live leagueId={selectedLeague} />} />
                  <Route path="/Teams" element={<Teams leagueId={selectedLeague} />} />
                  <Route path="/" element={<MainMatchResult />} />
      <Route path="/Champions" element={<Navigate to="/LeagueTable" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
              {!isTeamPage && (
                <div className="hidden md:block sticky top-24 self-start"><RightAside /></div>
              )}
            </>
          )}
          {isSpecialPage && (
            <div className="col-span-1">
              <Routes>
                <Route path="/News" element={<News />} />
                <Route path="/Contact" element={<ContactUs />} />
              </Routes>
            </div>
          )}
            </div>
          </div>

    {/* Render for small screens */}
  <div className="md:hidden px-3 pt-2 pb-24">
          <Routes>
            <Route path="/News" element={<News />} />
            <Route path="/Contact" element={<ContactUs />} />
            <Route path="/LeagueTable" element={<LeagueTable leagueId={selectedLeague} onLeagueChange={setSelectedLeague} />} />
      <Route path="/League" element={
        <div className="space-y-4">
        <LeagueUpcoming leagueId={selectedLeague} onTeamClick={(t)=> window.location.assign(`/team/${selectedLeague}/${t.id}`)} />
              </div>
            } />
      <Route path="/team/:leagueId/:teamId" element={<TeamPage />} />
            <Route path="/Live" element={<Live leagueId={selectedLeague} />} />
            <Route path="/Teams" element={<Teams leagueId={selectedLeague} />} />
            <Route path="/" element={<MainMatchResult />} />
      <Route path="/Champions" element={<Navigate to="/LeagueTable" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Docked Navbar for mobile */}
      <DockedNavbar />
    </div>
  );
}

export default App;
