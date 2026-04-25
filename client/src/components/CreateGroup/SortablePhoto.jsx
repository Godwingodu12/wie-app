import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiEye } from "react-icons/fi";

const SortablePhoto = ({
  img,
  onRemove,
  isReordering,
  targetField,
  onPreview,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: img.id,
    disabled: !isReordering,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isReordering ? "grab" : "pointer",
    touchAction: "none",
  };

  const isVideo =
    targetField === "event_videos" ||
    img.type?.startsWith("video");

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative aspect-square rounded-lg overflow-hidden border border-gray-700 bg-black"
      onClick={() => !isReordering && onPreview?.(img)}
    >
      {/* IMAGE PREVIEW */}
      {!isVideo && (
        <>
          <img
            src={img.preview}
            alt="preview"
            className="w-full h-full object-cover"
          />
          {!isReordering && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <FiEye className="text-white w-6 h-6" />
            </div>
          )}
        </>
      )}

      {/* VIDEO PREVIEW */}
      {isVideo && (
        <video
          src={img.preview}
          className="w-full h-full object-cover"
          controls
          preload="metadata"
        />
      )}

      {/* Remove button */}
      {!isReordering && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(img.id, targetField);
          }}
          className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs z-10"
        >
          &times;
        </button>
      )}
    </div>
  );
};
export default SortablePhoto;
