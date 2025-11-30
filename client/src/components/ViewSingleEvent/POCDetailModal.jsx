// src/components/ViewSingleEvent/POCDetailModal.jsx

import React from "react";
import { Phone } from "lucide-react";

const POCDetailModal = ({ isOpen, person, theme, onClose }) => {
  if (!isOpen || !person) return null;

  const getOutsetShadowStyle = (isDark) => {
    const lightModeShadow = "3px 3px 6px #c5c5c5, -3px -3px 6px #fbfbfb";
    const darkModeShadow = "3px 3px 6px #151515, -3px -3px 6px #2b2b2b";
    return {
      backgroundColor: isDark ? "#2a2d30" : "#e5e5e5",
      boxShadow: isDark ? darkModeShadow : lightModeShadow,
    };
  };

  const getInsetShadowStyle = (shadowInset, isDark) => {
    return {
      boxShadow:
        shadowInset ||
        (isDark
          ? "inset 4px 4px 8px #151515, inset -4px -4px 8px #2b2b2b"
          : "inset 4px 4px 8px #c5c5c5, inset -4px -4px 8px #fbfbfb"),
    };
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex justify-center items-center backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative rounded-xl shadow-2xl w-full max-w-xs m-4 ${theme.text}`}
        style={{
          backgroundColor: theme.mainBg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="p-4 rounded-t-xl"
          style={{
            backgroundColor: theme.cardBg,
            borderBottom: `1px solid ${theme.isDark ? "#33373A" : "#D0D0D0"}`,
          }}
        >
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center">
              <Phone size={20} className="text-green-500 mr-2" />
              Contact Details
            </h3>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-2xl leading-none ${
                theme.isDark ? "text-gray-300" : "text-gray-700"
              }`}
              style={getOutsetShadowStyle(theme.isDark)}
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full mb-4 border-4 border-green-500 overflow-hidden flex items-center justify-center bg-gray-700">
            <span className="text-white text-4xl font-bold">
              {person.POC_name?.[0]?.toUpperCase() || "P"}
            </span>
          </div>

          {/* Name */}
          <h4
            className="text-xl font-bold mb-3"
            style={{ color: theme.textColor }}
          >
            {person.POC_name || "Unknown Contact"}
          </h4>

          <div
            className={`space-y-3 w-full border rounded-lg p-3 mt-2 ${
              theme.isDark
                ? "border-gray-700 bg-gray-800"
                : "border-gray-300 bg-gray-100"
            }`}
            style={{
              backgroundColor: theme.mainBg,
              ...getInsetShadowStyle(theme.shadowInset, theme.isDark),
            }}
          >
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Phone:</span>
              <a
                href={`tel:${person.POC_contact}`}
                className="text-sm font-medium text-green-500 hover:text-green-400"
              >
                {person.POC_contact || "N/A"}
              </a>
            </div>
            {person.POC_email && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Email:</span>
                <a
                  href={`mailto:${person.POC_email}`}
                  className="text-sm font-medium text-blue-500 hover:text-blue-400 truncate max-w-[60%]"
                >
                  {person.POC_email}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default POCDetailModal;
