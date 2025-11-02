import { ArrowLeft } from "lucide-react";
import ConfirmModal from "../Modal";
import { useState } from "react";

const GuideModal = ({
  guest,
  theme,
  onClose,
  formatImagePath,
  setAppAlert,
}) => {
  if (!guest) return null;
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const profileUrl =
    formatImagePath(guest.guest_profile) ||
    "https://i.pravatar.cc/300?img=default";
  const link = guest.social_media_link || "N/A";

  // Use theme properties for background colors
  const modalBg = theme.mainBg;
  const inputBg = theme.isDark ? theme.insetBg : theme.cardBg;

  const deleteGuest = async (guestId) => {
    console.log(`[SERVICE CALL] Deleting guest with ID: ${guestId}`);
    return new Promise((resolve) =>
      setTimeout(() => resolve({ success: true }), 500)
    );
  };

  const handleEdit = () => {
    // Example action: Navigate to a guest edit page
    setAppAlert({
      message: "Action Pending",
      description: `Redirecting to edit page for ${guest.guest_name}.`,
      type: "success",
      show: true,
    });
    // In a real app, this would be: navigate(`/guest/edit/${guest.id}`);
  };

  const handleDelete = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    setShowConfirmModal(false);
    try {
      await deleteGuest(guest.id); // Assuming guest has an 'id' property
      onClose(); // Close modal on success

      setAppAlert({
        message: "Guest Deleted",
        description: `${guest.guest_name} has been removed successfully.`,
        type: "success",
        show: true,
      });
      // Optional: If this deletion impacts the current view, you might refetch data.
    } catch (error) {
      setAppAlert({
        message: "Deletion Failed",
        description: `Could not delete guest. Error: ${
          error.message || "Network issue."
        }`,
        type: "error",
        show: true,
      });
    }
  };

  // Determine text colors based on theme
  const textColorClass = theme.isDark ? "text-white" : theme.text;
  const secondaryTextColorClass = theme.isDark
    ? "text-gray-400"
    : "text-gray-600";
  const linkColorClass = theme.isDark
    ? "text-blue-400 hover:text-blue-300"
    : "text-blue-600 hover:text-blue-700";

  // Use theme's shadow properties (assuming they are correctly defined in ViewSingleEvent)
  const regularShadow = theme.shadowOutset;
  const insetShadow = theme.shadowInset;

  // Custom gradient styles (these remain hardcoded as they represent specific button colors)
  const editButtonGradient = {
    background: "linear-gradient(180.23deg, #1E1242 -0.04%, #6549B8 99.57%)",
    boxShadow: regularShadow, // Apply theme's regular shadow to buttons
  };
  const deleteButtonGradient = {
    background: "linear-gradient(339.97deg, #B3261E 13.72%, #E04A4A 87.07%)",
    boxShadow: regularShadow, // Apply theme's regular shadow to buttons
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 backdrop-blur-sm"
      onClick={onClose}
    >
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Guest Deletion"
        message={`Are you sure you want to delete the profile for ${guest.guest_name}? This action cannot be undone.`}
        darkMode={theme.isDark}
      />
      <div
        className={`w-full max-w-sm rounded-3xl relative flex flex-col items-center pt-20 pb-8 px-6`}
        style={{
          backgroundColor: modalBg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={`absolute top-5 left-5 p-2 rounded-full transition-colors`}
          style={{
            backgroundColor: theme.isDark ? theme.insetBg : theme.cardBg,
            border: `1px solid ${theme.isDark ? "#444" : "#ddd"}`,
            boxShadow: insetShadow, // Back button uses inset shadow
          }}
        >
          <ArrowLeft size={20} className={textColorClass} />
        </button>

        {/* Profile Image - positioned absolutely to be 'half out' */}
        <img
          src={profileUrl}
          alt={guest.guest_name}
          className="absolute -top-16 w-32 h-32 rounded-full object-cover border-4 border-white z-10"
          style={{
            boxShadow: insetShadow, // Image uses inset shadow
          }}
        />

        <div className="flex flex-col items-center gap-2 mt-4 w-full">
          {/* Guest Name */}
          <h3 className={`text-2xl font-bold text-center ${textColorClass}`}>
            {guest.guest_name || "Guide Name"}
          </h3>

          {/* Role */}
          <p className={`text-md ${secondaryTextColorClass} mb-4`}>
            {guest.role || "Event Host"}
          </p>
        </div>

        <div className="w-full space-y-4">
          {/* Full name display */}
          <div>
            <p className={`text-sm ${secondaryTextColorClass} mb-1`}>
              Full name
            </p>
            <div
              className={`p-4 rounded-xl font-medium ${textColorClass}`}
              style={{
                backgroundColor: inputBg,
                // Subtle border added for definition if theme.mainBg == theme.inputBg
                border: `1px solid ${theme.isDark ? "#333" : "#ddd"}`,
                boxShadow: insetShadow, // Name field uses inset shadow
              }}
            >
              <p>{guest.guest_name || "N/A"}</p>
            </div>
          </div>

          {/* Profile link display */}
          <div>
            <p className={`text-sm ${secondaryTextColorClass} mb-1`}>
              Profile link
            </p>
            <div
              className={`p-4 rounded-xl truncate`}
              style={{
                backgroundColor: inputBg,
                border: `1px solid ${theme.isDark ? "#333" : "#ddd"}`, // Subtle border
                boxShadow: insetShadow, // Link field uses inset shadow
              }}
            >
              <a
                href={link !== "N/A" ? link : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-medium ${linkColorClass}`}
              >
                {link}
              </a>
            </div>
          </div>
        </div>

        {/* Action Buttons - aligned to bottom right, smaller */}
        <div className="flex justify-end gap-3 mt-8 w-full">
          <button
            className="py-2 px-5 rounded-full font-semibold text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={editButtonGradient}
            onClick={handleEdit}
          >
            Edit
          </button>
          <button
            className="py-2 px-5 rounded-full font-semibold text-white text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            style={deleteButtonGradient}
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuideModal;
