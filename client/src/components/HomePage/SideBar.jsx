// src/components/HomePage/SideBar.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getMe } from "../../services/userService.js";
// ICONS
import HomeIcon from "../../assets/HOMEPAGE/HomeIcon.svg";
import TicketIcon from "../../assets/HOMEPAGE/TicketIcon.svg";
import OrgIcon from "../../assets/HOMEPAGE/OrgIcon.svg";
import SpeakerIcon from "../../assets/HOMEPAGE/SpeakerIcon.svg";
import ChatIcon from "../../assets/HOMEPAGE/ChatIcon.svg";
import Vector from "../../assets/HOMEPAGE/Vector.svg";
import SettingIcon from "../../assets/HOMEPAGE/SettingIcon.svg";
import ProfileImage from "../../assets/PROFILEPAGE/ProfileImage.png";
import EmojiIcon from "../../assets/HOMEPAGE/EmojiIcon.svg";
import EyeIcon from "../../assets/HOMEPAGE/EyeIcon.svg";
import SideCalenderIcon from "../../assets/HOMEPAGE/SideCalenderIcon.svg";
import PreviousIcon from "../../assets/HOMEPAGE/PreviousIcon.svg";
import DeletedIcon from "../../assets/HOMEPAGE/DeletedIcon.svg";
import BankIcon from "../../assets/HOMEPAGE/BankIcon.svg";

const SIDEBAR_WIDTH = 80;

const Sidebar = ({ user, theme }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [setUserImage] = useState(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getMe();
        // Construct the image URL if user has an image
        if (res.data.image) {
          const imageUrl = `${import.meta.env.VITE_AUTH_API_BASE_URL}/uploads/${res.data.image}`;
          setUserImage(imageUrl);
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, [setUserImage]);

  // Check if currently on home page
  const isHomePage = currentPath === "/home";
  const isDark = theme.bg === "bg-[#212426]";

  const ticketMenuItems = [
    {
      icon: EmojiIcon,
      label: "Create event",
      to: "/ticket/create-event",
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
              to="/ticket/speakers"
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
            <Link
              to="/message"
              className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity"
            >
              <img
                src={ChatIcon}
                alt="Chat"
                className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${
                  isDark ? "" : "filter brightness-0 opacity-70"
                }`}
              />
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
        {/* FLEXIBLE SPACER - Reduced to move bottom section up */}
        <div className="flex-1 min-h-4 max-h-12 lg:max-h-4"></div>

        {/* BOTTOM SECTION - Settings and Profile */}
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
            <button className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity">
              <img
                src={SettingIcon}
                alt="Settings"
                className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 opacity-70 hover:opacity-100 transition-opacity ${
                  isDark ? "" : "filter brightness-0"
                }`}
              />
            </button>
            <Link
              to="/profile"
              className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity"
            >
              {user?.image ? (
                <img
                  src={
                    user.image
                      ? `${import.meta.env.VITE_AUTH_API_BASE_URL}/uploads/${
                          user.image
                        }`
                      : ProfileImage
                  }
                  alt="User profile"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    console.error("Image failed to load:", e.target.src);
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full bg-[#6a47fa] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs sm:text-sm lg:text-lg">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
              )}
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
              {ticketMenuItems.map((item, index) => (
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
                  <div
                    className={`w-5 h-5 flex items-center justify-center ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <img
                      src={item.icon}
                      alt={item.label}
                      className={`w-full h-full ${
                        isDark ? "" : "filter brightness-0 opacity-70"
                      }`}
                    />
                  </div>
                  <span className="text-base font-normal">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
};
export default Sidebar;
