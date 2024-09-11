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
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const location = useLocation();

  // Determine whether to hide the main grid layout or not (for example, hide on the News or Contact page)
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
        {/* Render for medium and large screens */}
        {!isSpecialPage && (
          <div className="hidden md:grid grid-rows-[auto_1fr] grid-cols-[auto_1fr_auto] gap-4">
            <LeftAside onLeagueClick={setSelectedLeagueId} />
            <div className="col-span-1">
              <Routes>
                <Route path="/LeagueTable" element={<LeagueTable leagueId={selectedLeagueId} />} />
                <Route path="/" element={<MainMatchResult />} />
              </Routes>
            </div>
            <RightAside />
          </div>
        )}

        {/* Render for small screens */}
        <div className="md:hidden">
          <Routes>
            <Route path="/News" element={<News />} />
            <Route path="/Contact" element={<ContactUs />} />
            <Route path="/LeagueTable" element={<LeagueTable leagueId={selectedLeagueId} />} />
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
