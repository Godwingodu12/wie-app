import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
// --- Carousel Library Import ---
import Slider from "react-slick";
// --- Carousel CSS (Self-contained) ---
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
// Your actual project imports
import { getUserGroupCapabilities, getGroups } from "../../services/ticketService";
import SideBar from "../../components/HomePage/SideBar.jsx";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import GroupSelectionModal from "../../components/modals/GroupSelectionModal";
// Your actual asset imports
import WieLogo from "../../assets/Event/WieLogo.svg";
import no_event from "../../assets/ViewGroup/no_event.png";
import PlusIcon from "../../assets/HomePage/PlusIcon.svg";
import HomeIcon from "../../assets/HomePage/HomeIcon.svg";
import SpeakerIcon from "../../assets/HomePage/SpeakerIcon.svg";
import NotificationIcon from "../../assets/HomePage/NotificationIcon.svg";
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

// --- Helper functions and components ---
const formatNumber = (num) => {
    const number = parseInt(num, 10);
    if (isNaN(number)) return "0";
    if (number >= 1000) {
        return (number / 1000).toFixed(number % 1000 !== 0 ? 1 : 0) + 'k';
    }
    return number.toString();
};

// --- SVG Icon components ---
const AddGroupIcon = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <line x1="12" y1="5" x2="12" y2="19"></line> <line x1="5" y1="12" x2="19" y2="12"></line> </svg>);
const TicketIcon = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"> <path d="M4 4h16v16H4z" fill="none" stroke="none" /> <path d="M15 5l0 2" /> <path d="M15 11l0 2" /> <path d="M15 17l0 2" /> <path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-3a2 2 0 0 0 0 -4v-3a2 2 0 0 1 2 -2" /> </svg>);
const GroupIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none" className={className}> <path d="M12.9276 12.4943C14.8776 12.4943 16.3942 10.9054 16.3942 8.95544C16.3942 7.00544 14.8053 5.48877 12.8553 5.48877C10.9053 5.48877 9.38867 7.07766 9.38867 8.95544C9.38867 10.9054 10.9776 12.4943 12.9276 12.4943ZM12.8553 6.93321C14.0109 6.93321 14.9498 7.8721 14.9498 9.02766C14.9498 10.1832 14.0109 11.0499 12.8553 11.0499C11.6998 11.0499 10.8331 10.111 10.8331 9.02766C10.8331 7.8721 11.772 6.93321 12.8553 6.93321Z" fill="currentColor" /> <path d="M23.6168 12.061C22.2446 10.8332 20.4391 10.1832 18.5613 10.2554H17.9835C17.8391 10.8332 17.6224 11.3388 17.3335 11.7721C17.7668 11.6999 18.1279 11.6999 18.5613 11.6999C19.9335 11.6277 21.3057 12.061 22.3891 12.8554V18.0554H23.8335V12.2777L23.6168 12.061Z" fill="currentColor" /> <path d="M16.8998 5.63325C17.2609 4.76658 18.272 4.33325 19.2109 4.69436C20.0776 5.05547 20.5109 6.06658 20.1498 7.00547C19.8609 7.65547 19.2109 8.0888 18.5609 8.0888C18.4165 8.0888 18.1998 8.0888 18.0553 8.01658C18.1276 8.37769 18.1276 8.7388 18.1276 9.02769V9.46102C18.272 9.46102 18.4165 9.53325 18.5609 9.53325C20.3665 9.53325 21.8109 8.0888 21.8109 6.35547C21.8109 4.54991 20.3664 3.10547 18.6331 3.10547C17.4776 3.10547 16.4664 3.68325 15.8887 4.69436C16.2498 4.91102 16.6109 5.19991 16.8998 5.63325Z" fill="currentColor" /> <path d="M8.6665 11.8444C8.37761 11.411 8.16095 10.9055 8.0165 10.3277H7.43873C5.56095 10.2555 3.75539 10.9055 2.38317 12.061L2.1665 12.2777V18.0555H3.61095V12.8555C4.7665 12.061 6.0665 11.6277 7.43873 11.6999C7.87206 11.6999 8.30539 11.7722 8.6665 11.8444Z" fill="currentColor" /> <path d="M7.43894 9.4612C7.58338 9.4612 7.72783 9.4612 7.87227 9.38898V8.95564C7.87227 8.59453 7.87227 8.23342 7.94449 7.94453C7.80005 8.01675 7.58338 8.01675 7.43894 8.01675C6.50005 8.01675 5.70561 7.22231 5.70561 6.28342C5.70561 5.34453 6.50005 4.55009 7.43894 4.55009C8.16116 4.55009 8.81116 4.98342 9.10005 5.63342C9.38894 5.27231 9.82227 4.9112 10.1834 4.62231C9.24449 3.10564 7.29449 2.60009 5.77783 3.53898C4.26116 4.47787 3.75561 6.42787 4.69449 7.94453C5.27227 8.88342 6.28338 9.4612 7.43894 9.4612Z" fill="currentColor" /> <path d="M18.8499 16.3944L18.7055 16.1777C17.2611 14.5888 15.2388 13.6499 13.0722 13.7221C10.9055 13.6499 8.81106 14.5888 7.36661 16.1777L7.22217 16.3944V21.8833C7.22217 22.5333 7.72772 23.111 8.44995 23.111H17.6944C18.3444 23.111 18.9222 22.5333 18.9222 21.8833V16.3944H18.8499ZM17.4055 21.6666H8.66661V16.8999C9.82217 15.7444 11.4111 15.1666 13.0722 15.1666C14.6611 15.0944 16.2499 15.7444 17.4055 16.8999V21.6666Z" fill="currentColor" /> </svg>);
const HeartIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="15" viewBox="0 0 18 15" fill="none" className={className}> <path d="M12.75 0.875C11.175 0.875 9.7875 1.6625 9 2.9C8.2125 1.6625 6.825 0.875 5.25 0.875C2.775 0.875 0.75 2.9 0.75 5.375C0.75 9.8375 9 14.375 9 14.375C9 14.375 17.25 9.875 17.25 5.375C17.25 2.9 15.225 0.875 12.75 0.875Z" fill="currentColor" /> </svg>);
const ShareIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}> <path d="M13.252 0.915676L0.904763 5.03243C0.854208 5.04924 0.809965 5.08104 0.777914 5.12359C0.745862 5.16615 0.727519 5.21745 0.725321 5.27069C0.723124 5.32392 0.737176 5.37656 0.76561 5.42161C0.794045 5.46667 0.835516 5.502 0.884513 5.52293L5.42201 7.46768C5.44579 7.47797 5.47183 7.48193 5.49759 7.47917C5.52335 7.47641 5.54796 7.46702 5.56901 7.45193L10.0173 4.27343C10.1553 4.17593 10.3248 4.34543 10.2273 4.48343L7.04876 8.93168C7.03392 8.95272 7.02474 8.97722 7.02212 9.00284C7.01949 9.02845 7.0235 9.05431 7.03376 9.07793L8.97776 13.6154C8.99862 13.6644 9.03389 13.706 9.0789 13.7345C9.1239 13.763 9.17652 13.7771 9.22974 13.775C9.28297 13.7728 9.33429 13.7546 9.3769 13.7226C9.4195 13.6906 9.45137 13.6464 9.46826 13.5959L13.585 1.24793C13.6005 1.20164 13.6028 1.15196 13.5916 1.10445C13.5804 1.05694 13.5562 1.0135 13.5217 0.978984C13.4872 0.944473 13.4437 0.920267 13.3962 0.909083C13.3487 0.8979 13.2983 0.900183 13.252 0.915676Z" fill="currentColor" /> </svg>);
const CalendarIcon = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect> <line x1="16" y1="2" x2="16" y2="6"></line> <line x1="8" y1="2" x2="8" y2="6"></line> <line x1="3" y1="10" x2="21" y2="10"></line> </svg>);
const ChevronLeftIcon = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>);
const ChevronRightIcon = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>);
const TotalEventsIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="14" viewBox="0 0 16 14" fill="none" className={className}><rect x="1" y="2" width="14" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" /><line x1="1" y1="6" x2="15" y2="6" stroke="currentColor" strokeWidth="1.5" /><line x1="4.5" y1="0.5" x2="4.5" y2="3.5" stroke="currentColor" strokeWidth="1.5" /><line x1="11.5" y1="0.5" x2="11.5" y2="3.5" stroke="currentColor" strokeWidth="1.5" /></svg>);
const PendingEventsIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="14" viewBox="0 0 16 14" fill="none" className={className}><path fillRule="evenodd" clipRule="evenodd" d="M6.54347 0.884372C7.89269 0.587953 9.30199 0.74505 10.5528 1.3313C11.7555 1.89499 12.7471 2.82517 13.3864 3.98633L11.3907 3.63442C11.1899 3.59902 10.9985 3.73307 10.963 3.93382C10.9277 4.13457 11.0617 4.32601 11.2624 4.36141L14.1704 4.87416C14.3712 4.90956 14.5626 4.77551 14.598 4.57476L15.1108 1.6668C15.1461 1.46605 15.0121 1.27461 14.8114 1.2392C14.6106 1.20381 14.4192 1.33786 14.3838 1.53861L14.0193 3.60542C13.3043 2.31923 12.2017 1.28886 10.8661 0.662866C9.46809 0.0076493 7.89298 -0.167926 6.38505 0.163359C4.87711 0.494651 3.52063 1.3143 2.52604 2.49515C1.53144 3.67601 0.954307 5.15207 0.884178 6.69441C0.874913 6.89801 1.03249 7.0706 1.23613 7.0799C1.43977 7.08913 1.61236 6.93152 1.62162 6.72793C1.6232 6.69316 1.62507 6.65839 1.62723 6.62369C1.63222 6.60428 1.63551 6.58412 1.63693 6.56353C1.63831 6.54352 1.63789 6.52366 1.63579 6.50432C1.74139 5.20569 2.24893 3.97005 3.09065 2.97071C3.98056 1.91415 5.19424 1.18079 6.54347 0.884372ZM1.07239 8.61094C1.09761 8.71746 1.12533 8.82347 1.15557 8.92889C1.18581 9.0343 1.21848 9.1389 1.25355 9.24262C1.31886 9.43574 1.5345 9.52787 1.72389 9.45249C1.9133 9.37712 2.00462 9.16275 1.94051 8.96926C1.91377 8.88858 1.88865 8.80723 1.86517 8.72536C1.8417 8.64349 1.8199 8.56126 1.79982 8.47865C1.75164 8.28059 1.56058 8.1472 1.36002 8.18367C1.15945 8.22013 1.02544 8.41258 1.07239 8.61094ZM14.2789 9.90258C14.3634 9.71707 14.2692 9.50232 14.0795 9.42769C13.8898 9.35306 13.6765 9.44688 13.5909 9.63188C13.5552 9.70902 13.5178 9.7855 13.4789 9.86124C13.4401 9.93698 13.3996 10.0119 13.3578 10.0859C13.2574 10.2633 13.3054 10.4913 13.4767 10.602C13.6479 10.7126 13.8772 10.664 13.9787 10.4872C14.0332 10.3922 14.0856 10.296 14.1357 10.1984C14.1857 10.1008 14.2335 10.0022 14.2789 9.90258ZM2.23188 11.1296C2.2964 11.2181 2.36305 11.3051 2.43179 11.3905C2.50052 11.476 2.57118 11.5598 2.6437 11.6418C2.77875 11.7945 3.01325 11.7959 3.15863 11.6529C3.30401 11.51 3.30511 11.277 3.17101 11.1235C3.11509 11.0595 3.06042 10.9943 3.00705 10.9279C2.95368 10.8616 2.90172 10.7942 2.85118 10.7258C2.72999 10.5619 2.50218 10.513 2.33142 10.6243C2.16067 10.7356 2.11171 10.965 2.23188 11.1296ZM12.6534 12.1489C12.8032 12.0107 12.7995 11.7762 12.6536 11.6339C12.5077 11.4916 12.2747 11.4954 12.124 11.6327C12.0612 11.69 11.9972 11.746 11.9319 11.8008C11.8667 11.8556 11.8004 11.9089 11.7332 11.9609C11.5719 12.0855 11.5278 12.3144 11.6428 12.4827C11.7577 12.6511 11.988 12.6951 12.1501 12.5715C12.2372 12.5051 12.3227 12.4366 12.4067 12.3661C12.4907 12.2955 12.5729 12.2231 12.6534 12.1489ZM4.27694 13.0022C4.37069 13.0586 4.46584 13.113 4.56234 13.1652C4.65883 13.2173 4.75643 13.2671 4.85505 13.3146C5.03873 13.403 5.25543 13.3134 5.33407 13.1253C5.41269 12.9373 5.32341 12.722 5.14028 12.6325C5.06391 12.5951 4.98825 12.5562 4.91333 12.5157C4.83841 12.4752 4.76439 12.4332 4.69132 12.3898C4.51607 12.2857 4.28711 12.3289 4.17285 12.4977C4.05859 12.6665 4.10235 12.8969 4.27694 13.0022ZM10.2843 13.5897C10.4759 13.5203 10.5635 13.3028 10.4841 13.115C10.4047 12.9272 10.1884 12.8405 9.99635 12.9087C9.91625 12.9371 9.83549 12.9639 9.75414 12.9892C9.67279 13.0143 9.59107 13.0379 9.50891 13.0597C9.31188 13.1121 9.18255 13.3059 9.2233 13.5057C9.26398 13.7054 9.45923 13.8354 9.65655 13.7842C9.76249 13.7567 9.8679 13.7268 9.97265 13.6943C10.0775 13.6618 10.1813 13.6269 10.2843 13.5897ZM6.88791 13.9356C6.99621 13.9513 7.10502 13.9646 7.21413 13.9753C7.32331 13.986 7.43256 13.994 7.54189 13.9995C7.74549 14.0099 7.91055 13.8433 7.91011 13.6394C7.90974 13.4356 7.74401 13.2718 7.54049 13.2602C7.45559 13.2554 7.37077 13.2489 7.28603 13.2406C7.20128 13.2323 7.11676 13.2223 7.03253 13.2106C6.83063 13.1825 6.63633 13.311 6.5964 13.511C6.55653 13.7109 6.68616 13.9063 6.88791 13.9356ZM7.84404 4.41196V6.99567H10.4284C10.6323 6.99567 10.7975 7.16096 10.7975 7.36478C10.7975 7.56867 10.6323 7.73388 10.4284 7.73388H7.10583V4.41196C7.10583 4.20811 7.27104 4.04286 7.47494 4.04286C7.67875 4.04286 7.84404 4.20811 7.84404 4.41196Z" fill="currentColor" /></svg>);
const LiveEventsIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="26" height="19" viewBox="0 0 26 19" fill="none" className={className}><path d="M5.51318 0.675012C5.07095 0.261547 4.33883 0.226194 3.87431 0.659022C1.48149 2.88865 0 5.97444 0 9.38306C0 12.9243 1.59898 16.1169 4.15758 18.3633C4.62497 18.7736 5.3374 18.7301 5.77016 18.3255C6.27481 17.8538 6.21341 17.1034 5.72687 16.6685C3.6734 14.8333 2.39516 12.248 2.39516 9.38306C2.39516 6.62636 3.57854 4.12883 5.49714 2.30905C5.96054 1.86953 6.00749 1.13718 5.51318 0.675012Z" fill="currentColor" /><path d="M8.32646 3.30483C7.89664 2.90296 7.1784 2.85276 6.71587 3.28066C5.03455 4.83617 3.99219 6.99601 3.99219 9.38278C3.99219 11.9081 5.15895 14.179 7.01471 15.7493C7.48051 16.1434 8.16902 16.0826 8.5848 15.6939C9.10879 15.204 9.01014 14.433 8.51908 14.0002C7.2061 12.8427 6.38735 11.2024 6.38735 9.38278C6.38735 7.66494 7.11698 6.10721 8.30316 4.96442C8.76031 4.52401 8.83452 3.77985 8.32646 3.30483Z" fill="currentColor" /><path d="M17.2224 3.30483C17.6522 2.90296 18.3704 2.85276 18.833 3.28066C20.5143 4.83617 21.5567 6.99601 21.5567 9.38278C21.5567 11.9081 20.3899 14.179 18.5341 15.7493C18.0683 16.1434 17.3798 16.0826 16.964 15.6939C16.4401 15.204 16.5386 14.433 17.0298 14.0002C18.3428 12.8427 19.1615 11.2024 19.1615 9.38278C19.1615 7.66494 18.4319 6.10721 17.2457 4.96442C16.7885 4.52401 16.7143 3.77985 17.2224 3.30483Z" fill="currentColor" /><path d="M20.0353 0.675012C20.4776 0.261547 21.2097 0.226194 21.6742 0.659022C24.067 2.88865 25.5485 5.97444 25.5485 9.38306C25.5485 12.9243 23.9495 16.1169 21.391 18.3633C20.9236 18.7736 20.2111 18.7301 19.7784 18.3255C19.2736 17.8538 19.3351 17.1034 19.8216 16.6685C21.8751 14.8333 23.1533 12.248 23.1533 9.38306C23.1533 6.62636 21.9699 4.12883 20.0513 2.30905C19.5879 1.86953 19.5409 1.13718 20.0353 0.675012Z" fill="currentColor" /><path d="M12.7741 7.14307C11.4513 7.14307 10.3789 8.14567 10.3789 9.38245C10.3789 10.6192 11.4513 11.6218 12.7741 11.6218C14.0968 11.6218 15.1692 10.6192 15.1692 9.38245C15.1692 8.14567 14.0968 7.14307 12.7741 7.14307Z" fill="currentColor" /></svg>);
const CheckCircleIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}><path d="M7 0C7.64258 0 8.26237 0.0820312 8.85938 0.246094C9.45638 0.410156 10.0124 0.647135 10.5273 0.957031C11.0423 1.26693 11.514 1.63151 11.9424 2.05078C12.3708 2.47005 12.7376 2.94173 13.043 3.46582C13.3483 3.98991 13.583 4.54818 13.7471 5.14062C13.9111 5.73307 13.9954 6.35286 14 7C14 7.64258 13.918 8.26237 13.7539 8.85938C13.5898 9.45638 13.3529 10.0124 13.043 10.5273C12.7331 11.0423 12.3685 11.514 11.9492 11.9424C11.5299 12.3708 11.0583 12.7376 10.5342 13.043C10.0101 13.3483 9.45182 13.583 8.85938 13.7471C8.26693 13.9111 7.64714 13.9954 7 14C6.35742 14 5.73763 13.918 5.14062 13.7539C4.54362 13.5898 3.98763 13.3529 3.47266 13.043C2.95768 12.7331 2.486 12.3685 2.05762 11.9492C1.62923 11.5299 1.26237 11.0583 0.957031 10.5342C0.651693 10.0101 0.416992 9.45182 0.25293 8.85938C0.0888672 8.26693 0.00455729 7.64714 0 7C0 6.35742 0.0820312 5.73763 0.246094 5.14062C0.410156 4.54362 0.647135 3.98763 0.957031 3.47266C1.26693 2.95768 1.63151 2.486 2.05078 2.05762C2.47005 1.62923 2.94173 1.26237 3.46582 0.957031C3.98991 0.651693 4.54818 0.416992 5.14062 0.25293C5.73307 0.0888672 6.35286 0.00455729 7 0ZM11.1221 4.68262L10.1924 3.75293L5.6875 8.25781L3.80762 6.37793L2.87793 7.30762L5.6875 10.1172L11.1221 4.68262Z" fill="currentColor" /></svg>);

const HEADER_HEIGHT = 72;

// UPDATED: Scrollbar now receives the isDark prop to change styles
const CustomScrollbarStyles = ({ isDark }) => (
    <style>{`
        .main-scrollbar {
            scrollbar-color: ${isDark ? '#4f4f4f #232426' : '#c1c1c1 #f1f1f1'};
            scrollbar-width: thin;
        }
        .main-scrollbar::-webkit-scrollbar { width: 8px; }
        .main-scrollbar::-webkit-scrollbar-track { background: ${isDark ? '#232426' : '#f1f1f1'}; }
        .main-scrollbar::-webkit-scrollbar-thumb {
            background-color: ${isDark ? '#4f4f4f' : '#c1c1c1'};
            border-radius: 10px;
            border: 2px solid ${isDark ? '#232426' : '#f1f1f1'};
        }
    `}</style>
);

const SvgGroupCard = ({ card, isAddCard = false, isDark }) => {
    const cardPath = "M 35 30 H 70 a 30 30 0 0 0 60 0 H 165 a 15 15 0 0 1 15 15 V 265 a 15 15 0 0 1 -15 15 H 35 a 15 15 0 0 1 -15 -15 V 45 a 15 15 0 0 1 15 -15 Z";

    const dropShadowStyle = isDark
        ? { filter: 'drop-shadow(0px 12px 18px rgba(0, 0, 0, 0.5))' }
        : { filter: 'drop-shadow(5px 10px 10px rgba(0, 0, 0, 0.15))' };
    
    const cardBgColor = isDark ? '#26292B' : '#FFFFFF';

    return (
        <div className="w-full h-full" style={dropShadowStyle}>
            <svg viewBox="0 0 200 280" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                <path d={cardPath} fill={cardBgColor} />
                <foreignObject x="0" y="0" width="200" height="280">
                    <div className="w-full h-full flex flex-col items-center text-center">
                        {isAddCard ? (
                            <Link to="/ticket/create-group" className="w-full h-full flex flex-col justify-center items-center group">
                                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center border-4 border-[#26292B] transition-transform duration-300 group-hover:scale-110">
                                    <AddGroupIcon className={`w-8 h-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                                </div>
                                <h3 className={`font-semibold text-sm mt-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Add New Group</h3>
                            </Link>
                        ) : (
                            <div className="w-full h-full flex flex-col px-6 pt-16">
                                <div className="text-center">
                                    <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-black flex items-center justify-center flex-shrink-0 mx-auto">
                                        <span className="text-sm">logo</span>
                                    </div>
                                    <div className="mt-1">
                                        <h3 className={`font-semibold text-sm lg:text-base truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{card.name}</h3>
                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{card.type}</p>
                                    </div>
                                </div>

                                <div className="flex-grow flex flex-col justify-center items-center w-full">
                                    <div className="w-full flex items-center gap-2 mb-3">
                                        <div className={`w-full ${isDark ? 'bg-white/20' : 'bg-gray-200'} rounded-full h-1.5`}>
                                            <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: `${card.progress}%` }}></div>
                                        </div>
                                        <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{card.progress}%</span>
                                    </div>
                                    <button className="py-1 px-8 rounded-full font-semibold text-xs mb-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">View</button>
                                </div>
                                
                                <div className={`w-full border-t pt-1 pb-2 ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
                                    <div className={`flex justify-around items-center text-xs ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                                        <div className="flex flex-col items-center space-y-1"><HeartIcon className="w-4 h-4 text-red-500" /><span>{formatNumber(card.likes)}</span></div>
                                        <div className="flex flex-col items-center space-y-1"><TicketIcon className="w-4 h-4" /><span>{formatNumber(card.comments)}</span></div>
                                        <div className="flex flex-col items-center space-y-1"><ShareIcon className="w-4 h-4" /><span>{formatNumber(card.shares)}</span></div>
                                        <div className="flex flex-col items-center space-y-1"><CalendarIcon className="w-4 h-4" /><span>{formatNumber(card.events)}</span></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </foreignObject>
            </svg>
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

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const shouldBeDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;
        setIsDark(shouldBeDark);
        document.documentElement.classList.toggle("dark", shouldBeDark);
    }, []);

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
                const formattedGroups = userGroups.map((group) => ({ id: group._id, name: group.name, type: group.grp_type ? group.grp_type.charAt(0).toUpperCase() + group.grp_type.slice(1) : "General", progress: group.progress || 50, likes: group.likes || "0", comments: group.comments || "0", shares: group.shares || 0, events: group.events || 0, }));
                setCreatedGroups(formattedGroups);
                
                const groupCounts = formattedGroups.reduce((acc, group) => { const type = group.type.toLowerCase(); acc[type] = (acc[type] || 0) + 1; return acc; }, { organisation: 0, admin: 0 });
                let shouldShowAddCard = false;
                if (userRole === "admin") { if (groupCounts.organisation < 1 || groupCounts.admin < 1) shouldShowAddCard = true; } 
                else if (userRole === "organisation") { if (groupCounts.organisation < 6) shouldShowAddCard = true; }
                
                if (formattedGroups.length === 0) {
                    shouldShowAddCard = true;
                }

                setShowAddGroupCard(shouldShowAddCard);
                setError("");
            } catch (err) { setError("Failed to fetch your groups. Please try again later."); } 
            finally { setLoading(false); }
        };
        fetchAndProcessGroups();
    }, []);

    const addGroupPlaceholder = { id: "add-new-group" };
    
    const allCards = useMemo(() => {
        return showAddGroupCard ? [...createdGroups, addGroupPlaceholder] : [...createdGroups];
    }, [createdGroups, showAddGroupCard]);

    const handleCreateClick = async () => {
        setLoading(true);
        try {
            const groupsResponse = await getGroups();
            const groupsArray = Array.isArray(groupsResponse) ? groupsResponse : groupsResponse.data || [];
            setModalGroups(groupsArray);
            if (groupsArray.length === 0) navigate("/ticket/create-group");
            else if (groupsArray.length === 1) navigate(`/ticket/create-event/${groupsArray[0]._id}`);
            else setIsModalOpen(true);
        } catch { alert("Error fetching groups. Please try again."); } 
        finally { setLoading(false); }
    };

    const handleSelectGroupForEvent = (selectedGroup) => {
        setIsModalOpen(false);
        navigate(`/ticket/create-event/${selectedGroup._id}`);
    };

    const sliderSettings = {
        dots: false,
        arrows: false,
        infinite: true,
        speed: 5000,
        autoplay: true,
        autoplaySpeed: 0,
        cssEase: "linear",
        pauseOnHover: true,
        slidesToScroll: 1,
        slidesToShow: 3.5,
        responsive: [
            {
                breakpoint: 1280,
                settings: { slidesToShow: 3, infinite: allCards.length > 3, }
            },
            {
                breakpoint: 1024,
                settings: { slidesToShow: 3, infinite: allCards.length > 3, }
            },
            {
                breakpoint: 768,
                settings: { slidesToShow: 3, infinite: allCards.length > 3, }
            },
            {
                breakpoint: 640,
                settings: { slidesToShow: 1.5, infinite: allCards.length > 1, }
            }
        ]
    };

    const theme = isDark 
        ? { bg: "bg-[#212426]", text: "text-white", subText: "text-[#c9c9cf]", cardBg: "bg-[#232426]", border: "border-[#23233a]", inputBg: "bg-[#212426]", specialButtonBg: "bg-[#21d18b]" } 
        : { bg: "bg-white", text: "text-gray-900", subText: "text-gray-600", cardBg: "bg-gray-50", border: "border-gray-200", inputBg: "bg-gray-100", specialButtonBg: "bg-gradient-to-r from-purple-500 to-indigo-600" };
    
    const outerShadow = { boxShadow: isDark ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)' : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)' };
    

    const combinedShadow = { 
        boxShadow: isDark 
            ? 'inset 3px 3px 6px rgba(0,0,0,0.6), inset -3px -3px 6px rgba(40,40,40,0.3), 0 10px 20px -5px rgba(0,0,0,0.5)' 
            : 'inset 3px 3px 6px rgba(0,0,0,0.05), inset -3px -3px 6px rgba(255,255,255,0.8), 0 10px 15px -3px rgba(0,0,0,0.1)'
    };
    const buttonCombinedShadow = {
        boxShadow: isDark
            ? 'inset 2px 2px 4px rgba(0,0,0,0.01), inset -2px -2px 4px rgba(40,40,40,0.3), 0 5px 10px -3px rgba(0,0,0,0.4)'
            : 'inset 2px 2px 4px rgba(0,0,0,0.05), inset -2px -2px 4px rgba(255,255,255,0.8), 0 5px 10px -3px rgba(0,0,0,0.1)'
    };
    

    const dashboardStats = [ { icon: GroupIcon, title: "Total Groups Created", value: createdGroups.length }, { icon: SpeakerIcon, title: "Live Events", value: "0" }, { icon: TicketIcon, title: "Total Events", value: "0" }, ];
    const displayName = user?.name || "User";

    const activatedGroupStats = [ { name: "Tree", value: 52, color: "bg-purple-600" }, { name: "Infosys", value: 28, color: "bg-purple-400" }, { name: "Gecw", value: 20, color: "bg-purple-200" }, ];
    const statCards = [ { value: 13, label: "Total Events", color: "purple", icon: <TotalEventsIcon className="w-4 h-4" />, }, { value: 8, label: "Pending Events", color: "orange", icon: <PendingEventsIcon className="w-4 h-4" />, }, { value: 3, label: "Live Events", color: "blue", icon: <LiveEventsIcon className="w-4 h-4" />, }, { value: 2, label: "Completed", color: "green", icon: <CheckCircleIcon className="w-4 h-4" />, }, ];
    const statCardStyles = { purple: { bg: "bg-purple-500/10", text: "text-purple-500" }, orange: { bg: "bg-orange-500/10", text: "text-orange-500" }, blue: { bg: "bg-blue-500/10", text: "text-blue-500" }, green: { bg: "bg-green-500/10", text: "text-green-500" }, };
    const monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December", ];
    const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const changeMonth = (offset) => { setCurrentDate(new Date(year, month + offset, 1)); };

    const BottomNavigation = () => (
        <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[95%] md:hidden">
            <div className={`flex justify-around items-center py-3 px-4 rounded-full ${theme.cardBg} ${theme.border} ${isDark ? 'shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(60,60,60,0.3)]' : 'shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.8)]'}`}>
                {[ { to: "/home", icon: HomeIcon, label: "Home" }, { to: "/ticket/view-groups", icon: GroupIcon, label: "Groups", active: true}, { icon: PlusIcon, label: "Create", special: true }, { to: "/ticket/live-events", icon: SpeakerIcon, label: "Live Events" }, { to: "/profile", label: "Profile", profile: true }, ].map(({ to, icon, label, special, profile, active }) =>
                    special ? ( <div key={label}><button onClick={handleCreateClick} disabled={loading} style={outerShadow} className={`w-8 h-8 rounded-full flex items-center justify-center transition hover:scale-105 ${theme.specialButtonBg}`}><img src={icon} alt="Create" className="w-6 h-6 invert brightness-0" /></button></div> ) 
                            : ( <Link key={label} to={to} className="flex items-center justify-center p-2"> 
                                    {profile 
                                        ? (<div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold ${isDark ? 'bg-[#6a47fa] text-white' : 'bg-purple-200 text-purple-800'}`}>{displayName.charAt(0).toUpperCase()}</div>) 
                                        : (<div className={`w-8 h-8 flex items-center justify-center rounded-full ${active ? (isDark ? 'bg-gray-700' : 'bg-gray-200') : ''}`}><img src={icon} alt={label} className={`w-5 h-5 ${isDark ? 'filter brightness-0 invert' : ''}`} /></div>)
                                    } 
                                </Link> )
                )}
            </div>
        </nav>
    );

    if (loading && createdGroups.length === 0) return <div className={`flex items-center justify-center min-h-screen text-xl ${theme.bg} ${theme.text}`}>Loading your groups...</div>;
    if (error) return <div className={`flex items-center justify-center min-h-screen text-red-400 text-xl ${theme.bg}`}>{error}</div>;
    
    return (
        <>
            <SlickCarouselStyles />
            <CustomScrollbarStyles isDark={isDark} />
            
            <div className={`${theme.bg} ${theme.text} h-screen flex overflow-hidden transition-colors duration-300`}>
                <div className={`hidden md:flex flex-col flex-shrink-0 ${theme.bg}`}>
                    <div className="flex items-center justify-center" style={{ height: HEADER_HEIGHT }}>
                        <img src={WieLogo} alt="Wie Logo" className="w-12 h-12" />
                    </div>
                    <div className="flex-1">
                        <SideBar user={user} theme={theme} activePage="groups" dashboardStats={dashboardStats} />
                    </div>
                </div>

                <div className="flex flex-col flex-1 w-full overflow-hidden">
                    <header className="flex items-center justify-between px-4 md:px-6 flex-shrink-0" style={{ height: HEADER_HEIGHT }}>
                        <div className="flex md:hidden items-center justify-between w-full">
                            <img src={WieLogo} alt="Wie Logo" className="w-10 h-10" />
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <div style={{ boxShadow: isDark ? 'inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)' : 'inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)' }} className={`w-10 h-10 rounded-full flex items-center justify-center ${theme.bg}`}>
                                        <img src={NotificationIcon} alt="Notification" className={`w-4 h-4 ${isDark ? 'filter brightness-0 invert' : ''}`} />
                                    </div>
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">12</span>
                                </div>
                                <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-4 w-full">
                            <div className="flex-1 min-w-0"><SearchBar theme={theme} value={searchValue} onChange={(e) => setSearchValue(e.target.value)} /></div>
                            <div className="flex items-center gap-4 ml-auto flex-shrink-0">
                                <div className="relative">
                                    <div style={{ boxShadow: isDark ? 'inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)' : 'inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)' }} className={`w-12 h-12 rounded-full flex items-center justify-center ${theme.bg}`}><img src={NotificationIcon} alt="Notification" className={`w-4 h-4 ${isDark ? 'filter brightness-0 invert' : ''}`} /></div>
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">12</span>
                                </div>
                                <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
                            </div>
                        </div>
                    </header>

                    <main className={`main-scrollbar flex flex-col flex-1 p-4 overflow-y-auto pb-24 md:pb-4 ${theme.cardBg}`}>
                        <div className="flex items-center mb-4 flex-shrink-0">
                            <h1 className={`text-lg md:text-2xl font-semibold mr-4 ${theme.text}`}>Created Groups</h1>
                            <span style={outerShadow} className={`px-3 py-1.5 rounded-full text-xs flex items-center ${theme.bg} ${theme.text}`}><GroupIcon className="w-4 h-4 mr-2" /> {createdGroups.length} Groups</span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-3 flex flex-col gap-6">
                                {/* UPDATED: Using the new combinedShadow style */}
                                <div style={combinedShadow} className={`relative ${theme.bg} rounded-3xl p-2`}>
                                    {allCards.length > 0 ? (
                                        <Slider {...sliderSettings} key={isDark ? 'dark-key' : 'light-key'}>
                                            {allCards.map((card) => (
                                                <div key={card.id === "add-new-group" ? 'add-card' : card.id} className="px-2 py-2 mt-[-24px] mb-4">
                                                    <SvgGroupCard isAddCard={card.id === "add-new-group"} card={card} isDark={isDark} />
                                                </div>
                                            ))}
                                        </Slider>
                                    ) : (
                                        <div className="h-[280px]"></div>
                                    )}
                                </div>
                                {/* UPDATED: Using the new combinedShadow style */}
                                <div style={combinedShadow} className={`${theme.bg} rounded-3xl p-4 flex-1`}>
                                    <h2 className={`text-lg font-bold mb-2 flex items-center ${theme.text}`}><span className="text-red-500 mr-2 text-2xl leading-none">•</span> Live Events</h2>
                                    <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 py-4"><img src={no_event} alt="No live event" className="w-auto h-24 md:h-28 object-contain" /><div className="text-center md:text-left"><h3 className={`text-lg font-semibold ${theme.text}`}>No Live Event</h3><p className={`text-sm ${theme.subText}`}>There is no Live Event.</p></div></div>
                                </div>
                            </div>

                            <div className="lg:col-span-2">
                                {/* UPDATED: Using the new combinedShadow style */}
                                <div style={combinedShadow} className={`${theme.bg} rounded-3xl p-4 h-full`}>
                                    <div className="flex flex-col gap-6 h-full">
                                        <div className={`${theme.bg} rounded-2xl p-2`}>
                                            <div className="flex justify-between items-center mb-4"><h3 className={`font-semibold text-xl ${theme.text}`}>Activated Group Statistics</h3>
                                                {/* UPDATED: Using the new buttonCombinedShadow style */}
                                                <button style={buttonCombinedShadow} className={`text-[10px] px-3 py-1 rounded-full ${theme.subText} hover:text-white transition-colors`}>View all</button>
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                                <div className="relative w-1/2 h-48 flex-shrink-0">
                                                    <svg className="w-full h-full" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" strokeWidth="14" className={isDark ? "stroke-purple-900/40" : "stroke-purple-200/50"} fill="transparent" /><circle cx="50" cy="50" r="42" strokeWidth="14" stroke="url(#progressGradient)" fill="transparent" strokeLinecap="round" strokeDasharray={2 * Math.PI * 42} strokeDashoffset={(2 * Math.PI * 42) * (1 - (activatedGroupStats[0].value / 100))} transform="rotate(-90 50 50)"/><defs><linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#8B5CF6" /><stop offset="100%" stopColor="#6366F1" /></linearGradient></defs></svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center"><span className={`text-2xl font-bold ${theme.text}`}>52%</span><span className={`text-[10px] ${theme.subText}`}>Of Tree</span></div>
                                                </div>
                                                <div className="w-1/2 text-xs space-y-3">{activatedGroupStats.map(stat => (<div key={stat.name} className="flex items-center gap-2"><p className={`w-16 flex-shrink-0 ${theme.text}`}>{stat.name} {stat.value}%</p><div className={`w-full ${isDark ? "bg-gray-700/50" : "bg-gray-200"} rounded-full h-1.5`}><div className={`${stat.color} h-1.5 rounded-full`} style={{ width: `${stat.value}%` }}></div></div></div>))}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                                            <div style={outerShadow} className={`${theme.bg} rounded-2xl p-4  xl:col-span-4`}>
                                                <div className="flex justify-between items-center mb-2 md:mb-8 py-4"><button onClick={() => changeMonth(-1)} style={outerShadow} className={`p-1.5 rounded-md`}><ChevronLeftIcon className={`w-5 h-5 ${theme.text}`} /></button><h3 className={`font-semibold text-base md:text-lg ${theme.text}`}>{monthNames[month]} {year}</h3><button onClick={() => changeMonth(1)} style={outerShadow} className={`p-1.5 rounded-md`}><ChevronRightIcon className={`w-5 h-5 ${theme.text}`} /></button></div>
                                                <div className="grid grid-cols-7 text-center text-xs md:text-sm font-semibold text-gray-400 mb-2">{daysOfWeek.map((day, index) => (<div key={`${day}-${index}`}>{day}</div>))}</div>
                                                <div className="grid grid-cols-7 text-center text-sm">{Array.from({ length: firstDayOfMonth }).map((_, i) => (<div key={`empty-${i}`}></div>))}{Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (<div key={day} className={`flex items-center justify-center h-8 w-8 md:h-9 md:w-9 mx-auto rounded-full text-xs md:text-sm ${day === today.getDate() && month === today.getMonth() && year === today.getFullYear() ? "bg-blue-500 text-white font-semibold" : theme.text}`}>{day}</div>))}</div>
                                            </div>

                                            <div className="grid grid-cols-4 xl:grid-cols-1 gap-2 xl:flex xl:flex-col xl:col-span-1">
                                                {statCards.map((card) => (
                                                    <div key={card.label} style={outerShadow} className={`${theme.bg} rounded-2xl p-1 flex flex-col items-center justify-center text-center gap-1 flex-1`}>
                                                        <div className={`p-1 rounded-full ${statCardStyles[card.color].bg} ${statCardStyles[card.color].text}`}>{card.icon}</div>
                                                        <p className={`text-md font-bold ${theme.text}`}>{card.value}</p>
                                                        <p className={`text-[10px] md:text-xs ${theme.subText}`}>{card.label}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>

                    <BottomNavigation />
                </div>

                <GroupSelectionModal groups={modalGroups} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelectGroup={handleSelectGroupForEvent} />
            </div>
        </>
    );
};
export default ViewGroups;