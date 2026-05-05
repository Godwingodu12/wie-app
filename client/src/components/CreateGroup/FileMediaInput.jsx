import React, { useRef, useState, useCallback, useEffect } from "react";
import InfoTooltip from "./InfoTooltip";
import { FiTrash2, FiUpload, FiCheck, FiX, FiEye, FiMaximize2, FiMinimize2, FiRefreshCcw, FiRotateCcw, FiZoomIn, FiZoomOut, FiLoader } from "react-icons/fi";
import Cropper from "react-easy-crop";

const FileMediaInput = ({
  id,
  label,
  info,
  acceptedFiles,
  maxSizeMB,
  resolution,
  error,
  preview,
  onFileChange,
  onRemove,
  onPreviewClick,
  isDocument = false,
  aspectRatio = 1, // Default to square (1:1)
}) => {
  const fileInputRef = useRef(null);

  // Cropper State
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [lockAspect, setLockAspect] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!imageToCrop) return;
      if (e.key === "Escape") {
        setImageToCrop(null);
        setZoom(1);
      }
      if (e.key === "Enter" && !isProcessing) {
        createCroppedImage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imageToCrop, isProcessing]);

  const resetCropper = () => {
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };
  const getPreviewUrl = () => {
    if (!preview) return null;
    if (typeof preview === "string") return preview;
    return preview.data || preview.url || preview;
  };

  const previewUrl = getPreviewUrl();

  // --- CROPPER HELPERS ---

  const onInternalFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset input value so the same file can be selected again
    e.target.value = "";

    // If it's a document or no crop is needed, skip to standard handler
    if (isDocument || !file.type.startsWith("image/")) {
      onFileChange(e, id);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setImageToCrop(reader.result);
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const createCroppedImage = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const image = new Image();
      image.src = imageToCrop;
      await new Promise((res, rej) => {
        image.onload = res;
        image.onerror = rej;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Calculate output dimensions
      let outputWidth, outputHeight;

      // Try to parse resolution from prop (e.g. "1920x1080")
      let targetWidth = null;
      let targetHeight = null;
      if (resolution && typeof resolution === "string" && resolution.includes("x")) {
        const parts = resolution.split("x");
        targetWidth = parseInt(parts[0], 10);
        targetHeight = parseInt(parts[1], 10);
      }

      if (lockAspect) {
        if (targetWidth && targetHeight) {
          outputWidth = targetWidth;
          outputHeight = targetHeight;
        } else {
          // Fallback to smart defaults based on aspect ratio
          if (Math.abs(aspectRatio - 16 / 9) < 0.1 || Math.abs(aspectRatio - 1920 / 1080) < 0.1) {
            outputWidth = 1920; outputHeight = 1080;
          } else if (Math.abs(aspectRatio - 1920 / 720) < 0.1) {
            outputWidth = 1920; outputHeight = 720;
          } else if (Math.abs(aspectRatio - 0.8) < 0.1) {
            outputWidth = 1080; outputHeight = 1350;
          } else {
            outputWidth = 1200;
            outputHeight = Math.round(1200 / aspectRatio);
          }
        }
      } else {
        // For free-form, use cropped pixels but cap for performance
        const MAX_DIM = 2000;
        const scale = Math.min(MAX_DIM / croppedAreaPixels.width, MAX_DIM / croppedAreaPixels.height, 1);
        outputWidth = Math.round(croppedAreaPixels.width * scale);
        outputHeight = Math.round(croppedAreaPixels.height * scale);
      }

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      // Fill background white for transparent images (common for logos/banners)
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        outputWidth,
        outputHeight
      );

      canvas.toBlob((blob) => {
        const croppedFile = new File([blob], "cropped_image.jpg", { type: "image/jpeg" });
        const syntheticEvent = { target: { files: [croppedFile] } };
        onFileChange(syntheticEvent, id);
        setImageToCrop(null);
        setIsProcessing(false);
      }, "image/jpeg", 0.92);
    } catch (e) {
      console.error("Crop error:", e);
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full mb-6">
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 dark:bg-black/90 backdrop-blur-xl p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl flex flex-col h-[90vh] bg-white dark:bg-[#121212] rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-black/40">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <FiMaximize2 size={20} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-gray-900 dark:text-white font-bold text-lg leading-tight">
                    Refine Image
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">Crop and zoom to fit the layout perfectly</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setImageToCrop(null);
                  setZoom(1);
                }}
                className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Cropper Container */}
            <div className="relative flex-1 bg-gray-50 dark:bg-[#0a0a0a]">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={lockAspect ? aspectRatio : undefined}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Controls */}
            <div className="p-4 sm:p-6 bg-white dark:bg-[#121212] border-t border-gray-100 dark:border-white/10 overflow-y-auto max-h-[40vh] sm:max-h-none">
              <div className="max-w-4xl mx-auto space-y-5 sm:space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8 items-end">
                  {/* Zoom Control */}
                  <div className="space-y-2 sm:space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        Zoom
                      </label>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg">
                        {Math.round(zoom * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FiZoomOut className="text-gray-400" size={14} />
                      <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.01}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 h-1 bg-gray-100 dark:bg-white/5 rounded-full appearance-none cursor-pointer accent-indigo-500"
                      />
                      <FiZoomIn className="text-gray-400" size={14} />
                    </div>
                  </div>

                  {/* Aspect Ratio Toggle */}
                  <div className="space-y-2 sm:space-y-4">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block">
                      Aspect Ratio
                    </label>
                    <div className="flex p-1 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => setLockAspect(true)}
                        className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${lockAspect
                          ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                          : "text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          }`}
                      >
                        <FiMinimize2 size={12} className="shrink-0" />
                        <span className="truncate max-w-[100px] sm:max-w-none">
                          {aspectRatio === 1 ? "Square (1:1)" : aspectRatio === 16 / 9 ? "16:9" : resolution || `Locked (${aspectRatio?.toFixed(1) || 1})`}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLockAspect(false)}
                        className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${!lockAspect
                          ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                          : "text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          }`}
                      >
                        <FiMaximize2 size={12} className="shrink-0" /> <span className="truncate">Free</span>
                      </button>
                    </div>
                  </div>

                  {/* Reset Button */}
                  <div className="flex justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={resetCropper}
                      className="flex items-center justify-center w-full sm:w-auto gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 sm:bg-transparent sm:dark:bg-transparent rounded-xl sm:rounded-none text-xs font-bold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors group border border-gray-100 dark:border-white/5 sm:border-none"
                    >
                      <FiRefreshCcw size={14} className="group-hover:rotate-[-45deg] transition-transform" />
                      Reset View
                    </button>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-row items-center justify-between sm:justify-end gap-3 pt-5 sm:pt-6 border-t border-gray-100 dark:border-white/5">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => {
                      setImageToCrop(null);
                      setZoom(1);
                    }}
                    className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-gray-500 dark:text-gray-400 font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-50 text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={createCroppedImage}
                    className="flex-[2] sm:flex-none px-4 sm:px-10 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:bg-indigo-400 whitespace-nowrap"
                  >
                    {isProcessing ? (
                      <>
                        <FiLoader size={18} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiCheck size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <label className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-3">
        {label}
        {info && <InfoTooltip note={info} />}
      </label>

      <div
        className={`relative flex items-center justify-between p-5 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border-2 border-dashed ${error ? "border-red-500/50 bg-red-50/10" : "border-gray-200 dark:border-white/10 hover:border-indigo-500/50 dark:hover:border-indigo-500/50"
          } transition-all group/container`}
      >
        {!preview ? (
          <div className="flex flex-1 items-center gap-6">
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-gray-500 group-hover/container:text-indigo-500 transition-colors">
              <FiUpload size={24} />
            </div>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Drag and drop or <span className="text-gray-900 dark:text-white font-bold cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onClick={() => fileInputRef.current.click()}>browse</span>
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{acceptedFiles.replace(/\./g, "")}</p>
                  {resolution && (
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/10" />
                  )}
                  {resolution && <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{resolution}</p>}
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-end sm:text-right" >
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Max Size</p>
                {maxSizeMB && <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{maxSizeMB} MB</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 flex-1">
            {!isDocument && previewUrl && (
              <div
                className={`relative group rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden bg-black/5 dark:bg-black/20 shadow-inner ${aspectRatio ? "" : "w-14 h-14"
                  }`}
                style={aspectRatio ? {
                  width: aspectRatio > 1.5 ? "140px" : "80px",
                  aspectRatio: `${aspectRatio}`
                } : {}}
              >
                <img
                  src={previewUrl}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                  onClick={onPreviewClick}
                >
                  <FiEye className="text-white w-6 h-6 transform scale-75 group-hover:scale-100 transition-transform" />
                </div>
              </div>
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm text-gray-900 dark:text-white font-bold truncate pr-4">
                {typeof preview === "object" ? preview.name : "Uploaded Asset"}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                <span className="text-[10px] font-bold text-green-600 dark:text-green-500 uppercase tracking-wider">Ready to use</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${preview
              ? 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
              : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/10'
              }`}
          >
            {preview ? <FiRefreshCcw size={14} /> : <FiUpload size={14} />}
            <span className="hidden sm:inline">{preview ? "Replace" : "Select File"}</span>
          </button>
          {preview && (
            <button
              type="button"
              onClick={() => onRemove(id)}
              className="p-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-all border border-red-100 dark:border-red-500/10"
              title="Remove file"
            >
              <FiTrash2 size={16} />
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFiles}
          className="hidden"
          onChange={onInternalFileChange} // Points to our new internal handler
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
    </div>
  );
};

export default FileMediaInput;
