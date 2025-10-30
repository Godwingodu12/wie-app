import DoughnutChart from "./DoughnutChart";
import LegendItem from "./LegendItem";

const GroupStatisticsChart = ({ theme, statsData = [] }) => {
  if (statsData.length === 0) {
    return (
      <div>
        <h2 className={`text-lg md:text-xl font-bold ${theme.text} mb-4`}>
          Active group statistics
        </h2>
        <p className={`${theme.subText} text-sm`}>Not enough data to display stats.</p>
      </div>
    );
  }
  return (
    <>
      <h2 className={`text-lg md:text-xl font-bold ${theme.text} mb-3 md:mb-4`}>
        Active group statistics
      </h2>
      <div className="flex flex-col xl:flex-row items-center xl:justify-start gap-3 md:gap-4">
        <div
          className="flex justify-center items-center flex-shrink-0"
          style={{
            width: "152px",
            height: "152px",
            borderRadius: "100px",
          }}
        >
          <DoughnutChart stats={statsData} theme={theme} />
        </div>
        <div className="flex-grow w-full xl:w-auto">
          <div className="flex flex-col space-y-3 md:space-y-4">
            {statsData.map((stat, index) => (
              <LegendItem
                key={index}
                color={stat.color}
                label={stat.label}
                percentage={stat.percentage}
                theme={theme}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupStatisticsChart;