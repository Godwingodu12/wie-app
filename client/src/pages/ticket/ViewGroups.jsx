import React, { useState, useEffect, useRef } from "react";
// Make sure this path is correct for your project structure
import { getUserGroupCapabilities } from "../../services/ticketService";

import WieLogo from "../../assets/Event/WieLogo.svg";
import no_event from "../../assets/ViewGroup/no_event.png";
import { Link } from "react-router-dom";

// --- All SVG Icon components go here (code omitted for brevity)... ---

const AddGroupIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {" "}
    <line x1="12" y1="5" x2="12" y2="19"></line>{" "}
    <line x1="5" y1="12" x2="19" y2="12"></line>{" "}
  </svg>
);
const AnnounceLogo = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    className={className}
  >
    {" "}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M19 2.12444C18.9999 1.93274 18.9508 1.74425 18.8574 1.57685C18.764 1.40945 18.6294 1.26869 18.4663 1.16794C18.3032 1.06718 18.1171 1.00976 17.9256 1.00114C17.7341 0.992514 17.5436 1.03297 17.3721 1.11865L8.60837 5.49955H4.375C3.47989 5.49955 2.62145 5.85514 1.98851 6.4881C1.35558 7.12105 1 7.97953 1 8.87466C1 9.7698 1.35558 10.6283 1.98851 11.2612C2.62145 11.8942 3.47989 12.2498 4.375 12.2498H4.69L6.68238 18.2305C6.75702 18.4546 6.90031 18.6495 7.09193 18.7876C7.28355 18.9258 7.51379 19.0001 7.75 19H8.875C9.17337 19 9.45952 18.8815 9.67049 18.6705C9.88147 18.4595 10 18.1733 10 17.875V12.945L17.3721 16.6307C17.5436 16.7164 17.7341 16.7568 17.9256 16.7482C18.1171 16.7396 18.3032 16.6821 18.4663 16.5814C18.6294 16.4806 18.764 16.3399 18.8574 16.1725C18.9508 16.0051 18.9999 15.8166 19 15.6249V2.12444Z"
      stroke="currentColor"
    />{" "}
  </svg>
);
const HomeLogo = ({ className, isDarkMode }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="26"
    height="26"
    viewBox="0 0 26 26"
    fill="none"
    className={className}
  >
    {" "}
    <path
      d="M23.8332 13.2211V14.8688C23.8332 19.0938 23.8332 21.2074 22.5635 22.5204C21.2938 23.8334 19.2518 23.8334 15.1665 23.8334H10.8332C6.74792 23.8334 4.70475 23.8334 3.43617 22.5204C2.16759 21.2074 2.1665 19.0949 2.1665 14.8688V13.2211C2.1665 10.7413 2.1665 9.502 2.72984 8.475C3.291 7.44691 4.31909 6.80991 6.37417 5.53375L8.54084 4.18933C10.7129 2.84058 11.7995 2.16675 12.9998 2.16675C14.2002 2.16675 15.2857 2.84058 17.4588 4.18933L19.6255 5.53375C21.6806 6.80991 22.7087 7.44691 23.2709 8.475"
      stroke="currentColor"
      fill="none"
    />{" "}
    <path
      d="M9.75049 17.3335C10.6713 18.016 11.7926 18.4168 13.0005 18.4168C14.2084 18.4168 15.3297 18.016 16.2505 17.3335"
      stroke={isDarkMode ? "white" : "black"}
      strokeLinecap="round"
    />{" "}
  </svg>
);
const MessageLogo = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="26"
    height="26"
    viewBox="0 0 26 26"
    fill="none"
    className={className}
  >
    {" "}
    <path
      d="M20.5831 4.77197H10.4355C9.78908 4.77197 9.16909 5.02878 8.71197 5.4859C8.25485 5.94302 7.99805 6.56301 7.99805 7.20947V14.3833C7.99805 15.0298 8.25485 15.6498 8.71197 16.1069C9.16909 16.564 9.78908 16.8208 10.4355 16.8208H13.841L19.0155 19.1635V16.8213H20.5831C21.2296 16.8213 21.8496 16.5645 22.3067 16.1074C22.7638 15.6503 23.0206 15.0303 23.0206 14.3838V7.20947C23.0206 6.56301 22.7638 5.94302 22.3067 5.4859C21.8496 5.02878 21.2296 4.77197 20.5831 4.77197Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />{" "}
    <path
      d="M13.0919 16.8815V17.9075C13.0919 18.8608 12.3228 19.63 11.3748 19.63H9.16484L5.72525 21.2279V19.63H4.69609C3.74817 19.63 2.979 18.8608 2.979 17.9075V13.1841C2.979 12.2362 3.74817 11.467 4.69609 11.467H7.90275"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />{" "}
  </svg>
);
const Wie = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="18"
    viewBox="0 0 22 18"
    fill="none"
    className={className}
  >
    {" "}
    <path
      d="M13.665 9.76414L14.6467 7.75581C15.3133 6.56831 16.2558 5.11664 17.685 4.75331C18.2417 4.55998 18.7308 4.73414 19.2683 4.77248L21 1.93664C20.8616 1.79475 20.6938 1.68495 20.5083 1.61498C17.4692 0.456644 16.24 1.69831 13.24 8.47998L10.4042 2.43914H6.62917L8.4125 6.51664L7.40167 8.62498L4.61417 2.53248L1 2.50998L7.325 16.4075L10.2208 14.9591L7.93917 9.77414L8.94 7.73664L13.125 16.7683L16.2083 15.2041L13.665 9.76414Z"
      stroke="currentColor"
    />{" "}
  </svg>
);
const TreeTechLogo = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {" "}
    <path
      d="M12 2L12 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />{" "}
    <path
      d="M12 18L12 22"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />{" "}
    <path
      d="M19.071 4.929L16.242 7.758"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />{" "}
    <path
      d="M7.758 16.242L4.929 19.071"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />{" "}
    <path
      d="M22 12L18 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />{" "}
    <path
      d="M6 12L2 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />{" "}
    <path
      d="M19.071 19.071L16.242 16.242"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />{" "}
    <path
      d="M7.758 7.758L4.929 4.929"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />{" "}
    <circle
      cx="12"
      cy="12"
      r="4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />{" "}
  </svg>
);
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
    <path d="M4 4h16v16H4z" fill="none" stroke="none" /> <path d="M15 5l0 2" />
    <path d="M15 11l0 2" />
    <path d="M15 17l0 2" />{" "}
    <path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-3a2 2 0 0 0 0 -4v-3a2 2 0 0 1 2 -2" />{" "}
  </svg>
);
const GroupIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="26"
    height="26"
    viewBox="0 0 26 26"
    fill="none"
    className={className}
  >
    {" "}
    <path
      d="M12.9276 12.4943C14.8776 12.4943 16.3942 10.9054 16.3942 8.95544C16.3942 7.00544 14.8053 5.48877 12.8553 5.48877C10.9053 5.48877 9.38867 7.07766 9.38867 8.95544C9.38867 10.9054 10.9776 12.4943 12.9276 12.4943ZM12.8553 6.93321C12.9276 6.93321 12.9276 6.93321 12.8553 6.93321C14.0109 6.93321 14.9498 7.8721 14.9498 9.02766C14.9498 10.1832 14.0109 11.0499 12.8553 11.0499C11.6998 11.0499 10.8331 10.111 10.8331 9.02766C10.8331 7.8721 11.772 6.93321 12.8553 6.93321Z"
      fill="currentColor"
    />{" "}
    <path
      d="M23.6168 12.061C22.2446 10.8332 20.4391 10.1832 18.5613 10.2554H17.9835C17.8391 10.8332 17.6224 11.3388 17.3335 11.7721C17.7668 11.6999 18.1279 11.6999 18.5613 11.6999C19.9335 11.6277 21.3057 12.061 22.3891 12.8554V18.0554H23.8335V12.2777L23.6168 12.061Z"
      fill="currentColor"
    />{" "}
    <path
      d="M16.8998 5.63325C17.2609 4.76658 18.272 4.33325 19.2109 4.69436C20.0776 5.05547 20.5109 6.06658 20.1498 7.00547C19.8609 7.65547 19.2109 8.0888 18.5609 8.0888C18.4165 8.0888 18.1998 8.0888 18.0553 8.01658C18.1276 8.37769 18.1276 8.7388 18.1276 9.02769V9.46102C18.272 9.46102 18.4165 9.53325 18.5609 9.53325C20.3665 9.53325 21.8109 8.0888 21.8109 6.35547C21.8109 4.54991 20.3664 3.10547 18.6331 3.10547C17.4776 3.10547 16.4664 3.68325 15.8887 4.69436C16.2498 4.91102 16.6109 5.19991 16.8998 5.63325Z"
      fill="currentColor"
    />{" "}
    <path
      d="M8.6665 11.8444C8.37761 11.411 8.16095 10.9055 8.0165 10.3277H7.43873C5.56095 10.2555 3.75539 10.9055 2.38317 12.061L2.1665 12.2777V18.0555H3.61095V12.8555C4.7665 12.061 6.0665 11.6277 7.43873 11.6999C7.87206 11.6999 8.30539 11.7722 8.6665 11.8444Z"
      fill="currentColor"
    />{" "}
    <path
      d="M7.43894 9.4612C7.58338 9.4612 7.72783 9.4612 7.87227 9.38898V8.95564C7.87227 8.59453 7.87227 8.23342 7.94449 7.94453C7.80005 8.01675 7.58338 8.01675 7.43894 8.01675C6.50005 8.01675 5.70561 7.22231 5.70561 6.28342C5.70561 5.34453 6.50005 4.55009 7.43894 4.55009C8.16116 4.55009 8.81116 4.98342 9.10005 5.63342C9.38894 5.27231 9.82227 4.9112 10.1834 4.62231C9.24449 3.10564 7.29449 2.60009 5.77783 3.53898C4.26116 4.47787 3.75561 6.42787 4.69449 7.94453C5.27227 8.88342 6.28338 9.4612 7.43894 9.4612Z"
      fill="currentColor"
    />{" "}
    <path
      d="M18.8499 16.3944L18.7055 16.1777C17.2611 14.5888 15.2388 13.6499 13.0722 13.7221C10.9055 13.6499 8.81106 14.5888 7.36661 16.1777L7.22217 16.3944V21.8833C7.22217 22.5333 7.72772 23.111 8.44995 23.111H17.6944C18.3444 23.111 18.9222 22.5333 18.9222 21.8833V16.3944H18.8499ZM17.4055 21.6666H8.66661V16.8999C9.82217 15.7444 11.4111 15.1666 13.0722 15.1666C14.6611 15.0944 16.2499 15.7444 17.4055 16.8999V21.6666Z"
      fill="currentColor"
    />{" "}
  </svg>
);
const SettingsIcon = ({ className }) => (
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
    <circle cx="12" cy="12" r="3"></circle>{" "}
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82-.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>{" "}
  </svg>
);
const SearchIcon = ({ className }) => (
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
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>{" "}
  </svg>
);
const BellIcon = ({ className }) => (
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
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>{" "}
  </svg>
);
const LightThemeIcon = ({ className }) => (
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
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>{" "}
  </svg>
);
const DarkThemeIcon = ({ className }) => (
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
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>{" "}
  </svg>
);
const ChevronLeftIcon = ({ className }) => (
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
    <polyline points="15 18 9 12 15 6"></polyline>{" "}
  </svg>
);
const ChevronRightIcon = ({ className }) => (
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
    <polyline points="9 18 15 12 9 6"></polyline>{" "}
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
const TotalEventsIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="14"
    viewBox="0 0 16 14"
    fill="none"
    className={className}
  >
    {" "}
    <rect
      x="1"
      y="2"
      width="14"
      height="11"
      rx="2"
      ry="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />{" "}
    <line
      x1="1"
      y1="6"
      x2="15"
      y2="6"
      stroke="currentColor"
      strokeWidth="1.5"
    />{" "}
    <line
      x1="4.5"
      y1="0.5"
      x2="4.5"
      y2="3.5"
      stroke="currentColor"
      strokeWidth="1.5"
    />{" "}
    <line
      x1="11.5"
      y1="0.5"
      x2="11.5"
      y2="3.5"
      stroke="currentColor"
      strokeWidth="1.5"
    />{" "}
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
    {" "}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.54347 0.884372C7.89269 0.587953 9.30199 0.74505 10.5528 1.3313C11.7555 1.89499 12.7471 2.82517 13.3864 3.98633L11.3907 3.63442C11.1899 3.59902 10.9985 3.73307 10.963 3.93382C10.9277 4.13457 11.0617 4.32601 11.2624 4.36141L14.1704 4.87416C14.3712 4.90956 14.5626 4.77551 14.598 4.57476L15.1108 1.6668C15.1461 1.46605 15.0121 1.27461 14.8114 1.2392C14.6106 1.20381 14.4192 1.33786 14.3838 1.53861L14.0193 3.60542C13.3043 2.31923 12.2017 1.28886 10.8661 0.662866C9.46809 0.0076493 7.89298 -0.167926 6.38505 0.163359C4.87711 0.494651 3.52063 1.3143 2.52604 2.49515C1.53144 3.67601 0.954307 5.15207 0.884178 6.69441C0.874913 6.89801 1.03249 7.0706 1.23613 7.0799C1.43977 7.08913 1.61236 6.93152 1.62162 6.72793C1.6232 6.69316 1.62507 6.65839 1.62723 6.62369C1.63222 6.60428 1.63551 6.58412 1.63693 6.56353C1.63831 6.54352 1.63789 6.52366 1.63579 6.50432C1.74139 5.20569 2.24893 3.97005 3.09065 2.97071C3.98056 1.91415 5.19424 1.18079 6.54347 0.884372ZM1.07239 8.61094C1.09761 8.71746 1.12533 8.82347 1.15557 8.92889C1.18581 9.0343 1.21848 9.1389 1.25355 9.24262C1.31886 9.43574 1.5345 9.52787 1.72389 9.45249C1.9133 9.37712 2.00462 9.16275 1.94051 8.96926C1.91377 8.88858 1.88865 8.80723 1.86517 8.72536C1.8417 8.64349 1.8199 8.56126 1.79982 8.47865C1.75164 8.28059 1.56058 8.1472 1.36002 8.18367C1.15945 8.22013 1.02544 8.41258 1.07239 8.61094ZM14.2789 9.90258C14.3634 9.71707 14.2692 9.50232 14.0795 9.42769C13.8898 9.35306 13.6765 9.44688 13.5909 9.63188C13.5552 9.70902 13.5178 9.7855 13.4789 9.86124C13.4401 9.93698 13.3996 10.0119 13.3578 10.0859C13.2574 10.2633 13.3054 10.4913 13.4767 10.602C13.6479 10.7126 13.8772 10.664 13.9787 10.4872C14.0332 10.3922 14.0856 10.296 14.1357 10.1984C14.1857 10.1008 14.2335 10.0022 14.2789 9.90258ZM2.23188 11.1296C2.2964 11.2181 2.36305 11.3051 2.43179 11.3905C2.50052 11.476 2.57118 11.5598 2.6437 11.6418C2.77875 11.7945 3.01325 11.7959 3.15863 11.6529C3.30401 11.51 3.30511 11.277 3.17101 11.1235C3.11509 11.0595 3.06042 10.9943 3.00705 10.9279C2.95368 10.8616 2.90172 10.7942 2.85118 10.7258C2.72999 10.5619 2.50218 10.513 2.33142 10.6243C2.16067 10.7356 2.11171 10.965 2.23188 11.1296ZM12.6534 12.1489C12.8032 12.0107 12.7995 11.7762 12.6536 11.6339C12.5077 11.4916 12.2747 11.4954 12.124 11.6327C12.0612 11.69 11.9972 11.746 11.9319 11.8008C11.8667 11.8556 11.8004 11.9089 11.7332 11.9609C11.5719 12.0855 11.5278 12.3144 11.6428 12.4827C11.7577 12.6511 11.988 12.6951 12.1501 12.5715C12.2372 12.5051 12.3227 12.4366 12.4067 12.3661C12.4907 12.2955 12.5729 12.2231 12.6534 12.1489ZM4.27694 13.0022C4.37069 13.0586 4.46584 13.113 4.56234 13.1652C4.65883 13.2173 4.75643 13.2671 4.85505 13.3146C5.03873 13.403 5.25543 13.3134 5.33407 13.1253C5.41269 12.9373 5.32341 12.722 5.14028 12.6325C5.06391 12.5951 4.98825 12.5562 4.91333 12.5157C4.83841 12.4752 4.76439 12.4332 4.69132 12.3898C4.51607 12.2857 4.28711 12.3289 4.17285 12.4977C4.05859 12.6665 4.10235 12.8969 4.27694 13.0022ZM10.2843 13.5897C10.4759 13.5203 10.5635 13.3028 10.4841 13.115C10.4047 12.9272 10.1884 12.8405 9.99635 12.9087C9.91625 12.9371 9.83549 12.9639 9.75414 12.9892C9.67279 13.0143 9.59107 13.0379 9.50891 13.0597C9.31188 13.1121 9.18255 13.3059 9.2233 13.5057C9.26398 13.7054 9.45923 13.8354 9.65655 13.7842C9.76249 13.7567 9.8679 13.7268 9.97265 13.6943C10.0775 13.6618 10.1813 13.6269 10.2843 13.5897ZM6.88791 13.9356C6.99621 13.9513 7.10502 13.9646 7.21413 13.9753C7.32331 13.986 7.43256 13.994 7.54189 13.9995C7.74549 14.0099 7.91055 13.8433 7.91011 13.6394C7.90974 13.4356 7.74401 13.2718 7.54049 13.2602C7.45559 13.2554 7.37077 13.2489 7.28603 13.2406C7.20128 13.2323 7.11676 13.2223 7.03253 13.2106C6.83063 13.1825 6.63633 13.311 6.5964 13.511C6.55653 13.7109 6.68616 13.9063 6.88791 13.9356ZM7.84404 4.41196V6.99567H10.4284C10.6323 6.99567 10.7975 7.16096 10.7975 7.36478C10.7975 7.56867 10.6323 7.73388 10.4284 7.73388H7.10583V4.41196C7.10583 4.20811 7.27104 4.04286 7.47494 4.04286C7.67875 4.04286 7.84404 4.20811 7.84404 4.41196Z"
      fill="currentColor"
    />{" "}
  </svg>
);
const LiveEventsIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="26"
    height="19"
    viewBox="0 0 26 19"
    fill="none"
    className={className}
  >
    {" "}
    <path
      d="M5.51318 0.675012C5.07095 0.261547 4.33883 0.226194 3.87431 0.659022C1.48149 2.88865 0 5.97444 0 9.38306C0 12.9243 1.59898 16.1169 4.15758 18.3633C4.62497 18.7736 5.3374 18.7301 5.77016 18.3255C6.27481 17.8538 6.21341 17.1034 5.72687 16.6685C3.6734 14.8333 2.39516 12.248 2.39516 9.38306C2.39516 6.62636 3.57854 4.12883 5.49714 2.30905C5.96054 1.86953 6.00749 1.13718 5.51318 0.675012Z"
      fill="currentColor"
    />{" "}
    <path
      d="M8.32646 3.30483C7.89664 2.90296 7.1784 2.85276 6.71587 3.28066C5.03455 4.83617 3.99219 6.99601 3.99219 9.38278C3.99219 11.9081 5.15895 14.179 7.01471 15.7493C7.48051 16.1434 8.16902 16.0826 8.5848 15.6939C9.10879 15.204 9.01014 14.433 8.51908 14.0002C7.2061 12.8427 6.38735 11.2024 6.38735 9.38278C6.38735 7.66494 7.11698 6.10721 8.30316 4.96442C8.76031 4.52401 8.83452 3.77985 8.32646 3.30483Z"
      fill="currentColor"
    />{" "}
    <path
      d="M17.2224 3.30483C17.6522 2.90296 18.3704 2.85276 18.833 3.28066C20.5143 4.83617 21.5567 6.99601 21.5567 9.38278C21.5567 11.9081 20.3899 14.179 18.5341 15.7493C18.0683 16.1434 17.3798 16.0826 16.964 15.6939C16.4401 15.204 16.5386 14.433 17.0298 14.0002C18.3428 12.8427 19.1615 11.2024 19.1615 9.38278C19.1615 7.66494 18.4319 6.10721 17.2457 4.96442C16.7885 4.52401 16.7143 3.77985 17.2224 3.30483Z"
      fill="currentColor"
    />{" "}
    <path
      d="M20.0353 0.675012C20.4776 0.261547 21.2097 0.226194 21.6742 0.659022C24.067 2.88865 25.5485 5.97444 25.5485 9.38306C25.5485 12.9243 23.9495 16.1169 21.391 18.3633C20.9236 18.7736 20.2111 18.7301 19.7784 18.3255C19.2736 17.8538 19.3351 17.1034 19.8216 16.6685C21.8751 14.8333 23.1533 12.248 23.1533 9.38306C23.1533 6.62636 21.9699 4.12883 20.0513 2.30905C19.5879 1.86953 19.5409 1.13718 20.0353 0.675012Z"
      fill="currentColor"
    />{" "}
    <path
      d="M12.7741 7.14307C11.4513 7.14307 10.3789 8.14567 10.3789 9.38245C10.3789 10.6192 11.4513 11.6218 12.7741 11.6218C14.0968 11.6218 15.1692 10.6192 15.1692 9.38245C15.1692 8.14567 14.0968 7.14307 12.7741 7.14307Z"
      fill="currentColor"
    />{" "}
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
    {" "}
    <path
      d="M7 0C7.64258 0 8.26237 0.0820312 8.85938 0.246094C9.45638 0.410156 10.0124 0.647135 10.5273 0.957031C11.0423 1.26693 11.514 1.63151 11.9424 2.05078C12.3708 2.47005 12.7376 2.94173 13.043 3.46582C13.3483 3.98991 13.583 4.54818 13.7471 5.14062C13.9111 5.73307 13.9954 6.35286 14 7C14 7.64258 13.918 8.26237 13.7539 8.85938C13.5898 9.45638 13.3529 10.0124 13.043 10.5273C12.7331 11.0423 12.3685 11.514 11.9492 11.9424C11.5299 12.3708 11.0583 12.7376 10.5342 13.043C10.0101 13.3483 9.45182 13.583 8.85938 13.7471C8.26693 13.9111 7.64714 13.9954 7 14C6.35742 14 5.73763 13.918 5.14062 13.7539C4.54362 13.5898 3.98763 13.3529 3.47266 13.043C2.95768 12.7331 2.486 12.3685 2.05762 11.9492C1.62923 11.5299 1.26237 11.0583 0.957031 10.5342C0.651693 10.0101 0.416992 9.45182 0.25293 8.85938C0.0888672 8.26693 0.00455729 7.64714 0 7C0 6.35742 0.0820312 5.73763 0.246094 5.14062C0.410156 4.54362 0.647135 3.98763 0.957031 3.47266C1.26693 2.95768 1.63151 2.486 2.05078 2.05762C2.47005 1.62923 2.94173 1.26237 3.46582 0.957031C3.98991 0.651693 4.54818 0.416992 5.14062 0.25293C5.73307 0.0888672 6.35286 0.00455729 7 0ZM11.1221 4.68262L10.1924 3.75293L5.6875 8.25781L3.80762 6.37793L2.87793 7.30762L5.6875 10.1172L11.1221 4.68262Z"
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
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>{" "}
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
const FilterIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="26"
    height="27"
    viewBox="0 0 26 27"
    fill="none"
    className={className}
  >
    {" "}
    <g clipPath="url(#clip0_899_12762)">
      {" "}
      <path
        d="M23.0207 13.5H9.63609M4.91167 13.5H2.979M4.91167 13.5C4.91167 12.8736 5.16049 12.2729 5.60339 11.83C6.04628 11.3871 6.64698 11.1383 7.27334 11.1383C7.89969 11.1383 8.50039 11.3871 8.94329 11.83C9.38619 12.2729 9.635 12.8736 9.635 13.5C9.635 14.1263 9.38619 14.727 8.94329 15.1699C8.50039 15.6128 7.89969 15.8616 7.27334 15.8616C6.64698 15.8616 6.04628 15.6128 5.60339 15.1699C5.16049 14.727 4.91167 14.1263 4.91167 13.5ZM23.0207 20.6575H16.7937M16.7937 20.6575C16.7937 21.284 16.5443 21.8854 16.1013 22.3284C15.6583 22.7714 15.0574 23.0203 14.4309 23.0203C13.8046 23.0203 13.2039 22.7704 12.761 22.3275C12.3181 21.8846 12.0693 21.2839 12.0693 20.6575M16.7937 20.6575C16.7937 20.031 16.5443 19.4308 16.1013 18.9878C15.6583 18.5448 15.0574 18.2959 14.4309 18.2959C13.8046 18.2959 13.2039 18.5447 12.761 18.9876C12.3181 19.4305 12.0693 20.0312 12.0693 20.6575M12.0693 20.6575H2.979M23.0207 6.34238H19.6569M14.9325 6.34238H2.979M14.9325 6.34238C14.9325 5.71603 15.1813 5.11533 15.6242 4.67243C16.0671 4.22953 16.6678 3.98071 17.2942 3.98071C17.6043 3.98071 17.9114 4.0418 18.1979 4.16048C18.4845 4.27917 18.7448 4.45313 18.9641 4.67243C19.1834 4.89173 19.3574 5.15208 19.4761 5.43861C19.5948 5.72514 19.6558 6.03224 19.6558 6.34238C19.6558 6.65252 19.5948 6.95962 19.4761 7.24615C19.3574 7.53268 19.1834 7.79303 18.9641 8.01233C18.7448 8.23163 18.4845 8.40559 18.1979 8.52427C17.9114 8.64296 17.6043 8.70405 17.2942 8.70405C16.6678 8.70405 16.0671 8.45523 15.6242 8.01233C15.1813 7.56943 14.9325 6.96873 14.9325 6.34238Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
      />{" "}
    </g>{" "}
    <defs>
      <clipPath id="clip0_899_12762">
        <rect
          width="26"
          height="26"
          fill="white"
          transform="translate(0 0.5)"
        />
      </clipPath>
    </defs>{" "}
  </svg>
);

const ContentContainer = React.forwardRef(
  ({ children, className, isDarkMode }, ref) => {
    const neumorphicShadow = isDarkMode
      ? "inset 5px 5px 10px #1a1a1a, inset -5px -5px 10px #2c2c2c"
      : "inset 5px 5px 10px #e0e0e0, inset -5px -5px 10px #ffffff";

    return (
      <div
        ref={ref}
        className={`relative rounded-3xl ${className}`}
        style={{ boxShadow: neumorphicShadow }}
      >
        <div className="absolute top-0 left-0 w-full h-8 overflow-hidden rounded-t-3xl">
          <svg
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <path
              d="M0,20 Q50,0 100,20"
              fill={isDarkMode ? "#252525" : "#F8F9FA"}
            />
          </svg>
        </div>
        <div className="h-full pt-4">{children}</div>
      </div>
    );
  }
);

// --- Main Dashboard Component ---
const ViewGroups = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState("group");
  const [currentDate, setCurrentDate] = useState(new Date());
  const timeoutRef = useRef(null);
  const trackRef = useRef(null);
  const [slidesToShow, setSlidesToShow] = useState(3);
  const containerRef = useRef(null);

  const [createdGroups, setCreatedGroups] = useState([]);
  // --- CHANGE 1: Add new state to control the visibility of the "Add Group" card ---
  const [showAddGroupCard, setShowAddGroupCard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const addGroupPlaceholder = { id: "add-new-group" };

  // --- CHANGE 2: Conditionally build the `allCards` array ---
  // This array will now be reactive to the `showAddGroupCard` state.
  const allCards = showAddGroupCard
    ? [...createdGroups, addGroupPlaceholder]
    : [...createdGroups];

  const carouselEnabled = allCards.length > slidesToShow;
  const displayItems = carouselEnabled
    ? [...allCards, ...allCards, ...allCards]
    : allCards;
  const [currentIndex, setCurrentIndex] = useState(
    carouselEnabled ? allCards.length : 0
  );
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  // --- EFFECT 1: Fetching group data and applying conditional logic ---
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        // --- CHANGE 3: Expect a more detailed response from the API ---
        const data = await getUserGroupCapabilities();
        const { userGroups = [], userRole } = data; // Assuming API returns userRole

        const formattedGroups = userGroups.map((group) => ({
          id: group._id,
          name: group.name,
          // --- CHANGE 4: Simplify and standardize group type determination ---
          // It's better if the backend provides a consistent 'grp_type' field.
          type: group.grp_type
            ? group.grp_type.charAt(0).toUpperCase() + group.grp_type.slice(1)
            : "General",
          progress: group.progress || 50,
          likes: group.likes || "0",
          comments: group.comments || "0",
          shares: group.shares || 0,
          events: group.events || 0,
        }));
        setCreatedGroups(formattedGroups);

        // --- CHANGE 5: Implement the logic to show/hide the "Add Group" card ---
        const groupCounts = formattedGroups.reduce(
          (acc, group) => {
            const type = group.type.toLowerCase();
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          },
          { organisation: 0, admin: 0 }
        );

        let shouldShowAddCard = false;
        if (userRole === "admin") {
          console.log(groupCounts.organisation);
          // For admin: show if they have less than 1 of each type
          if (groupCounts.organisation < 1 || groupCounts.admin < 1) {
            shouldShowAddCard = true;
          }
        } else if (userRole === "organisation") {
          // For organisation user: show if they have fewer than 6 organisation groups
          if (groupCounts.organisation < 6) {
            shouldShowAddCard = true;
          }
        }
        // Add other roles or a default case if necessary
        // else { shouldShowAddCard = true; } // Default behavior

        setShowAddGroupCard(shouldShowAddCard);

        setError("");
      } catch (err) {
        console.error("Error fetching group data:", err);
        setError("Failed to fetch your groups. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  // --- The rest of your component remains largely the same ---

  // This effect now correctly depends on `allCards.length` which is derived from the conditional logic
  useEffect(() => {
    if (carouselEnabled) {
      setCurrentIndex(allCards.length);
    }
  }, [carouselEnabled, allCards.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const width = entry.contentRect.width;
        if (width < 550) setSlidesToShow(1);
        else if (width < 900) setSlidesToShow(2);
        else setSlidesToShow(3);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [createdGroups]);

  const navItems = [
    { id: "dashboard", icon: HomeLogo },
    { id: "ticket", icon: TicketIcon },
    { id: "group", icon: GroupIcon },
    { id: "speaker", icon: AnnounceLogo },
    { id: "message", icon: MessageLogo },
    { id: "wand", icon: Wie },
  ];

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleTransitionEnd = () => {
    if (!carouselEnabled) return;
    if (currentIndex >= allCards.length * 2) {
      setTransitionEnabled(false);
      setCurrentIndex(allCards.length);
    }
    if (currentIndex < allCards.length) {
      setTransitionEnabled(false);
      setCurrentIndex(currentIndex + allCards.length);
    }
  };

  useEffect(() => {
    if (!carouselEnabled) return;
    if (!transitionEnabled) {
      const timer = setTimeout(() => setTransitionEnabled(true), 50);
      return () => clearTimeout(timer);
    }
    resetTimeout();
    timeoutRef.current = setTimeout(
      () => setCurrentIndex((prevIndex) => prevIndex + 1),
      5000
    );
    return () => resetTimeout();
  }, [currentIndex, transitionEnabled, carouselEnabled, allCards.length]);

  // ... (rest of the component: stat cards, styles, calendar logic, etc.)
  const activatedGroupStats = [
    { name: "Tree", value: 52, color: "bg-purple-600", stroke: "#7C3AED" },
    { name: "Infosys", value: 28, color: "bg-purple-400", stroke: "#A78BFA" },
    { name: "Gecw", value: 20, color: "bg-purple-200", stroke: "#DDD6FE" },
  ];
  const statCards = [
    {
      value: 13,
      label: "Total Events",
      color: "purple",
      icon: <TotalEventsIcon className="w-5 h-5" />,
    },
    {
      value: 8,
      label: "Pending Events",
      color: "orange",
      icon: <PendingEventsIcon className="w-5 h-5" />,
    },
    {
      value: 3,
      label: "Live Events",
      color: "blue",
      icon: <LiveEventsIcon className="w-5 h-5" />,
    },
    {
      value: 2,
      label: "Completed Events",
      color: "green",
      icon: <CheckCircleIcon className="w-5 h-5" />,
    },
  ];
  const statCardStyles = {
    purple: { bg: "bg-purple-500/10", text: "text-purple-500" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-500" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-500" },
    green: { bg: "bg-green-500/10", text: "text-green-500" },
  };
  const neumorphicShadow = isDarkMode
    ? "5px 5px 10px #1a1a1a, -5px -5px 10px #2c2c2c"
    : "5px 5px 10px #e0e0e0, -5px -5px 10px #ffffff";
  const insetNeumorphicShadow = isDarkMode
    ? "inset 5px 5px 10px #1a1a1a, inset -5px -5px 10px #2c2c2c"
    : "inset 5px 5px 10px #e0e0e0, inset -5px -5px 10px #ffffff";
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
  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const changeMonth = (offset) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };
  const activeDotIndex = carouselEnabled ? currentIndex % allCards.length : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let cumulativeAngle = -90;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#252525] text-white text-xl">
        {" "}
        Loading your groups...{" "}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#252525] text-red-400 text-xl">
        {" "}
        {error}{" "}
      </div>
    );
  }

  // --- The JSX remains identical, as the logic is handled in state ---
  return (
    <div
      className={`flex flex-col lg:flex-row min-h-screen font-sans transition-colors duration-300 ${
        isDarkMode ? "bg-[#252525] text-gray-300" : "bg-[#F8F9FA] text-black"
      }`}
    >
      {/* Sidebar / Bottom Nav */}
      <aside
        className={`flex lg:flex-col items-center justify-around lg:justify-between p-2 lg:p-8 w-full lg:w-24 xl:w-32 fixed bottom-0 lg:sticky lg:top-0 h-20 lg:h-screen z-50 ${
          isDarkMode ? "bg-[#252525]" : "bg-[#F8F9FA]"
        }`}
      >
        <div className="hidden lg:block">
          <img
            src={WieLogo}
            alt="Wie Logo"
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full ${
              isDarkMode ? "text-white" : "text-black"
            }`}
          />
        </div>
        <nav
          className={`flex flex-row lg:flex-col items-center space-x-2 lg:space-x-0 lg:space-y-2 p-2 md:p-3 rounded-full`}
          style={{ boxShadow: neumorphicShadow }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNavItem === item.id;
            return (
              <a href="#" key={item.id}>
                <button
                  onClick={() => setActiveNavItem(item.id)}
                  className={`p-3 rounded-full transition-all duration-300 transform hover:scale-110`}
                  style={{
                    boxShadow: isActive ? insetNeumorphicShadow : "none",
                  }}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      isActive ? "text-purple-600" : "text-gray-400"
                    }`}
                    isDarkMode={isDarkMode}
                  />
                </button>
              </a>
            );
          })}
        </nav>
        <div
          className={`hidden lg:flex flex-col items-center space-y-4 p-3 py-6 gap-y-2 rounded-3xl`}
          style={{ boxShadow: neumorphicShadow }}
        >
          <button>
            {" "}
            <SettingsIcon className="w-6 h-6 text-gray-400" />{" "}
          </button>
          <img
            src="https://i.pravatar.cc/40?img=1"
            alt="User Avatar"
            className="w-10 h-10 rounded-full"
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 flex flex-col pb-24 lg:pb-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1 w-full">
            <button
              className="p-3 rounded-full"
              style={{ boxShadow: insetNeumorphicShadow }}
            >
              <FilterIcon
                className={`w-6 h-6 ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              />
            </button>
            <div
              className={`relative flex-1 w-full md:max-w-lg rounded-full`}
              style={{ boxShadow: insetNeumorphicShadow }}
            >
              <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search here..."
                className={`w-full bg-transparent border-none rounded-full py-3 pl-14 pr-6 focus:outline-none ${
                  isDarkMode ? "text-white" : "text-black"
                } placeholder-gray-500`}
              />
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div
              className="relative p-3 rounded-full"
              style={{ boxShadow: insetNeumorphicShadow }}
            >
              <BellIcon
                className={`w-6 h-6 ${
                  isDarkMode ? "text-white" : "text-gray-600"
                }`}
              />
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {" "}
                12{" "}
              </span>
            </div>
            <div
              className={`p-1 rounded-full flex items-center`}
              style={{ boxShadow: neumorphicShadow }}
            >
              <button
                onClick={() => setIsDarkMode(true)}
                className={`p-2 rounded-full`}
                style={{
                  boxShadow: isDarkMode ? insetNeumorphicShadow : "none",
                }}
              >
                <DarkThemeIcon
                  className={`w-5 h-5 ${
                    isDarkMode ? "text-white" : "text-gray-600"
                  }`}
                />
              </button>
              <button
                onClick={() => setIsDarkMode(false)}
                className={`p-2 rounded-full`}
                style={{
                  boxShadow: !isDarkMode ? insetNeumorphicShadow : "none",
                }}
              >
                <LightThemeIcon
                  className={`w-5 h-5 ${
                    !isDarkMode ? "text-black" : "text-gray-600"
                  }`}
                />
              </button>
            </div>
          </div>
        </header>

        <div className="flex items-center mb-4 flex-shrink-0">
          <h2
            className={`text-xl md:text-2xl font-bold mr-4 ${
              isDarkMode ? "text-white" : "text-black"
            }`}
          >
            {" "}
            Created Groups{" "}
          </h2>
          <span
            className={`px-4 py-2 rounded-full text-sm flex items-center ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
            style={{ boxShadow: neumorphicShadow }}
          >
            <GroupIcon className="w-4 h-4 mr-2" />
            {createdGroups.length} Groups
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-9 gap-8 flex-1 min-h-0">
          {/* Left Column */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            {/* Created Groups Cards */}
            <ContentContainer
              ref={containerRef}
              isDarkMode={isDarkMode}
              className="flex-1 flex flex-col"
            >
              {allCards.length > 0 ? (
                <div className="flex-1 flex flex-col pb-4">
                  <div className="flex-1 overflow-hidden">
                    <div
                      ref={trackRef}
                      className="h-full flex "
                      style={{
                        transform: carouselEnabled
                          ? `translateX(calc(-${currentIndex} * (100% / ${displayItems.length})))`
                          : "none",
                        transition:
                          carouselEnabled && transitionEnabled
                            ? "transform 1.5s ease-in-out"
                            : "none",
                      }}
                      onTransitionEnd={handleTransitionEnd}
                    >
                      {displayItems.map((card, index) => (
                        <div
                          key={
                            card.id === "add-new-group"
                              ? `add-card-${index}`
                              : `${card.id}-${index}`
                          }
                          className="flex-shrink-0 h-full px-2 flex items-center justify-center"
                          style={{
                            width: `calc(100% / ${displayItems.length})`,
                          }}
                        >
                          <div className="p-2 sm:p-3 h-72 w-full max-w-sm">
                            {card.id === "add-new-group" ? (
                              <Link to="/ticket/create-group">
                                <button
                                  className="rounded-3xl h-full w-full flex flex-col items-center justify-center overflow-hidden p-4 group"
                                  style={{
                                    boxShadow: neumorphicShadow,
                                    backgroundColor: isDarkMode
                                      ? "#2a2a2a"
                                      : "#ffffff",
                                  }}
                                >
                                  <div
                                    className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                                    style={{ boxShadow: insetNeumorphicShadow }}
                                  >
                                    <AddGroupIcon
                                      className={`w-10 h-10 ${
                                        isDarkMode
                                          ? "text-gray-400"
                                          : "text-gray-500"
                                      } transition-colors duration-300 group-hover:text-purple-500`}
                                    />
                                  </div>
                                  <h3
                                    className={`font-bold text-md mt-4 ${
                                      isDarkMode ? "text-white" : "text-black"
                                    }`}
                                  >
                                    {" "}
                                    Add New Group{" "}
                                  </h3>
                                </button>
                              </Link>
                            ) : (
                              <div
                                className={`rounded-3xl h-full flex flex-col overflow-hidden p-4`}
                                style={{
                                  boxShadow: neumorphicShadow,
                                  backgroundColor: isDarkMode
                                    ? "#2a2a2a"
                                    : "#ffffff",
                                }}
                              >
                                <div className="relative flex flex-col items-center">
                                  <div className="w-16 h-16 bg-black rounded-full flex flex-col items-center justify-center text-white mb-2 flex-shrink-0">
                                    <TreeTechLogo className="w-8 h-8" />
                                    <span className="text-xs mt-1">logo</span>
                                  </div>
                                  <h3
                                    className={`font-bold text-md ${
                                      isDarkMode ? "text-white" : "text-black"
                                    }`}
                                  >
                                    {card.name}
                                  </h3>
                                  <p className="text-xs text-gray-400 mb-2">
                                    {card.type}
                                  </p>
                                  <div className="w-full flex items-center">
                                    <div
                                      className={`w-full ${
                                        isDarkMode
                                          ? "bg-gray-700"
                                          : "bg-gray-200"
                                      } rounded-full h-1.5 mr-2`}
                                    >
                                      <div
                                        className="bg-gradient-to-r from-green-400 to-cyan-400 h-1.5 rounded-full"
                                        style={{ width: `${card.progress}%` }}
                                      ></div>
                                    </div>
                                    <span
                                      className={`text-xs font-semibold ${
                                        isDarkMode ? "text-white" : "text-black"
                                      }`}
                                    >
                                      {card.progress}%
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-center my-3">
                                  <button
                                    className="py-2 px-8 rounded-full font-semibold text-white bg-gradient-to-r from-[#6D55C8] to-[#4C3A9A]"
                                    style={{
                                      boxShadow: isDarkMode
                                        ? "3px 3px 6px #1a1a1a, -3px -3px 6px #2c2c2c"
                                        : "3px 3px 6px #bebebe, -3px -3px 6px #ffffff",
                                    }}
                                  >
                                    {" "}
                                    View{" "}
                                  </button>
                                </div>
                                <div className="mt-auto">
                                  <div className="flex justify-around items-center text-xs text-gray-400">
                                    <div className="flex flex-col items-center space-y-1">
                                      <HeartIcon className="w-5 h-5 text-red-500" />
                                      <span>{card.likes}</span>
                                    </div>
                                    <div className="flex flex-col items-center space-y-1">
                                      <TicketIcon
                                        className={`w-5 h-5 ${
                                          isDarkMode
                                            ? "text-blue-400"
                                            : "text-gray-800"
                                        }`}
                                      />
                                      <span>{card.comments}</span>
                                    </div>
                                    <div className="flex flex-col items-center space-y-1">
                                      <ShareIcon
                                        className={`w-5 h-5 ${
                                          isDarkMode
                                            ? "text-green-400"
                                            : "text-gray-800"
                                        }`}
                                      />
                                      <span>{card.shares}</span>
                                    </div>
                                    <div className="flex flex-col items-center space-y-1">
                                      <CalendarIcon
                                        className={`w-5 h-5 ${
                                          isDarkMode
                                            ? "text-purple-400"
                                            : "text-gray-800"
                                        }`}
                                      />
                                      <span>{card.events}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {carouselEnabled && (
                    <div className="flex justify-center space-x-2 pt-4">
                      {allCards.map((_, index) => (
                        <button
                          key={index}
                          onClick={() =>
                            setCurrentIndex(allCards.length + index)
                          }
                          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                            activeDotIndex === index
                              ? isDarkMode
                                ? "bg-white"
                                : "bg-black"
                              : "bg-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">No Groups Found</h3>
                    <p className="text-gray-400">
                      {" "}
                      You haven't created or joined any groups yet.{" "}
                    </p>
                  </div>
                </div>
              )}
            </ContentContainer>

            <ContentContainer
              isDarkMode={isDarkMode}
              className="flex-1 flex flex-col p-6"
            >
              <h2
                className={`text-xl md:text-2xl font-bold mb-4 flex items-center ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              >
                <span className="text-red-500 mr-2 text-3xl leading-none">
                  •
                </span>{" "}
                Live Events
              </h2>
              <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8">
                <img
                  src={no_event}
                  alt="No live event graphic"
                  className="w-auto h-32 md:h-48 object-contain"
                />
                <div className="text-center md:text-left">
                  <h3
                    className={`text-xl font-semibold ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    {" "}
                    No Live event{" "}
                  </h3>
                  <p className="text-gray-400">There is no live Event</p>
                </div>
              </div>
            </ContentContainer>
          </div>

          <ContentContainer
            isDarkMode={isDarkMode}
            className="lg:col-span-4 p-6 flex flex-col"
          >
            <div className="flex flex-col flex-1 gap-8 h-full">
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3
                    className={`font-bold text-lg ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    {" "}
                    Activated Group Statistics{" "}
                  </h3>
                  <button
                    className={`text-sm py-2 px-4 rounded-full ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-white text-black"
                    }`}
                    style={{ boxShadow: neumorphicShadow }}
                  >
                    {" "}
                    View all{" "}
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row items-center flex-1">
                  <div className="w-full sm:w-1/2 flex justify-center">
                    <div className="relative w-40 h-40 flex-shrink-0">
                      <svg className="w-full h-full" viewBox="0 0 128 128">
                        {activatedGroupStats.map((stat, index) => {
                          const segmentLength =
                            (circumference * stat.value) / 100 - 2;
                          const rotation = cumulativeAngle;
                          cumulativeAngle += (stat.value / 100) * 360;
                          return (
                            <circle
                              key={index}
                              cx="64"
                              cy="64"
                              r={radius}
                              strokeWidth="12"
                              fill="transparent"
                              strokeDasharray={`${segmentLength} ${circumference}`}
                              style={{ stroke: stat.stroke }}
                              strokeLinecap="round"
                              transform={`rotate(${rotation} 64 64)`}
                            />
                          );
                        })}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span
                          className={`text-3xl font-bold ${
                            isDarkMode ? "text-white" : "text-black"
                          }`}
                        >
                          52%
                        </span>
                        <span className="text-xs text-gray-400">Of Tree</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full mt-4 sm:mt-0 sm:w-1/2 text-sm space-y-4 flex-1">
                    {activatedGroupStats.map((stat) => (
                      <div key={stat.name}>
                        <p
                          className={`${
                            isDarkMode ? "text-white" : "text-black"
                          } mb-1`}
                        >
                          {" "}
                          {stat.name} {stat.value}%{" "}
                        </p>
                        <div
                          className={`w-full ${
                            isDarkMode ? "bg-gray-700" : "bg-gray-200"
                          } rounded-full h-2`}
                        >
                          <div
                            className={`${stat.color} h-2 rounded-full`}
                            style={{ width: `${stat.value}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col xl:flex-row gap-8">
                <div
                  className={`p-4 rounded-3xl w-full xl:w-3/4 flex flex-col`}
                  style={{ boxShadow: neumorphicShadow }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={() => changeMonth(-1)}
                      className={`p-1 rounded-md`}
                      style={{ boxShadow: neumorphicShadow }}
                    >
                      <ChevronLeftIcon
                        className={`w-5 h-5 ${
                          isDarkMode ? "text-white" : "text-black"
                        }`}
                      />
                    </button>
                    <h3
                      className={`font-bold text-sm sm:text-base ${
                        isDarkMode ? "text-white" : "text-black"
                      }`}
                    >
                      {" "}
                      {monthNames[month]} {year}{" "}
                    </h3>
                    <button
                      onClick={() => changeMonth(1)}
                      className={`p-1 rounded-md`}
                      style={{ boxShadow: neumorphicShadow }}
                    >
                      <ChevronRightIcon
                        className={`w-5 h-5 ${
                          isDarkMode ? "text-white" : "text-black"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">
                    {daysOfWeek.map((day, index) => (
                      <div key={`${day}-${index}`}>{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 text-center text-sm flex-1">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`empty-${i}`}></div>
                    ))}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                      (day) => (
                        <div
                          key={day}
                          className={`flex items-center justify-center h-8 text-xs sm:text-sm ${
                            day === today.getDate() &&
                            month === today.getMonth() &&
                            year === today.getFullYear()
                              ? "bg-blue-500 text-white rounded-full"
                              : isDarkMode
                              ? "text-white"
                              : "text-black"
                          }`}
                        >
                          {day}
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div className="w-full xl:w-1/4 grid grid-cols-2 xl:grid-cols-1 gap-4">
                  {statCards.map((card) => (
                    <div
                      key={card.label}
                      className={`p-2 sm:p-3 rounded-xl flex items-center space-x-2 sm:space-x-3`}
                      style={{ boxShadow: neumorphicShadow }}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          statCardStyles[card.color].bg
                        } ${statCardStyles[card.color].text}`}
                      >
                        {card.icon}
                      </div>
                      <div>
                        <p
                          className={`text-lg sm:text-xl font-bold ${
                            isDarkMode ? "text-white" : "text-black"
                          }`}
                        >
                          {card.value}
                        </p>
                        <p className="text-xs text-gray-400">{card.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ContentContainer>
        </div>
      </main>
    </div>
  );
};

export default ViewGroups;
