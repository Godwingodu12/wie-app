const Card = ({ children, className = "", customStyle = {}, theme }) => (
  <div
    className={`p-4 rounded-xl backdrop-blur-sm ${className}`}
    style={{
      backgroundColor: theme.cardBg,
      boxShadow: theme.shadowOutset,
      ...customStyle,
    }}
  >
    {children}
  </div>
);

export default Card;