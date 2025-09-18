import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import SideBar from "../../components/HomePage/SideBar";
import SearchBar from "../../components/HomePage/SearchBar";

import ThemeToggle from "../../components/HomePage/ThemeToggle";
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import SearchIcon from "../../assets/HomePage/SearchIcon.svg";
import SettingIcon from "../../assets/Message/settings_icon.png";
import EditIcon from "../../assets/Message/edit_icon.png";

const getNeumorphicStyle = (isPressed = false, isDark = true, theme) => {
  // Match the SearchBar neumorphic inset style for consistent inner-depth
  const bg = isDark ? "#212426" : theme.inputBg.replace('bg-[', '').replace(']', '');
  const lightShadow = isDark
    ? "rgba(255,255,255,0.05)"
    : "rgba(255,255,255,0.9)";
  const darkShadow = isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.2)";

  return {
    backgroundColor: bg,
    borderRadius: "9999px",
    boxShadow: isPressed
      ? `inset -3px -3px 6px ${lightShadow}, inset 3px 3px 6px ${darkShadow}`
      : `inset -2px -2px 5px ${lightShadow}, inset 2px 2px 5px ${darkShadow}`,
  };
};

const IndexMessage = () => {
  const { user } = useSelector((state) => state.auth);
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
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

  const theme = isDark
    ? {
        bg: "bg-[#212426]",
        text: "text-white",
        subText: "text-[#c9c9cf]",
        cardBg: "bg-[#232426]",
        border: "border-[#23233a]",
        inputBg: "bg-[#212426]",
      }
    : {
        bg: "bg-[#ffffff]",
        text: "text-gray-900",
        subText: "text-gray-600",
        cardBg: "bg-[#ffffff]",
        border: "border-[#e4e6ea]",
        inputBg: "bg-[#ffffff]",
      };

  return (
    <div
      className={`${theme.bg} ${theme.text} h-screen flex overflow-hidden transition-colors duration-300 max-w-full`}
    >
      <div
        className={`hidden md:flex flex-col flex-shrink-0 nest-hub-sidebar ${theme.bg}`}
      >
        <div
          className="flex items-center justify-center"
          style={{ height: 72 }}
        >
          <img src={WieLogo} alt="Wie Logo" className="w-12 h-12" />
        </div>
        <div className="flex-1 sidebar-content">
          <SideBar user={user} theme={theme} />
        </div>
      </div>

      <div className="flex flex-col flex-1 w-full overflow-hidden md:ml-4">
        <header
          className="flex items-center justify-between px-4 md:px-6 flex-shrink-0"
          style={{ height: 72 }}
        >
          <div className="flex md:hidden items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <img
                src={WieLogo}
                alt="WIE Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 w-full">
            <div className="flex-1 min-w-0">
              <SearchBar
                theme={theme}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onTuneClick={() => {}}
              />
            </div>
            <div className="flex items-center gap-4 ml-auto flex-shrink-0">
              <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
            </div>
          </div>
        </header>

        <main
          className={`main-scrollbar flex flex-1 overflow-y-auto pb-24 md:pb-4 ${theme.cardBg}`}
          style={{ minHeight: "calc(100vh - 72px)" }}
        >
          <div
            className="flex flex-1 w-full h-full p-5 pr-4 gap-4 mr-4"
            style={{
              ...getNeumorphicStyle(false, isDark, theme),
              borderRadius: "2.5rem",
              boxShadow: isDark
                ? "inset -5px -5px 10px rgba(255, 255, 255, 0.1)"
                : "inset -5px -5px 10px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* Left column (messages + icons) */}
            <aside
              className="flex flex-col w-full md:w-1/4 gap-2 flex-shrink-0"
            >
              <div className="flex items-center justify-between px-5">
                <div className="text-base font-medium">Messages</div>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    className="p-2 rounded-[10px] hover:bg-white/5"
                    aria-label="Edit"
                  >
                    <img
                      src={EditIcon}
                      alt="Edit"
                      className={`w-4 h-4 ${
                        isDark ? "" : "filter brightness-0"
                      }`}
                    />
                  </button>
                  <button
                    className="p-2 rounded-[10px] hover:bg-white/5"
                    aria-label="Settings"
                  >
                    <img
                      src={SettingIcon}
                      alt="Settings"
                      className={`w-4 h-4 ${
                        isDark ? "" : "filter brightness-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
              <div
                className={`rounded-[20px] flex flex-col h-full ${theme.cardBg} pt-2 pb-5`}
              >
                <div
                  className="relative w-full h-10 transition-all duration-150 rounded-full px-5"
                  style={{
                    ...getNeumorphicStyle(false, isDark, theme),
                    boxShadow: `${
                      isDark
                        ? "0 4px 6px -1px rgba(255, 255, 255, 0.1), 0 2px 4px -2px rgba(255, 255, 255, 0.1)"
                        : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)"
                    }, ${getNeumorphicStyle(false, isDark, theme).boxShadow}`,
                  }}
                >
                  <input
                    type="text"
                    placeholder="Search here..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className={`pl-10 pr-3 w-full h-10 rounded-full text-sm font-medium outline-none border-0 transition-colors duration-300`}
                    style={{
                      backgroundColor: "transparent",
                      color: isDark ? "white" : "black",
                    }}
                  />
                  <img
                    src={SearchIcon}
                    alt="SearchIcon"
                    className="absolute top-1/2 -translate-y-1/2 opacity-70"
                    style={{
                      width: "20px",
                      height: "20px",
                      left: "12px",
                      filter: isDark ? "invert(0)" : "invert(1)",
                    }}
                  />
                </div>

                {/* Start card area centered inside aside */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center text-center gap-3">
                    <h4 className="font-bold text-xl">Start a New chat</h4>
                    <p
                      className={`${theme.subText} text-sm max-w-xs opacity-70`}
                    >
                      Begin a fresh conversation to connect with your
                      collaborators, coordinators or editors.
                    </p>

                    <div className="flex flex-col items-center gap-4 mt-6 w-full max-w-xs mx-auto">
                      <button
                        className="w-48 px-6 py-3 rounded-full font-semibold text-base text-white transition-colors shadow-lg"
                        style={{ backgroundColor: "#7263F3" }}
                        onClick={() => {}}
                      >
                        New chat
                      </button>
                      <button
                        className="w-48 px-6 py-3 rounded-full font-semibold text-base text-white transition-colors"
                        style={{ backgroundColor: "#68676C" }}
                        onClick={() => {}}
                      >
                        Create group
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Vertical Line Separator */}
            <div className="flex items-center">
              <div
                className="w-px h-4/5"
                style={{
                  background: `linear-gradient(to bottom, transparent 0%, ${
                    isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
                  } 20%, ${
                    isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
                  } 80%, transparent 100%)`,
                }}
              ></div>
            </div>

            {/* Center: logo / placeholder - hidden on mobile */}
                        <section className="hidden md:flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center justify-center text-center">
                <img
                  src={WieLogo}
                  alt="Wie Logo"
                  className={`w-32 h-auto mb-4 filter ${
                    isDark ? "brightness-125" : "brightness-110"
                  }`}
                />
                <div className={`text-sm ${theme.subText}`}>
                  Wie for windows
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default IndexMessage;