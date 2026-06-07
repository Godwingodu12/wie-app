import React, { useState, useMemo, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  MapPin,
  Globe,
  ChevronLeft,
  ChevronRight,
  Menu,
  ArrowLeft,
  Phone,
  Bookmark,
} from "lucide-react";
import dayjs from "dayjs";

// Import your shared components and utilities
import Card from "../../components/ViewSingleEvent/Card";
// import EventLocationModal from "../../components/ViewSingleEvent/EventLocationModal"; // Not used in render, kept for reference
import CustomScrollbarStyles from "../../components/CreateGroup/CustomScrollbarStyles";
import ScrollBarStyle from "../../components/ScrollBarStyle";
import { getImageUrl } from "../../utils/imageUtils";
import TopNavBar from "../../components/ViewSingleEvent/TopNavBar";

// IMPORTED: Your specific SVG assets
import NoGuidSubEvent from "../../assets/ViewSingleEvent/NoGuideSubEvent.svg";
import GuideSubEvent from "../../assets/ViewSingleEvent/GuestSubEvent.svg";
import FreeEventSubEvent from "../../assets/ViewSingleEvent/FreeEventSubEvent.svg";
import Map_Loc from "../../assets/ViewSingleEvent/Map_Loc.svg";
import Alert from "../../components/Alert";
import Bank_Details from "../../assets/ViewSingleEvent/Bank_Details.svg";
import Rules from "../../assets/ViewSingleEvent/Rules.svg";
import Preference from "../../assets/ViewSingleEvent/Preference.svg";
import Seat from "../../assets/ViewSingleEvent/Seat.svg";
import Ticket from "../../assets/ViewSingleEvent/Ticket.svg";
import CustomStyledButton from "../../components/ViewSingleEvent/CustomStyledButton";
import LeftIcon from "../../assets/ViewSingleEvent/LeftIcon.svg";
import RightIcon from "../../assets/ViewSingleEvent/RightIcon.svg";
import LanguageSubModal from "../../components/ViewSingleEvent/LanguageSubModal";
import getPreferences from "../../components/ViewSingleEvent/getPreferences";
import PreferenceModal from "../../components/ViewSingleEvent/PreferenceModal";
import SeatingLayoutModal from "../../components/ViewSingleEvent/SeatingLayoutModal";
import TicketDetailModal from "../../components/ViewSingleEvent/TicketDetailModal";
import RulesSubModal from "../../components/ViewSingleEvent/RulesSubModal";
import ActionCircleButton from "../../components/ViewSingleEvent/ActionCircleButton";
import {
  deleteSubEvent,
  getPostalDetailsFromCoords,
  getTicketById,
  getUserData,
} from "../../services/ticketService";
import ConfirmModal from "../../components/CreateGroup/ConfirmModal";
import EventLocationModal from "../../components/ViewSingleEvent/EventLocationModal";

const darkTheme = {
  isDark: true,
  text: "text-white",
  mainBg: "#212426",
  cardBg: "rgba(33, 36, 38, 0.9)",
  insetBg: "rgba(30, 33, 35, 0.9)",
  shadowOutset: "7px 7px 14px #151515, -7px -7px 14px #2b2b2b",
  shadowInset: "inset 7px 7px 14px #151515, inset -7px -7px 14px #2b2b2b",
  textColor: "text-gray-300",
  arrowBgClass: "bg-gray-200",
  arrowColorClass: "text-gray-800",
};
const lightTheme = {
  isDark: false,
  text: "text-gray-900",
  mainBg: "#f9f9f9",
  cardBg: "#f1f1f1",
  insetBg: "#f9f9f9",
  shadowOutset: "5px 5px 10px #c5c5c5, -5px -5px 10px #fbfbfb",
  shadowInset: "inset 5px 5px 10px #c5c5c5, inset -5px -5px 10px #fbfbfb",
  textColor: "text-gray-700",
  arrowBgClass: "bg-gray-800",
  arrowColorClass: "text-gray-200",
};


const ViewSingleSubEvent = () => {
  const { ticketId, subEventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const passedSubEvent = location.state?.eventDetails;
  const initialThemeIsDark = location.state?.initialThemeIsDark ?? true;

  const [searchTerm, setSearchTerm] = useState("");
  const [theme, setTheme] = useState(
    initialThemeIsDark ? darkTheme : lightTheme
  );
  const [isDarkMode, setIsDarkMode] = useState(initialThemeIsDark);

  const [loading, setLoading] = useState(!passedSubEvent);
  const [subEventData, setSubEventData] = useState(passedSubEvent);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentGuideIndex, setCurrentGuideIndex] = useState(0); // New state for guide carousel
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);

  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);

  const [showSeatingModal, setShowSeatingModal] = useState(false);
  const [appAlert, setAppAlert] = useState(null);
  const guidesToShow = 3;
  const POC_CONTACT_MASK_LENGTH = 1;

  const [currentPOCIndex, setCurrentPOCIndex] = useState(0);

  const [allPOCs, setAllPOCs] = useState([]);
  const [isLoadingPOCs, setIsLoadingPOCs] = useState(true);
  const [showRulesModal, setShowRulesModal] = useState(false);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [ticketData, setTicketData] = useState(null);

  const [geocodedDetails, setGeocodedDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // ViewSingleSubEvent.jsx (inside the geocoding useEffect)

  // ViewSingleSubEvent.jsx (inside the geocoding useEffect)

  useEffect(() => {
    const fetchGeocode = async () => {
      const coords = subEventData?.exact_map_location;
      if (
        subEventData?.location_type === "offline" &&
        typeof coords?.latitude === "number" &&
        typeof coords?.longitude === "number"
      ) {
        setIsLoadingDetails(true);
        try {
          const details = await getPostalDetailsFromCoords(
            coords.latitude,
            coords.longitude
          );

          if (details && details.postalCode) {
            setGeocodedDetails(details);
          }
        } catch (error) {
          // ...
        } finally {
          // ...
        }
      }
      // ...
    };

    if (subEventData) {
      fetchGeocode();
    }
  }, [subEventData]);



  useEffect(() => {
    // We assume eventData is fetched and POCS array is ready.
    if (subEventData?.POCS?.length) {
      setAllPOCs(subEventData.POCS);
    }
    setIsLoadingPOCs(false);
  }, [subEventData]);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUserData();
        if (response && response.user && !response.user.error) {
          const retrievedId = response.user._id || response.user.id;
          if (retrievedId) {
            setCurrentUserId(retrievedId);
          }
        }
      }  finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!ticketId) {
      setLoading(false);
      return;
    }

    const fetchTicket = async () => {
      try {
        const response = await getTicketById(ticketId);

        if (response && response.ticket) {
          setTicketData(response.ticket);
        } else {
          
          setTicketData(null);
        }
      } catch (error) {

        setTicketData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  const isTicketOwner = useMemo(() => {
    if (!currentUserId || !ticketData) {
      return false;
    }
    const ticketOwnerId = ticketData?.userId;
    console.log(ticketOwnerId);

    // Compare the IDs
    return currentUserId === ticketOwnerId;
  }, [currentUserId, ticketData]);

  const subEventTicketTypes = useMemo(() => {
    return subEventData?.ticket_types || [];
  }, [subEventData]);

  const handlePrevPOC = () => {
    setCurrentPOCIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextPOC = () => {
    setCurrentPOCIndex((prev) => Math.min(allPOCs.length - 1, prev + 1));
  };
  const handleDeleteSubEvent = async () => {
    setShowConfirmDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setShowConfirmDeleteModal(false);
    if (!subEventId) return;

    try {
      setLoading(true);

      await deleteSubEvent(ticketId);

      setAppAlert({
        message: "Success!",
        description: `Event ID ${subEventData.name} was successfully deleted.`,
        type: "success",
        show: true,
      });

      setTimeout(() => navigate(`/ticket/view-single-event/${ticketId}`), 1000);
    } catch (error) {
      setAppAlert({
        message: "Error Deleting Event",
        description: error.message || "Please check server connection.",
        type: "error",
        show: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER FUNCTIONS ---

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleTuneClick = () => {
    setAppAlert({
      message: "Information",
      description: "Filter functionality is disabled on this page.",
      type: "error",
      show: true,
    });
  };

  const handleThemeToggle = () => {
    const newDark = !theme.isDark;
    const newTheme = newDark ? darkTheme : lightTheme;
    setTheme(newTheme);
    setIsDarkMode(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  };

  const handleNavigateHome = () => {
    navigate("/home", { state: { initialThemeIsDark: theme.isDark } });
  };

  const handleSocialClick = (link, mediaName) => {
    if (link) {
      window.open(link, "_blank");
    } else {
      setAppAlert({
        message: "Link Unavailable",
        description: `${mediaName} link is not currently provided for this event.`,
        type: "error",
        show: true,
      });
    }
  };
  const handlePreferenceClick = () => {
    setShowPreferenceModal(true);
  };
  const handleSeatingLayoutClick = () => {
    if (
      subEventData.location_type === "offline" &&
      subEventData.ticket_layout
    ) {
      setShowSeatingModal(true);
    } else {
      setAppAlert({
        message: "Unavailable",
        description:
          "Seating layout details are not provided or not applicable for this event type.",
        type: "error",
        show: true,
      });
    }
  };
  const handleTicketDetailsClick = () => {
    if (subEventTicketTypes.length > 0) {
      setCurrentTicketIndex(0);
      setShowTicketModal(true);
    } else {
      setAppAlert({
        message: "Information",
        description: "No ticket details are available for this sub-event.",
        type: "error",
        show: true,
      });
    }
  };
  const handleRulesClick = () => {
    const hasRulesContent =
      subEventData.event_rules &&
      (subEventData.event_rules.content || subEventData.event_rules.path);

    const hasProhibitedItems = subEventData.prohibited_items?.length > 0;
    if (hasRulesContent || hasProhibitedItems) {
      setShowRulesModal(true);
    } else {
      setAppAlert({
        message: "Information",
        description:
          "No specific Rules and Regulation are available for this sub-event.",
        type: "error",
        show: true,
      });
    }
  };
  const handlePrevTicketModal = () => {
    setCurrentTicketIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextTicketModal = () => {
    const len = subEventTicketTypes.length;
    setCurrentTicketIndex((prev) => Math.min(len - 1, prev + 1));
  };

  const handlePrevGuide = () => {
    setCurrentGuideIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  const handleNextGuide = () => {
    // New maximum index is the index of the last item in the array (allGuides.length - 1)
    const maxIndex = (allGuides.length || 0) - 1;

    setCurrentGuideIndex((prevIndex) => Math.min(maxIndex, prevIndex + 1));
  };
  const subeventPreferences = useMemo(() => {
    return getPreferences(subEventData);
  }, [subEventData]);

  // --- DATA DERIVATION MEMOS ---
  const { images, totalImages, bannerImageUrl } = useMemo(() => {
    let eventImages = [];
    // ... (Image logic remains the same) ...
    if (subEventData?.event_images?.length > 0) {
      eventImages = subEventData.event_images
        .map((img) => ({
          url: getImageUrl(img.path),
          alt: subEventData.event_name || img.originalName || "Event Image",
        }))
        .filter((img) => img.url);
    }

    if (eventImages.length === 0 && subEventData) {
      const fallbackUrl = getImageUrl(
        subEventData.event_banner || subEventData.event_logo
      );
      if (fallbackUrl) {
        eventImages.push({
          url: fallbackUrl,
          alt: subEventData.event_name || "Event Banner",
        });
      }
    }

    const imgs =
      eventImages.length > 0 ? eventImages : [{ url: null, alt: "No Image" }];

    return {
      images: imgs,
      totalImages: imgs.length,
      bannerImageUrl: imgs[currentImageIndex]?.url,
    };
  }, [subEventData, currentImageIndex]);

  const {
    formattedDate,
    eventTypeColor,
    eventTextColor,
    dividerColor,
    categoryLabel,
    subcategoryLabel,
    currentBankInfo,
    allGuides,
    formattedCapacity,
    formattedDatesRange,
    locationChipLabel,
  } = useMemo(() => {
    if (!subEventData)
      return {
        formattedDate: "Date N/A",
        eventTypeColor: theme.isDark ? "#7C3AED" : "#7C3AED", // Provide a default color
        eventTextColor: theme.isDark ? "text-gray-300" : "text-gray-800",
        dividerColor: theme.isDark ? "#444" : "#ccc",
        categoryLabel: "Category N/A",
        subcategoryLabel: "Subcategory N/A",
        currentBankInfo: {},
        allGuides: [],
        formattedCapacity: "N/A",
        formattedDatesRange: "N/A",
        locationChipLabel: "Location N/A",
      };

    const rawDate =
      subEventData.event_dates?.[0]?.start_date ||
      subEventData.event_date ||
      subEventData.date;
    const fDate = rawDate ? dayjs(rawDate).format("DD MMMM YYYY") : "Date N/A";
    // Logic for Dates Range (simplified, adjust based on event_date_type if necessary)
    const dates = subEventData.event_dates;
    let datesRange = "N/A";
    if (dates && dates.length > 0) {
      const start = dates[0].start_date
        ? dayjs(dates[0].start_date).format("DD MMMM")
        : "Date N/A";
      const end =
        dates.length > 1 || dates[0].end_date
          ? dayjs(dates[dates.length - 1].end_date || dates[0].end_date).format(
              "DD MMMM YYYY"
            )
          : dayjs(dates[0].start_date).format("DD MMMM YYYY");
      datesRange = dates.length > 1 ? `${start} - ${end}` : end;
    }

    let locationDisplay;

    if (subEventData.location_type !== "offline") {
      locationDisplay =
        subEventData.location_type === "online"
          ? "Online Event"
          : "Recorded Event";
    } else if (geocodedDetails?.locality) {
      // Use the precise locality (City/Town) and State from geocoding
      locationDisplay = `${geocodedDetails.locality}, ${geocodedDetails.state}`;
    } else if (
      subEventData.location &&
      typeof subEventData.location === "string"
    ) {
      // Fallback 1: Use the raw location string provided by the database
      locationDisplay = subEventData.location;
    } else {
      // Fallback 2: Use the original State, Country fallback
      const state = subEventData.location_state || "State N/A";
      const country = subEventData.location_country || "Country N/A";
      locationDisplay = `${state}, ${country}`;
    }

    return {
      formattedDate: fDate,
      eventTypeColor: subEventData.event_color || "#7C3AED",
      eventTextColor: theme.isDark ? "text-gray-300" : "text-gray-800",
      dividerColor: theme.isDark ? "#444" : "#ccc",
      categoryLabel: subEventData.event_category || "Category N/A",
      subcategoryLabel: subEventData.event_subcategory || "Subcategory N/A",
      currentBankInfo: subEventData.banking_details?.[0] || {},
      allGuides: subEventData.guests || subEventData.event_guides || [],
      formattedCapacity: subEventData.total_capacity || "N/A", // Assuming total_capacity is a string/number
      formattedDatesRange: datesRange,
      locationChipLabel: locationDisplay, // Export the calculated value
    };
  }, [subEventData, theme, geocodedDetails]);

  const maskedAccountNo = useMemo(() => {
    const acc = currentBankInfo.bank_acc_no;
    if (!acc || acc.length <= POC_CONTACT_MASK_LENGTH) return acc || "N/A";
    const visiblePart = acc.slice(-POC_CONTACT_MASK_LENGTH);
    const maskedPart = "X".repeat(acc.length - POC_CONTACT_MASK_LENGTH);
    // Adjusted masking for better visualization
    const maskedDisplay =
      maskedPart.length > 4
        ? `${maskedPart.slice(0, 4)} ${maskedPart.slice(4)}`
        : maskedPart;
    return `${maskedDisplay} ${visiblePart}`;
  }, [currentBankInfo]);

  // --- IMAGE & LOCATION HANDLERS ---
  const handleNextImage = () => {
    if (totalImages > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    }
  };

  const handlePrevImage = () => {
    if (totalImages > 0) {
      setCurrentImageIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
    }
  };

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

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-xl"
        style={{ backgroundColor: theme.mainBg, color: theme.textColor }}
      >
        Loading Sub-Event Details...
      </div>
    );
  }

  if (!subEventData) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center text-xl text-red-400"
        style={{ backgroundColor: theme.mainBg }}
      >
        Error: Sub-Event with ID "{subEventId}" not found.
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-4 md:p-8 ${theme.text}`} // p-4 on mobile, p-8 on desktop
      style={{ backgroundColor: theme.mainBg }}
    >
      <CustomScrollbarStyles />
      <ScrollBarStyle isDark={theme.isDark} />

      {/* TOP NAVIGATION BAR */}
      <TopNavBar
        theme={theme}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onTuneClick={handleTuneClick}
        handleThemeToggle={handleThemeToggle}
        handleNavigateHome={handleNavigateHome}
      />
      <LanguageSubModal
        languages={subEventData.event_language}
        theme={theme}
        showLanguageModal={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />

      <Card
        theme={theme}
        className="mt-6 p-4 md:p-8 flex flex-col space-y-6" // p-4 on mobile, p-8 on desktop
        customStyle={{ borderRadius: "20px" ,background:theme.bg}}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
          {/* A. Back Button (Always left) */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            <button
              onClick={() => navigate(-1)}
              className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0"
              style={{
                backgroundColor: theme.isDark ? "#212426" : theme.mainBg,
                boxShadow: theme.shadowOutset,
                color: theme.textColor,
              }}
            >
              <ArrowLeft size={24} className={theme.textColor} />
            </button>
          </div>

          {/* B. Centered Content (Title & Chips) - FLEXIBLE LAYOUT */}
          <div className="flex flex-col lg:flex-row items-center justify-between flex-grow w-full lg:w-auto min-w-0 space-y-4 lg:space-y-0 lg:space-x-4 pt-4 md:pt-0">
            {/* Date Chip (Left of Center on Desktop) */}
            <div className="flex justify-center flex-shrink-0">
              <Card
                theme={theme}
                className="flex items-center rounded-full relative overflow-visible h-10 pr-4 w-46" // Set a fixed width for stability on mobile
                customStyle={{ boxShadow: theme.shadowInset }}
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
                {/* RENDER UPDATED DATE FORMAT HERE */}
                <p
                  className={`text-sm ${eventTextColor} whitespace-nowrap overflow-hidden text-ellipsis w-36 pl-5`}
                >
                  {formattedDate}
                </p>
              </Card>
            </div>

            {/* Event Title (Center) */}
            <h1
              className={`text-xl md:text-3xl lg:text-4xl font-bold ${eventTextColor} truncate max-w-full lg:max-w-[500px] text-center px-0 md:px-4 order-first lg:order-none`} // Reorder to be on top on mobile
            >
              {subEventData.event_name || "Sub-Event Details"}
            </h1>

            {/* Location Chip (Right of Center on Desktop) */}
            <div
              className="flex justify-center cursor-pointer flex-shrink-0"
              onClick={handleLocationClick}
            >
              <Card
                theme={theme}
                className="flex items-center rounded-full relative overflow-visible h-10 pr-4 w-40" // Set a fixed width for stability on mobile
                customStyle={{ boxShadow: theme.shadowInset }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center absolute left-0"
                  style={{
                    background: eventTypeColor,
                    transform: "translateX(-25%)",
                    boxShadow: theme.shadowOutset,
                  }}
                >
                  <img src={Map_Loc} alt="Location Icon" />
                </div>

                {/* RENDER UPDATED LOCATION FORMAT HERE */}
                <p
                  className={`text-sm ${eventTextColor} w-32 overflow-hidden whitespace-nowrap text-ellipsis pl-5 `}
                >
                  {locationChipLabel}
                </p>
              </Card>
            </div>
          </div>
          {isTicketOwner && (
            <div className="flex items-center my-auto space-x-4 flex-shrink-0 ml-4">
              <ActionCircleButton
                theme={theme}
                type="edit"
                ticketId={ticketId}
                subEventId={subEventId}
                setAppalert={setAppAlert}
              />
              <ActionCircleButton
                theme={theme}
                type="delete"
                ticketId={ticketId}
                onClick={handleDeleteSubEvent}
                setAppalert={setAppAlert}
              />
            </div>
          )}
        </div>

        {/* Horizontal Rule Divider */}
        <div
          className="w-full h-[1px]"
          style={{
            background: `linear-gradient(to right, ${theme.mainBg} 0%, ${dividerColor} 20%, ${dividerColor} 80%, ${theme.mainBg} 100%)`,
          }}
        ></div>

        {/* --- MAIN CONTENT GRID (2/5 - 3/5 SPLIT) --- */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-4 h-auto relative">
          {/* LEFT PANEL: Image (2/5 width) */}
          <div className="md:col-span-2 flex flex-col h-full my-auto space-y-4">
            <Card
              theme={theme}
              className="relative overflow-hidden rounded-3xl flex-grow h-[300px] md:h-auto" // Added fixed height for mobile image container
            >
              <div className="relative h-full w-full rounded-2xl overflow-hidden">
                <img
                  src={bannerImageUrl || Map_Loc}
                  alt={
                    images[currentImageIndex]?.alt ||
                    subEventData.event_name ||
                    "Sub-Event Image"
                  }
                  className="w-full h-full max-h-[580px] object-contain"
                />
                {/* Carousel Controls */}
                {totalImages > 1 && (
                  <div className="absolute inset-x-0 bottom-4 w-full flex items-center justify-between px-4 z-10">
                    <button
                      onClick={handlePrevImage}
                      className={`p-2 md:p-3 rounded-full transition-colors z-10`}
                      style={{
                        backgroundColor: theme.isDark
                          ? "#FFFFFF"
                          : "rgba(255,255,255,0.4)",

                        color: theme.isDark ? "#4A5568" : "black",

                        boxShadow: theme.shadowOutset,
                      }}
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <div className="flex space-x-2">
                      {images.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                            index === currentImageIndex
                              ? "bg-white"
                              : "bg-black bg-opacity-50"
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleNextImage}
                      className={`p-2 md:p-3 rounded-full transition-colors z-10`}
                      style={{
                        backgroundColor: theme.isDark
                          ? "#FFFFFF"
                          : "rgba(255,255,255,0.4)",

                        color: theme.isDark ? "#4A5568" : "black",

                        boxShadow: theme.shadowOutset,
                      }}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* RIGHT PANEL: Stacked Details (3/5 width, SCROLLABLE CONTENT) */}
          <div className="md:col-span-3 flex flex-col h-full justify-between space-y-4 ">
            {/* 1. COMBINED DESCRIPTION / CATEGORY / SUBCATEGORY CARD */}
            <Card
              theme={theme}
              className="p-4 md:p-6 lg:p-8 flex-shrink-0" // Adjusted padding for mobile
              customStyle={{
                borderRadius: "25px",
                boxShadow: theme.isDark
                  ? `5px 6px 9px 0px #00000075, -2px -2px 10px 0px #63636336`
                  : theme.shadowOutset,
              }}
            >
              <div
                className="flex justify-between items-start mb-4 border-b pb-2 flex-col sm:flex-row space-y-2 sm:space-y-0" // Stack on mobile
                style={{ borderBottomColor: theme.isDark ? "#333" : "#ddd" }}
              >
                <h3
                  className={`text-lg font-bold ${eventTextColor} flex items-center space-x-2 flex-shrink-0`}
                >
                  <Menu size={20} className="flex-shrink-0" />
                  <span>Description</span>
                </h3>
                <div className="flex space-x-4 text-right overflow-x-auto">
                  <span
                    className={`text-sm md:text-md font-semibold ${eventTextColor} whitespace-nowrap`}
                  >
                    {categoryLabel}
                  </span>
                  <span className="text-sm md:text-md font-semibold text-gray-500 whitespace-nowrap">
                    {subcategoryLabel}
                  </span>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                <p className={`text-sm ${theme.textColor} leading-relaxed whitespace-pre-line`}>
                  {subEventData.event_description &&
                  subEventData.event_description.trim()
                    ? subEventData.event_description.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
                    : "No detailed description is available for this sub-event."}
                </p>
              </div>
            </Card>

            {/* 2. HASHTAG & SOCIAL MEDIA ROW ) */}
            <Card
              theme={theme}
              className="p-4 md:p-6 flex flex-col w-full"
              customStyle={{
                borderRadius: "25px",
                boxShadow: theme.isDark
                  ? `5px 6px 9px 0px #00000075, -2px -2px 10px 0px #63636336`
                  : theme.shadowOutset,
              }}
            >
              <h3
                className={`text-base font-semibold ${eventTextColor} flex items-center space-x-1 mb-1`}
              >
                <span className="text-blue-600 font-bold text-xl">#</span>
                <span>Hashtag</span>
              </h3>
              <hr
                className={`w-full mx-auto border-t mb-4 ${
                  theme.isDark ? "border-gray-700" : "border-gray-300"
                }`}
              />
              {subEventData.hashtag && subEventData.hashtag.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
                  {subEventData.hashtag.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-[#5E5CE6] text-white text-xs px-3 py-1 rounded-lg font-medium" // Smaller chip for mobile
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-400">
                    No hashtags available.
                  </p>
                </div>
              )}
            </Card>

            {/* --- NEW THIRD ROW (Event Details | Guide Carousel) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
              {/* 1. EVENT DETAILS CARD (Left) */}
              <Card
                theme={theme}
                className="p-4 md:p-6 lg:p-8" // Adjusted padding
                customStyle={{
                  borderRadius: "25px",
                  boxShadow: theme.isDark
                    ? `5px 6px 9px 0px #00000075, -2px -2px 10px 0px #63636336`
                    : theme.shadowOutset,
                }}
              >
                <h3
                  className={`text-lg font-semibold ${eventTextColor} flex items-center space-x-2 mb-4`}
                >
                  <CalendarDays size={20} />
                  <span>Event Details</span>
                </h3>

                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Event Type</dt>
                    <dd className={`font-medium ${eventTextColor}`}>
                      {subEventData.event_type || "N/A"}
                    </dd>
                  </div>
                  <hr
                    className={`w-full mx-auto border-t mb-1 mt-1 ${
                      theme.isDark ? "border-gray-700" : "border-gray-300"
                    }`}
                  />
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Mode</dt>
                    <dd className={`font-medium ${eventTextColor}`}>
                      {subEventData.location_type || "N/A"}
                    </dd>
                  </div>
                  <hr
                    className={`w-full mx-auto border-t mb-1 mt-1 ${
                      theme.isDark ? "border-gray-700" : "border-gray-300"
                    }`}
                  />
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-400">Language</dt>
                    <dd>
                      <button
                        onClick={() => setShowLanguageModal(true)}
                        className="bg-[#5E5CE6] text-white text-xs px-3 py-1 rounded-full hover:opacity-90 transition-opacity"
                      >
                        View
                      </button>
                    </dd>
                  </div>
                  <hr
                    className={`w-full mx-auto border-t mb-1 mt-1 ${
                      theme.isDark ? "border-gray-700" : "border-gray-300"
                    }`}
                  />
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Minimum Age</dt>
                    <dd className={`font-medium ${eventTextColor}`}>
                      {subEventData.min_age_allowed}+
                    </dd>
                  </div>
                  <hr
                    className={`w-full mx-auto border-t mb-1 mt-1 ${
                      theme.isDark ? "border-gray-700" : "border-gray-300"
                    }`}
                  />
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Capacity</dt>
                    <dd className={`font-medium ${eventTextColor}`}>
                      {formattedCapacity}
                    </dd>
                  </div>
                  <hr
                    className={`w-full mx-auto border-t mb-1 mt-1 ${
                      theme.isDark ? "border-gray-700" : "border-gray-300"
                    }`}
                  />
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Dates</dt>
                    <dd className={`font-medium ${eventTextColor}`}>
                      {formattedDatesRange}
                    </dd>
                  </div>
                  <hr
                    className={`w-full mx-auto border-t mb-1 mt-1 ${
                      theme.isDark ? "border-gray-700" : "border-gray-300"
                    }`}
                  />
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Gate Opens</dt>
                    <dd className={`font-medium ${eventTextColor}`}>
                      {subEventData.gate_open_time || "N/A"}
                    </dd>
                  </div>
                </dl>
              </Card>

              {/* 2. GUIDE CAROUSEL (Right) */}
              <Card
                theme={theme}
                className="p-4 md:p-6 flex flex-col" // Adjusted padding
                customStyle={{
                  borderRadius: "25px",
                  boxShadow: theme.isDark
                    ? `5px 6px 9px 0px #00000075, -2px -2px 10px 0px #63636336`
                    : theme.shadowOutset,
                }}
              >
                <h3
                  className={`text-lg font-semibold ${eventTextColor} flex items-center space-x-2 mb-2`}
                >
                  <img src={GuideSubEvent} alt="Guide" className="w-5 h-5" />
                  <span>Guide & Guide Details</span>
                </h3>

                {allGuides.length > 0 ? (
                  <div className="flex flex-col items-center flex-grow px-3 overflow-x-hidden pt-4">
                   
                    <div className="w-full relative ">
                      <div
                        className="flex transition-transform duration-500 ease-in-out"
                        style={{
                          // 1. Container width must accommodate all cards (N total cards * 33.333% visible space)
                          width: `${(allGuides.length / guidesToShow) * 100}%`,

                          // 2. Translate by (index * card_width)
                          // We translate left by 33.333% for every index increment.
                          transform: `translateX(-${
                            currentGuideIndex * (100 / allGuides.length)
                          }%)`,
                        }}
                      >
                        {allGuides.map((guide, index) => {
                          const isActiveCard = index === currentGuideIndex;
                          // Note: Scaling/translating individual cards is less common in multi-item carousels,
                          // but we keep the scale on the active index for emphasis.
                          const zIndex = isActiveCard ? "z-10" : "z-0";
                          const scale = isActiveCard
                            ? "scale-105"
                            : "scale-100";
                          const translateY = isActiveCard
                            ? "-translate-y-1"
                            : "translate-y-0";

                          return (
                            <div
                              key={index}
                              // Crucial Change: Set dynamic width to 1 / N (total cards)
                              // Tailwind w-1/3 is only 33.333% of the *container* width, which is WRONG here.
                              // The card must be 1 / (total cards) of the total container width:
                              style={{ width: `${100 / allGuides.length}%` }}
                              // We don't use justify-center on the slide anymore, as they are next to each other
                              className={`flex-shrink-0 transform transition-transform duration-300 ease-in-out p-1`}
                            >
                              {/* === GUIDE DETAILS CARD (Actual Card Content) === */}
                              <div
                                className={`
                                    w-full h-32 p-2 
                                    rounded-[13.67px] 
                                    flex flex-col items-center justify-center text-center relative 
                                    ${zIndex} ${scale} ${translateY}
                                `}
                                style={{
                                  boxShadow: theme.shadowOutset,
                                  background: theme.cardBg,
                                }}
                              >
                                {/* Guide Profile Image */}
                                <div
                                  className="w-16 h-16 rounded-lg mx-auto mb-1 overflow-hidden"
                                  style={{ boxShadow: theme.shadowOutset }}
                                >
                                  <img
                                    src={getImageUrl(guide.guest_profile)}
                                    alt={guide.guest_name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>

                                {/* Guide Name */}
                                <p
                                  className={`text-xs font-semibold ${theme.textColor} truncate mt-1`}
                                >
                                  {guide.guest_name}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Navigation Controls */}
                    {allGuides.length > guidesToShow - 1 && ( // Only show controls if there are enough items to scroll
                      <div className="flex justify-between w-full px-0 mt-6">
                        {/* Prev Button */}
                        <div className="flex my-auto">
                          <button
                            onClick={handlePrevGuide}
                            disabled={currentGuideIndex === 0}
                            className={`z-20 rounded-full transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center p-2`}
                            style={{ boxShadow: theme.shadowOutset }}
                          >
                            <img
                              src={LeftIcon}
                              alt="Previous Guide"
                              className={`h-6 w-6 ${
                                theme.isDark ? "" : "filter invert"
                              }  `}
                            />
                          </button>
                        </div>

                        {/* Next Button */}
                        <button
                          onClick={handleNextGuide}
                          // Disable when the last visible card (index + 2) is the last item
                          // Since we scroll 1 at a time, we stop when the third visible card is the last item.
                          disabled={
                            currentGuideIndex >= allGuides.length - guidesToShow
                          }
                          className={`z-20 rounded-full disabled:opacity-30 disabled:cursor-not-allowed p-2`}
                          style={{ boxShadow: theme.shadowOutset }}
                        >
                          <img
                            src={RightIcon}
                            alt="Previous Guide"
                            className={`h-6 w-6 ${
                              theme.isDark ? "" : "filter invert"
                            }  `}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Fallback for no guides
                  <div className="flex flex-col items-center justify-center h-full py-8">
                    <img
                      src={NoGuidSubEvent}
                      alt="No Guide"
                      className="w-12 h-12 md:w-16 md:h-16 mb-2" // Adjusted size
                    />
                    <p className="text-sm text-gray-400">
                      No guides or hosts added.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>

        {/* NEW BOTTOM ROW (Payment | Features | POC | Social Media) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 h-full">
          {/* Left: Payment (2/5 width) */}
          <div className="md:col-span-2 flex h-full flex-col my-auto space-y-4">
            <Card
              theme={theme}
              className="p-4 md:p-6 lg:p-8 flex-grow h-full" // Adjusted padding
              customStyle={{
                borderRadius: "25px",
                boxShadow: theme.isDark
                  ? `5px 6px 9px 0px #00000075, -2px -2px 10px 0px #63636336`
                  : theme.shadowOutset,
              }}
            >
              <h3
                className={`text-lg font-semibold  ${eventTextColor} flex items-center space-x-2 mb-4`}
              >
                <img src={Bank_Details} alt="Payment" className="w-5 h-5" />
                <span>Payment Details</span>
              </h3>

              {subEventData.payment_type === "paid" ? (
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Account Type</dt>
                    <dd className={`font-medium ${eventTextColor}`}>
                      {currentBankInfo.bank_acc_type || "Public"}
                    </dd>
                  </div>
                  <hr
                    className={`w-full mx-auto border-t ${
                      theme.isDark ? "border-gray-700" : "border-gray-300"
                    }`}
                  />
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Account Holder</dt>
                    <dd className={`font-medium ${eventTextColor} text-right`}>
                      {currentBankInfo.bank_acc_holder ||
                        "GECW Cultural Committee"}
                    </dd>
                  </div>
                  <hr
                    className={`w-full mx-auto border-t ${
                      theme.isDark ? "border-gray-700" : "border-gray-300"
                    }`}
                  />
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Account No</dt>
                    <dd className={`font-medium ${eventTextColor}`}>
                      {maskedAccountNo}
                    </dd>
                  </div>
                  <hr
                    className={`w-full mx-auto border-t ${
                      theme.isDark ? "border-gray-700" : "border-gray-300"
                    }`}
                  />
                  <div className="flex justify-between">
                    <dt className="text-gray-400">IFSC</dt>
                    <dd className={`font-medium ${eventTextColor}`}>
                      {currentBankInfo.bank_ifsc || "SBIN0009676"}
                    </dd>
                  </div>
                </dl>
              ) : (
                <div className="text-center py-4">
                  <img
                    src={FreeEventSubEvent}
                    alt="Free Event"
                    className="w-16 h-16 mx-auto mb-2"
                  />
                  <p className="text-sm text-gray-400">This is a Free Event.</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right 3/5 (Features | POC | Social Media) */}
          <div className="md:col-span-3 flex flex-col space-y-4 justify-center h-full">
            {/* 1. Feature Buttons Row (Now wraps on small screens) */}
            <div className="flex flex-wrap justify-center  gap-4 py-2 mx">
              <CustomStyledButton
                Icon={Ticket}
                label="Ticket Details"
                theme={theme}
                onClick={handleTicketDetailsClick}
              />
              {(subEventData.ticket_layout || subEventData.seating_layout?.seats?.length > 0) && (
                <CustomStyledButton
                  Icon={Seat}
                  label="Seating Layout"
                  theme={theme}
                  onClick={handleSeatingLayoutClick}
                />
              )}
              <CustomStyledButton
                Icon={Rules}
                label="Rules & Regulation"
                theme={theme}
                onClick={handleRulesClick}
              />
              <CustomStyledButton
                Icon={Preference}
                label="Event Preference"
                theme={theme}
                onClick={handlePreferenceClick}
              />
            </div>
            {/* 2. POC & Social Media Grid (2 columns on medium/large screens) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-shrink-0">
              <Card
                theme={theme}
                className="p-4 md:p-6 flex flex-col" // Adjusted padding
                customStyle={{
                  borderRadius: "25px",
                  boxShadow: theme.isDark
                    ? `5px 6px 9px 0px #00000075, -2px -2px 10px 0px #63636336`
                    : theme.shadowOutset,
                }}
              >
                <h3
                  className={`text-lg font-semibold ${theme.textColor} flex items-center pl-2 space-x-2 mb-4`}
                >
                  <Phone size={20} />
                  <span>Point of Contact</span>
                </h3>

                {allPOCs && allPOCs.length > 0 ? (
                  <div className=" flex items-center justify-center flex-grow">
                    {/* 1. Prev Button */}
                    {allPOCs.length > 1 && (
                      <button
                        onClick={handlePrevPOC}
                        disabled={currentPOCIndex === 0}
                        className={` left-0 z-10 rounded-full disabled:opacity-30 disabled:cursor-not-allowed p-2`}
                        style={{ boxShadow: theme.shadowOutset }}
                      >
                        <img
                          src={LeftIcon}
                          alt="Previous POC"
                          className={`h-6 w-6 ${
                            theme.isDark ? "" : "filter invert"
                          }   `}
                        />
                      </button>
                    )}

                    {/* 2. Carousel Viewport (Shows only one POC at a time) */}
                    <div className="overflow-hidden w-full">
                      <div
                        className="flex transition-transform duration-500 ease-in-out"
                        style={{
                          // Translate the container by the index multiplied by 100% to show one card fully
                          transform: `translateX(-${currentPOCIndex * 100}%)`,
                        }}
                      >
                        {allPOCs.map((poc, index) => (
                          <div
                            key={index}
                            className="flex-shrink-0 w-full px-4" // Horizontal padding adjusted to prevent content overlap with buttons
                          >
                            <dl className="space-y-1 text-sm">
                              {/* Name */}
                              <div className="flex justify-between">
                                <dt className="text-gray-400">Name</dt>
                                <dd
                                  className={`font-medium ${theme.textColor}`}
                                >
                                  {poc.POC_name || "N/A"}
                                </dd>
                              </div>
                              <hr
                                className={`w-full mx-auto border-t mb-1 mt-1 ${
                                  theme.isDark
                                    ? "border-gray-700"
                                    : "border-gray-300"
                                }`}
                              />
                              {/* Email */}
                              <div className="flex justify-between">
                                <dt className="text-gray-400">Email</dt>
                                <dd
                                  className={`font-medium text-blue-400 hover:text-blue-300 transition-colors truncate`}
                                >
                                  <a href={`mailto:${poc.POC_email}`}>
                                    {poc.POC_email || "N/A"}
                                  </a>
                                </dd>
                              </div>
                              <hr
                                className={`w-full mx-auto border-t mb-1 mt-1 ${
                                  theme.isDark
                                    ? "border-gray-700"
                                    : "border-gray-300"
                                }`}
                              />
                              {/* Phone */}
                              <div className="flex justify-between">
                                <dt className="text-gray-400">Phone</dt>
                                <dd
                                  className={`font-medium ${theme.textColor}`}
                                >
                                  {poc.POC_contact || "N/A"}
                                </dd>
                              </div>
                            </dl>

                            {/* Indicator dots */}
                            {allPOCs.length > 1 && (
                              <div className="flex justify-center space-x-1 mt-4">
                                {allPOCs.map((_, dotIndex) => (
                                  <div
                                    key={dotIndex}
                                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                                      dotIndex === currentPOCIndex
                                        ? "bg-[#5E5CE6]"
                                        : "bg-gray-500 bg-opacity-50"
                                    }`}
                                  ></div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3. Next Button */}
                    {allPOCs.length > 1 && (
                      <button
                        onClick={handleNextPOC}
                        disabled={currentPOCIndex === allPOCs.length - 1}
                        className={` right-0 z-10 rounded-full disabled:opacity-30 disabled:cursor-not-allowed p-2`}
                        style={{ boxShadow: theme.shadowOutset }}
                      >
                        <img
                          src={RightIcon}
                          alt="Next POC"
                          className={`h-6 w-6 ${
                            theme.isDark ? "" : "filter invert"
                          }   `}
                        />{" "}
                      </button>
                    )}
                  </div>
                ) : (
                  // Fallback for no POCs
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-400">
                      No primary contact available.
                    </p>
                  </div>
                )}
              </Card>

              {/* 3. SOCIAL MEDIA CARD */}
              <Card
                theme={theme}
                className="p-4 md:p-6 flex flex-col" // Adjusted padding
                customStyle={{
                  borderRadius: "25px",
                  boxShadow: theme.isDark
                    ? `5px 6px 9px 0px #00000075, -2px -2px 10px 0px #63636336`
                    : theme.shadowOutset,
                }}
              >
                <h3
                  className={`text-base font-semibold ${eventTextColor} flex items-center space-x-1 mb-1`}
                >
                  <Globe size={18} />
                  <span>Social Media</span>
                </h3>
                <hr
                  className={`w-full mx-auto border-t mb-4 ${
                    theme.isDark ? "border-gray-700" : "border-gray-300"
                  }`}
                />
                <div className="flex flex-col space-y-4 justify-center items-center flex-grow">
                  {/* Instagram Button */}
                  <button
                    onClick={() =>
                      handleSocialClick(
                        subEventData.event_instagram_link,
                        "Instagram"
                      )
                    }
                    style={{
                      background:
                        "linear-gradient(90deg, #262646 0%, #5E5CE6 43.75%, #262646 92.95%)",
                    }}
                    className=" w-full sm:w-3/4 text-white text-md py-1.5 rounded-[7.76px] font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.03] shadow-md"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                    <span>Instagram</span>
                  </button>

                  {/* Youtube Button */}
                  <button
                    onClick={() =>
                      handleSocialClick(
                        subEventData.event_youtube_link,
                        "YouTube"
                      )
                    }
                    style={{
                      background:
                        "linear-gradient(90deg, #262646 0%, #5E5CE6 43.75%, #262646 92.95%)",
                    }}
                    className=" text-white w-full sm:w-3/4 text-md py-1.5 rounded-[7.76px] font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.03] shadow-md"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2.5 17.5v-11A1.5 1.5 0 0 1 4 5h16a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5z" />
                      <path d="m10 15 5-3-5-3v6z" />
                    </svg>
                    <span>Youtube</span>
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Card>

      <Alert
        alert={appAlert}
        onClose={() => setAppAlert(null)}
        darkMode={theme.isDark}
      />
      <ConfirmModal
        isOpen={showConfirmDeleteModal}
        onClose={() => setShowConfirmDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to permanently delete sub event : ${subEventData.event_name} ? This action cannot be undone.`}
        darkMode={theme.isDark}
      />
      {showPreferenceModal && (
        <PreferenceModal
          preferences={subeventPreferences}
          theme={theme}
          onClose={() => setShowPreferenceModal(false)}
        />
      )}
      {showSeatingModal && (
        <SeatingLayoutModal
          eventData={subEventData}
          theme={theme}
          onClose={() => setShowSeatingModal(false)}
          totalSeatingLayouts={1}
          currentSeatingIndex={0}
          onPrevSeating={() => {}}
          onNextSeating={() => {}}
          formatImagePath={getImageUrl}
        />
      )}
      {showTicketModal && (
        <TicketDetailModal
          theme={theme}
          onClose={() => setShowTicketModal(false)}
          ticketTypes={subEventTicketTypes}
          currentTicketIndex={currentTicketIndex}
          onPrevTicket={handlePrevTicketModal}
          onNextTicket={handleNextTicketModal}
          formatImagePath={getImageUrl}
        />
      )}
      {showRulesModal && (
        <RulesSubModal
          eventRules={subEventData.event_rules}
          eventProhibitedItems={subEventData.prohibited_items}
          theme={theme}
          onClose={() => setShowRulesModal(false)}
          formatImagePath={getImageUrl}
        />
      )}
      {showLocationModal && (
        <EventLocationModal
          eventData={subEventData}
          theme={theme}
          onClose={() => setShowLocationModal(false)}
          setAppAlert={setAppAlert}
        />
      )}
    </div>
  );
};
export default ViewSingleSubEvent;
