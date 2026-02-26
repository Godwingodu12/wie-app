import React, { useState } from "react";
import { RefreshCw, Crown, Link2, X, AlertTriangle } from "lucide-react";

const ReHostModal = ({
  theme,
  isDark,
  eventData,
  isRehosting,
  onConfirm,   // (rehostAs: "main" | "sub") => void
  onClose,
}) => {
  const [selected, setSelected] = useState(null); // "main" | "sub"
  const [step, setStep]         = useState(1);    // 1 = choose, 2 = confirm

  const handleNext = () => {
    if (!selected) return;
    setStep(2);
  };

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected);
  };

  const cardBase = `flex flex-col gap-3 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200`;
  const selectedCard = isDark
    ? "border-purple-500 bg-purple-900/20"
    : "border-purple-500 bg-purple-50";
  const unselectedCard = isDark
    ? "border-gray-700 bg-gray-800/40 hover:border-gray-500"
    : "border-gray-200 bg-gray-50 hover:border-gray-400";

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
              <h2 className={`text-xl font-bold ${theme.text}`}>Re-host Event</h2>
              <p className={`text-xs ${theme.subText}`}>{eventData?.event_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`${theme.subText} hover:opacity-70 transition-opacity`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step 1: Choose */}
        {step === 1 && (
          <>
            <p className={`text-sm ${theme.subText} mb-5`}>
              This event was cancelled. Choose how you want to re-host it:
            </p>

            {/* Option: Main Event */}
            <div
              className={`${cardBase} ${selected === "main" ? selectedCard : unselectedCard} mb-3`}
              onClick={() => setSelected("main")}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  selected === "main" ? "bg-purple-500/20" : isDark ? "bg-gray-700" : "bg-gray-200"
                }`}>
                  <Crown className={`w-5 h-5 ${selected === "main" ? "text-purple-400" : theme.subText}`} />
                </div>
                <div>
                  <p className={`font-semibold text-sm ${theme.text}`}>Re-host as Main Event</p>
                  <p className={`text-xs ${theme.subText} mt-0.5`}>
                    This event becomes the main event again
                  </p>
                </div>
                <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selected === "main"
                    ? "border-purple-500 bg-purple-500"
                    : isDark ? "border-gray-600" : "border-gray-300"
                }`}>
                  {selected === "main" && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
              {selected === "main" && (
                <div className={`text-xs ${isDark ? "text-purple-300" : "text-purple-700"} bg-purple-500/10 rounded-xl p-3 mt-1`}>
                  The currently promoted sub-event will be moved back as a sub-event under this main event. All existing sub-events will be re-linked.
                </div>
              )}
            </div>

            {/* Option: Sub Event */}
            <div
              className={`${cardBase} ${selected === "sub" ? selectedCard : unselectedCard} mb-6`}
              onClick={() => setSelected("sub")}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  selected === "sub" ? "bg-purple-500/20" : isDark ? "bg-gray-700" : "bg-gray-200"
                }`}>
                  <Link2 className={`w-5 h-5 ${selected === "sub" ? "text-purple-400" : theme.subText}`} />
                </div>
                <div>
                  <p className={`font-semibold text-sm ${theme.text}`}>Re-host as Sub-Event</p>
                  <p className={`text-xs ${theme.subText} mt-0.5`}>
                    Attach this event under the current main event
                  </p>
                </div>
                <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selected === "sub"
                    ? "border-purple-500 bg-purple-500"
                    : isDark ? "border-gray-600" : "border-gray-300"
                }`}>
                  {selected === "sub" && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
              {selected === "sub" && (
                <div className={`text-xs ${isDark ? "text-purple-300" : "text-purple-700"} bg-purple-500/10 rounded-xl p-3 mt-1`}>
                  This event will be added as a sub-event under the currently active main event.
                </div>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={!selected}
              className="w-full py-3 rounded-full font-semibold text-sm text-white
                         bg-gradient-to-r from-emerald-500 to-emerald-600
                         hover:from-emerald-600 hover:to-emerald-700
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all duration-200"
            >
              Continue
            </button>
          </>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && (
          <>
            <div className={`rounded-2xl p-4 mb-6 ${isDark ? "bg-amber-900/20 border border-amber-700/40" : "bg-amber-50 border border-amber-200"}`}>
              <div className="flex gap-3">
                <AlertTriangle className="text-amber-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={`text-sm font-semibold ${isDark ? "text-amber-300" : "text-amber-800"} mb-1`}>
                    Confirm Re-hosting
                  </p>
                  <p className={`text-xs ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                    {selected === "main"
                      ? `"${eventData?.event_name}" will become the main event again. The currently promoted event will become a sub-event.`
                      : `"${eventData?.event_name}" will be attached as a sub-event under the current main event.`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className={`flex-1 py-3 rounded-full font-semibold text-sm border transition-all
                           ${isDark
                             ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                             : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
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

export default ReHostModal;