import React, { useState, useMemo, useEffect, useRef } from "react";

import { ChevronRight, ChevronLeft, X, Phone, Play } from "lucide-react";

import Event_Days from "../../assets/ViewSingleEvent/Event_Days.svg";
import Globe from "../../assets/ViewSingleEvent/Globe.svg";
import Private from "../../assets/ViewSingleEvent/Private.svg";
import Language from "../../assets/ViewSingleEvent/Language.svg";
import Map_Loc from "../../assets/ViewSingleEvent/Map_Loc.svg";
import Map_No_Loc from "../../assets/ViewSingleEvent/Map_No_Loc.svg";
import Max_People from "../../assets/ViewSingleEvent/Max_People.svg";
import Offline from "../../assets/ViewSingleEvent/Offline.svg";
import Online from "../../assets/ViewSingleEvent/Online.svg";
import Preference from "../../assets/ViewSingleEvent/Preference.svg";
import Prohibit from "../../assets/ViewSingleEvent/Prohibit.svg";
import Seat from "../../assets/ViewSingleEvent/Seat.svg";
import Ticket from "../../assets/ViewSingleEvent/Ticket.svg";
import NoGuide from "../../assets/ViewSingleEvent/NoGuide.svg";
import GuideVector from "../../assets/ViewSingleEvent/GuideVector.svg";
import Rules from "../../assets/ViewSingleEvent/Rules.svg";

import {
  getTicketById,
  getGroupView,
  deleteTicket,
} from "../../services/ticketService";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import Card from "../../components/ViewSingleEvent/Card";
import getFullBankingDetails from "../../components/ViewSingleEvent/getFullBankingDetails";
import getCarouselEvents from "../../components/ViewSingleEvent/getCarouselEvents";
import getPreferences from "../../components/ViewSingleEvent/getPreferences";
import formatImagePath from "../../components/ViewSingleEvent/formatImagePath";
import formatCapacity from "../../components/ViewSingleEvent/formatCapacity";
import InsetCard from "../../components/ViewSingleEvent/InsetCard";
import FeatureButton from "../../components/ViewSingleEvent/FeatureButton";
import RulesModal from "../../components/ViewSingleEvent/RulesModal";
import LanguagePopover from "../../components/ViewSingleEvent/LanguagePopover";
import ProhibitPopover from "../../components/ViewSingleEvent/ProhibitPopover";
import PreferenceModal from "../../components/ViewSingleEvent/PreferenceModal";
import ImageModal from "../../components/ViewSingleEvent/ImageModal";
import GuideModal from "../../components/ViewSingleEvent/GuideModal";
import TopNavBar from "../../components/ViewSingleEvent/TopNavBar";
import SubEventDetailModal from "../../components/ViewSingleEvent/SubEventDetailModal";
import ActionCircleButton from "../../components/ViewSingleEvent/ActionCircleButton";
import EventLocationModal from "../../components/ViewSingleEvent/EventLocationModal";
import TicketDetailModal from "../../components/ViewSingleEvent/TicketDetailModal";
import SeatingLayoutModal from "../../components/ViewSingleEvent/SeatingLayoutModal";
import CustomScrollbarStyles from "../../components/CreateGroup/CustomScrollbarStyles";
import ConfirmModal from "../../components/Modal";
import Alert from "../../components/Alert";

const darkTheme = {
  isDark: true,
  text: "text-white",
  mainBg: "#212426",
  cardBg: "rgba(33, 36, 38, 0.9)",
  insetBg: "rgba(30, 33, 35, 0.9)",
  shadowOutset: "7px 7px 14px #151515, -7px -7px 14px #2b2b2b",
  shadowInset: "inset 7px 7px 14px #151515, inset -7px -7px 14px #2b2b2b",
  textColor: "text-gray-300",
};

const lightTheme = {
  isDark: false,
  text: "text-gray-900",
  mainBg: "#e0e0e0",
  cardBg: "rgba(255, 255, 255, 0.9)",
  insetBg: "rgba(230, 230, 230, 0.9)",
  shadowOutset: "5px 5px 10px #c5c5c5, -5px -5px 10px #fbfbfb",
  shadowInset: "inset 5px 5px 10px #c5c5c5, inset -5px -5px 10px #fbfbfb",
  textColor: "text-gray-700",
};

const ConfirmEventView = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); 
  const initialThemeIsDark = location.state?.initialThemeIsDark ?? true;

  const [theme, setTheme] = useState(
    initialThemeIsDark ? darkTheme : lightTheme
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentGuideIndex, setCurrentGuideIndex] = useState(0);
  const [currentBankIndex, setCurrentBankIndex] = useState(0);
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);

  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isApiReady, setIsApiReady] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [groupData, setGroupData] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [showGuideModal, setShowGuideModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const [currentStatsEventIndex, setCurrentStatsEventIndex] = useState(0);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);

  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

  const [showSubEventModal, setShowSubEventModal] = useState(false);
  const [selectedSubEvent, setSelectedSubEvent] = useState(null);

  const [currentSeatingIndex, setCurrentSeatingIndex] = useState(0);
  const [showSeatingModal, setShowSeatingModal] = useState(false);

  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [appAlert, setAppAlert] = useState(null);

  const groupId = eventData?.group_id || eventData?.groupId; // Derive groupId from fetched data

  const guidesToShow = viewportWidth >= 768 ? 3 : 1;
  const visibleTickets = viewportWidth >= 768 ? 3 : 1;
  const ticketsToShow = 3;

  const guideContainerRef = useRef(null);

  const handleDeleteEvent = async () => {
    setShowConfirmDeleteModal(true);
  };

  // ADDED: New function to execute deletion after confirmation
  const handleConfirmDelete = async () => {
    setShowConfirmDeleteModal(false);
    if (!ticketId) return;

    try {
      setLoading(true);

      await deleteTicket(ticketId);

      setAppAlert({
        message: "Success!",
        description: `Event ID ${ticketId} was successfully deleted.`,
        type: "success",
        show: true,
      });

      setTimeout(() => navigate("/home"), 1000);
    } catch (error) {
      console.error("Failed to delete event:", error);
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

  // ADDED: useEffect for responsiveness
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    // Use a simple window listener for general responsiveness
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const seatingEvents = useMemo(() => {
    if (!eventData) return [];

    const allEvents = [];

    // 1. Add the main event itself if it has seating info (assuming 'eventData.has_seating_layout' property)
    if (eventData.location_type === "offline" && eventData.ticket_layout) {
      allEvents.push(eventData);
    }

    // 2. Add all sub-events that have seating info
    if (eventData.sub_events) {
      eventData.sub_events.forEach((sub) => {
        if (sub.location_type === "offline" && sub.ticket_layout) {
          allEvents.push(sub);
        }
      });
    }
    return allEvents;
  }, [eventData]);

  const handlePrevSeating = () => {
    const len = seatingEvents.length;
    if (len === 0) return;

    setCurrentSeatingIndex((prevIndex) =>
      prevIndex === 0 ? len - 1 : prevIndex - 1
    );
  };

  const handleNextSeating = () => {
    const len = seatingEvents.length;
    if (len === 0) return;

    setCurrentSeatingIndex((prevIndex) => (prevIndex + 1) % len);
  };

  const handleCarouselPrev = () => {
    setActiveCarouselIndex((prev) => Math.max(0, prev - 1));
  };

  const handleCarouselNext = () => {
    const maxIndex = carouselEvents.length - 1;
    setActiveCarouselIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const handlePlayClick = () => {
    console.log("Play clicked, event_images:", eventData?.event_images);
    if (eventData?.event_images?.length > 0) {
      setCurrentImageIndex(0);
      setShowImageModal(true);
      console.log("showImageModal set to true");
    } else {
      setAppAlert({
        message: "Information",
        description: "No images or video available for preview.",
        type: "error",
        show: true,
      });
    }
  };
  // Inside ViewEvent component

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    const d = theme
      ? theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(d ? darkTheme : lightTheme);
    document.documentElement.classList.toggle("dark", d);
  }, []);

  const handleThemeToggle = () => {
    const newDark = !theme.isDark;

    setTheme(newDark ? darkTheme : lightTheme);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  };

  useEffect(() => {
    const callbackName = "initViewMapCallback";
    const scriptId = "google-maps-view-script";

    if (window.google && window.google.maps) {
      setIsApiReady(true);
      return;
    }

    if (!window[callbackName]) {
      window[callbackName] = () => {
        setIsApiReady(true);
      };
    }

    const existingScript = document.getElementById(scriptId);
    if (existingScript) return;

    const script = document.createElement("script");
    script.id = scriptId;
    const apiKey = import.meta.env.VITE_GOOGLE_MAP_API;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (
      !isApiReady ||
      !mapRef.current ||
      !eventData ||
      eventData.location_type !== "offline"
    )
      return;

    const coords = eventData.exact_map_location;
    const initialCenter = {
      lat: parseFloat(coords?.latitude) || 10.5276,
      lng: parseFloat(coords?.longitude) || 76.2144,
    };

    const initializeMap = () => {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 15,
        disableDefaultUI: true,
        gestureHandling: "none",
      });

      markerRef.current = new window.google.maps.Marker({
        position: initialCenter,
        map: mapInstance,
        draggable: false,
        title: eventData.venue || "Event Location",
      });

      setTimeout(() => {
        window.google.maps.event.trigger(mapInstance, "resize");
        mapInstance.setCenter(initialCenter);
      }, 300);
    };

    initializeMap();
  }, [isApiReady, eventData]);

  useEffect(() => {
    const fetchAndSetData = async () => {
      if (!ticketId) {
        setError("Event ID not found in URL parameters.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);

        const [ticketResponse, groupResponse] = await Promise.all([
          getTicketById(ticketId),
          getGroupView(ticketId),
        ]);

        const data =
          ticketResponse?.ticket ||
          ticketResponse?.data?.ticket ||
          ticketResponse?.data ||
          ticketResponse;

        const fetchedGroupData =
          groupResponse?.group || groupResponse?.data || groupResponse;

        if (!data || !data.event_name)
          throw new Error("Event data is incomplete.");

        setEventData(data);
        setGroupData(fetchedGroupData);
      } catch (err) {
        console.error("Failed to fetch event/group data:", err);
        setError(err.message || "Failed to load event details.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndSetData();
  }, [ticketId]);

  const [showPreferenceModal, setShowPreferenceModal] = useState(false);

  useEffect(() => {
    if (eventData?.banking_details?.length > 0) {
      setCurrentBankIndex(0);
    }
  }, [eventData]);

  const allBankingDetails = useMemo(
    () => getFullBankingDetails(eventData, groupData),
    [eventData, groupData]
  );

  const currentBankInfo = useMemo(() => {
    return allBankingDetails[currentBankIndex] || {};
  }, [allBankingDetails, currentBankIndex]);

  const eventPreferences = useMemo(() => {
    return getPreferences(eventData);
  }, [eventData]);

  const carouselEvents = useMemo(
    () => getCarouselEvents(eventData, formatImagePath),
    [eventData]
  );

  const handleClosePreferenceModal = () => setShowPreferenceModal(false);

  const rulesContent = useMemo(() => {
    const rules = eventData?.event_rules;
    if (rules && rules.type === "text" && rules.content) {
      return rules.content;
    }
    return "Please maintain silence during the show. Mobile phones must be switched off. Photography, video recording, and outside food are strictly prohibited. Follow seat numbers and avoid blocking aisles. Respect performers and fellow audience members. Entry is not allowed after the show begins. Keep the theater clean and tidy.";
  }, [eventData]);

  const eventStats = useMemo(() => {
    if (!eventData)
      return { likeCount: 0, totalCapacity: 0, shareCount: 0, ticketTypes: [] };
    return {
      likeCount: eventData.like || 0,
      totalCapacity: eventData.total_capacity || 0,
      shareCount: eventData.share_count || 0,
      ticketTypes: eventData.ticket_types || [],
    };
  }, [eventData]);

  const hashtags = useMemo(() => {
    return eventData?.hashtag || [];
  }, [eventData]);

  const formattedDateRange = useMemo(() => {
    if (!eventData?.event_dates?.length)
      return { dateText: "Date TBA", timeText: "N/A" };

    const eventDates = eventData.event_dates[0];
    const firstDate = new Date(eventDates.start_date);

    const startTime = eventDates.start_time
      ? new Date(`1970-01-01T${eventDates.start_time}`).toLocaleTimeString(
          "en-US",
          { hour: "numeric", minute: "numeric", hour12: true }
        )
      : "N/A";

    const dateString = firstDate.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    return { dateText: dateString, timeText: startTime };
  }, [eventData]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-xl"
        style={{
          backgroundColor: darkTheme.mainBg,
          color: darkTheme.textColor,
        }}
      >
        Loading Event Data...
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center text-xl text-red-400"
        style={{ backgroundColor: darkTheme.mainBg }}
      >
        Error: {error || `Event with ID "${ticketId}" not found.`}
      </div>
    );
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleTuneClick = () => {
    setAppAlert({
      message: "Information",
      description: "Tune/Filter button clicked!",
      type: "error",
      show: true,
    });
  };
  const handleNavigateHome = () => {
    navigate("/home", {
      state: {
        initialThemeIsDark: theme.isDark,
      },
    });
  };
  const handleLocationClick = () => {
    if (eventData.location_type === "offline") {
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

  const handleTicketInfoClick = () => {
    if (eventStats.ticketTypes.length > 0) {
      setShowTicketModal(true);
    }
  };
  const handleGuestClick = (guest) => {
    console.log("Guest Clicked! Modal should open for:", guest.guest_name);
    setSelectedGuest(guest);
    setShowGuideModal(true);
  };

  const handleCloseGuideModal = () => {
    setShowGuideModal(false);
    setSelectedGuest(null);
  };

  const insetBoxStyle = {
    boxShadow: theme.shadowInset,
    backgroundColor: theme.insetBg,
    borderRadius: "12px",
  };

  const handlePrevGuide = () => {
    setCurrentGuideIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  const handleNextGuide = () => {
    setCurrentGuideIndex((prevIndex) =>
      Math.min((eventData.guests?.length || 0) - guidesToShow, prevIndex + 1)
    );
  };

  const handlePrevBank = () => {
    const len = allBankingDetails.length || 0;
    if (len <= 1) return;
    setCurrentBankIndex((prevIndex) =>
      prevIndex === 0 ? len - 1 : prevIndex - 1
    );
  };

  const handleNextBank = () => {
    const len = allBankingDetails.length || 0;
    if (len <= 1) return;
    setCurrentBankIndex((prevIndex) =>
      prevIndex === len - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrevTicket = () => {
    setCurrentTicketIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  const handleNextTicket = () => {
    const len = eventStats.ticketTypes.length;
    setCurrentTicketIndex((prevIndex) =>
      Math.min(len - visibleTickets, prevIndex + 1)
    );
  };

  const handlePrevTicketModal = () => {
    const len = eventStats.ticketTypes.length;
    if (len === 0) return;
    setCurrentTicketIndex((prevIndex) =>
      prevIndex === 0 ? len - 1 : prevIndex - 1
    );
  };

  const handleNextTicketModal = () => {
    const len = eventStats.ticketTypes.length;
    if (len === 0) return;
    setCurrentTicketIndex((prevIndex) => (prevIndex + 1) % len);
  };

  const handleNextImage = () => {
    const len = eventData?.event_images?.length || 0;
    if (len === 0) return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % len);
  };

  const handlePrevImage = () => {
    const len = eventData?.event_images?.length || 0;
    if (len === 0) return;
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? len - 1 : prevIndex - 1
    );
  };

  const bannerImageUrl = formatImagePath(eventData.event_banner);
  const TypeIcon = eventData.event_type === "private" ? Private : Globe;
  const TypeLabel = eventData.event_type === "private" ? "Private" : "Public";

  let LocationIcon;
  let LocationLabel;

  switch (eventData.location_type) {
    case "online":
      LocationIcon = Online;
      LocationLabel = "Online";
      break;
    case "recorded":
      LocationIcon = Offline;
      LocationLabel = "Recorded";
      break;
    case "offline":
    default:
      LocationIcon = Offline;
      LocationLabel = "Offline";
      break;
  }

  return (
    <div
      className={`min-h-screen md:p-8 p-2 ${theme.text}`}
      style={{ backgroundColor: theme.mainBg }}
    >
      <ConfirmModal
        isOpen={showConfirmDeleteModal}
        onClose={() => setShowConfirmDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to permanently delete event ID ${ticketId}? This action cannot be undone.`}
        darkMode={theme.isDark} // Pass theme state
      />

      {/* GLOBAL ALERT: Displays success/error messages */}
      <Alert alert={appAlert} onClose={() => setAppAlert(null)} />
      <CustomScrollbarStyles isDark={theme} />
      <TopNavBar
        theme={theme}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onTuneClick={handleTuneClick}
        handleThemeToggle={handleThemeToggle}
        handleNavigateHome={handleNavigateHome}
      />

      <div className="flex justify-between items-center md:mb-10 mb-4 px-2 md:px-0">
        <div className="flex justify-start md:justify-center flex-grow">
          <Card
            theme={theme}
            className="inline-block px-12 py-2"
            customStyle={{ borderRadius: "20px" }}
          >
            <h1
              className={`text-4xl font-bold text-center tracking-widest ${
                theme.isDark ? "text-gray-300" : "text-gray-800"
              }`}
            >
              {eventData.event_name?.toUpperCase() || "EVENT NAME"}
            </h1>
          </Card>
        </div>

        {/* 2. Action Buttons - Always on the far right, never wraps */}
        <div className="flex items-center my-auto space-x-4 flex-shrink-0 ml-4">
          <ActionCircleButton
            theme={theme}
            type="edit"
            ticketId={ticketId}
            groupId={groupId}
            setAppalert={setAppAlert}
          />
          <ActionCircleButton
            theme={theme}
            type="delete"
            ticketId={ticketId}
            onClick={handleDeleteEvent}
            setAppalert={setAppAlert} // Use the new handler here
          />
        </div>
      </div>

      <div className="md:relative">
        <div className="grid md:grid-cols-2 gap-6 ">
          <Card
            theme={theme}
            className="p-6 relative overflow-hidden"
            customStyle={{ borderTopLeftRadius: "50px" }}
          >
            <svg
              className="absolute -bottom-1 -right-1 w-48 h-48 pointer-events-none"
              viewBox="0 0 0 0"
              preserveAspectRatio="none"
            >
              <path
                d="M 200,200 L 200,0 Q 200,200 0,200 Z"
                fill={theme.mainBg}
              />
            </svg>

            <div className="flex space-x-6 mb-4">
              <h2 className={`text-xl font-semibold pb-1 ${theme.textColor}`}>
                {eventData.event_category}
              </h2>
              <h2 className="text-xl font-semibold text-gray-400">
                {eventData.event_subcategory}
              </h2>
            </div>
            <div className="md:flex space-y-4 md:space-y-0 md:space-x-6 mb-4">
              <div
                style={insetBoxStyle}
                className={`p-4 ${theme.textColor} leading-relaxed text-sm  flex-grow rounded-lg`}
              >
                {eventData.event_description}
              </div>
              <div className="flex justify-between">
                <Card
                  theme={theme}
                  className="md:p-4 gap-x-4  flex md:flex-col justify-around items-center flex-shrink-0"
                  style={{ minWidth: "80px" }}
                >
                  <div className="text-center md:py-2">
                    <img
                      src={TypeIcon}
                      alt=""
                      size={20}
                      className={`mx-auto mb-1 ${
                        theme.isDark ? "" : "filter invert"
                      }`}
                    />
                    <p className={`text-xs ${theme.textColor}`}>{TypeLabel}</p>
                  </div>
                  <div
                    className={`md:w-full h-full w-[1px] md:h-[1px] rounded-full my-1 ${
                      theme.isDark ? "bg-gray-700" : "bg-gray-400"
                    }`}
                  ></div>
                  <div className="text-center md:py-2">
                    <img
                      src={LocationIcon}
                      alt=""
                      className={`h-6 w-6 mx-auto mb-1 ${
                        theme.isDark ? "" : "filter invert"
                      }`}
                    />
                    <p className={`text-xs ${theme.textColor}`}>
                      {LocationLabel}
                    </p>
                  </div>
                </Card>
                <div className=" flex md:hidden   pt-8">
                  <div
                    className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0"
                    style={{ boxShadow: theme.shadowOutset }}
                  >
                    <img
                      src={
                        formatImagePath(eventData.event_logo) ||
                        "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo.svg/1200px-Starbucks_Corporation_Logo.svg.png"
                      }
                      alt="Event Logo"
                      className="w-full h-full rounded-full object-fit opacity-70 p-1"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="md:flex items-start space-x-4">
              <div className="md:w-3/5 space-y-4">
                <h3 className={`text-md font-semibold pt-2 ${theme.textColor}`}>
                  Status: {eventData.event_status}{" "}
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      eventData.event_status === "live"
                        ? "bg-green-400"
                        : "bg-blue-400"
                    } ml-2`}
                  ></span>
                </h3>
                <div style={insetBoxStyle} className="p-2 rounded-xl">
                  <div className="flex space-x-3 justify-around">
                    <Card
                      theme={theme}
                      className={`p-2 py-6 my-2 flex flex-col items-center justify-center w-2/5 rounded-lg border ${
                        theme.isDark ? "border-gray-700" : "border-gray-400"
                      }`}
                    >
                      <img
                        src={Event_Days}
                        alt="Event Days Icon"
                        className={`mb-1 h-5 w-5 ${
                          theme.isDark ? "" : "filter invert"
                        }`}
                      />
                      <p className={`text-3xl font-bold ${theme.textColor}`}>
                        {eventData.event_dates.length}
                      </p>
                      <p className={`text-sm mt-1 ${theme.textColor}`}>
                        Event Days
                      </p>
                    </Card>

                    {eventData.event_date_type === "multi-day" &&
                    eventData.sub_events?.length > 0 ? (
                      <Card
                        theme={theme}
                        className={`p-2 py-6 my-2 flex flex-col border ${
                          theme.isDark ? "border-gray-700" : "border-gray-300"
                        } items-center justify-center w-2/5 rounded-lg relative overflow-hidden`}
                      >
                        <div className="absolute inset-y-0 left-0 flex items-center p-1">
                          <ChevronLeft
                            size={20}
                            className={`text-gray-400 cursor-pointer ${
                              currentStatsEventIndex === 0
                                ? "opacity-30"
                                : "hover:text-white"
                            }`}
                            onClick={() =>
                              setCurrentStatsEventIndex((prev) =>
                                Math.max(0, prev - 1)
                              )
                            }
                          />
                        </div>
                        <div className="absolute inset-y-0 right-0 flex items-center p-1">
                          <ChevronRight
                            size={20}
                            className={`text-gray-400 cursor-pointer ${
                              currentStatsEventIndex ===
                              eventData.sub_events.length - 1
                                ? "opacity-30"
                                : "hover:text-white"
                            }`}
                            onClick={() =>
                              setCurrentStatsEventIndex((prev) =>
                                Math.min(
                                  eventData.sub_events.length - 1,
                                  prev + 1
                                )
                              )
                            }
                          />
                        </div>

                        <img
                          src={Max_People}
                          alt="Capacity Icon"
                          className={`mb-1 h-5 w-5 ${
                            theme.isDark ? "" : "filter invert"
                          }`}
                        />
                        <p className={`text-3xl font-bold ${theme.textColor}`}>
                          {formatCapacity(
                            eventData.sub_events[currentStatsEventIndex]
                              .total_capacity
                          )}
                        </p>
                        <p
                          className={`text-xs mt-0 text-center text-gray-500 truncate w-full px-2`}
                        >
                          (
                          {
                            eventData.sub_events[currentStatsEventIndex]
                              .event_name
                          }
                          )
                        </p>
                        <p className={`text-sm mt-1 ${theme.textColor}`}>
                          Total Capacity
                        </p>
                      </Card>
                    ) : (
                      <Card
                        theme={theme}
                        className={`p-2 py-6 my-2 flex flex-col border ${
                          theme.isDark ? "border-gray-700" : "border-gray-400"
                        } items-center justify-center w-2/5 rounded-lg`}
                      >
                        <img
                          src={Max_People}
                          alt="Max People Icon"
                          className={`mb-1 h-5 w-5 ${
                            theme.isDark ? "" : "filter invert"
                          }`}
                        />
                        <p className={`text-3xl font-bold ${theme.textColor}`}>
                          {formatCapacity(eventStats.totalCapacity)}
                        </p>
                        <p className={`text-sm mt-1 ${theme.textColor}`}>
                          Total Capacity
                        </p>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
              <div className="hidden  w-2/5 md:flex px-10 pt-10">
                <div
                  className="w-32 h-32 rounded-full overflow-hidden flex-shrink-0"
                  style={{ boxShadow: theme.shadowOutset }}
                >
                  <img
                    src={
                      formatImagePath(eventData.event_logo) ||
                      "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo.svg/1200px-Starbucks_Corporation_Logo.svg.png"
                    }
                    alt="Event Logo"
                    className="w-full h-full rounded-full object-fit opacity-70 p-1"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card
            theme={theme}
            className="p-6 flex flex-col relative overflow-hidden"
            customStyle={{ borderTopRightRadius: "50px" }}
          >
            <svg
              className="absolute -bottom-1 -left-1 w-48 h-48 pointer-events-none"
              viewBox="0 0 0 0"
              preserveAspectRatio="none"
            >
              <path d="M 0,200 L 0,0 Q 0,200 200,200 Z" fill={theme.mainBg} />
            </svg>

            <InsetCard theme={theme} className="md:p-3 md:mb-2 p-1 mb-1">
              <Card theme={theme} className="md:p-3 p-1">
                <div
                  onClick={handleLocationClick}
                  className="flex justify-between items-center md:space-x-3 space-x-1"
                >
                  <div
                    className="!p-0 relative md:w-24 md:h-24 w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                    ref={mapRef}
                  >
                    {!eventData.exact_map_location?.latitude && (
                      <div className="w-full h-full bg-gray-700 flex flex-col items-center justify-center text-xs text-gray-400 md:p-2">
                        <img
                          src={Map_No_Loc}
                          alt="Map Not Available"
                          className="bg-contain"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex-grow pl-2">
                    <p
                      className={`md:text-xl text-sm md:font-bold mb-0.5 ${theme.textColor}`}
                    >
                      {formattedDateRange.dateText}
                    </p>
                    <p className={`md:text-md text-xs ${theme.textColor}`}>
                      {eventData.location}
                    </p>
                    <p className="md:text-sm text-xs text-gray-400">
                      {eventData.venue}
                    </p>
                  </div>
                  <div className="md:w-[1px] h-10 bg-gray-700 md:mx-2 flex-shrink-0 hidden md:block"></div>
                  <div className="text-right flex-shrink-0 pr-1 w-1/4 md:w-1/3">
                    <p className="text-xs text-gray-500 mb-1">Gate opens at</p>
                    <p
                      className={`md:text-xl text-sm md:font-bold ${theme.textColor}`}
                    >
                      {formattedDateRange.timeText}
                    </p>
                  </div>
                </div>
              </Card>
            </InsetCard>

            {eventData.event_date_type === "multi-day" &&
            eventData.event_dates?.length > 0 ? (
              <div className="w-full">
                <h3 className={`text-lg font-semibold mb-2 ${theme.textColor}`}>
                  Multiple event
                </h3>

                <div className="w-full">
                  <div className="flex items-center justify-center relative px-8">
                    <button
                      onClick={handleCarouselPrev}
                      disabled={activeCarouselIndex === 0}
                      className={`absolute left-0 z-10 p-2 rounded-full transition-opacity ${
                        activeCarouselIndex === 0
                          ? "opacity-30 cursor-default"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      style={{
                        backgroundColor: theme.cardBg,
                        boxShadow: theme.shadowOutset,
                      }}
                    >
                      <ChevronLeft size={24} className={theme.textColor} />
                    </button>

                    <div className="overflow-hidden w-full">
                      <div
                        className="flex space-x-2 transition-transform duration-300 items-center py-4"
                        style={{
                          transform: `translateX(calc(50% - 52px - ${
                            activeCarouselIndex * 104
                          }px))`,
                        }}
                      >
                        {carouselEvents.map((event, index) => {
                          const isActive = index === activeCarouselIndex;
                          const scale = isActive ? 1.1 : 1;
                          const opacity = isActive ? 1 : 0.6;
                          const translateY = isActive ? "-5px" : "0";

                          const cardStyle = {
                            backgroundColor: isActive
                              ? "#5E5CE6"
                              : theme.cardBg,
                            boxShadow: isActive
                              ? "0 0 15px rgba(94, 92, 230, 0.7)"
                              : theme.shadowOutset,
                            transform: `scale(${scale}) translateY(${translateY})`,
                            opacity: opacity,
                            zIndex: isActive ? 10 : 1,
                            cursor: isActive ? "default" : "pointer",
                          };

                          return (
                            <div
                              key={index}
                              onClick={() => {
                                if (isActive) {
                                  setSelectedSubEvent(
                                    eventData.sub_events[index]
                                  );
                                  setShowSubEventModal(true);
                                } else {
                                  setActiveCarouselIndex(index);
                                }
                              }}
                              className={`flex-shrink-0 w-24 h-36 p-2 rounded-xl transition-all duration-300 transform-gpu`}
                              style={cardStyle}
                            >
                              <div className="flex flex-col items-center justify-between h-full">
                                <div
                                  className="w-10 h-10 mt-4 rounded-full overflow-hidden flex items-center justify-center"
                                  style={{
                                    backgroundColor: isActive
                                      ? "transparent"
                                      : "white",
                                  }}
                                >
                                  <img
                                    src={event.logo}
                                    alt={event.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div
                                  className={`text-sm font-bold ${
                                    isActive ? "text-white" : theme.textColor
                                  }`}
                                >
                                  {event.date}
                                </div>
                                <p
                                  className={`text-xs text-center ${
                                    isActive ? "text-white" : "text-gray-400"
                                  } leading-none truncate w-full px-1 mb-1`}
                                >
                                  {event.name}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={handleCarouselNext}
                      disabled={
                        activeCarouselIndex === carouselEvents.length - 1
                      }
                      className={`absolute right-0 z-10 p-2 rounded-full transition-opacity ${
                        activeCarouselIndex === carouselEvents.length - 1
                          ? "opacity-30 cursor-default"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      style={{
                        backgroundColor: theme.cardBg,
                        boxShadow: theme.shadowOutset,
                      }}
                    >
                      <ChevronRight size={24} className={theme.textColor} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2 mb-2 w-full">
                <h3 className={`text-lg font-semibold  ${theme.textColor}`}>
                  Single event
                </h3>
                <div
                  style={insetBoxStyle}
                  className={`p-4 ${theme.textColor} leading-relaxed my-4 text-sm  rounded-lg`}
                >
                  {eventData.event_description}
                </div>
              </div>
            )}
            <div className="flex items-end justify-end mb-0 w-4/5 mx-auto md:mx-0 md:ml-auto">
              <Card theme={theme} className="w-full p-2  rounded-lg">
                <div className="flex items-center h-12">
                  <div className="flex items-center pr-2">
                    <h3
                      className={`text-xs font-semibold whitespace-nowrap ${theme.textColor}`}
                    >
                      Event hashtag
                    </h3>
                  </div>
                  <div className="border-l-2 border-dotted border-gray-700 h-full mx-2"></div>
                  <div className="flex-grow pl-2">
                    {hashtags.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {hashtags.slice(0, 4).map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs font-medium px-2.5 py-1 rounded-md text-white"
                            style={{ backgroundColor: "#5E5CE6" }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No hashtag added
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </Card>

          <Card
            theme={theme}
            className="p-4 flex items-center justify-start  space-x-1 xl:space-x-6  relative"
            customStyle={{ overflow: "visible", zIndex: 30 }}
          >
            <svg
              className="absolute -top-1 -right-1 w-48 h-24 pointer-events-none"
              viewBox="0 0 0 0"
              preserveAspectRatio="none"
            >
              <path d="M 200,0 L 200,100 Q 200,0 0,0 Z" fill={theme.mainBg} />
            </svg>
            <div className="w-full flex justify-between md:justify-start items-center px-6 md:px-0">
              {/* This is the first item/group, containing Seat and Rules buttons */}
              <div className="md:flex md:gap-x-4">
                <FeatureButton
                  Icon={Seat}
                  label="Seat"
                  theme={theme}
                  // MODIFIED: Only allow click if seatingEvents exist
                  onClick={() => {
                    if (seatingEvents.length > 0) {
                      setCurrentSeatingIndex(0); // Start at the first seating layout
                      setShowSeatingModal(true);
                    } else {
                      alert(
                        "No seating layout information is available for this event or its sub-events."
                      );
                    }
                  }}
                />
                <FeatureButton Icon={Rules} label="Rules" theme={theme}>
                  <RulesModal rules={rulesContent} theme={theme} />
                </FeatureButton>
              </div>

              <div className="md:flex md:gap-x-4">
                <FeatureButton
                  Icon={Preference}
                  label="Preference"
                  theme={theme}
                  onClick={() => setShowPreferenceModal(true)}
                />
                <FeatureButton Icon={Language} label="Language" theme={theme}>
                  <LanguagePopover
                    languages={eventData.event_language}
                    theme={theme}
                  />
                </FeatureButton>
              </div>
            </div>
            <div className="md:hidden">
              <Card
                theme={theme}
                className="group relative p-2 text-center w-24  flex-shrink-0 z-20 flex flex-col justify-center items-center h-24 cursor-pointer"
              >
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-1  flex items-center justify-center"
                  style={{ backgroundColor: "#E53E3E" }}
                >
                  <img src={Prohibit} alt="Prohibit" className="w-5 h-5" />
                </div>
                <p className={`text-xs ${theme.textColor}`}>Prohibit</p>

                <ProhibitPopover
                  theme={theme}
                  prohibitedItems={eventData.prohibited_items}
                />
              </Card>
            </div>
          </Card>
          <div className="md:absolute md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 md:z-50 md:pointer-events-none">
            <div
              className="w-80 h-80 rounded-full relative"
              style={{
                boxShadow: theme.shadowInset,
                backgroundColor: theme.insetBg,
              }}
            >
              <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full overflow-hidden"
                style={{ boxShadow: theme.shadowOutset }}
              >
                <img
                  src={
                    bannerImageUrl ||
                    "https://i.ibb.co/b34XJb5/Salaar-Poster-Prabhas.jpg"
                  }
                  alt={eventData.event_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center pointer-events-auto cursor-pointer"
                style={{
                  backgroundColor: "#5E5CE6",
                  boxShadow: theme.shadowOutset,
                }}
                onClick={handlePlayClick}
              >
                <Play size={24} className="text-white ml-1" fill="white" />
              </button>
            </div>
          </div>
          <Card
            theme={theme}
            className="p-2 flex flex-col relative overflow-hidden"
          >
            <svg
              className="absolute -top-1 -left-1 w-48 h-24 pointer-events-none"
              viewBox="0 0 0 0"
              preserveAspectRatio="none"
            >
              <path d="M 0,0 L 0,100 Q 0,0 200,0 Z" fill={theme.mainBg} />
            </svg>

            <div className="flex flex-col h-full md:w-2/3 w-full md:ml-auto mx-auto md:mx-0">
              <Card theme={theme} className=" mb-2 rounded-lg w-3/4 mx-auto">
                <div className="flex justify-between items-center">
                  <ChevronLeft
                    size={24}
                    className={`text-gray-400 cursor-pointer ${
                      eventData.banking_details?.length <= 1 ? "opacity-50" : ""
                    }`}
                    onClick={handlePrevBank}
                  />
                  <h3 className={`text-lg font-semibold ${theme.textColor}`}>
                    Bank Details
                  </h3>
                  <ChevronRight
                    size={24}
                    className={`text-gray-400 cursor-pointer ${
                      eventData.banking_details?.length <= 1 ? "opacity-50" : ""
                    }`}
                    onClick={handleNextBank}
                  />
                </div>
              </Card>
              {eventData.payment_type === "paid" ? (
                <div className="flex flex-col h-full md:w-4/5 mx-auto">
                  {currentBankInfo.is_group_account && (
                    <p className="text-xs text-green-500 font-medium text-center mb-1">
                      (Group Primary Account)
                    </p>
                  )}

                  <dl className="text-sm space-y-2 px-2 md:w-3/4 mx-auto  flex-grow ite">
                    <div className="flex justify-between ">
                      <dt className={`text-gray-400 ${theme.textColor}`}>
                        Account Holder :
                      </dt>
                      <dd className={`font-medium ${theme.textColor}`}>
                        {currentBankInfo.bank_acc_holder || "N/A"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className={`text-gray-400 ${theme.textColor}`}>
                        Account No :
                      </dt>
                      <dd className={`font-medium ${theme.textColor}`}>
                        {currentBankInfo.bank_acc_no || "N/A"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className={`text-gray-400 ${theme.textColor}`}>
                        IFSC Code :
                      </dt>
                      <dd className={`font-medium  ${theme.textColor}`}>
                        {currentBankInfo.bank_ifsc || "N/A"}
                      </dd>
                    </div>
                  </dl>

                  {allBankingDetails.length > 1 && (
                    <div className="flex justify-center space-x-2 pb-2">
                      {allBankingDetails.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === currentBankIndex
                              ? "bg-white"
                              : "bg-gray-600"
                          }`}
                        ></div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-grow text-center py-3">
                  <h2 className="text-3xl font-bold text-green-500 mb-2">
                    Free event
                  </h2>
                  <p className={`text-lg ${theme.textColor}`}>
                    No payment required
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card
            theme={theme}
            className="p-6 relative overflow-hidden"
            customStyle={{
              borderBottomLeftRadius: "50px",
              overflow: "visible",
              zIndex: 20,
            }}
          >
            <svg
              className="absolute -top-1 -right-1 w-48 h-48 pointer-events-none"
              viewBox="0 0 0 0"
              preserveAspectRatio="none"
            >
              <path d="M 200,0 L 200,200 Q 200,0 0,0 Z" fill={theme.mainBg} />
            </svg>

            <h3 className={`text-lg font-semibold mb-4 ${theme.textColor}`}>
              Ticket Information
            </h3>

            <div className="flex items-start  md:space-x-3 mb-6">
              {eventStats.ticketTypes.length > 0 ? (
                <Card
                  theme={theme}
                  className="md:w-3/4 w-full p-3 mx-auto  rounded-lg"
                >
                  <div className="flex items-center justify-between mt-4">
                    <ChevronLeft
                      size={20}
                      className={`text-gray-400 cursor-pointer ${
                        currentTicketIndex === 0 ? "opacity-50" : ""
                      }`}
                      onClick={handlePrevTicket}
                    />

                    {/* CORRECTED CAROUSEL WINDOW: Removed justify-center and applied padding for spacing */}
                    <div className="flex items-center flex-grow overflow-hidden px-2 ">
                      <div className="flex justify-center w-full py-2">
                        {eventStats.ticketTypes
                          .slice(
                            currentTicketIndex,
                            currentTicketIndex + visibleTickets
                          )
                          .map((tier, index) => {
                            const globalIndex = currentTicketIndex + index;

                            // Define dynamic width and margin

                            const itemMarginClass =
                              viewportWidth < 768 ? "mr-4" : "mr-4";
                            return (
                              <div
                                key={tier.ticket_type}
                                className={`text-center cursor-pointer flex-shrink-0 ${
                                  viewportWidth < 780 ? "w-full" : "w-20"
                                } ${itemMarginClass}`}
                                onClick={() => {
                                  setCurrentTicketIndex(globalIndex);

                                  handleTicketInfoClick();
                                }}
                              >
                                <div
                                  className={`w-12 h-12 rounded-full mx-auto mb-1 hover:scale-110 transition-all duration-300 flex items-center justify-center`}
                                  style={{
                                    backgroundColor: tier.color || "#3B82F6",
                                  }}
                                >
                                  <span className="text-white text-xs font-bold">
                                    {tier.ticket_type[0]}
                                  </span>
                                </div>
                                <p className={`text-xs ${theme.textColor}`}>
                                  {tier.ticket_type}
                                </p>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Right Chevron (Always flex-shrink-0) */}
                    <ChevronRight
                      size={20}
                      className={`text-gray-400 cursor-pointer ${
                        currentTicketIndex >=
                        eventStats.ticketTypes.length - visibleTickets // Check if we are at the last index
                          ? "opacity-50"
                          : ""
                      }`}
                      onClick={handleNextTicket}
                    />
                  </div>
                </Card>
              ) : (
                <InsetCard
                  theme={theme}
                  className="flex flex-col items-center justify-center h-24 w-full md:w-3/4  text-gray-400"
                >
                  <img
                    src={Ticket}
                    alt=""
                    className={`h-6 w-6 ${
                      theme.isDark ? "" : "filter invert opacity-50"
                    }`}
                  />
                  <p className="text-lg">No Ticket is available</p>
                </InsetCard>
              )}

              <Card
                theme={theme}
                className="group relative p-2 text-center w-24 hidden   flex-shrink-0 z-20 md:flex flex-col justify-center items-center h-24 cursor-pointer"
              >
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-1  flex items-center justify-center"
                  style={{ backgroundColor: "#E53E3E" }}
                >
                  <img src={Prohibit} alt="Prohibit" className="w-5 h-5" />
                </div>
                <p className={`text-xs ${theme.textColor}`}>Prohibit</p>

                <ProhibitPopover
                  theme={theme}
                  prohibitedItems={eventData.prohibited_items}
                />
              </Card>
            </div>

            <InsetCard theme={theme} className="p-4">
              <div className="flex items-center space-x-4">
                <Card
                  theme={theme}
                  className="flex flex-col items-center justify-center p-3 rounded-lg w-28 cursor-pointer h-24"
                >
                  <Phone size={20} className="text-green-500 mb-1" />
                  <p className={`text-sm text-center ${theme.textColor}`}>
                    Point of call
                  </p>
                </Card>
                <div className="flex-grow flex items-center justify-center space-x-3 overflow-x-auto p-2">
                  {(eventData.POCS || []).map((person, index) => (
                    <div key={index} className="text-center w-16">
                      <div className="w-12 h-12 rounded-full mx-auto mb-1 border-2 border-gray-700 overflow-hidden flex items-center justify-center bg-gray-700">
                        <span className="text-white text-lg">
                          {person.POC_name?.[0]?.toUpperCase() || "P"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {person.POC_name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </InsetCard>
          </Card>

          <Card
            theme={theme}
            className="p-4 flex flex-col relative overflow-hidden "
            customStyle={{ borderBottomRightRadius: "50px" }}
          >
            <svg
              className="absolute -top-1 -left-1 w-48 h-48 pointer-events-none"
              viewBox="0 0 0 0"
              preserveAspectRatio="none"
            >
              <path d="M 0,0 L 0,200 Q 0,0 200,0 Z" fill={theme.mainBg} />
            </svg>

            <h3
              className={`text-lg font-semibold mb-4 px-2 ${theme.textColor}`}
            >
              Guide & Event Hosts
            </h3>
            {eventData.guests && eventData.guests.length > 0 ? (
              <div className="flex items-center space-x-2 pb-2 flex-grow ">
                {/* Prev Button */}
                <ChevronLeft
                  size={24}
                  className={`text-gray-400 cursor-pointer ${
                    currentGuideIndex === 0 ? "opacity-50" : ""
                  }`}
                  onClick={handlePrevGuide}
                />
                {/* Guide Carousel Container */}
                <div className="flex-grow flex items-center justify-center md:gap-x-6 overflow-x-hidden p-2">
                  {eventData.guests
                    .slice(currentGuideIndex, currentGuideIndex + guidesToShow)
                    .map((guest, index) => (
                      <Card
                        key={guest.guest_name}
                        theme={theme}
                        onClick={() => handleGuestClick(guest)}
                        className={`p-2 text-center rounded-lg cursor-pointer relative flex-shrink-0 w-full md:w-1/3 ${
                          currentGuideIndex % guidesToShow !== 0 &&
                          index === 0 &&
                          viewportWidth < 768
                            ? "-translate-x-full"
                            : ""
                        }`}
                      >
                        <div
                          className="relative w-28 md:w-32 rounded-lg mx-auto mb-2 overflow-hidden"
                          style={{ paddingTop: "100%" }}
                        >
                          <img
                            src={
                              formatImagePath(guest.guest_profile) ||
                              "https://i.pravatar.cc/150?img=default"
                            }
                            alt={guest.guest_name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                        <p
                          className={`text-sm ${theme.textColor} truncate px-1`}
                        >
                          {guest.guest_name}
                        </p>
                      </Card>
                    ))}
                </div>
                {/* Next Button */}
                <ChevronRight
                  size={24}
                  className={`text-gray-400 cursor-pointer ${
                    currentGuideIndex >= eventData.guests.length - guidesToShow
                      ? "opacity-50"
                      : ""
                  }`}
                  onClick={handleNextGuide}
                />
              </div>
            ) : (
              <div className="flex  items-center justify-center h-full  ">
                <img
                  src={NoGuide}
                  alt="No Guide Placeholder"
                  className="h-36 w-36 md:h-64 md:w-64 "
                />
                <p className="text-xl text-gray-500 font-medium flex items-center space-x-2">
                  <img
                    src={GuideVector}
                    alt="Guide Icon"
                    className="md:w-6 md:h-6 h-4 w-4 opacity-70"
                  />
                  <span className="text-sm md:text-base">
                    No guide is added
                  </span>
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
      {showPreferenceModal && (
        <PreferenceModal
          onClose={() => setShowPreferenceModal(false)}
          preferences={eventPreferences}
          theme={theme}
        />
      )}
      {showImageModal && eventData?.event_images?.length > 0 && (
        <ImageModal
          images={eventData.event_images}
          currentIndex={currentImageIndex}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
          onClose={() => setShowImageModal(false)}
          theme={theme}
          setAppAlert={setAppAlert}
        />
      )}
      {showGuideModal && (
        <GuideModal
          guest={selectedGuest}
          theme={theme}
          formatImagePath={formatImagePath} // <--- Passed here
          onClose={handleCloseGuideModal}
          setAppAlert={setAppAlert}
        />
      )}
      {showSubEventModal && selectedSubEvent && (
        <SubEventDetailModal
          subEvent={selectedSubEvent}
          theme={theme}
          onClose={() => {
            setShowSubEventModal(false);
            setSelectedSubEvent(null);
          }}
          formatImagePath={formatImagePath}
          setAppAlert={setAppAlert}
        />
      )}
      {showLocationModal && (
        <EventLocationModal
          eventData={eventData}
          theme={theme}
          onClose={() => setShowLocationModal(false)}
          setAppAlert={setAppAlert}
        />
      )}
      {showTicketModal && (
        <TicketDetailModal
          theme={theme}
          onClose={() => setShowTicketModal(false)}
          ticketTypes={eventStats.ticketTypes}
          currentTicketIndex={currentTicketIndex}
          onPrevTicket={handlePrevTicketModal} 
          onNextTicket={handleNextTicketModal} 
          formatImagePath={formatImagePath}
          setAppAlert={setAppAlert}
        />
      )}
      {showSeatingModal && seatingEvents.length > 0 && (
        <SeatingLayoutModal
          eventData={seatingEvents[currentSeatingIndex]}
          theme={theme}
          onClose={() => setShowSeatingModal(false)}
          totalSeatingLayouts={seatingEvents.length}
          currentSeatingIndex={currentSeatingIndex}
          onPrevSeating={handlePrevSeating}
          onNextSeating={handleNextSeating}
          formatImagePath={formatImagePath}
          setAppAlert={setAppAlert}
        />
      )}
    </div>
  );
};

export default ConfirmEventView;
