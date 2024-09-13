import { useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./Components/Navbar";
import LeftAside from "./Components/LeftAside";
import RightAside from "./Components/RightAside";
import MainMatchResult from "./Components/MainSection";
import LeagueTable from "./Components/LeagueTable";
import News from "./Components/News";
import ContactUs from "./Components/ContactUs";
import Footer from "./Components/Footer";
import DockedNavbar from "./Components/DockedNavbar";

function App() {
  const [selectedLeague, setSelectedLeague] = useState('PL'); // Default to Premier League

  const handleLeagueClick = (leagueId) => {
    setSelectedLeague(leagueId);
  };
  
  const location = useLocation();
  
  // Determine whether to hide the main grid layout or not
  const isSpecialPage = location.pathname === '/News' || location.pathname === '/Contact';

  return (
    <div
      style={{
        background:
          "linear-gradient(109.6deg, rgb(36, 45, 57) 11.2%, rgb(16, 37, 60) 51.2%, rgb(0, 0, 0) 98.6%)",
      }}
      className="min-h-screen flex flex-col"
    >
      {/* Navbar for larger screens */}
      <Navbar />
      
      {/* Main Content */}
      <div className="flex-grow">
        {/* Render for larger screens */}
        <div className={`hidden md:grid ${isSpecialPage ? 'grid-cols-1' : 'grid-rows-[auto_1fr] grid-cols-[auto_1fr_auto]'} gap-4`}>
          {!isSpecialPage && (
            <>
              <LeftAside onLeagueClick={handleLeagueClick} />
              <div className="col-span-1">
                <Routes>
                  <Route path="/LeagueTable" element={<LeagueTable leagueId={selectedLeague} />} />
                  <Route path="/" element={<MainMatchResult />} />
                </Routes>
              </div>
              <RightAside />
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

        {/* Render for small screens */}
        <div className="md:hidden">
          <Routes>
            <Route path="/News" element={<News />} />
            <Route path="/Contact" element={<ContactUs />} />
            <Route path="/LeagueTable" element={<LeagueTable leagueId={selectedLeague} />} />
            <Route path="/" element={<MainMatchResult />} />
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
