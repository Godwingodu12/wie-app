const DoughnutChart = ({ stats, theme }) => {
  const radius = 60;
  const strokeWidth = 16;
  const viewBoxSize = 152;
  const center = viewBoxSize / 2;
  const circumference = 2 * Math.PI * radius;
  const hasMultipleSegments = stats.length > 1;
  const gapSize = hasMultipleSegments ? 10 : 0;
  
  const primaryStat =
    stats.find((s) => s.isPrimary) || (stats.length > 0 ? stats[0] : null);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: "152px", height: "152px" }}
    >
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold ${theme.text}`}>
          {primaryStat ? `${primaryStat.percentage}%` : "0%"}
        </span>
      </div>
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        style={{ width: "152px", height: "152px" }}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={theme.cardBg === "bg-[#232426]" ? "#232426" : "#f1f1f1"}
          strokeWidth={strokeWidth}
        />
        <g transform={`rotate(-90 ${center} ${center})`}>
          {stats.map((stat, index) => {
            const segmentArcLength = (circumference * stat.percentage) / 100;
            const visibleArcLength = hasMultipleSegments 
              ? Math.max(segmentArcLength - (gapSize * 2), 0)
              : segmentArcLength;
            
            let startPosition = 0;
            for (let i = 0; i < index; i++) {
              startPosition += (circumference * stats[i].percentage) / 100;
            }
            const offset = hasMultipleSegments ? startPosition + gapSize : startPosition;
            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={stat.strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={`${visibleArcLength} ${circumference}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
};
export default DoughnutChart;