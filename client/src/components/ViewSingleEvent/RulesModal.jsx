import React, { useState } from "react";
import { X, FileText, Download, ChevronLeft, ChevronRight } from "lucide-react";

const RulesModal = ({ eventRules, theme, onClose, formatImagePath }) => {
  const [currentPage, setCurrentPage] = useState(0);

  if (!eventRules) {
    return null;
  }

  const isFile = eventRules.type === "file";
  const isText = eventRules.type === "text";

  // For PDF viewer pagination (if needed)
  const totalPages = 1; // This would come from PDF parsing if implemented

  const handleDownload = () => {
    if (isFile && eventRules.path) {
      // Use the path directly from backend (already processed by formatImagePath if needed)
      const fileUrl = eventRules.path.startsWith("http")
        ? eventRules.path
        : formatImagePath(eventRules.path);

      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = eventRules.originalName || "rules-and-regulations.pdf";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden"
        style={{
          backgroundColor: theme.cardBg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.isDark ? "#33373A" : "#e5e7eb",
          }}
        >
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#5E5CE6" }}
            >
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${theme.text}`}>
                Rules and Regulations
              </h2>
              {isFile && eventRules.originalName && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {eventRules.originalName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isFile && (
              <button
                onClick={handleDownload}
                className="p-2 rounded-full transition-all hover:scale-110"
                style={{
                  backgroundColor: theme.insetBg,
                  boxShadow: theme.shadowOutset,
                }}
                title="Download"
              >
                <Download size={20} className={theme.text} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full transition-all hover:scale-110"
              style={{
                backgroundColor: theme.insetBg,
                boxShadow: theme.shadowOutset,
              }}
            >
              <X size={20} className={theme.text} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-56 custom-scrollbar">
          {isText && eventRules.content && (
            <div
              className="rounded-2xl p-6 leading-relaxed"
              style={{
                backgroundColor: theme.insetBg,
                boxShadow: theme.shadowInset,
              }}
            >
              <p
                className={`whitespace-pre-line text-sm ${theme.text}`}
                style={{ fontFamily: "inherit" }}
              >
                {eventRules.content
                  .replace(/<br\s*\/?>/gi, "\n")
                  .replace(/<\/p>/gi, "\n")
                  .replace(/<\/li>/gi, "\n")
                  .replace(/<li>/gi, "• ")
                  .replace(/<[^>]+>/g, "")
                  .replace(/&nbsp;/gi, " ")
                  .replace(/&amp;/g, "&")
                  .replace(/&lt;/g, "<")
                  .replace(/&gt;/g, ">")
                  .replace(/&quot;/g, '"')
                  .replace(/\n{3,}/g, "\n\n")
                  .trim()}
              </p>
            </div>
          )}
          {isFile && eventRules.path && (
            <div className="space-y-4">
              {/* PDF/Document Viewer */}
              {eventRules.mimeType === "application/pdf" ||
              eventRules.resource_type === "raw" ||
              eventRules.originalName?.toLowerCase().endsWith(".pdf") ? (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: theme.insetBg,
                    boxShadow: theme.shadowInset,
                  }}
                >
                  <iframe
                    src={
                      eventRules.path.startsWith("http")
                        ? eventRules.path
                        : formatImagePath(eventRules.path)
                    }
                    className="w-full h-[600px]"
                    title="Rules Document"
                  />
                </div>
              ) : eventRules.mimeType?.startsWith("image/") ? (
                // Image viewer for image files
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: theme.insetBg,
                    boxShadow: theme.shadowInset,
                  }}
                >
                  <img
                    src={
                      eventRules.path.startsWith("http")
                        ? eventRules.path
                        : formatImagePath(eventRules.path)
                    }
                    alt="Rules and Regulations"
                    className="w-full h-auto"
                  />
                </div>
              ) : (
                // Fallback for other file types
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{
                    backgroundColor: theme.insetBg,
                    boxShadow: theme.shadowInset,
                  }}
                >
                  <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className={`text-lg mb-2 ${theme.text}`}>
                    Document Preview Not Available
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    {eventRules.originalName}
                  </p>
                  <button
                    onClick={handleDownload}
                    className="px-6 py-2 rounded-full text-white font-medium transition-all hover:opacity-90"
                    style={{
                      background:
                        "linear-gradient(180.23deg, #1E1242 -0.04%, #6549B8 99.57%)",
                      boxShadow: "0 4px 12px rgba(101, 73, 184, 0.3)",
                    }}
                  >
                    Download Document
                  </button>
                </div>
              )}

              {/* File Info */}
              <div
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: theme.cardBg,
                  boxShadow: theme.shadowOutset,
                }}
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">File Name</p>
                    <p
                      className={`font-medium truncate ${theme.text}`}
                      title={eventRules.originalName}
                    >
                      {eventRules.originalName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">File Type</p>
                    <p className={`font-medium uppercase ${theme.text}`}>
                      {eventRules.mimeType?.split("/")[1] ||
                        eventRules.originalName?.split(".").pop() ||
                        "PDF"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">File Size</p>
                    <p className={`font-medium ${theme.text}`}>
                      {eventRules.size
                        ? eventRules.size > 1024 * 1024
                          ? `${(eventRules.size / (1024 * 1024)).toFixed(2)} MB`
                          : `${(eventRules.size / 1024).toFixed(2)} KB`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Uploaded</p>
                    <p className={`font-medium ${theme.text}`}>
                      {eventRules.uploadedAt
                        ? new Date(eventRules.uploadedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isText && !isFile && (
            <div
              className="rounded-2xl p-8 text-center"
              style={{
                backgroundColor: theme.insetBg,
                boxShadow: theme.shadowInset,
              }}
            >
              <p className="text-gray-400">
                No rules and regulations available
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RulesModal;
