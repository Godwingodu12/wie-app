import React, { useState, useEffect } from "react";
import { getUserData } from "../../services/ticketService";
import { useNavigate } from "react-router-dom";
import SideBar from "../../components/HomePage/SideBar.jsx";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import SettingsNavigation from "../../components/settings/SettingsNavigation.jsx";
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import HandBurgerIcon from "../../assets/HomePage/HandBurgerIcon.svg";

import {
  KeyRound,
  ShieldCheck,
  Smartphone,
  Bell,
  History,
  Shield,
  ChevronRight,
} from "lucide-react";

const HEADER_HEIGHT = 72;
const ContentItem = ({ icon, text, subtext, hasChevron = true, border = true, theme }) => (
  <div className="relative">
    <div className={`flex items-center px-4 py-4 w-full`}>
      <div className="min-w-0 flex-1">
        <p className={`${theme.text} text-sm sm:text-base truncate`}>{text}</p>
        {subtext && <p className={`text-xs ${theme.text} opacity-70 truncate`}>{subtext}</p>}
      </div>
      <div className="flex items-center gap-2 ml-4">
        <div className="w-6 h-6 flex items-center justify-center">
          {icon}
        </div>
        {hasChevron && (
          <div className="w-6 h-6 flex items-center justify-center">
            <ChevronRight className={`h-6 w-6 ${theme.text}`} />
          </div>
        )}
      </div>
    </div>
    {border && <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>}
  </div>
);
const PasswordAndSecurityContent = ({ theme,onChangePassword  }) => (
  <>
    <header className="mb-6">
      <h1 className={`mb-1 text-xl sm:text-2xl font-bold ${theme.text}`}>Password and security</h1>
      <p className={`${theme.text} opacity-70 text-xs sm:text-sm`}>
        Manage your security settings, including your password and enabling advanced security features like two-factor authentication.
      </p>
    </header>

    <section className="mb-6">
      <h2 className={`mb-2 text-base sm:text-lg font-semibold ${theme.text}`}>Login & recovery</h2>
      <p className={`${theme.text} opacity-70 text-xs`}>
        Manage your password, login preferences and recovery methods.
      </p>
      <div className="overflow-hidden rounded-lg">
        <div 
          onClick={onChangePassword} 
          className="cursor-pointer transition-all duration-200 hover:opacity-90"
        >
          <ContentItem 
            theme={theme} 
            icon={<KeyRound className={`h-6 w-6 ${theme.text}`} />} 
            text="Change password" 
          />
        </div>
        <ContentItem theme={theme} icon={<ShieldCheck className={`h-6 w-6 ${theme.text}`} />} text="Two-factor authentication" />
        <ContentItem theme={theme} icon={<Smartphone className={`h-6 w-6 ${theme.text}`} />} text="Saved login" border={false} />
      </div>
    </section>

    <section>
      <h2 className={`mb-2 text-base sm:text-lg font-semibold ${theme.text}`}>Security checks</h2>
      <p className={`mb-3 text-xs ${theme.text} opacity-70`}>Review security issues by running checks, seeing recent devices and email alerts.</p>
      <div className="overflow-hidden rounded-lg">
        <ContentItem theme={theme} icon={<Smartphone className={`h-6 w-6 ${theme.text}`} />} text="Where you're logged in" />
        <ContentItem theme={theme} icon={<Bell className={`h-6 w-6 ${theme.text}`} />} text="Login alerts" />
        <ContentItem theme={theme} icon={<History className={`h-6 w-6 ${theme.text}`} />} text="Recent emails" />
        <ContentItem theme={theme} icon={<Shield className={`h-6 w-6 ${theme.text}`} />} text="Security checkup" border={false} />
      </div>
    </section>
  </>
);

const PasswordAndSecurity = () => {
  const navigate = useNavigate();
  const handleChangePassword = () => {
    navigate("/settings/change-password");
  };
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserData();
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, []);

  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const theme = isDark
    ? {
        bg: "bg-[#212426]",
        text: "text-white",
        notificationShadow:
          "inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)",
        cardShadow:
          "inset 8px 8px 16px rgba(0,0,0,0.4), inset -8px -8px 16px rgba(60,60,60,0.1)",
        inputShadow:
          "inset 4px 4px 8px rgba(0,0,0,0.3), inset -4px -4px 8px rgba(60,60,60,0.1)",
        buttonShadow:
          "4px 4px 8px rgba(0,0,0,0.3), -4px -4px 8px rgba(60,60,60,0.1)",
        sidebarBg: "bg-[#1a1c1e]",
        inputBg: "bg-[#2a2d30]",
        borderColor: "border-slate-700",
        separatorColor: "rgba(255,255,255,0.3)",
      }
    : {
        bg: "bg-[#f0f2f5]",
        text: "text-gray-900",
        notificationShadow:
          "inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)",
        cardShadow:
          "inset 8px 8px 16px rgba(0,0,0,0.1), inset -8px -8px 16px rgba(255,255,255,0.8)",
        inputShadow:
          "inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.8)",
        buttonShadow:
          "4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.8)",
        sidebarBg: "bg-gray-50",
        inputBg: "bg-gray-50",
        borderColor: "border-gray-200",
        separatorColor: "rgba(255,255,255,0.3)",
      };

  return (
    <>
    <style>{`
        /* Main page scrollbar */
        body::-webkit-scrollbar,
        html::-webkit-scrollbar,
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }
        
        body::-webkit-scrollbar-track,
        html::-webkit-scrollbar-track,
        .overflow-y-auto::-webkit-scrollbar-track {
          background: ${isDark ? '#1f2937' : '#f1f1f1'};
        }
        
        body::-webkit-scrollbar-thumb,
        html::-webkit-scrollbar-thumb,
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: ${isDark ? '#4b5563' : '#cbd5e1'};
          border-radius: 10px;
        }
        
        body::-webkit-scrollbar-thumb:hover,
        html::-webkit-scrollbar-thumb:hover,
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#6b7280' : '#94a3b8'};
        }
      `}</style>
    <div
      className={`${theme.bg} ${theme.text} min-h-screen flex overflow-hidden transition-colors duration-300`}
    >
      <div
        className={`hidden lg:flex flex-col flex-shrink-0 ${theme.bg} transition-colors duration-300`}
      >
        <div
          className="flex items-center justify-center"
          style={{ height: HEADER_HEIGHT }}
        >
          <img src={WieLogo} alt="Wie Logo" className="w-10 h-10 lg:w-12 lg:h-12" />
        </div>
        <div className="flex-1 overflow-y-auto">
          <SideBar user={user} theme={theme} />
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <header
          className="flex items-center justify-between px-4 md:px-6"
          style={{ height: HEADER_HEIGHT }}
        >
          <div className="flex items-center justify-between w-full lg:hidden">
            <button onClick={() => setIsMobileSidebarOpen(true)}>
              <img
                src={HandBurgerIcon}
                alt="Menu"
                className={`w-6 h-6 ${
                  isDark ? "filter brightness-0 invert" : ""
                }`}
                style={{ filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)' }}
              />
            </button>
            <img src={WieLogo} alt="Wie Logo" className="w-8 h-8" />
            <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
          </div>
          <div className="hidden lg:flex items-center gap-4 w-full">
            <div className="flex-1 min-w-0">
              <SearchBar
                theme={theme}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-[1560px] mx-auto">
            <div
            className={`${theme.bg} transition-colors duration-300 flex flex-col lg:flex-row overflow-hidden`}
            style={{ 
                borderRadius: '50px',
                boxShadow: '6px 6px 12px 0px rgba(0, 0, 0, 0.18) inset, -6px -6px 12px 0px rgba(255, 255, 255, 0.08) inset',
                minHeight: '808px'
            }}
            >
            <SettingsNavigation
                theme={theme}
                isDark={isDark}
                isMobile={isMobile}
                isOpen={isMobileSidebarOpen}
                onClose={() => setIsMobileSidebarOpen(false)}
            />
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <PasswordAndSecurityContent theme={theme} onChangePassword={handleChangePassword} />
            </div>
            </div>
        </div>
        </main>
      </div>
    </div>
    </>
  );
};
export default PasswordAndSecurity;
