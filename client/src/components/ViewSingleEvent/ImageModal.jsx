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
  const imagePath = useMemo(() => {
    if (!images || images.length === 0 || currentIndex < 0 || currentIndex >= images.length) {
      return null;
    }

    const imageObject = images[currentIndex];
    
    // Handle if it's an object with path property (banner, logo, event_images)
    if (typeof imageObject === 'object' && imageObject.path) {
      const path = imageObject.path;
      // If it's already a full URL (Cloudinary), return as is
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
      }
    }
    
    // Handle if it's already a string URL
    if (typeof imageObject === 'string') {
      if (imageObject.startsWith('http://') || imageObject.startsWith('https://')) {
        return imageObject;
      }
    }
    
    // Fallback
    return null;
  }, [images, currentIndex]);

  const imageInfo = useMemo(() => {
    if (!images || !images[currentIndex]) return null;
    const img = images[currentIndex];
    
    if (typeof img === 'object') {
      return {
        name: img.name || img.originalName || 'Image',
        type: img.type || 'image'
      };
    }
    
    return { name: 'Image', type: 'image' };
  }, [images, currentIndex]);

  if (
    !images ||
    images.length === 0 ||
    currentIndex < 0 ||
    currentIndex >= images.length
  ) {
    if (setAppAlert) {
      setAppAlert({
        message: "Missing Data",
        description: "No images were provided to the viewer.",
        type: "error",
        show: true,
      });
    }
    return null;
  }

  if (!imagePath) {
    console.error(
      "ImageModal: Failed to generate valid image path from data:",
      images?.[currentIndex]
    );
    if (setAppAlert) {
      setAppAlert({
        message: "Image Load Failed",
        description: "Could not load image file from the specified path.",
        type: "error",
        show: true,
      });
    }
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md`}
      onClick={onClose}
    >
      <div
        className="relative flex items-center justify-center w-full h-full p-2 sm:p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (Top Right) */}
        <button
          onClick={onClose}
          className={`absolute top-2 right-2 sm:top-4 sm:right-4 p-3 rounded-full transition-opacity hover:opacity-80 z-20 
                      ${
                        theme.isDark
                          ? "text-white bg-gray-700"
                          : "text-gray-900 bg-white"
                      }`}
          style={{
            boxShadow: theme.shadowInset,
          }}
        >
          <X size={24} />
        </button>

        {/* Left Arrow */}
        {images.length > 1 && (
          <button
            onClick={onPrev}
            className={`absolute left-2 sm:left-4 p-3 rounded-full transition-opacity hover:opacity-80 z-20 
                        ${
                          theme.isDark
                            ? "text-white bg-gray-700"
                            : "text-gray-900 bg-white"
                        }`}
            style={{
              boxShadow: theme.shadowInset,
            }}
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Image Display */}
        <div className="max-w-5xl max-h-[95vh] w-full h-full flex flex-col items-center justify-center relative">
          <img
            src={imagePath}
            alt={imageInfo?.name || "Event Image"}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-lg"
            onError={(e) => {
              console.error("Failed to load image:", imagePath);
              e.target.src = "https://via.placeholder.com/800x600?text=Image+Not+Found";
            }}
          />

          {/* Image Info Label */}
          {imageInfo && (
            <div
              className={`mt-4 p-2 px-4 rounded-xl font-medium text-sm
                          ${
                            theme.isDark
                              ? "text-white bg-gray-700"
                              : "text-gray-900 bg-white"
                          }`}
              style={{
                boxShadow: theme.shadowInset,
              }}
            >
              {imageInfo.name}
              {imageInfo.type && (
                <span className="ml-2 text-xs opacity-60">
                  ({imageInfo.type})
                </span>
              )}
            </div>
          )}

          {/* Index Indicator */}
          <div
            className={`absolute bottom-2 sm:bottom-4 p-2 px-4 rounded-xl font-medium text-base sm:text-lg 
                        ${
                          theme.isDark
                            ? "text-white bg-gray-700"
                            : "text-gray-900 bg-white"
                        }`}
            style={{
              boxShadow: theme.shadowInset,
            }}
          >
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        {/* Right Arrow */}
        {images.length > 1 && (
          <button
            onClick={onNext}
            className={`absolute right-2 sm:right-4 p-3 rounded-full transition-opacity hover:opacity-80 z-20 
                        ${
                          theme.isDark
                            ? "text-white bg-gray-700"
                            : "text-gray-900 bg-white"
                        }`}
            style={{
              boxShadow: theme.shadowInset,
            }}
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
};
export default ImageModal;
