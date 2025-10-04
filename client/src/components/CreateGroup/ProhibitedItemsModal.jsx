import { useState } from "react";

const ProhibitedItemsModal = ({
  isOpen,
  onClose,
  onSave,
  initialItems,
  darkMode,
}) => {
  const [selectedItems, setSelectedItems] = useState(initialItems || []);
  const [customItem, setCustomItem] = useState("");
  const suggestions = [
    "Umbrellas",
    "Wooden sticks",
    "Power bank",
    "Helmets",
    "Glass containers",
    "Laptops",
    "Laser pointer/Flashlight",
    "Outside food",
    "Alcohol",
    "Music instrument",
    "Toxics",
    "Chemicals",
    "Camera",
    "Selfie sticks",
    "Metal containers",
    "Bags",
    "Flammable",
    "Banners",
    "Cans",
    "Tins",
    "Bottles",
  ];

  if (!isOpen) return null;
  const toggleItem = (item) =>
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  const handleAddCustom = () => {
    if (customItem.trim() && !selectedItems.includes(customItem.trim())) {
      setSelectedItems((prev) => [...prev, customItem.trim()]);
      setCustomItem("");
    }
  };
  const handleSave = () => {
    onSave(selectedItems);
    onClose();
  };
  const handleReset = () => {
    setSelectedItems([]);
    setCustomItem("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div
        className={`rounded-2xl w-full max-w-3xl flex flex-col ${
          darkMode ? "bg-[#2B2B2B] text-gray-200" : "bg-white text-gray-800"
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                darkMode
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              🚫
            </div>
            <div>
              <h3
                className={`font-bold text-lg ${
                  darkMode ? "text-white" : "text-black"
                }`}
              >
                Add prohibited items
              </h3>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-black"
                }`}
              >
                Add items that are not allowed
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
        <div className="p-4 space-y-4">
          <div
            className={`min-h-[80px] rounded-lg p-3 flex flex-wrap gap-2 border ${
              darkMode
                ? "bg-gray-800/50 border-gray-700"
                : "bg-gray-100/50 border-gray-200"
            }`}
          >
            {selectedItems.map((item) => (
              <div
                key={item}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm h-fit ${
                  darkMode
                    ? "bg-gray-600 text-gray-200"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => toggleItem(item)}
                  className={`font-bold text-lg leading-none ${
                    darkMode
                      ? "text-gray-400 hover:text-white"
                      : "text-black hover:text-black"
                  }`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <input
                value={customItem}
                onChange={(e) => setCustomItem(e.target.value)}
                type="text"
                placeholder="Enter the name here..."
                className={`w-full pl-3 pr-10 py-2 border rounded-lg ${
                  darkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-gray-100 border-black"
                }`}
              />
              <div
                className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                  darkMode ? "text-gray-400" : "text-black"
                }`}
              >
                *
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddCustom}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg flex items-center gap-2"
            >
              Add <span className="text-xl">+</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {suggestions.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => toggleItem(item)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                {item} <span className="text-lg">+</span>
              </button>
            ))}
          </div>
        </div>
        <div
          className={`flex justify-end items-center p-4 mt-2 space-x-4 border-t ${
            darkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <button
            type="button"
            onClick={handleReset}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            Reset all
          </button>
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
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProhibitedItemsModal;