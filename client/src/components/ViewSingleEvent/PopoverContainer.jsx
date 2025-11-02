const PopoverContainer = ({ children, title, theme }) => (
  <div
    className={`absolute left-1/2 transform -translate-x-1/2 p-4 px-6 md:px-0 top-[100%] rounded-xl max-w-xs w-64 z-60 transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto`}
    style={{
      backgroundColor: theme.cardBg,
      boxShadow: theme.shadowOutset,
    }}
  >
    <h3 className={`text-lg font-bold mb-3 ${theme.textColor}`}>{title}</h3>
    <div className={`text-sm ${theme.textColor}`}>{children}</div>
  </div>
);

export default PopoverContainer