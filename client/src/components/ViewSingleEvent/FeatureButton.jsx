const FeatureButton = ({ Icon, label, theme, onClick, children }) => (
  <div
    className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl xl:w-24 xl:h-32  w-16 h-20 cursor-pointer transition-all duration-200 ${
      theme.textColor
    } 
                    shadow-md hover:scale-[1.02] active:scale-[0.98]
                    ${
                      theme.isDark
                        ? "bg-opacity-90 shadow-[7px_7px_14px_#151515,-7px_-7px_14px_#2b2b2b] hover:shadow-[inset_4px_4px_8px_#151515,inset_-4px_-4px_8px_#2b2b2b]"
                        : "bg-opacity-90 shadow-[5px_5px_10px_#c5c5c5,-5px_-5px_10px_#fbfbfb] hover:shadow-[inset_4px_4px_8px_#c5c5c5,inset_-4px_-4px_8px_#fbfbfb]"
                    }`}
    style={{
      backgroundColor: theme.cardBg,
    }}
    onClick={onClick}
  >
    <div
      className="xl:w-12 xl:h-12 w-8 h-8  rounded-full flex items-center justify-center mb-2"
      style={{ backgroundColor: "#5E5CE6" }}
    >
      <img src={Icon} alt="" className="text-white" />
    </div>
    <p className="text-xs xl:text-sm text-center">{label}</p>

    {children}
  </div>
);

export default FeatureButton;