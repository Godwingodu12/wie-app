import React from "react";
import { useNavigate } from "react-router-dom";

const ExtraEventsPlanner = ({ isOpen, onYes, onNo, ticketId, darkMode }) => {
  const navigate = useNavigate();

  const modalBgColor = darkMode ? "#262628" : "#FFFFFF";
  const titleColor = darkMode ? "text-gray-100" : "text-gray-900";
  const paragraphColor = darkMode ? "text-gray-400" : "text-gray-600";
  const iconBgColor = "#1E1242";
  const noButtonBg = darkMode ? "#363A3F" : "#E5E7EB";
  const noButtonText = darkMode ? "text-gray-100" : "text-gray-700";

  if (!isOpen) {
    return null;
  }

  const handleYesClick = () => {
    if (!ticketId) {
      console.error("ExtraEventsPlanner: ticketId is undefined!");
      alert("Error: Ticket ID is missing. Please try again.");
      return;
    }

    if (onYes) {
      onYes();
    }
    const targetUrl = `/ticket/update-ticket-addons/${ticketId}`;
    console.log("ExtraEventsPlanner: Navigating to:", targetUrl);
    navigate(targetUrl);
  };

  const handleNoClick = () => {
    if (!ticketId) {
      console.error("ExtraEventsPlanner: ticketId is undefined!");
      alert("Error: Ticket ID is missing. Please try again.");
      return;
    }

    if (onNo) {
      onNo(); // Call the original onNo callback (which should handle navigation)
    } // FIX: Navigate to Terms & Conditions (Step 5 or 6: Final step) // This ensures we skip the Addons step and move to the next logical stage.
    const targetUrl = `/ticket/ticket-terms/${ticketId}`;
    console.log("ExtraEventsPlanner: Navigating to:", targetUrl);
    navigate(targetUrl);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div
        style={{ backgroundColor: modalBgColor }}
        className={`rounded-xl shadow-2xl w-full max-w-md mx-auto p-8 text-center ${
          darkMode ? "dark" : ""
        }`}
      >
        <div
          style={{ backgroundColor: iconBgColor }}
          className="mb-6 mx-auto w-24 h-24 rounded-full flex items-center justify-center"
        >
          <svg
            className="w-12 h-12 text-purple-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className={`text-3xl font-semibold ${titleColor} mb-4`}>
          Any extra events planned?
        </h2>
        <p className={`${paragraphColor} mb-8 leading-relaxed text-sm px-4`}>
          Let us know if your main event includes additional shows, festivals,
          extra events, or side events planned?.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleNoClick}
            disabled={!ticketId}
            style={{
              backgroundColor: !ticketId
                ? darkMode
                  ? "#444"
                  : "#CCC"
                : noButtonBg,
              opacity: !ticketId ? 0.5 : 1,
              cursor: !ticketId ? "not-allowed" : "pointer",
            }}
            className={`flex-1 px-6 py-3 rounded-lg text-lg font-medium hover:opacity-80 transition-opacity ${noButtonText}`}
          >
            No, More Events
          </button>
          <button
            onClick={handleYesClick}
            disabled={!ticketId}
            style={{
              backgroundColor: !ticketId ? "#444" : "#1E1242",
              opacity: !ticketId ? 0.5 : 1,
              cursor: !ticketId ? "not-allowed" : "pointer",
            }}
            className="flex-1 px-6 py-3 text-white rounded-lg text-lg font-medium hover:opacity-80 transition-opacity"
          >
            Yes, add events
          </button>
        </div>
        {!ticketId && (
          <p className="text-red-400 text-sm mt-4">
            Error: Ticket ID is missing. Please refresh the page and try again.
          </p>
        )}
      </div>
    </div>
  );
};
export default ExtraEventsPlanner;