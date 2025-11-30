import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Slider from "react-slick";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Plus,
} from "lucide-react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  getUserGroupCapabilities,
  getGroups,
  getGroupStatistics,
  getMyLiveEvents,
  getMyEvents,
} from "../../services/ticketService";
import { groupEventCount } from "../../services/ticketService";
import { getImageUrl } from "../../utils/imageUtils";
import BottomNavigation from "../../components/HomePage/BottomNavigation.jsx";
import SideBar from "../../components/HomePage/SideBar.jsx";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import GroupSelectionModal from "../../components/modals/GroupSelectionModal";
// Your actual asset imports
import WieLogo from "../../assets/Event/WieLogo.svg";
import no_event from "../../assets/ViewGroup/no_event.png";
import PlusIcon from "../../assets/HomePage/PlusIcon.svg";
import HomeIcon from "../../assets/HomePage/HomeIcon.svg";
import LiveIcon from "../../assets/HomePage/LiveIcon.svg";
import GroupStatisticsChart from "../../components/ViewPage/GroupStatisticsChart.jsx";
const LiveEventCarouselCard = ({
  event,
  isDark,
  theme,
  outerShadow,
  onClick,
}) => {
  const eventName = event.event_name || "Event Name Missing";
  const eventSubcategory = event.event_subcategory || "Category";

  const eventLogoPath = event.event_logo || event.event_banner;
  const logoUrl = eventLogoPath ? getImageUrl(eventLogoPath) : null;

  const cardBgColor = isDark ? "#212426" : "#F9FAFB";
  const textColor = isDark ? "text-white" : "text-gray-800";
  const subTextColor = isDark ? "text-gray-400" : "text-gray-500";

  const buttonStyle = {
    background: "linear-gradient(180.23deg, #1E1242 -0.04%, #6549B8 99.57%)",
    color: "white",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(101, 73, 184, 0.3)",
  };

  return (
    <div
      style={{ ...outerShadow, backgroundColor: cardBgColor }}
      className="w-full aspect-[10/14] rounded-3xl flex flex-col p-2 sm:p-3"
    >
      <div className="flex-shrink-0 flex justify-center pt-1 sm:pt-2">
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-black flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.7)" }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${eventName} Logo`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-[10px] sm:text-xs font-normal text-white/60">
              logo
            </span>
          )}
        </div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center text-center overflow-hidden px-1 my-1 sm:my-2">
        <h4
          className={`font-semibold text-xs sm:text-sm md:text-base ${textColor} leading-tight line-clamp-2`}
          title={eventName}
        >
          {eventName}
        </h4>
        <p
          className={`text-[10px] sm:text-xs md:text-sm ${subTextColor} leading-tight mt-0.5 sm:mt-1 line-clamp-1`}
          title={eventSubcategory}
        >
          {eventSubcategory}
        </p>
      </div>

      <div className="flex-shrink-0">
        <button
          onClick={onClick}
          className="w-full text-center text-xs py-1.5 sm:text-sm sm:py-2 font-semibold rounded-full block hover:opacity-90 transition-opacity"
          style={buttonStyle}
        >
          View
        </button>
      </div>
    </div>
  );
};
const SlickCarouselStyles = () => (
  <style>{`
        .slick-slider { position: relative; display: block; box-sizing: border-box; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; -webkit-touch-callout: none; -khtml-user-select: none; -ms-touch-action: pan-y; touch-action: pan-y; -webkit-tap-highlight-color: transparent; }
        .slick-list { position: relative; display: block; overflow: hidden; margin: 0; padding: 0; }
        .slick-list:focus { outline: none; }
        .slick-list.dragging { cursor: pointer; cursor: hand; }
        .slick-slider .slick-track, .slick-slider .slick-list { -webkit-transform: translate3d(0, 0, 0); -moz-transform: translate3d(0, 0, 0); -ms-transform: translate3d(0, 0, 0); -o-transform: translate3d(0, 0, 0); transform: translate3d(0, 0, 0); }
        .slick-track { position: relative; top: 0; left: 0; display: block; margin-left: auto; margin-right: auto; }
        .slick-track:before, .slick-track:after { display: table; content: ''; }
        .slick-track:after { clear: both; }
        .slick-loading .slick-track { visibility: hidden; }
        .slick-slide { display: none; float: left; height: 100%; min-height: 1px; }
        [dir='rtl'] .slick-slide { float: right; }
        .slick-slide img { display: block; }
        .slick-slide.slick-loading img { display: none; }
        .slick-slide.dragging img { pointer-events: none; }
        .slick-initialized .slick-slide { display: block; }
        .slick-loading .slick-slide { visibility: hidden; }
        .slick-vertical .slick-slide { display: block; height: auto; border: 1px solid transparent; }
        .slick-arrow.slick-hidden { display: none; }
    `}</style>
);

// Custom Arrow Components - Updated positioning
const CustomPrevArrow = ({ onClick, isDark }) => (
  <button
    onClick={onClick}
    className="absolute left-[-30px] lg:left-[-40px] xl:left-[-50px] top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
    style={{
      background: "linear-gradient(180.23deg, #1E1242 -0.04%, #6549B8 99.57%)",
      boxShadow: "0 4px 12px rgba(101, 73, 184, 0.4)",
    }}
  >
    <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
  </button>
);

const CustomNextArrow = ({ onClick, isDark }) => (
  <button
    onClick={onClick}
    className="absolute right-[-30px] lg:right-[-40px] xl:right-[-50px] top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
    style={{
      background: "linear-gradient(180.23deg, #1E1242 -0.04%, #6549B8 99.57%)",
      boxShadow: "0 4px 12px rgba(101, 73, 184, 0.4)",
    }}
  >
    <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
  </button>
);
const getButtonNeumorphicShadows = (isDark) =>
  isDark
    ? "shadow-[inset_2px_2px_5px_#1a1b1e,inset_-2px_-2px_5px_#3c3f44]"
    : "shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.1),inset_2px_2px_5px_rgba(255,255,255,1)]";

// --- Helper functions and components ---
const formatNumber = (num) => {
  const number = parseInt(num, 10);
  if (isNaN(number)) return "0";
  if (number >= 1000) {
    return (number / 1000).toFixed(number % 1000 !== 0 ? 1 : 0) + "k";
  }
  return number.toString();
};

// --- SVG Icon components ---

const TicketIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {" "}
    <path
      d="M4 4h16v16H4z"
      fill="none"
      stroke="none"
    /> <path d="M15 5l0 2" /> <path d="M15 11l0 2" /> <path d="M15 17l0 2" />{" "}
    <path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-3a2 2 0 0 0 0 -4v-3a2 2 0 0 1 2 -2" />{" "}
  </svg>
);

const HeartIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="15"
    viewBox="0 0 18 15"
    fill="none"
    className={className}
  >
    {" "}
    <path
      d="M12.75 0.875C11.175 0.875 9.7875 1.6625 9 2.9C8.2125 1.6625 6.825 0.875 5.25 0.875C2.775 0.875 0.75 2.9 0.75 5.375C0.75 9.8375 9 14.375 9 14.375C9 14.375 17.25 9.875 17.25 5.375C17.25 2.9 15.225 0.875 12.75 0.875Z"
      fill="currentColor"
    />{" "}
  </svg>
);
const ShareIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    className={className}
  >
    {" "}
    <path
      d="M13.252 0.915676L0.904763 5.03243C0.854208 5.04924 0.809965 5.08104 0.777914 5.12359C0.745862 5.16615 0.727519 5.21745 0.725321 5.27069C0.723124 5.32392 0.737176 5.37656 0.76561 5.42161C0.794045 5.46667 0.835516 5.502 0.884513 5.52293L5.42201 7.46768C5.44579 7.47797 5.47183 7.48193 5.49759 7.47917C5.52335 7.47641 5.54796 7.46702 5.56901 7.45193L10.0173 4.27343C10.1553 4.17593 10.3248 4.34543 10.2273 4.48343L7.04876 8.93168C7.03392 8.95272 7.02474 8.97722 7.02212 9.00284C7.01949 9.02845 7.0235 9.05431 7.03376 9.07793L8.97776 13.6154C8.99862 13.6644 9.03389 13.706 9.0789 13.7345C9.1239 13.763 9.17652 13.7771 9.22974 13.775C9.28297 13.7728 9.33429 13.7546 9.3769 13.7226C9.4195 13.6906 9.45137 13.6464 9.46826 13.5959L13.585 1.24793C13.6005 1.20164 13.6028 1.15196 13.5916 1.10445C13.5804 1.05694 13.5562 1.0135 13.5217 0.978984C13.4872 0.944473 13.4437 0.920267 13.3962 0.909083C13.3487 0.8979 13.2983 0.900183 13.252 0.915676Z"
      fill="currentColor"
    />{" "}
  </svg>
);
const CalendarIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {" "}
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>{" "}
    <line x1="16" y1="2" x2="16" y2="6"></line>{" "}
    <line x1="8" y1="2" x2="8" y2="6"></line>{" "}
    <line x1="3" y1="10" x2="21" y2="10"></line>{" "}
  </svg>
);

const TotalEventsIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="14"
    viewBox="0 0 16 14"
    fill="none"
    className={className}
  >
    <rect
      x="1"
      y="2"
      width="14"
      height="11"
      rx="2"
      ry="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <line
      x1="1"
      y1="6"
      x2="15"
      y2="6"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <line
      x1="4.5"
      y1="0.5"
      x2="4.5"
      y2="3.5"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <line
      x1="11.5"
      y1="0.5"
      x2="11.5"
      y2="3.5"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);
const PendingEventsIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="14"
    viewBox="0 0 16 14"
    fill="none"
    className={className}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.54347 0.884372C7.89269 0.587953 9.30199 0.74505 10.5528 1.3313C11.7555 1.89499 12.7471 2.82517 13.3864 3.98633L11.3907 3.63442C11.1899 3.59902 10.9985 3.73307 10.963 3.93382C10.9277 4.13457 11.0617 4.32601 11.2624 4.36141L14.1704 4.87416C14.3712 4.90956 14.5626 4.77551 14.598 4.57476L15.1108 1.6668C15.1461 1.46605 15.0121 1.27461 14.8114 1.2392C14.6106 1.20381 14.4192 1.33786 14.3838 1.53861L14.0193 3.60542C13.3043 2.31923 12.2017 1.28886 10.8661 0.662866C9.46809 0.0076493 7.89298 -0.167926 6.38505 0.163359C4.87711 0.494651 3.52063 1.3143 2.52604 2.49515C1.53144 3.67601 0.954307 5.15207 0.884178 6.69441C0.874913 6.89801 1.03249 7.0706 1.23613 7.0799C1.43977 7.08913 1.61236 6.93152 1.62162 6.72793C1.6232 6.69316 1.62507 6.65839 1.62723 6.62369C1.63222 6.60428 1.63551 6.58412 1.63693 6.56353C1.63831 6.54352 1.63789 6.52366 1.63579 6.50432C1.74139 5.20569 2.24893 3.97005 3.09065 2.97071C3.98056 1.91415 5.19424 1.18079 6.54347 0.884372ZM1.07239 8.61094C1.09761 8.71746 1.12533 8.82347 1.15557 8.92889C1.18581 9.0343 1.21848 9.1389 1.25355 9.24262C1.31886 9.43574 1.5345 9.52787 1.72389 9.45249C1.9133 9.37712 2.00462 9.16275 1.94051 8.96926C1.91377 8.88858 1.88865 8.80723 1.86517 8.72536C1.8417 8.64349 1.8199 8.56126 1.79982 8.47865C1.75164 8.28059 1.56058 8.1472 1.36002 8.18367C1.15945 8.22013 1.02544 8.41258 1.07239 8.61094ZM14.2789 9.90258C14.3634 9.71707 14.2692 9.50232 14.0795 9.42769C13.8898 9.35306 13.6765 9.44688 13.5909 9.63188C13.5552 9.70902 13.5178 9.7855 13.4789 9.86124C13.4401 9.93698 13.3996 10.0119 13.3578 10.0859C13.2574 10.2633 13.3054 10.4913 13.4767 10.602C13.6479 10.7126 13.8772 10.664 13.9787 10.4872C14.0332 10.3922 14.0856 10.296 14.1357 10.1984C14.1857 10.1008 14.2335 10.0022 14.2789 9.90258ZM2.23188 11.1296C2.2964 11.2181 2.36305 11.3051 2.43179 11.3905C2.50052 11.476 2.57118 11.5598 2.6437 11.6418C2.77875 11.7945 3.01325 11.7959 3.15863 11.6529C3.30401 11.51 3.30511 11.277 3.17101 11.1235C3.11509 11.0595 3.06042 10.9943 3.00705 10.9279C2.95368 10.8616 2.90172 10.7942 2.85118 10.7258C2.72999 10.5619 2.50218 10.513 2.33142 10.6243C2.16067 10.7356 2.11171 10.965 2.23188 11.1296ZM12.6534 12.1489C12.8032 12.0107 12.7995 11.7762 12.6536 11.6339C12.5077 11.4916 12.2747 11.4954 12.124 11.6327C12.0612 11.69 11.9972 11.746 11.9319 11.8008C11.8667 11.8556 11.8004 11.9089 11.7332 11.9609C11.5719 12.0855 11.5278 12.3144 11.6428 12.4827C11.7577 12.6511 11.988 12.6951 12.1501 12.5715C12.2372 12.5051 12.3227 12.4366 12.4067 12.3661C12.4907 12.2955 12.5729 12.2231 12.6534 12.1489ZM4.27694 13.0022C4.37069 13.0586 4.46584 13.113 4.56234 13.1652C4.65883 13.2173 4.75643 13.2671 4.85505 13.3146C5.03873 13.403 5.25543 13.3134 5.33407 13.1253C5.41269 12.9373 5.32341 12.722 5.14028 12.6325C5.06391 12.5951 4.98825 12.5562 4.91333 12.5157C4.83841 12.4752 4.76439 12.4332 4.69132 12.3898C4.51607 12.2857 4.28711 12.3289 4.17285 12.4977C4.05859 12.6665 4.10235 12.8969 4.27694 13.0022ZM10.2843 13.5897C10.4759 13.5203 10.5635 13.3028 10.4841 13.115C10.4047 12.9272 10.1884 12.8405 9.99635 12.9087C9.91625 12.9371 9.83549 12.9639 9.75414 12.9892C9.67279 13.0143 9.59107 13.0379 9.50891 13.0597C9.31188 13.1121 9.18255 13.3059 9.2233 13.5057C9.26398 13.7054 9.45923 13.8354 9.65655 13.7842C9.76249 13.7567 9.8679 13.7268 9.97265 13.6943C10.0775 13.6618 10.1813 13.6269 10.2843 13.5897ZM6.88791 13.9356C6.99621 13.9513 7.10502 13.9646 7.21413 13.9753C7.32331 13.986 7.43256 13.994 7.54189 13.9995C7.74549 14.0099 7.91055 13.8433 7.91011 13.6394C7.90974 13.4356 7.74401 13.2718 7.54049 13.2602C7.45559 13.2554 7.37077 13.2489 7.28603 13.2406C7.20128 13.2323 7.11676 13.2223 7.03253 13.2106C6.83063 13.1825 6.63633 13.311 6.5964 13.511C6.55653 13.7109 6.68616 13.9063 6.88791 13.9356ZM7.84404 4.41196V6.99567H10.4284C10.6323 6.99567 10.7975 7.16096 10.7975 7.36478C10.7975 7.56867 10.6323 7.73388 10.4284 7.73388H7.10583V4.41196C7.10583 4.20811 7.27104 4.04286 7.47494 4.04286C7.67875 4.04286 7.84404 4.20811 7.84404 4.41196Z"
      fill="currentColor"
    />
  </svg>
);
const CheckCircleIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    className={className}
  >
    <path
      d="M7 0C7.64258 0 8.26237 0.0820312 8.85938 0.246094C9.45638 0.410156 10.0124 0.647135 10.5273 0.957031C11.0423 1.26693 11.514 1.63151 11.9424 2.05078C12.3708 2.47005 12.7376 2.94173 13.043 3.46582C13.3483 3.98991 13.583 4.54818 13.7471 5.14062C13.9111 5.73307 13.9954 6.35286 14 7C14 7.64258 13.918 8.26237 13.7539 8.85938C13.5898 9.45638 13.3529 10.0124 13.043 10.5273C12.7331 11.0423 12.3685 11.514 11.9492 11.9424C11.5299 12.3708 11.0583 12.7376 10.5342 13.043C10.0101 13.3483 9.45182 13.583 8.85938 13.7471C8.26693 13.9111 7.64714 13.9954 7 14C6.35742 14 5.73763 13.918 5.14062 13.7539C4.54362 13.5898 3.98763 13.3529 3.47266 13.043C2.95768 12.7331 2.486 12.3685 2.05762 11.9492C1.62923 11.5299 1.26237 11.0583 0.957031 10.5342C0.651693 10.0101 0.416992 9.45182 0.25293 8.85938C0.0888672 8.26693 0.00455729 7.64714 0 7C0 6.35742 0.0820312 5.73763 0.246094 5.14062C0.410156 4.54362 0.647135 3.98763 0.957031 3.47266C1.26693 2.95768 1.63151 2.486 2.05078 2.05762C2.47005 1.62923 2.94173 1.26237 3.46582 0.957031C3.98991 0.651693 4.54818 0.416992 5.14062 0.25293C5.73307 0.0888672 6.35286 0.00455729 7 0ZM11.1221 4.68262L10.1924 3.75293L5.6875 8.25781L3.80762 6.37793L2.87793 7.30762L5.6875 10.1172L11.1221 4.68262Z"
      fill="currentColor"
    />
  </svg>
);

const DashboardStatCard = ({
  value,
  label,
  icon,
  isDark,
  theme,
  style,
  colorStyle,
}) => (
  <div
    style={style}
    className={`${theme.bg} rounded-2xl p-1 flex flex-col items-center justify-center text-center gap-1 flex-1 transition-colors duration-300`}
  >
    <div className={`p-1 rounded-full ${colorStyle.bg} ${colorStyle.text}`}>
      {icon}
    </div>
    <p className={`text-md font-bold ${theme.text}`}>{value}</p>
    <p className={`text-[10px] md:text-xs ${theme.subText}`}>{label}</p>
  </div>
);

const HEADER_HEIGHT = 72;

// UPDATED: Scrollbar now receives the isDark prop to change styles
const CustomScrollbarStyles = ({ isDark }) => (
  <style>{`
        .main-scrollbar {
            scrollbar-color: ${isDark ? "#4f4f4f #232426" : "#c1c1c1 #f1f1f1"};
            scrollbar-width: thin;
        }
        .main-scrollbar::-webkit-scrollbar { width: 8px; }
        .main-scrollbar::-webkit-scrollbar-track { background: ${
          isDark ? "#232426" : "#f1f1f1"
        }; }
        .main-scrollbar::-webkit-scrollbar-thumb {
            background-color: ${isDark ? "#4f4f4f" : "#c1c1c1"};
            border-radius: 10px;
            border: 2px solid ${isDark ? "#232426" : "#f1f1f1"};
        }
    `}</style>
);
const SvgGroupCard = ({
  card,
  isAddCard = false,
  isDark,
  statsData = [],
  onViewClick,
  onAddClick,
}) => {
  const currentGroupStats = statsData.find((stat) => stat.label === card.name);
  const statPercentage = currentGroupStats?.percentage || card.progress || 50;
  const statColor = currentGroupStats?.color || "bg-cyan-400";
  const cardBgColor = isDark ? "#212426" : "#F1F1F1";

  const neumorphicShadow = isDark
    ? "inset 4px 4px 8px rgba(0, 0, 0, 0.4), inset -4px -4px 8px rgba(60, 60, 60, 0.3)"
    : "inset 4px 4px 8px rgba(0, 0, 0, 0.1), inset -4px -4px 8px rgba(255, 255, 255, 0.9)";

  return (
    <div
      className="relative w-full cursor-pointer"
      onClick={() => !isAddCard && onViewClick && onViewClick(card)}
    >
      <div
        className="w-full rounded-2xl sm:rounded-3xl flex flex-col p-2 sm:p-3"
        style={{
          backgroundColor: cardBgColor,
          boxShadow: neumorphicShadow,
          aspectRatio: "3/4",
        }}
      >
        {isAddCard ? (
          <div
            onClick={onAddClick}
            className="w-full h-full flex flex-col justify-center items-center group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-800 flex items-center justify-center border-2 border-[#2D3436] transition-transform duration-300 group-hover:scale-110">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
            </div>
            <h3
              className={`font-semibold text-[10px] sm:text-xs mt-2 ${isDark ? "text-white" : "text-gray-800"}`}
            >
              Add New Group
            </h3>
          </div>
        ) : (
          <>
            <div className="flex-shrink-0 text-center pt-1 sm:pt-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black flex items-center justify-center mx-auto">
                <img
                  src={getImageUrl(card.company_logo)}
                  alt={card.name}
                  className="w-full h-full object-cover rounded-full"
                  loading="lazy"
                />
              </div>
              <div className="mt-1 px-1">
                <h3
                  className={`font-semibold text-[10px] sm:text-xs line-clamp-1 ${isDark ? "text-white" : "text-gray-800"}`}
                >
                  {card.name}
                </h3>
                <p
                  className={`text-[8px] sm:text-[10px] ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  {card.type}
                </p>
              </div>
            </div>

            <div className="flex-grow flex flex-col justify-center items-center w-full px-1 sm:px-2">
              <div className="w-full flex items-center gap-1 mb-1 sm:mb-2">
                <div
                  className={`w-full ${isDark ? "bg-white/20" : "bg-gray-200"} rounded-full h-1`}
                >
                  <div
                    className={`${statColor} h-1 rounded-full`}
                    style={{ width: `${statPercentage}%` }}
                  ></div>
                </div>
                <span
                  className={`text-[8px] sm:text-[10px] font-semibold whitespace-nowrap ${isDark ? "text-white" : "text-gray-800"}`}
                >
                  {statPercentage}%
                </span>
              </div>
              <button
                className="py-0.5 px-3 text-[9px] sm:py-1 sm:px-4 sm:text-[10px] rounded-full font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewClick && onViewClick(card);
                }}
              >
                View
              </button>
            </div>

            <div
              className={`flex-shrink-0 w-full border-t pt-1 pb-0.5 mt-auto ${isDark ? "border-gray-700/50" : "border-gray-200"}`}
            >
              <div
                className={`flex justify-around items-center ${isDark ? "text-gray-300" : "text-gray-500"}`}
              >
                <div className="flex flex-col items-center space-y-0.5">
                  <HeartIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-500" />
                  <span className="text-[8px] sm:text-[10px]">
                    {formatNumber(card.likes)}
                  </span>
                </div>
                <div className="flex flex-col items-center space-y-0.5">
                  <TicketIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="text-[8px] sm:text-[10px]">
                    {formatNumber(card.comments)}
                  </span>
                </div>
                <div className="flex flex-col items-center space-y-0.5">
                  <ShareIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="text-[8px] sm:text-[10px]">
                    {formatNumber(card.shares)}
                  </span>
                </div>
                <div className="flex flex-col items-center space-y-0.5">
                  <CalendarIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="text-[8px] sm:text-[10px]">
                    {formatNumber(card.events)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
const GroupViewModal = ({
  isOpen,
  onClose,
  group,
  isDark,
  theme,
  onUpdate,
}) => {
  if (!isOpen || !group) return null;
  const totalEvents =
    group.totalEvents !== undefined ? group.totalEvents : group.events || 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className={`relative ${theme.bg} rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-4xl h-auto max-h-[90vh] overflow-y-auto`}
        style={{
          paddingBottom: "20px",
        }}
      >
        {/* Header */}
        <div className="px-4 md:px-8 pt-4 md:pt-6">
          <h2
            className={`${theme.text} font-semibold text-xl md:text-2xl leading-tight`}
            style={{ fontFamily: "Inter" }}
          >
            Group Details
          </h2>
        </div>

        {/* Divider Line */}
        <div
          className="mx-1 mt-4 md:mt-6"
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, #FFFFFF 50.73%, rgba(255, 255, 255, 0) 100%)",
          }}
        />

        {/* Content Container */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 px-4 md:px-8 pt-4 md:pt-6">
          {/* Left Card - Group Info */}
          <div
            className={`${theme.bg} rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center w-full lg:w-80`}
            style={{
              minHeight: "200px",
              boxShadow:
                "6px 6px 10px 0px #00000029, -6px -6px 10px 0px #FFFFFF0A",
            }}
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black flex items-center justify-center mb-3 md:mb-4 overflow-hidden">
              {group.company_logo ? (
                <img
                  src={getImageUrl(group.company_logo)}
                  alt="Logo"
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML =
                      '<span class="text-white text-sm">Logo</span>';
                  }}
                />
              ) : (
                <span className="text-white text-sm">Logo</span>
              )}
            </div>
            <h3
              className={`${theme.text} font-semibold text-lg md:text-xl mb-2 text-center`}
            >
              {group.name}
            </h3>
            <p className={`${theme.subText} text-sm capitalize`}>
              {group.grp_type === "organisation"
                ? group.organisation_type
                : group.grp_type}
            </p>
          </div>

          {/* Right Card - Bank Details */}
          <div
            className={`${theme.bg} flex flex-col flex-1`}
            style={{
              borderRadius: "20px",
              boxShadow: isDark
                ? "4px 4px 8px 0px #00000029, -4px -4px 8px 0px #FFFFFF0A"
                : "4px 4px 8px 0px #00000014, -4px -4px 8px 0px #FFFFFF33",
              padding: "16px",
            }}
          >
            <h3
              className={`${theme.text} font-medium text-base mb-3 md:mb-4`}
              style={{ fontFamily: "Inter" }}
            >
              Bank Details:
            </h3>

            {/* Bank Detail Rows */}
            <div className="space-y-2 md:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-1 sm:gap-2">
                <p className={`${theme.subText} text-sm font-medium`}>
                  Account Type
                </p>
                <p className={`${theme.text} font-medium text-sm`}>
                  {group.primary_bank_acc_type?.toUpperCase() || "N/A"}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-1 sm:gap-2">
                <p className={`${theme.subText} text-sm font-medium`}>
                  Account Holder
                </p>
                <p className={`${theme.text} font-medium text-sm break-words`}>
                  {group.primary_bank_acc_holder || "N/A"}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-1 sm:gap-2">
                <p className={`${theme.subText} text-sm font-medium`}>
                  Account Number
                </p>
                <p className={`${theme.text} font-medium text-sm`}>
                  {group.primary_bank_acc_no || "N/A"}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-1 sm:gap-2">
                <p className={`${theme.subText} text-sm font-medium`}>
                  IFSC Code
                </p>
                <p className={`${theme.text} font-medium text-sm`}>
                  {group.primary_bank_ifsc || "N/A"}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-1 sm:gap-2">
                <p className={`${theme.subText} text-sm font-medium`}>
                  PAN Number
                </p>
                <p className={`${theme.text} font-medium text-sm`}>
                  {group.pan_no}
                </p>
              </div>

              {group.gst_no && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-1 sm:gap-2">
                  <p className={`${theme.subText} text-sm font-medium`}>
                    GST Number
                  </p>
                  <p className={`${theme.text} font-medium text-sm`}>
                    {group.gst_no}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 md:px-8 py-4 mt-4">
          {/* Total Events Card */}
          <div
            className={`${theme.bg} rounded-xl px-4 py-3 min-w-[120px] text-center sm:text-left`}
            style={{
              boxShadow: isDark
                ? "3px 3px 6px 0px #00000029, -3px -3px 6px 0px #FFFFFF0A"
                : "3px 3px 6px 0px #00000014, -3px -3px 6px 0px #FFFFFF",
            }}
          >
            <p className={`${theme.subText} text-sm mb-1`}>Total Events</p>
            <p className={`${theme.text} font-bold text-xl md:text-2xl`}>
              {totalEvents !== undefined ? totalEvents : 0}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-full font-normal text-base text-white transition-all hover:opacity-90 w-full sm:w-auto"
              style={{
                minWidth: "140px",
                height: "40px",
                background: "#44444D",
                border: "0.5px solid",
                borderImage:
                  "linear-gradient(0deg, rgba(255, 255, 255, 0) -8.33%, rgba(255, 255, 255, 0.5) 183.33%)",
                boxShadow:
                  "0px 0px 0px 1px #2B2D43, 0px 4px 6px 0px #00000024, 0px 9px 14px -5px #FFFFFF4D inset",
              }}
            >
              Cancel
            </button>
            <button
              onClick={onUpdate}
              className="px-6 py-2 rounded-full font-normal text-base text-white transition-all hover:opacity-90 w-full sm:w-auto"
              style={{
                minWidth: "140px",
                height: "40px",
                background: "#5E5CE6",
                boxShadow: "0px 4px 6px 0px #00000024",
              }}
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MonthSelector = ({
  currentMonth,
  onSelectMonth,
  onClose,
  isDark,
  theme,
}) => {
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  return (
    <div
      className={`${theme.cardBg} rounded-xl ${getButtonNeumorphicShadows(
        isDark,
      )} p-1 flex flex-col gap-1 w-24 shadow-lg absolute z-20 top-full left-0 mt-2`}
    >
      {months.map((monthName, index) => (
        <button
          key={monthName}
          className={`w-full px-2 py-1.5 rounded-md text-sm font-semibold text-left transition-colors duration-150 ${
            currentMonth === index
              ? "bg-blue-600 text-blue-100"
              : `${theme.text} hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900`
          }`}
          onClick={() => {
            onSelectMonth(index);
            onClose();
          }}
        >
          {monthName}
        </button>
      ))}
    </div>
  );
};

const YearSelector = ({
  currentYear,
  onSelectYear,
  onClose,
  isDark,
  theme,
}) => {
  const currentFullYear = new Date().getFullYear();
  const years = Array.from(
    { length: 21 },
    (_, i) => currentFullYear - 10 + i,
  ).sort((a, b) => b - a);

  return (
    <div
      className={`${theme.cardBg} rounded-xl ${getButtonNeumorphicShadows(
        isDark,
      )} p-1 flex flex-col gap-1 w-24 shadow-lg max-h-[13.5rem] overflow-y-auto absolute z-20 top-full right-0 mt-2`}
    >
      {years.map((yearNum) => (
        <button
          key={yearNum}
          className={`w-full px-2 py-1.5 rounded-md text-sm font-semibold text-left transition-colors duration-150 ${
            currentYear === yearNum
              ? "bg-blue-600 text-blue-100"
              : `${theme.text} hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900`
          }`}
          onClick={() => {
            onSelectYear(yearNum);
            onClose();
          }}
        >
          {yearNum}
        </button>
      ))}
    </div>
  );
};

const ViewGroups = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [createdGroups, setCreatedGroups] = useState([]);
  const [showAddGroupCard, setShowAddGroupCard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalGroups, setModalGroups] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [groupStats, setGroupStats] = useState([]);
  const [events, setEvents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isGroupViewModalOpen, setIsGroupViewModalOpen] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);

  const sliderRef = useRef(null);

  const liveEvents = useMemo(() => {
    let filtered = events.filter((e) => e.event_status === "live");

    if (selectedDate) {
      filtered = filtered.filter((event) => {
        if (!event?.event_dates?.[0]?.start_date) return false;

        const eventStartDate = new Date(event.event_dates[0].start_date);
        const selectedDateOnly = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
        );
        const eventDateOnly = new Date(
          eventStartDate.getFullYear(),
          eventStartDate.getMonth(),
          eventStartDate.getDate(),
        );

        return eventDateOnly.getTime() === selectedDateOnly.getTime();
      });
    }
    return filtered;
  }, [events, selectedDate]);
  const handleCreateGroupClick = () => {
    navigate("/ticket/create-group");
  };
  const confirmedEventsCount = events.length;
  const totalLiveEvents = liveEvents.length;
  const handleGroupViewClick = async (card) => {
    try {
      setLoading(true);

      // Fetch full group details
      const groupsData = await getGroups();
      const fullGroup = groupsData.find((g) => g._id === card.id);

      if (fullGroup) {
        // Count events from the local events state
        const groupEvents = events.filter((event) => {
          // Check different possible property names for groupId
          return (
            event.groupId === fullGroup._id ||
            event.group_id === fullGroup._id ||
            event.group?._id === fullGroup._id
          );
        });

        fullGroup.totalEvents = groupEvents.length;
        setSelectedGroup(fullGroup);
        setIsGroupViewModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching group details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = () => {
    if (selectedGroup) {
      navigate(`/ticket/edit-group/${selectedGroup._id}`);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, groupsRes, liveEventsRes, groupStatsRes] =
          await Promise.all([
            getMyEvents(),
            getGroups(),
            getMyLiveEvents(),
            getGroupStatistics(),
          ]);
        // Properly handle events array
        let eventsArray = [];
        if (Array.isArray(eventsRes)) {
          eventsArray = eventsRes;
        } else if (eventsRes?.tickets) {
          eventsArray = Array.isArray(eventsRes.tickets)
            ? eventsRes.tickets
            : [eventsRes.tickets];
        } else if (eventsRes?.data) {
          eventsArray = Array.isArray(eventsRes.data)
            ? eventsRes.data
            : [eventsRes.data];
        }
        setEvents(eventsArray);
        const groupsArray = Array.isArray(groupsRes) ? groupsRes : [];
        setGroups(groupsArray);
        // ... rest of the code
      } catch (e) {
        console.error("Error fetching data:", e);
        setEvents([]);
        setGroups([]);
      }
    };

    fetchData();
  }, []);
  useEffect(() => {
    if (events.length > 0 && groups.length > 0) {
      const stats = groups.map((group) => {
        const groupEvents = events.filter(
          (event) => event.groupId === group._id,
        );
        const percentage =
          events.length > 0 ? (groupEvents.length / events.length) * 100 : 0;
        return {
          label: group.name,
          percentage: Math.round(percentage),
        };
      });

      const sortedStats = stats.sort((a, b) => b.percentage - a.percentage);

      const colors = [
        "green-500",
        "blue-500",
        "yellow-500",
        "red-500",
        "purple-500",
      ];

      const colorMap = {
        "green-500": "#22c55e",
        "blue-500": "#3b82f6",
        "yellow-500": "#eab308",
        "red-500": "#ef4444",
        "purple-500": "#8b5cf6",
      };

      const finalStats = sortedStats.slice(0, 5).map((stat, index) => {
        const colorName = colors[index % colors.length];
        return {
          ...stat,
          color: `bg-${colorName}`,
          strokeColor: colorMap[colorName],
          isPrimary: index === 0,
        };
      });

      setGroupStats(finalStats);
    }
  }, [events, groups]);
  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  useEffect(() => {
    const fetchAndProcessGroups = async () => {
      try {
        setLoading(true);
        const data = await getUserGroupCapabilities();
        const { userGroups = [], userRole } = data;

        // Fetch group statistics
        let groupStatsMap = {};
        try {
          const statsResponse = await getGroupStatistics();
          if (Array.isArray(statsResponse)) {
            groupStatsMap = statsResponse.reduce((acc, stat) => {
              acc[stat.groupName] = stat.percentage || 0;
              return acc;
            }, {});
          }
        } catch (error) {
          console.error("Error fetching group statistics:", error);
        }

        const formattedGroups = userGroups.map((group) => {
          const statPercentage = groupStatsMap[group.name] || 0;

          return {
            id: group._id,
            name: group.name,
            type: group.grp_type
              ? group.grp_type.charAt(0).toUpperCase() + group.grp_type.slice(1)
              : "General",
            progress: Math.round(statPercentage),
            likes: group.likes || "0",
            comments: group.comments || "0",
            shares: group.shares || 0,
            events: group.events || 0,
            company_logo: group.company_logo || null,
          };
        });

        setCreatedGroups(formattedGroups);

        const groupCounts = formattedGroups.reduce(
          (acc, group) => {
            const type = group.type.toLowerCase();
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          },
          { organisation: 0, admin: 0 },
        );

        let shouldShowAddCard = false;
        if (userRole === "admin") {
          if (groupCounts.organisation < 1 || groupCounts.admin < 1)
            shouldShowAddCard = true;
        } else if (userRole === "organisation") {
          if (groupCounts.organisation < 6) shouldShowAddCard = true;
        }

        if (formattedGroups.length === 0) {
          shouldShowAddCard = true;
        }

        setShowAddGroupCard(shouldShowAddCard);
        setError("");
      } catch (err) {
        setError("Failed to fetch your groups. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchAndProcessGroups();
  }, []);

  const addGroupPlaceholder = { id: "add-new-group" };

  const allCards = useMemo(() => {
    return showAddGroupCard
      ? [...createdGroups, addGroupPlaceholder]
      : [...createdGroups];
  }, [createdGroups, showAddGroupCard]);
  const liveEventsSliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: true,
    nextArrow: <CustomNextArrow isDark={isDark} />,
    prevArrow: <CustomPrevArrow isDark={isDark} />,
    lazyLoad: "ondemand",
    responsive: [
      {
        breakpoint: 1536, // 2xl
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 1280, // xl
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 1024, // lg
        settings: {
          slidesToShow: 2.5,
          arrows: false,
          centerMode: true,
          infinite: true,
        },
      },
      {
        breakpoint: 768, // md
        settings: {
          slidesToShow: 2,
          arrows: false,
          centerMode: false,
        },
      },
      {
        breakpoint: 640, // sm
        settings: {
          slidesToShow: 1,
          arrows: false,
        },
      },
    ],
  };

  const handleCreateClick = async () => {
    setLoading(true);
    try {
      const groupsResponse = await getGroups();
      const groupsArray = Array.isArray(groupsResponse)
        ? groupsResponse
        : groupsResponse.data || [];
      setModalGroups(groupsArray);
      if (groupsArray.length === 0) navigate("/ticket/create-group");
      else if (groupsArray.length === 1)
        navigate(`/ticket/create-event/${groupsArray[0]._id}`);
      else setIsModalOpen(true);
    } catch {
      alert("Error fetching groups. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroupForEvent = (selectedGroup) => {
    setIsModalOpen(false);
    navigate(`/ticket/create-event/${selectedGroup._id}`);
  };

  const sliderSettings = {
    dots: true,
    arrows: false,
    infinite: true,
    speed: 5000,
    autoplay: true,
    autoplaySpeed: 0,
    cssEase: "linear",
    pauseOnHover: true,
    slidesToScroll: 1,
    slidesToShow: 4, // Base for largest screens
    lazyLoad: "ondemand",
    responsive: [
      {
        breakpoint: 1536, // 2xl
        settings: { slidesToShow: 4, infinite: allCards.length > 4 },
      },
      {
        breakpoint: 1280, // xl
        settings: { slidesToShow: 3, infinite: allCards.length > 3 },
      },
      {
        breakpoint: 1024, // lg
        settings: { slidesToShow: 2, infinite: allCards.length > 2 },
      },
      {
        breakpoint: 768, // md
        settings: { slidesToShow: 2, infinite: allCards.length > 2 },
      },
      {
        breakpoint: 640, // sm
        settings: {
          slidesToShow: 1,
          infinite: allCards.length > 1,
        },
      },
    ],
  };

  const theme = isDark
    ? {
        bg: "bg-[#212426]",
        text: "text-white",
        subText: "text-[#c9c9cf]",
        cardBg: "bg-[#232426]",
        border: "border-[#23233a]",
        inputBg: "bg-[#212426]",
        specialButtonBg: "bg-[#21d18b]",
      }
    : {
        bg: "bg-white",
        text: "text-gray-900",
        subText: "text-gray-600",
        cardBg: "bg-gray-50",
        border: "border-gray-200",
        inputBg: "bg-gray-100",
        specialButtonBg: "bg-gradient-to-r from-purple-500 to-indigo-600",
      };

  const outerShadow = {
    boxShadow: isDark
      ? "-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)"
      : "-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)",
  };

  const combinedShadow = {
    boxShadow: isDark
      ? "inset 3px 3px 6px rgba(0,0,0,0.6), inset -3px -3px 6px rgba(40,40,40,0.3), 0 10px 20px -5px rgba(0,0,0,0.5)"
      : "inset 3px 3px 6px rgba(0,0,0,0.05), inset -3px -3px 6px rgba(255,255,255,0.8), 0 10px 15px -3px rgba(0,0,0,0.1)",
  };

  const displayName = user?.name || "User";

  const statCards = [
    {
      value: confirmedEventsCount,
      label: "Total Events",
      color: "purple",
      icon: <TotalEventsIcon className="w-4 h-4" />,
    },
    {
      value: 8,
      label: "Pending Events",
      color: "orange",
      icon: <PendingEventsIcon className="w-4 h-4" />,
    },
    {
      value: totalLiveEvents,
      label: "Live Events",
      color: "red",
      icon: <img src={LiveIcon} alt="Live" className="w-4 h-4" />,
    },
    {
      value: 2,
      label: "Completed",
      color: "green",
      icon: <CheckCircleIcon className="w-4 h-4" />,
    },
  ];
  const statCardStyles = {
    purple: { bg: "bg-purple-500/10", text: "text-purple-500" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-500" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-500" },
    green: { bg: "bg-green-500/10", text: "text-green-500" },
    red: { bg: "bg-red-500/10", text: "text-red-500" },
  };
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const generateCalendarDates = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();
    const dates = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek; i > 0; i--) {
      dates.push({
        date: prevMonthLastDay - i + 1,
        isCurrentMonth: false,
        isToday: false,
        fullDate: new Date(year, month - 1, prevMonthLastDay - i + 1),
      });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const today = new Date();
      const isToday =
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === i;
      dates.push({
        date: i,
        isCurrentMonth: true,
        isToday: isToday,
        fullDate: new Date(year, month, i),
      });
    }
    let nextMonthDay = 1;
    while (dates.length < 42) {
      dates.push({
        date: nextMonthDay,
        isCurrentMonth: false,
        isToday: false,
        fullDate: new Date(year, month + 1, nextMonthDay),
      });
      nextMonthDay++;
    }
    return dates;
  }, [year, month]);

  const changeMonth = (offset) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  const handleDateClick = (dayInfo) => {
    if (
      selectedDate &&
      dayInfo.fullDate.toDateString() === selectedDate.toDateString()
    ) {
      setSelectedDate(null);
    } else {
      setSelectedDate(dayInfo.fullDate);
    }
    setCurrentDate(dayInfo.fullDate);
  };

  const handleSelectMonth = (selectedMonth) => {
    setCurrentDate(new Date(year, selectedMonth, 1));
    setShowMonthSelector(false);
  };

  const handleSelectYear = (selectedYear) => {
    setCurrentDate(new Date(selectedYear, month, 1));
    setShowYearSelector(false);
  };

  if (loading && createdGroups.length === 0)
    return (
      <div
        className={`flex items-center justify-center min-h-screen text-xl ${theme.bg} ${theme.text}`}
      >
        Loading your groups...
      </div>
    );
  if (error)
    return (
      <div
        className={`flex items-center justify-center min-h-screen text-red-400 text-xl ${theme.bg}`}
      >
        {error}
      </div>
    );

  return (
    <>
      <SlickCarouselStyles />
      <CustomScrollbarStyles isDark={isDark} />

      <div
        className={`${theme.bg} ${theme.text} h-screen flex overflow-hidden transition-colors duration-300`}
      >
        <div className={`hidden md:flex flex-col flex-shrink-0 ${theme.bg}`}>
          <div
            className="flex items-center justify-center"
            style={{ height: HEADER_HEIGHT }}
          >
            <img src={WieLogo} alt="Wie Logo" className="w-12 h-12" />
          </div>
          <div className="flex-1">
            <SideBar user={user} theme={theme} />
          </div>
        </div>

        <div className="flex flex-col flex-1 w-full overflow-hidden">
          <header
            className="flex items-center justify-between px-4 md:px-6 flex-shrink-0"
            style={{ height: HEADER_HEIGHT }}
          >
            <div className="flex md:hidden items-center justify-between w-full">
              <img src={WieLogo} alt="Wie Logo" className="w-10 h-10" />
              <div className="flex items-center gap-2">
                <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4 w-full">
              <div className="flex-1 min-w-0">
                <SearchBar
                  theme={theme}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4 ml-auto flex-shrink-0">
                <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
              </div>
            </div>
          </header>

          <main
            className={`main-scrollbar flex flex-col flex-1 p-4 overflow-y-auto pb-32 md:pb-4 ${theme.cardBg}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center mb-4 flex-shrink-0 gap-2">
              <h1 className={`text-lg md:text-2xl font-semibold ${theme.text}`}>
                Created Groups
              </h1>
              <span
                style={outerShadow}
                className={`px-3 py-1.5 rounded-full text-xs flex items-center w-fit ${theme.bg} ${theme.text}`}
              >
                <Users className="w-3 h-3 md:w-4 md:h-4 mr-2" />{" "}
                {createdGroups.length} Groups
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
              <div className="lg:col-span-2 xl:col-span-3 flex flex-col gap-4 md:gap-6">
                {/* Groups Carousel */}
                <div
                  style={{
                    ...combinedShadow,
                    paddingBottom: "1rem",
                    paddingTop: "1rem",
                    marginTop: "1rem",
                    marginBottom: "1rem",
                  }}
                  className={`relative ${theme.bg} rounded-2xl md:rounded-3xl`}
                >
                  {/* Desktop Carousel */}
                  <div className="hidden md:block px-4 lg:px-8">
                    {allCards.length > 0 ? (
                      <Slider
                        {...sliderSettings}
                        key={isDark ? "dark-key" : "light-key"}
                      >
                        {allCards.map((card) => (
                          <div
                            key={
                              card.id === "add-new-group" ? "add-card" : card.id
                            }
                            className="px-3 py-4"
                          >
                            <SvgGroupCard
                              isAddCard={card.id === "add-new-group"}
                              card={card}
                              isDark={isDark}
                              statsData={groupStats}
                              onViewClick={handleGroupViewClick}
                              onAddClick={handleCreateGroupClick}
                            />
                          </div>
                        ))}
                      </Slider>
                    ) : (
                      <div className="h-[280px]"></div>
                    )}
                  </div>
                  {/* Mobile Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:hidden px-4 py-4">
                    {allCards.map((card) => (
                      <div
                        key={
                          card.id === "add-new-group"
                            ? "add-card-mobile"
                            : card.id
                        }
                      >
                        <SvgGroupCard
                          isAddCard={card.id === "add-new-group"}
                          card={card}
                          isDark={isDark}
                          statsData={groupStats}
                          onViewClick={handleGroupViewClick}
                          onAddClick={handleCreateGroupClick}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Events Section */}
                <div
                  style={combinedShadow}
                  className={`${theme.bg} rounded-2xl md:rounded-3xl p-4 md:p-6 flex-1`}
                >
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h2
                      className={`text-lg md:text-xl font-bold flex items-center ${theme.text}`}
                    >
                      <span className="text-red-500 mr-2 md:mr-3 text-xl md:text-2xl leading-none">
                        <img src={LiveIcon} alt="Live" className="w-4 h-4" />
                      </span>
                      Live Events
                    </h2>
                    {totalLiveEvents > 0 && (
                      <button
                        onClick={() => navigate('/ticket/live-events')}
                        className="px-4 md:px-6 py-1.5 md:py-2 rounded-full text-white text-xs md:text-sm font-medium transition-all hover:opacity-90"
                        style={{
                          background:
                            "linear-gradient(180.23deg, #1E1242 -0.04%, #6549B8 99.57%)",
                          boxShadow: "0 4px 12px rgba(101, 73, 184, 0.3)",
                        }}
                      >
                        View all
                      </button>
                    )}
                  </div>

                  {totalLiveEvents > 0 ? (
                    <>
                      {/* Desktop Carousel */}
                      <div className="hidden md:block">
                        <div
                          className="pt-2 pb-8 relative"
                          style={{ margin: "0 0px" }}
                        >
                          <Slider
                            ref={sliderRef}
                            {...liveEventsSliderSettings}
                            key={`live-events-${liveEvents.length}`}
                          >
                            {liveEvents.map((event) => (
                              <div key={event._id} className="px-2">
                                <LiveEventCarouselCard
                                  event={event}
                                  outerShadow={outerShadow}
                                  combinedShadow={combinedShadow}
                                  theme={theme}
                                  isDark={isDark}
                                  onClick={() =>
                                    navigate(
                                      `/ticket/live-event-view/${event._id}`,
                                    )
                                  }
                                />
                              </div>
                            ))}
                          </Slider>
                        </div>
                      </div>
                      {/* Mobile Grid */}
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:hidden">
                        {liveEvents.map((event) => (
                          <div key={event._id} className="w-full">
                            <LiveEventCarouselCard
                              event={event}
                              outerShadow={outerShadow}
                              combinedShadow={combinedShadow}
                              theme={theme}
                              isDark={isDark}
                              onClick={() =>
                                navigate(`/ticket/live-event-view/${event._id}`)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 py-4 h-[150px] md:h-[200px] w-full">
                      <img
                        src={no_event}
                        alt="No live event"
                        className="w-auto h-16 md:h-24 object-contain"
                      />
                      <div className="text-center md:text-left">
                        <h3
                          className={`text-base md:text-lg font-semibold ${theme.text}`}
                        >
                          No Live Event
                        </h3>
                        <p className={`text-sm ${theme.subText}`}>
                          {selectedDate
                            ? "No live events on this date."
                            : "There are no current live events."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1 xl:col-span-2">
                {/* --- Mobile & Tablet View --- */}
                <div className="block lg:hidden">
                  <div className="flex flex-col gap-6">
                    {/* Stats Chart */}
                    <div
                      style={combinedShadow}
                      className={`${theme.bg} rounded-2xl md:rounded-3xl p-3 md:p-4`}
                    >
                      <div
                        className={`${theme.bg} rounded-xl md:rounded-2xl p-2`}
                      >
                        <GroupStatisticsChart
                          theme={theme}
                          statsData={groupStats}
                        />
                      </div>
                    </div>
                    {/* Calendar */}
                    <div
                      style={outerShadow}
                      className={`${theme.bg} rounded-xl md:rounded-2xl p-3 md:p-4`}
                    >
                      {selectedDate && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 md:mb-4 px-1 md:px-2 gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs md:text-sm ${theme.subText}`}
                            >
                              Events for:
                            </span>
                            <span
                              className={`text-xs md:text-sm font-semibold ${theme.text}`}
                            >
                              {selectedDate.toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedDate(null)}
                            className={`text-xs font-bold px-3 md:px-4 py-1 md:py-1.5 rounded-full transition-colors ${isDark ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
                          >
                            Clear filter
                          </button>
                        </div>
                      )}
                      <div className="flex justify-between items-center mb-2 md:mb-8 py-4">
                        <button
                          onClick={() => changeMonth(-1)}
                          style={outerShadow}
                          className={`p-1 md:p-1.5 rounded-md`}
                        >
                          <ChevronLeft
                            className={`w-4 h-4 md:w-5 md:h-5 ${theme.text}`}
                          />
                        </button>
                        <div className="flex items-center gap-1 mx-auto">
                          <div className="relative">
                            <button
                              onClick={() => {
                                setShowMonthSelector((s) => !s);
                                setShowYearSelector(false);
                              }}
                              className={`flex items-center px-2 md:px-3 py-1 md:py-1.5 rounded-full font-semibold text-xs md:text-sm ${
                                theme.text
                              } ${theme.cardBg} ${getButtonNeumorphicShadows(
                                isDark,
                              )}`}
                            >
                              {monthNames[month]}
                              <ChevronDown className="w-3 h-3 md:w-3.5 md:h-3.5 ml-1" />
                            </button>
                            {showMonthSelector && (
                              <MonthSelector
                                currentMonth={month}
                                onSelectMonth={handleSelectMonth}
                                onClose={() => setShowMonthSelector(false)}
                                isDark={isDark}
                                theme={theme}
                              />
                            )}
                          </div>
                          <div className="relative">
                            <button
                              onClick={() => {
                                setShowYearSelector((s) => !s);
                                setShowMonthSelector(false);
                              }}
                              className={`flex items-center px-2 md:px-3 py-1 md:py-1.5 rounded-full font-semibold text-xs md:text-sm ${
                                theme.text
                              } ${theme.cardBg} ${getButtonNeumorphicShadows(
                                isDark,
                              )}`}
                            >
                              {year}
                              <ChevronDown className="w-3 h-3 md:w-3.5 md:h-3.5 ml-1" />
                            </button>
                            {showYearSelector && (
                              <YearSelector
                                currentYear={year}
                                onSelectYear={handleSelectYear}
                                onClose={() => setShowYearSelector(false)}
                                isDark={isDark}
                                theme={theme}
                              />
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => changeMonth(1)}
                          style={outerShadow}
                          className={`p-1 md:p-1.5 rounded-md`}
                        >
                          <ChevronRight
                            className={`w-4 h-4 md:w-5 md:h-5 ${theme.text}`}
                          />
                        </button>
                      </div>
                      <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400 mb-2">
                        {daysOfWeek.map((day, index) => (
                          <div key={`${day}-${index}`}>{day}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 text-center text-xs md:text-sm">
                        {generateCalendarDates.map((dayInfo, index) => {
                          const isSelected =
                            selectedDate &&
                            dayInfo.fullDate.toDateString() ===
                              selectedDate.toDateString();
                          const isToday = dayInfo.isToday;
                          const isCurrentMonth = dayInfo.isCurrentMonth;
                          let textColorClass = isCurrentMonth
                            ? theme.text
                            : theme.subText;
                          let otherClasses = "cursor-pointer";
                          let fontClass = "";
                          let ringClass = "";
                          let bgColorClass = "";
                          if (isSelected) {
                            textColorClass = isDark
                              ? "text-purple-400"
                              : "text-purple-600";
                            ringClass = isDark
                              ? "ring-2 ring-purple-400"
                              : "ring-2 ring-purple-600";
                            fontClass = "font-bold";
                            bgColorClass = isDark ? "bg-gray-700" : "bg-white";
                          } else if (isToday) {
                            bgColorClass = "bg-[#6549B8]";
                            textColorClass = "text-white";
                            fontClass = "font-bold";
                          }
                          return (
                            <div
                              key={index}
                              className={`flex items-center justify-center h-8 w-8 md:h-9 md:w-9 mx-auto rounded-full text-xs md:text-sm transition-colors duration-200 ${bgColorClass} ${textColorClass} ${fontClass} ${ringClass} ${otherClasses}`}
                              onClick={() => handleDateClick(dayInfo)}
                            >
                              {dayInfo.date}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {statCards.map((card) => (
                        <div
                          key={card.label}
                          style={outerShadow}
                          className={`${theme.bg} rounded-xl md:rounded-2xl p-1 md:p-2 flex flex-col items-center justify-center text-center gap-1 flex-1`}
                        >
                          <div
                            className={`p-1 rounded-full ${statCardStyles[card.color].bg} ${statCardStyles[card.color].text}`}
                          >
                            {card.icon}
                          </div>
                          <p
                            className={`text-sm md:text-md font-bold ${theme.text}`}
                          >
                            {card.value}
                          </p>
                          <p className={`text-xs ${theme.subText}`}>
                            {card.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* --- Desktop View --- */}
                <div className="hidden lg:block h-full">
                  <div
                    style={combinedShadow}
                    className={`${theme.bg} rounded-2xl md:rounded-3xl p-3 md:p-4 h-full`}
                  >
                    <div className="flex flex-col gap-4 md:gap-6 h-full">
                      <div
                        className={`${theme.bg} rounded-xl md:rounded-2xl p-2`}
                      >
                        <div className="w-full">
                          <GroupStatisticsChart
                            theme={theme}
                            statsData={groupStats}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                        <div
                          style={outerShadow}
                          className={`${theme.bg} rounded-2xl p-4  xl:col-span-4`}
                        >
                          {selectedDate && (
                            <div className="flex items-center justify-between mb-4 px-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm ${theme.subText}`}>
                                  Events for:
                                </span>
                                <span
                                  className={`text-sm font-semibold ${theme.text}`}
                                >
                                  {selectedDate.toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              <button
                                onClick={() => setSelectedDate(null)}
                                className={`text-xs font-bold px-4 py-1.5 rounded-full transition-colors ${
                                  isDark
                                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                                    : "bg-blue-500 hover:bg-blue-600 text-white"
                                }`}
                              >
                                Clear filter
                              </button>
                            </div>
                          )}
                          <div className="flex justify-between items-center mb-2 md:mb-8 py-4">
                            <button
                              onClick={() => changeMonth(-1)}
                              style={outerShadow}
                              className={`p-1.5 lg:p-1 rounded-md`}
                            >
                              <ChevronLeft
                                className={`w-5 h-5 lg:w-4 lg:h-4 ${theme.text}`}
                              />
                            </button>
                            <div className="flex items-center gap-1">
                              <div className="relative">
                                <button
                                  onClick={() => {
                                    setShowMonthSelector((s) => !s);
                                    setShowYearSelector(false);
                                  }}
                                  className={`flex items-center px-3 lg:px-2 py-1.5 lg:py-1 rounded-full font-semibold text-sm lg:text-xs ${
                                    theme.text
                                  } ${theme.cardBg} ${getButtonNeumorphicShadows(
                                    isDark,
                                  )}`}
                                >
                                  {monthNames[month]}

                                  <ChevronDown className="w-3.5 h-3.5 lg:w-3 lg:h-3 ml-1" />
                                </button>

                                {showMonthSelector && (
                                  <MonthSelector
                                    currentMonth={month}
                                    onSelectMonth={handleSelectMonth}
                                    onClose={() => setShowMonthSelector(false)}
                                    isDark={isDark}
                                    theme={theme}
                                  />
                                )}
                              </div>

                              <div className="relative">
                                <button
                                  onClick={() => {
                                    setShowYearSelector((s) => !s);
                                    setShowMonthSelector(false);
                                  }}
                                  className={`flex items-center px-3 lg:px-2 py-1.5 lg:py-1 rounded-full font-semibold text-sm lg:text-xs ${
                                    theme.text
                                  } ${theme.cardBg} ${getButtonNeumorphicShadows(
                                    isDark,
                                  )}`}
                                >
                                  {year}
                                  <ChevronDown className="w-3.5 h-3.5 lg:w-3 lg:h-3 ml-1" />
                                </button>

                                {showYearSelector && (
                                  <YearSelector
                                    currentYear={year}
                                    onSelectYear={handleSelectYear}
                                    onClose={() => setShowYearSelector(false)}
                                    isDark={isDark}
                                    theme={theme}
                                  />
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => changeMonth(1)}
                              style={outerShadow}
                              className={`p-1.5 lg:p-1 rounded-md`}
                            >
                              <ChevronRight
                                className={`w-5 h-5 lg:w-4 lg:h-4 ${theme.text}`}
                              />
                            </button>
                          </div>
                          <div className="grid grid-cols-7 text-center text-xs md:text-sm font-semibold text-gray-400 mb-2">
                            {daysOfWeek.map((day, index) => (
                              <div key={`${day}-${index}`}>{day}</div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 text-center text-sm">
                            {generateCalendarDates.map((dayInfo, index) => {
                              const isSelected =
                                selectedDate &&
                                dayInfo.fullDate.toDateString() ===
                                  selectedDate.toDateString();
                              const isToday = dayInfo.isToday;
                              const isCurrentMonth = dayInfo.isCurrentMonth;

                              let textColorClass = isCurrentMonth
                                ? theme.text
                                : theme.subText;
                              let otherClasses = "cursor-pointer";
                              let fontClass = "";
                              let ringClass = "";
                              let bgColorClass = "";

                              if (isSelected) {
                                textColorClass = isDark
                                  ? "text-purple-400"
                                  : "text-purple-600";
                                ringClass = isDark
                                  ? "ring-2 ring-purple-400"
                                  : "ring-2 ring-purple-600";
                                fontClass = "font-bold";
                                bgColorClass = isDark
                                  ? "bg-gray-700"
                                  : "bg-white";
                              } else if (isToday) {
                                bgColorClass = "bg-[#6549B8]";
                                textColorClass = "text-white";
                                fontClass = "font-bold";
                              }

                              return (
                                <div
                                  key={index}
                                  className={`flex items-center justify-center h-8 w-8 md:h-9 md:w-9 mx-auto rounded-full text-xs md:text-sm transition-colors duration-200 ${bgColorClass} ${textColorClass} ${fontClass} ${ringClass} ${otherClasses}`}
                                  onClick={() => handleDateClick(dayInfo)}
                                >
                                  {dayInfo.date}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-1 gap-2 xl:flex xl:flex-col xl:col-span-1">
                          {statCards.map((card) => (
                            <div
                              key={card.label}
                              style={outerShadow}
                              className={`${theme.bg} rounded-2xl p-1 flex flex-col items-center justify-center text-center gap-1 flex-1`}
                            >
                              <div
                                className={`p-1 rounded-full ${
                                  statCardStyles[card.color].bg
                                } ${statCardStyles[card.color].text}`}
                              >
                                {card.icon}
                              </div>
                              <p className={`text-md font-bold ${theme.text}`}>
                                {card.value}
                              </p>
                              <p
                                className={`text-[10px] md:text-xs ${theme.subText}`}
                              >
                                {card.label}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
          <BottomNavigation theme={theme} user={user} />
        </div>
        <GroupSelectionModal
          groups={modalGroups}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelectGroup={handleSelectGroupForEvent}
        />
        <GroupViewModal
          isOpen={isGroupViewModalOpen}
          onClose={() => {
            setIsGroupViewModalOpen(false);
            setSelectedGroup(null);
          }}
          group={selectedGroup}
          isDark={isDark}
          theme={theme}
          onUpdate={handleUpdateGroup}
        />
      </div>
    </>
  );
};
export default ViewGroups;
