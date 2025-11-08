import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import GroupViewModal from "../../components/CreateGroup/GroupViewModal";
import { ChevronRight, ChevronLeft, Phone, Play, Bookmark } from "lucide-react";
import { getImageUrl } from "../../utils/imageUtils";
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
import LeftIcon from "../../assets/ViewSingleEvent/LeftIcon.svg";
import RightIcon from "../../assets/ViewSingleEvent/RightIcon.svg";
import Bank_Details from "../../assets/ViewSingleEvent/Bank_Details.svg";

import {
  getTicketById,
  getGroupView,
  deleteTicket,
  confirmEvent,
  getMyEvents,
} from "../../services/ticketService";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import Card from "../../components/ViewSingleEvent/Card";
import getCarouselEvents from "../../components/ViewSingleEvent/getCarouselEvents";
import getPreferences from "../../components/ViewSingleEvent/getPreferences";
import formatCapacity from "../../components/ViewSingleEvent/formatCapacity";
import InsetCard from "../../components/ViewSingleEvent/InsetCard";
import FeatureButton from "../../components/ViewSingleEvent/FeatureButton";
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
import RulesModal from "../../components/ViewSingleEvent/RulesModal";
import ScrollBarStyle from "../../components/ScrollBarStyle";

import POCDetailModal from "../../components/ViewSingleEvent/POCDetailModal";
import HashtagModal from "../../components/ViewSingleEvent/HashtagModal";

const darkTheme = {
  isDark: true,
  text: "text-white",
  mainBg: "#212426",
  cardBg: "rgba(33, 36, 38, 0.9)",
  insetBg: "rgba(30, 33, 35, 0.9)",
  shadowOutset: "7px 7px 14px #151515, -7px -7px 14px #2b2b2b",
  shadowInset: "inset 7px 7px 14px #151515, inset -7px -7px 14px #2b2b2b",
  textColor: "text-gray-300",
  arrowBgClass: "bg-gray-700",
  arrowColorClass: "text-white",
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
  arrowBgClass: "bg-gray-800",
  arrowColorClass: "text-gray-200",
};
const ViewSingleEvent = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // <--- New hook usage
  const initialThemeIsDark = location.state?.initialThemeIsDark ?? true;
  const [theme, setTheme] = useState(
    initialThemeIsDark ? darkTheme : lightTheme
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentGuideIndex, setCurrentGuideIndex] = useState(0);
  const [currentBankIndex, setCurrentBankIndex] = useState(0);
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(initialThemeIsDark);
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isApiReady, setIsApiReady] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [selectedGroupForModal, setSelectedGroupForModal] = useState(null);
  const [groupEventCount, setGroupEventCount] = useState(0);
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
  const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false);

  const [currentSeatingIndex, setCurrentSeatingIndex] = useState(0);
  const [showSeatingModal, setShowSeatingModal] = useState(false);

  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [appAlert, setAppAlert] = useState(null);

  const [showRulesModal, setShowRulesModal] = useState(false);

  const [showHashtagModal, setShowHashtagModal] = useState(false);

  const [showPOCModal, setShowPOCModal] = useState(false);
  const [selectedPOC, setSelectedPOC] = useState(null);

  const groupId = eventData?.group_id || eventData?.groupId; // Derive groupId from fetched data
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const guidesToShow = viewportWidth >= 768 ? 3 : 1;
  const visibleTickets = viewportWidth >= 768 ? 3 : 1;

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const response = await getMyEvents();

        // Parse the response to extract events/tickets
        let events = [];
        if (response?.data?.tickets) {
          events = response.data.tickets;
        } else if (response?.tickets) {
          events = response.tickets;
        } else if (response?.data?.events) {
          events = response.data.events;
        } else if (response?.events) {
          events = response.events;
        } else if (Array.isArray(response?.data)) {
          events = response.data;
        } else if (Array.isArray(response)) {
          events = response;
        }

        setAllEvents(events);
      } catch (err) {
        setAllEvents([]);
      }
    };

    fetchAllEvents();
  }, []);

  const handleDeleteEvent = async () => {
    setShowConfirmDeleteModal(true);
  };

  const handleShowHashtagModal = () => {
    if (hashtags.length > 0) {
      setShowHashtagModal(true);
    } else {
      setAppAlert({
        message: "Information",
        description: "No hashtags available to show.",
        type: "error",
        show: true,
      });
    }
  };
  const handlePOCPersonClick = (person) => {
    setSelectedPOC(person);
    setShowPOCModal(true);
  };

  const handleClosePOCModal = () => {
    setShowPOCModal(false);
    setSelectedPOC(null);
  };
  const handleSave = useCallback(async () => {
    setShowConfirmSaveModal(false);
    if (!ticketId) {
      setAppAlert({
        type: "error",
        message: "Error",
        description: "Ticket ID is missing.",
      });
      return;
    }

    setLoading(true);

    try {
      // Call confirmEvent API to save the event
      await confirmEvent(ticketId);

      setAppAlert({
        type: "success",
        message: "Event Saved!",
        description: "Your event has been saved successfully.",
      });

      // Navigate to confirm events page after a short delay
      setTimeout(() => {
        navigate("/ticket/confirm-events");
      }, 1500);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to save event. Please try again.";
      setAppAlert({
        type: "error",
        message: "Save Failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [ticketId, navigate]);

  const allEventsForBankView = useMemo(() => {
    if (!eventData) return []; // 1. Collect all events and their associated bank details

    const events = [
      {
        name: eventData.event_name,
        isPaid: eventData.payment_type === "paid",
        isPrimary: true,
        bankDetails:
          eventData.banking_details || groupData?.banking_details || [], // Prioritize event bank, fallback to group
        order: 0, // Used for tie-breaking/original order
      },
    ]; // Add all Sub-Events

    if (eventData.sub_events) {
      eventData.sub_events.forEach((subEvent, index) => {
        // Determine the bank details for the sub-event.
        const subEventBankDetails =
          subEvent.banking_details ||
          eventData.banking_details ||
          groupData?.banking_details ||
          [];

        events.push({
          name: subEvent.event_name,
          isPaid: subEvent.payment_type === "paid",
          isPrimary: false,
          bankDetails: subEventBankDetails,
          order: index + 1, // Used for tie-breaking/original order
        });
      });
    }

    events.sort((a, b) => {
      const paidDiff = (b.isPaid ? 1 : 0) - (a.isPaid ? 1 : 0);
      if (paidDiff !== 0) {
        return paidDiff;
      }
      return a.order - b.order;
    });

    return events;
  }, [eventData, groupData]);

  const handleSaveEvent = () => {
    setShowConfirmSaveModal(true);
  };

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

      setTimeout(() => navigate("/ticket/deleted-events"), 1000);
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

  const [currentEventBankIndex, setCurrentEventBankIndex] = useState(0);

  const currentEventForBankView = useMemo(() => {
    return allEventsForBankView[currentEventBankIndex] || {};
  }, [allEventsForBankView, currentEventBankIndex]);

  const currentBankDetailsList = useMemo(() => {
    // This allows navigating multiple bank accounts *within* the selected event/sub-event
    return currentEventForBankView.bankDetails || [];
  }, [currentEventForBankView]);

  const [currentBankDetailsIndex, setCurrentBankDetailsIndex] = useState(0);

  const currentBankInfo = useMemo(() => {
    return currentBankDetailsList[currentBankDetailsIndex] || {};
  }, [currentBankDetailsList, currentBankDetailsIndex]);

  const handlePrevEventForBankView = () => {
    setCurrentEventBankIndex((prev) => {
      const newIndex = prev === 0 ? allEventsForBankView.length - 1 : prev - 1;
      setCurrentBankDetailsIndex(0); // Reset account index when changing event
      return newIndex;
    });
  };

  const handleNextEventForBankView = () => {
    setCurrentEventBankIndex((prev) => {
      const newIndex = prev === allEventsForBankView.length - 1 ? 0 : prev + 1;
      setCurrentBankDetailsIndex(0); // Reset account index when changing event
      return newIndex;
    });
  };
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

  const handlePlayClick = () => {
    // Collect all images: banner, logo, and event_images
    const allImages = [];

    // Add banner if exists
    if (eventData?.event_banner) {
      const bannerUrl = getImageUrl(eventData.event_banner, "ticket");

      allImages.push({
        path: bannerUrl,
        type: "banner",
        name: "Event Banner",
        originalName: "Event Banner",
      });
    }

    // Add logo if exists
    if (eventData?.event_logo) {
      const logoUrl =
        eventData.event_logo.startsWith("http://") ||
        eventData.event_logo.startsWith("https://")
          ? eventData.event_logo
          : getImageUrl(eventData.event_logo, "ticket");

      allImages.push({
        path: logoUrl,
        type: "logo",
        name: "Event Logo",
        originalName: "Event Logo",
      });
    }

    // Add event_images if exist
    if (eventData?.event_images?.length > 0) {
      eventData.event_images.forEach((img, index) => {
        const imgPath = img.path || img;
        const imgUrl =
          imgPath.startsWith("http://") || imgPath.startsWith("https://")
            ? imgPath
            : getImageUrl(imgPath, "ticket");

        allImages.push({
          path: imgUrl,
          type: "event_image",
          name: img.originalName || `Event Image ${index + 1}`,
          originalName: img.originalName || `Event Image ${index + 1}`,
        });
      });
    }

    if (allImages.length > 0) {
      setCurrentImageIndex(0);
      setShowImageModal(true);
    } else {
      setAppAlert({
        message: "Information",
        description: "No images available for preview.",
        type: "error",
        show: true,
      });
    }
  };
  // Inside ViewEvent component
  useEffect(() => {
    const themeValue = localStorage.getItem("theme");
    const d = themeValue
      ? themeValue === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const selectedTheme = d ? darkTheme : lightTheme;
    setTheme(selectedTheme);
    setIsDarkMode(d);
    document.documentElement.classList.toggle("dark", d);
  }, []);
  const handleThemeToggle = () => {
    const newDark = !theme.isDark;
    const newTheme = newDark ? darkTheme : lightTheme;

    setTheme(newTheme);
    setIsDarkMode(newDark);
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
        // Test if logo URL is accessible
        if (data.event_logo) {
          const testImg = new Image();
          testImg.onload = () => (testImg.onerror = () => null);
          testImg.src = data.event_logo;
        }

        setEventData(data);
        setGroupData(fetchedGroupData);
      } catch (err) {
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

  const eventPreferences = useMemo(() => {
    return getPreferences(eventData);
  }, [eventData]);

  const carouselEvents = useMemo(
    () => getCarouselEvents(eventData, (path) => getImageUrl(path, "ticket")),
    [eventData]
  );

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
    setSelectedGuest(guest);
    setShowGuideModal(true);
  };

  const handleCloseGuideModal = () => {
    setShowGuideModal(false);
    setSelectedGuest(null);
  };

  const handlePrevGuide = () => {
    setCurrentGuideIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  const handleNextGuide = () => {
    setCurrentGuideIndex((prevIndex) =>
      Math.min((eventData.guests?.length || 0) - guidesToShow, prevIndex + 1)
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
    // Calculate total images: banner + logo + event_images
    let totalImages = 0;
    if (eventData?.event_banner) totalImages++;
    if (eventData?.event_logo) totalImages++;
    if (eventData?.event_images?.length > 0)
      totalImages += eventData.event_images.length;

    if (totalImages === 0) return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % totalImages);
  };
  const handleBack = () => {
    navigate(-1);
  };
  const handleGroupLogoClick = async (groupData) => {
    if (!groupData) {
      return;
    }
    setSelectedGroup(groupData);
    setIsGroupModalOpen(true);
    setLoadingCount(true);
    try {
      const groupId = groupData._id || groupData.id;

      // Fetch all events
      const response = await getMyEvents();

      // Parse the response
      let events = [];
      if (response?.data?.tickets) {
        events = response.data.tickets;
      } else if (response?.tickets) {
        events = response.tickets;
      } else if (response?.data?.events) {
        events = response.data.events;
      } else if (response?.events) {
        events = response.events;
      } else if (Array.isArray(response?.data)) {
        events = response.data;
      } else if (Array.isArray(response)) {
        events = response;
      }

      // Filter events for this specific group
      const groupEvents = events.filter((event) => {
        const eventGroupId =
          event.group_id ||
          event.groupId ||
          event.group?._id ||
          event.group?.id ||
          event.ticket_group_id ||
          event.ticketGroupId;

        const matches = eventGroupId === groupId;
        return matches;
      });
      setGroupEventCount(groupEvents.length);
    } catch (err) {
      setGroupEventCount(0);
    } finally {
      setLoadingCount(false);
    }
  };
  const handleCloseGroupModal = () => {
    setIsGroupModalOpen(false);
    setSelectedGroup(null);
  };
  const handleUpdateGroupFromModal = () => {
    handleCloseGroupModal();
  };
  const handlePrevImage = () => {
    // Calculate total images: banner + logo + event_images
    let totalImages = 0;
    if (eventData?.event_banner) totalImages++;
    if (eventData?.event_logo) totalImages++;
    if (eventData?.event_images?.length > 0)
      totalImages += eventData.event_images.length;

    if (totalImages === 0) return;
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? totalImages - 1 : prevIndex - 1
    );
  };
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
  eventData.sub_events[eventData.sub_events.length] = eventData;
  return (
    <div
      key={`main-container-${theme.isDark ? "dark" : "light"}`}
      className={`min-h-screen md:p-8 p-2 ${theme.text}`}
      style={{ backgroundColor: theme.mainBg }}
    >
      <ScrollBarStyle
        isDark={theme.isDark}
        key={theme.isDark ? "dark" : "light"}
      />
      <ConfirmModal
        isOpen={showConfirmDeleteModal}
        onClose={() => setShowConfirmDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to permanently delete event : ${eventData.event_name} ? This action cannot be undone.`}
        darkMode={theme.isDark}
      />
      <ConfirmModal
        isOpen={showConfirmSaveModal}
        onClose={() => setShowConfirmSaveModal(false)}
        onConfirm={handleSave}
        title="Confirm Event?"
        message={`Are you sure you want to save and confirm event : ${eventData.event_name} ? This will confirm your final selection.`}
        confirmText="Confirm Save"
        darkMode={theme.isDark}
      />

      {/* GLOBAL ALERT: Displays success/error messages */}
      <Alert
        alert={appAlert}
        onClose={() => setAppAlert(null)}
        darkMode={theme.isDark}
      />
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
        <div className="flex items-center my-auto space-x-4 flex-shrink-0 mr-4">
          <button
            onClick={handleBack}
            className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-all duration-300 transform-gpu flex-shrink-0"
            style={{
              backgroundColor: theme.isDark ? "#212426" : theme.mainBg, // Use dark theme color for the button base
              boxShadow: theme.isDark
                ? "inset 6px 6px 12px 0px #0000002E, inset -6px -6px 12px 0px #FFFFFF14"
                : theme.shadowOutset, // Apply custom inset shadow for dark theme, or default for light
              color: theme.textColor,
            }}
          >
            <ChevronLeft
              size={24}
              className={theme.isDark ? "text-gray-300" : "text-gray-800"}
            />
          </button>
          <div
            className="flex flex-col items-center cursor-pointer space-y-2 transition-transform duration-200 hover:scale-[1.02]"
            onClick={handleSaveEvent}
          >
            <div
              className="w-10 h-10 bg-[#5E5CE6] text-white rounded-full flex items-center justify-center"
              style={{
                boxShadow: theme.shadowOutset, // Outer shadow for floating effect
              }}
            >
              <Bookmark size={20} />
            </div>
          </div>
        </div>
        <div className=" md:flex hidden justify-start md:justify-center flex-grow">
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
              {eventData.event_name || "EVENT NAME"}
            </h1>
          </Card>
        </div>

        {/* 2. Action Buttons - Always on the far right, never wraps */}
        <div className="flex items-center my-auto space-x-4 flex-shrink-0 ml-4">
          <ActionCircleButton
            theme={theme}
            type="edit"
            groupId={groupId}
            ticketId={ticketId}
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
      <div className="flex  md:hidden justify-center items-center md:mb-10 mb-4 px-2 md:px-0">
        <div className=" md:hidden flex justify-center flex-grow">
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
              {eventData.event_name || "EVENT NAME"}
            </h1>
          </Card>
        </div>
      </div>

      <div className="md:relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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

            <div className="flex lg:space-x-6 space-x-3 mb-4">
              <h2
                className={`lg:text-xl text-lg  font-semibold pb-1 ${theme.textColor}`}
              >
                {eventData.event_category}
              </h2>
              <h2 className="lg:text-xl text-lg font-semibold text-gray-400">
                {eventData.event_subcategory}
              </h2>
            </div>
            <div className="md:flex space-y-4 md:space-y-0 lg:space-x-6 space-x-3  mb-4">
              <div
                style={{
                  borderRadius: "31.15px",
                  boxShadow: `6.23px 6.23px 12.46px 0px #0000002E inset, -6.23px -6.23px 12.46px 0px #FFFFFF14 inset`,
                }}
                className={`p-4 ${theme.textColor} leading-relaxed text-sm flex-grow rounded-3xl  `}
              >
                {eventData.event_description ||
                  "A detailed description of the event will appear here."}
              </div>
              <div className="flex justify-between">
                <Card
                  theme={theme}
                  className="lg:p-4 gap-x-4 flex md:flex-col justify-around items-center flex-shrink-0"
                  style={{
                    minWidth: "80px",
                    background: theme.isDark ? "#212426" : "A light mode color",
                    border: theme.isDark
                      ? "0.66px solid #33373A"
                      : "0.66px solid #E0E0E0",
                    borderRadius: "19.66px",
                    boxShadow: `5.24px 5.24px 7.86px 0px #00000029, -5.24px -5.24px 7.86px 0px #FFFFFF0A`,
                  }}
                >
                  <div className="text-center lg:py-2">
                    <img
                      src={TypeIcon}
                      alt="Event Type Icon"
                      className={`mx-auto mb-1 ${
                        theme.isDark ? "" : "filter invert"
                      }`}
                    />
                    <p className={`text-xs ${theme.textColor}`}>
                      {TypeLabel || "Event Type"}
                    </p>
                  </div>

                  <div
                    className={`md:w-full h-full w-[1px] md:h-[1px] rounded-full  my-1 ${
                      theme.isDark ? "bg-gray-700" : "bg-gray-400"
                    }`}
                  ></div>

                  <div className="text-center lg:py-2">
                    <img
                      src={LocationIcon}
                      alt="Location Icon"
                      className={`h-6 w-6 mx-auto mb-1 ${
                        theme.isDark ? "" : "filter invert"
                      }`}
                    />
                    <p className={`text-xs ${theme.textColor}`}>
                      {LocationLabel || "Location"}
                    </p>
                  </div>
                </Card>
                <div className="flex md:hidden pt-8">
                  <div
                    onClick={() => handleGroupLogoClick(groupData)}
                    className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 cursor-pointer transition-transform duration-200 active:scale-95"
                    style={{ boxShadow: theme.shadowOutset }}
                  >
                    <img
                      src={getImageUrl(groupData?.company_logo)}
                      alt="Group Logo"
                      className="w-full h-full rounded-full object-cover opacity-70 p-1"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="md:flex items-start space-x-4">
              <div className="md:w-3/4 lg:3/5 space-y-4">
                <h3 className={`text-md font-semibold pt-2 ${theme.textColor}`}>
                  Status: {eventData.event_status}
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      eventData.event_status === "live"
                        ? "bg-green-400"
                        : "bg-blue-400"
                    } ml-2`}
                  ></span>
                </h3>
                <div
                  style={{
                    borderRadius: "23.51px",
                    boxShadow: `6.13px 6.13px 12.26px 0px #0000002E inset, -6.13px -6.13px 12.26px 0px #FFFFFF14 inset`,
                  }}
                  className="p-3 rounded-xl"
                >
                  <div className="flex  justify-around">
                    <Card
                      theme={theme}
                      style={{
                        borderRadius: "30px",
                        boxShadow: `6.13px 6.13px 12.26px 0px #0000002E inset, -6.13px -6.13px 12.26px 0px #FFFFFF14 inset`,
                      }}
                      className={`p-2 lg:py-5 my-2 flex flex-col items-center justify-center w-2/5 rounded-3xl border ${
                        theme.isDark ? "border-gray-700" : "border-gray-300"
                      }`}
                    >
                      <img
                        src={Event_Days}
                        alt="Event Days Icon"
                        className={`mb-1 lg:h-5 lg:w-5  h-4 w-4${
                          theme.isDark ? "" : "filter invert"
                        }`}
                      />
                      <p
                        className={`lg:text-3xl text-lg font-bold ${theme.textColor}`}
                      >
                        {eventData.event_dates.length}
                      </p>
                      <p className={`text-sm mt-1 ${theme.textColor}`}>
                        Event Days
                      </p>
                    </Card>

                    {eventData.sub_events.length > 0 ? (
                      <Card
                        theme={theme}
                        style={{
                          borderRadius: "30px",
                          boxShadow: `6.13px 6.13px 12.26px 0px #0000002E inset, -6.13px -6.13px 12.26px 0px #FFFFFF14 inset`,
                        }}
                        className={`p-2 lg:py-6 my-2 flex flex-col border ${
                          theme.isDark ? "border-gray-700" : "border-gray-300"
                        } items-center justify-center w-2/5 rounded-3xl  relative overflow-hidden`}
                      >
                        <div className="absolute inset-y-0 left-0 flex  items-center p-1">
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
                        <p
                          className={`lg:text-3xl text-lg font-bold ${theme.textColor}`}
                        >
                          {formatCapacity(
                            eventData.sub_events[currentStatsEventIndex]
                              ?.total_capacity
                          )}
                        </p>
                        <p
                          className={`text-xs mt-0 text-center text-gray-500 truncate w-full px-2`}
                        >
                          (
                          {currentStatsEventIndex ===
                          eventData.sub_events.length
                            ? "Main event"
                            : eventData.sub_events[currentStatsEventIndex]
                                ?.event_name}
                          )
                        </p>
                        <p className={`text-sm mt-1 ${theme.textColor}`}>
                          Total Capacity
                        </p>
                      </Card>
                    ) : (
                      <Card
                        theme={theme}
                        style={{
                          borderRadius: "30px",
                          boxShadow: `6.13px 6.13px 12.26px 0px #0000002E inset, -6.13px -6.13px 12.26px 0px #FFFFFF14 inset`,
                        }}
                        className={`p-2 lg:py-6 my-2 flex flex-col border ${
                          theme.isDark ? "border-gray-700" : "border-gray-400"
                        } items-center justify-center w-2/5 rounded-3xl`}
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
                        <p
                          className={`text-xs lg:text-base mt-1 ${theme.textColor}`}
                        >
                          Total Capacity
                        </p>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
              {/* Desktop logo */}
              <div className="hidden md:flex w-1/4 lg:2/5 lg:px-8 lg:pt-10  pt-7">
                <div
                  onClick={() => handleGroupLogoClick(groupData)}
                  className="h-20 w-20 xl:h-28 xl:w-28 rounded-full overflow-hidden flex-shrink-0 cursor-pointer transition-transform duration-200 hover:scale-105"
                  style={{ boxShadow: theme.shadowOutset }}
                >
                  <img
                    src={getImageUrl(groupData?.company_logo)}
                    alt="Group Logo"
                    className="w-full h-full rounded-full object-cover opacity-70 p-1"
                  />
                </div>
              </div>
            </div>
          </Card>
          <Card
            theme={theme}
            className="p-6 flex flex-col relative overflow-hidden "
            customStyle={{ borderTopRightRadius: "50px" }}
          >
            <svg
              className="absolute -bottom-1 -left-1 w-48 h-48 pointer-events-none"
              viewBox="0 0 0 0"
              preserveAspectRatio="none"
            >
              <path d="M 0,200 L 0,0 Q 0,200 200,200 Z" fill={theme.mainBg} />
            </svg>

            <div
              style={{
                borderRadius: "30px",
                border: theme.isDark
                  ? "0.75px solid #33373A" // Dark Mode: Darker border
                  : "0.75px solid #D0D0D0",
                background: theme.isDark
                  ? "linear-gradient(0deg, #212426, #212426), linear-gradient(0deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1))"
                  : "#FFFFFF0A",
                boxShadow: theme.isDark
                  ? `6px 6px 12px 0px #0000002E inset, -6px -6px 12px 0px #FFFFFF14 inset `
                  : `6px 6px 12px 0px #FFFFFF inset,-6px -6px 12px 0px #A0A0A0 inset `,
              }}
              className="md:p-5 md:mb-2 p-5 mb-1 rounded-3xl lg:mt-6"
            >
              <div
                style={{
                  borderRadius: "22.44px",
                  border: theme.isDark
                    ? "0.75px solid #33373A" // Dark Mode: Darker border
                    : "0.75px solid #D0D0D0",
                  boxShadow: theme.isDark
                    ? `
        5.98px 5.98px 8.98px 0px #00000029, 
        -5.98px -5.98px 8.98px 0px #FFFFFF0A 
      `
                    : `
        5.98px 5.98px 8.98px 0px #A0A0A099, 
        -5.98px -5.98px 8.98px 0px #FFFFFF
      `,
                }}
                className=""
              >
                <div
                  onClick={handleLocationClick}
                  className="flex py-5 md:py-0 pr-1 justify-between items-center md:space-x-3 space-x-1 cursor-pointer"
                >
                  <div
                    className="!p-0 relative lg:w-24 lg:h-24 w-16 h-full lg:rounded-3xl overflow-hidden flex-shrink-0"
                    ref={mapRef}
                  >
                    {!eventData.exact_map_location?.latitude && (
                      <div className="w-full h-full bg-gray-700 flex md:rounded-3xl flex-col items-center justify-center text-xs text-gray-400 md:p-1">
                        <img
                          src={Map_No_Loc}
                          alt="Map Not Available"
                          className="bg-contain md:rounded-3xl"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex-grow pl-2">
                    <p
                      className={`lg::text-xl text-sm md:font-bold mb-0.5 ${theme.textColor}`}
                    >
                      {formattedDateRange.dateText}
                    </p>
                    <p className={`lg::text-md text-xs ${theme.textColor}`}>
                      {eventData.location}
                    </p>
                    <p className="lg::text-sm text-xs text-gray-400">
                      {eventData.venue}
                    </p>
                  </div>

                  <div className="md:w-[1px] h-10 bg-gray-700 md:mx-2 flex-shrink-0 hidden md:block"></div>

                  <div className="text-right flex-shrink-0 pr-2 lg:pr-3 w-1/4 lg:w-1/3">
                    <p className="text-xs text-gray-500 mb-1">Gate opens at</p>
                    <p
                      className={`lg:text-xl text-xs lg:font-bold ${theme.textColor}`}
                    >
                      {formattedDateRange.timeText}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {eventData.sub_events.length > 0 ? (
              <div className="w-full">
                <h3 className={`text-lg font-semibold mb-1 ${theme.textColor}`}>
                  Multiple event
                </h3>

                <div className="w-full">
                  <div className="relative">
                    <div className="overflow-x-hidden overflow-y-hidden w-full">
                      <div
                        className="flex space-x-2 transition-transform duration-300 items-center py-3"
                        style={{
                          transform: `translateX(calc(50% - 52px - ${
                            activeCarouselIndex * 104
                          }px))`,
                        }}
                      >
                        {carouselEvents.map((event, index) => {
                          const isActive = index === activeCarouselIndex;

                          const subEventCardStyle = (isActive, isDark) => {
                            // ... (your existing subEventCardStyle function remains here)
                            const baseStyle = {
                              borderRadius: "25.33px",
                              transition:
                                "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                            };

                            const darkShadowSoft = "#00000015";
                            const lightShadowSoft = "#FFFFFF06";
                            const lightModeDarkShadowSoft = "#A0A0A040";

                            const shadowDimensions =
                              "6.75px 6.75px 10.13px 0px";

                            if (isActive) {
                              return {
                                ...baseStyle,
                                scale: 1.1,
                                opacity: 1,
                                background: "#5E5CE6",
                                border: "0.84px solid #C1C1C1",
                                boxShadow: `${shadowDimensions} #3131A1D0, -${shadowDimensions} #9C9BF6C0`,
                              };
                            } else {
                              return {
                                ...baseStyle,
                                scale: 0.9,
                                opacity: 0.6,
                                background: isDark ? "#212426" : "#E0E0E0",
                                border: isDark
                                  ? "0.84px solid #33373A"
                                  : "0.84px solid #D0D0D0",
                                boxShadow: isDark
                                  ? `${shadowDimensions} ${darkShadowSoft},-${shadowDimensions} ${lightShadowSoft}`
                                  : `${shadowDimensions} ${lightModeDarkShadowSoft},-${shadowDimensions} #FFFFFF `,
                              };
                            }
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
                                  // This is the core logic for changing the centered item
                                  setActiveCarouselIndex(index);
                                }
                              }}
                              className={`flex-shrink-0 lg:w-24 lg:h-36 w-20 h-28  p-2 rounded-xl transition-all duration-300 transform-gpu cursor-pointer`}
                              style={subEventCardStyle(isActive, theme.isDark)}
                            >
                              {/* Inner content remains the same */}
                              <div className="flex flex-col items-center justify-between h-full">
                                <div
                                  className="lg:w-10 lg:h-10 h-8 w-8 mt-4 rounded-full overflow-hidden flex items-center justify-center"
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
                                  className={`lg:text-sm text-xs font-bold ${
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

                    {/* Progress Bar (remains the same) */}
                    <div className="w-1/2 mx-auto h-1 bg-gray-700/50 rounded-full mt-4">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${
                            (activeCarouselIndex /
                              (carouselEvents.length - 1)) *
                            100
                          }%`,
                          backgroundColor: "#5E5CE6",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2 mb-2 w-full">
                <h3 className={`text-lg font-semibold  ${theme.textColor}`}>
                  Single event
                </h3>
                <div
                  style={{
                    borderRadius: "23px",
                    background: theme.isDark ? "#212426" : "#E0E0E0",

                    boxShadow: theme.isDark
                      ? `6px 6px 12px 0px #00000022 inset, -6px -6px 12px 0px #FFFFFF10 inset `
                      : `6px 6px 12px 0px #FFFFFF inset, -6px -6px 12px 0px #A0A0A040 inset `,
                  }}
                  className={`p-4 ${theme.textColor}  leading-relaxed h-32  my-4 text-sm  rounded-3xl`}
                >
                  No extra event is added
                </div>
              </div>
            )}
            <div className="flex items-end h-full pl-3 md:w-4/5 mx-auto md:mx-0 md:ml-auto">
              <div
                style={{
                  borderRadius: "22.44px",
                  border: theme.isDark
                    ? "0.75px solid #33373A"
                    : "0.75px solid #D0D0D0",
                  background: theme.isDark ? "#212426" : "#FFFFFF08",
                  boxShadow: theme.isDark
                    ? `4px 4px 6px 0px #0000001A, -4px -4px 6px 0px #FFFFFF08`
                    : `4px 4px 6px 0px #90909066, -4px -4px 6px 0px #FFFFFF08`,
                }}
                className="w-full p-2 cursor-pointer rounded-3xl mt-4"
                onClick={handleShowHashtagModal}
              >
                <div className="flex items-center h-12">
                  <div className="flex items-center ">
                    <h3
                      className={`text-xs lg:text-base lg:px-2 font-semibold whitespace-nowrap ${theme.textColor}`}
                    >
                      Event<br className="lg:block hidden"></br> hashtag
                    </h3>
                  </div>

                  {/* Theme-sensitive Divider */}
                  <div
                    className={`border-l-2 border-dotted ${
                      theme.isDark ? "border-gray-700" : "border-gray-400"
                    } h-full mx-1 `}
                  ></div>

                  <div className="flex px-1 ">
                    {hashtags.length > 0 ? (
                      <div className="flex overflow-y-auto custom-scrollbar  flex-wrap gap-1.5 max-h-12">
                        {hashtags
                          .slice(0, hashtags.length)
                          .map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs font-medium px-2.5 py-1 rounded-md text-white"
                              style={{ backgroundColor: "#5E5CE6" }}
                            >
                              #{tag}
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
              </div>
            </div>
          </Card>

          <Card
            theme={theme}
            className="p-4 md:p-2 flex items-center justify-start  space-x-1 xl:space-x-6  relative"
            customStyle={{ overflow: "visible", zIndex: 30 }}
          >
            <svg
              className="absolute -top-1 -right-1 w-48 h-24 pointer-events-none"
              viewBox="0 0 0 0"
              preserveAspectRatio="none"
            >
              <path d="M 200,0 L 200,100 Q 200,0 0,0 Z" fill={theme.mainBg} />
            </svg>
            <div className="w-full flex md:gap-x-6 lg:gap-x-2 justify-between md:justify-start items-center px-6 md:px-0">
              <div className="lg:flex lg:gap-x-2 space-y-4  lg:space-y-0  ">
                <FeatureButton
                  Icon={Seat}
                  label="Seat"
                  theme={theme}
                  onClick={() => {
                    if (seatingEvents.length > 0) {
                      setCurrentSeatingIndex(0); // Start at the first seating layout
                      setShowSeatingModal(true);
                    } else {
                      setAppAlert({
                        message: "No seating layout",
                        description:
                          "Information is available for this event or its sub-events.",
                        type: "error",
                        show: true,
                      });
                    }
                  }}
                />
                <FeatureButton
                  Icon={Rules}
                  label="Rules"
                  theme={theme}
                  onClick={() => setShowRulesModal(true)}
                />
              </div>

              <div className="lg:flex lg:gap-x-2 space-y-4  lg:space-y-0">
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
            <div className="md:hidden ">
              <Card
                theme={theme}
                className="group relative p-2 text-center w-16 h-24  rounded-3xl  flex-shrink-0 z-20 flex flex-col justify-center items-center  cursor-pointer"
              >
                <div
                  className="h-6 w-6 rounded-full mx-auto mb-1  flex items-center justify-center"
                  style={{ backgroundColor: "#E53E3E" }}
                >
                  <img src={Prohibit} alt="Prohibit" className="h-3 w-3" />
                </div>
                <p className={`text-xs ${theme.textColor}`}>Prohibit</p>

                <ProhibitPopover
                  theme={theme}
                  prohibitedItems={eventData.prohibited_items}
                />
              </Card>
            </div>
          </Card>
          <div className="md:absolute mx-auto md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 md:z-30 md:pointer-events-none my-6 md:my-0">
            <div
              className="w-64 h-64 md:w-[300px] md:h-[300px] lg:w-72 lg:h-72 xl:w-80 xl:h-80 rounded-full relative mx-auto"
              style={{
                boxShadow: theme.shadowInset,
                backgroundColor: theme.insetBg,
              }}
            >
              <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 xl:w-64 xl:h-64 lg:h-60 lg:w-60 md:w-64 md:h-64  rounded-full overflow-hidden"
                style={{ boxShadow: theme.shadowOutset }}
              >
                <img
                  src={getImageUrl(eventData.event_banner, "ticket")}
                  alt={eventData.event_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 md:w-20 md:h-20 w-16 h-16 rounded-full flex items-center justify-center pointer-events-auto cursor-pointer"
                style={{
                  backgroundColor: "#5E5CE6",
                  boxShadow: theme.shadowOutset,
                }}
                onClick={handlePlayClick}
              >
                <Play size={26} className="text-white ml-1" fill="white" />
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
              <div
                style={{
                  borderRadius: "16px",
                  background: theme.isDark ? "#212426" : "#FFFFFF08",
                  border: theme.isDark
                    ? "1.02px solid #33373A"
                    : "1.02px solid #D0D0D0",
                  boxShadow: theme.isDark
                    ? `8.18px 8.18px 12.26px 0px #00000029,-8.18px -8.18px 12.26px 0px #FFFFFF0A`
                    : `8.18px 8.18px 12.26px 0px #A0A0A099, -8.18px -8.18px 12.26px 0px #FFFFFF `,
                }}
                className="mb-2 p-2 rounded-lg w-full md:w-3/4 mx-auto"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <img
                      src={LeftIcon}
                      alt="Previous Event"
                      className={`cursor-pointer ${
                        theme.isDark ? "" : "filter invert"
                      } ${
                        allEventsForBankView.length <= 1 ? "opacity-50" : ""
                      }`}
                      onClick={handlePrevEventForBankView}
                    />
                  </div>

                  {/* Center Heading */}
                  <h3
                    className={`flex justify-center items-center text-lg mx-auto font-semibold ${theme.textColor}`}
                  >
                    <span className="flex gap-2 text-base ">
                      <img
                        src={Bank_Details}
                        alt="Bank Icon"
                        className={`h-4 w-4 my-auto ${
                          theme.isDark ? "" : "filter invert" // Theme-sensitive icon
                        }`}
                      />{" "}
                      Bank Details
                    </span>
                  </h3>

                  {/* Right Arrow Container */}
                  <div>
                    <img
                      src={RightIcon}
                      alt="Next Event"
                      className={`cursor-pointer ${
                        theme.isDark ? "" : "filter invert" // Theme-sensitive icon
                      } ${
                        allEventsForBankView.length <= 1 ? "opacity-50" : ""
                      }`}
                      onClick={handleNextEventForBankView}
                    />
                  </div>
                </div>
              </div>
              {(() => {
                let accountLabel;
                let labelColorClass;

                if (currentEventForBankView.isPrimary) {
                  accountLabel = "Main Event";
                  labelColorClass = "text-gray-500";
                } else {
                  accountLabel =
                    currentEventForBankView.name || "Sub-Event Account";
                  labelColorClass = "text-blue-500";
                }

                const isMultiAccount = currentBankDetailsList.length > 1;

                return (
                  <p
                    className={`text-xs ${labelColorClass} font-medium text-center mb-1`}
                  >
                    ({accountLabel})
                    {isMultiAccount && (
                      <span className="text-gray-400">
                        {" "}
                        - Account {currentBankDetailsIndex + 1} of{" "}
                        {currentBankDetailsList.length}
                      </span>
                    )}
                  </p>
                );
              })()}

              {currentEventForBankView.isPaid &&
              currentBankDetailsList.length > 0 ? (
                <div className="flex flex-col h-full lg:w-4/5 mx-auto">
                  <dl className="text-sm space-y-2 px-2 lg:w-3/4 mx-auto flex-grow">
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
                      <dd className={`font-medium ${theme.textColor}`}>
                        {currentBankInfo.bank_ifsc || "N/A"}
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-grow text-center py-1">
                  <h2 className="text-xl font-bold text-green-500 mb-2">
                    Free event
                  </h2>
                  <p className={`text-sm ${theme.textColor}`}>
                    {currentEventForBankView.isPrimary
                      ? "No payment required for the Main Event."
                      : "No payment required for this event."}
                  </p>
                </div>
              )}
              {currentBankDetailsList.length > 1 && (
                <div className="flex justify-center space-x-2 pb-2">
                  {currentBankDetailsList.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentBankDetailsIndex
                          ? "bg-white"
                          : "bg-gray-700"
                      }`}
                    ></div>
                  ))}
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
                <div
                  style={{
                    borderRadius: "23px",
                    background: theme.isDark ? "#212426" : "#FFFFFF08",
                    border: theme.isDark
                      ? "0.75px solid #33373A"
                      : "0.75px solid #D0D0D0",

                    boxShadow: theme.isDark
                      ? `6px 6px 12px 0px #0000002E inset, -6px -6px 12px 0px #FFFFFF14 inset `
                      : `6px 6px 12px 0px #FFFFFF inset, -6px -6px 12px 0px #A0A0A099 inset `,
                  }}
                  className="md:w-3/4 w-full p-3 mx-auto  rounded-lg"
                >
                  <div className="flex ">
                    <div className="flex my-auto">
                      <img
                        src={LeftIcon}
                        alt=""
                        className={`cursor-pointer text-gray-400 ${
                          theme.isDark ? "" : "filter invert"
                        } 
                        ${currentTicketIndex === 0 ? "opacity-50" : ""}`}
                        onClick={handlePrevTicket}
                      />
                    </div>

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
                    <div className="flex my-auto">
                      <img
                        src={RightIcon}
                        alt=""
                        className={`cursor-pointer text-gray-400 ${
                          theme.isDark ? "" : "filter invert"
                        } 
                        ${
                          currentTicketIndex >=
                          eventStats.ticketTypes.length - visibleTickets
                            ? "opacity-50"
                            : ""
                        }`}
                        onClick={handleNextTicket}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    borderRadius: "23px",
                    background: theme.isDark ? "#212426" : "#FFFFFF08",
                    border: theme.isDark
                      ? "0.75px solid #33373A"
                      : "0.75px solid #D0D0D0",

                    boxShadow: theme.isDark
                      ? `6px 6px 12px 0px #0000002E inset, -6px -6px 12px 0px #FFFFFF14 inset `
                      : `6px 6px 12px 0px #FFFFFF inset, -6px -6px 12px 0px #A0A0A099 inset `,
                  }}
                  className="flex flex-col items-center justify-center h-24 w-full md:w-3/4  text-gray-400"
                >
                  <img
                    src={Ticket}
                    alt="Ticket Unavailable"
                    // Icon logic: invert and reduce opacity in light mode
                    className={`h-6 w-6 ${
                      theme.isDark ? "" : "filter invert opacity-50"
                    }`}
                  />
                  <p className="text-lg">No Ticket is available</p>
                </div>
              )}

              <div
                style={{
                  borderRadius: "30.66px",
                  background: theme.isDark ? "#212426" : "#FFFFFF08",
                  border: theme.isDark
                    ? "1.02px solid #33373A"
                    : "1.02px solid #D0D0D0",

                  boxShadow: theme.isDark
                    ? `8.18px 8.18px 12.26px 0px #00000029, -8.18px -8.18px 12.26px 0px #FFFFFF0A `
                    : `8.18px 8.18px 12.26px 0px #A0A0A099,-8.18px -8.18px 12.26px 0px #FFFFFF `,
                }}
                className="group relative p-2 text-center w-24 hidden flex-shrink-0 z-20 md:flex flex-col justify-center items-center h-24 cursor-pointer"
              >
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-1 flex items-center justify-center"
                  style={{ backgroundColor: "#E53E3E" }}
                >
                  <img src={Prohibit} alt="Prohibit Icon" className="w-5 h-5" />
                </div>
                <p className={`text-xs ${theme.textColor}`}>Prohibit</p>

                <ProhibitPopover
                  theme={theme}
                  prohibitedItems={eventData.prohibited_items}
                />
              </div>
            </div>

            <InsetCard
              theme={theme}
              style={{
                borderRadius: "23px",
                background: theme.isDark ? "#212426" : "#E0E0E0",

                boxShadow: theme.isDark
                  ? `6px 7px 10px 0px #00000045 inset, /* Dark bottom shadow */-2px 0px 8px 0px #FFFFFF0D inset  /* Light top/side highlight */`
                  : `6px 7px 10px 0px #FFFFFF inset, /* Light Mode: White highlight */-2px 0px 8px 0px #A0A0A045 inset /* Light Mode: Dark shadow */`,
              }}
              className="p-4"
            >
              <div className="flex items-center space-x-4">
                <div
                  style={{
                    borderRadius: "16px",
                    background: theme.isDark ? "#212426" : "#FFFFFf",
                    border: theme.isDark
                      ? "1.02px solid #33373A"
                      : "1.02px solid #D0D0D0",

                    boxShadow: theme.isDark
                      ? `8.18px 8.18px 12.26px 0px #00000029, -8.18px -8.18px 12.26px 0px #FFFFFF0A `
                      : `8.18px 8.18px 12.26px 0px #A0A0A099, -8.18px -8.18px 12.26px 0px #FFFFFF `,
                  }}
                  className="flex flex-col items-center justify-center p-3 rounded-lg w-28 cursor-pointer h-24"
                >
                  <Phone size={20} className="text-green-500 mb-1" />

                  <p className={`text-sm text-center ${theme.textColor}`}>
                    Point of call
                  </p>
                </div>
                <div className="flex-grow flex items-center justify-center space-x-3 overflow-x-auto p-2">
                  {(eventData.POCS || []).map((person, index) => (
                    <div
                      key={index}
                      className="text-center w-16"
                      onClick={() => handlePOCPersonClick(person)}
                    >
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

                <div>
                  <img
                    src={LeftIcon}
                    alt=""
                    className={`cursor-pointer text-gray-400 ${
                      theme.isDark ? "" : "filter invert"
                    } 
                        ${currentGuideIndex === 0 ? "opacity-50" : ""}`}
                    onClick={handlePrevGuide}
                  />
                </div>
                {/* Guide Carousel Container */}
                <div className="flex-grow overflow-x-hidden relative ">
                  <div className="flex justify-center items-center h-full">
                    <div
                      className="flex items-center transition-transform duration-300"
                      style={{
                        transform: `translateX(calc(-${
                          currentGuideIndex * (viewportWidth >= 768 ? 11 : 9)
                        }rem))`,
                      }}
                    >
                      {eventData.guests
                        .slice(
                          currentGuideIndex,
                          currentGuideIndex + guidesToShow
                        )
                        .map((guest, index) => (
                          <div
                            key={guest.guest_name}
                            onClick={() => handleGuestClick(guest)}
                            style={{
                              borderRadius: "17.82px",
                              background: theme.isDark ? "#212426" : "#E0E0E0",
                              boxShadow: theme.isDark
                                ? `3.71px 4.45px 6.68px 0px #00000075,-1.48px -1.48px 7.42px 0px #63636336 `
                                : `3.71px 4.45px 6.68px 0px #A0A0A099, -1.48px -1.48px 7.42px 0px #FFFFFF `,
                            }}
                            // Retaining complex responsiveness and flow logic
                            className={`p-2 text-center rounded-lg cursor-pointer flex-shrink-0 
                                w-[8rem] lg:w-[10rem] mr-4`}
                          >
                            <div
                              className="relative w-28  lg:w-32 rounded-lg mx-auto mb-2 overflow-hidden"
                              style={{ paddingTop: "100%" }}
                            >
                              <img
                                src={getImageUrl(guest.guest_profile, "ticket")}
                                alt={guest.guest_name}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            </div>
                            <p
                              className={`text-sm ${theme.textColor} truncate px-1`}
                            >
                              {guest.guest_name}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Next Button */}

                <div>
                  <img
                    src={RightIcon}
                    alt=""
                    className={`cursor-pointer text-gray-400 ${
                      theme.isDark ? "" : "filter invert"
                    } 
                        ${
                          currentGuideIndex >=
                          eventData.guests.length - guidesToShow
                            ? "opacity-50"
                            : ""
                        }`}
                    onClick={handleNextGuide}
                  />
                </div>
              </div>
            ) : (
              <div className="flex  items-center justify-center h-full  ">
                <img
                  src={NoGuide}
                  alt="No Guide Placeholder"
                  className="h-36 w-36 lg:h-64 lg:w-64 "
                />
                <p className="text-xl text-gray-500 font-medium flex items-center space-x-2">
                  <img
                    src={GuideVector}
                    alt="Guide Icon"
                    className="lg:w-6 lg:h-6 h-4 w-4 opacity-70"
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
      {showImageModal && (
        <ImageModal
          images={(() => {
            const allImages = [];

            // Add banner
            if (eventData?.event_banner) {
              const bannerUrl = getImageUrl(eventData.event_banner, "ticket");
              allImages.push({
                path: bannerUrl,
                type: "banner",
                name: "Event Banner",
              });
            }

            // Add logo
            if (eventData?.event_logo) {
              const logoUrl = getImageUrl(eventData.event_logo, "ticket");
              allImages.push({
                path: logoUrl,
                type: "logo",
                name: "Event Logo",
              });
            }

            // Add event_images
            if (eventData?.event_images?.length > 0) {
              eventData.event_images.forEach((img, index) => {
                const imgPath = img.path || img;
                const imgUrl =
                  imgPath.startsWith("http://") ||
                  imgPath.startsWith("https://")
                    ? imgPath
                    : getImageUrl(imgPath, "ticket");
                allImages.push({
                  path: imgUrl,
                  type: "event_image",
                  name: img.originalName || `Event Image ${index + 1}`,
                });
              });
            }

            return allImages;
          })()}
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
          formatImagePath={(path) => getImageUrl(path, "ticket")}
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
          formatImagePath={(path) => getImageUrl(path, "ticket")}
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
          formatImagePath={(path) => getImageUrl(path, "ticket")}
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
          formatImagePath={(path) => getImageUrl(path, "ticket")}
          setAppAlert={setAppAlert}
        />
      )}
      {showRulesModal && (
        <RulesModal
          eventRules={eventData?.event_rules}
          theme={theme}
          onClose={() => setShowRulesModal(false)}
          formatImagePath={(path) => getImageUrl(path, "ticket")}
        />
      )}
      {isGroupModalOpen && selectedGroup && (
        <GroupViewModal
          isOpen={isGroupModalOpen}
          onClose={handleCloseGroupModal}
          isDark={theme.isDark}
          group={selectedGroup}
          theme={theme}
          onUpdate={handleUpdateGroupFromModal}
          totalEvents={groupEventCount}
          loadingCount={loadingCount}
        />
      )}
      {showHashtagModal && (
        <HashtagModal
          isOpen={showHashtagModal}
          hashtags={hashtags}
          theme={theme}
          onClose={() => setShowHashtagModal(false)}
        />
      )}
      {showPOCModal && selectedPOC && (
        <POCDetailModal
          isOpen={showPOCModal}
          person={selectedPOC}
          theme={theme}
          onClose={handleClosePOCModal} // Use the specific close handler
        />
      )}
    </div>
  );
};
export default ViewSingleEvent;
