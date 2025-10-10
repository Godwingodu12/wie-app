import React, { useState, useEffect,useContext,useMemo , useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import Select from "react-select";
import {
  createTicketBasicInfo,
  getGroups,
  getTicketById,
} from "../../services/ticketService";
// CORRECT for Vite
import Event_Form_Icon from "../../assets/Event/Event_Form_Icon.svg?react";
import Date_Form_Icon from "../../assets/Event/Date_Form_Icon.svg?react";
import Guest_Form_Icon from "../../assets/Event/Guest_Form_Icon.svg?react";
import Prohibited_Form_Icon from "../../assets/Event/Prohibited_Form_Icon.svg?react";
// Import shared components
import EventSidebar from "../../components/CreateGroup/EventSidebar";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import DatePickerModal from "../../components/CreateGroup/DatePickerModal.jsx";
import GuestModal from "../../components/CreateGroup/GuestModal.jsx";
import ProhibitedItemsModal from "../../components/CreateGroup/ProhibitedItemsModal.jsx";
import Alert from "../../components/CreateGroup/Alert";
import FormInput from "../../components/CreateGroup/FormInput";
import OnlineDatePickerModal from "../../components/CreateGroup/OnlineDatePickerModal.jsx";
import RecordedDatePickerModal from "../../components/CreateGroup/RecordedDatePickerModal.jsx";

import ToggleSwitch from "../../components/CreateGroup/ToggleSwitch.jsx";
import InfoTooltip from "../../components/CreateGroup/InfoTooltip.jsx";
import TagInput from "../../components/CreateGroup/TagInput.jsx";
import CustomScrollbarStyles from "../../components/CreateGroup/CustomScrollbarStyles.jsx";
import CustomSelectStyles from "../../components/CreateGroup/CustomSelectStyles.jsx";
const eventCategories = {
  "Arts, Culture, & Literature": [
    "Art Exhibitions",
    "Cultural Festivals",
    "Theater Performances",
    "Literature Festivals",
    "Historical Reenactments",
    "Art Installations",
    "Art Workshops & Competitions",
    "Guided Art Walks",
    "Printmaking & Conceptual Art",
    "Residency Showcases",
    "Art Auctions",
  ],
  Music: [
    "Concerts",
    "Music Festivals",
    "Live Performances",
    "Battle of the Bands",
    "DJ Nights",
  ],
  "Entertainment & Performing Arts": [
    "Comedy Shows",
    "Magic Shows",
    "Circus Performances",
  ],
  Dance: [
    "Recitals & Showcases",
    "Competitions & Galas",
    "Social Dance Nights",
    "Dance Workshops",
    "Themed Dances",
    "Classical Dance",
    "Contemporary Dance",
    "Street & Urban Dance",
    "Bollywood & Tollywood Dance",
    "Folk & Traditional Dance",
    "K-pop Dance",
  ],
  "Sports, Fitness, & Adventure": [
    "Sporting Competitions",
    "Marathons & Races",
    "Fitness Workshops",
    "Adventure Sports",
    "Camping & Hiking",
    "Turf Booking",
    "Esports",
  ],
  "Education & Learning": [
    "Workshops & Seminars",
    "Conferences & Summits",
    "Academic Competitions & MUNs",
    "Career Fairs & Counseling",
    "Public Lectures",
    "Bootcamps",
    "Certification Programs",
    "College Fests",
    "Webinars",
    "Startup Competitions",
    "Quiz Sessions",
  ],
  "Business & Innovation": [
    "Tech Expos",
    "Hackathons",
    "Product Launches",
    "Robotics Competitions",
    "Trade Shows",
    "Networking Events",
  ],
  "Food, Lifestyle, & Wellness": [
    "Food Festivals",
    "Wine Tastings",
    "Cooking Classes",
    "Yoga & Spiritual Retreats",
    "Mindfulness Workshops",
    "Fashion Shows",
  ],
  "Film, Media, & Gaming": [
    "Film Festivals & Screenings",
    "Animation Showcases",
    "Board Game Nights",
    "Cosplay Conventions",
  ],
  "Travel, Holidays, & Tourism": [
    "Travel Expos",
    "Destination Showcases",
    "Cruise Events",
    "Holiday Events (e.g., Halloween, Christmas)",
  ],
  "Festivals & Celebrations": [
    "National & Regional Festivals",
    "Harvest Festivals",
    "Lantern Festivals",
    "Cultural Parades",
    "Religious Festivals",
  ],
  "Environment, Sustainability, & Agriculture": [
    "Eco-Festivals",
    "Sustainable Living Workshops",
    "Tree-Planting & Clean Energy Campaigns",
    "Agricultural Fairs & Farmers' Markets",
    "Green Hackathons",
    "Cyclothons",
    "Eco-Tourism Trails",
    "Green Tech Conferences",
  ],
  "Religious & Spiritual Events": [
    "Pilgrimages",
    "Spiritual Retreats",
    "Meditation Camps",
  ],
};

const languageOptions = [
  "English",
  "Hindi",
  "Malayalam",
  "Tamil",
  "Kannada",
  "Telugu",
  "Marathi",
  "Gujarati",
  "Punjabi",
  "Urdu",
  "Bengali",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Japanese",
  "Russian",
  "Turkish",
  "Korean",
  "Portuguese",
  "Arabic",
  "Indonesian",
  "Vietnamese",
  "Other",
].map((lang) => ({ value: lang, label: lang }));
// Add these constants near your other dropdown data arrays


const seatingOptions = [
  { value: "seated", label: "Seated" },
  { value: "standing", label: "Standing" },
  { value: "seated and standing", label: "Seated and Standing" },
  { value: "other", label: "Other" },
];

const CreateTicket = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { groupId, ticketId: urlTicketId} = useParams();
  const queryTicketId = new URLSearchParams(location.search).get("ticketId");
  const [loading, setLoading] = useState(false);
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [darkMode, setDarkMode] = useState(true);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isOfflineDateModalOpen, setIsOfflineDateModalOpen] = useState(false);
const [isOnlineDateModalOpen, setIsOnlineDateModalOpen] = useState(false);
const [isRecordedDateModalOpen, setIsRecordedDateModalOpen] = useState(false);


  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isProhibitedModalOpen, setIsProhibitedModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [map, setMap] = useState(null);
  const storageKey = `ticketFormData_${groupId || "new"}`;
  const rulesEditorRef = useRef(null);
  const descriptionEditorRef = useRef(null);
  const [alert, setAlert] = useState(null); // State to manage the alert
  const [errors, setErrors] = useState({}); // State to track field errors for highlighting
  
  // --- NEW: Data structure for event categories and subcategories ---

  // Set initial map location (Thrissur, Kerala, India)
  const INITIAL_MAP_LOCATION = {
    lat: 10.5276,
    lng: 76.2144,
    address: "Thrissur, Kerala, India",
  };

  const [formData, setFormData] = useState({
    _id: null,
    event_name: "",
    event_category: "",
    event_subcategory: "",
    event_type: "public",
    location_type: "offline",
    
    location: "",
    venue: "",
    event_language: [],
    min_age_allowed: "",
    seating_arrangement: "",
    kids_friendly: false,
    pet_friendly: false,
    event_instagram_link: "",
    event_youtube_link: "",
    hashtag: [],
    event_dates: [],
    event_date_type: "one-day",
    gatesOpenEarly: false,
    gate_open_time: "",
    gate_open_hour: "", // Initialize as empty
    gate_open_minute: "", // Initialize as empty
    gate_open_ampm: "", // Initialize as empty
    guests: [],
    event_rules: { type: "text", content: "" },
    event_rules_file: null,
    prohibited_items: [],
    POCS: [],
    event_description: "",
    exact_map_location: {
      latitude: INITIAL_MAP_LOCATION.lat.toString(),
      longitude: INITIAL_MAP_LOCATION.lng.toString(),
      address: INITIAL_MAP_LOCATION.address,
    },
    groupId: groupId || "",
  });
    const showAlert = (alertData) => {
    setAlert({ ...alertData, show: true });
  };

  const hideAlert = () => {
    setAlert(prev => prev ? { ...prev, show: false } : null);
  };

  const [poc, setPoc] = useState({
    POC_name: "",
    POC_email: "",
    POC_contact: "",
  });
  const categoryOptions = Object.keys(eventCategories).map((category) => ({
    value: category,
    label: category,
  }));
  const subCategoryOptions = formData.event_category
    ? eventCategories[formData.event_category].map((sub) => ({
        value: sub,
        label: sub,
      }))
    : [];

  const saveFormDataToStorage = (data) => {
    try {
      const { ...dataToSave } = data; // File objects can't be stored
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Error saving data to localStorage:", error);
    }
  };

  const loadFormDataFromStorage = () => {
    try {
      const savedData = localStorage.getItem(storageKey);
      return savedData ? JSON.parse(savedData) : null;
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      localStorage.removeItem(storageKey); // Clear corrupted data
      return null;
    }
  };

  const clearFormDataFromStorage = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Error clearing data from localStorage:", error);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
  };

  const formatTimeForInput = (timeString) => {
    if (!timeString) return "";
    if (/^\d{2}:\d{2}$/.test(timeString)) return timeString;
    return new Date(timeString).toTimeString().slice(0, 5);
  };

  const loadExistingTicketData = async (ticketIdParam) => {
    try {
      if (!ticketIdParam) return null;
      const ticketResponse = await getTicketById(ticketIdParam);
      let ticketData =
        ticketResponse?.data ||
        ticketResponse?.ticket ||
        ticketResponse?.result ||
        ticketResponse;

      if (!ticketData) {
        const savedFormData = loadFormDataFromStorage();
        if (savedFormData) setFormData(savedFormData);
        return savedFormData || null;
      }

      // Helper function to format date for input (ISO to YYYY-MM-DD)
      const formatDateForInput = (isoDate) => {
        if (!isoDate) return "";
        const date = new Date(isoDate);
        return date.toISOString().split("T")[0]; // This gives YYYY-MM-DD format
      };

      // Helper function to format time for input
      const formatTimeForInput = (timeString) => {
        if (!timeString) return "";
        return timeString;
      };

      // When loading existing ticket data
      const event_dates = ticketData.event_dates
        ? ticketData.event_dates.map((d) => ({
            date: formatDateForInput(d.start_date), // This will be in YYYY-MM-DD format
            endDate: formatDateForInput(d.end_date), // Add end_date support
            startTime: formatTimeForInput(d.start_time),
            endTime: formatTimeForInput(d.end_time),
          }))
        : [];

      let eventLanguage = "";
      if (Array.isArray(ticketData.event_language)) {
        eventLanguage = ticketData.event_language[0] || "";
      } else {
        eventLanguage = ticketData.event_language || "";
      }

      const loadedData = {
        event_name: ticketData.event_name || "",
        event_category: ticketData.event_category || "",
        event_subcategory: ticketData.event_subcategory || "",
        event_type: ticketData.event_type || "public",
        location_type: ticketData.location_type || "offline",
        
        location: ticketData.location || "",
        venue: ticketData.venue || "",
        event_language: eventLanguage,
        min_age_allowed: ticketData.min_age_allowed?.toString() || "",
        seating_arrangement: ticketData.seating_arrangement || "",
        kids_friendly: ticketData.kids_friendly || false,
        pet_friendly: ticketData.pet_friendly || false,
        event_instagram_link: ticketData.event_instagram_link || "",
        event_youtube_link: ticketData.event_youtube_link || "",
        hashtag: ticketData.hashtag || [],
        event_dates: event_dates,
        event_date_type:
          ticketData.event_date_type === "one-day"
            ? "one-day"
            : ticketData.event_date_type === "weekly"
            ? "weekly"
            : "multi-day",
        gate_open_time: formatTimeForInput(ticketData.gate_open_time) || "",
        gatesOpenEarly: !!ticketData.gate_open_time,
        // Parse gate opening time into separate fields
        gate_open_hour: ticketData.gate_open_time
          ? (() => {
              const time = new Date(`1970-01-01T${ticketData.gate_open_time}`);
              let hour = time.getHours();
              return hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            })()
          : "",
        gate_open_minute: ticketData.gate_open_time
          ? (() => {
              const time = new Date(`1970-01-01T${ticketData.gate_open_time}`);
              return time.getMinutes().toString().padStart(2, "0");
            })()
          : "",
        gate_open_ampm: ticketData.gate_open_time
          ? (() => {
              const time = new Date(`1970-01-01T${ticketData.gate_open_time}`);
              return time.getHours() >= 12 ? "PM" : "AM";
            })()
          : "",
        guests: ticketData.guests || [],
        event_rules: ticketData.event_rules || { type: "text", content: "" },
        prohibited_items: ticketData.prohibited_items || [],
        POCS: ticketData.POCS || [],
        event_description: ticketData.event_description || "",
        exact_map_location: {
          latitude:
            ticketData.exact_map_location?.latitude?.toString() ||
            INITIAL_MAP_LOCATION.lat.toString(),
          longitude:
            ticketData.exact_map_location?.longitude?.toString() ||
            INITIAL_MAP_LOCATION.lng.toString(),
          address:
            ticketData.exact_map_location?.address ||
            INITIAL_MAP_LOCATION.address,
        },
        groupId: ticketData.groupId || groupId || "",
        form_progress: ticketData.form_progress || {},
      };

      setFormData(loadedData);
      saveFormDataToStorage(loadedData);
      setIsEditMode(true);
      return ticketData;
    } catch (error) {
      console.error("Error loading existing ticket:", error);
      const savedFormData = loadFormDataFromStorage();
      if (savedFormData) setFormData(savedFormData);
      return savedFormData || null;
    }
  };
  const [dataLoaded, setDataLoaded] = useState(false);
  useEffect(() => {
    if (formData.event_name || formData.location) {
      saveFormDataToStorage(formData);
    }
  }, [formData]);

  useEffect(() => {
    const initializeComponent = async () => {
      setPageLoading(true);
      if (!groupId) {
        navigate("/home");
        return;
      }

      try {
        const groupsResponse = await getGroups();
        const groupsArray = Array.isArray(groupsResponse)
          ? groupsResponse
          : groupsResponse.data || [];
        const groupData = groupsArray.find((g) => g._id === groupId);
        if (!groupData) {
          showAlert({
                type: 'error',
                message: 'Group Not Found',
                description: "The selected group could not be found or you don't have access to it."
            });
          navigate("/select-group");
          return;
        }
        setSelectedGroup(groupData);

        if (urlTicketId) {
          setIsEditMode(true);
          await loadExistingTicketData(urlTicketId);
        } else {
          if (location.state?.formData) {
            setFormData(location.state.formData);
            saveFormDataToStorage(location.state.formData);
          } else {
            const savedData = loadFormDataFromStorage();
            if (savedData) {
              setFormData(savedData);
            }
          }
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setPageLoading(false);
      }
    };
    initializeComponent();
  }, [groupId, urlTicketId, navigate, location.state]);

  useEffect(() => {
    if (!pageLoading && !isEditMode) {
      saveFormDataToStorage(formData);
    }
  }, [formData, pageLoading, isEditMode]);

  useEffect(() => {
  const callbackName = "initMapCallback";
  const scriptId = "google-maps-script";

  // Check if already loaded
  if (window.google && window.google.maps) {
    setIsApiReady(true);
    return;
  }

  // Set up callback BEFORE creating the script
  if (!window[callbackName]) {
    window[callbackName] = () => {
      setIsApiReady(true);
    };
  }

  // Check if script already exists
  const existingScript = document.getElementById(scriptId);
  if (existingScript) {
    // Script exists but not loaded yet, wait for callback
    return;
  }

  // Create and load script
  const script = document.createElement("script");
  script.id = scriptId;
  const apiKey = import.meta.env.VITE_GOOGLE_MAP_API;
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
  script.async = true;
  script.defer = true;
  
  script.onerror = () => {
    console.error("Failed to load Google Maps script");
  };
  
  document.head.appendChild(script);

  // NO cleanup - let the callback persist for the script
}, []);

  // Enhanced map initialization with initial location
  useEffect(() => {
    if (!isApiReady || !mapRef.current || !dataLoaded) return;

    // If location type is not offline, cleanup and return
    if (formData.location_type !== "offline") {
      if (map) {
        setMap(null);
        markerRef.current = null;
      }
      return;
    }

    const initializeMap = () => {
      // Use form data coordinates if available, otherwise use initial location
      const initialCenter =
        formData.exact_map_location.latitude &&
        formData.exact_map_location.longitude
          ? {
              lat: parseFloat(formData.exact_map_location.latitude),
              lng: parseFloat(formData.exact_map_location.longitude),
            }
          : INITIAL_MAP_LOCATION;

      // Clean up existing map first
      if (map) {
        window.google.maps.event.clearInstanceListeners(map);
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }
      }

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 15,
        mapTypeId: "roadmap",
        gestureHandling: "cooperative",
      });

      const markerInstance = new window.google.maps.Marker({
        position: initialCenter,
        map: mapInstance,
        draggable: true,
        title: "Event Location",
      });

      const updateStateFromCoords = (lat, lng) => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results[0]) {
            setFormData((prev) => ({
              ...prev,
              location: results[0].formatted_address,
              exact_map_location: {
                latitude: lat.toString(),
                longitude: lng.toString(),
                address: results[0].formatted_address,
              },
            }));
          }
        });
      };

      // Map click listener
      mapInstance.addListener("click", (e) => {
        markerInstance.setPosition(e.latLng);
        updateStateFromCoords(e.latLng.lat(), e.latLng.lng());
      });

      // Marker drag listener
      markerInstance.addListener("dragend", (e) => {
        updateStateFromCoords(e.latLng.lat(), e.latLng.lng());
      });

      // Autocomplete setup
      if (autocompleteRef.current) {
        const autocompleteInstance = new window.google.maps.places.Autocomplete(
          autocompleteRef.current,
          {
            fields: ["geometry", "name", "formatted_address"],
            types: ["establishment", "geocode"],
          }
        );

        autocompleteInstance.addListener("place_changed", () => {
          const place = autocompleteInstance.getPlace();
          if (!place.geometry?.location) return;

          const { lat, lng } = place.geometry.location;
          const newPosition = { lat: lat(), lng: lng() };

          setFormData((prev) => ({
            ...prev,
            location: place.formatted_address || "",
            venue: place.name || prev.venue,
            exact_map_location: {
              latitude: lat().toString(),
              longitude: lng().toString(),
              address: place.formatted_address || "",
            },
          }));

          mapInstance.setCenter(newPosition);
          mapInstance.setZoom(15);
          markerInstance.setPosition(newPosition);
        });
      }

      setMap(mapInstance);
      markerRef.current = markerInstance;

      // Ensure map renders properly with multiple resize triggers
      const triggerResize = () => {
        if (mapInstance && mapRef.current) {
          window.google.maps.event.trigger(mapInstance, "resize");
          mapInstance.setCenter(initialCenter);
          mapInstance.setZoom(15);
        }
      };

      // Multiple resize attempts to ensure proper rendering
      setTimeout(triggerResize, 100);
      setTimeout(triggerResize, 300);
      setTimeout(triggerResize, 500);
    };

    initializeMap();
  }, [isApiReady, formData.location_type, dataLoaded]);
  useEffect(() => {
    const initializeComponent = async () => {
      setPageLoading(true);
      setDataLoaded(false); // Reset data loaded state

      if (!groupId) {
        navigate("/select-group");
        return;
      }

      try {
        const groupsResponse = await getGroups();
        const groupsArray = Array.isArray(groupsResponse)
          ? groupsResponse
          : groupsResponse.data || [];
        const groupData = groupsArray.find((g) => g._id === groupId);
        if (!groupData) {
          alert("Group not found.");
          navigate("/select-group");
          return;
        }
        setSelectedGroup(groupData);

        if (urlTicketId) {
          setIsEditMode(true);
          await loadExistingTicketData(urlTicketId);
        } else {
          if (location.state?.formData) {
            setFormData(location.state.formData);
            saveFormDataToStorage(location.state.formData);
          } else {
            const savedData = loadFormDataFromStorage();
            if (savedData) {
              setFormData(savedData);
            }
          }
        }

        // Set data loaded to true after all data operations are complete
        setDataLoaded(true);
      } catch (error) {
        console.error("Initialization error:", error);
        setDataLoaded(true); // Set to true even on error to allow map initialization
      } finally {
        setPageLoading(false);
      }
    };
    initializeComponent();
  }, [groupId, urlTicketId, navigate, location.state]);
  // Update map position when coordinates change
  useEffect(() => {
    if (!map || !markerRef.current || formData.location_type !== "offline")
      return;

    if (
      formData.exact_map_location.latitude &&
      formData.exact_map_location.longitude
    ) {
      const newPosition = {
        lat: parseFloat(formData.exact_map_location.latitude),
        lng: parseFloat(formData.exact_map_location.longitude),
      };

      // Use setTimeout to ensure the map container is visible
      setTimeout(() => {
        map.setCenter(newPosition);
        map.setZoom(15);
        markerRef.current.setPosition(newPosition);
        window.google.maps.event.trigger(map, "resize");
      }, 50);
    }
  }, [
    formData.exact_map_location.latitude,
    formData.exact_map_location.longitude,
    map,
    formData.location_type,
  ]);

  // Add this effect to handle visibility changes
  useEffect(() => {
    if (map && formData.location_type === "offline" && dataLoaded) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        window.google.maps.event.trigger(map, "resize");

        if (
          formData.exact_map_location.latitude &&
          formData.exact_map_location.longitude
        ) {
          const center = {
            lat: parseFloat(formData.exact_map_location.latitude),
            lng: parseFloat(formData.exact_map_location.longitude),
          };
          map.setCenter(center);
          map.setZoom(15);
          if (markerRef.current) {
            markerRef.current.setPosition(center);
          }
        }
      }, 100);
    }
  }, [map, formData.location_type, dataLoaded]);
  useEffect(() => {
    if (!mapRef.current || !map) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && map) {
            setTimeout(() => {
              window.google.maps.event.trigger(map, "resize");
              if (
                formData.exact_map_location.latitude &&
                formData.exact_map_location.longitude
              ) {
                const center = {
                  lat: parseFloat(formData.exact_map_location.latitude),
                  lng: parseFloat(formData.exact_map_location.longitude),
                };
                map.setCenter(center);
              }
            }, 100);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(mapRef.current);

    return () => {
      if (mapRef.current) {
        observer.unobserve(mapRef.current);
      }
    };
  }, [map, formData.exact_map_location]);

  useEffect(() => {
    if (formData.event_name || formData.location) {
      saveFormDataToStorage(formData);
    }
  }, [formData]);

  // --- MODIFIED: handleInputChange to reset subcategory ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // If the category changes, reset the subcategory
      if (name === "event_category") {
        newData.event_subcategory = "";
      }
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {}; // Object to collect errors for highlighting
    if (!groupId) {
      showAlert({
        type: 'error',
        message: 'Missing Group ID',
        description: 'Group ID is missing. Please go back and select a group.'
      });
      return;
    }
    console.log("Checking groupId before submission:", groupId);
    // Validate groupId
    if (!formData.groupId) {
      newErrors.groupId = true;
      showAlert({
        type: 'error',
        message: 'Missing Group ID',
        description: 'Please select a group first.'
      });
      setErrors(newErrors);
      return;
    }

    // Validate YouTube URL
    const youtubeRegex = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([a-zA-Z0-9_-]{11})/;
    if (formData.event_youtube_link && !youtubeRegex.test(formData.event_youtube_link)) {
      newErrors.event_youtube_link = true;
      showAlert({
        type: 'error',
        message: 'Invalid YouTube URL',
        description: 'Please use a valid format like \'youtube.com/watch?v=VIDEO_ID\'.'
      });
      setErrors(newErrors);
      return;
    }

    // Validate Instagram URL
    const instagramRegex = /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9._]{1,30}\/?/;
    if (formData.event_instagram_link && !instagramRegex.test(formData.event_instagram_link)) {
      newErrors.event_instagram_link = true;
      showAlert({
        type: 'error',
        message: 'Invalid Instagram URL',
        description: 'Please enter a valid profile link, like \'instagram.com/username\'.'
      });
      setErrors(newErrors);
      return;
    }
    const data = new FormData();
    const processedGuests = [];
    (formData.guests || []).forEach((guest, index) => {
      const cleanGuest = {
        guest_name: guest.name,
        guest_link: guest.link || '',
      };
      // If there's a raw file (new upload), append it with the correct field name
      if (guest.rawFile instanceof File) {
        data.append(`guest_profile_${index}`, guest.rawFile);
        // Don't include guest_profile in the JSON - backend will add the path
      } else if (guest.image) {
        // If it's an existing image URL, include it in the JSON
        cleanGuest.guest_profile = guest.image;
      }

      processedGuests.push(cleanGuest);
    });
    // Append processed guests as JSON
    data.append('guests', JSON.stringify(processedGuests));

    // Prepare description text for validation
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = formData.event_description || "";
    const descriptionText = (tempDiv.textContent || tempDiv.innerText).trim();

    // Define all required fields and check them
    const requiredFields = {
      event_name: formData.event_name?.trim(),
      event_category: formData.event_category?.trim(),
      event_subcategory: formData.event_subcategory?.trim(),
      event_type: formData.event_type?.trim(),
      event_language: formData.event_language,
      location_type: formData.location_type?.trim(),
      event_dates: formData.event_dates,
      event_description: descriptionText,
      min_age_allowed: formData.min_age_allowed?.toString(), // Use toString() for comparison
      POCS: formData.POCS 
    };
    

    // Add location-specific required fields
    if (formData.location_type === 'offline') {
        requiredFields.location = formData.location?.trim();
        requiredFields.venue = formData.venue?.trim();
        requiredFields.seating_arrangement = formData.seating_arrangement?.trim();
        // Also check map location, assuming its critical for offline
        if (!formData.exact_map_location?.latitude || !formData.exact_map_location?.longitude || !formData.exact_map_location?.address) {
            newErrors.exact_map_location = true; // Highlight map area or address fields
            // No specific alert here, as missing fields alert below will cover 'location'
        }
    } 
    
    // Check POC fields only if any POC exists
    formData.POCS.forEach((pocItem, index) => {
        if (!pocItem.POC_name?.trim() || !pocItem.POC_email?.trim() || !pocItem.POC_contact?.trim()) {
            newErrors[`POCS.${index}`] = true; // Highlight individual POC field
            // Note: This won't highlight the entire POC section, only specific inputs
        }
    });

    const missingGeneralFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value || (Array.isArray(value) && value.length === 0))
        .map(([key, _]) => key); // Get the actual keys for error state

    if (missingGeneralFields.length > 0) {
        missingGeneralFields.forEach(field => {
            newErrors[field] = true; // Mark field as having an error
        });
        showAlert({
            type: 'error',
            message: 'Missing Required Fields',
            description: `Please fill in the following: ${missingGeneralFields.map(f => f.replace(/_/g, ' ')).join(', ')}.`,
        });
        setErrors(newErrors);
        return;
    }

    setLoading(true);
    try {
      const parseDate = (dateValue) => {
        if (!dateValue) return null;
        if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateValue;
        }
        const date = new Date(dateValue);
        return date.toISOString().split("T")[0];
      };
      const transformedDates = formData.event_dates.map((d) => ({
        start_date: parseDate(d.date),
        end_date: parseDate(d.endDate),
        start_time: d.startTime,
        end_time: d.endTime,
      }));
      const eventDateTypeMap = {
        "Single day": "one-day",
        "Multi days": "multi-day",
        Weekly: "weekly",
      };
      const submitData = {
        ...formData,
        groupId: groupId, // Explicitly add groupId from params
        event_name: formData.event_name.trim(),
        event_category: formData.event_category.trim(),
        event_subcategory: formData.event_subcategory.trim(),
        event_type: formData.event_type.trim(),
        event_description: formData.event_description.trim(),
        userId: "user_12345",
        location_type: formData.location_type.trim(),
        location: formData.location?.trim() || "",
        venue: formData.venue?.trim() || "",
        event_language: formData.event_language,
        min_age_allowed: parseInt(formData.min_age_allowed.trim()),
        event_dates: transformedDates,
        event_date_type: eventDateTypeMap[formData.event_date_type] || "one-day",
        gate_open_time: formData.gatesOpenEarly
          ? formData.gate_open_time?.trim() || ""
          : "",
        exact_map_location:
          formData.exact_map_location?.latitude &&
          formData.exact_map_location?.longitude
            ? {
                latitude: parseFloat(formData.exact_map_location.latitude),
                longitude: parseFloat(formData.exact_map_location.longitude),
                address: formData.exact_map_location.address,
              }
            : undefined,
      };
      const response = await createTicketBasicInfo(
        submitData,
        urlTicketId || null
      );
      const newTicketId =
        response.ticketId ||
        response.data?.ticketId ||
        response.data?._id ||
        urlTicketId;
      
      clearFormDataFromStorage();
      
      showAlert({
        type: 'success',
        message: isEditMode ? "Event updated successfully!" : "Event created successfully!",
        description: "Proceeding to media upload..."
      });

      setTimeout(() => {
        navigate(`/ticket/update-ticket-media/${newTicketId}`, {
          state: {
            
            message: `${
              isEditMode ? "Event updated" : "Event created"
            } successfully!`,
            newEvent: response.data,
            ticketId: newTicketId,
            formData: formData,
            showAlert:showAlert,
          },
        });
      }, 1500); // Give user time to see success message
    } catch (error) {
      console.error("Error creating event:", error);
      showAlert({
        type: 'error',
        message: 'Submission Failed',
        description: error.response?.data?.message || "An error occurred during submission. Please try again.",
      });
    } setLoading(true);
    try {
      const data = new FormData();
      const convertTo24Hour = (time12h, ampm) => {
      if (!time12h || !ampm) return "";
      const [hours, minutes] = time12h.split(":");
      let hour24 = parseInt(hours, 10);
      if (ampm === "AM" && hour24 === 12) hour24 = 0;
      if (ampm === "PM" && hour24 !== 12) hour24 += 12;
      return `${hour24.toString().padStart(2, "0")}:${minutes}`;
    };

        // 1. Prepare event_dates for backend, handling files and converting to 24-hour time
        const processedEventDates = [];
         (formData.event_dates || []).forEach((item, index) => {
    const cleanItem = { ...item };

    // Convert times to 24-hour format if they exist
    if (cleanItem.startTime && cleanItem.startAmPm) {
      cleanItem.startTime = convertTo24Hour(cleanItem.startTime, cleanItem.startAmPm);
      delete cleanItem.startAmPm;
    } else {
      cleanItem.startTime = '';
      delete cleanItem.startAmPm;
    }
    if (cleanItem.endTime && cleanItem.endAmPm) {
      cleanItem.endTime = convertTo24Hour(cleanItem.endTime, cleanItem.endAmPm);
      delete cleanItem.endAmPm;
    } else {
      cleanItem.endTime = '';
      delete cleanItem.endAmPm;
    }

    // Append videoFile for recorded events, if it's an actual File object
    if (cleanItem.videoFile instanceof File) {
      data.append(`video_file_${index}`, cleanItem.videoFile);
      delete cleanItem.videoFile;
    } else {
      cleanItem.video_file_path = cleanItem.videoFile;
      delete cleanItem.videoFile;
    }

    // Append previewImage for recorded events, if it's an actual File object
    if (cleanItem.previewImage instanceof File) {
      data.append(`preview_image_${index}`, cleanItem.previewImage);
      delete cleanItem.previewImage;
    } else {
      cleanItem.preview_image_path = cleanItem.previewImage;
      delete cleanItem.previewImage;
    }
    
    // Map 'date' to 'start_date' and 'endDate' to 'end_date' for backend consistency
    cleanItem.start_date = cleanItem.date;
    cleanItem.end_date = cleanItem.endDate;
    delete cleanItem.date;
    delete cleanItem.endDate;

    processedEventDates.push(cleanItem);
  });
  data.append('groupId', groupId);
        // 2. Append all other formData fields to the FormData object
        for (const key in formData) {
          // Skip keys already processed or handled differently
          if (key === 'event_dates' || key === 'video_file' || key === 'preview_image' || key === 'groupId') continue;

          if (Array.isArray(formData[key]) || (typeof formData[key] === 'object' && formData[key] !== null && !(formData[key] instanceof File))) {
            // Stringify arrays and complex objects
            data.append(key, JSON.stringify(formData[key]));
          } else if (formData[key] !== null && formData[key] !== undefined) {
            // Append simple primitive values
            data.append(key, formData[key]);
          }
        }
         data.append('event_dates', JSON.stringify(processedEventDates));
        if (formData.event_rules_file instanceof File) {
          data.append('event_rules', formData.event_rules_file);
        } else if (formData.event_rules?.type === 'file' && formData.event_rules?.path) {
          data.append('event_rules_text', '');
        }
        console.log("Sending groupId:", groupId);
        console.log("FormData groupId:", data.get('groupId'));
        const response = await createTicketBasicInfo(data, urlTicketId || null);
        const newTicketId =
        response.ticketId || response.data?.ticketId || response.data?._id || urlTicketId;
        clearFormDataFromStorage();
        showAlert({
          type: 'success',
          message: formData.event_name,
          description: `Successfully ${isEditMode ? 'updated' : 'added'} your event.`,
        });
        setTimeout(() => {
          navigate(`/ticket/update-ticket-media/${newTicketId}`);
        }, 1500);
        } catch (error) {
          console.error("Error creating event:", error);
          showAlert({
            type: 'error',
                    message: 'Submission Failed',
                    description: error.response?.data?.message || "An error occurred during submission. Please try again."
                });
            } finally {
                setLoading(false);
            }
  };
  const handleBack = () => {
    clearFormDataFromStorage();
    navigate("/home");
  };
  const handleLocationInputChange = (e) => handleInputChange(e);
  const handleToggleChange = (name) =>
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
  const handleTagChange = (name, newTags) =>
    setFormData((prev) => ({ ...prev, [name]: newTags }));
  const handleSelectChange = (selectedOption, { name }) => {
    const value = selectedOption ? selectedOption.value : "";
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "event_category") {
        newData.event_subcategory = "";
      }
      return newData;
    });
  };
  const handleLanguageChange = (selectedOptions) => {
    const values = selectedOptions
      ? selectedOptions.map((opt) => opt.value)
      : [];
    setFormData((prev) => ({
      ...prev,
      event_language: values,
    }));
  };
  const handleLocationTypeChange = (type) =>
    setFormData((prev) => ({ ...prev, location_type: type.toLowerCase() }));
  const handleDatesSave = (newDates, dateType) => {
    // This now correctly saves the data structure from any modal (groups or flat list) as is.
    setFormData((prev) => ({
      ...prev,
      event_dates: newDates,
      event_date_type: dateType,
    }));
  };
  const removeDate = (dateToRemove) =>
    setFormData((prev) => ({
      ...prev,
      event_dates: prev.event_dates.filter((d) => d.date !== dateToRemove),
    }));
  const handleGuestsSave = (newGuests) =>
    setFormData((prev) => ({ ...prev, guests: newGuests }));
  const handleEditGuest = (guest) => {
    setEditingGuest(guest);
    setIsGuestModalOpen(true);
  };
  const handleProhibitedItemsSave = (newItems) =>
    setFormData((prev) => ({ ...prev, prohibited_items: newItems }));
  const removeProhibitedItem = (itemToRemove) =>
    setFormData((prev) => ({
      ...prev,
      prohibited_items: prev.prohibited_items.filter(
        (item) => item !== itemToRemove
      ),
    }));
  const handlePocChange = (e) =>
    setPoc({ ...poc, [e.target.name]: e.target.value });
  const handleAddPoc = () => {
    // Trim input values once for consistency
    const trimmedName = poc.POC_name.trim();
    const trimmedEmail = poc.POC_email.trim();
    const trimmedContact = poc.POC_contact.trim();

    // 1. Check for empty fields first
    if (!trimmedName || !trimmedEmail || !trimmedContact) {
      alert(
        "Please fill in all Point of Contact fields: Name, Email, and Contact Number."
      );
      return;
    }

    // 2. Check for duplicate email
    const isDuplicateEmail = formData.POCS.some(
      (p) => p.POC_email === trimmedEmail
    );
    if (isDuplicateEmail) {
      alert(
        "This email address is already in use by another POC. Please use a different email."
      );
      return;
    }
    // 3. Check for duplicate contact number
    const isDuplicateContact = formData.POCS.some(
      (p) => p.POC_contact === trimmedContact
    );
    if (isDuplicateContact) {
      alert(
        "This contact number is already in use by another POC. Please use a different number."
      );
      return;
    }
    // If all checks pass, add the new POC
    const newPoc = {
      POC_name: trimmedName,
      POC_email: trimmedEmail,
      POC_contact: trimmedContact,
    };
    setFormData((prev) => ({ ...prev, POCS: [...prev.POCS, newPoc] }));
    setPoc({ POC_name: "", POC_email: "", POC_contact: "" }); // Reset form
  };
  const handleRemovePoc = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      POCS: prev.POCS.filter((_, index) => index !== indexToRemove),
    }));
  };
  const handleFormat = (command) => document.execCommand(command, false, null);
  const handleFileChange = (e) => {
    if (e.target.files[0])
      setFormData((prev) => ({ ...prev, event_rules_file: e.target.files[0] }));
  };
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event information...</p>
        </div>
      </div>
    );
  }
  if (!selectedGroup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Group Not Found
          </h3>
          <p className="text-gray-600 mb-6">
            The selected group could not be found or you don't have access to
            it.
          </p>
          <button
            onClick={() => navigate("/select-group")}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Select a Group
          </button>
        </div>
      </div>
    );
  }
const handleOpenDateModal = () => {
    const type = formData.location_type;

    if (type === 'offline') {
        setIsOfflineDateModalOpen(true);
    } else if (type === 'online') {
        setIsOnlineDateModalOpen(true);
    } else if (type === 'recorded') {
        setIsRecordedDateModalOpen(true);
    }else
      
      {
        // This will show your custom alert if no location type is selected
        showAlert({
            type: 'error',
            message: 'Select Location Type',
            description: 'Please select a location type (Offline, Online, or Recorded) before adding dates.'
        });
    }
};

  return (
    <>
      <CustomScrollbarStyles isDark={darkMode} />
      <DatePickerModal
    isOpen={isOfflineDateModalOpen}
    onClose={() => setIsOfflineDateModalOpen(false)}
    onSave={handleDatesSave}
    initialDates={formData.event_dates}
    darkMode={darkMode}
    showAlert={showAlert}
/>
<OnlineDatePickerModal
    isOpen={isOnlineDateModalOpen}
    onClose={() => setIsOnlineDateModalOpen(false)}
    onSave={handleDatesSave}
    initialDates={formData.event_dates}
    darkMode={darkMode}
    showAlert={showAlert} // <-- ADD THIS PROP

/>
<RecordedDatePickerModal
    isOpen={isRecordedDateModalOpen}
    onClose={() => setIsRecordedDateModalOpen(false)}
    onSave={handleDatesSave}
    initialDates={formData.event_dates}
    darkMode={darkMode}
    showAlert={showAlert} 
/>
      <GuestModal
        isOpen={isGuestModalOpen}
        onClose={() => {
          setIsGuestModalOpen(false);
          setEditingGuest(null);
        }}
        onSave={handleGuestsSave}
        initialGuests={formData.guests}
        editingGuest={editingGuest}
        darkMode={darkMode}
      />
      <ProhibitedItemsModal
        isOpen={isProhibitedModalOpen}
        onClose={() => setIsProhibitedModalOpen(false)}
        onSave={handleProhibitedItemsSave}
        initialItems={formData.prohibited_items}
        darkMode={darkMode}
      />
      <Alert alert={alert} onClose={hideAlert} />
      <div className={`${darkMode ? "dark" : ""}`}>
        <div className="bg-white dark:bg-[#212426] text-gray-800 dark:text-white min-h-screen flex">
          <EventSidebar
            darkMode={darkMode} // dark theme boolean from your app state
            onBackClick={handleBack} // Your existing back function
            // Pass props from your 'mainEventData' state object
            formProgress={formData?.form_progress || {}}
            groupId={formData?.groupId}
            ticketId={urlTicketId} // true if Add Show path, else Banking & Tickets
          />

          <main className="flex-1 relative p-4 sm:p-6 md:p-8 overflow-y-auto main-scrollbar">
            <div className="absolute top-6 right-6 z-10">
              <ThemeToggle
                isDark={darkMode}
                onToggle={() => setDarkMode(!darkMode)}
              />
            </div>
            <div className="w-full max-w-5xl mx-auto">
              <div className="text-center mt-4 mb-12">
                <div
                  className={`w-20 h-20 rounded-full mx-auto my-4  flex items-center justify-center ${
                    darkMode
                      ? "bg-[#1E1242] text-gray-300"
                      : "bg-[#1E1242] text-gray-300"
                  }`}
                >
                  {/* --- FIX: Replaced Emoji with Icon --- */}
                  <img
                    src={Event_Form_Icon}
                    alt="Wie Logo"
                    className="w-10 h-10 items-center"
                  />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {isEditMode
                    ? "Edit Your Event"
                    : "Name it. Classify it. Describe it. Your event begins here."}
                </h1>
                {selectedGroup && (
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {isEditMode
                      ? "Updating event under:"
                      : "Creating event under:"}{" "}
                    <span className="font-semibold text-indigo-600">
                      {selectedGroup.name || selectedGroup.group_name}
                    </span>
                  </p>
                )}
              </div>
              <form onSubmit={handleSubmit} className="space-y-12">
                {/* Event Details */}
                <div className="space-y-8">
                  <FormInput
    label="Event name"
    id="event_name"
    name="event_name"
    type="text"
    value={formData.event_name}
    onChange={handleInputChange}
    placeholder="Enter your event name here..."
    info="The public title of your event."
    error={errors.event_name} // Pass the error state
    required={true}           // This adds the red asterisk
    darkMode={darkMode}
/>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label
                        htmlFor="event_category"
                        className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2"
                      >
                        Event category<span className="text-red-400">*</span>
                        <InfoTooltip note="Helps attendees find your event." />
                      </label>
                      <div className="relative">
                        <Select
                          name="event_category"
                          options={categoryOptions}
                          value={categoryOptions.find(
                            (option) => option.value === formData.event_category
                          )}
                          onChange={handleSelectChange}
                          placeholder="Select category"
                          styles={CustomSelectStyles(darkMode,errors)}
                          
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="event_subcategory"
                        className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2"
                      >
                        Event subcategory
                        <span className="text-red-400">*</span>
                        <InfoTooltip note="Get more specific with your category." />
                      </label>
                      {/* --- MODIFIED: Event Subcategory Dropdown --- */}
                      <Select
                        name="event_subcategory"
                        options={subCategoryOptions}
                        value={subCategoryOptions.find(
                          (option) =>
                            option.value === formData.event_subcategory
                        )}
                        onChange={handleSelectChange}
                        placeholder="Select subcategory"
                        styles={CustomSelectStyles(darkMode,errors  )}
                        isDisabled={!formData.event_category}
                        
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2">
                      Event type<span className="text-red-400">*</span>
                      <InfoTooltip note="Public events are visible to everyone." />
                    </label>
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center cursor-pointer text-gray-600 dark:text-gray-300">
                        <input
                          type="radio"
                          name="event_type"
                          value="public"
                          checked={formData.event_type === "public"}
                          onChange={handleInputChange}
                          className="hidden peer"
                        />
                        <span className="w-4 h-4 rounded-full border-2 border-black dark:border-[#4A4A4A] peer-checked:border-indigo-500 peer-checked:bg-indigo-500 transition-all duration-300 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity duration-300"></span>
                        </span>
                        <span className="ml-2">Public</span>
                      </label>
                      <label className="flex items-center cursor-pointer text-gray-600 dark:text-gray-300">
                        <input
                          type="radio"
                          name="event_type"
                          value="private"
                          checked={formData.event_type === "private"}
                          onChange={handleInputChange}
                          className="hidden peer"
                        />
                        <span className="w-4 h-4 rounded-full border-2 border-black dark:border-[#4A4A4A] peer-checked:border-indigo-500 peer-checked:bg-indigo-500 transition-all duration-300 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity duration-300"></span>
                        </span>
                        <span className="ml-2">Private</span>
                      </label>
                    </div>
                  </div>
                </div>
                {/* Location Section */}
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Location
                    </h2>
                    <p className="text-black dark:text-gray-400 text-sm">
                      Choose where your event will take place
                    </p>
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-3">
                      Event location type<span className="text-red-400">*</span>
                    </label>
                    <div className="flex items-center space-x-4">
                      {["Offline", "Online", "Recorded"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleLocationTypeChange(type)}
                          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                            formData.location_type === type.toLowerCase()
                              ? "bg-[#10B981] text-white shadow-lg"
                              : "bg-gray-200 dark:bg-[#374151] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  {formData.location_type === "offline" && (
                    <div className="space-y-8 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <FormInput
                            label="Event location"
                            id="location"
                            name="location"
                            type="text"
                            value={formData.location}
                            onChange={handleLocationInputChange}
                            placeholder="Search for location..."
                            info="Start typing to search with Google Places."
                            error={errors.location}
                            required={true}
                            darkMode={darkMode}
                            ref={autocompleteRef}
                        />
                        <FormInput
                            label="Event venue"
                            id="venue"
                            name="venue"
                            type="text"
                            value={formData.venue}
                            onChange={handleInputChange}
                            placeholder="Enter the event venue"
                            info="e.g., Main Auditorium, Hall B1"
                            error={errors.venue}
                            required={true}
                            darkMode={darkMode}
                        />
                        <div>
                          
                        </div>
                      </div>
                      <div className="relative">
                        <label className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2">
                          Exact map location
                          <span className="text-red-400">*</span>
                          <InfoTooltip note="Click on the map to set exact location. Drag the marker to adjust." />
                        </label>
                        <div
                          ref={mapRef}
                          className="w-full h-64 rounded-lg border bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-[#4A4A4A]"
                          style={{
                            minHeight: "300px",
                            display:
                              formData.location_type === "offline"
                                ? "block"
                                : "none",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        ></div>
                        <div className="mt-2 text-xs text-black dark:text-gray-400">
                          Click anywhere on the map or drag the marker to set
                          the exact location
                        </div>
                      </div>
                      {formData.exact_map_location.latitude &&
                        formData.exact_map_location.longitude && (
                          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-100">
                              <strong>Selected Location:</strong>
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-300 mt-1">
                              Lat: {formData.exact_map_location.latitude}, Lng:{" "}
                              {formData.exact_map_location.longitude}
                            </div>
                            {formData.exact_map_location.address && (
                              <div className="text-xs text-gray-400 dark:text-gray-300 mt-1">
                                Address: {formData.exact_map_location.address}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  )}
                  
                </div>
                {/* Additional Fields */}
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label
                        htmlFor="event_language"
                        className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2"
                      >
                        Which language will your event be performed in?
                        <span className="text-red-400">*</span>{" "}
                        <InfoTooltip note="Select one or more languages." />
                      </label>
                      <Select
                        name="event_language"
                        options={languageOptions}
                        isMulti
                        value={languageOptions.filter((option) =>
                          (formData.event_language || []).includes(option.value)
                        )}
                        onChange={handleLanguageChange} // Use the new handler
                        placeholder="Select language(s)"
                        styles={CustomSelectStyles(darkMode)}
                        classNamePrefix="react-select"
                      />
                    </div>

                    <FormInput
                        label="What is the minimum age allowed for entry?"
                        id="min_age_allowed"
                        name="min_age_allowed"
                        type="number"
                        value={formData.min_age_allowed}
                        onChange={handleInputChange}
                        placeholder="Enter Min Age"
                        info="Select an age limit if applicable."
                        error={errors.min_age_allowed}
                        required={true}
                        darkMode={darkMode}
                    />
                  </div>
                  {formData.location_type === "offline" && (
                    <div className="animate-fade-in">
                      <label
                        htmlFor="seating_arrangement"
                        className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2"
                      >
                        Will your audience be seated or standing?
                        <span className="text-red-400">*</span>{" "}
                        <InfoTooltip note="Specify the audience arrangement." />
                      </label>
                      <div className="relative">
                        <Select
                          name="seating_arrangement"
                          options={seatingOptions}
                          value={seatingOptions.find(
                            (option) =>
                              option.value === formData.seating_arrangement
                          )}
                          onChange={handleSelectChange}
                          placeholder="Select a type"
                          styles={CustomSelectStyles(darkMode)}
                          
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-4 pt-4">
                    <ToggleSwitch
                      label="Is this event kid friendly?"
                      checked={formData.kids_friendly}
                      onChange={() => handleToggleChange("kids_friendly")}
                      darkMode={darkMode}
                    />
                    <ToggleSwitch
                      label="Is this event pet friendly?"
                      checked={formData.pet_friendly}
                      onChange={() => handleToggleChange("pet_friendly")}
                      darkMode={darkMode}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label
                        htmlFor="event_instagram_link"
                        className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2"
                      >
                        Instagram link (Optional){" "}
                        <InfoTooltip note="Link to your event's Instagram page." />
                      </label>
                      <input
                        id="event_instagram_link"
                        name="event_instagram_link"
                        type="text"
                        value={formData.event_instagram_link}
                        onChange={handleInputChange}
                        placeholder="https://instagram.com/..."
                        className="w-full px-4 py-3 bg-transparent border rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-black dark:border-[#4A4A4A] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="event_youtube_link"
                        className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2"
                      >
                        Youtube link (Optional){" "}
                        <InfoTooltip note="Link to a YouTube video or channel." />
                      </label>
                      <input
                        id="event_youtube_link"
                        name="event_youtube_link"
                        type="text  "
                        value={formData.event_youtube_link}
                        onChange={handleInputChange}
                        placeholder="https://youtube.com/..."
                        className="w-full px-4 py-3 bg-transparent border rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-black dark:border-[#4A4A4A] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300"
                      />
                    </div>
                  </div>
                  <div>
                    <TagInput
                      label="Event hashtags (Optional)"
                      tags={formData.hashtag}
                      onTagsChange={(newTags) =>
                        handleTagChange("hashtag", newTags)
                      }
                      placeholder="Eg. #Concert"
                      darkMode={darkMode}
                    />
                  </div>
                </div>
                {/* --- DATES AND TIMES --- */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Dates and time
                    </h2>
                    <p className="text-black dark:text-gray-400">
                      Choose when your event will take place
                    </p>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleOpenDateModal}
                      className="px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-semibold flex items-center gap-2"
                    >
                      Add dates and time{" "}
                      <img src={Date_Form_Icon} alt="" className="pl-2" />
                    </button>
                  </div>
                  {formData.event_dates.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-black dark:text-gray-400">
                        Dates you selected
                      </label>
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {formData.event_dates.map((item) => (
                          <div
                            key={item.date}
                            className="bg-gray-100 dark:bg-[#2B2B2B] rounded-lg p-3 text-center text-sm font-semibold relative"
                          >
                            {new Date(
                              item.date + "T00:00:00"
                            ).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            <button
                              onClick={() => removeDate(item.date)}
                              type="button"
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {formData.location_type === "offline" && (
                    <div className="animate-fade-in">
                      <div className="flex items-center justify-between pt-4">
                        <span className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          Does the gates open before event starting time?
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={formData.gatesOpenEarly}
                            onChange={() =>
                              handleToggleChange("gatesOpenEarly")
                            }
                          />
                          <div
                            className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                              darkMode
                                ? "bg-gray-600 after:border-gray-500 peer-checked:bg-indigo-600"
                                : "bg-gray-200 after:border-black peer-checked:bg-indigo-500"
                            }`}
                          ></div>
                        </label>
                      </div>

                      {formData.gatesOpenEarly && (
                        <div>
                          <label
                            htmlFor="gate_open_time"
                            className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2"
                          >
                            Time of gate opening?
                            <span className="text-red-400">*</span>{" "}
                            <InfoTooltip note="Set the time when gates will open." />
                          </label>

                          {/* Custom 12-hour time picker with placeholders */}
                          <div className="flex gap-2">
                            {/* Hour */}
                            <select
                              id="gate_open_hour"
                              name="gate_open_hour"
                              value={formData.gate_open_hour || ""}
                              onChange={handleInputChange}
                              className={`w-1/3 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300
                                      ${
                                        darkMode
                                          ? "bg-[#1E1E1E] text-white border-[#4A4A4A]"
                                          : "bg-white text-black border-black"
                                      }`}
                            >
                              <option value="" disabled>
                                Hour
                              </option>
                              {[...Array(12)].map((_, i) => {
                                const hour = i + 1;
                                return (
                                  <option key={hour} value={hour}>
                                    {hour}
                                  </option>
                                );
                              })}
                            </select>

                            {/* Minute */}
                            <select
                              id="gate_open_minute"
                              name="gate_open_minute"
                              value={formData.gate_open_minute || ""}
                              onChange={handleInputChange}
                              className={`w-1/3 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300
                                      ${
                                        darkMode
                                          ? "bg-[#1E1E1E] text-white border-[#4A4A4A]"
                                          : "bg-white text-black border-black"
                                      }`}
                            >
                              <option value="" disabled>
                                Minute
                              </option>
                              {[...Array(60)].map((_, i) => {
                                const minute = i.toString().padStart(2, "0");
                                return (
                                  <option key={minute} value={minute}>
                                    {minute}
                                  </option>
                                );
                              })}
                            </select>

                            {/* AM/PM */}
                            <select
                              id="gate_open_ampm"
                              name="gate_open_ampm"
                              value={formData.gate_open_ampm || ""}
                              onChange={handleInputChange}
                              className={`w-1/3 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300
                                      ${
                                        darkMode
                                          ? "bg-[#1E1E1E] text-white border-[#4A4A4A]"
                                          : "bg-white text-black border-black"
                                      }`}
                            >
                              <option value="" disabled>
                                AM/PM
                              </option>
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* --- GUESTS, RULES, ETC. --- */}
                <div className="space-y-6">
                  <div className="space-y-6">
                    <div>
<h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Guest/Guide/Artists details
                    </h2>
                    <p className="text-black dark:text-gray-400 text-sm">
                      Enter details of the person guiding or managing the event.
                    </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setIsGuestModalOpen(true);
                        setEditingGuest(null);
                      }}
                      className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white flex items-center gap-2"
                    >
                      Add guest/guides <img src={Guest_Form_Icon} alt="" />
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {formData.guests.map((guest) => (
                        <div
                          key={guest.id}
                          className={`rounded-lg p-3 flex items-center justify-between ${
                            darkMode ? "bg-[#2B2B2B]" : "bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={guest.image}
                              alt={guest.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <span className="font-semibold">{guest.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEditGuest(guest)}
                            className={`p-2 ${
                              darkMode
                                ? "text-gray-400 hover:text-white"
                                : "text-black hover:text-black"
                            }`}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"
                              ></path>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6 ">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Event rules and regulations
                      </h2>
                      <p className="text-black dark:text-gray-400 text-sm">
                        Describe your event rules and regulations
                      </p>
                    </div>
                    <label className="text-sm font-medium text-black dark:text-gray-400">
                      Rules and regulations (Optional)
                    </label>
                    <div
                      className={`bg-transparent border rounded-lg ${
                        darkMode ? "border-[#4A4A4A]" : "border-black"
                      }`}
                    >
                      <div
                        className={`p-2 border-b ${
                          darkMode ? "border-[#4A4A4A]" : "border-black"
                        } flex items-center space-x-1`}
                      >
                        <button
                          type="button"
                          onClick={() => handleFormat("bold")}
                          className={`w-8 h-8 flex items-center justify-center rounded font-bold ${
                            darkMode
                              ? "bg-gray-700 hover:bg-gray-600"
                              : "bg-gray-200 hover:bg-gray-300"
                          }`}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFormat("italic")}
                          className={`w-8 h-8 flex items-center justify-center rounded italic ${
                            darkMode
                              ? "bg-gray-700 hover:bg-gray-600"
                              : "bg-gray-200 hover:bg-gray-300"
                          }`}
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFormat("underline")}
                          className={`w-8 h-8 flex items-center justify-center rounded underline ${
                            darkMode
                              ? "bg-gray-700 hover:bg-gray-600"
                              : "bg-gray-200 hover:bg-gray-300"
                          }`}
                        >
                          U
                        </button>
                      </div>
                      <div
                        ref={rulesEditorRef}
                        contentEditable="true"
                        onInput={() => {
                          if (rulesEditorRef.current) {
                            setFormData((prev) => ({
                              ...prev,
                              event_rules: {
                                ...(prev.event_rules || { type: "text" }),
                                content: rulesEditorRef.current.innerHTML,
                              },
                            }));
                          }
                        }}
                        className="w-full min-h-[120px] p-3 focus:outline-none resize-none text-left [direction:ltr]"
                      >
                        
                      </div>
                      
                    </div>
                    <p className="px-4"> or</p>
                    
                    <div>
                      <label
                        htmlFor="rule-file-upload"
                        className={`px-4 py-2 border rounded-lg font-semibold flex items-center gap-2 cursor-pointer w-max ${
                          darkMode
                            ? "border-gray-600 hover:bg-gray-700"
                            : "border-black hover:bg-gray-100"
                        }`}
                      >
                        Attach document{" "}
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          ></path>
                        </svg>
                      </label>
                      <input
                        id="rule-file-upload"
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {formData.event_rules_file && (
                        <span
                          className={`ml-4 text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {formData.event_rules_file.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Prohibited items
                    </h2>
                    <p className="text-black dark:text-gray-400 text-sm">
                      Add the things that are not allowed for this event
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsProhibitedModalOpen(true)}
                      className="mt-4 px-6 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold flex items-center gap-2"
                    >
                     <span>Add Prohibited Items</span> 
                     <img src={Prohibited_Form_Icon} alt=""  />
                    </button>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {formData.prohibited_items.map((item) => (
                        <div
                          key={item}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                            darkMode
                              ? "bg-[#2B2B2B] text-gray-300"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() => removeProhibitedItem(item)}
                            className={`${
                              darkMode
                                ? "text-black hover:text-white"
                                : "text-gray-400 hover:text-black"
                            }`}
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Event description <span className="text-red-400">*</span>
                    </h2>
                    <p className="text-black dark:text-gray-400 text-sm">
                      Describe your event how it is
                    </p>
                    <div
  className={`mt-4 bg-transparent border rounded-lg transition-colors duration-300 ${
    errors.event_description
      ? 'border-red-500'
      : (darkMode ? "border-[#4A4A4A]" : "border-black")
  }`}
>
                      <div
                        className={`p-2 border-b ${
                          darkMode ? "border-[#4A4A4A]" : "border-black"
                        } flex items-center space-x-1`}
                      >
                        <button
                          type="button"
                          onClick={() => handleFormat("bold")}
                          className={`w-8 h-8 flex items-center justify-center rounded font-bold ${
                            darkMode
                              ? "bg-gray-700 hover:bg-gray-600"
                              : "bg-gray-200 hover:bg-gray-300"
                          }`}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFormat("italic")}
                          className={`w-8 h-8 flex items-center justify-center rounded italic ${
                            darkMode
                              ? "bg-gray-700 hover:bg-gray-600"
                              : "bg-gray-200 hover:bg-gray-300"
                          }`}
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFormat("underline")}
                          className={`w-8 h-8 flex items-center justify-center rounded underline ${
                            darkMode
                              ? "bg-gray-700 hover:bg-gray-600"
                              : "bg-gray-200 hover:bg-gray-300"
                          }`}
                        >
                          U
                        </button>
                      </div>
                      <div
                        ref={descriptionEditorRef}
                        contentEditable="true"
                        onInput={() => {
                          if (descriptionEditorRef.current) {
                            handleInputChange({
                              target: {
                                name: "event_description",
                                value: descriptionEditorRef.current.innerHTML,
                              },
                            });
                          }
                        }}
                        className="w-full min-h-[120px] p-3 focus:outline-none text-left [direction:ltr]"
                      ></div>
                    </div>
                  </div>
                  {/* Point of Contact Section */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Point of Contact
                    </h2>
                    <p className="text-black dark:text-gray-400 text-sm">
                      Please add POCs with whom event feedback will be shared
                    </p>

                    {/* POC Input Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                      <FormInput
                            label="Name"
                            name="POC_name"
                            value={poc.POC_name}
                            onChange={handlePocChange}
                            placeholder="Enter the name of person"
                            error={errors.POC_name}
                            required={true}
                            darkMode={darkMode}
                        />
                        <FormInput
                            label="Email"
                            name="POC_email"
                            value={poc.POC_email}
                            onChange={handlePocChange}
                            type="email"
                            placeholder="enter the email id"
                            error={errors.POC_email}
                            required={true}
                            darkMode={darkMode}
                        />
                    </div>
                    <div className="mt-8">
                      <FormInput
                            label="Contact number"
                            name="POC_contact"
                            value={poc.POC_contact}
                            onChange={handlePocChange}
                            type="tel"
                            placeholder="enter contact number"
                            error={errors.POC_contact}
                            required={true}
                            darkMode={darkMode}
                        />
                    </div>

                    {/* Add POC Button */}
                    <button
                      type="button"
                      onClick={handleAddPoc}
                      className="mt-8 px-8 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-semibold"
                    >
                      Add +
                    </button>
                    {errors.POCS && <p className="text-red-500 text-xs mt-2">At least one Point of Contact is required.</p>}


                    {/* UPDATED: Display List of Added POCs in a Grid */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {formData.POCS.map((pocItem, index) => (
                        <div
                          key={index}
                          className="rounded-lg p-3 flex items-center justify-between bg-gray-100 dark:bg-[#2B2B2B]"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {/* Placeholder Avatar */}

                            {/* Name and Email */}
                            <div className="truncate">
                              <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">
                                {pocItem.POC_name}
                              </p>
                              <p className="text-xs text-black dark:text-gray-400 truncate">
                                {pocItem.POC_email} | {pocItem.POC_contact}
                              </p>
                            </div>
                          </div>
                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleRemovePoc(index)}
                            className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2"
                            aria-label="Remove Point of Contact"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pt-8 flex justify-end gap-4">
                  <button
                    type="button"
                    className={`px-8 py-3 rounded-lg font-semibold ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    }`}
                    onClick={handleBack}
                  >
                    Go back
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save and continue"}
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
export default CreateTicket;
