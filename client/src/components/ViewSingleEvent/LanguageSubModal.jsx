// src/components/LanguageModal.jsx (New File)
import React from "react";
import { IoCloseSharp } from "react-icons/io5"; // Using react-icons for a sleek close button

const LanguageSubModal = ({ languages, theme, showLanguageModal, onClose }) => {
  if (!showLanguageModal) return null;

  // Assuming eventTextColor from the parent context might be needed for the title
  // For now, let's use theme.text or a specific color.
  const eventTextColor = theme.isDark ? "text-white" : "text-gray-900";

  const modalCardStyle = {
    background: theme.mainBg, // Or theme.cardBg for a slightly different shade
    border: "1px solid #4E5255",
    borderRadius: "20px", // Adjust as needed
    boxShadow:
      "10.22px 10.22px 15.33px 0px #00000029, -10.22px -10.22px 15.33px 0px #FFFFFF0A",
  };

  const languageBoxStyle = {
    background:
      "linear-gradient(90deg, #262646 0%, #5E5CE6 43.75%, #262646 92.95%)",
    borderRadius: "7px",
    boxShadow:
      "10.22px 10.22px 15.33px 0px #00000029, -10.22px -10.22px 15.33px 0px #FFFFFF0A",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="relative w-full max-w-lg p-6 md:p-8"
        style={modalCardStyle}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 text-2xl ${eventTextColor} hover:opacity-75 transition-opacity duration-200`}
        >
          <IoCloseSharp />
        </button>

        {/* Header */}
        <h2 className={`text-2xl font-semibold ${eventTextColor} mb-1`}>
          Language
        </h2>
        <p className={`text-sm ${theme.textColor} mb-6`}>
          Languages supported at this event
        </p>

        <div className="grid grid-cols-2 gap-4 max-h-36 overflow-y-auto">
          {(languages || []).map((lang, index) => (
            <div
              key={index}
              className={`flex items-center justify-center p-3 text-lg font-medium text-white cursor-pointer 
                 hover:border-2 `}
              style={languageBoxStyle}
            >
              {lang}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default LanguageSubModal;
