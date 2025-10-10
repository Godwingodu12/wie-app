import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  updateTicketAddOns,
  getTicketById,
  getGroupView,
  updateSubEvent,
} from "../../services/ticketService";

import Select from "react-select";
import EventSidebar from "../../components/CreateGroup/EventSidebar";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";

import Addon_Form_Icon from "../../assets/Event/Addon_Form_Icon.svg?react";
import Date_Form_Icon from "../../assets/Event/Date_Form_Icon.svg?react";
import Guest_Form_Icon from "../../assets/Event/Guest_Form_Icon.svg?react";
import Prohibited_Form_Icon from "../../assets/Event/Prohibited_Form_Icon.svg?react";

import ToggleSwitch from "../../components/CreateGroup/ToggleSwitch.jsx";
import InfoTooltip from "../../components/CreateGroup/InfoTooltip.jsx";
import FormInput from "../../components/CreateGroup/FormInput.jsx";
import TagInput from "../../components/CreateGroup/TagInput.jsx";

import OnlineDatePickerModal from "../../components/CreateGroup/OnlineDatePickerModal.jsx";
import RecordedDatePickerModal from "../../components/CreateGroup/RecordedDatePickerModal.jsx";
import DatePickerModal from "../../components/CreateGroup/DatePickerModal.jsx";
import GuestModal from "../../components/CreateGroup/GuestModal.jsx";
import ProhibitedItemsModal from "../../components/CreateGroup/ProhibitedItemsModal.jsx";
import Alert from "../../components/CreateGroup/Alert";
import CreateTicketModal from "../../components/CreateGroup/CreateTicketModal.jsx";
import ConfirmModal from "../../components/CreateGroup/ConfirmModal.jsx";
import FileInput from "../../components/CreateGroup/FileInput.jsx";
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
const ageOptions = [
  { value: "0", label: "All ages" },
  { value: "13", label: "13+" },
  { value: "16", label: "16+" },
  { value: "18", label: "18+" },
  { value: "21", label: "21+" },
];

const seatingOptions = [
  { value: "seated", label: "Seated" },
  { value: "standing", label: "Standing" },
  { value: "seated and standing", label: "Seated and Standing" },
  { value: "other", label: "Other" },
];

// --- STYLES FOR REACT-SELECT (REPLACE THE OLD VERSION WITH THIS) ---

// --- Main Component ---
const UpdateTicketAddOns = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingSubEvents, setExistingSubEvents] = useState([]);
  const [groupBankDetails, setGroupBankDetails] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const autocompleteRef = useRef(null);
  const markerRef = useRef(null);
  const storageKey = `ticketFormData_${ticketId || "new"}`;
  const [editingSubEventId, setEditingSubEventId] = useState(null);
  const [isEditingSubEvent, setIsEditingSubEvent] = useState(false);
  const [subEventLoading, setSubEventLoading] = useState(false);
  // Modal states
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [isProhibitedModalOpen, setIsProhibitedModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);

  const [mainEventData, setMainEventData] = useState(null);
  const [videoFiles, setVideoFiles] = useState({});
  const [previewImageFiles, setPreviewImageFiles] = useState({});
  const [alert, setAlert] = useState(null);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    onConfirm: null,
    message: "",
  });
  const [errors, setErrors] = useState({});

  // --- State for Banking Details ---
  const [useGroupBankAccount, setUseGroupBankAccount] = useState(false);
  const [groupHasBankAccount, setGroupHasBankAccount] = useState(false);
  const [groupBankDetailsIncomplete, setGroupBankDetailsIncomplete] =
    useState(false);

  // --- State for Seating Details ---
  const [hasSeatingLayout, setHasSeatingLayout] = useState(false);

  const [isOfflineDateModalOpen, setIsOfflineDateModalOpen] = useState(false);
  const [isOnlineDateModalOpen, setIsOnlineDateModalOpen] = useState(false);
  const [isRecordedDateModalOpen, setIsRecordedDateModalOpen] = useState(false);

  const showAlert = (data) => setAlert({ ...data, show: true });
  const hideAlert = () => setAlert(null);

  // --- State for multi-media preview ---
  const [showExtraMedia, setShowExtraMedia] = useState(false);
  const [poc, setPoc] = useState({
    POC_name: "",
    POC_email: "",
    POC_contact: "",
  });
  const rulesEditorRef = useRef(null);
  const descriptionEditorRef = useRef(null);
  const INITIAL_MAP_LOCATION = {
    lat: 10.5276,
    lng: 76.2144,
    address: "Thrissur, Kerala, India",
  };
  const handleLocationInputChange = (e) => {
    // Just update the form data, don't geocode on every keystroke
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const initialFormState = {
    event_name: "",
    event_category: "",
    event_subcategory: "",
    event_type: "public",
    location_type: "offline",

    location: "",
    venue: "",
    event_language: [],
    min_age_allowed: "",
    seating_arrangement: "none",
    kids_friendly: false,
    pet_friendly: false,
    gate_open_time: false,
    event_instagram_link: "",
    event_youtube_link: "",
    hashtag: [],
    event_dates: [],
    event_date_type: "",
    guests: [],
    event_rules_file: null,
    prohibited_items: [],
    POCS: [],
    payment_type: "free",
    banking_details: [
      {
        bank_acc_type: "",
        bank_acc_holder: "",
        bank_acc_no: "",
        bank_ifsc: "",
      },
    ],
    booking_start_date: "",
    booking_end_date: "",
    ticket_types: [],
    total_capacity: "",
    ticket_layout: null,
    event_banner: null,
    event_logo: null,
    event_images: [],
    exact_map_location: {
      latitude: INITIAL_MAP_LOCATION.lat.toString(),
      longitude: INITIAL_MAP_LOCATION.lng.toString(),
      address: INITIAL_MAP_LOCATION.address,
    },
  };
  const [formData, setFormData] = useState(initialFormState);
  const [previews, setPreviews] = useState({
    ticket_layout: null,
    event_banner: null,
    event_logo: null,
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
  const fetchData = async () => {
    if (!ticketId) {
      console.error("No ticketId available");
      setPageLoading(false);
      return;
    }
    setPageLoading(true);
    if (!ticketId) {
      console.error("No ticketId available for API fetch.");
      setPageLoading(false);
      return;
    }
    try {
      const ticketData = await getTicketById(ticketId);
      setExistingSubEvents(ticketData?.ticket?.sub_events || []);
      setMainEventData(ticketData?.ticket || null);
      try {
        // Add validation to ensure ticketId is properly formatted
        const cleanTicketId = ticketId.toString().trim();
        // Call the API with proper error handling
        const groupResponse = await getGroupView(cleanTicketId);
        // Check if we got a valid response
        if (!groupResponse) {
          console.warn("Empty response from getGroupView API");
          setGroupDefaults();
          return;
        }
        let groupData = null;
        if (groupResponse.data && groupResponse.data.group) {
          groupData = groupResponse.data.group;
        } else if (groupResponse.group) {
          groupData = groupResponse.group;
        } else if (groupResponse.data) {
          groupData = groupResponse.data;
        } else {
          groupData = groupResponse;
        }
        let bankInfo = null;
        if (
          groupData?.primary_bank_acc_holder ||
          groupData?.primary_bank_acc_no ||
          groupData?.primary_bank_ifsc ||
          groupData?.primary_bank_acc_type
        ) {
          bankInfo = {
            bank_acc_holder: groupData.primary_bank_acc_holder,
            bank_acc_no: groupData.primary_bank_acc_no,
            bank_ifsc: groupData.primary_bank_ifsc,
            bank_acc_type: groupData.primary_bank_acc_type,
          };
        }

        // If not found, check in groupResponse directly
        if (
          !bankInfo &&
          (groupResponse?.primary_bank_acc_holder ||
            groupResponse?.primary_bank_acc_no ||
            groupResponse?.primary_bank_ifsc ||
            groupResponse?.primary_bank_acc_type)
        ) {
          bankInfo = {
            bank_acc_holder: groupResponse.primary_bank_acc_holder,
            bank_acc_no: groupResponse.primary_bank_acc_no,
            bank_ifsc: groupResponse.primary_bank_ifsc,
            bank_acc_type: groupResponse.primary_bank_acc_type,
          };
          console.log(
            "Found primary bank info directly in groupResponse:",
            bankInfo
          );
        }

        // If still not found, check traditional banking_details arrays and objects
        if (!bankInfo) {
          const possibleBankPaths = [
            groupData?.banking_details?.[0],
            groupData?.banking_detail?.[0],
            groupData?.bank_details?.[0],
            groupData?.bankDetails?.[0],
            groupData?.banking_details,
            groupData?.banking_detail,
            groupData?.bank_details,
            groupData?.bankDetails,
            // Direct access patterns
            groupResponse?.banking_details?.[0],
            groupResponse?.banking_detail?.[0],
            groupResponse?.bank_details?.[0],
            groupResponse?.bankDetails?.[0],
          ];

          console.log("Searching for bank info in traditional paths...");

          for (let i = 0; i < possibleBankPaths.length; i++) {
            const path = possibleBankPaths[i];
            if (path && typeof path === "object") {
              // If it's an array, take the first element
              if (Array.isArray(path) && path.length > 0) {
                bankInfo = path[0];
                console.log(`Found bank info in array at path ${i}:`, bankInfo);
                break;
              }
              // If it's an object with bank-related properties
              else if (
                path.bank_acc_holder ||
                path.accountHolder ||
                path.holder ||
                path.bank_acc_no ||
                path.accountNumber ||
                path.number ||
                path.primary_bank_acc_holder ||
                path.primary_bank_acc_no
              ) {
                bankInfo = path;
                console.log(`Found bank info object at path ${i}:`, bankInfo);
                break;
              }
            }
          }
        }

        if (!bankInfo) {
          console.warn("No bank information found in group data");
          setGroupDefaults();
          return;
        }
        const cleanBankInfo = {
          bank_acc_type: String(
            bankInfo.bank_acc_type ||
              bankInfo.primary_bank_acc_type ||
              bankInfo.accountType ||
              bankInfo.account_type ||
              bankInfo.type ||
              ""
          ).trim(),
          bank_acc_holder: String(
            bankInfo.bank_acc_holder ||
              bankInfo.primary_bank_acc_holder ||
              bankInfo.accountHolder ||
              bankInfo.account_holder ||
              bankInfo.holder ||
              bankInfo.name ||
              ""
          ).trim(),
          bank_acc_no: String(
            bankInfo.bank_acc_no ||
              bankInfo.primary_bank_acc_no ||
              bankInfo.accountNumber ||
              bankInfo.account_number ||
              bankInfo.number ||
              bankInfo.acc_no ||
              ""
          ).trim(),
          bank_ifsc: String(
            bankInfo.bank_ifsc ||
              bankInfo.primary_bank_ifsc ||
              bankInfo.ifsc ||
              bankInfo.ifscCode ||
              bankInfo.ifsc_code ||
              ""
          ).trim(),
        };
        const hasAnyBankData = Object.values(cleanBankInfo).some(
          (value) => value.length > 0
        );

        if (!hasAnyBankData) {
          console.warn("Bank info object exists but all fields are empty");
          setGroupDefaults();
          return;
        }

        setGroupBankDetails(cleanBankInfo);

        // Check if all required fields are present and not empty
        const hasAllFields =
          cleanBankInfo.bank_acc_holder &&
          cleanBankInfo.bank_acc_no &&
          cleanBankInfo.bank_ifsc &&
          cleanBankInfo.bank_acc_type;
        setGroupHasBankAccount(true);
        setGroupBankDetailsIncomplete(!hasAllFields);

        // If bank details are complete, set toggle to ON by default
        if (hasAllFields) {
          setUseGroupBankAccount(true);
          // Immediately set the form data with group bank details
          setFormData((prev) => ({
            ...prev,
            banking_details: [{ ...cleanBankInfo }],
          }));
        } else {
          console.log("Bank details incomplete, keeping toggle OFF");
          setUseGroupBankAccount(false);
        }
      } catch (groupError) {
        console.error("Error fetching group data:", groupError);

        // Enhanced error logging
        if (groupError.response) {
          console.error("API Response Error:", {
            status: groupError.response.status,
            statusText: groupError.response.statusText,
            data: groupError.response.data,
            headers: groupError.response.headers,
          });

          // Check for specific error cases
          if (groupError.response.status === 404) {
            console.warn(
              "Group not found (404) - this might be expected for some tickets"
            );
          } else if (groupError.response.status === 403) {
            console.warn(
              "Access denied (403) - check permissions for this ticket"
            );
          } else if (groupError.response.status === 500) {
            console.error("Server error (500) - backend issue");
          }
        } else if (groupError.request) {
          console.error(
            "Network Error - no response received:",
            groupError.request
          );
        } else {
          console.error("Request Setup Error:", groupError.message);
        }

        setGroupDefaults();
      }
    } catch (error) {
      console.error("Failed to fetch main ticket data:", error);
      if (error.response) {
        console.error("Ticket API Error:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      }
      setGroupDefaults();
    } finally {
      setPageLoading(false);
      setDataLoaded(true);
    }
  };
  const setGroupDefaults = () => {
    setGroupHasBankAccount(false);
    setGroupBankDetailsIncomplete(false);
    setGroupBankDetails(null);
    setUseGroupBankAccount(false);
  };
  useEffect(() => {
    fetchData();
  }, [ticketId]);

  const resetForm = () => {
    setFormData(initialFormState);
    setPreviews({ ticket_layout: null, event_banner: null, event_logo: null });
    setEditingSubEventId(null);
    setIsEditingSubEvent(false);
    if (rulesEditorRef.current) rulesEditorRef.current.innerHTML = "";
    if (descriptionEditorRef.current)
      descriptionEditorRef.current.innerHTML = "";
  };
  useEffect(() => {
    if (ticketId) {
      fetchData();
    } else {
      console.error("No ticketId available, skipping data fetch");
    }
  }, [ticketId]);
  const renderBankingSection = () => {
    if (pageLoading) {
      return (
        <div className="space-y-4">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-64 rounded"></div>
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 w-full rounded"></div>
        </div>
      );
    }

    return (
      <div className="space-y-12 animate-fade-in">
        <section className="bg-white dark:bg-[#2B2B2B] p-8 rounded-lg space-y-6 shadow-sm dark:shadow-none">
          {/* Debug info panel (remove in production) */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs">
            <p>
              <strong>Debug Info:</strong>
            </p>
            <p>TicketId: {ticketId}</p>
            <p>Group Has Bank Account: {String(groupHasBankAccount)}</p>
            <p>Bank Details Incomplete: {String(groupBankDetailsIncomplete)}</p>
            <p>Use Group Account: {String(useGroupBankAccount)}</p>
            <p>Bank Details Available: {String(Boolean(groupBankDetails))}</p>
          </div>

          {/* Rest of your banking section JSX */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label
                className={`font-medium text-md ${
                  groupHasBankAccount && !groupBankDetailsIncomplete
                    ? "text-gray-900 dark:text-white"
                    : "text-black dark:text-gray-400"
                }`}
              >
                Do you want to use the bank account used for group creation?
              </label>
              {/* ... rest of your existing JSX ... */}
            </div>
          </div>
          {/* ... rest of your banking section JSX ... */}
        </section>
      </div>
    );
  };
  // FIX: Refined useEffect to correctly apply group bank details when toggled
  useEffect(() => {
    if (
      useGroupBankAccount &&
      groupBankDetails &&
      !groupBankDetailsIncomplete
    ) {
      setFormData((prev) => ({ ...prev, banking_details: [groupBankDetails] }));
    }
  }, [useGroupBankAccount, groupBankDetails, groupBankDetailsIncomplete]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "total_capacity" || name === "min_age_allowed") {
      console.log(`Input changed: ${name}, Raw value from input: '${value}'`);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (selectedOptions, { name }) => {
    // For multi-select, selectedOptions is an array of objects. Map over it to get values.
    // For single-select, it's a single object.
    const value = Array.isArray(selectedOptions)
      ? selectedOptions.map((option) => option.value)
      : selectedOptions
      ? selectedOptions.value
      : "";

    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "event_category") {
        newData.event_subcategory = "";
      }
      return newData;
    });
  };
  const handleOpenDateModal = () => {
    const type = formData.location_type;
    if (type === "offline") setIsOfflineDateModalOpen(true);
    else if (type === "online") setIsOnlineDateModalOpen(true);
    else if (type === "recorded") setIsRecordedDateModalOpen(true);
    else {
      showAlert({
        type: "error",
        message: "Select Location Type",
        description: "Please select a location type before adding dates.",
      });
    }
  };

  const handleLocationTypeChange = (type) => {
    setFormData((prev) => ({ ...prev, location_type: type.toLowerCase() }));
  };

  const handleToggleChange = (name) => {
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleTagChange = (name, newTags) => {
    setFormData((prev) => ({ ...prev, [name]: newTags }));
  };

  const handleDatesSave = (newDates, dateType) => {
    setFormData((prev) => ({
      ...prev,
      event_dates: newDates,
      event_date_type: dateType,
    }));
  };

  const removeDate = (dateToRemove) => {
    setFormData((prev) => ({
      ...prev,
      event_dates: prev.event_dates.filter((d) => d.date !== dateToRemove),
    }));
  };

  const handleGuestsSave = (newGuests) => {
    setFormData((prev) => ({ ...prev, guests: newGuests }));
  };

  const handleEditGuest = (guest) => {
    setEditingGuest(guest);
    setIsGuestModalOpen(true);
  };

  const handleFormat = (command, ref) => {
    if (ref.current) {
      document.execCommand(command, false, null);
      ref.current.focus();
    }
  };

  const handleProhibitedItemsSave = (newItems) => {
    setFormData((prev) => ({ ...prev, prohibited_items: newItems }));
  };

  const removeProhibitedItem = (itemToRemove) => {
    setFormData((prev) => ({
      ...prev,
      prohibited_items: prev.prohibited_items.filter(
        (item) => item !== itemToRemove
      ),
    }));
  };

  const handlePocChange = (e) => {
    setPoc({ ...poc, [e.target.name]: e.target.value });
  };

  const handleAddPoc = () => {
    // Trim input values once for consistency
    const trimmedName = poc.POC_name.trim();
    const trimmedEmail = poc.POC_email.trim();
    const trimmedContact = poc.POC_contact.trim();

    // 1. Check for empty fields
    if (!trimmedName || !trimmedEmail || !trimmedContact) {
      alert(
        "Please fill in all Point of Contact fields: Name, Email, and Contact Number."
      );
      return; // Exit if fields are empty
    }

    // 2. Check for duplicate email
    const isDuplicateEmail = formData.POCS.some(
      (p) => p.POC_email === trimmedEmail
    );
    if (isDuplicateEmail) {
      alert(
        "This email address is already in use by another POC. Please use a different email."
      );
      return; // Exit if email is a duplicate
    }

    // 3. Check for duplicate contact number
    const isDuplicateContact = formData.POCS.some(
      (p) => p.POC_contact === trimmedContact
    );
    if (isDuplicateContact) {
      alert(
        "This contact number is already in use by another POC. Please use a different number."
      );
      return; // Exit if contact is a duplicate
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

  const handleMediaFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, [type]: file }));
      setPreviews((prev) => ({ ...prev, [type]: URL.createObjectURL(file) }));
    }
  };

  const removeMediaFile = (type) => {
    setFormData((prev) => ({ ...prev, [type]: null }));
    setPreviews((prev) => ({ ...prev, [type]: null }));
  };

  const handleMultiMediaChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length === 0) return;

    setFormData((prev) => {
      const currentFiles = prev.event_images;
      const filesToAdd = newFiles.slice(0, 10 - currentFiles.length);
      if (newFiles.length > filesToAdd.length) {
        alert(
          `You can only upload a maximum of 10 images. ${filesToAdd.length} were added.`
        );
      }
      return { ...prev, event_images: [...currentFiles, ...filesToAdd] };
    });
    e.target.value = "";
  };

  const handleRemoveLastImage = () => {
    setFormData((prev) => {
      const updatedImages = prev.event_images.slice(0, -1);
      if (updatedImages.length < 2) setShowExtraMedia(false);
      return { ...prev, event_images: updatedImages };
    });
  };

  const handleSaveOrUpdateTickets = (updatedTickets) => {
    setFormData((prev) => ({ ...prev, ticket_types: updatedTickets }));
  };

  const handleDeleteTicket = (ticketIdToDelete) => {
    setFormData((prev) => ({
      ...prev,
      ticket_types: prev.ticket_types.filter((t) => t.id !== ticketIdToDelete),
    }));
  };

  const handleBankingDetailChange = (index, event) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      const newBankingDetails = [...prev.banking_details];
      // Ensure the object exists
      if (!newBankingDetails[index]) {
        newBankingDetails[index] = {
          bank_acc_type: "",
          bank_acc_holder: "",
          bank_acc_no: "",
          bank_ifsc: "",
        };
      }
      newBankingDetails[index] = {
        ...newBankingDetails[index],
        [name]: value || "", // Ensure never undefined
      };
      return { ...prev, banking_details: newBankingDetails };
    });
  };
  const validateForm = () => {
    const newErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // --- Basic Info ---
    if (!formData.event_name.trim())
      newErrors.event_name = "Event name is required.";
    if (!formData.event_category)
      newErrors.event_category = "Event category is required.";
    if (!formData.event_subcategory)
      newErrors.event_subcategory = "Event subcategory is required.";

    // --- Date Validations ---
    if (formData.event_dates.length === 0) {
      newErrors.event_dates = "At least one event date is required.";
    }

    // --- Location Specific Validations ---
    if (formData.location_type === "offline") {
      if (!formData.location.trim())
        newErrors.location = "Location is required for offline events.";
      if (!formData.venue.trim())
        newErrors.venue = "Venue is required for offline events.";
      if (!formData.seating_arrangement)
        newErrors.seating_arrangement =
          "Seating arrangement is required for offline events.";
    } else {
      // Online or Recorded

      if (!formData.total_capacity)
        newErrors.total_capacity =
          "Maximum capacity is required for online/recorded events.";
    }

    // --- Ticketing (if applicable) ---
    if (formData.payment_type === "paid") {
      if (!formData.booking_start_date)
        newErrors.booking_start_date = "Booking start date is required.";
      if (!formData.booking_end_date)
        newErrors.booking_end_date = "Booking end date is required.";

      if (
        formData.booking_start_date &&
        new Date(formData.booking_start_date) < today
      ) {
        newErrors.booking_start_date =
          "Booking start date cannot be in the past.";
      }
      if (formData.event_dates.length > 0 && formData.booking_end_date) {
        const sortedDates = [...formData.event_dates].sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        const earliestEventDate = new Date(sortedDates[0].date);
        earliestEventDate.setHours(0, 0, 0, 0);
        if (new Date(formData.booking_end_date) > earliestEventDate) {
          newErrors.booking_end_date =
            "Booking end date cannot be after the event starts.";
        }
      }
    }

    // --- URL Validations ---
    const youtubeRegex =
      /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([a-zA-Z0-9_-]{11})/;
    if (
      formData.event_youtube_link &&
      !youtubeRegex.test(formData.event_youtube_link)
    ) {
      newErrors.event_youtube_link = "Invalid YouTube URL format.";
    }
    const instagramRegex =
      /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9._]{1,30}\/?/;
    if (
      formData.event_instagram_link &&
      !instagramRegex.test(formData.event_instagram_link)
    ) {
      newErrors.event_instagram_link = "Invalid Instagram URL format.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Show an alert with the first error found
      showAlert({
        type: "error",
        message: "Validation Failed",
        description: Object.values(newErrors)[0],
      });
      return false;
    }

    return true;
  };
  const convertTo24Hour = (time12h, ampm) => {
    if (!time12h || !ampm) return "";
    const [hours, minutes] = time12h.split(":");
    let hour24 = parseInt(hours, 10);
    if (ampm === "AM" && hour24 === 12) hour24 = 0;
    if (ampm === "PM" && hour24 !== 12) hour24 += 12;
    return `${hour24.toString().padStart(2, "0")}:${minutes}`;
  };
  const buildPayload = () => {
    if (formData.location_type === "online" || formData.location_type === "recorded") {
      for (const date of formData.event_dates) {
        if (!date.eventLink || date.eventLink.trim() === "") {
          showAlert({
            type: "error",
            message: "Event Link Missing",
            description: `An event link is required for the date: ${new Date(
              date.date + "T00:00:00"
            ).toLocaleDateString()}. Please edit the date to add a link.`,
          });
          return null;
        }
      }
    }

    const eventDateTypeMap = {
      "Single day": "one-day",
      "Multi days": "multi-day",
      Weekly: "weekly",
    };

    const payload = {
      event_name: formData.event_name,
      event_category: formData.event_category,
      event_subcategory: formData.event_subcategory,
      event_type: formData.event_type,
      event_language: formData.event_language,
      min_age_allowed: parseInt(formData.min_age_allowed, 10) || 0,
      kids_friendly: formData.kids_friendly,
      pet_friendly: formData.pet_friendly,
      location_type: formData.location_type,
      event_date_type: eventDateTypeMap[formData.event_date_type] || "one-day",
      event_dates: formData.event_dates.map((d) => {
        // Ensure event_link has proper protocol for online/recorded events
        let eventLink = d.eventLink || "";
        if (eventLink && !eventLink.startsWith('http://') && !eventLink.startsWith('https://')) {
          eventLink = 'https://' + eventLink;
        }
        
        return {
          start_date: d.date,
          end_date: d.endDate || d.date,
          start_time: convertTo24Hour(d.startTime, d.startAmPm),
          end_time: convertTo24Hour(d.endTime, d.endAmPm),
          event_link: eventLink,
          video_name: d.videoName || "",
          verification_event_code: d.verificationCode || "",
          // Note: video_file_path and preview_image_path will be added by the backend
          // from the uploaded files, so we don't include them here
        };
      }),
      event_instagram_link: formData.event_instagram_link,
      event_youtube_link: formData.event_youtube_link,
      event_description: descriptionEditorRef.current?.innerHTML || "",
      event_rules_text: rulesEditorRef.current?.innerHTML || "",
      hashtag: JSON.stringify(formData.hashtag),
      prohibited_items: JSON.stringify(formData.prohibited_items),
      payment_type: formData.payment_type,
      POCS: formData.POCS,
      guests: formData.guests.map((g) => ({
        guest_name: g.name,
        guest_link: g.link,
      })),
      booking_start_date: formData.booking_start_date,
      booking_end_date: formData.booking_end_date,
    };

    if (formData.payment_type === "paid") {
      payload.banking_details = formData.banking_details;
      payload.ticket_types = formData.ticket_types.map((t) => ({
        ticket_type: t.name,
        ticket_price: Number(t.price),
        max_capacity: Number(t.capacity),
      }));
    }

    if (formData.location_type === "offline") {
      payload.location = formData.location;
      payload.venue = formData.venue;
      payload.seating_arrangement = formData.seating_arrangement;
      payload.exact_map_location = formData.exact_map_location;
      payload.gate_open_time = formData.gate_open_time;
      payload.total_capacity = formData.total_capacity;
    } else {
      payload.total_capacity = parseInt(formData.total_capacity, 10) || 0;
    }

    console.log('=== Generated Payload ===');
    console.log(JSON.stringify(payload, null, 2));

    return payload;
  };
  const buildFormData = (payload) => {
    const submissionForm = new FormData();
    submissionForm.append("sub_event", JSON.stringify(payload));
    if (formData.event_banner) {
      submissionForm.append("event_banner", formData.event_banner);
    }
    if (formData.event_logo) {
      submissionForm.append("event_logo", formData.event_logo);
    }
    if (formData.event_rules_file) {
      submissionForm.append("event_rules", formData.event_rules_file);
    }
    if (formData.ticket_layout) {
      submissionForm.append("ticket_layout", formData.ticket_layout);
    }
    formData.event_images.forEach((file) => {
      submissionForm.append("event_images", file);
    });
    formData.guests.forEach((guest, index) => {
      if (guest.rawFile) {
        submissionForm.append(`guest_profile_${index}`, guest.rawFile);
      }
    });
    // Add video files for recorded events
    if (formData.location_type === "recorded" && formData.event_dates) {
      formData.event_dates.forEach((date, index) => {
        // Add video file if it exists
        if (date.videoFile) {
          submissionForm.append(`video_file_${index}`, date.videoFile);
          console.log(`Adding video file ${index}:`, date.videoFile.name);
        }
        
        // Add preview image if it exists
        if (date.previewImageFile) {
          submissionForm.append(`preview_image_${index}`, date.previewImageFile);
          console.log(`Adding preview image ${index}:`, date.previewImageFile.name);
        }
      });
    }
    
    // Add ticket photos for offline paid events
    if (formData.location_type === "offline" && formData.payment_type === "paid") {
      formData.ticket_types.forEach((ticket, index) => {
        if (ticket.photoFile) {
          submissionForm.append(`ticket_photo_${index}`, ticket.photoFile);
        }
      });
    }
    
    // Log FormData for debugging (optional, remove in production)
    console.log('=== FormData Contents ===');
    for (let pair of submissionForm.entries()) {
      if (pair[1] instanceof File) {
        console.log(pair[0], ':', pair[1].name, `(${pair[1].size} bytes)`);
      } else {
        console.log(pair[0], ':', typeof pair[1] === 'string' ? pair[1].substring(0, 100) + '...' : pair[1]);
      }
    }
    
    return submissionForm;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // First, check if there is anything in the form. If not, and no events exist, show error.
    if (formData.event_name.trim() === "" && existingSubEvents.length === 0) {
      showAlert({
        type: "error",
        message: "No Sub-Events",
        description:
          "Please fill out the form to add at least one sub-event before continuing.",
      });
      return;
    }

    // If the form has data, validate and save it first.
    if (formData.event_name.trim() !== "") {
      if (!validateForm()) {
        return; // Stop if validation fails
      }

      setIsSubmitting(true);
      try {
        const payload = buildPayload();
        const submissionForm = buildFormData(payload);

        if (isEditingSubEvent && editingSubEventId) {
          await updateSubEvent(ticketId, editingSubEventId, submissionForm);
        } else {
          await updateTicketAddOns(ticketId, submissionForm);
        }

        // Only if save is successful, then navigate
        navigate(`/ticket/ticket-terms/${ticketId}`);
      } catch (error) {
        const errorDesc =
          error.response?.data?.message || "An error occurred while saving.";
        showAlert({
          type: "error",
          message: "Save Failed",
          description: errorDesc,
        });
      } finally {
        setIsSubmitting(false);
      }
    } else if (existingSubEvents.length > 0) {
      // If the form is empty but events already exist, just navigate
      navigate(`/ticket/ticket-terms/${ticketId}`);
    }
  };
  const handleBack = (e) => {
    e.preventDefault();

    navigate(`/ticket/update-ticket-media/${ticketId}`);
  };
  const currentBankDetail = formData.banking_details[0] || {};
  const [dataLoaded, setDataLoaded] = useState(false);
  const saveFormDataToStorage = (data) => {
    try {
      const { ...dataToSave } = data; // File objects can't be stored
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Error saving data to localStorage:", error);
    }
  };
  useEffect(() => {
    if (formData.event_name || formData.location) {
      saveFormDataToStorage(formData);
    }
  }, [formData]);
  useEffect(() => {
    if (!pageLoading && !isEditMode) {
      saveFormDataToStorage(formData);
    }
  }, [formData, pageLoading, isEditMode]);
  useEffect(() => {
    const callbackName = "initMapCallback";
    window[callbackName] = () => setIsApiReady(true);
    const scriptId = "google-maps-script";

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      const apiKey = import.meta.env.VITE_GOOGLE_MAP_API;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else if (window.google) {
      setIsApiReady(true);
    }

    return () => {
      delete window[callbackName];
    };
  }, []);
  useEffect(() => {
    setDataLoaded(true);
  }, []);
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

      // Ensure map renders properly with resize trigger
      setTimeout(() => {
        if (mapInstance && mapRef.current) {
          window.google.maps.event.trigger(mapInstance, "resize");
          mapInstance.setCenter(initialCenter);
          mapInstance.setZoom(15);
        }
      }, 100);
    };

    initializeMap();
  }, [isApiReady, formData.location_type, dataLoaded]);
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
    if (
      !formData.location ||
      !isApiReady ||
      !window.google ||
      formData.location_type !== "offline" ||
      !map
    ) {
      return;
    }
    const geocodeTimeout = setTimeout(() => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: formData.location }, (results, status) => {
        if (status === "OK" && results[0] && markerRef.current) {
          const { lat, lng } = results[0].geometry.location;
          const newPosition = { lat: lat(), lng: lng() };

          // Only update coordinates, not the location field to avoid conflicts
          setFormData((prev) => ({
            ...prev,
            exact_map_location: {
              latitude: lat().toString(),
              longitude: lng().toString(),
              address: results[0].formatted_address,
            },
          }));

          map.setCenter(newPosition);
          map.setZoom(15);
          markerRef.current.setPosition(newPosition);
        }
      });
    }, 1500); // Wait 1.5 seconds after user stops typing

    return () => clearTimeout(geocodeTimeout);
  }, [formData.location, isApiReady, map, formData.location_type]);
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
  useEffect(() => {
    if (formData.payment_type === "paid" && renderBankingSection()) {
      // Ensure banking_details is always defined when payment is paid
      if (!formData.banking_details || formData.banking_details.length === 0) {
        if (useGroupBankAccount && groupBankDetails) {
          setFormData((prev) => ({
            ...prev,
            banking_details: [{ ...groupBankDetails }],
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            banking_details: [
              {
                bank_acc_type: "",
                bank_acc_holder: "",
                bank_acc_no: "",
                bank_ifsc: "",
              },
            ],
          }));
        }
      }
    }
  }, [formData.payment_type, useGroupBankAccount, groupBankDetails]);
  const getCurrentBankDetail = () => {
    return (
      formData.banking_details?.[0] || {
        bank_acc_type: "",
        bank_acc_holder: "",
        bank_acc_no: "",
        bank_ifsc: "",
      }
    );
  };
  const handleUseGroupBankAccountToggle = () => {
    if (!groupHasBankAccount || groupBankDetailsIncomplete) {
      return;
    }

    const newToggleState = !useGroupBankAccount;
    setUseGroupBankAccount(newToggleState);

    if (newToggleState && groupBankDetails) {
      // Use group bank details
      setFormData((prev) => ({
        ...prev,
        banking_details: [{ ...groupBankDetails }],
      }));
    } else {
      // Reset to empty but controlled fields
      setFormData((prev) => ({
        ...prev,
        banking_details: [
          {
            bank_acc_type: "",
            bank_acc_holder: "",
            bank_acc_no: "",
            bank_ifsc: "",
          },
        ],
      }));
    }
  };
  const handleSaveAndAddMore = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    // ADD THIS CHECK
    const payload = buildPayload();
    if (!payload) {
      setIsSubmitting(false); // Stop processing if payload validation failed
      return;
    }

    try {
      // REMOVED: const payload = buildPayload();
      const submissionForm = buildFormData(payload);

      console.log("Submitting Payload:", JSON.stringify(payload, null, 2));

      if (isEditingSubEvent && editingSubEventId) {
        await updateSubEvent(ticketId, editingSubEventId, submissionForm);
      } else {
        await updateTicketAddOns(ticketId, submissionForm);
      }

      showAlert({
        type: "success",
        message: `Sub-Event ${isEditingSubEvent ? "Updated" : "Added"}`,
        description: "Your sub-event has been saved successfully.",
      });
      resetForm();
      await fetchData();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const errorDesc = error.response?.data?.message || "An error occurred.";
      showAlert({
        type: "error",
        message: "Submission Failed",
        description: errorDesc,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSubEventClick = async (subEventId) => {
    setEditingSubEventId(subEventId);
    setIsEditingSubEvent(true);
    await populateFormWithSubEventData(subEventId);

    // Scroll to form
    window.scrollTo({ top: 400, behavior: "smooth" });
  };
  const populateFormWithSubEventData = async (subEventId) => {
    setSubEventLoading(true);
    try {
      const subEvent = existingSubEvents.find(
        (event) => event._id === subEventId
      );
      console.log("Loading data for this sub-event:", subEvent);

      if (subEvent) {
        // Map event dates with proper format conversion
        const mappedEventDates =
          subEvent.event_dates?.map((date) => {
            // Convert 24-hour format to 12-hour format for display
            const convertTo12Hour = (time24h) => {
              if (!time24h) return { time: "", ampm: "" };
              const [hours, minutes] = time24h.split(":");
              let hour12 = parseInt(hours);
              const ampm = hour12 >= 12 ? "PM" : "AM";
              if (hour12 === 0) hour12 = 12;
              else if (hour12 > 12) hour12 -= 12;
              return {
                time: `${hour12.toString().padStart(2, "0")}:${minutes}`,
                ampm: ampm,
              };
            };

            const startTime12 = convertTo12Hour(date.start_time);
            const endTime12 = convertTo12Hour(date.end_time);

            return {
              date: date.start_date,
              endDate: date.end_date || date.start_date,
              startTime: startTime12.time,
              endTime: endTime12.time,
              startAmPm: startTime12.ampm,
              endAmPm: endTime12.ampm,
              // Keep original 24-hour format for backend compatibility
              startTime24h: date.start_time,
              endTime24h: date.end_time,
              eventLink: date.event_link || "",
              videoName: date.video_name || "",
              verificationCode: date.verification_event_code || "",
            };
          }) || [];

        // Convert event_date_type from backend format to frontend format
        const eventDateTypeMap = {
          "one-day": "Single day",
          "multi-day": "Multi days",
          weekly: "Weekly",
        };

        setFormData((prev) => ({
          ...prev,
          event_name: subEvent.event_name || "",
          event_category: subEvent.event_category || "",
          event_subcategory: subEvent.event_subcategory || "",
          event_type: subEvent.event_type || "public",
          location_type: subEvent.location_type || "offline", // FIX: Ensure location_type is set

          location: subEvent.location || "",
          venue: subEvent.venue || "",
          event_language: Array.isArray(subEvent.event_language)
            ? subEvent.event_language
            : subEvent.event_language
            ? [subEvent.event_language]
            : [],
          min_age_allowed: subEvent.min_age_allowed || "",
          seating_arrangement: subEvent.seating_arrangement || "none",
          kids_friendly: subEvent.kids_friendly || false,
          pet_friendly: subEvent.pet_friendly || false,
          event_instagram_link: subEvent.event_instagram_link || "",
          event_youtube_link: subEvent.event_youtube_link || "",
          hashtag: Array.isArray(subEvent.hashtag)
            ? subEvent.hashtag
            : typeof subEvent.hashtag === "string"
            ? JSON.parse(subEvent.hashtag || "[]")
            : [],
          event_dates: mappedEventDates,
          event_date_type:
            eventDateTypeMap[subEvent.event_date_type] || "Single day",
          gate_open_time: Boolean(subEvent.gate_open_time),
          guests:
            subEvent.guests?.map((g) => ({
              id: Date.now() + Math.random(),
              name: g.guest_name,
              link: g.guest_link,
              image:
                g.guest_image || `https://i.pravatar.cc/150?u=${Date.now()}`,
              rawFile: null,
            })) || [],
          prohibited_items: Array.isArray(subEvent.prohibited_items)
            ? subEvent.prohibited_items
            : typeof subEvent.prohibited_items === "string"
            ? JSON.parse(subEvent.prohibited_items || "[]")
            : [],
          POCS: subEvent.POCS || [],
          payment_type: subEvent.payment_type || "free",
          banking_details: subEvent.banking_details || [
            {
              bank_acc_type: "",
              bank_acc_holder: "",
              bank_acc_no: "",
              bank_ifsc: "",
            },
          ],
          booking_start_date: subEvent.booking_start_date || "",
          booking_end_date: subEvent.booking_end_date || "",
          ticket_types:
            subEvent.ticket_types?.map((t) => ({
              id: Date.now() + Math.random(),
              name: t.ticket_type,
              price: t.ticket_price,
              capacity: t.max_capacity,
              image:
                t.ticket_image || `https://i.pravatar.cc/150?u=${Date.now()}`,
              photoFile: null,
            })) || [],
          total_capacity: subEvent.total_capacity || "",
          exact_map_location: subEvent.exact_map_location || {
            latitude: INITIAL_MAP_LOCATION.lat.toString(),
            longitude: INITIAL_MAP_LOCATION.lng.toString(),
            address: INITIAL_MAP_LOCATION.address,
          },
        }));

        // FIX: Set media previews - use URLs from backend
        setPreviews((prev) => ({
          ...prev,
          event_banner: subEvent.event_banner || null,
          event_logo: subEvent.event_logo || null,
          ticket_layout: subEvent.ticket_layout || null,
        }));

        // Handle multiple event images
        if (subEvent.event_images && subEvent.event_images.length > 0) {
          setFormData((prev) => ({
            ...prev,
            event_images: [],
          }));

          if (subEvent.event_images.length > 1) {
            setShowExtraMedia(true);
          }
        }

        // FIX: Set content for rich text editors
        if (descriptionEditorRef.current) {
          descriptionEditorRef.current.innerHTML =
            subEvent.event_description || "";
        }
        if (rulesEditorRef.current) {
          rulesEditorRef.current.innerHTML = subEvent.event_rules_text || "";
        }

        // Set seating layout toggle if ticket_layout exists
        if (subEvent.ticket_layout) {
          setHasSeatingLayout(true);
        }

        // Handle gate opening time
        if (subEvent.gate_open_time) {
          const gateTimeParts = subEvent.gate_open_time.split(":");
          if (gateTimeParts.length >= 2) {
            let hour = parseInt(gateTimeParts[0]);
            const minute = gateTimeParts[1];
            const ampm = hour >= 12 ? "PM" : "AM";
            if (hour === 0) hour = 12;
            else if (hour > 12) hour -= 12;

            setFormData((prev) => ({
              ...prev,
              gate_open_hour: hour.toString(),
              gate_open_minute: minute,
              gate_open_ampm: ampm,
              gate_open_time: true,
            }));
          }
        }

        console.log("Sub-event data loaded successfully:", subEvent);
      }
    } catch (error) {
      console.error("Error loading sub-event data:", error);
      alert("Failed to load sub-event data");
    } finally {
      setSubEventLoading(false);
    }
  };
  const mainEventStartDate = mainEventData?.event_dates?.[0]?.start_date;

  const mainEventEndDate =
    mainEventData?.event_dates?.[mainEventData.event_dates.length - 1]
      ?.end_date;
  return (
    <>
      <CustomScrollbarStyles isDark={darkMode} />
      {/* All modals go here */}

      <Alert alert={alert} onClose={hideAlert} />
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false })}
        onConfirm={confirmState.onConfirm}
        title="Confirm Action"
        message={confirmState.message}
        darkMode={darkMode}
      />

      <DatePickerModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        onSave={handleDatesSave}
        initialDates={formData.event_dates}
        darkMode={darkMode}
        minDate={mainEventStartDate} // ADD THIS PROP
        maxDate={mainEventEndDate} // ADD THIS PROP
        showAlert={showAlert}
      />

      <OnlineDatePickerModal
        isOpen={isOnlineDateModalOpen}
        onClose={() => setIsOnlineDateModalOpen(false)}
        onSave={handleDatesSave}
        initialDates={formData.event_dates}
        darkMode={darkMode}
        showAlert={showAlert}
        minDate={mainEventStartDate} // ADD THIS PROP
        maxDate={mainEventEndDate}
      />
      <RecordedDatePickerModal
        isOpen={isRecordedDateModalOpen}
        onClose={() => setIsRecordedDateModalOpen(false)}
        onSave={handleDatesSave}
        initialDates={formData.event_dates}
        darkMode={darkMode}
        showAlert={showAlert}
        minDate={mainEventStartDate} // ADD THIS PROP
        maxDate={mainEventEndDate}
      />
      <DatePickerModal
        isOpen={isOfflineDateModalOpen}
        onClose={() => setIsOfflineDateModalOpen(false)}
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
        showAlert={showAlert}
      />
      <ProhibitedItemsModal
        isOpen={isProhibitedModalOpen}
        onClose={() => setIsProhibitedModalOpen(false)}
        onSave={handleProhibitedItemsSave}
        initialItems={formData.prohibited_items}
        darkMode={darkMode}
        showAlert={showAlert}
      />
      <CreateTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        onSave={handleSaveOrUpdateTickets}
        editingTicket={editingTicket}
        existingTickets={formData.ticket_types}
        showAlert={showAlert}
      />

      <div className={`${darkMode ? "dark" : ""}`}>
        <div className="bg-white dark:bg-[#212426] text-gray-800 dark:text-white min-h-screen flex">
          <EventSidebar
            darkMode={darkMode}
            onBackClick={handleBack} // Your existing back function
            // Pass props from your 'mainEventData' state object
            formProgress={mainEventData?.form_progress || {}}
            groupId={mainEventData?.groupId}
            ticketId={ticketId}
            check={true} //
          />
          <main className="flex-1 relative p-4 sm:p-6 md:p-8 overflow-y-auto">
            <div className="absolute top-6 right-6 z-10">
              <ThemeToggle
                isDark={darkMode}
                onToggle={() => setDarkMode(!darkMode)}
              />
            </div>

            <div className="w-full max-w-5xl mx-auto">
              <header className="text-center mt-4 mb-12">
                <div
                  className={`w-20 h-20 rounded-full mx-auto my-4  flex items-center justify-center ${
                    darkMode
                      ? "bg-[#1E1242] text-gray-300"
                      : "bg-[#1E1242] text-gray-300"
                  }`}
                >
                  <img src={Addon_Form_Icon} alt="h-15 w-15" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  Add Extra Shows / Add Multiples Events
                </h1>
                <p className="text-black dark:text-gray-400">
                  Add and manage all the sub-events associated with your main
                  ticket.
                </p>
              </header>
              {isEditingSubEvent && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-800 dark:text-blue-200 font-medium">
                        Editing Sub-Event:{" "}
                        {formData.event_name || "Untitled Event"}
                      </p>
                      <p className="text-blue-600 dark:text-blue-300 text-sm">
                        Make your changes below and click "Save and continue" or
                        "Add more sub events"
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel Edit
                    </button>
                  </div>
                </div>
              )}
              <div className="mb-12">
                <h2 className="text-xl font-semibold mb-4">
                  Your Existing Events
                </h2>
                {loading ? (
                  <p>Loading events...</p>
                ) : (
                  <>
                    {existingSubEvents.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {existingSubEvents.map((event, index) => (
                          <div
                            key={index}
                            onClick={() => handleSubEventClick(event._id)}
                            className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg overflow-hidden shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-white"
                          >
                            <div className="p-4 flex items-center">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1 truncate">
                                  {event.event_name}
                                </h3>
                                <p className="text-sm opacity-90 mb-2">
                                  {event.event_category}
                                </p>
                                {/* Optional: Add more details */}
                                {event.event_dates &&
                                  event.event_dates.length > 0 && (
                                    <p className="text-xs opacity-80">
                                      {new Date(
                                        event.event_dates[0].start_date
                                      ).toLocaleDateString()}
                                    </p>
                                  )}
                              </div>
                              {/* Edit icon */}
                              <div className="ml-3">
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-black dark:text-gray-400">
                        No sub-events have been added yet.
                      </p>
                    )}

                    {/* Add Another Event Button */}
                    {existingSubEvents.length > 0 && !isEditingSubEvent && (
                      <div className="mt-6 flex justify-center">
                        <button
                          type="button"
                          onClick={resetForm}
                          className="px-8 py-3 rounded-lg font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                        >
                          + Add Another Event
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
              {/* --- FORM START --- */}
              <form className="space-y-12" onSubmit={handleSubmit}>
                {/* --- EVENT DETAILS SECTION --- */}
                <div className="space-y-8">
                  {/*... Other input fields like event_name, category etc. (No changes needed) ...*/}
                  <div>
                    <FormInput
                      label="Event name"
                      placeholder="Event name"
                      name="event_name"
                      value={formData.event_name}
                      onChange={handleInputChange}
                      required
                      darkMode={darkMode}
                      error={errors.event_name}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label
                        htmlFor="event_category"
                        className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2"
                      >
                        Event category<span className="text-red-400">*</span>
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
                          styles={CustomSelectStyles(darkMode, errors)}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="event_subcategory"
                        className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2"
                      >
                        Event subcategory<span className="text-red-400">*</span>
                      </label>
                      <Select
                        name="event_subcategory"
                        options={subCategoryOptions}
                        value={subCategoryOptions.find(
                          (option) =>
                            option.value === formData.event_subcategory
                        )}
                        onChange={handleSelectChange}
                        placeholder="Select subcategory"
                        styles={CustomSelectStyles(darkMode, errors)}
                        isDisabled={!formData.event_category}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2">
                      Event type<span className="text-red-400">*</span>
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
                          <span className="w-1.5 h-1.5 rounded-full bg-white opacity-0 peer-checked:opacity-100"></span>
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
                          <span className="w-1.5 h-1.5 rounded-full bg-white opacity-0 peer-checked:opacity-100"></span>
                        </span>
                        <span className="ml-2">Private</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* --- LOCATION SECTION --- */}
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
                        <div>
                          <label
                            htmlFor="location"
                            className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2"
                          >
                            Event location
                            <span className="text-red-400">*</span>
                          </label>
                          <input
                            ref={autocompleteRef}
                            id="location"
                            name="location"
                            type="text"
                            value={formData.location}
                            onChange={handleLocationInputChange}
                            placeholder="Search for location..."
                            className="w-full px-4 py-3 bg-transparent border rounded-lg text-gray-800 dark:text-white border-black dark:border-[#4A4A4A] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50"
                          />
                        </div>
                        <FormInput
                          label="Event venue"
                          id="venue"
                          name="venue"
                          value={formData.venue}
                          onChange={handleInputChange}
                          placeholder="Enter the event venue"
                          error={errors.venue}
                          required
                          darkMode={darkMode}
                        />
                      </div>

                      <div className="relative">
                        <label className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2">
                          Exact map location
                          <span className="text-red-400">*</span>
                          <InfoTooltip note="Click on the map to set exact location. Drag the marker to adjust." />
                        </label>
                        <div
                          ref={mapRef}
                          className="w-full h-80 rounded-lg border bg-gray-200 dark:bg-gray-800 border-black dark:border-[#4A4A4A]"
                          style={{
                            minHeight: "320px",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          {!isApiReady && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                              <div className="text-black dark:text-gray-400">
                                Loading map...
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-black dark:text-gray-400">
                          Click anywhere on the map or drag the marker to set
                          the exact location. You can also search in the
                          location field above.
                        </div>
                      </div>

                      {formData.exact_map_location.latitude &&
                        formData.exact_map_location.longitude && (
                          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Selected Location:</strong>
                            </div>
                            <div className="text-xs text-black dark:text-gray-500 mt-1">
                              Lat: {formData.exact_map_location.latitude}, Lng:{" "}
                              {formData.exact_map_location.longitude}
                            </div>
                            {formData.exact_map_location.address && (
                              <div className="text-xs text-black dark:text-gray-500 mt-1">
                                Address: {formData.exact_map_location.address}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  )}

                  {(formData.location_type === "online" ||
                    formData.location_type === "recorded") && (
                    <div className="space-y-8 animate-fade-in">
                      {/* Event Link Input (remains the same) */}

                      <FormInput
                        label="Maximum number of people allowed (capacity)?"
                        id="total_capacity"
                        name="total_capacity"
                        type="number"
                        value={formData.total_capacity}
                        onChange={handleInputChange}
                        placeholder="Enter capacity"
                        error={errors.total_capacity}
                        required
                        darkMode={darkMode}
                      />
                    </div>
                  )}
                </div>

                {/* --- MORE DETAILS SECTION --- */}
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label
                        htmlFor="event_language"
                        className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2"
                      >
                        Event language<span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Select
                          isMulti // <-- Add this prop
                          name="event_language"
                          options={languageOptions}
                          // Filter options based on the array of values in formData
                          value={languageOptions.filter((option) =>
                            formData.event_language.includes(option.value)
                          )}
                          onChange={handleSelectChange}
                          placeholder="Select language(s)"
                          styles={CustomSelectStyles(darkMode, errors)}
                          required
                        />
                      </div>
                    </div>
                    <FormInput
                      label="Minimum age allowed"
                      id="min_age_allowed"
                      name="min_age_allowed"
                      type="number"
                      value={formData.min_age_allowed}
                      onChange={handleInputChange}
                      placeholder="Enter Min Age Allowed"
                      error={errors.min_age_allowed}
                      required
                      darkMode={darkMode}
                    />
                  </div>

                  {formData.location_type === "offline" && (
                    <div className="animate-fade-in">
                      <label
                        htmlFor="seating_arrangement"
                        className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2"
                      >
                        Seating arrangement
                        <span className="text-red-400">*</span>
                      </label>
                      <Select
                        name="seating_arrangement"
                        options={seatingOptions}
                        value={seatingOptions.find(
                          (option) =>
                            option.value === formData.seating_arrangement
                        )}
                        onChange={handleSelectChange}
                        placeholder="Select a type"
                        styles={CustomSelectStyles(darkMode, errors)}
                        required={formData.location_type === "offline"}
                      />
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
                    <FormInput
                      label="Instagram link (Optional)"
                      id="event_instagram_link"
                      name="event_instagram_link"
                      type="text"
                      value={formData.event_instagram_link}
                      onChange={handleInputChange}
                      placeholder="https://instagram.com/..."
                      error={errors.event_instagram_link}
                      darkMode={darkMode}
                    />
                    <FormInput
                      label="Youtube link (Optional)"
                      id="event_youtube_link"
                      name="event_youtube_link"
                      type="text"
                      value={formData.event_youtube_link}
                      onChange={handleInputChange}
                      placeholder="https://youtube.com/..."
                      error={errors.event_youtube_link}
                      darkMode={darkMode}
                    />
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

                {/* --- DATES AND TIMES SECTION --- */}
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Dates and times
                  </h2>
                  <p className="text-black dark:text-gray-400">
                    Choose when your sub-event will take place.
                  </p>

                  <div>
                    <button
                      type="button"
                      onClick={handleOpenDateModal}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-2"
                    >
                      Add dates and time
                      <img src={Date_Form_Icon} alt="" />
                    </button>
                  </div>

                  {formData.event_dates.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-black dark:text-gray-400">
                        Dates you selected
                      </label>
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {formData.event_dates.map((item, index) => (
                          <div
                            key={index}
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
                            checked={Boolean(formData.gate_open_time)} // This ensures it's always a boolean
                            onChange={() =>
                              handleToggleChange("gate_open_time")
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

                      {formData.gate_open_time && (
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

                {/* --- GUEST/RULES/DESCRIPTION SECTION --- */}
                <div className="space-y-12">
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Guest/Guide/Artists details
                    </h2>
                    <p className="text-black dark:text-gray-400 text-sm">
                      Enter details of the person guiding or managing the event.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingGuest(null);
                        setIsGuestModalOpen(true);
                      }}
                      className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white flex items-center gap-2"
                    >
                      Add guest/guides
                      <img src={Guest_Form_Icon} alt="" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {formData.guests.map((guest) => (
                        <div
                          key={guest.id}
                          className={`rounded-lg p-3 flex items-center justify-between ${
                            darkMode ? "bg-[#2B2B2B]" : "bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <img
                              src={guest.image}
                              alt={guest.name}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="truncate">
                              <p className="font-semibold truncate">
                                {guest.name}
                              </p>
                              {guest.link && (
                                <a
                                  href={guest.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-400 truncate block"
                                >
                                  {guest.link}
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEditGuest(guest)}
                              className={`p-2 ${
                                darkMode
                                  ? "text-gray-400 hover:text-white"
                                  : "text-black hover:text-black"
                              }`}
                              title="Edit"
                            >
                              ✏️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Event rules and regulations
                      </h2>
                      <p className="text-black dark:text-gray-400 text-sm">
                        Describe your event rules and regulations
                      </p>
                    </div>
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
                          onClick={() => handleFormat("bold", rulesEditorRef)}
                          className={`w-8 h-8 flex items-center justify-center rounded font-bold ${
                            darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                          }`}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFormat("italic", rulesEditorRef)}
                          className={`w-8 h-8 flex items-center justify-center rounded italic ${
                            darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                          }`}
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleFormat("underline", rulesEditorRef)
                          }
                          className={`w-8 h-8 flex items-center justify-center rounded underline ${
                            darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                          }`}
                        >
                          U
                        </button>
                      </div>
                      <div
                        ref={rulesEditorRef}
                        contentEditable="true"
                        className="w-full min-h-[120px] p-3 focus:outline-none"
                      ></div>
                    </div>
                    <div>
                      <label
                        htmlFor="rule-file-upload"
                        className={`px-4 py-2 border rounded-lg font-semibold flex items-center gap-2 cursor-pointer w-max ${
                          darkMode
                            ? "border-gray-600 hover:bg-gray-700"
                            : "border-black hover:bg-gray-100"
                        }`}
                      >
                        Attach document
                      </label>
                      <input
                        id="rule-file-upload"
                        type="file"
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            event_rules_file: e.target.files[0],
                          }))
                        }
                        className="hidden"
                        accept=".pdf,.doc,.docx"
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
                      Add items that are not allowed for this event
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsProhibitedModalOpen(true)}
                      className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold flex items-center gap-2"
                    >
                      Add Prohibited Items
                      <img src={Prohibited_Form_Icon} alt="" />
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
                            &times;
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
                      Describe your event.
                    </p>
                    <div
                      className={`mt-4 bg-transparent border rounded-lg ${
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
                          onClick={() =>
                            handleFormat("bold", descriptionEditorRef)
                          }
                          className={`w-8 h-8 flex items-center justify-center rounded font-bold ${
                            darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                          }`}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleFormat("italic", descriptionEditorRef)
                          }
                          className={`w-8 h-8 flex items-center justify-center rounded italic ${
                            darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                          }`}
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleFormat("underline", descriptionEditorRef)
                          }
                          className={`w-8 h-8 flex items-center justify-center rounded underline ${
                            darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                          }`}
                        >
                          U
                        </button>
                      </div>
                      <div
                        ref={descriptionEditorRef}
                        contentEditable="true"
                        className="w-full min-h-[120px] p-3 focus:outline-none"
                      ></div>
                    </div>
                  </div>
                </div>

                {/* --- POC & MEDIA SECTION --- */}
                <div className="space-y-12">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Point of Contact
                    </h2>
                    <p className="text-black dark:text-gray-400 text-sm">
                      Add POCs with whom event feedback will be shared.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                      <FormInput
                        label="POC Name"
                        name="POC_name"
                        value={poc.POC_name}
                        onChange={handlePocChange}
                        placeholder="Enter the name of the person"
                        required
                        darkMode={darkMode}
                      />
                      <FormInput
                        label="POC Email"
                        name="POC_email"
                        type="email"
                        value={poc.POC_email}
                        onChange={handlePocChange}
                        placeholder="Enter the email ID"
                        required
                        darkMode={darkMode}
                      />
                    </div>
                    <div className="mt-8">
                      <FormInput
                        label="POC Contact Number"
                        name="POC_contact"
                        type="tel"
                        value={poc.POC_contact}
                        onChange={handlePocChange}
                        placeholder="Enter contact number"
                        required
                        darkMode={darkMode}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPoc}
                      className="mt-8 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white"
                    >
                      Add +
                    </button>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {formData.POCS.map((pocItem, index) => (
                        <div
                          key={index}
                          className="rounded-lg p-3 flex items-center justify-between bg-gray-100 dark:bg-[#2B2B2B]"
                        >
                          <div className="truncate">
                            <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">
                              {pocItem.POC_name}
                            </p>
                            <p className="text-xs text-black dark:text-gray-400 truncate">
                              {pocItem.POC_email} | {pocItem.POC_contact}
                            </p>
                          </div>
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

                  <div className="space-y-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Event Media
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <FileInput
                        id="event_banner"
                        label="Event Banner"
                        info="Required. 2:1 ratio recommended."
                        preview={previews.event_banner}
                        onFileChange={handleMediaFileChange}
                        onRemove={removeMediaFile}
                        darkMode={darkMode}
                        acceptedFiles=".jpg,.jpeg,.png,.gif,.webp"
                        maxSizeMB={50}
                      />
                      <FileInput
                        id="event_logo"
                        label="Event or Organisation Logo"
                        info="Optional. 1:1 ratio recommended."
                        preview={previews.event_logo}
                        onFileChange={handleMediaFileChange}
                        onRemove={removeMediaFile}
                        darkMode={darkMode}
                        acceptedFiles=".jpg,.jpeg,.png,.gif,.webp"
                        maxSizeMB={50}
                      />
                      <div>
                        <label className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2">
                          Images and videos
                        </label>
                        <div
                          className={`relative rounded-lg text-center bg-gray-100 dark:bg-[#2B2B2B] min-h-[180px] flex justify-center items-center border-2 border-dashed ${
                            formData.event_images.length > 0
                              ? "border-indigo-500"
                              : "border-black dark:border-gray-600"
                          } overflow-hidden`}
                        >
                          {formData.event_images.length > 0 ? (
                            <>
                              <img
                                src={URL.createObjectURL(
                                  formData.event_images[0]
                                )}
                                alt="Preview"
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={handleRemoveLastImage}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 text-sm font-bold flex items-center justify-center z-10"
                              >
                                &times;
                              </button>

                              {formData.event_images.length < 10 && (
                                <label
                                  htmlFor="multi-media-upload"
                                  className="absolute top-1/2 -translate-y-1/2 right-2 bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition z-10"
                                  title="Add another image"
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
                                      d="M12 4v16m8-8H4"
                                    />
                                  </svg>
                                </label>
                              )}

                              {formData.event_images.length > 1 && (
                                <div
                                  onClick={() =>
                                    setShowExtraMedia(!showExtraMedia)
                                  }
                                  className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-4xl font-bold cursor-pointer"
                                >
                                  +{formData.event_images.length - 1}
                                </div>
                              )}
                            </>
                          ) : (
                            <label
                              htmlFor="multi-media-upload"
                              className="cursor-pointer flex flex-col items-center gap-2"
                            >
                              <svg
                                className="w-8 h-8 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                              </svg>
                              <span className="text-indigo-500 dark:text-indigo-400 font-semibold">
                                Click to browse
                              </span>
                            </label>
                          )}
                          <input
                            id="multi-media-upload"
                            type="file"
                            multiple
                            className="sr-only"
                            onChange={handleMultiMediaChange}
                            accept="image/*,video/*"
                          />
                        </div>
                      </div>
                    </div>
                    {showExtraMedia && formData.event_images.length > 1 && (
                      <div className="animate-fade-in">
                        <p className="text-sm font-medium text-black dark:text-gray-400 mb-2">
                          Additional Media
                        </p>
                        <div className="flex overflow-x-auto space-x-4 p-2 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                          {formData.event_images.slice(1).map((file, index) => (
                            <div key={index} className="flex-shrink-0">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Extra media ${index + 1}`}
                                className="h-24 w-auto aspect-video object-cover rounded-md"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* --- PAYMENT AND TICKETING --- */}
                <div className="space-y-12">
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Payment Type
                    </h2>
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center cursor-pointer text-gray-600 dark:text-gray-300">
                        <input
                          type="radio"
                          name="payment_type"
                          value="free"
                          checked={formData.payment_type === "free"}
                          onChange={handleInputChange}
                          className="hidden peer"
                        />
                        <span className="w-4 h-4 rounded-full border-2 border-black dark:border-[#4A4A4A] peer-checked:border-indigo-500 peer-checked:bg-indigo-500"></span>
                        <span className="ml-2">Free</span>
                      </label>
                      <label className="flex items-center cursor-pointer text-gray-600 dark:text-gray-300">
                        <input
                          type="radio"
                          name="payment_type"
                          value="paid"
                          checked={formData.payment_type === "paid"}
                          onChange={handleInputChange}
                          className="hidden peer"
                        />
                        <span className="w-4 h-4 rounded-full border-2 border-black dark:border-[#4A4A4A] peer-checked:border-indigo-500 peer-checked:bg-indigo-500"></span>
                        <span className="ml-2">Paid</span>
                      </label>
                    </div>
                  </div>

                  {/* FIX: Entire paid section is now conditional */}
                  {formData.payment_type === "paid" &&
                    renderBankingSection() && (
                      <div className="space-y-12 animate-fade-in">
                        <section className="bg-white dark:bg-[#2B2B2B] p-8 rounded-lg space-y-6 shadow-sm dark:shadow-none">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <label
                                className={`font-medium text-md ${
                                  groupHasBankAccount &&
                                  !groupBankDetailsIncomplete
                                    ? "text-gray-900 dark:text-white"
                                    : "text-black dark:text-gray-400"
                                }`}
                              >
                                Do you want to use the bank account used for
                                group creation?
                              </label>
                              {groupHasBankAccount &&
                                groupBankDetails &&
                                !groupBankDetailsIncomplete && (
                                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                                      ✓ Group Bank Account Available
                                    </p>
                                    <div className="mt-1 text-sm text-green-700 dark:text-green-300">
                                      <p>
                                        <strong>Holder:</strong>{" "}
                                        {groupBankDetails.bank_acc_holder}
                                      </p>
                                      <p>
                                        <strong>Type:</strong>{" "}
                                        {groupBankDetails.bank_acc_type?.toUpperCase()}{" "}
                                        Account
                                      </p>
                                      <p>
                                        <strong>Account:</strong> ****
                                        {groupBankDetails.bank_acc_no?.slice(
                                          -4
                                        )}
                                      </p>
                                      <p>
                                        <strong>IFSC:</strong>{" "}
                                        {groupBankDetails.bank_ifsc}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              {!groupHasBankAccount && (
                                <p className="text-sm text-black dark:text-gray-400 mt-1">
                                  No bank account found for this group.
                                </p>
                              )}
                              {groupBankDetailsIncomplete && (
                                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                                  Group bank account details are incomplete.
                                  Please update your group profile.
                                </p>
                              )}
                            </div>
                            <div className="ml-4">
                              <ToggleSwitch
                                checked={useGroupBankAccount}
                                onChange={handleUseGroupBankAccountToggle}
                                disabled={
                                  !groupHasBankAccount ||
                                  groupBankDetailsIncomplete
                                }
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                              Banking details
                            </h2>
                            {!useGroupBankAccount && (
                              <span className="px-3 py-1 bg-yellow-100 dark:bg-[#282115] text-yellow-800 dark:text-[#FFB800] text-xs font-medium rounded-md">
                                Bank account must be a current account or
                                merchant account
                              </span>
                            )}
                            {useGroupBankAccount && (
                              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-xs font-medium rounded-md">
                                Using group bank account
                              </span>
                            )}
                          </div>

                          <p className="text-black dark:text-gray-400 text-sm">
                            {useGroupBankAccount && groupBankDetails
                              ? "Using the primary bank account associated with your group."
                              : "Provide bank account details for payment processing, settlements, or refunds."}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-2">
                            <div>
                              <label
                                htmlFor="bank_acc_type"
                                className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2"
                              >
                                Account type{" "}
                                <span className="text-red-500 ml-1">*</span>
                              </label>
                              <div className="relative">
                                <select
                                  id="bank_acc_type"
                                  name="bank_acc_type"
                                  value={
                                    getCurrentBankDetail().bank_acc_type || ""
                                  }
                                  onChange={(e) =>
                                    handleBankingDetailChange(0, e)
                                  }
                                  disabled={useGroupBankAccount}
                                  className="w-full appearance-none bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-black dark:border-gray-700 rounded-md p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <option value="">Select account type</option>
                                  <option value="current">Current</option>
                                  <option value="merchant">Merchant</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                                  <svg
                                    className="w-5 h-5 text-black"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 9l-7 7-7-7"
                                    />
                                  </svg>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label
                                htmlFor="bank_acc_holder"
                                className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2"
                              >
                                Account holder name{" "}
                                <span className="text-red-500 ml-1">*</span>
                              </label>
                              <input
                                type="text"
                                id="bank_acc_holder"
                                name="bank_acc_holder"
                                value={
                                  getCurrentBankDetail().bank_acc_holder || ""
                                }
                                onChange={(e) =>
                                  handleBankingDetailChange(0, e)
                                }
                                disabled={useGroupBankAccount}
                                placeholder="eg. John Doe"
                                className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-black dark:border-gray-700 rounded-md p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="bank_acc_no"
                                className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2"
                              >
                                Account number{" "}
                                <span className="text-red-500 ml-1">*</span>
                              </label>
                              <input
                                type="text"
                                id="bank_acc_no"
                                name="bank_acc_no"
                                value={getCurrentBankDetail().bank_acc_no || ""}
                                onChange={(e) =>
                                  handleBankingDetailChange(0, e)
                                }
                                disabled={useGroupBankAccount}
                                placeholder="xxxx-xxxx-xxxx-xxxx"
                                className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-black dark:border-gray-700 rounded-md p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="bank_ifsc"
                                className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2"
                              >
                                IFSC code{" "}
                                <span className="text-red-500 ml-1">*</span>
                              </label>
                              <input
                                type="text"
                                id="bank_ifsc"
                                name="bank_ifsc"
                                value={getCurrentBankDetail().bank_ifsc || ""}
                                onChange={(e) =>
                                  handleBankingDetailChange(0, e)
                                }
                                disabled={useGroupBankAccount}
                                placeholder="xxxxxxxxxxx"
                                className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-black dark:border-gray-700 rounded-md p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </div>
                          </div>
                        </section>

                        {/* Rest of the paid section content */}
                      </div>
                    )}
                  <div>
                    <section className="space-y-6 animate-fade-in">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Ticketing details
                      </h2>
                      <p className="text-black dark:text-gray-400 text-sm">
                        Add ticket types, set prices, and control how attendees
                        book their spot.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-2">
                        <div>
                          <label
                            htmlFor="booking_start_date"
                            className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2"
                          >
                            Booking start date?{" "}
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              id="booking_start_date"
                              name="booking_start_date"
                              value={formData.booking_start_date}
                              onChange={handleInputChange}
                              className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-black dark:border-gray-700 rounded-md p-3 appearance-none"
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                              <svg
                                className="w-5 h-5 text-black"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="booking_end_date"
                            className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2"
                          >
                            Booking end date?{" "}
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              id="booking_end_date"
                              name="booking_end_date"
                              value={formData.booking_end_date}
                              onChange={handleInputChange}
                              className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-black dark:border-gray-700 rounded-md p-3 appearance-none"
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                              <svg
                                className="w-5 h-5 text-black"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                      {formData.payment_type === "paid" && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTicket(null);
                              setIsTicketModalOpen(true);
                            }}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold flex items-center space-x-2 hover:bg-indigo-700 transition"
                          >
                            <span>Add tickets</span>
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5z"
                              />
                            </svg>
                          </button>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                            {formData.ticket_types.map((ticket) => (
                              <div
                                key={ticket.id}
                                className="bg-white dark:bg-[#2B2B2B] p-3 rounded-lg flex items-center justify-between shadow-sm dark:shadow-none"
                              >
                                <div className="flex items-center space-x-3">
                                  <img
                                    src={ticket.image}
                                    alt={ticket.name}
                                    className="w-16 h-16 rounded-md object-cover"
                                  />
                                  <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{`${
                                      ticket.name
                                    } - ₹${Number(
                                      ticket.price
                                    ).toLocaleString()}`}</p>
                                    <p className="text-xs text-black dark:text-gray-400">
                                      Capacity: {ticket.capacity}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTicket(ticket);
                                      setIsTicketModalOpen(true);
                                    }}
                                    className="text-gray-400 hover:text-gray-800 dark:hover:text-white transition"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteTicket(ticket.id)
                                    }
                                    className="text-gray-400 hover:text-red-500 transition"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </section>
                  </div>

                  {/* FIX: Seating details now only shows for offline events */}
                  {formData.location_type === "offline" && (
                    <section className="space-y-6 max-w-2xl animate-fade-in">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Seating details
                      </h2>
                      <p className="text-black dark:text-gray-400 text-sm">
                        Add event seating capacity and its layout
                      </p>
                      <FormInput
                        label="Maximum number of people allowed (capacity)?"
                        id="total_capacity"
                        name="total_capacity"
                        type="number"
                        value={formData.total_capacity}
                        onChange={handleInputChange}
                        placeholder="Enter event capacity"
                        error={errors.total_capacity}
                        required
                        darkMode={darkMode}
                        info="Set the total number of attendees for your event."
                      />
                      <div className="flex items-center justify-between">
                        <label className="font-medium text-gray-900 dark:text-white text-md">
                          Do you have seating layout?
                        </label>
                        <ToggleSwitch
                          checked={hasSeatingLayout}
                          onChange={() =>
                            setHasSeatingLayout(!hasSeatingLayout)
                          }
                        />
                      </div>
                      {hasSeatingLayout && (
                        <div className="animate-fade-in grid grid-cols-2 gap-8 items-start">
                          <div className="col-span-1 space-y-2">
                            <FileInput
                              id="seating-layout-upload"
                              label="Upload seating layout "
                              info="Optional. 1:1 ratio recommended."
                              preview={previews.ticket_layout}
                              onFileChange={handleMediaFileChange}
                              onRemove={removeMediaFile}
                              darkMode={darkMode}
                              acceptedFiles=".jpg,.jpeg,.png,.gif,.webp"
                              maxSizeMB={50}
                            />
                          </div>
                          <div className="col-span-1">
                            {previews.ticket_layout && (
                              <div className="relative group w-full">
                                <img
                                  src={previews.ticket_layout}
                                  alt="Seating layout preview"
                                  className="w-full h-auto rounded-lg object-cover"
                                />
                                <div
                                  onClick={() =>
                                    removeMediaFile("ticket_layout")
                                  }
                                  className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer rounded-lg"
                                >
                                  <span className="text-red-500 text-3xl font-bold">
                                    &times;
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </section>
                  )}
                </div>

                {/* --- FINAL ACTION BUTTONS --- */}
                <button
                  type="button"
                  onClick={handleSaveAndAddMore}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-lg font-semibold bg-green-500 text-white hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isSubmitting
                    ? "Saving..."
                    : isEditingSubEvent
                    ? "Save changes & add new event +"
                    : "Add more sub events +"}
                </button>
                <div className="pt-8 flex justify-end gap-4">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-8 py-3 rounded-lg font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      Go back
                    </button>
                    <button
                      onClick={handleSubmit}
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Saving..." : "Save and continue"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
export default UpdateTicketAddOns;
