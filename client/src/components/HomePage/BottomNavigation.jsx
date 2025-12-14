import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { getGroups } from "../../services/ticketService";
import { getUserData } from "../../services/ticketService";
import GroupSelectionModal from "../../components/modals/GroupSelectionModal";
import { getImageUrl } from "../../utils/imageUtils";
// Icons
import HomeIcon from "../../assets/HomePage/HomeIcon.svg";
import TicketIcon from "../../assets/HomePage/TicketIcon.svg";
import SpeakerIcon from "../../assets/HomePage/SpeakerIcon.svg";
import PlusIcon from "../../assets/PROFILEPAGE/PlusIcon.svg";
import EyeIcon from "../../assets/HomePage/EyeIcon.svg";
import SideCalenderIcon from "../../assets/HomePage/SideCalenderIcon.svg";
import PreviousIcon from "../../assets/HomePage/PreviousIcon.svg";
import DeletedIcon from "../../assets/HomePage/DeletedIcon.svg";
import BankIcon from "../../assets/HomePage/BankIcon.svg";
import OrgIcon from "../../assets/HomePage/OrgIcon.svg";
import ProfileImage from "../../assets/PROFILEPAGE/ProfileImage.png";

const BottomNavigation = ({ theme }) => {
  const isDark = theme?.bg === "bg-[#212426]";
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(false);
  const [isTicketMenuOpen, setIsTicketMenuOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userImage, setUserImage] = useState(() => sessionStorage.getItem("userImage") || null);
  const [userData, setUserData] = useState(() => {
    const cached = sessionStorage.getItem("userData");
    return cached ? JSON.parse(cached) : null;
  });

  // Fetch user details
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserData();
        if (res && res.data) {
          setUserData(res.data);
          sessionStorage.setItem("userData", JSON.stringify(res.data));

          if (res.data.image) {
            const imageUrl = getImageUrl(res.data.image);
            setUserImage(imageUrl);
            sessionStorage.setItem("userImage", imageUrl);
          } else {
            setUserImage(null);
            sessionStorage.removeItem("userImage");
          }
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
        sessionStorage.removeItem("userData");
        sessionStorage.removeItem("userImage");
        setUserData(null);
        setUserImage(null);
      }
    };

    if (user) {
      fetchUser();
    } else {
      sessionStorage.removeItem("userData");
      sessionStorage.removeItem("userImage");
      setUserData(null);
      setUserImage(null);
    }
  }, [user]);

  const handleSelectGroup = (selectedGroup) => {
    setIsModalOpen(false);
    setIsTicketMenuOpen(false);
    if (selectedGroup?._id) {
      navigate(`/ticket/create-event/${selectedGroup._id}`);
    }
  };

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
    if (item.onClick) item.onClick();
    else if (item.to) navigate(item.to);
  };

  // ✅ Ticket menu items
  const ticketMenuItems = [
    { icon: OrgIcon, label: "Group View", to: "/ticket/groups" },
    { icon: EyeIcon, label: "View Events", to: "/ticket/view-events" },
    { icon: SideCalenderIcon, label: "Saved Events", to: "/ticket/confirm-events" },
    { icon: PreviousIcon, label: "Previous Events", to: "/ticket/previous-events" },
    { icon: DeletedIcon, label: "Deleted Events", to: "/ticket/deleted-events" },
    { icon: BankIcon, label: "Bank Details", to: "/ticket/bank-details" },
  ];

  // ✅ Bottom navigation items
  const navItems = [
    { to: "/home", icon: HomeIcon, label: "Home", isHome: true },
    { icon: TicketIcon, label: "Tickets", onClick: () => setIsTicketMenuOpen(true) },
    { icon: PlusIcon, label: "Create", special: true, onClick: handleCreateEvent },
    { to: "/ticket/live-events", icon: SpeakerIcon, label: "Live Events" },
    { to: "/profile", label: "Profile", profile: true },
  ];

  return (
    <>
      {/* 🔹 Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-4 px-2.5 pt-2"
        style={{ backgroundColor: isDark ? "#212426" : "#f0f2f5" }}
      >
        <div
          className={`flex justify-around items-center py-3 px-4 rounded-[37.82px] border ${
            isDark
              ? "border-transparent bg-[#212426] shadow-[5.13px_5.13px_7.69px_#00000029,-5.13px_-5.13px_7.69px_#FFFFFF0A]"
              : "border border-gray-200 bg-white shadow-[5.13px_5.13px_7.69px_#00000029,-5.13px_-5.13px_7.69px_#FFFFFF0A]"
          }`}
        >
          {navItems.map(({ to, icon, label, special, profile, isHome, onClick }) =>
            special ? (
              <button
                key={label}
                onClick={handleCreateEvent}
                disabled={loading}
                className={`w-8 h-8 rounded-full bg-[#21d18b] flex items-center justify-center transition hover:scale-105 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <img src={icon} alt="Create" className="w-6 h-6 invert brightness-0" />
              </button>
            ) : (
              <button
                key={label}
                onClick={onClick ? onClick : to ? () => navigate(to) : undefined}
                className="flex items-center justify-center p-2"
              >
                {profile ? (
                  userImage ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <img
                        src={userImage}
                        alt="User"
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = ProfileImage;
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-[#6a47fa] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">
                        {user?.name?.[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )
                ) : isHome ? (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
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
                      className={`w-5 h-5 ${isDark ? "filter invert" : "filter brightness-0"}`}
                    />
                  </div>
                )}
              </button>
            )
          )}
        </div>
      </nav>

      {/* 🔹 Ticket Menu Overlay */}
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
              {ticketMenuItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.to}
                  onClick={() => setIsTicketMenuOpen(false)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all ${
                    isDark
                      ? "bg-[#2a2a2a] hover:bg-[#333]"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <img 
                    src={item.icon} 
                    alt={item.label} 
                    className="w-6 h-6 mb-1 object-contain" 
                    style={{ 
                      filter: isDark ? "brightness(0) invert(1)" : "brightness(0)" 
                    }}
                  />
                  <span
                    className={`text-xs font-medium text-center ${
                      isDark ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
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

      {/* 🔹 Group Selection Modal */}
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
