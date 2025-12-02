import React, { useState, useEffect } from "react";
import InfoTooltip from "./InfoTooltip";

const FileInput = ({
  id,
  label,
  info,
  acceptedFiles,
  maxSizeMB,
  error,
  preview,
  onFileChange,
  onRemove,
  onPreviewClick, 
  isDocument = false,
}) => {
  const [previewData, setPreviewData] = useState(null);

  // Reference for the hidden file input
  const fileInputRef = React.useRef(null);

  // Update previewData when preview prop changes
  useEffect(() => {
    if (preview) {
      setPreviewData(preview);
    } else {
      setPreviewData(null);
    }
  }, [preview]);

  const getFileType = () => {
    // [getFileType logic remains the same]
    if (!preview) return null;
    if (typeof preview === "object" && preview !== null) {
      const data = preview.data || preview.url || preview;
      if (typeof data === "string") {
        if (
          data.startsWith("data:application/pdf") ||
          data.match(/\.(pdf)(\?|$)/i)
        )
          return "pdf";
        if (
          data.startsWith("data:image") ||
          data.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)
        )
          return "image";
        if (
          data.startsWith("data:video") ||
          data.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)
        )
          return "video";
      }
    }
    if (typeof preview === "string") {
      if (
        preview.startsWith("data:image") ||
        preview.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)
      )
        return "image";
      if (
        preview.startsWith("data:video") ||
        preview.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)
      )
        return "video";
      if (
        preview.startsWith("data:application/pdf") ||
        preview.match(/\.pdf(\?|$)/i)
      )
        return "pdf";
    }
    return isDocument ? "document" : "unknown";
  };

  // Removed internal openPreviewModal, rely on parent prop:
  // const openPreviewModal = () => { ... };

  const getPreviewUrl = () => {
    if (!preview) return null;
    if (typeof preview === "string") return preview;
    if (typeof preview === "object" && preview !== null)
      return preview.data || preview.url || preview.src || preview.path || null;
    return null;
  };

  const getFileName = () => {
    if (!preview) return "File";
    if (typeof preview === "object" && preview !== null)
      return preview.name || "File";
    if (typeof preview === "string") {
      const urlParts = preview.split("/");
      const filename = urlParts[urlParts.length - 1];
      return filename || "File";
    }
    return "File";
  };

  const handleBrowseClick = () => {
    // Explicitly trigger the file input click
    fileInputRef.current.click();
  };

  const fileType = getFileType();
  const previewUrl = getPreviewUrl();
  const fileName = getFileName();

  return (
    <>
      <div>
        <label className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2">
          {label}
          {info && <InfoTooltip note={info} />}
        </label>

        <div
          className={`relative rounded-lg p-5 text-center bg-gray-100 dark:bg-[#2B2B2B] min-h-[280px] flex justify-center items-center border-2 border-dashed border-gray-300 dark:border-gray-600 ${
            error ? "border-red-500" : ""
          }`}
        >
          {preview && previewUrl ? (
            <div className="w-full h-full min-h-[240px] flex flex-col justify-center items-center gap-3">
              {/* IMAGE PREVIEW */}
              {fileType === "image" && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={previewUrl}
                    alt={`${label} preview`}
                    className="max-w-full max-h-[240px] object-contain rounded-lg shadow-md"
                    onError={(e) => {
                      console.error("Image failed to load:", previewUrl);
                      e.target.src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                    }}
                  />

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate max-w-[90%]">
                    {fileName}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewClick && onPreviewClick(); // <-- CALLS PARENT
                    }}
                    className="mt-2 px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    View Full Size
                  </button>
                </div>
              )}
              {/* VIDEO PREVIEW */}
              {fileType === "video" && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <video
                    src={previewUrl}
                    className="max-w-full max-h-[240px] rounded-lg shadow-md bg-black"
                    controls
                    preload="metadata"
                    onError={(e) => {
                      console.error("Video failed to load:", previewUrl);
                    }}
                  />

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate max-w-[90%]">
                    {fileName}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewClick && onPreviewClick();
                    }}
                    className="mt-2 px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    View Full Size
                  </button>
                </div>
              )}
              {/* PDF PREVIEW */}
              {fileType === "pdf" && (
                <div className="relative w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="text-6xl">📄</div>

                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    PDF Document
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400 break-all max-w-[90%]">
                    {fileName}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewClick && onPreviewClick();
                    }}
                    className="mt-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    View PDF
                  </button>
                </div>
              )}
              {/* DOCUMENT PREVIEW (DOC, DOCX) */}
              {(fileType === "doc" ||
                fileType === "docx" ||
                fileType === "document") && (
                <div className="relative w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="text-6xl">📋</div>

                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {fileType === "docx"
                      ? "Word Document (.docx)"
                      : fileType === "doc"
                      ? "Document (.doc)"
                      : "Document"}
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400 break-all max-w-[90%]">
                    {fileName}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewClick && onPreviewClick();
                    }}
                    className="mt-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    View Document
                  </button>
                </div>
              )}
              {/* REMOVE BUTTON */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(id);
                }} // <-- FIX APPLIED
                className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-8 h-8 text-lg font-bold flex items-center justify-center hover:bg-red-700 shadow-lg transition-all"
              >
                ×
              </button>
            </div>
          ) : (
            <div
              className="flex flex-col items-center gap-3 w-full"
              onClick={handleBrowseClick}
            >
              {/* <-- FIX APPLIED */}
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Drag & drop or
                <span className="font-semibold text-indigo-500 dark:text-indigo-400 cursor-pointer">
                  browse
                </span>
              </p>

              <p className="text-xs text-gray-600 dark:text-gray-200">
                Max file size: {maxSizeMB}MB
              </p>

              {acceptedFiles && (
                <p className="text-xs text-gray-400">
                  Accepted:
                  {acceptedFiles.replace(/\./g, "").toUpperCase()}
                </p>
              )}
            </div>
          )}


          <input
            ref={fileInputRef} // <-- Ref added
            id={id + "_input"}
            type="file"
            accept={acceptedFiles}
            className="hidden"
            onChange={(e) => onFileChange(e, id)}
          />
        </div>

        {error && (
          <small className="text-red-500 mt-2 block text-left font-medium">
            {error}
          </small>
        )}
      </div>

    </>
  );
};
export default FileInput;
