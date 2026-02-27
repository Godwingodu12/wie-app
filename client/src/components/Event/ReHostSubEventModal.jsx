import React, { useState } from "react";
import { RefreshCw, X, AlertTriangle } from "lucide-react";

const ReHostSubEventModal = ({
  theme,
  isDark,
  eventData,
  isRehosting,
  onConfirm,  // () => void — always re-hosts as sub-event
  onClose,
}) => {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`${isDark ? "bg-[#212426]" : "bg-white"} rounded-3xl p-6 w-full max-w-md shadow-2xl`}
        style={{
          boxShadow: isDark
            ? "0 25px 50px rgba(0,0,0,0.6)"
            : "0 25px 50px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <RefreshCw className="text-emerald-500 w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${theme.text}`}>Re-host Sub-Event</h2>
              <p className={`text-xs ${theme.subText} truncate max-w-[200px]`}>
                {eventData?.event_name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`${theme.subText} hover:opacity-70 transition-opacity`}>
            <X size={20} />
          </button>
        </div>

        {!confirmed ? (
          <>
            {/* Info card */}
            <div className={`rounded-2xl p-4 mb-5 ${
              isDark
                ? "bg-emerald-900/20 border border-emerald-700/40"
                : "bg-emerald-50 border border-emerald-200"
            }`}>
              <div className="flex gap-3">
                <RefreshCw className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  isDark ? "text-emerald-400" : "text-emerald-600"
                }`} />
                <div>
                  <p className={`text-sm font-semibold mb-1 ${
                    isDark ? "text-emerald-300" : "text-emerald-800"
                  }`}>
                    Re-host as Sub-Event
                  </p>
                  <p className={`text-xs ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>
                    This cancelled sub-event will be restored under its parent event with a
                    <span className="font-semibold"> Confirmed</span> status.
                    You can then go live when ready.
                  </p>
                </div>
              </div>
            </div>

            {/* Event info */}
            <div className={`rounded-2xl p-4 mb-6 ${isDark ? "bg-gray-800/40" : "bg-gray-50"}`}>
              <p className={`text-xs uppercase font-semibold ${theme.subText} mb-2`}>
                Sub-Event Details
              </p>
              <p className={`text-sm font-semibold ${theme.text}`}>{eventData?.event_name}</p>
              <p className={`text-xs ${theme.subText} mt-1`}>
                Status after re-host:{" "}
                <span className="text-green-400 font-semibold">Confirmed</span>
              </p>
            </div>

            <button
              onClick={() => setConfirmed(true)}
              className="w-full py-3 rounded-full font-semibold text-sm text-white
                         bg-gradient-to-r from-emerald-500 to-emerald-600
                         hover:from-emerald-600 hover:to-emerald-700
                         transition-all duration-200"
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <div className={`rounded-2xl p-4 mb-6 ${
              isDark
                ? "bg-amber-900/20 border border-amber-700/40"
                : "bg-amber-50 border border-amber-200"
            }`}>
              <div className="flex gap-3">
                <AlertTriangle className="text-amber-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={`text-sm font-semibold mb-1 ${
                    isDark ? "text-amber-300" : "text-amber-800"
                  }`}>
                    Confirm Re-hosting
                  </p>
                  <p className={`text-xs ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                    "{eventData?.event_name}" will be restored as a sub-event under its parent
                    event with <span className="font-semibold">Confirmed</span> status.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmed(false)}
                className={`flex-1 py-3 rounded-full font-semibold text-sm border transition-all ${
                  isDark
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                Back
              </button>
              <button
                onClick={onConfirm}
                disabled={isRehosting}
                className="flex-1 py-3 rounded-full font-semibold text-sm text-white
                           bg-gradient-to-r from-emerald-500 to-emerald-600
                           hover:from-emerald-600 hover:to-emerald-700
                           disabled:opacity-60 disabled:cursor-not-allowed
                           transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isRehosting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Re-hosting...
                  </>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    Confirm Re-host
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReHostSubEventModal;