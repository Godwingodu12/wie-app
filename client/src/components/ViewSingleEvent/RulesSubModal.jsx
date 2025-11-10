// components/ViewSingleEvent/RulesModal.jsx
import React, { useState } from "react";
import { X, FileText, Download, AlertTriangle } from "lucide-react";
// Assuming Card is available via a relative import

const RulesSubModal = ({
  eventRules,
  eventProhibitedItems,
  theme,
  onClose,
  formatImagePath,
}) => {
  const isFile = eventRules.type === "file";
  const isText = eventRules.type === "text";
  const prohibitedItems = eventProhibitedItems || [];
  const rulePath =
    isFile && eventRules.path ? formatImagePath(eventRules.path) : null;
  const fileName =
    isFile && eventRules.path
      ? eventRules.path.split("/").pop()
      : "Event Rules";

  const tagStyle = {
    background: "#B91C1C", // Red background
    boxShadow: theme.isDark
      ? "2px 2px 5px #00000040, -2px -2px 5px #FFFFFF10"
      : "2px 2px 5px #A0A0A099, -2px -2px 5px #FFFFFF",
  };

  const handleDownload = () => {
    if (rulePath) {
      window.open(rulePath, "_blank");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-y-auto"
        style={{
          backgroundColor: theme.cardBg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.isDark ? "#33373A" : "#e5e7eb",
          }}
        >
          {/* Title and File Name */}
          <div className="flex items-center space-x-3">
            {isFile ? <FileText className={`h-6 w-6 ${theme.text}`} /> : null}
            <div>
              <h2 className={`text-xl font-bold ${theme.text}`}>
                {isFile ? "Event Rules (File)" : "Event Rules"}
              </h2>
              {isFile && (
                <p className="text-sm text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap max-w-xs">
                  {fileName}
                </p>
              )}
            </div>
          </div>

          {/* Download and Close Buttons */}
          <div className="flex items-center space-x-3">
            {isFile && (
              <button
                onClick={handleDownload}
                className={`p-2 rounded-full flex items-center justify-center transition-transform hover:scale-105`}
                style={{
                  backgroundColor: theme.buttonBg,
                  boxShadow: theme.shadowInset,
                  color: theme.text,
                }}
                title="Download Rules"
              >
                <Download className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-full flex items-center justify-center transition-transform hover:scale-105`}
              style={{
                backgroundColor: theme.buttonBg,
                boxShadow: theme.shadowInset,
                color: theme.text,
              }}
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* MAIN CONTENT & SCROLLING AREA */}
        <div className="p-6">
          {/* Rules Content Section */}
          <div
            className="mb-6 rounded-2xl"
            style={{
              backgroundColor: theme.insetBg,
            }}
          >
            {/* TEXT Rules Content */}
            {isText && eventRules.content && (
              <div className="p-6">
                <pre
                  className={`whitespace-pre-wrap font-sans text-sm ${theme.text}`}
                  style={{ fontFamily: "inherit" }}
                >
                  {eventRules.content}
                </pre>
              </div>
            )}

            {/* FILE Rules Content (PDF/Document Preview) */}
            {isFile && rulePath && (
              <div className="h-[60vh] w-full p-2">
                <iframe
                  src={rulePath}
                  className="w-full h-full rounded-xl border-0"
                  title="Event Rules Document Preview"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="p-6 text-center text-gray-500 flex flex-col items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                  <p>
                    If the preview above is not loading, please use the
                    **Download** button in the header.
                  </p>
                </div>
              </div>
            )}

            {/* Fallback for no valid rules */}
            {!isText && !isFile && (
              <div
                className="rounded-2xl p-8 text-center flex flex-col items-center justify-center"
                style={{
                  backgroundColor: theme.insetBg,
                }}
              >
                <p className="text-gray-400">
                  No rules and regulations available
                </p>
              </div>
            )}
          </div>

          {/* Prohibited Items Section (Integrated) */}
          {prohibitedItems.length > 0 && (
            <div
              className="p-4 rounded-2xl flex flex-col space-y-3"
              style={{
                backgroundColor: theme.insetBg,
              }}
            >
              <h3 className={`text-lg font-semibold ${theme.text}`}>
                Prohibited items
              </h3>
              {/* This section has dedicated vertical scrolling (max-h-24 overflow-y-auto) */}
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                {prohibitedItems.map((item, index) => (
                  <span
                    key={index}
                    className="text-xs font-medium px-3 py-1 rounded-md text-white whitespace-nowrap"
                    style={tagStyle}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default RulesSubModal;