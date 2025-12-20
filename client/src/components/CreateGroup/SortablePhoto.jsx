import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortablePhoto = ({ img, onRemove, isReordering, targetField }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: img.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isReordering ? "grab" : "default",
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isReordering ? { ...attributes, ...listeners } : {})}
      className="relative aspect-square rounded-lg overflow-hidden border border-gray-700 group"
    >
      <img src={img.preview} className="w-full h-full object-cover" alt="gallery" />
      
      {/* Show play icon if it's a video */}
      {targetField === 'event_videos' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <span className="text-white">▶</span>
        </div>
      )}

      {/* Only show remove button if NOT reordering */}
      {!isReordering && (
        <button
          type="button"
          onClick={() => onRemove(img.id, targetField)}
          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs z-10"
        >
          &times;
        </button>
      )}
    </div>
  );
};
export default SortablePhoto;