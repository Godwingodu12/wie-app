// components/SubEventDetailModal.jsx
import React, { useState } from "react";
import {
  CalendarDays,
  MapPin,
  Globe,
  Video,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
  Briefcase,
  GraduationCap,
  Users,
  Settings,
} from "lucide-react";
import dayjs from "dayjs";

// Reusable components imported from the main app structure
import Card from "./Card";
import InsetCard from "./InsetCard";
import ProhibitPopover from "./ProhibitPopover";

// IMPORTED: Your specific SVG assets
import NoHashtagSubEvent from "../../assets/ViewSingleEvent/NoHashtagSubEvent.svg";
import HashtagSubEvent from "../../assets/ViewSingleEvent/HashtagSubEvent.svg";
import NoGuidSubEvent from "../../assets/ViewSingleEvent/NoGuideSubEvent.svg";
import GuideSubEvent from "../../assets/ViewSingleEvent/GuestSubEvent.svg"; // Changed to GuideSubEvent for clarity
import PaidSubEvent from "../../assets/ViewSingleEvent/PaidSubEvent.svg";
import FreeEventSubEvent from "../../assets/ViewSingleEvent/FreeEventSubEvent.svg";
import Map_Loc from "../../assets/ViewSingleEvent/Map_Loc.svg";
import EventLocationModal from "./EventLocationModal";
import CustomScrollbarStyles from "../CreateGroup/CustomScrollbarStyles";

const SubEventDetailModal = ({
  subEvent,
  theme,
  onClose,
  formatImagePath,
  setAppAlert,
}) => {
  if (!subEvent) return null;

  // --- Placeholder State for Carousel & Modals ---
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLocationModal, setShowLocationModal] = useState(false);

  let eventImages = [];

  // 1. Safely process event_images if they exist (using 'path' from schema)
  if (subEvent.event_images && subEvent.event_images.length > 0) {
    eventImages = subEvent.event_images
      .map((img) => ({
        url: formatImagePath(img.path),
        alt: subEvent.event_name || img.originalName || "Event Image",
      }))
      .filter((img) => img.url);
  }

  if (eventImages.length === 0) {
    const fallbackUrl = formatImagePath(
      subEvent.event_banner || subEvent.event_logo || subEvent.image_url
    );
    if (fallbackUrl) {
      eventImages.push({
        url: fallbackUrl,
        alt: subEvent.event_name || "Event Banner",
      });
    }
  }

  const images =
    eventImages.length > 0 ? eventImages : [{ url: null, alt: "No Image" }];
  const totalImages = images.length;

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  };
  // ------------------------------------

  // --- SUB-EVENT DATA DERIVATION ---
  const subEventData = subEvent;
  const bannerImageUrl = images[currentImageIndex].url;

  const rawDate =
    subEventData.event_dates?.[0]?.start_date ||
    subEventData.event_date ||
    subEventData.date;
  const formattedDate = rawDate
    ? dayjs(rawDate).format("DD, YYYY")
    : "Date N/A";

  const currentBankInfo = subEventData.banking_details?.[0] || {};
  const allGuides = subEventData.guests || subEventData.event_guides || [];

  // --- ICON/STATUS LOGIC ---
  let StatusIcon;

  if (subEventData.location_type === "offline" && subEventData.location) {
    StatusIcon = <MapPin size={18} className="text-white" />;
  } else if (subEventData.location_type === "online") {
    StatusIcon = <Globe size={18} className="text-white" />;
  } else if (subEventData.location_type === "recorded") {
    StatusIcon = <Video size={18} className="text-white" />;
  } else {
    StatusIcon = <MapPin size={18} className="text-white" />;
  }

  const eventTypeColor = subEventData.event_color || "#7C3AED";
  const eventTextColor = theme.isDark ? "text-gray-300" : "text-gray-800";
  const dividerColor = theme.isDark ? "#444" : "#ccc";

  const categoryLabel = subEventData.event_category || "Workshop";
  const subcategoryLabel = subEventData.event_subcategory || "Academic";

  const handleLocationClick = () => {
    if (subEventData.location_type === "offline") {
      setShowLocationModal(true);
    } else {
      setAppAlert({
        message: "Location Inapplicable",
        description:
          "Location details are not applicable for this online/recorded event.",
        type: "error",
        show: true,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 backdrop-blur-sm"
      onClick={onClose}
    >
      <CustomScrollbarStyles isDark={theme} />
      <div
        className={`w-full max-w-7xl max-h-[95vh] overflow-y-auto rounded-3xl relative flex flex-col custom-scrollbar`}
        style={{
          backgroundColor: theme.mainBg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={`absolute top-5 right-5 p-2 rounded-full transition-colors z-20`}
          style={{
            backgroundColor: theme.isDark ? theme.insetBg : theme.cardBg,
            border: `1px solid ${theme.isDark ? "#444" : "#ddd"}`,
            boxShadow: theme.shadowInset,
          }}
        >
          <X size={20} className={theme.textColor} />
        </button>

        {/* --- MODAL HEADER (CALENDAR | TITLE | STATUS) --- */}
        <div className="w-full space-y-4 md:flex items-center justify-between p-8 pb-4">
          {/* 1. Left Section (Calendar/Date) */}
          <div className="flex-1 flex justify-center">
            <Card
              theme={theme}
              className="flex items-center rounded-full relative overflow-visible h-10 pr-4"
              customStyle={{ boxShadow: theme.shadowInset, flexShrink: 0 }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center absolute left-0"
                style={{
                  background: eventTypeColor,
                  transform: "translateX(-25%)",
                  boxShadow: theme.shadowOutset,
                }}
              >
                <CalendarDays size={18} className="text-white" />
              </div>
              <p className={`text-sm ${eventTextColor} whitespace-nowrap pl-5`}>
                Event on : {formattedDate}
              </p>
            </Card>
          </div>

          {/* 2. Center Title */}
          <div className="flex-1 flex justify-center min-w-0 mx-4">
            <h1
              className={`text-3xl font-bold text-center ${eventTextColor} truncate`}
            >
              {subEventData.event_name ||
                subEventData.name ||
                "Sub-Event Workshop"}
            </h1>
          </div>

          {/* 3. Right Section (Location/Status) */}
          <div
            className="flex-1 flex justify-center cursor-pointer "
            onClick={handleLocationClick}
          >
            <Card
              theme={theme}
              className="flex items-center rounded-full relative overflow-visible h-10 pr-4"
              customStyle={{ boxShadow: theme.shadowInset, flexShrink: 0 }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center absolute left-0"
                style={{
                  background: eventTypeColor,
                  transform: "translateX(-25%)",
                  boxShadow: theme.shadowOutset,
                }}
              >
                <img src={Map_Loc} alt="" />
              </div>

              <p
                className={`text-sm ${eventTextColor} whitespace-nowrap pl-5 `}
              >
                {subEventData.location_type === "offline" &&
                subEventData.location
                  ? subEventData.location
                  : subEventData.location_type === "online"
                  ? "Online Event"
                  : subEventData.location_type === "recorded"
                  ? "Recorded Event"
                  : "Location N/A"}
              </p>
            </Card>
          </div>
        </div>
        {/* ------------------------------------------------ */}

        {/* Horizontal Rule Divider - Fades to both sides */}
        <div
          className="w-full h-[1px] mb-4"
          style={{
            background: `linear-gradient(to right, ${theme.mainBg} 0%, ${dividerColor} 20%, ${dividerColor} 80%, ${theme.mainBg} 100%)`,
          }}
        ></div>

        {/* --- MAIN CONTENT GRID (2/5 - 3/5 SPLIT) --- */}
        <div className="grid md:grid-cols-5 gap-6 p-6 pt-4">
          {/* LEFT PANEL: Image (2/5 width) */}
          <div className="md:col-span-2 flex flex-col my-auto space-y-4">
            <Card
              theme={theme}
              className="relative overflow-hidden rounded-2xl"
            >
              <div className="relative h-[25rem] w-full rounded-2xl overflow-hidden">
                <img
                  src={bannerImageUrl}
                  alt={images[currentImageIndex].alt || subEvent.event_name}
                  className="w-full h-full object-cover"
                />
                {/* Edit Icon Button */}
                <div
                  className="absolute top-4 left-4 rounded-full p-2 cursor-pointer transition-transform z-10"
                  style={{
                    backgroundColor: "#5E5CE6",
                    boxShadow: theme.shadowOutset,
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-pencil"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
                {/* Carousel Controls (Bottom) */}
                <div className="absolute bottom-4 w-full flex items-center justify-between px-4 z-10">
                  <button
                    onClick={handlePrevImage}
                    className={`p-3 rounded-full transition-colors ${
                      theme.isDark
                        ? "bg-black bg-opacity-40"
                        : "bg-white bg-opacity-40"
                    }`}
                    style={{ boxShadow: theme.shadowOutset }}
                  >
                    <ChevronLeft size={20} className="text-white" />
                  </button>
                  <div className="flex space-x-2">
                    {images.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                          index === currentImageIndex
                            ? "bg-white"
                            : "bg-white bg-opacity-50"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleNextImage}
                    className={`p-3 rounded-full transition-colors ${
                      theme.isDark
                        ? "bg-black bg-opacity-40"
                        : "bg-white bg-opacity-40"
                    }`}
                    style={{ boxShadow: theme.shadowOutset }}
                  >
                    <ChevronRight size={20} className="text-white" />
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT PANEL: Stacked Details (3/5 width) */}
          <div className="md:col-span-3 flex flex-col space-y-4">
            {/* 1. Description */}
            <Card theme={theme} className="p-4 ">
              <h3
                className={`text-lg font-semibold ${eventTextColor} flex items-center space-x-2`}
              >
                <Menu size={20} />
                <span>Description</span>
              </h3>
              <hr
                className={`w-full mx-auto border-t my-2 ${
                  theme.isDark ? "border-gray-700" : "border-gray-300"
                }`}
              />

              {/* Fixed height and scrollbar container */}
              <div className="h-20 overflow-y-auto pr-2">
                <p className={`text-sm ${eventTextColor}`}>
                  {subEventData.event_description &&
                  subEventData.event_description.trim()
                    ? subEventData.event_description
                    : "No detailed description is available for this sub-event."}
                </p>
              </div>
            </Card>
            {/* 2. Workshop/Academic & Hashtag Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Workshop/Academic - Stacked on the left side of this micro-grid */}
              <div className="flex flex-col space-y-4">
                <Card
                  theme={theme}
                  className="p-4 text-center flex items-center justify-center space-x-2"
                >
                  <span>{categoryLabel}</span>
                </Card>
                <Card
                  theme={theme}
                  className="p-4 text-center flex items-center justify-center space-x-2"
                >
                  <span>{subcategoryLabel}</span>
                </Card>
              </div>

              {/* Hashtags - Stacked on the right side of this micro-grid */}
              {subEventData.hashtag && subEventData.hashtag.length > 0 ? (
                <Card theme={theme} className="p-4">
                  <h3
                    className={`text-lg font-semibold ${eventTextColor} flex items-center space-x-2`}
                  >
                    <Settings size={20} />
                    <span>Hashtag</span>
                  </h3>
                  <hr
                    className={`w-full mx-auto border-t my-2 ${
                      theme.isDark ? "border-gray-700" : "border-gray-300"
                    }`}
                  />
                  <div className="flex flex-wrap gap-2">
                    {subEventData.hashtag.map((tag, i) => (
                      <span
                        key={i}
                        className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </Card>
              ) : (
                <Card
                  theme={theme}
                  className="p-4 flex items-center justify-start space-x-4"
                >
                  <img
                    src={NoHashtagSubEvent}
                    alt="Oops"
                    className="w-16 h-16 flex-shrink-0"
                  />
                  <div className="flex flex-col items-start">
                    <h2 className="text-lg font-bold">Oops..!</h2>
                    <p className="text-sm text-gray-400">
                      No hashtag available
                    </p>
                  </div>
                </Card>
              )}
            </div>
            {/* 3. Guide Details & Payment Details */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Guide Details */}
              {allGuides.length > 0 ? (
                <Card theme={theme} className="p-4">
                  <h3
                    className={`text-lg font-semibold ${eventTextColor} flex items-center space-x-2`}
                  >
                    <img src={GuideSubEvent} alt="" />
                    <span>Guide details</span>
                  </h3>
                  <hr
                    className={`w-full mx-auto border-t my-2 ${
                      theme.isDark ? "border-gray-700" : "border-gray-300"
                    }`}
                  />
                  {/* Guide Carousel Section (Simplified) */}
                  <div className="flex items-center space-x-2">
                    <ChevronLeft size={16} className="text-gray-400" />
                    <div className="flex space-x-3 overflow-x-auto flex-grow justify-center py-2">
                      {allGuides.slice(0, 3).map((guide, index) => (
                        <div
                          key={index}
                          className="text-center flex-shrink-0 w-24"
                        >
                          {" "}
                          {/* Increased width for better fit */}
                          <div
                            className={`w-full h-24 rounded-lg mx-auto mb-2 overflow-hidden ${
                              theme.isDark ? "bg-gray-800" : "bg-gray-300"
                            }`}
                            style={{
                              boxShadow: theme.shadowOutset, // Apply the floating shadow
                            }}
                          >
                            {/* Placeholder image or initial */}
                          </div>
                          {/* Text Details - MODIFIED TO MATCH IMAGE */}
                          <p
                            className={`text-sm font-semibold truncate ${eventTextColor}`}
                          >
                            {guide.guest_name || "Alen Thomas"}
                          </p>
                          <p className={`text-xs text-gray-400`}>Coordinator</p>
                        </div>
                      ))}
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </Card>
              ) : (
                <Card
                  theme={theme}
                  className="p-4 flex items-center justify-start space-x-4"
                >
                  <img
                    src={NoGuidSubEvent}
                    alt="Oops"
                    className="w-16 h-16 flex-shrink-0"
                  />
                  <div className="flex flex-col items-start">
                    <h2 className="text-lg font-bold">Oops..!</h2>
                    <p className="text-sm text-gray-400">No guide is added</p>
                  </div>
                </Card>
              )}

              {/* Payment Details */}
              {subEventData.payment_type === "paid" ? (
                <Card theme={theme} className="p-4">
                  <h3
                    className={`text-lg font-semibold mb-4 ${eventTextColor} flex items-center space-x-2`}
                  >
                    <img src={PaidSubEvent} alt="" />
                    <span>Payment Details</span>
                  </h3>
                  <hr
                    className={`w-full mx-auto border-t my-2 ${
                      theme.isDark ? "border-gray-700" : "border-gray-300"
                    }`}
                  />
                  <dl className="text-xs space-y-2">
                    <div className="flex justify-between">
                      <dt className={`text-gray-400 ${eventTextColor}`}>
                        Account Type :
                      </dt>
                      <dd className={`font-medium ${eventTextColor}`}>
                        {currentBankInfo.bank_acc_type || "Savings"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className={`text-gray-400 ${eventTextColor}`}>
                        Account Holder :
                      </dt>
                      <dd className={`font-medium ${eventTextColor}`}>
                        {currentBankInfo.bank_acc_holder ||
                          "Federal Bank Pvt Ltd"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className={`text-gray-400 ${eventTextColor}`}>
                        Account No :
                      </dt>
                      <dd className={`font-medium ${eventTextColor}`}>
                        {currentBankInfo.bank_acc_no || "1234567890123"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className={`text-gray-400 ${eventTextColor}`}>
                        IFSC :
                      </dt>
                      <dd className={`font-medium ${eventTextColor}`}>
                        {currentBankInfo.bank_ifsc || "FDRL0001847"}
                      </dd>
                    </div>
                  </dl>
                </Card>
              ) : (
                <Card
                  theme={theme}
                  className="p-4 flex items-center justify-start space-x-4"
                >
                  <img
                    src={FreeEventSubEvent}
                    alt="Free Event"
                    className="w-16 h-16 flex-shrink-0"
                  />
                  <div className="flex flex-col items-start">
                    <h2 className="text-lg font-bold">Free event</h2>
                    <p className="text-sm text-gray-400">
                      This is fee of cost no need of payment
                    </p>
                  </div>
                </Card>
              )}
            </div>{" "}
            {/* End Guide/Payment Grid */}
          </div>
        </div>
      </div>
      {showLocationModal && (
        <EventLocationModal
          eventData={subEventData} // Pass the subEvent data
          theme={theme}
          onClose={() => setShowLocationModal(false)}
          setAppAlert={setAppAlert}
        />
      )}{" "}
    </div>
  );
};
export default SubEventDetailModal;
