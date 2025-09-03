// src/pages/HomePage/HomePage.jsx
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getGroups } from "../../services/ticketService";
import GroupSelectionModal from "../../components/modals/GroupSelectionModal";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import SideBar from "../../components/HomePage/SideBar.jsx";

// ICONS
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import HomeIcon from "../../assets/HomePage/HomeIcon.svg";
import TicketIcon from "../../assets/HomePage/TicketIcon.svg";
import OrgIcon from "../../assets/HomePage/OrgIcon.svg";
import SpeakerIcon from "../../assets/HomePage/SpeakerIcon.svg";
import ChatIcon from "../../assets/HomePage/ChatIcon.svg";
import SettingIcon from "../../assets/HomePage/SettingIcon.svg";
import CalenderIcon from "../../assets/HomePage/CalenderIcon.svg";
import EventCalenderIcon from "../../assets/HomePage/EventCalenderIcon.svg";
import MoneyIcon from "../../assets/HomePage/MoneyIcon.svg";
import MovieIcon from "../../assets/HomePage/MovieIcon.svg";
import RevenueIcon from "../../assets/HomePage/RevenueIcon.svg";
import LiveIcon from "../../assets/HomePage/LiveIcon.svg";
import GroupIcon from "../../assets/HomePage/GroupIcon.svg";
import NotificationIcon from "../../assets/HomePage/NotificationIcon.svg";
import PlusIcon from "../../assets/HomePage/PlusIcon.svg";

const dashboardStats = [
  { icon: EventCalenderIcon, title: "Total Event Created", temp: "🎈", value: "Nothing's Happening... Yet!" },
  { icon: MoneyIcon, title: "Today's Revenue", temp: "💸", value: "No Coins in the Jar Yet!" },
  { icon: MovieIcon, title: "Today's Booking", temp: "📭", value: "No Bookings Today!" },
];

const HEADER_HEIGHT = 72;

const HomePage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;
    
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const handleCreateEvent = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const groupsResponse = await getGroups();
      const groupsArray = Array.isArray(groupsResponse) ? groupsResponse : groupsResponse.data || [];
      setGroups(groupsArray);
      if (groupsArray.length === 0) navigate("/ticket/create-group");
      else if (groupsArray.length === 1) navigate(`/ticket/create-event/${groupsArray[0]._id}`);
      else setIsModalOpen(true);
    } catch {
      alert("Error fetching groups. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroup = (selectedGroup) => {
    setIsModalOpen(false);
    navigate(`/ticket/create-event/${selectedGroup._id}`);
  };

  const displayName = user?.name || "User";
  const isHomePage = location.pathname === "/home" || location.pathname === "/";

  const theme = isDark ? {
    bg: "bg-[#212426]", text: "text-white", subText: "text-[#c9c9cf]",
    cardBg: "bg-[#232426]", border: "border-[#23233a]", inputBg: "bg-[#212426]"
  } : {
    bg: "bg-white", text: "text-gray-900", subText: "text-gray-600",
    cardBg: "bg-gray-50", border: "border-gray-200", inputBg: "bg-gray-100"
  };

  const monochromaticNavIcons = [HomeIcon, ChatIcon];

  const BottomNavigation = () => (
    <nav className="bg-white dark:bg-[#212426] border-t border-gray-200 dark:border-[#23233a] px-4 py-2 fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {[{ to: "/home", icon: HomeIcon, label: "Home", active: isHomePage }, { to: "/ticket/events", icon: TicketIcon, label: "Tickets" }, { to: "/ticket/groups", icon: OrgIcon, label: "Group" }, { to: "/ticket/live-events", icon: SpeakerIcon, label: "Live" }, { to: "/ticket/chats", icon: ChatIcon, label: "Chat" }].map(({ to, icon, label, active }) => (
          <Link key={label} to={to} className="flex flex-col items-center gap-1 p-2">
            <div style={{ boxShadow: active && !isDark ? 'inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)' : active && isDark ? 'inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)' : 'none' }} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200`}>
              <img src={icon} alt={label} className={`w-4 h-4 ${monochromaticNavIcons.includes(icon) ? 'filter brightness-0 dark:invert' : ''} ${active ? 'opacity-100' : 'opacity-70'}`} />
            </div>
            <span className={`text-xs ${active ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );

  return (
    <div className="bg-white dark:bg-[#212426] text-gray-900 dark:text-white h-screen flex overflow-hidden transition-colors duration-300">
      <div className="hidden md:flex flex-col flex-shrink-0 bg-white dark:bg-[#212426]">
        <div className="flex items-center justify-center" style={{ height: HEADER_HEIGHT }}>
          <img src={WieLogo} alt="Wie Logo" className="w-12 h-12" />
        </div>
        <div className="flex-1">
          <SideBar user={user} theme={theme} />
        </div>
      </div>

      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <header className="flex items-center justify-between px-4 md:px-6 flex-shrink-0" style={{ height: HEADER_HEIGHT }}>
          <div className="flex md:hidden items-center justify-between w-full">
            <Link to="/profile" className="w-10 h-10 rounded-full overflow-hidden"><div className="w-full h-full bg-[#6a47fa] flex items-center justify-center text-white font-bold">{displayName.charAt(0).toUpperCase()}</div></Link>
            <div className="flex items-center gap-3">
              <div className="relative"><div style={{ boxShadow: isDark ? 'inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)' : 'inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)'}} className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#212426]"><img src={NotificationIcon} alt="Notification" className="w-4 h-4 filter brightness-0 dark:invert" /></div><span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">12</span></div>
              <button style={{ boxShadow: isDark ? 'inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)' : 'inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)'}} className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#212426]"><img src={SettingIcon} alt="Settings" className="w-4 h-4 filter brightness-0 dark:invert" /></button>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4 w-full">
            <div className="flex-1 min-w-0">
                <SearchBar theme={theme} value={searchValue} onChange={(e) => setSearchValue(e.target.value)} onTuneClick={() => console.log("Tune clicked")} />
            </div>
            <div className="flex items-center gap-4 ml-auto flex-shrink-0">
              <div className="relative"><div style={{ boxShadow: isDark ? 'inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)' : 'inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)'}} className="w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-[#212426]"><img src={NotificationIcon} alt="Notification" className="w-4 h-4 filter brightness-0 dark:invert" /></div><span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">12</span></div>
              <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
            </div>
          </div>
        </header>

        <main className="flex flex-col flex-1 p-4 md:px-6 md:pt-6 overflow-y-auto pb-24 md:pb-4 bg-gray-50 dark:bg-[#1a1c1e]">
          <div className="w-full flex flex-col flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 flex-shrink-0">
              <div className="mb-4 md:mb-0"><h1 className="text-xl md:text-2xl font-semibold">Good day, {displayName}!</h1><p className="text-sm text-gray-500 dark:text-gray-400">Let's Rock This!</p></div>
              <div className="mb-4 md:hidden"><SearchBar theme={theme} value={searchValue} onChange={(e) => setSearchValue(e.target.value)} onTuneClick={() => console.log("Tune clicked")} /></div>
              <div className="flex items-center gap-3">
                <button onClick={handleCreateEvent} disabled={loading} style={{ boxShadow: isDark ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)' : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)' }} className="flex flex-1 md:flex-none items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition h-12 bg-white text-gray-900 hover:bg-gray-200 dark:bg-[#232426] dark:text-white dark:hover:bg-[#2a2d2f]"><span className="bg-[#21d18b] rounded-full w-8 h-8 flex items-center justify-center -ml-2"><img src={PlusIcon} alt="Add" className="w-6 h-6" /></span>{loading ? "Checking..." : "Create event"}</button>
                <div style={{ boxShadow: isDark ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)' : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)' }} className="flex items-center gap-2 px-4 py-2 rounded-full h-12 bg-white dark:bg-[#232426]"><span className="bg-[#249EFF] rounded-full w-8 h-8 flex items-center justify-center -ml-2"><img src={CalenderIcon} alt="Calendar" className="w-5 h-5" /></span><span className="text-sm">{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-2 gap-4 flex-1">
              <div className="py-2 md:py-2 xl:py-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">
                  {dashboardStats.map((stat) => (
                    <div key={stat.title} style={{ boxShadow: isDark ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)' : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)' }} className="bg-white dark:bg-[#232426] rounded-3xl relative p-6 flex flex-col items-center justify-center gap-3 h-full transition-all duration-300">
                      <div style={{ boxShadow: isDark ? 'inset 4px 4px 8px 0px rgba(0,0,0,0.30), inset -4px -4px 8px 0px rgba(255,255,255,0.09)' : 'inset 4px 4px 8px 0px rgba(0,0,0,0.10), inset -4px -4px 8px 0px rgba(255,255,255,0.22)' }} className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-6 rounded-b-xl z-10 bg-white dark:bg-[#232426]"></div>
                      <img src={stat.icon} alt={stat.title} className="w-5 h-5 absolute left-8 top-3 z-20" />
                      <div className="flex flex-col items-center w-full mt-4"><div className="font-semibold text-center mb-2 text-sm text-gray-800 dark:text-gray-100" style={{ letterSpacing: '0.05em' }}>{stat.title.toUpperCase()}</div><div className="text-center mt-2 text-2xl">{stat.temp}</div><div className="text-gray-500 dark:text-gray-400 text-base text-center mt-4 px-1">{stat.value}</div></div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ boxShadow: isDark ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)' : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)' }} className="h-full bg-white dark:bg-[#232426] rounded-3xl p-6 flex flex-col transition-all duration-300">
                <div className="flex items-center gap-3 flex-shrink-0"><img src={LiveIcon} alt="Live Events" className="w-5 h-5" /><div className="font-semibold text-base">Live Events</div></div>
                <div className="flex-1 flex flex-col items-center justify-center text-center"><p className="text-gray-500 dark:text-gray-400 text-sm">Nothing's Happening... Now!</p><p className="text-gray-500 dark:text-gray-400 text-xs mt-2 px-2">Ready to make some noise? Create your first event.</p></div>
                <div className="flex justify-center pt-2"><button style={{ boxShadow: isDark ? '4px 4px 8px rgba(0, 0, 0, 0.6), -4px -4px 8px rgba(255, 255, 255, 0.08)' : '4px 4px 8px rgba(0, 0, 0, 0.15), -4px -4px 8px rgba(255, 255, 255, 0.8)' }} onClick={handleCreateEvent} className="rounded-full p-3 transition-all duration-200 bg-white hover:bg-gray-200 dark:bg-[#232426] dark:hover:bg-[#2a2d2f]"><img src={PlusIcon} alt="Add Event" className="w-5 h-5 filter brightness-0 dark:invert" /></button></div>
              </div>

              <div style={{ boxShadow: isDark ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)' : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)' }} className="h-full bg-white dark:bg-[#232426] rounded-3xl p-6 flex flex-col transition-all duration-300">
                <div className="flex items-center gap-3 mb-4 flex-shrink-0"><img src={RevenueIcon} alt="Revenue" className="w-5 h-5" /><div className="font-semibold text-base">Live Events Revenue Statistics</div></div>
                <div className="flex-1 flex flex-col items-center justify-center"><p className="text-gray-500 dark:text-gray-400 text-sm">Revenue Data Not Available</p><p className="text-gray-500 dark:text-gray-400 text-xs mt-2 px-2 text-center">This section will update as revenue data comes in.</p></div>
              </div>

              <div style={{ boxShadow: isDark ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)' : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)' }} className="h-full bg-white dark:bg-[#232426] rounded-3xl p-6 flex flex-col transition-all duration-300">
                <div className="flex items-center gap-3 flex-shrink-0"><img src={GroupIcon} alt="My Groups" className="w-5 h-5" /><div className="font-semibold text-base">My Groups</div></div>
                <div className="flex-1 flex flex-col items-center justify-center text-center"><p className="text-gray-500 dark:text-gray-400 text-sm">It's Lonely Here!</p><p className="text-gray-500 dark:text-gray-400 text-xs mt-2 px-2">No groups yet — let's fix that by creating one!</p></div>
                <div className="flex justify-center pt-2"><button style={{ boxShadow: isDark ? '4px 4px 8px rgba(0, 0, 0, 0.6), -4px -4px 8px rgba(255, 255, 255, 0.08)' : '4px 4px 8px rgba(0, 0, 0, 0.15), -4px -4px 8px rgba(255, 255, 255, 0.8)' }} onClick={() => navigate("/ticket/create-group")} className="rounded-full p-3 transition-all duration-200 bg-white hover:bg-gray-200 dark:bg-[#232426] dark:hover:bg-[#2a2d2f]"><img src={PlusIcon} alt="Add Group" className="w-5 h-5 filter brightness-0 dark:invert" /></button></div>
              </div>
            </div>
          </div>
        </main>

        <BottomNavigation />
      </div>

      <GroupSelectionModal groups={groups} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelectGroup={handleSelectGroup} />
    </div>
  );
};

export default HomePage;