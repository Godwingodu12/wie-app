import React, { useState } from "react";
// ICONS
import TuneIcon from "../assets/HomePage/TuneIcon.svg";
import SearchIcon from "../assets/HomePage/SearchIcon.svg";

// Shared neumorphic style creator (always inset)
const getNeumorphicStyle = (isPressed = false, isDark = true) => {
  const bg = isDark ? "#212426" : "#FFFFFF";
  const lightShadow = isDark
    ? "rgba(255,255,255,0.05)"
    : "rgba(255,255,255,0.9)";
  const darkShadow = isDark
    ? "rgba(0,0,0,0.6)"
    : "rgba(0,0,0,0.2)";

  return {
    backgroundColor: bg,
    borderRadius: "9999px",
    boxShadow: isPressed
      ? `inset -3px -3px 6px ${lightShadow}, inset 3px 3px 6px ${darkShadow}`
      : `inset -2px -2px 5px ${lightShadow}, inset 2px 2px 5px ${darkShadow}`
  };
};

const SearchBar = ({
  theme,
  placeholder = "Search here...",
  value = "",
  onChange,
  onTuneClick
}) => {
  // Detect dark vs light mode from theme.text
  const isDark = theme.text.includes("white");

  // State for pressed effect
  const [tunePressed, setTunePressed] = useState(false);
  const [searchPressed, setSearchPressed] = useState(false);

  // Mouse/touch handlers
  const handleTuneDown = () => setTunePressed(true);
  const handleTuneUp = () => setTunePressed(false);
  const handleSearchDown = () => setSearchPressed(true);
  const handleSearchUp = () => setSearchPressed(false);

  // Icon & text colors
  const textColor = isDark ? "white" : "black";
  const iconFilter = isDark ? "invert(0)" : "invert(1)";

  return (
    <div className="flex items-center gap-5 ml-2">
      {/* Tune Button */}
      <div
        className="w-[48px] h-[48px] rounded-full p-2 flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-95"
        style={getNeumorphicStyle(tunePressed, isDark)}
        onMouseDown={handleTuneDown}
        onMouseUp={handleTuneUp}
        onMouseLeave={handleTuneUp}
        onTouchStart={handleTuneDown}
        onTouchEnd={handleTuneUp}
        onClick={onTuneClick}
      >
        <img
          src={TuneIcon}
          alt="Tune"
          className="w-6 h-6"
          style={{ filter: iconFilter }}
        />
      </div>

      {/* Search Input */}
      <div
        className="relative w-[620px] h-[48px] transition-all duration-150 rounded-full"
        style={getNeumorphicStyle(searchPressed, isDark)}
        onMouseDown={handleSearchDown}
        onMouseUp={handleSearchUp}
        onMouseLeave={handleSearchUp}
        onTouchStart={handleSearchDown}
        onTouchEnd={handleSearchUp}
      >
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`pl-12 pr-3 w-full h-[48px] rounded-full text-sm font-medium outline-none border-0 transition-colors duration-300`}
          style={{
            backgroundColor: "transparent",
            color: textColor
          }}
        />
        <img
          src={SearchIcon}
          alt="SearchIcon"
          className="absolute top-1/2 -translate-y-1/2 opacity-70"
          style={{
            width: "24px",
            height: "24px",
            left: "14px",
            filter: iconFilter
          }}
        />
      </div>
    </div>
  );
};

export default SearchBar;
