import React from "react";
import { AlertTriangle, XCircle, Ban, FileSpreadsheet } from "lucide-react";

// ─── Cancel Confirmation Modal ────────────────────────────────────────────────
export const EventCancelModal = ({
  theme,
  isDark,
  eventData,
  cancelReason,
  setCancelReason,
  cancelReasonError,
  setCancelReasonError,
  isCancelling,
  onConfirm,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70"
      onClick={onClose}
    >
      <div
        className={`${theme.cardBg} rounded-3xl p-6 max-w-lg w-full`}
        style={{
          boxShadow: isDark
            ? "0 25px 60px rgba(0,0,0,0.8)"
            : "0 25px 60px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-red-600 bg-opacity-20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="text-red-500 w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${theme.text}`}>Cancel Event</h2>
            <p className={`text-sm ${theme.subText}`}>
              This action cannot be undone
            </p>
          </div>
          <button
            onClick={onClose}
            className={`ml-auto ${theme.subText} hover:opacity-70 transition-opacity`}
          >
            <XCircle size={22} />
          </button>
        </div>

        {/* Warning box */}
        <div className="bg-red-900 bg-opacity-20 border border-red-500 border-opacity-40 rounded-2xl p-4 mb-5">
          <p className="text-red-400 text-sm font-semibold mb-2">
            ⚠ What will happen:
          </p>
          <ul className={`text-sm ${theme.subText} space-y-1 list-disc list-inside`}>
            <li>
              Event status will be set to{" "}
              <strong className="text-red-400">Cancelled</strong>
            </li>
            <li>
              All attendees will receive{" "}
              <strong>push, email &amp; SMS notifications</strong>
            </li>
            {eventData?.payment_type === "paid" && (
              <li>
                Automatic refunds will be initiated for all paid bookings
              </li>
            )}
            <li>
              A downloadable Excel report will be generated for your records
            </li>
          </ul>
        </div>

        {/* Event info */}
        <div
          className={`rounded-2xl p-4 mb-5 ${
            isDark ? "bg-[#1C1C1E]" : "bg-gray-100"
          }`}
        >
          <p className={`text-sm ${theme.subText} mb-1`}>Event</p>
          <p className={`font-semibold ${theme.text}`}>
            {eventData?.event_name}
          </p>
          <p className={`text-xs ${theme.subText} mt-1`}>
            {eventData?.payment_type === "paid"
              ? "Paid Event · Refund policy applies"
              : "Free Event · No refunds needed"}
          </p>
        </div>

        {/* Reason textarea */}
        <div className="mb-5">
          <label
            className={`block text-sm font-semibold ${theme.text} mb-2`}
          >
            Reason for Cancellation{" "}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => {
              setCancelReason(e.target.value);
              if (cancelReasonError) setCancelReasonError("");
            }}
            placeholder="Please explain why you are cancelling this event (minimum 10 characters)..."
            rows={4}
            maxLength={500}
            className={`w-full rounded-2xl p-4 text-sm resize-none outline-none transition-colors duration-200 ${
              isDark
                ? "bg-[#1C1C1E] text-white placeholder-gray-500 border border-gray-700 focus:border-red-500"
                : "bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-red-500"
            }`}
          />
          {cancelReasonError && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertTriangle size={12} />
              {cancelReasonError}
            </p>
          )}
          <p className={`text-xs ${theme.subText} mt-1`}>
            {cancelReason.length}/500 characters
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 py-3 rounded-2xl font-semibold text-sm transition-colors duration-200 ${
              isDark
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Keep Event
          </button>
          <button
            onClick={onConfirm}
            disabled={isCancelling || cancelReason.trim().length < 10}
            className="flex-1 py-3 rounded-2xl font-semibold text-sm
                       bg-red-600 hover:bg-red-700 text-white transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {isCancelling ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <Ban size={16} />
                Confirm Cancellation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export const EventCancelSuccessModal = ({
  theme,
  isDark,
  cancellationSummary,
  isDownloading,
  downloadError,      
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
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className={`text-2xl font-bold ${theme.text} mb-2`}>Event Cancelled</h2>
        <p className={`${theme.subText} text-sm mb-6`}>
          All attendees have been notified via push notification, email, and SMS.
        </p>

        {/* Summary stats */}
        {cancellationSummary && (
          <div className={`rounded-2xl p-4 mb-6 ${isDark ? "bg-[#1C1C1E]" : "bg-gray-100"} text-left`}>
            <p className={`text-xs font-semibold uppercase ${theme.subText} mb-3`}>
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
              <div className={`mt-3 pt-3 border-t ${isDark ? "border-gray-700 border-opacity-40" : "border-gray-300"}`}>
                <p className={`text-xs ${theme.subText}`}>Reason</p>
                <p className={`text-sm ${theme.text} mt-1`}>{cancellationSummary.reason}</p>
              </div>
            )}

            {/* Promotion notice */}
            {cancellationSummary?.promoted && (
              <div className={`mt-3 pt-3 border-t ${isDark ? "border-gray-700 border-opacity-40" : "border-gray-300"}`}>
                <p className="text-xs font-semibold text-emerald-500 uppercase mb-1">
                  ✅ Sub-Event Promoted
                </p>
                <p className={`text-sm ${theme.subText}`}>
                  The first active sub-event has been automatically promoted to the new main event.
                </p>
                {cancellationSummary.newMainTicketId && (
                  <p className={`text-xs ${theme.subText} mt-1 font-mono`}>
                    New main event ID:{" "}
                    <span className={theme.text}>{cancellationSummary.newMainTicketId}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Download error message */}
        {downloadError && (
          <div className="mb-3 px-4 py-2 rounded-xl bg-red-900 bg-opacity-20 border border-red-500 border-opacity-40">
            <p className="text-red-400 text-xs">{downloadError}</p>
          </div>
        )}

        {/* Download report button */}
        <button
          onClick={onDownload}
          disabled={isDownloading}
          className="w-full py-4 rounded-2xl font-semibold text-white mb-3
                     bg-emerald-600 hover:bg-emerald-700 transition-colors duration-200
                     flex items-center justify-center gap-2
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <FileSpreadsheet size={18} />
          {isDownloading ? "Downloading..." : "Download Cancellation Report (Excel)"}
        </button>

        <button
          onClick={onClose}
          className={`w-full py-3 rounded-2xl font-semibold text-sm hover:opacity-80 transition-opacity duration-200 ${
            isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
          }`}
        >
          Close
        </button>
      </div>
    </div>
  );
};