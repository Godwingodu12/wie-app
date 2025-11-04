import React from "react";

const FeatureButton = ({ Icon, label, theme, onClick, children }) => {
  const [isPressed, setIsPressed] = React.useState(false);

  // Determine theme-sensitive classes for background and image
  const labelColor = theme?.isDark ? "text-gray-300" : "text-gray-800"; // Using general text colors

  return (
    <div
      className="group relative flex flex-col xl:w-24 xl:h-28 w-16 h-24 items-center justify-center p-5 rounded-3xl cursor-pointer transition-all duration-300"
      style={{
        backgroundColor: theme?.cardBg || "#212426",
        // 1. DYNAMIC BORDER COLOR
        border: theme?.isDark
          ? "1.02px solid #33373A" // Dark mode border
          : "1.02px solid #d0d0d0", // Light mode border (e.g., light gray)
        boxShadow: isPressed
          ? theme?.shadowInset ||
            "inset 7px 7px 14px #151515, inset -7px -7px 14px #2b2b2b"
          : theme?.shadowOutset ||
            "7px 7px 14px #151515, -7px -7px 14px #2b2b2b",
      }}
      onMouseEnter={() => setIsPressed(true)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={onClick}
    >
      {/* Icon Circle */}
      <div
        className="rounded-full flex h-6 w-6 xl:h-11 xl:w-11 items-center justify-center mb-3 transition-all"
        style={{
          // 4. ICON ACCENT COLOR (Kept hardcoded blue as a standard accent color,
          // but could be replaced by a theme.primaryColor if defined)
          background: "linear-gradient(135deg, #6B5FED 0%, #5B51D8 100%)",
          boxShadow: "0 4px 16px rgba(107, 95, 237, 0.4)",
        }}
      >
        <img
          src={Icon}
          alt={label}
          // 2. DYNAMIC ICON IMAGE COLOR
          className={`xl:w-5 xl:h-5 h-3 w-3 object-contain`}
        />
      </div>

      {/* Label */}
      <p
        className={`xl:text-sm text-xs font-medium text-center leading-tight ${labelColor}`}
        style={{
          // 3. REMOVED HARDCODED LABEL COLOR and used Tailwind class
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </p>

      {children}
    </div>
  );
};
export default FeatureButton;
