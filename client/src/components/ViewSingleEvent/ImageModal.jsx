import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMemo } from "react";
import formatImagePath from "./formatImagePath";

const ImageModal = ({
  images,
  currentIndex,
  onNext,
  onPrev,
  onClose,
  theme,
}) => {
  const imagePath = useMemo(() => {
    const imageObject = images?.[currentIndex];
    const rawPathString = imageObject?.path;
    return formatImagePath(rawPathString);
  }, [images, currentIndex]);

  if (
    !images ||
    images.length === 0 ||
    currentIndex < 0 ||
    currentIndex >= images.length
  ) {
    return null;
  }

  if (!imagePath) {
    console.error(
      "ImageModal: Failed to generate valid image path from data:",
      images?.[currentIndex]
    );
    return null;
  }

  return (
    <div
      // Backdrop remains dark/blurred
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md`}
      onClick={onClose}
    >
      <div
        className="relative flex items-center justify-center w-full h-full p-2 sm:p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (Top Right) - Now with INSET Shadow */}
        <button
          onClick={onClose}
          className={`absolute top-2 right-2 sm:top-4 sm:right-4 p-3 rounded-full transition-opacity hover:opacity-80 z-20 
                      ${theme.isDark ? 'text-white bg-gray-700' : 'text-gray-900 bg-white'}`}
          style={{
         
            boxShadow: theme.shadowInset,
          }}
        >
          <X size={24} />
        </button>

        {/* Left Arrow - Now with INSET Shadow */}
        {images.length > 1 && (
          <button
            onClick={onPrev}
            className={`absolute left-2 sm:left-4 p-3 rounded-full transition-opacity hover:opacity-80 z-20 
                        ${theme.isDark ? 'text-white bg-gray-700' : 'text-gray-900 bg-white'}`}
            style={{
          
              boxShadow: theme.shadowInset,
            }}
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Image Display */}
        <div 
          className="max-w-5xl max-h-[95vh] w-full h-full flex items-center justify-center relative"
        >
          <img
            src={imagePath}
            alt="Event Image"
            // The image itself does not typically take an inset shadow
            className="max-w-full max-h-full object-contain rounded-xl shadow-lg" 
          />

          {/* Index Indicator - Now with INSET Shadow */}
          <div
            className={`absolute bottom-2 sm:bottom-4 p-2 px-4 rounded-xl font-medium text-base sm:text-lg 
                        ${theme.isDark ? 'text-white bg-gray-700' : 'text-gray-900 bg-white'}`}
            style={{
             
              boxShadow: theme.shadowInset,
            }}
          >
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        {/* Right Arrow - Now with INSET Shadow */}
        {images.length > 1 && (
          <button
            onClick={onNext}
            className={`absolute right-2 sm:right-4 p-3 rounded-full transition-opacity hover:opacity-80 z-20 
                        ${theme.isDark ? 'text-white bg-gray-700' : 'text-gray-900 bg-white'}`}
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