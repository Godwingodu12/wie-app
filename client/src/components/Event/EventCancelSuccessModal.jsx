import React from "react";
import { FileSpreadsheet } from "lucide-react";

const EventCancelSuccessModal = ({
  theme,
  isDark,
  cancellationSummary,
  isDownloading,
  onDownload,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70"
      onClick={onClose}
    >
      <div
        className={`${theme.cardBg} rounded-3xl p-8 max-w-lg w-full text-center`}
        style={{
          boxShadow: isDark
            ? "0 25px 60px rgba(0,0,0,0.8)"
            : "0 25px 60px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-green-600 bg-opacity-20 flex items-center justify-center mx-auto mb-5">
          <svg
            className="w-10 h-10 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h2 className={`text-2xl font-bold ${theme.text} mb-2`}>
          Event Cancelled
        </h2>
        <p className={`${theme.subText} text-sm mb-6`}>
          All attendees have been notified via push notification, email, and SMS.
        </p>

        {/* Summary stats */}
        {cancellationSummary && (
          <div
            className={`rounded-2xl p-4 mb-6 text-left ${
              isDark ? "bg-[#1C1C1E]" : "bg-gray-100"
            }`}
          >
            <p
              className={`text-xs font-semibold uppercase ${theme.subText} mb-3`}
            >
              Cancellation Summary
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className={`text-xs ${theme.subText}`}>Attendees Notified</p>
                <p className={`text-xl font-bold ${theme.text}`}>
                  {cancellationSummary.totalBookings ?? 0}
                </p>
              </div>

              {cancellationSummary.isPaid && (
                <div>
                  <p className={`text-xs ${theme.subText}`}>Refund Policy</p>
                  <p className="text-xl font-bold text-green-500">
                    {cancellationSummary.refundPercentage ?? 100}% Back
                  </p>
                </div>
              )}
            </div>

            {cancellationSummary.reason && (
              <div
                className={`mt-3 pt-3 border-t ${
                  isDark
                    ? "border-gray-700 border-opacity-40"
                    : "border-gray-300"
                }`}
              >
                <p className={`text-xs ${theme.subText}`}>Reason</p>
                <p className={`text-sm ${theme.text} mt-1`}>
                  {cancellationSummary.reason}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Download report */}
        <button
          onClick={onDownload}
          disabled={isDownloading}
          className="w-full py-4 rounded-2xl font-semibold text-white mb-3
                     bg-emerald-600 hover:bg-emerald-700 transition-colors duration-200
                     flex items-center justify-center gap-2
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <FileSpreadsheet size={18} />
          {isDownloading
            ? "Downloading..."
            : "Download Cancellation Report (Excel)"}
        </button>

        <button
          onClick={onClose}
          className={`w-full py-3 rounded-2xl font-semibold text-sm
                      hover:opacity-80 transition-opacity duration-200 ${
                        isDark
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-200 text-gray-700"
                      }`}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default EventCancelSuccessModal;