const CustomScrollbarStyles = ({ isDark }) => {
  const mainTrackColor = isDark ? "#232426" : "#f1f5f9";
  const mainThumbColor = isDark ? "#4f4f4f" : "#cbd5e1";
  const widgetThumbColor = isDark ? "#818cf8" : "#6366f1";

  const autofillTextColor = isDark ? "#FFFFFF" : "#1F2937";

  return (
    <style>{`
      /* --- ADD THIS FOR THE MAIN BROWSER SCROLLBAR --- */
      body::-webkit-scrollbar {
        width: 12px;
      }
      body::-webkit-scrollbar-track {
        background: #232426;
      }
      body::-webkit-scrollbar-thumb {
        background-color: #4f4f4f;
        border-radius: 20px;
        border: 3px solid #232426;
      }
      /* --- END OF NEW SCROLLBAR CODE --- */

      .main-scrollbar::-webkit-scrollbar { width: 8px; }
      .main-scrollbar::-webkit-scrollbar-track { background: ${mainTrackColor}; }
      .main-scrollbar::-webkit-scrollbar-thumb {
        background-color: ${mainThumbColor};
        border-radius: 10px;
        border: 2px solid ${mainTrackColor};
      }
      .main-scrollbar { scrollbar-width: thin; scrollbar-color: ${mainThumbColor} ${mainTrackColor}; }
      .custom-scrollbar::-webkit-scrollbar { width: 8px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: ${widgetThumbColor};
        border-radius: 10px;
        border: 2px solid transparent;
        background-clip: content-box;
      }
      .custom-scrollbar { scrollbar-width: thin; scrollbar-color: ${widgetThumbColor} transparent; }
      
      input[type="time"]::-webkit-datetime-edit-text,
      input[type="time"]::-webkit-datetime-edit-hour-field,
      input[type="time"]::-webkit-datetime-edit-minute-field {
        color: transparent;
      }
      input[type="time"]:focus::-webkit-datetime-edit-text,
      input[type="time"]:focus::-webkit-datetime-edit-hour-field,
      input[type="time"]:focus::-webkit-datetime-edit-minute-field,
      input[type="time"]:not(:placeholder-shown)::-webkit-datetime-edit-text,
      input[type="time"]:not(:placeholder-shown)::-webkit-datetime-edit-hour-field,
      input[type="time"]:not(:placeholder-shown)::-webkit-datetime-edit-minute-field {
        color: inherit;
      }

      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      input:-webkit-autofill:active {
          -webkit-text-fill-color: ${autofillTextColor} !important;
          background-color: transparent !important;
          -webkit-box-shadow: none !important;
          transition: background-color 9999s ease-in-out 0s;
      }

    `}</style>
  );
};

export default CustomScrollbarStyles;