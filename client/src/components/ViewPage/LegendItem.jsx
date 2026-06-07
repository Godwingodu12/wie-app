const LegendItem = ({ color, label, percentage, theme }) => (
  <div className="w-full flex items-center gap-2">
    <div className="flex items-center gap-2 w-1/3">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span className={`${theme.text} text-sm truncate`}>{label}</span>
    </div>
    <div className="w-2/3 flex items-center gap-2">
      <div
        className={`w-full ${
          theme.cardBg === "bg-[#232426]" ? "bg-gray-700" : "bg-gray-200"
        } rounded-full h-1.5`}
      >
        <div
          className={`${color} h-1.5 rounded-full`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <span className={`${theme.text} font-medium text-sm w-10 text-right`}>
        {percentage}%
      </span>
    </div>
  </div>
);
export default LegendItem