import React from "react";

const HashtagModal = ({ isOpen, hashtags, theme, onClose }) => {
  if (!isOpen) return null;

  const getOutsetShadowStyle = (isDark, shadowOutset) => {
    const lightModeShadow = "3px 3px 6px #c5c5c5, -3px -3px 6px #fbfbfb";
    const darkModeShadow = "3px 3px 6px #151515, -3px -3px 6px #2b2b2b";

    return {
      backgroundColor: isDark ? "#2a2d30" : "#e5e5e5",
      boxShadow: isDark ? darkModeShadow : lightModeShadow,
    };
  };

  const getInsetShadowStyle = (isDark, shadowInset) => {
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
            <h3 className="text-lg font-bold">Event Hashtags</h3>

            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 transform hover:scale-105 ${
                theme.isDark ? "text-gray-300" : "text-gray-700"
              }`}
              style={getOutsetShadowStyle(theme.isDark, theme.shadowOutset)}
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-4">
          {hashtags.length > 0 ? (
            <div
              className="flex overflow-y-auto custom-scrollbar flex-col gap-2 max-h-64 p-3 rounded-lg"
              style={getInsetShadowStyle(theme.isDark, theme.shadowInset)}
            >
              <div className="flex flex-wrap gap-1.5">
                {hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs font-medium px-2.5 py-1 rounded-md text-white whitespace-nowrap"
                    style={{ backgroundColor: "#5E5CE6" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic text-center py-4">
              No hashtag added
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HashtagModal;
