import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom"; // <--- ADD useLocation
import { getImageUrl } from "../../utils/imageUtils"; // <--- IMPORT getImageUrl
import {
  getTicketById,
  likeEvent,
  unlikeEvent,
  checkIfUserLiked,
} from "../../services/ticketService";

// --- SVG Icon Components ---
const BackIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);
const ChevronLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 19l-7-7 7-7"
    />
  </svg>
);
const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);
const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mr-2 inline"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);
const LocationIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mr-2 inline"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);
const TicketIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mr-2"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
    />
  </svg>
);
const HeartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mr-2"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 21l-7.682-7.682a4.5 4.5 0 010-6.364z"
    />
  </svg>
);
const ShareIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mr-2"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367 2.684z"
    />
  </svg>
);
const EnlargeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5"
    />
  </svg>
);
const MaximizeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5"
    />
  </svg>
);
const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mr-2 inline"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

import Calender_Preview from "../../assets/Event/Calender_Preview.svg";
import Location_Preview from "../../assets/Event/Location_Preview.svg";
import Event_Preview from "../../assets/Event/Event_Preview.svg";

const sanitizeName = (name) => {
  if (!name) return "";
  return name.replace(/[!#$%^*]/g, "");
};

const TicketPreview = () => {
  const { ticketId } = useParams();
  const API_BASE_URL = import.meta.env.VITE_TICKET_API_BASE_URL;
  const navigate = useNavigate();
  const location = useLocation(); // <--- READ THE LOCATION STATE
  const { isDark: isDarkModePassed } = location.state || {};

  // Determine the theme mode for styling
  const isDarkMode = isDarkModePassed || false; // Default to light mode if state is missing

  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("About");
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [selectedSubEvent, setSelectedSubEvent] = useState(null);
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  const handleGoBack = useCallback(() => navigate(-1), [navigate]);

  // --- Dynamic Styles based on Theme ---
  const {
    activeTabStyle,
    boxStyle,
    selectedDateStyle,
    mainTextClass,
    subTextClass,
    bgPrimaryClass,
    bgSecondaryClass,
    bgFooterClass,
    borderClass,
    proseClass,
  } = useMemo(() => {
    if (isDarkMode) {
      return {
        activeTabStyle: {
          background:
            "linear-gradient(270deg, rgba(36, 158, 255, 0.8) -8.43%, rgba(255, 255, 255, 0.8) 171.23%)",
        },
        boxStyle: {
          background:
            "linear-gradient(133.41deg, rgba(41, 121, 255, 0.1) -14.78%, rgba(185, 208, 247, 0.05) 100%)",
        },
        selectedDateStyle: {
          background:
            "linear-gradient(147.67deg, #2979FF 13.16%, #9DC1FF 100.03%)",
        },
        mainTextClass: "text-gray-300",
        subTextClass: "text-gray-400",
        bgPrimaryClass: "bg-[#0D0D0D]",
        bgSecondaryClass: "bg-[#1C1C1E]",
        bgFooterClass: "bg-black/20",
        borderClass: "border-gray-700",
        proseClass: "prose-invert",
      };
    } else {
      return {
        activeTabStyle: { backgroundColor: "#2979FF", color: "white" }, // Simpler light mode active tab
        boxStyle: {
          backgroundColor: "#ffffff",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)",
        },
        selectedDateStyle: { backgroundColor: "#2979FF", color: "white" },
        mainTextClass: "text-gray-700",
        subTextClass: "text-gray-500",
        bgPrimaryClass: "bg-gray-50",
        bgSecondaryClass: "bg-white",
        bgFooterClass: "bg-gray-500",
        borderClass: "border-gray-200",
        proseClass: "",
      };
    }
  }, [isDarkMode]);
  // -------------------------------------

  useEffect(() => {
    const fetchTicketData = async () => {
      if (!ticketId) {
        setError("No Ticket ID provided.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await getTicketById(ticketId);
        const ticketInfo =
          response?.ticket ||
          response?.data?.ticket ||
          response?.data ||
          response;
        if (!ticketInfo || !ticketInfo._id) {
          throw new Error("Ticket data not found.");
        }
        setEventData(ticketInfo);
      } catch (err) {
        setError(err.message || "Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };
    fetchTicketData();
    window.scrollTo(0, 0);
  }, [ticketId]);

  const subEvents = useMemo(() => eventData?.sub_events || [], [eventData]);

  const eventStats = useMemo(() => {
    if (!eventData) return { likeCount: 0, totalCapacity: 0, shareCount: 0 };
    const mainCapacity = Number(eventData.total_capacity || 0);
    const subEventsCapacity = (eventData.sub_events || []).reduce(
      (sum, sub) => sum + Number(sub.total_capacity || 0),
      0
    );
    return {
      likeCount: eventData.like_count || 0,
      totalCapacity: mainCapacity + subEventsCapacity,
      shareCount: eventData.share_count || 0,
    };
  }, [eventData]);

  // FIX 1: Parse all dates as UTC
  const mainEventActualDates = useMemo(() => {
    if (!eventData?.event_dates?.length) return [];
    const uniqueDateStrings = new Set();
    eventData.event_dates.forEach(({ start_date, end_date }) => {
      let currentDate = new Date(start_date);
      const lastDate = new Date(end_date);

      while (currentDate <= lastDate) {
        uniqueDateStrings.add(currentDate.toISOString().split("T")[0]);
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
    });
    return Array.from(uniqueDateStrings)
      .map((dateStr) => new Date(dateStr))
      .sort((a, b) => a - b);
  }, [eventData]);

  // FIX 2: Calculate range from original dates and format as UTC
  const formattedDateRange = useMemo(() => {
    if (!eventData?.event_dates?.length) return "Date TBA";

    const allDates = eventData.event_dates.flatMap((range) => [
      new Date(range.start_date),
      new Date(range.end_date),
    ]);

    const firstDate = new Date(Math.min.apply(null, allDates));
    const lastDate = new Date(Math.max.apply(null, allDates));

    const startTime = eventData.event_dates[0].start_time
      ? new Date(
          `1970-01-01T${eventData.event_dates[0].start_time}`
        ).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        })
      : "";

    const formatDate = (date) =>
      date.toLocaleDateString("en-US", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });

    if (firstDate.getTime() === lastDate.getTime()) {
      return `${formatDate(firstDate)} ${startTime ? `• ${startTime}` : ""}`;
    }
    return `${formatDate(firstDate)} - ${formatDate(lastDate)} ${
      startTime ? `• ${startTime}` : ""
    }`;
  }, [eventData?.event_dates]);

  // FIX 3: Use UTC methods for date arithmetic
  const allSelectableDates = useMemo(() => {
    if (!mainEventActualDates.length) return [];
    const earliestDate = mainEventActualDates[0];
    const latestDate = mainEventActualDates[mainEventActualDates.length - 1];

    const sliderStartDate = new Date(earliestDate);
    sliderStartDate.setUTCDate(sliderStartDate.getUTCDate() - 5);
    const sliderEndDate = new Date(latestDate);
    sliderEndDate.setUTCDate(sliderEndDate.getUTCDate() + 5);

    const dateRange = [];
    let currentDate = new Date(sliderStartDate);
    while (currentDate <= sliderEndDate) {
      dateRange.push(new Date(currentDate));
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    return dateRange;
  }, [mainEventActualDates]);

  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    if (mainEventActualDates.length) {
      setSelectedDate(mainEventActualDates[0].toISOString().split("T")[0]);
    }
  }, [mainEventActualDates]);

  // FIX 4: Use UTC for date comparisons
  const filteredSubEvents = useMemo(() => {
    if (!selectedDate || !subEvents.length) return [];
    const currentSelectedDate = new Date(selectedDate);
    return subEvents.filter((subEvent) => {
      if (!subEvent.event_dates || subEvent.event_dates.length === 0)
        return false;
      return subEvent.event_dates.some(({ start_date, end_date }) => {
        const subStartDate = new Date(start_date);
        const subEndDate = new Date(end_date);
        return (
          currentSelectedDate >= subStartDate &&
          currentSelectedDate <= subEndDate
        );
      });
    });
  }, [selectedDate, subEvents]);

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (selectedDate && scrollContainerRef.current) {
      const selectedButton = scrollContainerRef.current.querySelector(
        `[data-date="${selectedDate}"]`
      );
      if (selectedButton) {
        setTimeout(
          () =>
            selectedButton.scrollIntoView({
              behavior: "smooth",
              inline: "center",
              block: "nearest",
            }),
          100
        );
      }
    }
  }, [selectedDate]);

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  const handleShare = useCallback(async () => {
    const shareData = {
      title: sanitizeName(eventData?.event_name) || "Check out this event!",
      text: `I found this amazing event, check it out: ${sanitizeName(
        eventData?.event_name
      )}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        console.log("Event shared successfully via native share.");
      } catch (err) {
        console.error("Error using native share:", err);
      }
    } else {
      // Fallback for desktop or unsupported browsers
      try {
        await navigator.clipboard.writeText(shareData.url);
        setShowCopyAlert(true);
        setTimeout(() => setShowCopyAlert(false), 3000); // Hide alert after 3 seconds
      } catch (err) {
        console.error("Failed to copy URL to clipboard:", err);
        alert("Failed to copy link. Please copy the URL from the address bar.");
      }
    }
  }, [eventData]);

  const tabs = ["About", "Artists", "Photos", "Hashtags", "Additional info"];

  const renderContent = () => {
    if (!eventData) return null;
    switch (activeTab) {
      case "About":
        return (
          <div
            style={boxStyle}
            className={`p-6 rounded-xl ${
              isDarkMode ? "shadow-none" : "shadow-md"
            }`}
          >
            <h3
              className={`font-bold text-xs uppercase tracking-widest ${subTextClass} mb-4`}
            >
              ABOUT THE PERFORMANCE
            </h3>
            <div
              className={`space-y-4 text-sm ${mainTextClass} prose max-w-none ${proseClass}`}
              dangerouslySetInnerHTML={{ __html: eventData.event_description }}
            />
            <div className={`mt-6 border-t ${borderClass} pt-6`}>
              <h3
                className={`font-bold text-xs uppercase tracking-widest ${subTextClass} mb-4`}
              >
                Event Details
              </h3>
              <ul
                className={`space-y-2 text-sm list-disc list-inside ${mainTextClass}`}
              >
                {eventData.event_category && (
                  <li>
                    <strong>Category:</strong> {eventData.event_category}
                  </li>
                )}
                {eventData.event_subcategory && (
                  <li>
                    <strong>Sub-Category:</strong> {eventData.event_subcategory}
                  </li>
                )}
                {eventData.event_type && (
                  <li>
                    <strong>Type:</strong>{" "}
                    <span className="capitalize">{eventData.event_type}</span>
                  </li>
                )}
                {eventData.location_type && (
                  <li>
                    <strong>Mode:</strong>{" "}
                    <span className="capitalize">
                      {eventData.location_type}
                    </span>
                  </li>
                )}
                {eventData.event_language?.length > 0 && (
                  <li>
                    <strong>Languages:</strong>{" "}
                    {eventData.event_language.join(", ")}
                  </li>
                )}
              </ul>
            </div>
            {eventData.location_type === "offline" &&
              eventData.venue &&
              eventData.location && (
                <div className={`mt-6 border-t ${borderClass} pt-6`}>
                  <h3
                    className={`font-bold text-xs uppercase tracking-widest ${subTextClass} mb-4`}
                  >
                    VENUE & LOCATION
                  </h3>
                  <p className={`${mainTextClass} text-sm flex items-center`}>
                    <LocationIcon /> {eventData.venue}, {eventData.location}
                  </p>
                </div>
              )}
          </div>
        );
      case "Artists":
        return (
          <div
            style={boxStyle}
            className={`p-6 rounded-xl ${
              isDarkMode ? "shadow-none" : "shadow-md"
            }`}
          >
            {eventData.guests && eventData.guests.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                {eventData.guests.map((guest) => (
                  <div
                    key={guest._id || guest.guest_name}
                    className="text-center cursor-pointer group transition-transform transform hover:-translate-y-2"
                    onClick={() => setSelectedGuest(guest)}
                  >
                    <img
                      src={getImageUrl(guest.guest_profile, "auth")}
                      alt={guest.guest_name}
                      className={`w-24 h-24 rounded-full object-cover mx-auto mb-2 border-2 ${
                        isDarkMode ? "border-gray-600" : "border-gray-300"
                      } group-hover:border-blue-500 transition-colors`}
                    />
                    <p
                      className={`font-semibold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {guest.guest_name}
                    </p>
                    <p className="text-xs text-blue-500">View Details</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`${subTextClass} text-center`}>
                No artists information available.
              </p>
            )}
          </div>
        );
      case "Photos":
        return (
          <div
            style={boxStyle}
            className={`p-6 rounded-xl ${
              isDarkMode ? "shadow-none" : "shadow-md"
            }`}
          >
            {eventData.event_images && eventData.event_images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {eventData.event_images.map((image, index) => {
                  const imageUrl = getImageUrl(image.path, "ticket");
                  return (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden cursor-pointer relative group"
                      onClick={() => setFullScreenImage(imageUrl)}
                    >
                      <img
                        src={imageUrl}
                        alt={`Event gallery ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <MaximizeIcon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={`${subTextClass} text-center`}>
                No photos available.
              </p>
            )}
          </div>
        );
      case "Hashtags":
        const hashtags =
          typeof eventData.hashtag === "string"
            ? JSON.parse(eventData.hashtag)
            : eventData.hashtag;
        return (
          <div
            style={boxStyle}
            className={`p-6 rounded-xl ${
              isDarkMode ? "shadow-none" : "shadow-md"
            }`}
          >
            {hashtags && hashtags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    className={`${
                      isDarkMode
                        ? "bg-gray-700 text-gray-200"
                        : "bg-gray-200 text-gray-800"
                    } text-sm font-medium px-3 py-1 rounded-full`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className={`${subTextClass} text-center`}>
                No hashtags available.
              </p>
            )}
          </div>
        );
      case "Additional info":
        const prohibitedItems =
          typeof eventData.prohibited_items === "string"
            ? JSON.parse(eventData.prohibited_items)
            : eventData.prohibited_items;
        return (
          <div
            style={boxStyle}
            className={`p-6 rounded-xl space-y-8 ${
              isDarkMode ? "shadow-none" : "shadow-md"
            }`}
          >
            <div>
              <h3
                className={`font-bold text-xs uppercase tracking-widest ${subTextClass} mb-4`}
              >
                General Information
              </h3>
              <ul
                className={`space-y-2 text-sm list-disc list-inside ${mainTextClass}`}
              >
                <li>
                  <strong>Minimum Age:</strong>{" "}
                  {eventData.min_age_allowed
                    ? `${eventData.min_age_allowed}+`
                    : "All ages welcome"}
                </li>
                <li>
                  <strong>Kids Friendly:</strong>{" "}
                  {eventData.kids_friendly ? "Yes" : "No"}
                </li>
                <li>
                  <strong>Pet Friendly:</strong>{" "}
                  {eventData.pet_friendly ? "Yes" : "No"}
                </li>
              </ul>
            </div>
            {(eventData.event_youtube_link ||
              eventData.event_instagram_link) && (
              <div className={`border-t ${borderClass} pt-6`}>
                <h3
                  className={`font-bold text-xs uppercase tracking-widest ${subTextClass} mb-4`}
                >
                  Social Links
                </h3>
                <ul
                  className={`space-y-2 text-sm list-disc list-inside ${mainTextClass}`}
                >
                  {eventData.event_youtube_link && (
                    <li>
                      <strong>YouTube:</strong>{" "}
                      <a
                        href={eventData.event_youtube_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        Watch Here
                      </a>
                    </li>
                  )}
                  {eventData.event_instagram_link && (
                    <li>
                      <strong>Instagram:</strong>{" "}
                      <a
                        href={eventData.event_instagram_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        Follow Here
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}
            <div className={`border-t ${borderClass} pt-6`}>
              <h3
                className={`font-bold text-xs uppercase tracking-widest ${subTextClass} mb-4`}
              >
                PROHIBITED ITEMS
              </h3>
              {prohibitedItems && prohibitedItems.length > 0 ? (
                <ul
                  className={`space-y-2 ${mainTextClass} text-sm list-disc list-inside`}
                >
                  {prohibitedItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className={subTextClass}>No prohibited items listed.</p>
              )}
            </div>
          </div>
        );
      default:
        return (
          <div
            style={boxStyle}
            className={`p-6 rounded-xl ${
              isDarkMode ? "shadow-none" : "shadow-md"
            }`}
          >
            <p className={subTextClass}>
              Content for {activeTab} will be displayed here.
            </p>
          </div>
        );
    }
  };

  if (loading)
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${
          isDarkMode ? "bg-[#0D0D0D] text-white" : "bg-white text-gray-800"
        }`}
      >
        Loading event...
      </div>
    );
  if (error)
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${
          isDarkMode ? "bg-[#0D0D0D] text-red-400" : "bg-white text-red-600"
        }`}
      >
        Error: {error}
      </div>
    );
  if (!eventData)
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${
          isDarkMode ? "bg-[#0D0D0D] text-white" : "bg-white text-gray-800"
        }`}
      >
        No event data found.
      </div>
    );

  const isMultiEvent =
    (eventData.sub_events && eventData.sub_events.length > 0) ||
    mainEventActualDates.length > 1;

  const bannerImageUrl = getImageUrl(eventData.event_banner, "ticket");
  console.log(bannerImageUrl);

  return (
    <>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      <div
        className={`${bgPrimaryClass} ${mainTextClass} min-h-screen p-4 md:p-8 font-sans`}
      >
        <div className="max-w-7xl mx-auto space-y-8">
          <button
            onClick={handleGoBack}
            className={`inline-flex items-center gap-2 ${subTextClass} hover:text-blue-500 transition-colors mb-4`}
          >
            <BackIcon /> Go back to Host page
          </button>

          <div
            className="relative rounded-2xl overflow-hidden text-white p-6 md:p-8 flex flex-col justify-end min-h-[400px]"
            style={{
              backgroundImage: `url(${bannerImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            <div className="relative z-10 mt-auto space-y-4">
              <div className="flex-grow space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {eventData.event_category && (
                    <span className="bg-white/10 backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full">
                      {eventData.event_category}
                    </span>
                  )}
                  {eventData.event_subcategory && (
                    <span className="bg-white/10 backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full">
                      {eventData.event_subcategory}
                    </span>
                  )}
                  {eventData.min_age_allowed > 0 && (
                    <span className="bg-white/10 backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full">
                      {eventData.min_age_allowed}+
                    </span>
                  )}
                  {eventData.event_language?.map((lang) => (
                    <span
                      key={lang}
                      className="bg-white/10 backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full"
                    >
                      {lang}
                    </span>
                  ))}
                  {eventData.payment_type && (
                    <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full capitalize">
                      {eventData.payment_type}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                  {sanitizeName(eventData.event_name) || "Event Name"}
                </h1>
                <div className="space-y-2 text-gray-200 text-sm">
                  <p className="flex items-center text-blue-300 font-medium gap-1 md:gap-2 ">
                    <img src={Calender_Preview} alt="" /> {formattedDateRange}
                  </p>
                  {eventData.location_type === "offline" &&
                    eventData.venue &&
                    eventData.location && (
                      <p className="flex gap-1 md:gap-2 items-center text-blue-300 font-medium ">
                        <img src={Location_Preview} alt="" /> {eventData.venue},{" "}
                        {eventData.location}
                      </p>
                    )}
                  {isMultiEvent && (
                    <p className="flex items-center text-blue-300 font-medium gap-1 md:gap-2">
                      <img src={Event_Preview} alt="" /> Multi event
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap md:flex-nowrap items-center gap-4 pt-4">
                <div className="flex-1 flex items-center gap-4">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition-transform duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base flex-1 md:flex-initial flex items-center justify-center">
                    Booking for users
                  </button>
                  <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-3 px-4 rounded-full flex items-center transition-colors duration-300 text-sm sm:text-base flex-1 md:flex-initial flex items-center justify-center">
                    <HeartIcon /> Wishlist for users
                  </button>
                </div>
                <div className="flex-shrink-0 w-full md:w-auto order-first md:order-none">
                  <div
                    className={`flex items-center justify-center gap-1 ${bgFooterClass} p-1.5 rounded-full backdrop-blur-sm border border-white/10`}
                  >
                    <div className="bg-transparent text-white font-semibold py-2 px-3 flex items-center text-sm">
                      <HeartIcon /> {eventStats.likeCount}
                    </div>
                    <div className="bg-transparent text-white font-semibold py-2 px-3 flex items-center text-sm">
                      <TicketIcon /> {eventStats.totalCapacity}
                    </div>
                    <button
                      onClick={handleShare}
                      className="bg-transparent text-white font-semibold py-2 px-3 flex items-center text-sm rounded-full hover:bg-white/10 transition-colors"
                    >
                      <ShareIcon /> {eventStats.shareCount}
                    </button>
                  </div>
                </div>
                <div className="flex-1 flex justify-end">
                  <button
                    onClick={() => setFullScreenImage(bannerImageUrl)}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full transition-colors duration-300"
                  >
                    <EnlargeIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 justify-center">
            <div className="w-full flex justify-center">
              <div
                className={`${bgSecondaryClass} p-1.5 rounded-2xl inline-flex mx-auto max-w-full overflow-x-auto no-scrollbar`}
              >
                <nav className="flex items-center gap-1">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab;
                    let count = 0;
                    if (tab === "Artists" && eventData.guests)
                      count = eventData.guests.length;
                    if (tab === "Photos" && eventData.event_images)
                      count = eventData.event_images.length;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`relative whitespace-nowrap py-3 px-5 rounded-xl font-semibold text-sm transition-all duration-300 focus:outline-none ${
                          isActive
                            ? "text-white shadow-md"
                            : `${mainTextClass} hover:bg-blue-100 dark:hover:bg-white/10`
                        }`}
                        style={isActive ? activeTabStyle : {}}
                      >
                        {tab}
                        {count > 0 && (
                          <sup
                            className={`ml-1 text-xs font-bold ${
                              isActive ? "text-white" : "text-blue-500"
                            }`}
                          >
                            {count}
                          </sup>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
            <div>{renderContent()}</div>
          </div>

          {mainEventActualDates.length > 0 && (
            <div
              style={boxStyle}
              className={`p-6 rounded-xl ${
                isDarkMode ? "shadow-none" : "shadow-md"
              }`}
            >
              <h3
                className={`font-bold text-xs uppercase tracking-widest ${subTextClass} mb-4`}
              >
                EVENT DATES
              </h3>
              <div className="flex flex-wrap gap-4">
                {mainEventActualDates.map((date, index) => {
                  const formatted = date
                    .toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    })
                    .toUpperCase();
                  return (
                    <div
                      key={index}
                      className="dark:bg-[#2979FF4D] bg-[#005eff4d] text-white/80 font-semibold py-3 px-4 rounded-lg flex items-center justify-center text-sm gap-2"
                    >
                      <CalendarIcon />
                      {formatted}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {subEvents.length > 0 && (
            <div
              style={boxStyle}
              className={`p-6 rounded-2xl ${
                isDarkMode ? "shadow-none" : "shadow-md"
              }`}
            >
              <h3
                className={`font-bold text-xs uppercase tracking-widest ${subTextClass} mb-6`}
              >
                Add-on shows
              </h3>
              <div
                className={`p-2 rounded-xl mb-6 ${
                  isDarkMode ? "bg-[#2979FF1A]" : "bg-blue-50"
                }`}
              >
                <div className="flex items-center">
                  <span className={`font-bold text-sm ${mainTextClass} px-2`}>
                    Date
                  </span>
                  <button
                    onClick={() => handleScroll("left")}
                    className={`p-2 rounded-full ${
                      isDarkMode ? "hover:bg-white/10" : "hover:bg-gray-200"
                    }`}
                  >
                    <ChevronLeftIcon className={mainTextClass} />
                  </button>
                  <div
                    ref={scrollContainerRef}
                    className="flex-1 flex items-center gap-2 overflow-x-auto overflow-y-hidden no-scrollbar"
                  >
                    {allSelectableDates.map((date) => {
                      const dateString = date.toISOString().split("T")[0];
                      const isSelected = selectedDate === dateString;
                      const isActualDate = mainEventActualDates.some(
                        (d) => d.toISOString().split("T")[0] === dateString
                      );

                      return (
                        <button
                          key={dateString}
                          data-date={dateString}
                          onClick={() =>
                            isActualDate && setSelectedDate(dateString)
                          }
                          disabled={!isActualDate}
                          className={`text-center py-2 px-3 w-20 flex-shrink-0 transition-colors duration-300 ${
                            isSelected
                              ? "text-white"
                              : `${mainTextClass} hover:bg-blue-100 dark:hover:bg-white/10`
                          } ${
                            !isActualDate ? "opacity-30 cursor-not-allowed" : ""
                          }`}
                          style={isSelected ? selectedDateStyle : {}}
                        >
                          <p className="text-xs">
                            {date.toLocaleDateString("en-US", {
                              month: "short",
                              timeZone: "UTC",
                            })}
                          </p>
                          <p className="font-bold text-lg">
                            {date.getUTCDate()}
                          </p>
                          <p className="text-xs">
                            {date.toLocaleDateString("en-US", {
                              weekday: "short",
                              timeZone: "UTC",
                            })}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handleScroll("right")}
                    className={`p-2 rounded-full ${
                      isDarkMode ? "hover:bg-white/10" : "hover:bg-gray-200"
                    }`}
                  >
                    <ChevronRightIcon className={mainTextClass} />
                  </button>
                </div>
              </div>
              {filteredSubEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredSubEvents.map((event) => (
                    <div
                      key={event._id}
                      style={boxStyle}
                      className={`rounded-xl overflow-hidden group transform hover:-translate-y-2 transition-transform duration-300 ${
                        isDarkMode ? "shadow-lg" : "shadow-xl"
                      }`}
                    >
                      <img
                        src={getImageUrl(event.event_banner, "ticket")}
                        alt={sanitizeName(event.event_name)}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-4">
                        <h3
                          className={`font-bold text-lg ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          } mb-1 truncate`}
                        >
                          {sanitizeName(event.event_name)}
                        </h3>
                        <p className={`text-sm ${subTextClass} mb-3`}>
                          {event.event_dates?.[0]?.start_date
                            ? new Date(
                                event.event_dates[0].start_date
                              ).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                timeZone: "UTC",
                              })
                            : "Date TBA"}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-green-400 font-semibold bg-green-900/50 px-3 py-1 text-sm rounded-md">
                            ₹{event.ticket_types?.[0]?.ticket_price || "Free"}
                          </span>
                          <button
                            onClick={() => setSelectedSubEvent(event)}
                            className="bg-blue-600 text-white text-sm font-bold py-2 px-4 rounded-lg group-hover:bg-blue-700 transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p>No events scheduled for this date.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- Modals (Need theme consistency) --- */}
      {fullScreenImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4 cursor-pointer animate-fade-in"
          onClick={() => setFullScreenImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl font-bold z-[51] p-2"
            onClick={() => setFullScreenImage(null)}
          >
            &times;
          </button>
          <img
            src={fullScreenImage}
            alt="Full screen event preview"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {selectedGuest && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedGuest(null)}
        >
          <div
            className={`relative ${bgSecondaryClass} rounded-2xl p-8 max-w-sm w-full text-center ${
              isDarkMode
                ? "text-white border border-gray-700"
                : "text-gray-900 border border-gray-200"
            } shadow-xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-3xl font-bold p-2"
              onClick={() => setSelectedGuest(null)}
            >
              &times;
            </button>
            <img
              src={getImageUrl(selectedGuest.guest_profile, "auth")}
              alt={selectedGuest.guest_name}
              className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-blue-500"
            />
            <h3 className="text-2xl font-bold mb-4">
              {selectedGuest.guest_name}
            </h3>
            {selectedGuest.guest_link && (
              <a
                href={selectedGuest.guest_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-sm break-all"
              >
                {selectedGuest.guest_link}
              </a>
            )}
          </div>
        </div>
      )}

      {selectedSubEvent && (
        <div
          className="fixed inset-0 z-[51] bg-black bg-opacity-80 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedSubEvent(null)}
        >
          <div
            className={`relative ${bgSecondaryClass} rounded-2xl max-w-2xl w-full ${
              isDarkMode
                ? "text-white border border-gray-700"
                : "text-gray-900 border border-gray-200"
            } shadow-xl overflow-hidden cursor-default max-h-[90vh]`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 z-20 text-gray-200 hover:text-white text-4xl font-bold p-2"
              onClick={() => setSelectedSubEvent(null)}
            >
              &times;
            </button>

            <div
              className="relative p-6 flex flex-col justify-end h-64 bg-cover bg-center"
              style={{
                backgroundImage: `url(${getImageUrl(
                  selectedSubEvent.event_banner,
                  "ticket"
                )})`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="relative z-10 space-y-2">
                <h2 className="text-3xl font-extrabold">
                  {sanitizeName(selectedSubEvent.event_name)}
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-16rem)] no-scrollbar">
              <div className="flex flex-wrap items-center gap-2">
                {selectedSubEvent.event_category && (
                  <span className="bg-white/10 text-xs font-semibold px-3 py-1 rounded-full">
                    {selectedSubEvent.event_category}
                  </span>
                )}
                {selectedSubEvent.event_subcategory && (
                  <span className="bg-white/10 text-xs font-semibold px-3 py-1 rounded-full">
                    {selectedSubEvent.event_subcategory}
                  </span>
                )}
                {selectedSubEvent.event_language?.map((lang) => (
                  <span
                    key={lang}
                    className="bg-white/10 text-xs font-semibold px-3 py-1 rounded-full"
                  >
                    {lang}
                  </span>
                ))}
                {selectedSubEvent.min_age_allowed > 0 && (
                  <span className="bg-white/10 text-xs font-semibold px-3 py-1 rounded-full">
                    {selectedSubEvent.min_age_allowed}+
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <p className={`flex items-center ${mainTextClass}`}>
                  <CalendarIcon />{" "}
                  {new Date(
                    selectedSubEvent.event_dates[0].start_date
                  ).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "UTC",
                  })}{" "}
                  -{" "}
                  {new Date(
                    selectedSubEvent.event_dates[
                      selectedSubEvent.event_dates.length - 1
                    ].end_date
                  ).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </p>
                {selectedSubEvent.location_type === "offline" &&
                  selectedSubEvent.venue && (
                    <p className={`flex items-center ${mainTextClass}`}>
                      <LocationIcon /> {selectedSubEvent.venue},{" "}
                      {selectedSubEvent.location}
                    </p>
                  )}
              </div>

              {selectedSubEvent.event_description && (
                <div className={`border-t ${borderClass} pt-4`}>
                  <h4
                    className={`font-bold text-xs uppercase tracking-widest ${subTextClass} mb-2`}
                  >
                    About the Show
                  </h4>
                  <div
                    className={`text-sm ${mainTextClass} prose max-w-none ${proseClass}`}
                    dangerouslySetInnerHTML={{
                      __html: selectedSubEvent.event_description,
                    }}
                  />
                </div>
              )}

              {selectedSubEvent.guests &&
                selectedSubEvent.guests.length > 0 && (
                  <div className={`border-t ${borderClass} pt-4`}>
                    <h4
                      className={`font-bold text-xs uppercase tracking-widest ${subTextClass} mb-4`}
                    >
                      Artists
                    </h4>
                    <div className="flex flex-wrap justify-center gap-4">
                      {selectedSubEvent.guests.map((guest) => (
                        <div
                          key={guest._id || guest.guest_name}
                          className="text-center"
                        >
                          <img
                            img
                            src={getImageUrl(guest.guest_profile, "auth")}
                            alt={guest.guest_name}
                            className={`w-16 h-16 rounded-full object-cover mx-auto mb-2 border-2 ${
                              isDarkMode ? "border-gray-600" : "border-gray-300"
                            }`}
                          />
                          <p
                            className={`text-sm font-semibold ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {guest.guest_name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className={`pt-4 border-t ${borderClass} space-y-4`}>
                <div>
                  <h4
                    className={`font-bold text-xs uppercase tracking-widest ${subTextClass} mb-2`}
                  >
                    Details
                  </h4>
                  <ul
                    className={`text-sm ${mainTextClass} space-y-1 list-disc list-inside`}
                  >
                    <li>
                      <strong>Kids Friendly:</strong>{" "}
                      {selectedSubEvent.kids_friendly ? "Yes" : "No"}
                    </li>
                    <li>
                      <strong>Pet Friendly:</strong>{" "}
                      {selectedSubEvent.pet_friendly ? "Yes" : "No"}
                    </li>
                    <li>
                      <strong>Event Date Type :</strong>{" "}
                      {selectedSubEvent.event_date_type}
                    </li>
                    <li>
                      <strong>Event Mode :</strong>{" "}
                      {selectedSubEvent.location_type}
                    </li>
                  </ul>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-lg font-semibold ${mainTextClass}`}>
                    Price:
                  </p>
                  <span className="text-green-400 font-bold bg-green-900/50 px-4 py-2 text-lg rounded-md">
                    ₹
                    {selectedSubEvent.ticket_types?.[0]?.ticket_price || "Free"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default TicketPreview;
