import React, { useState } from "react";
import {
  Utensils,
  Hotel,
  Plus,
  Trash2,
  Edit3,
  Camera,
  Sparkles
} from "lucide-react";
import ToggleSwitch from "../CreateGroup/ToggleSwitch.jsx";
import { getTicketImageUrl } from "../../utils/imageUtils.js";

const FoodModal = ({
  formData,
  setFormData,
  foodAccoum,
  setFoodAccoum,
  foodAccoumType,
  setFoodAccoumType,
  foodDetails,
  setFoodDetails,
  accommodationDetails,
  setAccommodationDetails,
  darkMode
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("food"); // "food" or "accommodation"
  const [editingIndex, setEditingIndex] = useState(null);

  // Modal form states
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemMenu, setItemMenu] = useState(""); // Comma-separated list
  const [itemPhoto, setItemPhoto] = useState(null); // File object
  const [itemPhotoPreview, setItemPhotoPreview] = useState(""); // Base64 or URL

  const isObjectMode = !!formData;

  const currentFoodAccoum = isObjectMode ? (formData.food_accoum || false) : (foodAccoum || false);
  const currentFoodAccoumType = isObjectMode ? (formData.food_accoum_type || "none") : (foodAccoumType || "none");
  const currentFoodDetails = isObjectMode ? (formData.food_details || []) : (foodDetails || []);
  const currentAccommodationDetails = isObjectMode ? (formData.accommodation_details || []) : (accommodationDetails || []);

  const updateFoodAccoum = (val) => {
    if (isObjectMode) {
      setFormData((prev) => {
        return {
          ...prev,
          food_accoum: val,
          food_accoum_type: (val && prev.food_accoum_type === "none") ? "food_accommodation" : (val ? prev.food_accoum_type : "none")
        };
      });
    } else {
      setFoodAccoum(val);
      if (val && foodAccoumType === "none") {
        setFoodAccoumType("food_accommodation");
      } else if (!val) {
        setFoodAccoumType("none");
      }
    }
  };

  const updateFoodAccoumType = (val) => {
    if (isObjectMode) {
      setFormData((prev) => ({ ...prev, food_accoum_type: val }));
    } else {
      setFoodAccoumType(val);
    }
  };

  const updateFoodDetails = (val) => {
    if (isObjectMode) {
      setFormData((prev) => ({ ...prev, food_details: val }));
    } else {
      setFoodDetails(val);
    }
  };

  const updateAccommodationDetails = (val) => {
    if (isObjectMode) {
      setFormData((prev) => ({ ...prev, accommodation_details: val }));
    } else {
      setAccommodationDetails(val);
    }
  };

  const openAddModal = (type) => {
    setModalType(type);
    setEditingIndex(null);
    setItemName("");
    setItemPrice("");
    setItemQuantity("");
    setItemMenu("");
    setItemPhoto(null);
    setItemPhotoPreview("");
    setIsModalOpen(true);
  };

  const openEditModal = (type, index) => {
    setModalType(type);
    setEditingIndex(index);
    const item = type === "food" ? currentFoodDetails[index] : currentAccommodationDetails[index];
    setItemName(item.name || item.food_catering_name || item.accommodation_catering_name || "");
    setItemPrice(item.price || item.food_price || item.accommodation_price || "");
    setItemQuantity(item.quantity || item.food_quantity || item.accommodation_quantity || "");
    const menuArr = item.food_menu || item.accommodation_type || [];
    setItemMenu(menuArr.join(", "));
    setItemPhoto(null);
    setItemPhotoPreview(getTicketImageUrl(item.food_picture || item.accommodation_picture || ""));
    setIsModalOpen(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be smaller than 5MB");
        return;
      }
      setItemPhoto(file);
      setItemPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = () => {
    if (!itemName.trim()) {
      alert("Name is required");
      return;
    }
    if (itemPrice === "" || isNaN(itemPrice) || Number(itemPrice) < 0) {
      alert("Please enter a valid price");
      return;
    }
    if (itemQuantity === "" || isNaN(itemQuantity) || Number(itemQuantity) < 1) {
      alert("Please enter a valid quantity (minimum 1)");
      return;
    }

    const menuItems = itemMenu
      ? itemMenu.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const newItem = {
      name: itemName.trim(),
      price: Number(itemPrice),
      quantity: Number(itemQuantity),
      file: itemPhoto, // Holds actual File object
    };

    if (modalType === "food") {
      newItem.food_catering_name = itemName.trim();
      newItem.food_price = Number(itemPrice);
      newItem.food_quantity = Number(itemQuantity);
      newItem.food_menu = menuItems;
      newItem.food_picture = itemPhotoPreview;

      const updated = [...currentFoodDetails];
      if (editingIndex !== null) {
        if (!itemPhoto) {
          newItem.file = updated[editingIndex].file;
        }
        updated[editingIndex] = newItem;
      } else {
        updated.push(newItem);
      }
      updateFoodDetails(updated);
    } else {
      newItem.accommodation_catering_name = itemName.trim();
      newItem.accommodation_price = Number(itemPrice);
      newItem.accommodation_quantity = Number(itemQuantity);
      newItem.accommodation_type = menuItems;
      newItem.accommodation_picture = itemPhotoPreview;

      const updated = [...currentAccommodationDetails];
      if (editingIndex !== null) {
        if (!itemPhoto) {
          newItem.file = updated[editingIndex].file;
        }
        updated[editingIndex] = newItem;
      } else {
        updated.push(newItem);
      }
      updateAccommodationDetails(updated);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (type, index) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      if (type === "food") {
        updateFoodDetails(currentFoodDetails.filter((_, i) => i !== index));
      } else {
        updateAccommodationDetails(currentAccommodationDetails.filter((_, i) => i !== index));
      }
    }
  };

  return (
    <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-800">

      {/* ─── FOOD & ACCOMMODATION OPTION ─── */}
      <div className="bg-white dark:bg-[#1E2124] p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <label className="font-semibold text-gray-900 dark:text-white text-md">
                Offer Food & Accommodation options?
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Enable this to configure food catering packages or hotel lodgings for event attendees.
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={currentFoodAccoum}
            onChange={() => updateFoodAccoum(!currentFoodAccoum)}
            darkMode={darkMode}
          />
        </div>

        {currentFoodAccoum && (
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800/60 space-y-6 animate-fade-in">
            {/* Sub-options selection */}
            <div>
              <span className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                Select Option Type
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: "food_accommodation", label: "Food & Accommodation", icon: Sparkles },
                  { value: "food_only", label: "Food Only", icon: Utensils },
                  { value: "accommodation_only", label: "Accommodation Only", icon: Hotel },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = currentFoodAccoumType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateFoodAccoumType(opt.value)}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium transition-all duration-300 ${isSelected
                          ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm"
                          : "bg-gray-50 dark:bg-[#181A1C] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700"
                        }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Food Items section */}
            {(currentFoodAccoumType === "food_accommodation" || currentFoodAccoumType === "food_only") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-indigo-500" />
                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                      Food Catering Packages
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAddModal("food")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Food Option
                  </button>
                </div>

                {currentFoodDetails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-gray-50 dark:bg-[#181A1C] border border-dashed border-gray-200 dark:border-gray-800 text-center">
                    <Utensils className="w-8 h-8 text-gray-400 dark:text-gray-600 mb-2" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">No food options added yet</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">Configure menus, prices, and photo previews.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentFoodDetails.map((item, idx) => (
                      <div key={idx} className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#181A1C] border border-gray-200 dark:border-gray-800 relative group overflow-hidden">
                        <div className="w-20 h-20 rounded-lg bg-gray-200 dark:bg-[#2A2E33] shrink-0 overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-700">
                          {item.food_picture ? (
                            <img src={getTicketImageUrl(item.food_picture)} alt={item.name || item.food_catering_name || ""} className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.name || item.food_catering_name || ""}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                              Qty Available: <span className="text-gray-800 dark:text-gray-200">{item.quantity !== undefined ? item.quantity : (item.food_quantity ?? "")}</span>
                            </p>
                            {item.food_menu && item.food_menu.length > 0 && (
                              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-1">
                                Menu: {item.food_menu.join(", ")}
                              </p>
                            )}
                          </div>
                          <div className="font-semibold text-indigo-600 dark:text-indigo-400 text-sm mt-1">
                            ₹{item.price !== undefined ? item.price : (item.food_price ?? "")}
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-[#1E2124]/90 p-1 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                          <button
                            type="button"
                            onClick={() => openEditModal("food", idx)}
                            className="p-1 rounded text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete("food", idx)}
                            className="p-1 rounded text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Accommodation Items section */}
            {(currentFoodAccoumType === "food_accommodation" || currentFoodAccoumType === "accommodation_only") && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hotel className="w-4 h-4 text-indigo-500" />
                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                      Lodging / Accommodation Packages
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAddModal("accommodation")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Lodging Option
                  </button>
                </div>

                {currentAccommodationDetails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-gray-50 dark:bg-[#181A1C] border border-dashed border-gray-200 dark:border-gray-800 text-center">
                    <Hotel className="w-8 h-8 text-gray-400 dark:text-gray-600 mb-2" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">No accommodation options added yet</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">Configure room types, price per night, and photos.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentAccommodationDetails.map((item, idx) => (
                      <div key={idx} className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#181A1C] border border-gray-200 dark:border-gray-800 relative group overflow-hidden">
                        <div className="w-20 h-20 rounded-lg bg-gray-200 dark:bg-[#2A2E33] shrink-0 overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-700">
                          {item.accommodation_picture ? (
                            <img src={getTicketImageUrl(item.accommodation_picture)} alt={item.name || item.accommodation_catering_name || ""} className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.name || item.accommodation_catering_name || ""}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                              Rooms Available: <span className="text-gray-800 dark:text-gray-200">{item.quantity !== undefined ? item.quantity : (item.accommodation_quantity ?? "")}</span>
                            </p>
                            {item.accommodation_type && item.accommodation_type.length > 0 && (
                              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-1">
                                Types: {item.accommodation_type.join(", ")}
                              </p>
                            )}
                          </div>
                          <div className="font-semibold text-indigo-600 dark:text-indigo-400 text-sm mt-1">
                            ₹{item.price !== undefined ? item.price : (item.accommodation_price ?? "")}
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-[#1E2124]/90 p-1 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                          <button
                            type="button"
                            onClick={() => openEditModal("accommodation", idx)}
                            className="p-1 rounded text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete("accommodation", idx)}
                            className="p-1 rounded text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── ADD / EDIT MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#1E2124] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden transform scale-100 transition-all duration-300">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {modalType === "food" ? <Utensils className="w-5 h-5 text-indigo-500" /> : <Hotel className="w-5 h-5 text-indigo-500" />}
                {editingIndex !== null ? "Edit Option" : "Add New Option"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 font-bold text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Option Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-xl bg-gray-50 dark:bg-[#181A1C] border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                    {itemPhotoPreview ? (
                      <img src={itemPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <label className="inline-block px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer transition-colors shadow-sm">
                      Choose Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-gray-400 mt-1.5">PNG, JPG or WEBP. Max 5MB.</p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Package Name / Catering Name
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder={modalType === "food" ? "e.g. Deluxe Dinner Box" : "e.g. Premium Double Room"}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#181A1C] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Price */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#181A1C] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Quantity Available
                  </label>
                  <input
                    type="number"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                    placeholder="100"
                    min="1"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#181A1C] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Sub-options list */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span>{modalType === "food" ? "Food Menu / Items" : "Lodging Details / Room Types"}</span>
                </label>
                <input
                  type="text"
                  value={itemMenu}
                  onChange={(e) => setItemMenu(e.target.value)}
                  placeholder={modalType === "food" ? "Fried Rice, Ice Cream..." : "AC Room, Double Bed, Free Wifi..."}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#181A1C] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-[#181A1C] border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodModal;
