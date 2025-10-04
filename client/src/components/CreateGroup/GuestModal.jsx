import { useState } from "react";
import { useEffect } from "react";

const GuestModal = ({
  isOpen,
  onClose,
  onSave,
  initialGuests,
  editingGuest: initialEditingGuest,
  darkMode,
}) => {
  const [localGuests, setLocalGuests] = useState(initialGuests || []);
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [photo, setPhoto] = useState(null);
  const [editingGuest, setEditingGuest] = useState(null);

  useEffect(() => {
    if (initialEditingGuest) {
      setEditingGuest(initialEditingGuest);
      setName(initialEditingGuest.name);
      setLink(initialEditingGuest.link || "");
      setPhoto(null);
    }
  }, [initialEditingGuest]);

  if (!isOpen) return null;

  const resetForm = () => {
    setName("");
    setLink("");
    setPhoto(null);
    setEditingGuest(null);
  };

  const handleFormSubmit = () => {
    if (!name.trim()) return;
    if (editingGuest) {
      setLocalGuests(
        localGuests.map((g) =>
          g.id === editingGuest.id
            ? {
                ...g,
                name: name.trim(),
                link: link.trim(),
                image: photo ? URL.createObjectURL(photo) : g.image,
                rawFile: photo || g.rawFile,
              }
            : g
        )
      );
    } else {
      const newGuest = {
        id: Date.now(),
        name: name.trim(),
        link: link.trim(),
        image: photo
          ? URL.createObjectURL(photo)
          : `https://i.pravatar.cc/150?u=${Date.now()}`,
        rawFile: photo,
      };
      setLocalGuests([...localGuests, newGuest]);
    }
    resetForm();
  };

  const handleDeleteGuest = (guestId) => {
    setLocalGuests((prev) => prev.filter((g) => g.id !== guestId));
  };

  const startEditing = (guest) => {
    setEditingGuest(guest);
    setName(guest.name);
    setLink(guest.link || "");
    setPhoto(null);
  };

  const handleSave = () => {
    onSave(localGuests);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div
        className={`rounded-2xl w-full max-w-4xl flex flex-col ${
          darkMode ? "bg-[#2B2B2B] text-gray-200" : "bg-white text-gray-800"
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                darkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            >
              👤
            </div>
            <div>
              <h3
                className={`font-bold text-lg ${
                  darkMode ? "text-white" : "text-black"
                }`}
              >
                {editingGuest ? "Edit Guest" : "Add Guest/Guide/Artists"}
              </h3>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-black"
                }`}
              >
                Manage your event's featured people.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`text-3xl leading-none ${
              darkMode
                ? "text-gray-400 hover:text-white"
                : "text-black hover:text-black"
            }`}
          >
            ×
          </button>
        </div>
        <div
          className={`border-b ${
            darkMode ? "border-gray-600" : "border-black"
          }`}
        ></div>
        <div className="flex p-4 h-[500px]">
          <div className="w-1/2 pr-4 flex flex-col">
            <div className="space-y-4">
              <div>
                <label
                  className={`${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  } text-sm`}
                >
                  Guest/Guide name <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  placeholder="Enter name"
                  className={`w-full mt-1 p-2 border rounded-lg ${
                    darkMode
                      ? "bg-gray-700 border-gray-600"
                      : "bg-gray-100 border-black"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  } text-sm`}
                >
                  Profile link (Optional)
                </label>
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  type="text"
                  placeholder="https://..."
                  className={`w-full mt-1 p-2 border rounded-lg ${
                    darkMode
                      ? "bg-gray-700 border-gray-600"
                      : "bg-gray-100 border-black"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Guest/Guide Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files[0])}
                  className={`w-full text-sm mt-1 p-2 border rounded-lg file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold ${
                    darkMode
                      ? "border-gray-600 file:bg-indigo-500/20 file:text-indigo-300"
                      : "border-black file:bg-indigo-100 file:text-indigo-700"
                  }`}
                />
              </div>
            </div>
            <div className="mt-auto flex justify-end pt-4">
              <button
                type="button"
                onClick={handleFormSubmit}
                className={`px-6 py-2 font-semibold rounded-lg flex items-center gap-2 ${
                  editingGuest
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                }`}
              >
                {editingGuest ? "Update Guest" : "Add Guest +"}
              </button>
            </div>
          </div>
          <div
            className={`border-l ${
              darkMode ? "border-gray-600" : "border-black"
            }`}
          ></div>
          <div className="w-1/2 pl-4 flex flex-col min-h-0">
            <div className="overflow-y-auto space-y-3 pr-2 custom-scrollbar h-full">
              {localGuests.length > 0 ? (
                localGuests.map((g) => (
                  <div
                    key={g.id}
                    className={`${
                      darkMode ? "bg-gray-700/50" : "bg-gray-100"
                    } rounded-lg p-3 flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={g.image}
                        alt={g.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="truncate">
                        <p
                          className={`font-semibold truncate ${
                            darkMode ? "text-white" : "text-black"
                          }`}
                        >
                          {g.name}
                        </p>
                        {g.link && (
                          <a
                            href={g.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-400 truncate block"
                          >
                            {g.link}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditing(g)}
                        className={`p-2 ${
                          darkMode
                            ? "text-gray-400 hover:text-white"
                            : "text-black hover:text-black"
                        }`}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGuest(g.id)}
                        className={`p-2 ${
                          darkMode
                            ? "text-red-400 hover:text-red-300"
                            : "text-red-500 hover:text-red-700"
                        }`}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-black pt-16">
                  No guests added yet.
                </div>
              )}
            </div>
          </div>
        </div>
        <div
          className={`border-t ${
            darkMode ? "border-gray-600" : "border-black"
          }`}
        ></div>
        <div className="flex justify-end items-center p-4 space-x-4">
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold text-white"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
export default GuestModal;