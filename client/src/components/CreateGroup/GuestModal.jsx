import { useState, useEffect } from "react";

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
  const [photoPreview, setPhotoPreview] = useState(null);
  const [editingGuest, setEditingGuest] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_TICKET_API_BASE_URL;

  const getImageUrl = (path) => {
    if (!path) return null;
    
    // If it's already a blob URL or full URL, return as is
    if (typeof path === 'string' && (path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://'))) {
      return path;
    }
    
    if (typeof path === 'object') {
      path = path.path || path.url || null;
    }
    
    if (typeof path !== 'string') {
      console.warn('Invalid path type:', typeof path, path);
      return null;
    }
    
    let cleanPath = path.replace(/\\/g, '/');
    cleanPath = cleanPath.replace(/^src\//, '');
    cleanPath = cleanPath.replace(/^\//, '');
    const fullUrl = `${API_BASE_URL}/${cleanPath}`;
    return fullUrl;
  };
  const getGuestImage = (guest) => {
    // Priority: blob preview > server path > fallback
    if (guest.image && guest.image.startsWith('blob:')) {
      return guest.image; // New upload preview
    }
    
    const serverPath = guest.guest_profile || guest.image;
    if (serverPath) {
      const imageUrl = getImageUrl(serverPath);
      if (imageUrl) return imageUrl;
    }
    
    // Fallback to avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(guest.name || guest.guest_name || 'Guest')}&background=random`;
  };

  useEffect(() => {
    if (initialEditingGuest) {
      setEditingGuest(initialEditingGuest);
      setName(initialEditingGuest.name || initialEditingGuest.guest_name || "");
      setLink(initialEditingGuest.link || initialEditingGuest.guest_link || "");
      setPhoto(null);
      
      // Set photo preview from existing image
      const existingImage = initialEditingGuest.image || initialEditingGuest.guest_profile;
      setPhotoPreview(getImageUrl(existingImage));
    }
  }, [initialEditingGuest]);

  // Sync localGuests when initialGuests changes
  useEffect(() => {
    setLocalGuests(initialGuests || []);
  }, [initialGuests]);

  if (!isOpen) return null;

  const resetForm = () => {
    setName("");
    setLink("");
    setPhoto(null);
    setPhotoPreview(null);
    setEditingGuest(null);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      // Create blob URL for immediate preview
      const blobUrl = URL.createObjectURL(file);
      setPhotoPreview(blobUrl);
    }
  };

 const handleFormSubmit = () => {
  const trimmedName = (name || "").trim();
  const trimmedLink = (link || "").trim();
  
  if (!trimmedName) {
    alert("Guest name is required");
    return;
  }
  
  if (editingGuest) {
    // When editing: Keep existing server path if no new photo, otherwise use new blob
    setLocalGuests(
      localGuests.map((g) =>
        g.id === editingGuest.id
          ? {
              ...g,
              name: trimmedName,
              guest_name: trimmedName,
              link: trimmedLink,
              guest_link: trimmedLink,
              // FIXED: Preserve the original server path if no new photo
              image: photo ? URL.createObjectURL(photo) : g.image,
              guest_profile: photo ? null : g.guest_profile, // Keep server path
              rawFile: photo || null, // Only set rawFile if new photo uploaded
            }
          : g
      )
    );
  } else {
    // When adding new guest
    const defaultImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}&background=random`;
    const newImageUrl = photo ? URL.createObjectURL(photo) : defaultImage;
    
    const newGuest = {
      id: Date.now(),
      name: trimmedName,
      guest_name: trimmedName,
      link: trimmedLink,
      guest_link: trimmedLink,
      image: newImageUrl,
      guest_profile: null,
      rawFile: photo || null,
    };
    setLocalGuests([...localGuests, newGuest]);
  }
  resetForm();
};

  const handleDeleteGuest = (guestId) => {
    setLocalGuests((prev) => prev.filter((g) => g.id !== guestId));
    // If we're deleting the guest being edited, reset the form
    if (editingGuest && editingGuest.id === guestId) {
      resetForm();
    }
  };

  const startEditing = (guest) => {
    setEditingGuest(guest);
    setName(guest.name || guest.guest_name || "");
    setLink(guest.link || guest.guest_link || "");
    setPhoto(null);
    
    // Set existing image for preview
    const existingImage = guest.image || guest.guest_profile;
    setPhotoPreview(getImageUrl(existingImage));
  };

  const handleSave = () => {
    onSave(localGuests);
    resetForm();
    onClose();
  };

  const handleCancel = () => {
    resetForm();
    setLocalGuests(initialGuests || []);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div
        className={`rounded-2xl w-full max-w-4xl flex flex-col ${
          darkMode ? "bg-[#2B2B2B] text-gray-200" : "bg-white text-gray-800"
        }`}
      >
        {/* Header */}
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
            onClick={handleCancel}
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

        {/* Main Content */}
        <div className="flex md:flex-row flex-col p-4 h-[500px]">
          {/* Left Panel - Form */}
          <div className="md:w-1/2 md:pr-4 pb-4 flex flex-col">
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
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-gray-100 border-black text-black placeholder-gray-500"
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
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-gray-100 border-black text-black placeholder-gray-500"
                  }`}
                />
              </div>
              
              <div>
                <label
                  className={`block text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Guest/Guide Photo {editingGuest && "(Upload new to replace)"}
                </label>
                
                {/* Photo Preview */}
                {photoPreview && (
                  <div className="mt-2 mb-2">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Guest')}&background=random`;
                      }}
                    />
                  </div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className={`w-full text-sm mt-1 p-2 border rounded-lg file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold ${
                    darkMode
                      ? "border-gray-600 file:bg-indigo-500/20 file:text-indigo-300 text-gray-300"
                      : "border-black file:bg-indigo-100 file:text-indigo-700 text-black"
                  }`}
                />
              </div>
            </div>
            
            <div className="mt-auto flex justify-end pt-4">
              <button
                type="button"
                onClick={handleFormSubmit}
                disabled={!name || !name.trim()}
                className={`px-6 py-2 font-semibold rounded-lg flex items-center gap-2 transition-colors ${
                  !name || !name.trim()
                    ? "bg-gray-400 cursor-not-allowed text-gray-600"
                    : editingGuest
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                }`}
              >
                {editingGuest ? "Update Guest" : "Add Guest +"}
              </button>
            </div>
          </div>
          
          <div
            className={`md:border-l border-t ${
              darkMode ? "border-gray-600" : "border-black"
            }`}
          ></div>

          {/* Right Panel - Guest List */}
          <div className="md:w-1/2 md:pl-4 pt-4 flex flex-col min-h-0">
            <div className="overflow-y-auto space-y-3 pr-2 custom-scrollbar h-full">
              {localGuests.length > 0 ? (
                localGuests.map((g) => {
                  const guestImageUrl = getGuestImage(g);
                  
                  return (
                    <div
                      key={g.id}
                      className={`${
                        darkMode ? "bg-gray-700/50" : "bg-gray-100"
                      } rounded-lg p-3 flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={guestImageUrl}
                          alt={g.name || g.guest_name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-gray-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(g.name || g.guest_name || 'Guest')}&background=random`;
                          }}
                        />
                        <div className="truncate">
                          <p
                            className={`font-semibold truncate ${
                              darkMode ? "text-white" : "text-black"
                            }`}
                          >
                            {g.name || g.guest_name}
                          </p>
                          {(g.link || g.guest_link) && (
                            <a
                              href={g.link || g.guest_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-400 truncate block hover:underline"
                            >
                              {g.link || g.guest_link}
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
                  );
                })
              ) : (
                <div className={`text-center pt-16 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
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

        {/* Footer */}
        <div className="flex justify-end items-center p-4 space-x-4">
          <button
            type="button"
            onClick={handleCancel}
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
