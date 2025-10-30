const ProhibitPopover = ({ prohibitedItems, theme }) => {
  return (
    <div
      className={`absolute left-full top-1/2 transform -translate-y-1/2 p-4 rounded-xl max-w-xs w-64 z-60 transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto`}
      style={{
        backgroundColor: theme.cardBg,
        boxShadow: theme.shadowOutset,
      }}
    >
      <h3 className={`text-lg font-bold mb-3 ${theme.textColor}`}>
        Prohibited Items
      </h3>
      <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
        {prohibitedItems && prohibitedItems.length > 0 ? (
          prohibitedItems.map((item, index) => (
            <li
              key={index}
              className={index === 0 ? "text-white p-1 rounded-md" : ""}
              style={index === 0 ? { backgroundColor: "#5E5CE6" } : {}}
            >
              {item}
            </li>
          ))
        ) : (
          <li>No specific prohibited items listed.</li>
        )}
      </ul>
    </div>
  );
};
export default ProhibitPopover