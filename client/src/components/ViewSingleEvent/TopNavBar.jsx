// components/TopNavBar.jsx
import React from "react";
import SearchBar from "../../components/HomePage/SearchBar";
import ThemeToggle from "../../components/HomePage/ThemeToggle";
import LogoIcon from "../../assets/WieLogo.svg";
import NotificationIcon from "../../assets/HomePage/NotificationIcon.svg";
import { X } from "lucide-react"; // Use X for close if needed, but using ArrowLeft in modal

const TopNavBar = ({
  theme,
  searchTerm,
  onSearchChange,
  onTuneClick,
  handleThemeToggle,
  handleNavigateHome,
  isModal = false,
  onClose,
}) => {
  // Determine logo inversion based on theme
  const logoClass = theme.isDark ? "" : "filter invert";

  return (
    <div>
      <header className="flex justify-between w-full items-center mb-8 p-4 md:p-0">
        <div className="flex items-center space-x-4">
          {/* Logo or Close/Back Button */}
          {isModal ? (
            // Use a close button for the modal (optional, using ArrowLeft in GuideModal usually)
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                theme.isDark ? "bg-gray-700" : "bg-gray-300"
              }`}
            >
              <X size={24} className={theme.textColor} />
            </button>
          ) : (
            <img
              src={LogoIcon}
              alt="Logo"
              className={`w-12 h-12 object-contain cursor-pointer ${logoClass}`}
              onClick={handleNavigateHome}
            />
          )}

          <div className="hidden md:block">
            <SearchBar
              theme={theme}
              value={searchTerm}
              onChange={onSearchChange}
              onTuneClick={onTuneClick}
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle isDark={theme.isDark} onToggle={handleThemeToggle} />
        </div>
      </header>
      <div className="mb-4 md:hidden">
        <SearchBar
          theme={theme}
          value={searchTerm}
          onChange={onSearchChange}
          onTuneClick={onTuneClick}
        />
      </div>
    </div>
  );
};

export default TopNavBar;
