import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EventSidebar from "../../components/CreateGroup/EventSidebar";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import {
  getTicketById,
  updateTicketDetails,
  getGroupView,
} from "../../services/ticketService";
import { getTicketImageUrl } from "../../utils/imageUtils";
import Select from "react-select";
import Ticket_Form_Icon from "../../assets/Event/Ticket_Form_Icon.svg?react";
import Calender_Icon from "../../assets/Event/Calender_Icon.svg?react";
import CreateTicketModal from "../../components/CreateGroup/CreateTicketModal.jsx";
import Alert from "../../components/CreateGroup/Alert.jsx";
import SeatingLayoutPreview from "../../components/CreateGroup/SeatingLayoutPreview.jsx";
import SeatAssignmentModal from "../../components/CreateGroup/SeatAssignmentModal.jsx";
import ConfirmModal from "../../components/CreateGroup/ConfirmModal.jsx";
import ToggleSwitch from "../../components/CreateGroup/ToggleSwitch.jsx";
import InfoTooltip from "../../components/CreateGroup/InfoTooltip.jsx";
import FormInput from "../../components/CreateGroup/FormInput.jsx";
import DateInput from "../../components/CreateGroup/DateInput.jsx";
import ExtraEventsPlanner from "../../components/modals/ExtraEventsPlanner.jsx";
import ScrollBarStyle from "../../components/ScrollBarStyle.jsx";
import getInitialTheme from "../../components/CreateGroup/getIntialTheme.jsx";
import darkThemeStyles from "../../components/CreateGroup/darkThemeStyles.jsx";
import lightThemeStyles from "../../components/CreateGroup/lightThemeStyles.jsx";

// --- Main Page Component ---
const UpdateTicketDetails = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(getInitialTheme());
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    onConfirm: null,
    message: "",
  });

  const showAlert = (data) => setAlert({ ...data, show: true });
  const hideAlert = () => setAlert(null);

  // Define a unique key for localStorage based on the ticketId
  const storageKey = `bankingAndTicketsDraft_${ticketId}`;

  // Form State with initial values that can be loaded from localStorage
  const [paymentType, setPaymentType] = useState("free");
  const [useGroupBankAccount, setUseGroupBankAccount] = useState(false);
  const [bankingDetails, setBankingDetails] = useState([
    {
      id: Date.now(),
      bank_acc_type: "",
      bank_acc_holder: "",
      bank_acc_no: "",
      bank_ifsc: "",
    },
  ]);
  const [totalCapacity, setTotalCapacity] = useState("");
  const [hasSeatingLayout, setHasSeatingLayout] = useState(false);
  const [seatingLayoutFile, setSeatingLayoutFile] = useState(null);
  const [seatingLayoutPreview, setSeatingLayoutPreview] = useState(null);
  const [generatedSeatingLayout, setGeneratedSeatingLayout] = useState(null);
  const [showSeatingPreview, setShowSeatingPreview] = useState(false);
  const [groupHasBankAccount, setGroupHasBankAccount] = useState(false);
  const [groupBankDetailsIncomplete, setGroupBankDetailsIncomplete] =
    useState(false);

  // Ticketing Details State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [eventEndDate, setEventEndDate] = useState("");
  const [showSeatAssignmentModal, setShowSeatAssignmentModal] = useState(false);
  const errorFieldRefs = useRef({});

  const [ticketTypeColors] = useState([
    "#3B82F6", // Blue
    "#e6e92eff", // Yellow
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#F97316", // Orange
  ]);
  const getTicketTypeColor = (ticketId) => {
    const index = tickets.findIndex((t) => t.id === ticketId);
    return index !== -1
      ? ticketTypeColors[index % ticketTypeColors.length]
      : "#6B7280";
  };
  const [seatAssignments, setSeatAssignments] = useState({});
  const [eventStartDate, setEventStartDate] = useState("");
  const [editingTicket, setEditingTicket] = useState(null);
  const [bookingStartDate, setBookingStartDate] = useState("");
  const [bookingEndDate, setBookingEndDate] = useState("");
  const [mainEventData, setMainEventData] = useState(null);
  const [simpleTicketPrice, setSimpleTicketPrice] = useState("");
  const [simpleTicketCapacity, setSimpleTicketCapacity] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtraEventsModalOpen, setIsExtraEventsModalOpen] = useState(false);

  // Effect to load data from API and localStorage on initial mount
  useEffect(() => {
    const fetchData = async () => {
      if (!ticketId) {
        setErrors({ general: "No Ticket ID provided in URL." });
        setInitialLoading(false);
        return;
      }
      try {
        const [ticketResponse, groupResponse] = await Promise.all([
          getTicketById(ticketId),
          getGroupView(ticketId),
        ]);

        const ticketData =
          ticketResponse.ticket || ticketResponse.data || ticketResponse;
        const groupData =
          groupResponse.group || groupResponse.data || groupResponse;

        setMainEventData(ticketData);

        if (
          ticketData &&
          ticketData.event_dates &&
          ticketData.event_dates.length > 0
        ) {
          const sortedDates = [...ticketData.event_dates].sort(
            (a, b) => new Date(a.end_date) - new Date(b.end_date)
          );
          const lastDate = sortedDates[sortedDates.length - 1];
          setEventEndDate(
            lastDate.end_date
              ? new Date(lastDate.end_date).toISOString().split("T")[0]
              : ""
          );
        }
        const firstDate = ticketData.event_dates[0];
        setEventStartDate(
          firstDate.start_date
            ? new Date(firstDate.start_date).toISOString().split("T")[0]
            : ""
        );

        // Load saved draft from localStorage
        const savedDraftRaw = localStorage.getItem(storageKey);
        const savedDraft = savedDraftRaw ? JSON.parse(savedDraftRaw) : null;

        if (ticketData) {
          setPaymentType(
            savedDraft?.paymentType ?? ticketData.payment_type ?? "free"
          );
          setTotalCapacity(
            savedDraft?.totalCapacity ?? ticketData.total_capacity ?? ""
          );
          setHasSeatingLayout(
            savedDraft?.hasSeatingLayout ?? !!ticketData.ticket_layout
          );
          if (ticketData.ticket_layout) {
            setSeatingLayoutPreview(
              getTicketImageUrl(ticketData.ticket_layout)
            );
          }
          if (ticketData.seating_layout) {
            const loadedLayout =
              typeof ticketData.seating_layout === "string"
                ? JSON.parse(ticketData.seating_layout)
                : ticketData.seating_layout;

            console.log("Raw loaded layout:", loadedLayout);

            // Ensure all seats have their colors properly restored
            if (loadedLayout.seats && Array.isArray(loadedLayout.seats)) {
              loadedLayout.seats = loadedLayout.seats.map((seat) => {
                // CASE 1: Seat already has color saved
                if (seat.ticketTypeColor) {
                  return seat;
                }
                if (
                  seat.ticketTypeId &&
                  loadedLayout.ticketTypeAssignments.length > 0
                ) {
                  const assignment = loadedLayout.ticketTypeAssignments.find(
                    (a) => String(a.ticketTypeId) === String(seat.ticketTypeId)
                  );
                  if (assignment && assignment.color) {
                    console.log(
                      `🔧 Restored seat ${seat.seatId}: ${
                        assignment.ticketTypeName
                      } (${assignment.color}) - ₹${assignment.price || 0}`
                    );
                    return {
                      ...seat,
                      ticketTypeColor: assignment.color,
                      ticketTypeName:
                        assignment.ticketTypeName || seat.ticketTypeName,
                      price: assignment.price || seat.price || 0, // Restore price
                    };
                  }
                }
                // CASE 3: Unassigned seat - return as is
                return seat;
              });
            }
            setGeneratedSeatingLayout(loadedLayout);
            setShowSeatingPreview(true);
          }
          setBookingStartDate(
            savedDraft?.bookingStartDate ??
              (ticketData.booking_start_date
                ? new Date(ticketData.booking_start_date)
                    .toISOString()
                    .split("T")[0]
                : "")
          );
          setBookingEndDate(
            savedDraft?.bookingEndDate ??
              (ticketData.booking_end_date
                ? new Date(ticketData.booking_end_date)
                    .toISOString()
                    .split("T")[0]
                : "")
          );
          setTickets(
            savedDraft?.tickets ??
              ticketData.ticket_types?.map((t) => ({
                ...t,
                id: t._id || Date.now(),
                name: t.ticket_type,
                price: t.ticket_price,
                capacity: t.max_capacity,
                image: getTicketImageUrl(
                  t.ticket_photo,
                  "/placeholder-ticket.png"
                ),
              })) ??
              []
          );
        }
        const loadedTickets =
          savedDraft?.tickets ??
          ticketData.ticket_types?.map((t) => ({
            // ... (map ticket fields) ...
            id: t._id || Date.now(),
            name: t.ticket_type,
            price: t.ticket_price,
            capacity: t.max_capacity,
            image: getTicketImageUrl(t.ticket_photo, "/placeholder-ticket.png"),
          })) ??
          [];

        setTickets(loadedTickets);
        let shouldUseGroupBank = false;
        let bankDetailsToSet = [
          {
            id: Date.now(),
            bank_acc_type: "",
            bank_acc_holder: "",
            bank_acc_no: "",
            bank_ifsc: "",
          },
        ];
        if (groupData && groupData.primary_bank_acc_no) {
          setGroupHasBankAccount(true);
          const {
            primary_bank_acc_type,
            primary_bank_acc_holder,
            primary_bank_acc_no,
            primary_bank_ifsc,
          } = groupData;

          const areDetailsComplete =
            primary_bank_acc_type &&
            primary_bank_acc_holder &&
            primary_bank_acc_no &&
            primary_bank_ifsc;

          if (areDetailsComplete) {
            // Only enable toggle if group bank details are complete
            shouldUseGroupBank = true;

            const groupBankDetails = [
              {
                id: groupData._id,
                bank_acc_type: primary_bank_acc_type?.toLowerCase(),
                bank_acc_holder: primary_bank_acc_holder,
                bank_acc_no: primary_bank_acc_no,
                bank_ifsc: primary_bank_ifsc,
              },
            ];
            window.groupBankDetails = groupBankDetails;

            // Set group bank details as default if available
            bankDetailsToSet = groupBankDetails;
          } else {
            setGroupBankDetailsIncomplete(true);
            shouldUseGroupBank = false;
          }
        } else {
          setGroupHasBankAccount(false);
          shouldUseGroupBank = false;
        }
        const locationType = ticketData.location_type;
        if (
          ticketData.payment_type !== "free" &&
          locationType !== "offline" &&
          loadedTickets.length > 0
        ) {
          // For simple tickets, we assume only the first ticket type applies
          setSimpleTicketPrice(
            savedDraft?.simpleTicketPrice ?? loadedTickets[0].price
          );
          setSimpleTicketCapacity(
            savedDraft?.simpleTicketCapacity ?? loadedTickets[0].capacity
          );
        } else if (
          ticketData.payment_type !== "free" &&
          locationType !== "offline" &&
          loadedTickets.length === 0
        ) {
          // If paid, non-offline, but no tickets loaded, try to load draft
          setSimpleTicketPrice(savedDraft?.simpleTicketPrice ?? "");
          setSimpleTicketCapacity(savedDraft?.simpleTicketCapacity ?? "");
        }
        // Check if ticket has custom banking details saved
        if (
          ticketData.banking_details &&
          ticketData.banking_details.length > 0
        ) {
          const hasCustomBankDetails = ticketData.banking_details.some(
            (b) => !b.is_group_account
          );

          if (hasCustomBankDetails) {
            // Load custom banking details - override group account
            shouldUseGroupBank = false;
            bankDetailsToSet = ticketData.banking_details.map((b) => ({
              id: b._id || Date.now(),
              bank_acc_type: b.bank_acc_type || "",
              bank_acc_holder: b.bank_acc_holder || "",
              bank_acc_no: b.bank_acc_no || "",
              bank_ifsc: b.bank_ifsc || "",
            }));
          } else if (groupData && groupData.primary_bank_acc_no) {
            // Has group bank details saved
            shouldUseGroupBank = true;
          }
        }
        // Override with savedDraft if available
        setUseGroupBankAccount(
          savedDraft?.useGroupBankAccount ?? shouldUseGroupBank
        );
        setBankingDetails(savedDraft?.bankingDetails ?? bankDetailsToSet);
        // Override with savedDraft if available
        setUseGroupBankAccount(
          savedDraft?.useGroupBankAccount ?? shouldUseGroupBank
        );
        setBankingDetails(savedDraft?.bankingDetails ?? bankDetailsToSet);
      } catch (error) {
        setErrors({
          general:
            error.response?.data?.message ||
            "Failed to load event data. Please try again later.",
        });
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, [ticketId, storageKey]);
  useEffect(() => {
    if (generatedSeatingLayout?.ticketTypeAssignments && tickets.length > 0) {
      const loadedAssignments = {};

      generatedSeatingLayout.ticketTypeAssignments.forEach((assignment) => {
        console.log("Processing assignment:", assignment);

        // Try multiple matching strategies
        const matchingTicket = tickets.find(
          (t) =>
            String(t.id) === String(assignment.ticketTypeId) ||
            String(t._id) === String(assignment.ticketTypeId) ||
            t.name === assignment.ticketTypeName ||
            t.ticket_type === assignment.ticketTypeName
        );

        if (
          matchingTicket &&
          assignment.assignedSeats &&
          assignment.assignedSeats.length > 0
        ) {
          loadedAssignments[matchingTicket.id] = [...assignment.assignedSeats];
          console.log(
            `✅ Loaded ${assignment.assignedSeats.length} seats for ${matchingTicket.name}`
          );
        } else {
          console.warn("⚠️ Could not match ticket for assignment:", assignment);
        }
      });

      if (Object.keys(loadedAssignments).length > 0) {
        console.log("✅ Final loaded assignments:", loadedAssignments);
        setSeatAssignments(loadedAssignments);
      } else {
        console.warn("⚠️ No assignments loaded from ticketTypeAssignments");
      }
    } else if (generatedSeatingLayout?.seats && tickets.length > 0) {
      console.log("📋 Trying to load from seat data...");
      // Fallback: extract from seat data
      const loadedAssignments = {};

      generatedSeatingLayout.seats.forEach((seat) => {
        if (seat.ticketTypeId) {
          const matchingTicket = tickets.find(
            (t) =>
              String(t.id) === String(seat.ticketTypeId) ||
              String(t._id) === String(seat.ticketTypeId)
          );

          if (matchingTicket) {
            if (!loadedAssignments[matchingTicket.id]) {
              loadedAssignments[matchingTicket.id] = [];
            }
            loadedAssignments[matchingTicket.id].push(seat.seatId);
          }
        }
      });

      if (Object.keys(loadedAssignments).length > 0) {
        console.log(
          "✅ Loaded seat assignments from seat data:",
          loadedAssignments
        );
        setSeatAssignments(loadedAssignments);
      } else {
        console.warn("⚠️ No seat assignments found in seat data");
      }
    } else {
      console.log("ℹ️ No layout or tickets available yet");
    }
  }, [generatedSeatingLayout, tickets]);
  useEffect(() => {
    let styleSheet = document.getElementById("dynamic-theme-styles");
    if (!styleSheet) {
      styleSheet = document.createElement("style");
      styleSheet.id = "dynamic-theme-styles";
      document.head.appendChild(styleSheet);
    }
    styleSheet.innerText = darkMode ? darkThemeStyles : lightThemeStyles;
  }, [darkMode]);
  useEffect(() => {
    if (initialLoading) return;

    const draftData = {
      paymentType,
      useGroupBankAccount,
      bankingDetails,
      totalCapacity,
      hasSeatingLayout,
      tickets,
      bookingStartDate,
      bookingEndDate,
      simpleTicketPrice,
      simpleTicketCapacity,
    };

    localStorage.setItem(storageKey, JSON.stringify(draftData));
  }, [
    paymentType,
    useGroupBankAccount,
    bankingDetails,
    totalCapacity,
    hasSeatingLayout,
    tickets,
    bookingStartDate,
    bookingEndDate,
    initialLoading,
    simpleTicketPrice,
    simpleTicketCapacity,
    initialLoading,
    storageKey,
  ]);

  const handleBookingEndDateChange = (e) => {
    const newEndDate = e.target.value;
    setBookingEndDate(newEndDate);
    setErrors((prev) => ({ ...prev, booking_end_date: null, general: null }));

    if (
      newEndDate &&
      eventEndDate &&
      new Date(newEndDate) > new Date(eventEndDate)
    ) {
      const errorMsg = `Booking end date cannot be after the event's end date. : ${eventEndDate}`;
      showAlert({
        type: "error",
        message: "Invalid Date",
        description: errorMsg,
      });
      setErrors((prev) => ({ ...prev, booking_end_date: errorMsg }));
    }
  };

  const handleBankingDetailChange = (index, event) => {
    const { name, value } = event.target;
    const list = [...bankingDetails];
    list[index][name] = value;
    setBankingDetails(list);
  };
  const handleSeatingLayoutChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/vnd.dwg",
        "image/x-dwg",
      ];
      const validExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".pdf",
        ".doc",
        ".docx",
        ".dwg",
        ".dxf",
      ];
      const fileExtension = file.name
        .substring(file.name.lastIndexOf("."))
        .toLowerCase();
      if (
        !validTypes.includes(file.type) &&
        !validExtensions.includes(fileExtension)
      ) {
        showAlert({
          type: "error",
          message: "Invalid File Type",
          description: "Please upload an image, PDF, DOC, or CAD file.",
        });
        return;
      }
      setSeatingLayoutFile(file);
      if (file.type.startsWith("image/")) {
        setSeatingLayoutPreview(URL.createObjectURL(file));
      } else {
        setSeatingLayoutPreview(null);
      }
      setGeneratedSeatingLayout(null);
      setShowSeatingPreview(false);
      setSeatAssignments({});
      setErrors((prev) => ({
        ...prev,
        seatingLayoutFile: null,
        general: null,
      }));
      showAlert({
        type: "info",
        message: "New File Selected",
        description: `${file.name} ready to be converted. Click "Generate Layout" to create the seat map.`,
      });
    }
  };
  const removeSeatingLayout = () => {
    setSeatingLayoutFile(null);
    setSeatingLayoutPreview(null);
    setGeneratedSeatingLayout(null);
    setShowSeatingPreview(false);
    setIsGenerating(false);
    setSeatAssignments({});
    showAlert({
      type: "info",
      message: "Layout Cleared",
      description:
        "Seating layout has been removed. Upload a new file to generate a layout.",
    });
  };
  const handleGenerateLayout = async () => {
    if (!seatingLayoutFile || !totalCapacity) {
      showAlert({
        type: "error",
        message: "Missing Information",
        description:
          "Please upload a seating layout file and set total capacity first.",
      });
      return;
    }
    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(seatingLayoutFile.type)) {
      showAlert({
        type: "error",
        message: "Invalid File Type",
        description:
          "Please upload an image (JPG, PNG) or PDF file. CAD files are not yet supported.",
      });
      return;
    }
    setIsGenerating(true);
    try {
      // Create FormData with ONLY the required fields for layout generation
      const formData = new FormData();
      formData.append("ticket_layout", seatingLayoutFile);
      formData.append("total_capacity", totalCapacity);

      // IMPORTANT: Add payment_type to avoid validation error
      formData.append("payment_type", paymentType);

      // Add banking details if paid event
      if (paymentType === "paid") {
        formData.append("use_group_bank_account", useGroupBankAccount);
        if (!useGroupBankAccount && bankingDetails.length > 0) {
          formData.append("banking_details", JSON.stringify(bankingDetails));
        }
      }

      // Add booking dates if available
      if (bookingStartDate) {
        formData.append("booking_start_date", bookingStartDate);
      }
      if (bookingEndDate) {
        formData.append("booking_end_date", bookingEndDate);
      }

      // Add ticket types if available (for offline paid events)
      const locationType = mainEventData?.location_type;
      if (paymentType === "paid") {
        if (locationType === "offline" && tickets.length > 0) {
          const cleanTicketTypes = tickets.map((ticket) => ({
            ticket_type: ticket.ticket_type || ticket.name,
            ticket_price: ticket.ticket_price || ticket.price,
            max_capacity: ticket.max_capacity || ticket.capacity,
            ticket_photo: ticket.ticket_photo || ticket.image || "",
          }));
          formData.append("ticket_types", JSON.stringify(cleanTicketTypes));
        } else if (locationType === "online" || locationType === "recorded") {
          // For online/recorded, use simple ticket
          if (simpleTicketPrice && simpleTicketCapacity) {
            const simpleTicket = [
              {
                ticket_type: "Standard Ticket",
                ticket_price: simpleTicketPrice,
                max_capacity: simpleTicketCapacity,
                ticket_photo: "",
              },
            ];
            formData.append("ticket_types", JSON.stringify(simpleTicket));
          }
        }
      }
      // Call the API
      const response = await updateTicketDetails(ticketId, formData);
      // Extract the generated seating layout from response
      if (response.ticket?.seating_layout) {
        const generatedLayout = response.ticket.seating_layout;

        // Ensure all seats have price initialized to 0 if not present
        if (generatedLayout.seats && Array.isArray(generatedLayout.seats)) {
          generatedLayout.seats = generatedLayout.seats.map((seat) => ({
            ...seat,
            price: seat.price !== undefined ? seat.price : 0,
          }));
        }

        setGeneratedSeatingLayout(generatedLayout);
        setShowSeatingPreview(true);
      } else if (response.seating_layout_info) {
        // Alternative: if backend returns layout info separately
        const layout =
          response.ticket?.seating_layout || response.seating_layout;
        if (layout) {
          setGeneratedSeatingLayout(layout);
          setShowSeatingPreview(true);

          showAlert({
            type: "success",
            message: "Layout Generated!",
            description: `Successfully generated ${layout.totalSeats} seats.`,
          });
        } else {
          throw new Error("Seating layout structure not found in response");
        }
      } else {
        console.warn("⚠️ No seating layout in response:", response);
        throw new Error(
          "No seating layout returned from server. The file may need processing."
        );
      }
    } catch (error) {
      console.error("❌ Generation error:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      let errorMessage = "Failed to generate seating layout.";
      let errorDescription = "";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        errorDescription =
          error.response.data.hint || error.response.data.error || "";
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Provide helpful guidance
      if (errorMessage.includes("detect") || errorMessage.includes("visible")) {
        errorDescription =
          "Tips:\n• Use a high-contrast image\n• Ensure seats are clearly visible\n• Avoid low-quality or blurry images\n• Try a PDF or diagram instead";
      }

      showAlert({
        type: "error",
        message: "Cannot Generate Layout",
        description: errorDescription || errorMessage,
      });

      // Clear the file so user can try again
      setSeatingLayoutFile(null);
      setSeatingLayoutPreview(null);
    } finally {
      setIsGenerating(false);
    }
  };
  const handleOpenModalForEdit = (ticketToEdit) => {
    setEditingTicket(ticketToEdit);
    setIsTicketModalOpen(true);
  };
  const handleOpenModalForAdd = () => {
    setEditingTicket(null);
    setIsTicketModalOpen(true);
  };

  const handleDeleteTicket = (ticketIdToDelete) => {
    setConfirmState({
      isOpen: true,
      message: "Are you sure you want to delete this ticket type?",
      onConfirm: () => {
        setTickets(tickets.filter((t) => t.id !== ticketIdToDelete));
        setConfirmState({ isOpen: false });
      },
    });
  };
  const handleResetAllTickets = () => {
    setConfirmState({
      isOpen: true,
      message: "Are you sure? This will remove all added ticket types.",
      onConfirm: () => {
        setTickets([]);
        setConfirmState({ isOpen: false });
      },
    });
  };
  const handleModalYes = () => {
    setIsExtraEventsModalOpen(false);
    navigate(`/ticket/update-ticket-addons/${ticketId}`);
  };
  const handleModalNo = () => {
    setIsExtraEventsModalOpen(false);
    navigate(`/ticket/ticket-terms/${ticketId}`);
  };
  const validateBankingDetails = () => {
    if (useGroupBankAccount) {
      return true;
    }
    const currentBankDetail = bankingDetails[0] || {};
    let newErrors = {};
    let firstErrorField = null;

    const addError = (field, message) => {
      if (!firstErrorField) {
        showAlert({
          type: "error",
          message: "Validation Failed",
          description: message,
        });
        firstErrorField = field;
      }
      newErrors[field] = message;
    };

    // Check 2: Account Holder Name
    if (
      !currentBankDetail.bank_acc_holder ||
      currentBankDetail.bank_acc_holder.trim() === ""
    ) {
      addError("bank_acc_holder", "Account Holder Name is required.");
    }

    // Check 3: Account Number (Basic check for digits/length, can be enhanced)
    const accNo = currentBankDetail.bank_acc_no?.trim() || "";
    if (!accNo) {
      addError("bank_acc_no", "Account Number is required.");
    } else if (!/^[0-9]{9,18}$/.test(accNo.replace(/\s/g, ""))) {
      // Assuming bank accounts are typically 9 to 18 digits (remove spaces for check)
      addError("bank_acc_no", "Account Number must be 9-18 digits long.");
    }

    // Check 4: IFSC Code (India-specific 11 characters: 4 letters, 1 zero, 6 alphanumeric)
    const ifsc = currentBankDetail.bank_ifsc?.trim() || "";
    if (!ifsc) {
      addError("bank_ifsc", "IFSC Code is required.");
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc)) {
      addError(
        "bank_ifsc",
        "IFSC Code must be 11 alphanumeric characters (e.g., ABCD0123456)."
      );
    }

    // --- Finalize and Scroll ---
    setErrors((prev) => ({
      ...prev,
      ...newErrors,
      general: firstErrorField ? newErrors[firstErrorField] : null,
    }));

    if (firstErrorField) {
      const fieldName = firstErrorField;
      const elementRef = errorFieldRefs.current[fieldName];

      if (elementRef) {
        setTimeout(() => {
          elementRef.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
      }
      return false;
    }

    return true;
  };
  useEffect(() => {
    if (
      paymentType === "paid" &&
      (!groupHasBankAccount || groupBankDetailsIncomplete)
    ) {
      setUseGroupBankAccount(false);
    }
  }, [groupHasBankAccount, groupBankDetailsIncomplete, paymentType]);
  const handleGoBack = () => {
    localStorage.removeItem(storageKey);
    navigate(`/ticket/update-ticket-media/${ticketId}`);
  };
  const validateFinalForm = () => {
    setErrors({});
    hideAlert();
    let newErrors = {};
    let firstErrorField = null;

    const addError = (field, message) => {
      if (!firstErrorField) {
        showAlert({
          type: "error",
          message: "Validation Error",
          description: message,
        });
        firstErrorField = field;
      }
      newErrors[field] = message;
    };

    if (
      !totalCapacity ||
      isNaN(parseInt(totalCapacity)) ||
      parseInt(totalCapacity) <= 0
    ) {
      addError("totalCapacity", "Total capacity must be a positive number.");
    }

    const start = new Date(bookingStartDate);
    const end = new Date(bookingEndDate);
    const eventEnd = new Date(eventEndDate);

    if (!bookingStartDate) {
      addError("booking_start_date", "Booking start date is required.");
    }
    if (!bookingEndDate) {
      addError("booking_end_date", "Booking end date is required.");
    }
    if (bookingStartDate && bookingEndDate && end < start) {
      addError(
        "booking_end_date",
        "Booking end date cannot be before the start date."
      );
    }

    if (bookingEndDate && eventEndDate && end > eventEnd) {
      addError(
        "booking_end_date",
        `Booking end date cannot be after the event finishes (${eventEndDate}).`
      );
    }

    if (paymentType === "paid") {
      const locationType = mainEventData?.location_type;

      if (locationType === "offline" && tickets.length === 0) {
        addError(
          "tickets",
          "Please add at least one ticket type for this paid offline event."
        );
      } else if (
        (locationType === "online" || locationType === "recorded") &&
        (!simpleTicketPrice || !simpleTicketCapacity)
      ) {
        addError(
          "simpleTicketPrice",
          "Ticket price and capacity are required for paid online/recorded events."
        );
        if (!simpleTicketCapacity) {
          newErrors.simpleTicketCapacity = true;
        }
      }

      if (!useGroupBankAccount) {
        const currentBank = bankingDetails[0] || {};
        if (!currentBank.bank_acc_type)
          addError("bank_acc_type", "Account Type is required.");
        if (!currentBank.bank_acc_holder?.trim())
          addError("bank_acc_holder", "Account Holder Name is required.");
        if (!currentBank.bank_acc_no?.trim())
          addError("bank_acc_no", "Account Number is required.");
        if (!currentBank.bank_ifsc?.trim())
          addError("bank_ifsc", "IFSC Code is required.");
      } else if (groupBankDetailsIncomplete) {
        addError(
          "useGroupBankAccount",
          "Group bank details are incomplete. Cannot use group account."
        );
      }

      // 3c. Seating Layout Check (If required by event setup)
      if (hasSeatingLayout && !seatingLayoutFile && !seatingLayoutPreview) {
        addError(
          "seatingLayoutFile",
          "Seating layout file is required if seating is enabled."
        );
      }
    }

    setErrors(newErrors);

    if (firstErrorField && errorFieldRefs.current[firstErrorField]) {
      setTimeout(() => {
        const element = errorFieldRefs.current[firstErrorField];
        if (element && element.scrollIntoView) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
    }

    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFinalForm()) {
      return;
    }
    setLoading(true);
    setErrors({});
    const locationType = mainEventData?.location_type;
    const isOnlineOrRecordedPaid =
      paymentType === "paid" &&
      (locationType === "online" || locationType === "recorded");

    let ticketsToSubmit = tickets;

    if (isOnlineOrRecordedPaid) {
      if (
        !simpleTicketPrice ||
        simpleTicketPrice <= 0 ||
        !simpleTicketCapacity ||
        simpleTicketCapacity <= 0
      ) {
        const errorMsg =
          "Please enter a valid price and total capacity for the ticket.";
        showAlert({
          type: "error",
          message: "Validation Error",
          description: errorMsg,
        });
        setErrors({
          general: errorMsg,
          simpleTicketPrice: !simpleTicketPrice,
          simpleTicketCapacity: !simpleTicketCapacity,
        });
        setLoading(false);
        return;
      }

      // Create a single structured ticket object matching the schema
      ticketsToSubmit = [
        {
          // Use defaults for complex fields, map price/capacity
          ticket_type: "Standard Ticket", // Default ticket name
          ticket_price: simpleTicketPrice, // Mapped value
          max_capacity: simpleTicketCapacity, // Mapped value
          ticket_photo: mainEventData?.ticket_types?.[0]?.ticket_photo || "", // Preserve existing photo URL if one exists from a previous save
        },
      ];
    } else if (paymentType === "paid" && tickets.length === 0) {
      // Validation for Paid Offline event missing tickets
      const errorMsg =
        "Please add at least one ticket type for this paid event.";
      showAlert({
        type: "error",
        message: "Validation Error",
        description: errorMsg,
      });
      setErrors({ general: errorMsg });
      setLoading(false);
      return;
    }
    // Validate banking details for paid events
    if (paymentType === "paid" && !validateBankingDetails()) {
      setLoading(false);
      return;
    }

    const apiFormData = new FormData();
    apiFormData.append("payment_type", paymentType);
    apiFormData.append("total_capacity", totalCapacity || "0");
    apiFormData.append("use_group_bank_account", useGroupBankAccount);
    apiFormData.append("booking_start_date", bookingStartDate);
    apiFormData.append("booking_end_date", bookingEndDate);

    if (!useGroupBankAccount && bankingDetails.length > 0) {
      apiFormData.append("banking_details", JSON.stringify(bankingDetails));
    }

    if (
      bookingEndDate &&
      bookingStartDate &&
      new Date(bookingEndDate) < new Date(bookingStartDate)
    ) {
      const errorMsg =
        "The booking end date cannot be before the booking start date.";
      showAlert({
        type: "error",
        message: "Invalid Booking Period",
        description: errorMsg,
      });
      setErrors({ general: errorMsg, booking_end_date: errorMsg });
      setLoading(false);
      return;
    }

    if (
      paymentType === "paid" &&
      bookingEndDate &&
      eventEndDate &&
      new Date(bookingEndDate) > new Date(eventEndDate)
    ) {
      const errorMsg =
        "The booking end date cannot be after the event has finished.";
      showAlert({
        type: "error",
        message: "Invalid Booking Period",
        description: errorMsg,
      });
      setErrors({ general: errorMsg, booking_end_date: errorMsg });
      setLoading(false);
      return;
    }
    // NEW LINE - Use ticketsToSubmit array
    const cleanTicketTypes = ticketsToSubmit.map((ticket) => ({
      ticket_type: ticket.ticket_type || ticket.name,
      ticket_price: ticket.ticket_price || ticket.price,
      max_capacity: ticket.max_capacity || ticket.capacity,
      ticket_photo: ticket.ticket_photo || ticket.image || "", // Ensure photo is included if needed
    }));
    apiFormData.append("ticket_types", JSON.stringify(cleanTicketTypes));
    if (locationType === "offline") {
      ticketsToSubmit.forEach((ticket, index) => {
        if (ticket.photoFile instanceof File) {
          apiFormData.append(`ticket_photo_${index}`, ticket.photoFile);
        }
      });
    }
    if (hasSeatingLayout) {
      if (seatingLayoutFile instanceof File) {
        apiFormData.append("ticket_layout", seatingLayoutFile);
      }
      if (generatedSeatingLayout) {
        const layoutWithAssignments = {
          ...generatedSeatingLayout,
          rows: generatedSeatingLayout.rows,
          columns: generatedSeatingLayout.columns,

          // STEP 1: Update every seat with assignment + color
          seats: generatedSeatingLayout.seats.map((seat) => {
            // Find which ticket type owns this seat
            const assignedEntry = Object.entries(seatAssignments).find(
              ([_, seatIds]) => seatIds && seatIds.includes(seat.seatId)
            );
            if (assignedEntry) {
              const [ticketTypeId, assignedSeatIds] = assignedEntry;
              const ticket = tickets.find(
                (t) => String(t.id) === String(ticketTypeId)
              );
              const color = getTicketTypeColor(ticketTypeId);
              const price = ticket?.price || ticket?.ticket_price || 0;
              return {
                seatId: seat.seatId,
                row: seat.row,
                column: seat.column,
                isAvailable: true,
                isSelected: false,
                ticketTypeId: String(ticketTypeId),
                ticketTypeName: ticket?.name || ticket?.ticket_type || "",
                ticketTypeColor: color,
                price: price, // CRITICAL: Save price here
              };
            }
            // Unassigned seat - clear all assignment data
            return {
              seatId: seat.seatId,
              row: seat.row,
              column: seat.column,
              isAvailable: true,
              isSelected: false,
              ticketTypeId: null,
              ticketTypeName: null,
              ticketTypeColor: null,
              price: 0,
            };
          }),
          // STEP 2: Build ticket type assignments summary with colors and price
          ticketTypeAssignments: Object.entries(seatAssignments)
            .filter(([_, seatIds]) => seatIds && seatIds.length > 0)
            .map(([typeId, seatIds]) => {
              const ticket = tickets.find(
                (t) => String(t.id) === String(typeId)
              );
              const color = getTicketTypeColor(typeId);
              const price = ticket?.price || ticket?.ticket_price || 0;
              console.log(
                `💰 Assignment for ${ticket?.name}: price = ₹${price}`
              );
              return {
                ticketTypeId: String(typeId),
                ticketTypeName: ticket?.name || ticket?.ticket_type || "",
                color: color,
                assignedSeats: [...seatIds],
                capacity: ticket?.capacity || ticket?.max_capacity || 0,
                price: price, // CRITICAL: Save price in assignments
              };
            }),
        };
        apiFormData.append(
          "seating_layout",
          JSON.stringify(layoutWithAssignments)
        );
      }
    }
    try {
      await updateTicketDetails(ticketId, apiFormData);
      localStorage.removeItem(storageKey);
      showAlert({
        type: "success",
        message: "Details Saved!",
        description: "Banking and ticket info has been updated.",
      });
      const latestTicketResponse = await getTicketById(ticketId);
      const latestProgress =
        latestTicketResponse.ticket?.form_progress ||
        latestTicketResponse.data?.form_progress ||
        {};
      const addOnsCompleted = latestProgress.add_on_events === true;
      const termsCompleted = latestProgress.terms_conditions === true;

      if (addOnsCompleted || termsCompleted) {
        if (addOnsCompleted) {
          navigate(`/ticket/update-ticket-addons/${ticketId}`);
        } else {
          navigate(`/ticket/ticket-terms/${ticketId}`);
        }
      } else {
        setIsExtraEventsModalOpen(true);
      }
    } catch (error) {
      const errorDesc =
        error.response?.data?.message || "An error occurred while saving.";
      showAlert({
        type: "error",
        message: "Submission Failed",
        description: errorDesc,
      });
      setErrors({ general: errorDesc });
    } finally {
      setLoading(false);
    }
  };
  if (initialLoading) {
    return (
      <div className="dark bg-gray-100 dark:bg-[#111214] min-h-screen flex items-center justify-center text-gray-900 dark:text-white text-lg">
        Loading banking and ticket details...
      </div>
    );
  }
  const currentBankDetail = bankingDetails[0] || {};

  const locationType = mainEventData?.location_type;
  const isOfflinePaid = paymentType === "paid" && locationType === "offline";
  const isOnlineOrRecordedPaid =
    paymentType === "paid" &&
    (locationType === "online" || locationType === "recorded");
  return (
    <div className={darkMode ? "dark " : ""}>
      <ScrollBarStyle isDark={darkMode} />
      <Alert alert={alert} onClose={hideAlert} isDark={darkMode} />
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false })}
        onConfirm={confirmState.onConfirm}
        title="Confirm Action"
        message={confirmState.message}
        darkMode={darkMode}
      />

      <div className="bg-[#FEFEFE] dark:bg-[#212426] text-gray-800 dark:text-white min-h-screen flex">
        <EventSidebar
          darkMode={darkMode}
          onBackClick={handleGoBack} // Your existing back function
          // Pass props from your 'mainEventData' state object
          formProgress={mainEventData?.form_progress || {}}
          groupId={mainEventData?.groupId}
          ticketId={ticketId}
          check={false}
        />
        <main className="flex-1 relative p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="absolute top-6 right-6 z-10">
            <ThemeToggle
              isDark={darkMode}
              onToggle={() => setDarkMode(!darkMode)}
            />
          </div>
          <div className="w-full max-w-5xl mx-auto">
            <header className="text-center mt-4 mb-16">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 bg-indigo-100 dark:bg-[#21163b] border-2 border-indigo-200 dark:border-[#3c2e6f]">
                <svg
                  className="w-10 h-10 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  ></path>
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Banking & Tickets
              </h1>
            </header>

            <form onSubmit={handleSubmit} className="space-y-12">
              <section className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Payment type
                </h2>
                <p className="text-black dark:text-gray-400 text-sm">
                  Select if your event is free to attend or requires a ticket
                  purchase.
                </p>
                <div>
                  <label className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2">
                    Event type<span className="text-red-400">*</span>
                    <InfoTooltip note="Public events are visible to everyone." />
                  </label>
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center cursor-pointer text-gray-600 dark:text-gray-300">
                      <input
                        type="radio"
                        name="paymentType"
                        value="free"
                        checked={paymentType === "free"}
                        onChange={() => setPaymentType("free")}
                        className="hidden peer"
                      />
                      <span className="w-4 h-4 rounded-full border-2 border-black dark:border-[#4A4A4A] peer-checked:border-indigo-500 peer-checked:bg-indigo-500 transition-all duration-300 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity duration-300"></span>
                      </span>
                      <span className="ml-2">Free</span>
                    </label>
                    <label className="flex items-center cursor-pointer text-gray-600 dark:text-gray-300">
                      <input
                        type="radio"
                        name="paymentType"
                        value="paid"
                        checked={paymentType === "paid"}
                        onChange={() => setPaymentType("paid")}
                        className="hidden peer"
                      />
                      <span className="w-4 h-4 rounded-full border-2 border-black dark:border-[#4A4A4A] peer-checked:border-indigo-500 peer-checked:bg-indigo-500 transition-all duration-300 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity duration-300"></span>
                      </span>
                      <span className="ml-2">Paid</span>
                    </label>
                  </div>
                </div>
              </section>

              {paymentType === "paid" && (
                <section className="bg-[#f1f1f1] dark:bg-[#2B2B2B] p-8 rounded-lg space-y-6 animate-fade-in shadow-sm dark:shadow-none">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Banking details
                    </h2>
                    {!useGroupBankAccount && (
                      <span className="px-3 py-1 bg-yellow-100 dark:bg-[#282115] text-yellow-800 dark:text-[#FFB800] text-xs font-medium rounded-md">
                        Bank account must be a current account or merchant
                        account
                      </span>
                    )}
                  </div>
                  <div>
                    {paymentType === "paid" && (
                      <div className="pt-4 px-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 ">
                            <label
                              className={`font-medium text-md ${
                                groupHasBankAccount &&
                                !groupBankDetailsIncomplete
                                  ? "text-gray-900 dark:text-white"
                                  : "text-black dark:text-gray-400"
                              }`}
                            >
                              Do you want to use the bank account used for group
                              creation?
                            </label>
                            {groupHasBankAccount &&
                              currentBankDetail &&
                              !groupBankDetailsIncomplete && (
                                <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                                    ✓ Group Bank Account Available
                                  </p>
                                  <div className="mt-1 text-sm text-green-700 dark:text-green-300">
                                    <p>
                                      <strong>Holder:</strong>{" "}
                                      {currentBankDetail.bank_acc_holder}
                                    </p>
                                    <p>
                                      <strong>Type:</strong>{" "}
                                      {currentBankDetail.bank_acc_type?.toUpperCase()}{" "}
                                      Account
                                    </p>
                                    <p>
                                      <strong>Account:</strong> ****
                                      {currentBankDetail.bank_acc_no?.slice(-4)}
                                    </p>
                                    <p>
                                      <strong>IFSC:</strong>{" "}
                                      {currentBankDetail.bank_ifsc}
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
                          <ToggleSwitch
                            checked={useGroupBankAccount}
                            onChange={() => {
                              const newValue = !useGroupBankAccount;
                              setUseGroupBankAccount(newValue);

                              if (newValue && window.groupBankDetails) {
                                setBankingDetails([...window.groupBankDetails]);
                              } else {
                                setBankingDetails([
                                  {
                                    id: Date.now(),
                                    bank_acc_type: "",
                                    bank_acc_holder: "",
                                    bank_acc_no: "",
                                    bank_ifsc: "",
                                  },
                                ]);
                              }
                            }}
                            disabled={
                              !groupHasBankAccount || groupBankDetailsIncomplete
                            }
                          />
                        </div>
                        {groupBankDetailsIncomplete && (
                          <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-2">
                            This option is disabled because your group's primary
                            bank account details are incomplete. Please update
                            your group profile to use this feature.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-black dark:text-gray-400 text-sm">
                    {useGroupBankAccount
                      ? "This is the primary bank account associated with your group."
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
                          value={currentBankDetail.bank_acc_type || ""}
                          onChange={(e) => handleBankingDetailChange(0, e)}
                          disabled={useGroupBankAccount}
                          ref={(el) =>
                            (errorFieldRefs.current.bank_acc_type = el)
                          }
                          className="w-full appearance-none bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-black dark:border-gray-700 rounded-md p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option
                            value=""
                            className="bg-white dark:bg-gray-800"
                          >
                            select account type
                          </option>
                          <option
                            value="current"
                            className="bg-white dark:bg-gray-800"
                          >
                            Current
                          </option>
                          <option
                            value="merchant"
                            className="bg-white dark:bg-gray-800"
                          >
                            Merchant
                          </option>
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
                      {errors.bank_acc_type && (
                        <p className="text-red-500 text-xs mt-1">
                          Account Type is required.
                        </p>
                      )}
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
                        value={currentBankDetail.bank_acc_holder || ""}
                        onChange={(e) => handleBankingDetailChange(0, e)}
                        disabled={useGroupBankAccount}
                        placeholder="eg. John Doe"
                        ref={(el) =>
                          (errorFieldRefs.current.bank_acc_holder = el)
                        }
                        className={`
    w-full 
    bg-gray-100 
    dark:bg-[#1c1c1f] 
    text-gray-900 
    dark:text-white 
    rounded-md 
    p-3 
    disabled:opacity-50 
    disabled:cursor-not-allowed 
    ${
      errors.bank_acc_holder
        ? "border-2 border-red-500"
        : "border border-black dark:border-gray-700"
    }
  `}
                      />
                      {errors.bank_acc_holder && (
                        <p className="text-red-500 text-xs mt-1">
                          Account Holder Name is required.
                        </p>
                      )}
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
                        value={currentBankDetail.bank_acc_no || ""}
                        onChange={(e) => handleBankingDetailChange(0, e)}
                        disabled={useGroupBankAccount}
                        ref={(el) => (errorFieldRefs.current.bank_acc_no = el)}
                        placeholder="xxxx-xxxx-xxxx-xxxx"
                        className={`
    w-full 
    bg-gray-100 
    dark:bg-[#1c1c1f] 
    text-gray-900 
    dark:text-white 
    rounded-md 
    p-3 
    disabled:opacity-50 
    disabled:cursor-not-allowed 
    ${
      errors.bank_acc_no
        ? "border-2 border-red-500"
        : "border border-black dark:border-gray-700"
    }
  `}
                      />
                      {errors.bank_acc_no && (
                        <p className="text-red-500 text-xs mt-1">
                          Account Number format is invalid.
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="bank_ifsc"
                        className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2"
                      >
                        IFSC code <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        id="bank_ifsc"
                        name="bank_ifsc"
                        value={currentBankDetail.bank_ifsc || ""}
                        onChange={(e) => handleBankingDetailChange(0, e)}
                        disabled={useGroupBankAccount}
                        ref={(el) => (errorFieldRefs.current.bank_ifsc = el)}
                        placeholder="xxxxxxxxxxx"
                        className={`
    w-full 
    bg-gray-100 
    dark:bg-[#1c1c1f] 
    text-gray-900 
    dark:text-white 
    rounded-md 
    p-3 
    disabled:opacity-50 
    disabled:cursor-not-allowed 
    ${
      errors.bank_ifsc
        ? "border-2 border-red-500"
        : "border border-black dark:border-gray-700"
    }
  `}
                      />
                      {errors.bank_ifsc && (
                        <p className="text-red-500 text-xs mt-1">
                          IFSC Code format is invalid.
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              )}
              <section className="space-y-6 max-w-2xl">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Seating details
                </h2>
                <p className="text-black dark:text-gray-400 text-sm">
                  Add event seating capacity and its layout
                </p>
                {(() => {
                  const seatingArrangement = (
                    mainEventData?.seating_arrangement || ""
                  )
                    .toLowerCase()
                    .trim();
                  let capacityLabel =
                    "Total number of people allowed (capacity)?";
                  if (seatingArrangement === "standing") {
                    capacityLabel =
                      "Maximum number of people allowed(capacity)?";
                  } else if (seatingArrangement.includes("seated")) {
                    capacityLabel = "Total number of seats (capacity)?";
                  } else if (
                    seatingArrangement.includes("seated and standing")
                  ) {
                    capacityLabel =
                      "Total number of seated people allowed(not for standing)?";
                  } else {
                    capacityLabel =
                      "Total number of people allowed (capacity)?";
                  }
                  return (
                    <div
                      ref={(el) => (errorFieldRefs.current.totalCapacity = el)}
                    >
                      <label
                        htmlFor="total_capacity"
                        className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2"
                      >
                        {capacityLabel}{" "}
                        <span className="text-red-500 ml-1">*</span>{" "}
                        <InfoTooltip note="Set the total number of attendees for your event." />
                      </label>
                      <input
                        type="number"
                        id="total_capacity"
                        name="total_capacity"
                        value={totalCapacity}
                        onChange={(e) => setTotalCapacity(e.target.value)}
                        ref={(el) =>
                          (errorFieldRefs.current.totalCapacity = el)
                        }
                        placeholder="event capacity"
                        className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-black dark:border-gray-700 rounded-md p-3"
                      />
                      {errors.totalCapacity && (
                        <p className="text-red-500 text-xs mt-1">
                          Total capacity must be a positive number.
                        </p>
                      )}
                    </div>
                  );
                })()}
                {paymentType === "paid" && (
                  <section className="space-y-6">
                    <div>
                      {errors.tickets && (
                        <p className="text-red-500 text-sm ">
                          Please add at least one ticket type for this paid
                          offline event.
                        </p>
                      )}
                    </div>
                    {isOfflinePaid && (
                      <>
                        <p className="text-black dark:text-gray-400 text-sm">
                          Add ticket types, set prices, and control how
                          attendees book their spot.
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenModalForAdd}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold flex items-center space-x-2 hover:bg-indigo-700 transition"
                        >
                          <span>Add tickets</span>
                          <img src={Ticket_Form_Icon} alt="" />
                        </button>

                        {/* Display Added Tickets */}
                        {tickets.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                            {tickets.map((ticket) => (
                              <div
                                key={ticket.id}
                                className="bg-gray-100 dark:bg-[#2B2B2B] p-3 rounded-lg flex items-center justify-between shadow-sm dark:shadow-none"
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
                                {/* Edit/Delete Buttons */}
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTicket(ticket);
                                      setIsTicketModalOpen(true);
                                    }}
                                    className="text-gray-400 hover:text-gray-800 dark:hover:text-white transition"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDeleteTicket(ticket.id);
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition"
                                  >
                                    &times;
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {tickets.length === 0 && (
                          <div
                            ref={(el) => (errorFieldRefs.current.tickets = el)}
                            className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg"
                          >
                            No tickets added yet. Click "Add tickets" to create
                            your first ticket type.
                          </div>
                        )}
                      </>
                    )}
                  </section>
                )}
                {locationType === "offline" && (
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-gray-900 dark:text-white text-md">
                      Do you have seating layout?
                    </label>
                    <ToggleSwitch
                      checked={hasSeatingLayout}
                      onChange={() => setHasSeatingLayout(!hasSeatingLayout)}
                    />
                  </div>
                )}
                {hasSeatingLayout && (
                  <div
                    className="animate-fade-in space-y-6"
                    ref={(el) =>
                      (errorFieldRefs.current.seatingLayoutFile = el)
                    }
                  >
                    {/* Upload Section */}
                    <div className="space-y-4">
                      <label className="flex items-center text-base font-medium text-gray-800 dark:text-gray-300">
                        Upload seating layout{" "}
                        <InfoTooltip note="Upload an image, PDF, or CAD file of your venue's seating arrangement. It will be converted to an interactive seat map." />
                      </label>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: File Upload */}
                        <div className="space-y-4">
                          <div className="flex justify-center rounded-lg border border-dashed border-black dark:border-gray-700 px-6 py-10 text-center">
                            <label
                              htmlFor="seating-layout-upload"
                              className="cursor-pointer"
                            >
                              <svg
                                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                />
                              </svg>
                              <p className="text-sm text-black dark:text-gray-400 mt-2">
                                Drag your file(s) or browse
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                Max 10 MB • PDF, DOC, PNG, JPG, CAD supported
                              </p>
                              <span className="mt-4 inline-block rounded-md font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm">
                                Browse file
                              </span>
                              <input
                                id="seating-layout-upload"
                                type="file"
                                className="sr-only"
                                onChange={handleSeatingLayoutChange}
                                accept="image/*,.pdf,.doc,.docx,.dwg,.dxf"
                              />
                            </label>
                          </div>
                          {seatingLayoutFile && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <svg
                                    className="w-8 h-8 text-green-600 dark:text-green-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                  <div>
                                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                      {seatingLayoutFile.name}
                                    </p>
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                      {(seatingLayoutFile.size / 1024).toFixed(
                                        2
                                      )}{" "}
                                      KB
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {generatedSeatingLayout && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setGeneratedSeatingLayout(null);
                                        setSeatAssignments({});
                                        showAlert({
                                          type: "info",
                                          message: "Layout Cleared",
                                          description:
                                            "You can now re-generate with different settings or upload a new file.",
                                        });
                                      }}
                                      className="text-orange-500 hover:text-orange-700 dark:hover:text-orange-400 px-2"
                                      title="Clear generated layout"
                                    >
                                      <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={removeSeatingLayout}
                                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                    title="Remove file"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                                {generatedSeatingLayout
                                  ? "✓ Layout generated. You can re-generate or upload a different file."
                                  : '✓ File uploaded. Click "Generate Layout" to create seat map.'}
                              </p>
                            </div>
                          )}
                          {seatingLayoutPreview && !generatedSeatingLayout && (
                            <div className="relative group">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                Original File Preview:
                              </p>
                              <img
                                src={seatingLayoutPreview}
                                alt="Original seating layout"
                                className="w-full h-48 rounded-lg object-cover border-2 border-gray-300 dark:border-gray-600"
                              />
                            </div>
                          )}
                          {/* Generate Layout Button */}
                          {seatingLayoutFile && totalCapacity && (
                            <div className="space-y-2">
                              <button
                                type="button"
                                onClick={handleGenerateLayout}
                                disabled={isGenerating}
                                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                              >
                                {isGenerating ? (
                                  <>
                                    <svg
                                      className="animate-spin h-5 w-5 mr-2"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                      />
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      />
                                    </svg>
                                    Generating Layout...
                                  </>
                                ) : generatedSeatingLayout ? (
                                  <>
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                      />
                                    </svg>
                                    Re-generate Layout
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                      />
                                    </svg>
                                    Generate Layout
                                  </>
                                )}
                              </button>

                              {generatedSeatingLayout && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                  Layout already generated. Upload a new file or
                                  click Re-generate to update.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        {/* Right: Interactive Seat Map Preview */}
                        <div className="space-y-3">
                          {generatedSeatingLayout ? (
                            <>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Interactive Seat Map
                                </p>
                                {isOfflinePaid && tickets.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowSeatAssignmentModal(true)
                                    }
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                      />
                                    </svg>
                                    Assign Seats
                                  </button>
                                )}
                              </div>
                              <div
                                className="border-2 border-green-500 dark:border-green-600 rounded-lg overflow-hidden"
                                style={{ aspectRatio: "16/10" }}
                              >
                                <SeatingLayoutPreview
                                  seatingLayout={generatedSeatingLayout}
                                  onSeatSelect={(seats) =>
                                    console.log("Selected seats:", seats)
                                  }
                                  darkMode={darkMode}
                                  isExpandable={true}
                                  ticketTypeAssignments={
                                    generatedSeatingLayout?.ticketTypeAssignments ||
                                    []
                                  }
                                />
                              </div>

                              {/* Instructions - Horizontal below preview */}
                              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <svg
                                    className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <div className="flex-1">
                                    <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-1">
                                      Quick Guide:
                                    </p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-blue-700 dark:text-blue-300">
                                      <span>
                                        • <strong>Drag</strong> to pan
                                      </span>
                                      <span>
                                        • <strong>Scroll</strong> to navigate
                                      </span>
                                      <span>
                                        • <strong>Hover</strong> for seat info
                                      </span>
                                      <span>
                                        • <strong>Click "Assign Seats"</strong>{" "}
                                        to assign
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center min-h-[350px] flex flex-col items-center justify-center">
                              <svg
                                className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                />
                              </svg>
                              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">
                                {totalCapacity && seatingLayoutFile
                                  ? "✓ Ready to generate"
                                  : "No preview available"}
                              </p>
                              <p className="text-gray-400 dark:text-gray-500 text-xs max-w-xs">
                                {!totalCapacity
                                  ? "Set total capacity first"
                                  : !seatingLayoutFile
                                  ? "Upload a layout file"
                                  : 'Click "Generate Layout" above'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Info Box */}
                    {generatedSeatingLayout && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <svg
                            className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div>
                            <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                              Layout Generated Successfully!
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                              Detected: {generatedSeatingLayout.totalSeats}{" "}
                              seats, {generatedSeatingLayout.rows?.length} rows
                              {generatedSeatingLayout.layoutStyle &&
                                ` • Style: ${generatedSeatingLayout.layoutStyle}`}
                            </p>
                            {Object.keys(seatAssignments).length > 0 && (
                              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                ✓ {Object.values(seatAssignments).flat().length}{" "}
                                seats assigned to ticket types
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
              {/* Simple Ticket Details for Online/Recorded Paid Events */}
              {isOnlineOrRecordedPaid && (
                <section className="bg-[#f1f1f1] dark:bg-[#2B2B2B] p-8 rounded-lg space-y-6 animate-fade-in shadow-sm dark:shadow-none">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Ticket Details
                    </h2>
                  </div>
                  <p className="text-black dark:text-gray-400 text-sm">
                    Set the price and total capacity for your {locationType} event tickets.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-2">
                    <div ref={(el) => (errorFieldRefs.current.simpleTicketPrice = el)}>
                      <label
                        htmlFor="simpleTicketPrice"
                        className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2"
                      >
                        Ticket Price (₹) <span className="text-red-500 ml-1">*</span>
                        <InfoTooltip note="Set the price per ticket for your event." />
                      </label>
                      <input
                        type="number"
                        id="simpleTicketPrice"
                        name="simpleTicketPrice"
                        value={simpleTicketPrice}
                        onChange={(e) => {
                          setSimpleTicketPrice(e.target.value);
                          setErrors((prev) => ({ ...prev, simpleTicketPrice: null }));
                        }}
                        placeholder="Enter ticket price"
                        min="1"
                        step="1"
                        className={`w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white rounded-md p-3 ${
                          errors.simpleTicketPrice
                            ? "border-2 border-red-500"
                            : "border border-black dark:border-gray-700"
                        }`}
                      />
                      {errors.simpleTicketPrice && (
                        <p className="text-red-500 text-xs mt-1">
                          Ticket price is required and must be greater than 0.
                        </p>
                      )}
                    </div>

                    <div ref={(el) => (errorFieldRefs.current.simpleTicketCapacity = el)}>
                      <label
                        htmlFor="simpleTicketCapacity"
                        className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2"
                      >
                        Total Ticket Capacity <span className="text-red-500 ml-1">*</span>
                        <InfoTooltip note="Maximum number of tickets available for sale." />
                      </label>
                      <input
                        type="number"
                        id="simpleTicketCapacity"
                        name="simpleTicketCapacity"
                        value={simpleTicketCapacity}
                        onChange={(e) => {
                          setSimpleTicketCapacity(e.target.value);
                          setErrors((prev) => ({ ...prev, simpleTicketCapacity: null }));
                        }}
                        placeholder="Enter total capacity"
                        min="1"
                        step="1"
                        className={`w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white rounded-md p-3 ${
                          errors.simpleTicketCapacity
                            ? "border-2 border-red-500"
                            : "border border-black dark:border-gray-700"
                        }`}
                      />
                      {errors.simpleTicketCapacity && (
                        <p className="text-red-500 text-xs mt-1">
                          Ticket capacity is required and must be a positive number.
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {simpleTicketPrice && simpleTicketCapacity && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                            Ticket Summary
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Price per ticket: ₹{Number(simpleTicketPrice).toLocaleString()}
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            Total tickets: {Number(simpleTicketCapacity).toLocaleString()}
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold mt-1">
                            Maximum Revenue: ₹{(Number(simpleTicketPrice) * Number(simpleTicketCapacity)).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}
              <section className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Ticketing details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-2">
                  <DateInput
                    id="booking_start_date"
                    label="Booking start date?"
                    name="booking_start_date"
                    value={bookingStartDate} // This is still a string, e.g., "2025-10-13"
                    onChange={(e) => setBookingStartDate(e.target.value)} // This still works perfectly!
                    error={errors.booking_start_date}
                    required
                    darkMode={darkMode} // Pass your dark mode state here
                    maxDate={eventEndDate}
                  />
                  <DateInput
                    id="booking_end_date"
                    label="Booking_end_date?"
                    name="booking_end_date"
                    value={bookingEndDate} // This is still a string, e.g., "2025-10-13"
                    onChange={(e) => setBookingEndDate(e.target.value)} // This still works perfectly!
                    error={errors.booking_end_date}
                    required
                    darkMode={darkMode} // Pass your dark mode state here
                    maxDate={eventEndDate}
                    minDate={bookingStartDate}
                  />
                </div>
              </section>
              <div className="pt-8 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="px-8 py-3 rounded-lg font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Go back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : "Save and continue"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      <CreateTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        onSave={setTickets}
        onResetAll={handleResetAllTickets}
        editingTicket={editingTicket}
        existingTickets={tickets}
        darkMode={darkMode}
        showAlert={showAlert}
      />
      <SeatAssignmentModal
        isOpen={showSeatAssignmentModal}
        onClose={() => setShowSeatAssignmentModal(false)}
        onSave={(newAssignments) => {
          // Deep clone to prevent mutations
          const clonedAssignments = JSON.parse(JSON.stringify(newAssignments));
          setSeatAssignments(clonedAssignments);
          // Deep clone the layout
          const updatedLayout = JSON.parse(
            JSON.stringify(generatedSeatingLayout)
          );
          // STEP 1: Update every seat with assignment + color + price
          updatedLayout.seats = updatedLayout.seats.map((seat) => {
            // Find which ticket type owns this seat
            const assignedEntry = Object.entries(clonedAssignments).find(
              ([_, seatIds]) => seatIds && seatIds.includes(seat.seatId)
            );

            if (assignedEntry) {
              const [ticketTypeId] = assignedEntry;
              const ticket = tickets.find(
                (t) => String(t.id) === String(ticketTypeId)
              );
              const color = getTicketTypeColor(ticketTypeId);
              return {
                seatId: seat.seatId,
                row: seat.row,
                column: seat.column,
                isAvailable: true,
                isSelected: false,
                ticketTypeId: String(ticketTypeId),
                ticketTypeName: ticket?.name || ticket?.ticket_type || "",
                ticketTypeColor: color,
                price: ticket?.price || ticket?.ticket_price || 0,
              };
            }
            return {
              seatId: seat.seatId,
              row: seat.row,
              column: seat.column,
              isAvailable: true,
              isSelected: false,
              ticketTypeId: null,
              ticketTypeName: null,
              ticketTypeColor: null,
              price: 0,
            };
          });
          // STEP 2: Build ticket type assignments summary with colors and price
          ticketTypeAssignments: Object.entries(clonedAssignments)
            .filter(([_, seatIds]) => seatIds && seatIds.length > 0)
            .map(([typeId, seatIds]) => {
              const ticket = tickets.find(
                (t) => String(t.id) === String(typeId)
              );
              const color = getTicketTypeColor(typeId);
              return {
                ticketTypeId: String(typeId),
                ticketTypeName: ticket?.name || ticket?.ticket_type || "",
                color: color,
                assignedSeats: [...seatIds],
                capacity: ticket?.capacity || ticket?.max_capacity || 0,
                price: ticket?.price || ticket?.ticket_price || 0, // CRITICAL: Save price
              };
            });
          setGeneratedSeatingLayout(updatedLayout);
          const totalAssigned = Object.values(clonedAssignments).flat().length;
          showAlert({
            type: "success",
            message: "Seats Assigned with Colors!",
            description: `Assigned ${totalAssigned} seats with ticket type colors.`,
          });
        }}
        seatingLayout={generatedSeatingLayout}
        ticketTypes={tickets.map((t) => ({
          id: t.id,
          name: t.name || t.ticket_type,
          capacity: t.capacity || t.max_capacity,
        }))}
        existingAssignments={seatAssignments}
        ticketTypeColors={ticketTypeColors}
        darkMode={darkMode}
        getTicketTypeColor={getTicketTypeColor}
      />
      <ExtraEventsPlanner
        isOpen={isExtraEventsModalOpen}
        onYes={handleModalYes}
        onNo={handleModalNo}
        ticketId={ticketId}
        darkMode={darkMode}
      />
    </div>
  );
};
export default UpdateTicketDetails;
