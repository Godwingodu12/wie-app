import React, { useRef, useState, useCallback } from "react";
import InfoTooltip from "./InfoTooltip";
import { FiTrash2, FiUpload, FiCheck, FiX, FiEye } from "react-icons/fi";
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
    try {
      const image = new Image();
      image.src = imageToCrop;
      await new Promise((res) => (image.onload = res));

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Output resolution based on aspect ratio:
      // 1920×720  → banner (aspectRatio = 16/9 ≈ 2.67)  — actually use 1920×720
      // 1080×1350 → portrait (aspectRatio = 4/5 = 0.8)
      // 1:1       → logo/square
      let outputWidth, outputHeight;

      if (Math.abs(aspectRatio - 16 / 9) < 0.1) {
        // Banner: 1920×1080
        outputWidth = 1920;
        outputHeight = 1080;
      } else if (Math.abs(aspectRatio - 1920 / 720) < 0.1) {
        // Legacy Banner: 1920×720
        outputWidth = 1920;
        outputHeight = 720;
      } else if (Math.abs(aspectRatio - 1080 / 1350) < 0.1 || Math.abs(aspectRatio - 3 / 4) < 0.1) {
        // Portrait: 1080×1350
        outputWidth = 1080;
        outputHeight = 1350;
      } else {
        // Default square (logo): 800×800
        outputWidth = 800;
        outputHeight = 800;
      }

      canvas.width = outputWidth;
      canvas.height = outputHeight;

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
      }, "image/jpeg", 0.92);
    } catch (e) {
      console.error("Crop error:", e);
    }
  };

  return (
    <div className="w-full mb-6">
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in">
          <div
            className={`relative w-full bg-[#1a1a1a]/90 backdrop-blur-xl rounded-t-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 border-x border-t border-white/10 ${aspectRatio >= 1 ? "max-w-xl sm:max-w-2xl" : "max-w-xs sm:max-w-sm"
              } h-[35vh] sm:h-[45vh] md:h-[50vh]`}
          >
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

          <div
            className={`w-full bg-[#2b2b2b]/90 backdrop-blur-xl p-4 sm:p-5 rounded-b-2xl flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 border-x border-b border-white/10 ${aspectRatio >= 1 ? "max-w-xl sm:max-w-2xl" : "max-w-xs sm:max-w-sm"
              }`}
          >
            {/* Unlock hint shown only when locked */}
            {lockAspect && (
              <div className="flex items-center justify-between bg-[#1e1e1e] rounded-lg px-3 py-2">
                <span className="text-xs text-gray-400">
                  🔒 Crop is locked to the recommended ratio. Unlock to crop freely from all sides.
                </span>
                <button
                  type="button"
                  onClick={() => setLockAspect(false)}
                  className="ml-3 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg whitespace-nowrap transition-colors"
                >
                  Unlock Crop
                </button>
              </div>
            )}

            {/* Unlocked hint */}
            {!lockAspect && (
              <div className="flex items-center justify-between bg-[#1e1e1e] rounded-lg px-3 py-2">
                <span className="text-xs text-gray-400">
                  🔓 Free crop enabled — drag any side or corner to resize.
                </span>
                <button
                  type="button"
                  onClick={() => setLockAspect(true)}
                  className="ml-3 px-3 py-1.5 text-xs font-semibold text-white bg-gray-600 hover:bg-gray-500 rounded-lg whitespace-nowrap transition-colors"
                >
                  Reset Ratio
                </button>
              </div>
            )}

            {/* Zoom + Action buttons */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-xs text-gray-400 whitespace-nowrap">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setImageToCrop(null);
                    setLockAspect(true); // reset for next time
                  }}
                  className="px-4 py-2 text-sm text-white bg-gray-700 rounded-lg hover:bg-gray-600 flex items-center gap-2"
                >
                  <FiX /> Cancel
                </button>
                <button
                  type="button"
                  onClick={createCroppedImage}
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-semibold"
                >
                  <FiCheck /> Save Crop
                </button>
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
        className={`relative flex items-center justify-between p-4 rounded-xl bg-transparent border-2 border-dashed border-gray-600 hover:border-indigo-500 transition-all ${error ? "border-red-500" : ""
          }`}
      >
        {/* ... (Existing Content Logic - Left & Middle) ... */}
        {!preview ? (
          <div className="flex gap-12">
            <div className="flex flex-col text-left">
              <p className="text-sm text-gray-400">
                Drag your file(s) or <span className="text-white font-semibold">browse</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">Only {acceptedFiles.replace(/\./g, "")} files allowed</p>
              {resolution && <p className="text-xs text-gray-500 italic">Resolution: ({resolution})</p>}
            </div>
            <div className="flex flex-col text-center" >
              <p className="text-sm text-gray-400"> Max Size</p>
              {maxSizeMB && <p className="text-xs text-gray-500 ">{maxSizeMB} MB</p>}
            </div>
          </div>

        ) : (
          <div className="flex items-center gap-4">
            {!isDocument && previewUrl && (
              <div 
                className={`relative group rounded border border-gray-600 overflow-hidden bg-black/20 ${
                  aspectRatio ? "" : "w-12 h-12"
                }`}
                style={aspectRatio ? { 
                  width: aspectRatio > 1 ? "120px" : "64px",
                  aspectRatio: `${aspectRatio}`
                } : {}}
              >
                <img
                  src={previewUrl}
                  alt="preview"
                  className="w-full h-full object-contain"
                />
                <div
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer"
                  onClick={onPreviewClick}
                >
                  <FiEye className="text-white w-5 h-5" />
                </div>
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm text-white font-medium truncate max-w-[150px]">
                {typeof preview === "object" ? preview.name : "Uploaded File"}
              </span>
              <span className="text-xs text-green-500">File uploaded</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className={`flex items-center gap-2 px-4 py-2 ${preview ? 'bg-[#333]' : 'bg-indigo-600'} text-white text-sm rounded-lg transition-colors`}
          >
            <FiUpload /> {preview ? "Replace" : "Browse file"}
          </button>
          {preview && (
            <button
              type="button"
              onClick={() => onRemove(id)}
              className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-lg transition-colors"
            >
              <FiTrash2 size={18} />
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
