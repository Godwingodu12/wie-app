const PreferenceCard = ({ pref, theme, isCurrent }) => {
  const cardColor = isCurrent ? "" : theme.cardBg;

  // Decide text color class to apply depending on theme mode and if current
  const textColorClass = isCurrent
    ? "text-gray-500"
    : theme.isDark
    ? theme.textColor
    : "text-gray-800"; // light mode text color override

  return (
    <div
      className={`flex flex-col items-center p-4 rounded-3xl w-40 h-60 flex-shrink-0 transition-all duration-300`}
      style={{
        backgroundColor: cardColor,
        boxShadow: theme.shadowOutset,
        transform: isCurrent ? "scale(1.05)" : "scale(0.95)",
      }}
    >
      <h4
        className={`text-md text-center mb-4 flex-grow-0 opacity-70 ${textColorClass}`}
      >
        {pref.type === "Seating"
          ? "Audience seated or standing ?"
          : `${pref.type} allowed ?`}
      </h4>

      <div className="w-32 h-32 my-auto rounded-full overflow-hidden flex items-center justify-center flex-grow">
        <img
          src={pref.Icons}
          alt={pref.type}
          className="w-full h-full object-contain"
        />
      </div>

      <h3 className={`text-xl font-medium flex-grow-0 mt-4 ${textColorClass}`}>
        {pref.status}
      </h3>
    </div>
  );
};
export default PreferenceCard;
