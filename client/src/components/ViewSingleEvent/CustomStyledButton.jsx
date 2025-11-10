const CustomStyledButton = ({ Icon, label, theme, onClick }) => (
  <button
    onClick={onClick}
    className="
      md:w-[160px] 
      md:h-[45px] 
      opacity-100 
      rounded-[25px] 
      bg-[#5E5CE6] 
      text-white 
      shadow-[-2px_-2px_10px_0px_#63636336,5px_6px_9px_0px_#00000075] 
      border-none 
      flex 
      items-center 
      justify-center
    md:px-2  p-4   
      cursor-pointer
      space-x-2  
    "
  >
    {/* Renders the Icon component if provided */}
    {Icon && <img src={Icon} alt={`${label} icon`} className="w-4 h-4" />}
    {/* Renders the label text */}
    <span className="text-xs lg:text-sm">{label || "Click Me"}</span>
  </button>
);

export default CustomStyledButton;
