const StatsCard = ({
  count,
  title,
  isDark,
  theme,
  className,
  icon,
  isMobile = false,
}) => {
  if (isMobile) {
    return (
      <div
        style={{
          width: "48%", // Takes 48% of container width
          height: "160px",
          padding: "3%",
          borderRadius: "30px",
                  border: "1px solid transparent",

          backgroundImage: isDark
            ? "linear-gradient(#212426, #212426), linear-gradient(286.41deg, #171717 -2.79%, #343434 101.27%)"
            : "linear-gradient(#ffffff, #ffffff), linear-gradient(286.41deg, #e8e8e8 -2.79%, #f5f5f5 101.27%)",
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
          boxShadow: isDark
            ? "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A"
            : "8px 8px 12px 0px #0000001A, -8px -8px 12px 0px #FFFFFF80",
        }}
        className={`flex flex-col items-center justify-around ${className}`}
      >
        {icon}
        <p className={`text-xl sm:text-2xl font-semibold ${theme.text}`}>
          {count}
        </p>
        <p
          className={`text-[9px] sm:text-[10px] text-center leading-tight px-1 ${theme.subText}`}
        >
          {title}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "48%", // Takes 48% of container width
        height: "160px",
        padding: "3%",
        borderRadius: "30px",
        border: "1px solid transparent",
        backgroundImage: isDark
          ? "linear-gradient(#212426, #212426), linear-gradient(286.41deg, #171717 -2.79%, #343434 101.27%)"
          : "linear-gradient(#ffffff, #ffffff), linear-gradient(286.41deg, #e8e8e8 -2.79%, #f5f5f5 101.27%)",
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        boxShadow: isDark
          ? "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A"
          : "8px 8px 12px 0px #0000001A, -8px -8px 12px 0px #FFFFFF80",
      }}
      className={`flex flex-col items-center justify-around ${className}`}
    >
      {icon}
      <p className={`text-2xl lg:text-3xl font-semibold ${theme.text}`}>
        {count}
      </p>
      <p
        className={`text-[10px] lg:text-xs text-center leading-tight ${theme.subText}`}
      >
        {title}
      </p>
    </div>
  );
};

export default StatsCard;