import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getGroups } from "../../services/ticketService";
import { getMe } from "../../services/userService.js";
import GroupSelectionModal from "../../components/modals/GroupSelectionModal";
import HomeIcon from "../../assets/HomePage/HomeIcon.svg";
import TicketIcon from "../../assets/HomePage/TicketIcon.svg";
import SpeakerIcon from "../../assets/HomePage/SpeakerIcon.svg";
import PlusIcon from "../../assets/PROFILEPAGE/PlusIcon.svg";
import EmojiIcon from "../../assets/HomePage/EmojiIcon.svg";
import EyeIcon from "../../assets/HomePage/EyeIcon.svg";
import SideCalenderIcon from "../../assets/HomePage/SideCalenderIcon.svg";
import PreviousIcon from "../../assets/HomePage/PreviousIcon.svg";
import DeletedIcon from "../../assets/HomePage/DeletedIcon.svg";
import BankIcon from "../../assets/HomePage/BankIcon.svg";

const BottomNavigation = ({ user, theme }) => {
  const isDark = theme?.bg === "bg-[#212426]";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const displayName = user?.name || "User";
  const [isTicketMenuOpen, setIsTicketMenuOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [userImage, setUserImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleSelectGroup = (selectedGroup) => {
    setIsModalOpen(false);
    setIsTicketMenuOpen(false);
    if (selectedGroup?._id) {
      navigate(`/ticket/create-event/${selectedGroup._id}`);
    }
  };
useEffect(() => {
  const fetchUser = async () => {
    try {
      const res = await getMe();
      // Check if response and data exist before accessing image
      if (res && res.data && res.data.image) {
        const imageUrl = `${import.meta.env.VITE_AUTH_API_BASE_URL}/uploads/${res.data.image}`;
        setUserImage(imageUrl);
      }
    } catch (err) {
      console.error("Failed to fetch user", err);
      // Don't throw error, just log it
    }
  };
  fetchUser();
}, []);

  const handleCreateEvent = async () => {
    if (!user) {
      alert("Please log in to create an event.");
      return;
    }
    setLoading(true);
    
    try {
      const groupsResponse = await getGroups();
      const groupsArray = Array.isArray(groupsResponse)
        ? groupsResponse
        : groupsResponse?.data || [];
      
      setGroups(groupsArray);

      if (groupsArray.length === 0) {
        setIsTicketMenuOpen(false);
        navigate("/ticket/create-group");
      } else if (groupsArray.length === 1) {
        setIsTicketMenuOpen(false);
        navigate(`/ticket/create-event/${groupsArray[0]._id}`);
      } else {
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
      alert("Error fetching groups. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleTicketItemClick = (item) => {
    setIsTicketMenuOpen(false);
    if (typeof item.onClick === "function") {
      item.onClick();
      return;
    }
    if (item.to) {
      navigate(item.to);
    }
  };
  const ticketMenuItems = [
    {
      icon: EmojiIcon,
      label: "Group View",
      to: "/ticket/groups",
      isButton: true,
    },
    {
      icon: EyeIcon,
      label: "View events",
      to: "/ticket/view-events",
    },
    {
      icon: SideCalenderIcon,
      label: "Saved events",
      to: "/ticket/confirm-events",
    },
    {
      icon: PreviousIcon,
      label: "Previous events",
      to: "/ticket/previous-events",
    },
    {
      icon: DeletedIcon,
      label: "Deleted events",
      to: "/ticket/deleted-events",
    },
    {
      icon: BankIcon,
      label: "Bank details",
      to: "/ticket/bank-details",
    },
  ];
  const navItems = [
    { to: "/home", icon: HomeIcon, label: "Home", isHome: true },
    {
      icon: TicketIcon,
      label: "Tickets",
      onClick: () => setIsTicketMenuOpen(true),
    },
    { icon: PlusIcon, label: "Create", special: true, onClick: handleCreateEvent },
    { to: "/ticket/live-events", icon: SpeakerIcon, label: "Live Events" },
    { to: "/profile", label: "Profile", profile: true },
  ];
  const defaultTheme = {
    bg: "bg-white",
    cardBg: "bg-white",
    border: "border border-gray-200",
  };

  const activeTheme = theme || defaultTheme;

  return (
    <>
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-4 px-2.5 pt-2" style={{ backgroundColor: isDark ? '#212426' : '#f0f2f5' }}>
          <div
            className={`flex justify-around items-center py-3 px-4 rounded-full ${theme.cardBg} border-2 border-white ${
              isDark
                ? "shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(60,60,60,0.3)]"
                : "shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.8)]"
            }`}
          >
          {navItems.map(
            ({ to, icon, label, special, profile, isHome, onClick }) =>
              special ? (
                <button
                  key={label}
                  onClick={handleCreateEvent}
                  disabled={loading}
                  style={{
                    boxShadow: isDark
                      ? "-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)"
                      : "-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)",
                  }}
                  className={`w-8 h-8 rounded-full bg-[#21d18b] flex items-center justify-center transition hover:scale-105 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <img
                    src={icon}
                    alt="Create"
                    className="w-6 h-6 invert brightness-0"
                  />
                </button>
              ) : (
                <button
                  key={label}
                  onClick={onClick ? onClick : (to ? () => navigate(to) : undefined)}
                  className="flex items-center justify-center p-2"
                >
                {profile ? (
                    userImage ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <img
                          src={userImage}
                          alt="User profile"
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            console.error("Image failed to load:", e.target.src);
                            e.target.onerror = null;
                            e.target.src = "/default-profile.png"; // optional fallback
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-[#6a47fa] rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs sm:text-sm lg:text-lg">
                          {user?.name?.[0]?.toUpperCase() || "U"}
                        </span>
                      </div>
                    )
                  ) : isHome ? (
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                        isDark
                          ? "bg-[#212426] shadow-[inset_2px_2px_6px_rgba(0,0,0,0.6),inset_-3px_-2px_6px_rgba(255,255,255,0.15)]"
                          : "bg-white border border-gray-300 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]"
                      }`}
                    >
                      <img
                        src={icon}
                        alt={label}
                        className="w-5 h-5"
                        style={{ filter: isDark ? "none" : "invert(1)" }}
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center">
                      <img
                        src={icon}
                        alt={label}
                        className={`w-5 h-5 ${
                          isDark
                            ? "filter brightness-0 invert"
                            : "filter brightness-0"
                        }`}
                      />
                    </div>
                  )}
                </button>
              )
          )}
        </div>
      </nav>

      {/* 🔸 Ticket Menu Overlay */}
      {isTicketMenuOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setIsTicketMenuOpen(false)}
        >
          <div
            className={`w-[90%] max-w-sm rounded-2xl p-6 ${
              isDark ? "bg-[#1f1f1f]" : "bg-white"
            } shadow-xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className={`text-lg font-semibold mb-4 text-center ${
                isDark ? "text-gray-100" : "text-gray-800"
              }`}
            >
              Ticket Options
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {ticketMenuItems.map((item, index) =>
                item.isButton ? (
                  <button
                    key={index}
                    onClick={() => handleTicketItemClick(item)}
                    disabled={loading}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all ${
                      isDark ? "bg-[#2a2a2a] hover:bg-[#333]" : "bg-gray-100 hover:bg-gray-200"
                    } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <img src={item.icon} alt={item.label} className="w-6 h-6 mb-1" />
                    <span className={`text-xs font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                      {loading && item.label === "Create event" ? "Loading..." : item.label}
                    </span>
                  </button>
                ) : (
                  <Link
                    key={index}
                    to={item.to}
                    onClick={() => setIsTicketMenuOpen(false)}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all ${
                      isDark ? "bg-[#2a2a2a] hover:bg-[#333]" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <img src={item.icon} alt={item.label} className="w-6 h-6 mb-1" />
                    <span className={`text-xs font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                      {item.label}
                    </span>
                  </Link>
                )
              )}
            </div>
            <button
              onClick={() => setIsTicketMenuOpen(false)}
              className="mt-6 w-full py-2 text-sm rounded-xl bg-[#21d18b] text-white font-semibold hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 🔸 Group Selection Modal */}
      {isModalOpen && (
        <GroupSelectionModal
          groups={groups}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setIsTicketMenuOpen(false);
          }}
          onSelectGroup={handleSelectGroup}
          isDark={isDark}
        />
      )}
    </>
  );
};

export default BottomNavigation;