import React, { useEffect, useState } from "react";

// Helper Icon
const ProhibitedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
);

// Reusable Confirmation Modal
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, darkMode }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[110] p-4">
            <div className={`rounded-xl w-full max-w-md p-6 space-y-4 ${darkMode ? "bg-[#1E1E1E] text-gray-200 border border-gray-700" : "bg-white text-gray-800"}`}>
                <h3 className="text-xl font-bold">{title}</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{message}</p>
                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors">Confirm</button>
                </div>
            </div>
        </div>
    );
};

const ProhibitedItemsModal = ({ isOpen, onClose, onSave, initialItems, darkMode }) => {
  const [selectedItems, setSelectedItems] = useState(initialItems || []);
  const [customItem, setCustomItem] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const suggestions = [ "Umbrellas", "Wooden sticks", "Power bank", "Helmets", "Glass containers", "Laptops", "Laser pointer/Flashlight", "Outside food", "Alcohol", "Music instrument", "Toxics", "Chemicals", "Camera", "Selfie sticks", "Metal containers", "Bags", "Flammable", "Banners", "Cans", "Tins", "Bottles" ];

  useEffect(() => {
    if (isOpen) {
        setSelectedItems(initialItems || []);
    }
  }, [isOpen, initialItems]);

  const toggleItem = (item) => setSelectedItems((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
  
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
    setIsConfirmOpen(true);
  };
  
  const executeReset = () => {
    setSelectedItems([]);
    setCustomItem("");
    setIsConfirmOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className={`rounded-2xl w-full max-w-3xl flex flex-col max-h-[90vh] ${darkMode ? "bg-[#2B2B2B] text-gray-200" : "bg-white text-gray-800"}`}>
          <div className={`flex-shrink-0 flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? "bg-gray-700 text-red-400" : "bg-red-100 text-red-600"}`}>
                <ProhibitedIcon />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${darkMode ? "text-white" : "text-black"}`}>Add Prohibited Items</h3>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Select or add items that are not allowed.</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className={`text-3xl leading-none ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"}`}>&times;</button>
          </div>
          
          <div className="flex-grow p-4 space-y-4 overflow-y-auto custom-scrollbar">
            <div className={`min-h-[80px] rounded-lg p-3 flex flex-wrap gap-2 border ${darkMode ? "bg-black/20 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              {selectedItems.map((item) => (
                <div key={item} className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm h-fit ${darkMode ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-100 text-indigo-800"}`}>
                  <span>{item}</span>
                  <button type="button" onClick={() => toggleItem(item)} className="font-bold text-lg leading-none text-indigo-400 hover:text-indigo-200">&times;</button>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <input
                  value={customItem}
                  onChange={(e) => setCustomItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                  type="text"
                  placeholder="Enter a custom item..."
                  className={`w-full p-3 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"}`}
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustom}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
              >
                Add <span className="text-xl">+</span>
              </button>
            </div>
            
            <div className="flex flex-wrap gap-3 pt-2">
              {suggestions.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => toggleItem(item)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
                >
                  {item} <span className="text-lg">+</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className={`flex-shrink-0 flex justify-end items-center p-4 space-x-4 border-t ${darkMode ? "border-gray-700" : "border-gray-300"}`}>
            <button type="button" onClick={handleReset} className={`px-6 py-2 rounded-lg font-semibold transition-colors ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}>Reset</button>
            <button type="button" onClick={onClose} className={`px-6 py-2 rounded-lg font-semibold transition-colors ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}>Cancel</button>
            <button type="button" onClick={handleSave} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white">Save</button>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeReset}
        title="Confirm Reset"
        message="Are you sure you want to clear all prohibited items?"
        darkMode={darkMode}
      />
    </>
  );
};

export default ProhibitedItemsModal;