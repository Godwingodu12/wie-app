import React, { useState } from "react";
import { X } from "lucide-react";
const HostEventModal = ({ isOpen, onClose, onConfirm, eventName, isDark, theme, isLoading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div 
        className={`relative w-full max-w-md rounded-3xl p-6 ${
          isDark ? "bg-[#232426]" : "bg-white"
        } shadow-2xl transform transition-all`}
        style={{
          boxShadow: isDark
            ? "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)"
            : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
            isDark 
              ? "hover:bg-gray-700 text-gray-400 hover:text-white" 
              : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          }`}
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div 
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isDark ? "bg-purple-500/20" : "bg-purple-100"
            }`}
          >
            <svg
              className={`w-8 h-8 ${isDark ? "text-purple-400" : "text-purple-600"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className={`text-2xl font-bold text-center mb-2 ${theme.text}`}>
          Host Event?
        </h2>

        {/* Description */}
        <p className={`text-center mb-6 ${theme.subText}`}>
          Are you sure you want to host{" "}
          <span className={`font-semibold ${theme.text}`}>"{eventName}"</span>?
          <br />
          <span className="text-sm">This will make the event live and visible to attendees.</span>
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`flex-1 px-6 py-3 rounded-full font-semibold text-sm transition-all ${
              isDark
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            No, Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-6 py-3 rounded-full font-semibold text-sm text-white transition-all ${
              isLoading 
                ? "bg-purple-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            }`}
            style={{
              boxShadow: isLoading 
                ? "none" 
                : "0 4px 6px -1px rgba(139, 92, 246, 0.3), 0 2px 4px -1px rgba(139, 92, 246, 0.2)"
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                    fill="none"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Hosting...
              </span>
            ) : (
              "Yes, Host Event"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default HostEventModal;