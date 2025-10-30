const InsetCard = ({ children, className = "", theme }) => (
  <div
    className={`p-4 rounded-xl ${className}`}
    style={{
      boxShadow: theme.shadowInset,
      backgroundColor: theme.insetBg,
    }}
  >
    {children}
  </div>
);
export default InsetCard