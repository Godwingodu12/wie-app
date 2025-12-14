import React, { useEffect, useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getUserData } from "../../services/ticketService";
import { getGroups } from "../../services/ticketService";
import GroupSelectionModal from "../../components/modals/GroupSelectionModal";
import { getImageUrl, getOptimizedImageUrl } from '../../utils/imageUtils.js';
import { useSocket } from "../../context/SocketContext";
// ICONS
import HomeIcon from "../../assets/HomePage/HomeIcon.svg";
import TicketIcon from "../../assets/HomePage/TicketIcon.svg";
import OrgIcon from "../../assets/HomePage/OrgIcon.svg";
import SpeakerIcon from "../../assets/HomePage/SpeakerIcon.svg";
import ChatIcon from "../../assets/HomePage/ChatIcon.svg";
import Vector from "../../assets/HomePage/Vector.svg";
import SettingIcon from "../../assets/HomePage/SettingIcon.svg";
import ProfileImage from "../../assets/PROFILEPAGE/ProfileImage.png";
import EmojiIcon from "../../assets/HomePage/EmojiIcon.svg";
import EyeIcon from "../../assets/HomePage/EyeIcon.svg";
import SideCalenderIcon from "../../assets/HomePage/SideCalenderIcon.svg";
import PreviousIcon  from "../../assets/HomePage/PreviousIcon.svg";
import DeletedIcon from "../../assets/HomePage/DeletedIcon.svg";
import BankIcon from "../../assets/HomePage/BankIcon.svg";
import createTicketicon from "../../assets/HomePage/createTicketicon.svg";

const SIDEBAR_WIDTH = 80;

const Sidebar = ({ theme }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  
  // ADD THIS: Get unread chats from Socket context
  const { unreadChats } = useSocket();
  
  const [userImage, setUserImage] = useState(() => {
    return sessionStorage.getItem('userImage') || null;
  });
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userData, setUserData] = useState(() => {
    const cached = sessionStorage.getItem('userData');
    return cached ? JSON.parse(cached) : null;
  });
const totalUnreadCount = useMemo(() => {
  if (!unreadChats || !(unreadChats instanceof Map)) {
    return 0;
  }
  
  let count = 0;
  unreadChats.forEach((value) => {
    if (typeof value === 'number' && value > 0) {
      count += value;
    }
  });
  
  return count;
}, [unreadChats]);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserData();
        if (res && res.data) {
          setUserData(res.data);
          sessionStorage.setItem('userData', JSON.stringify(res.data));
          if (res.data.image) {
            const imageUrl = getImageUrl(res.data.image, 'auth');
            setUserImage(imageUrl);
            sessionStorage.setItem('userImage', imageUrl);
          } else {
            setUserImage(null);
            sessionStorage.removeItem('userImage');
          }
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('userImage');
        setUserData(null);
        setUserImage(null);
      }
    };

    if (user) {
      fetchUser();
    } else {
      sessionStorage.removeItem('userData');
      sessionStorage.removeItem('userImage');
      setUserData(null);
      setUserImage(null);
    }
  }, [user]);

  const isHomePage = currentPath === "/home";
  const isDark = theme.bg === "bg-[#212426]";
  
  const handleCreateEvent = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const groupsResponse = await getGroups();
      const groupsArray = Array.isArray(groupsResponse) ? groupsResponse : groupsResponse.data || [];
      setGroups(groupsArray);
      if (groupsArray.length === 0) {
        navigate("/ticket/create-group");
      } else if (groupsArray.length === 1) {
        navigate(`/ticket/create-event/${groupsArray[0]._id}`);
      } else {
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      alert("Error fetching groups. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroup = (selectedGroup) => {
    setIsModalOpen(false);
    navigate(`/ticket/create-event/${selectedGroup._id}`);
  };

  const ticketMenuItems = [
    {
      icon: createTicketicon,
      label: "Create event",
      onClick: handleCreateEvent,
      isButton: true
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

  return (
    <>
      <aside
        className={`flex flex-col items-center ${theme.bg} py-4 transition-colors duration-300 flex-shrink-0`}
        style={{
          width: SIDEBAR_WIDTH,
          height: "100%",
          maxHeight: "100vh",
          minHeight: "auto",
        }}
      >
        {/* TOP SECTION - Navigation Icons */}
        <div className="flex flex-col items-center w-full mb-8 sm:mb-12 lg:mb-16">
          <div
            className={`${theme.cardBg} rounded-full flex flex-col items-center py-2 sm:py-3 w-10 sm:w-12 lg:w-14 transition-all duration-300`}
            style={{
              gap: "0.75rem",
              boxShadow: isDark
                ? "-4px -4px 8px rgba(255,255,255,0.08), 4px 4px 8px rgba(0,0,0,0.4)"
                : "-4px -4px 8px rgba(255,255,255,0.8), 4px 4px 8px rgba(0,0,0,0.15)",
            }}
          >
            {/* Home Icon - Static pressed effect */}
            <div
              onClick={() => {
                if (!isHomePage) {
                  window.location.href = "/";
                }
              }}
              className={`w-6 h-6 sm:w-8 sm:h-8 lg:w-11 lg:h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer
              ${
                isDark
                  ? "bg-[#212426] shadow-[inset_2px_2px_6px_rgba(0,0,0,0.6),inset_-3px_-2px_6px_rgba(255,255,255,0.15)]"
                  : "bg-white border border-gray-300 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]"
              }`}
            >
              <img
                src={HomeIcon}
                alt="Home"
                className="w-3 h-3 sm:w-5 sm:h-5"
                style={{ filter: isDark ? "none" : "invert(1)" }}
              />
            </div>

            {/* Ticket Icon - Opens Modal */}
            <button
              onClick={() => setIsTicketModalOpen(true)}
              className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity"
            >
              <img
                src={TicketIcon}
                alt="Ticket"
                className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${
                  isDark ? "" : "filter brightness-0 opacity-70"
                }`}
              />
            </button>

            <Link
              to="/ticket/groups"
              className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity"
            >
              <img
                src={OrgIcon}
                alt="Org"
                className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${
                  isDark ? "" : "filter brightness-0 opacity-70"
                }`}
              />
            </Link>

            <Link
              to="/ticket/live-events"
              className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity"
            >
              <img
                src={SpeakerIcon}
                alt="Speaker"
                className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-4 ${
                  isDark ? "" : "filter brightness-0 opacity-70"
                }`}
              />
            </Link>
            {/* Chat Icon with Badge */}
            <Link
              to="/message"
              className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity relative"
            >
              <img
                src={ChatIcon}
                alt="Chat"
                className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${
                  isDark ? "" : "filter brightness-0 opacity-70"
                }`}
              />
              {totalUnreadCount > 0 && (
                <div
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1 shadow-lg"
                  style={{ backgroundColor: '#7263F3' }}
                >
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </div>
              )}
            </Link>
            <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity cursor-pointer">
              <img
                src={Vector}
                alt="Vector"
                className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-4 ${
                  isDark ? "" : "filter brightness-0 opacity-70"
                }`}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-4 max-h-12 lg:max-h-4"></div>

        <div className="flex flex-col items-center w-full mb-4">
          <div
            className={`${theme.cardBg} rounded-full flex flex-col items-center py-2 sm:py-3 w-10 sm:w-12 lg:w-14 transition-all duration-300`}
            style={{
              gap: "0.75rem",
              boxShadow: isDark
                ? "-4px -4px 8px rgba(255,255,255,0.08), 4px 4px 8px rgba(0,0,0,0.4)"
                : "-4px -4px 8px rgba(255,255,255,0.8), 4px 4px 8px rgba(0,0,0,0.15)",
            }}
          >
            <Link
              to="/settings/editprofile"
              className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity"
            >
              <img
                src={SettingIcon}
                alt="settings"
                className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-4 ${
                  isDark ? "" : "filter brightness-0 opacity-70"
                }`}
              />
            </Link>
            <Link
              to="/profile"
              className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity"
            >
              <img
                src={userImage || (userData?.image ? `${import.meta.env.VITE_AUTH_API_BASE_URL}/uploads/${userData.image}` : ProfileImage)}
                alt="User profile"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  console.error("Image failed to load:", e.target.src);
                  e.target.onerror = null;
                  e.target.src = ProfileImage;
                }}
              />
            </Link>
          </div>
        </div>
      </aside>

      {/* TICKET MODAL */}
      {isTicketModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={() => setIsTicketModalOpen(false)}
          />

          {/* Modal */}
          <div
            className={`fixed z-50 ${
              isDark ? "bg-[#212426]" : "bg-[#f5f5f5]"
            } rounded-3xl shadow-2xl transition-all`}
            style={{
              top: "50%",
              left: "120px",
              transform: "translateY(-50%)",
              width: "280px",
              padding: "24px 16px",
              boxShadow: isDark
                ? "0 10px 40px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1)"
                : "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            {/* Menu Items */}
            <div className="space-y-1">
              {ticketMenuItems.map((item, index) => 
                item.isButton ? (
                  <button
                    key={index}
                    onClick={() => {
                      handleCreateEvent();
                      setIsTicketModalOpen(false);
                    }}
                    disabled={loading}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                      isDark
                        ? "hover:bg-[#181818] text-gray-200"
                        : "hover:bg-white text-gray-800"
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-5 h-5 flex items-center justify-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      <img src={item.icon} alt={item.label} className={`w-full h-full ${isDark ? "" : "filter brightness-0 opacity-70"}`} />
                    </div>
                    <span className="text-base font-normal">
                      {loading ? 'Loading...' : item.label}
                    </span>
                  </button>
                ) : (
                  <Link
                    key={index}
                    to={item.to}
                    onClick={() => setIsTicketModalOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                      isDark
                        ? "hover:bg-[#181818] text-gray-200"
                        : "hover:bg-white text-gray-800"
                    }`}
                  >
                    <div className={`w-5 h-5 flex items-center justify-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      <img src={item.icon} alt={item.label} className={`w-full h-full ${isDark ? "" : "filter brightness-0 opacity-70"}`} />
                    </div>
                    <span className="text-base font-normal">{item.label}</span>
                  </Link>
                )
              )}
            </div>
          </div>
        </>
      )}

      {/* GROUP SELECTION MODAL */}
      <GroupSelectionModal
        groups={groups}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectGroup={handleSelectGroup}
        isDark={isDark}
      />
    </>
  );
};
export default Sidebar;
