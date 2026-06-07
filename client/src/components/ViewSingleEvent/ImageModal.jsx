import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMemo } from "react";

const ImageModal = ({
  images,
  currentIndex,
  onNext,
  onPrev,
  onClose,
  theme,
  setAppAlert,
}) => {
  // ── Resolves the current item into { path, previewImage, isVideo } ──
  const mediaData = useMemo(() => {
    if (
      !images ||
      images.length === 0 ||
      currentIndex < 0 ||
      currentIndex >= images.length
    )
      return null;

    const item = images[currentIndex];

    const resolvePath = (p) => {
      if (
        typeof p === "string" &&
        (p.startsWith("http://") || p.startsWith("https://"))
      )
        return p;
      return null;
    };

    if (typeof item === "object" && item !== null) {
      return {
        path: resolvePath(item.path),
        previewImage: resolvePath(item.previewImage) || null,
        isVideo: item.type === "video",
        name: item.name || item.originalName || "Media",
        type: item.type || "image",
      };
    }

    if (typeof item === "string") {
      return {
        path: resolvePath(item),
        previewImage: null,
        isVideo: false,
        name: "Image",
        type: "image",
      };
    }

    return null;
  }, [images, currentIndex]);

  // ── Early-exit guards ──
  if (
    !images ||
    images.length === 0 ||
    currentIndex < 0 ||
    currentIndex >= images.length
  ) {
    if (setAppAlert) {
      setAppAlert({
        message: "Missing Data",
        description: "No media was provided to the viewer.",
        type: "error",
        show: true,
      });
    }
    return null;
  }

  if (!mediaData || (!mediaData.path && !mediaData.previewImage)) {
    console.error(
      "ImageModal: Failed to resolve media from:",
      images?.[currentIndex]
    );
    if (setAppAlert) {
      setAppAlert({
        message: "Media Load Failed",
        description: "Could not load the file from the specified path.",
        type: "error",
        show: true,
      });
    }
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative flex items-center justify-center w-full h-full p-2 sm:p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Close Button ── */}
        <button
          onClick={onClose}
          className={`absolute top-2 right-2 sm:top-4 sm:right-4 p-3 rounded-full z-20
            transition-opacity hover:opacity-80
            ${theme.isDark ? "text-white bg-gray-700" : "text-gray-900 bg-white"}`}
          style={{ boxShadow: theme.shadowInset }}
        >
          <X size={24} />
        </button>

        {/* ── Left Arrow ── */}
        {images.length > 1 && (
          <button
            onClick={onPrev}
            className={`absolute left-2 sm:left-4 p-3 rounded-full z-20
              transition-opacity hover:opacity-80
              ${theme.isDark ? "text-white bg-gray-700" : "text-gray-900 bg-white"}`}
            style={{ boxShadow: theme.shadowInset }}
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* ── Main Media Area ── */}
        <div className="max-w-5xl max-h-[95vh] w-full h-full flex flex-col items-center justify-center relative">

          {mediaData.isVideo ? (
            /* ════════════ VIDEO ════════════ */
            <div className="flex flex-col items-center w-full">
              {mediaData.path ? (
                <video
                  key={mediaData.path}   /* forces remount on index change */
                  controls
                  autoPlay={false}
                  poster={mediaData.previewImage || undefined}
                  className="rounded-xl shadow-lg"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "75vh",
                    width: "auto",
                    objectFit: "contain",
                    background: "#000",
                  }}
                  onError={(e) =>
                    console.error("Video load error:", mediaData.path)
                  }
                >
                  <source src={mediaData.path} />
                  Your browser does not support the video tag.
                </video>
              ) : mediaData.previewImage ? (
                /* Fallback: only preview image available */
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={mediaData.previewImage}
                    alt={mediaData.name}
                    className="rounded-xl shadow-lg"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "70vh",
                      objectFit: "contain",
                    }}
                  />
                  <p className="text-yellow-400 text-sm">
                    ⚠ Video file unavailable — showing preview image
                  </p>
                </div>
              ) : (
                /* No path, no preview */
                <div
                  className={`flex flex-col items-center justify-center rounded-xl w-72 h-48
                    ${theme.isDark ? "bg-gray-800 text-gray-400" : "bg-gray-200 text-gray-600"}`}
                >
                  <span className="text-5xl mb-3">🎬</span>
                  <span className="text-sm">Video unavailable</span>
                </div>
              )}
            </div>
          ) : (
            /* ════════════ IMAGE ════════════ */
            <img
              src={mediaData.path}
              alt={mediaData.name}
              className="rounded-xl shadow-lg"
              style={
                mediaData.type === "banner"
                  ? {
                      width: "100%",
                      maxWidth: "100%",
                      aspectRatio: "1920 / 720",
                      height: "auto",
                      objectFit: "fill",
                    }
                  : {
                      maxWidth: "100%",
                      maxHeight: "85vh",
                      width: "auto",
                      height: "auto",
                      objectFit: "contain",
                    }
              }
              onError={(e) => {
                console.error("Image load error:", mediaData.path);
                e.target.src =
                  "https://via.placeholder.com/800x600?text=Image+Not+Found";
              }}
            />
          )}

          {/* ── Name / Type Label ── */}
          <div
            className={`mt-4 p-2 px-4 rounded-xl font-medium text-sm
              ${theme.isDark ? "text-white bg-gray-700" : "text-gray-900 bg-white"}`}
            style={{ boxShadow: theme.shadowInset }}
          >
            {mediaData.name}
            {mediaData.type && (
              <span className="ml-2 text-xs opacity-60">
                ({mediaData.type})
              </span>
            )}
          </div>

          {/* ── Index Indicator ── */}
          <div
            className={`absolute bottom-2 sm:bottom-4 p-2 px-4 rounded-xl font-medium text-base sm:text-lg
              ${theme.isDark ? "text-white bg-gray-700" : "text-gray-900 bg-white"}`}
            style={{ boxShadow: theme.shadowInset }}
          >
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        {/* ── Right Arrow ── */}
        {images.length > 1 && (
          <button
            onClick={onNext}
            className={`absolute right-2 sm:right-4 p-3 rounded-full z-20
              transition-opacity hover:opacity-80
              ${theme.isDark ? "text-white bg-gray-700" : "text-gray-900 bg-white"}`}
            style={{ boxShadow: theme.shadowInset }}
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageModal;
