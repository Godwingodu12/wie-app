import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EventSidebar from "../../components/CreateGroup/EventSidebar";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import {
  getTicketById,
  updateTicketDetails,
  getGroupView,
} from "../../services/ticketService";

import Select from "react-select";

import Ticket_Form_Icon from "../../assets/Event/Ticket_Form_Icon.svg?react";
import Calender_Icon from "../../assets/Event/Calender_Icon.svg?react";
import CreateTicketModal from "../../components/CreateGroup/CreateTicketModal.jsx";
import Alert from "../../components/CreateGroup/Alert.jsx";
import ConfirmModal from "../../components/CreateGroup/ConfirmModal.jsx";
import ToggleSwitch from "../../components/CreateGroup/ToggleSwitch.jsx";
import InfoTooltip from "../../components/CreateGroup/InfoTooltip.jsx";
import FormInput from "../../components/CreateGroup/FormInput.jsx";
import CustomScrollbarStyles from "../../components/CreateGroup/CustomScrollbarStyles.jsx";
import DateInput from "../../components/CreateGroup/DateInput.jsx";




// --- Main Page Component ---
const UpdateTicketDetails = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState({});
      const [alert, setAlert] = useState(null);
          const [confirmState, setConfirmState] = useState({ isOpen: false, onConfirm: null, message: '' });

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
  const [groupHasBankAccount, setGroupHasBankAccount] = useState(false);
  const [groupBankDetailsIncomplete, setGroupBankDetailsIncomplete] =
    useState(false);

  // Ticketing Details State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [eventEndDate, setEventEndDate] = useState("");

  const [eventStartDate, setEventStartDate] = useState("");
  const [editingTicket, setEditingTicket] = useState(null);
  const [bookingStartDate, setBookingStartDate] = useState("");
  const [bookingEndDate, setBookingEndDate] = useState("");
  const [mainEventData, setMainEventData] = useState(null); // Changed initial state to null

  const [simpleTicketPrice, setSimpleTicketPrice] = useState("");
    const [simpleTicketCapacity, setSimpleTicketCapacity] = useState("");

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

        if (ticketData && ticketData.event_dates && ticketData.event_dates.length > 0) {
          const sortedDates = [...ticketData.event_dates].sort((a, b) => new Date(a.end_date) - new Date(b.end_date));
          const lastDate = sortedDates[sortedDates.length - 1];
          setEventEndDate(lastDate.end_date ? new Date(lastDate.end_date).toISOString().split("T")[0] : "");
        }
        const firstDate = ticketData.event_dates[0];
        setEventStartDate(firstDate.start_date ? new Date(firstDate.start_date).toISOString().split("T")[0] : "");

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
                image: t.ticket_photo,
              })) ??
              []
          );
        }
        const loadedTickets = savedDraft?.tickets ?? 
                    ticketData.ticket_types?.map((t) => ({
                        // ... (map ticket fields) ...
                        id: t._id || Date.now(),
                        name: t.ticket_type,
                        price: t.ticket_price,
                        capacity: t.max_capacity,
                        image: t.ticket_photo,
                    })) ?? [];
                
                setTickets(loadedTickets);

        // Handle banking details
        let shouldUseGroupBank = true;
        let bankDetailsToSet = [
          {
            id: Date.now(),
            bank_acc_type: "",
            bank_acc_holder: "",
            bank_acc_no: "",
            bank_ifsc: "",
          },
        ];

        const locationType = ticketData.location_type;
                if (ticketData.payment_type !== 'free' && locationType !== 'offline' && loadedTickets.length > 0) {
                    // For simple tickets, we assume only the first ticket type applies
                    setSimpleTicketPrice(savedDraft?.simpleTicketPrice ?? loadedTickets[0].price);
                    setSimpleTicketCapacity(savedDraft?.simpleTicketCapacity ?? loadedTickets[0].capacity);
                } else if (ticketData.payment_type !== 'free' && locationType !== 'offline' && loadedTickets.length === 0) {
                     // If paid, non-offline, but no tickets loaded, try to load draft
                     setSimpleTicketPrice(savedDraft?.simpleTicketPrice ?? "");
                     setSimpleTicketCapacity(savedDraft?.simpleTicketCapacity ?? "");
                }

        // Check if ticket has custom banking details saved
        if (ticketData.banking_details && ticketData.banking_details.length > 0) {
          const hasCustomBankDetails = ticketData.banking_details.some(b => !b.is_group_account);
          
          if (hasCustomBankDetails) {
            // Load custom banking details
            shouldUseGroupBank = false;
            bankDetailsToSet = ticketData.banking_details.map((b) => ({
              id: b._id || Date.now(),
              bank_acc_type: b.bank_acc_type || "",
              bank_acc_holder: b.bank_acc_holder || "",
              bank_acc_no: b.bank_acc_no || "",
              bank_ifsc: b.bank_ifsc || "",
            }));
          }
        }

        // Override with savedDraft if available
        setUseGroupBankAccount(savedDraft?.useGroupBankAccount ?? shouldUseGroupBank);
        setBankingDetails(savedDraft?.bankingDetails ?? bankDetailsToSet);

        if (groupData && groupData.primary_bank_acc_no) {
          setGroupHasBankAccount(true);
          const {
            primary_bank_acc_type,
            primary_bank_acc_holder,
            primary_bank_acc_no,
            primary_bank_ifsc,
          } = groupData;
          const normalizedAccType = primary_bank_acc_type?.toLowerCase();

          const areDetailsComplete =
            primary_bank_acc_type &&
            primary_bank_acc_holder &&
            primary_bank_acc_no &&
            primary_bank_ifsc;

          if (areDetailsComplete) {
            const groupBankDetails = [
              {
                id: groupData._id,
                bank_acc_type: normalizedAccType,
                bank_acc_holder: primary_bank_acc_holder,
                bank_acc_no: primary_bank_acc_no,
                bank_ifsc: primary_bank_ifsc,
              },
            ];
            window.groupBankDetails = groupBankDetails;
          } else {
            setGroupBankDetailsIncomplete(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch initial data", error);
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
  // Effect to save form data to localStorage whenever it changes
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
        setErrors(prev => ({ ...prev, booking_end_date: null, general: null }));

        if (newEndDate && eventEndDate && new Date(newEndDate) > new Date(eventEndDate)) {
            const errorMsg = `Booking end date cannot be after the event's end date. : ${eventEndDate}`;
            showAlert({ type: 'error', message: 'Invalid Date', description: errorMsg });
            setErrors(prev => ({ ...prev, booking_end_date: errorMsg }));
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
    if (file?.type.startsWith("image/")) {
      setSeatingLayoutFile(file);
      setSeatingLayoutPreview(URL.createObjectURL(file));
    }
  };

  const removeSeatingLayout = () => {
    setSeatingLayoutFile(null);
    setSeatingLayoutPreview(null);
  };

  const handleOpenModalForEdit = (ticketToEdit) => {
    setEditingTicket(ticketToEdit);
    setIsTicketModalOpen(true);
  };
    const handleOpenModalForAdd = () => { setEditingTicket(null); setIsTicketModalOpen(true); };

  const handleSaveOrUpdateTickets = (updatedTickets) =>
    setTickets(updatedTickets);
    const handleDeleteTicket = (ticketIdToDelete) => {
        setConfirmState({
            isOpen: true,
            message: 'Are you sure you want to delete this ticket type?',
            onConfirm: () => {
                setTickets(tickets.filter((t) => t.id !== ticketIdToDelete));
                setConfirmState({ isOpen: false });
            }
        });
    };
    const handleResetAllTickets = () => {
        setConfirmState({
            isOpen: true,
            message: 'Are you sure? This will remove all added ticket types.',
            onConfirm: () => {
                setTickets([]);
                setConfirmState({ isOpen: false });
            }
        });
    };
  const validateBankingDetails = () => {
    if (useGroupBankAccount) {
      return true; // Group bank account doesn't need validation here
    }
    const currentBankDetail = bankingDetails[0] || {};
    const requiredFields = {
      bank_acc_type: "Account Type",
      bank_acc_holder: "Account Holder Name",
      bank_acc_no: "Account Number",
      bank_ifsc: "IFSC Code",
    };

    const missingFields = [];
    Object.keys(requiredFields).forEach((field) => {
      if (!currentBankDetail[field] || currentBankDetail[field].trim() === "") {
        missingFields.push(requiredFields[field]);
      }
    });

    if (missingFields.length > 0) {
      const missingText = missingFields.join(", ");
      const errorMsg = `Please fill in the following banking details: ${missingText}`;
      showAlert({
        type: "error",
        message: "Missing Banking Details",
        description: errorMsg,
      });
      setErrors({ general: errorMsg });
      return false;
    }

    return true;
  };
  useEffect(() => {
  if (!groupHasBankAccount || groupBankDetailsIncomplete) {
    setUseGroupBankAccount(false);
  }
}, [groupHasBankAccount, groupBankDetailsIncomplete]);
  const handleGoBack = () => {
    localStorage.removeItem(storageKey);
    navigate(`/ticket/update-ticket-media/${ticketId}`);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const locationType = mainEventData?.location_type;
    const isOnlineOrRecordedPaid = paymentType === 'paid' && (locationType === 'online' || locationType === 'recorded');


    let ticketsToSubmit = tickets;

    if (isOnlineOrRecordedPaid) {
        if (!simpleTicketPrice || simpleTicketPrice <= 0 || !simpleTicketCapacity || simpleTicketCapacity <= 0) {
             const errorMsg = "Please enter a valid price and total capacity for the ticket.";
             showAlert({ type: "error", message: "Validation Error", description: errorMsg });
             setErrors({ general: errorMsg, simpleTicketPrice: !simpleTicketPrice, simpleTicketCapacity: !simpleTicketCapacity });
             setLoading(false);
             return;
        }
        
        // Create a single structured ticket object matching the schema
        ticketsToSubmit = [{
            // Use defaults for complex fields, map price/capacity
            ticket_type: 'Standard Ticket', // Default ticket name
            ticket_price: simpleTicketPrice, // Mapped value
            max_capacity: simpleTicketCapacity, // Mapped value
            ticket_photo: mainEventData?.ticket_types?.[0]?.ticket_photo || "", // Preserve existing photo URL if one exists from a previous save
        }];

    } else if (paymentType === 'paid' && tickets.length === 0) {
        // Validation for Paid Offline event missing tickets
         const errorMsg = "Please add at least one ticket type for this paid event.";
         showAlert({ type: "error", message: "Validation Error", description: errorMsg });
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

    if (bookingEndDate && bookingStartDate && new Date(bookingEndDate) < new Date(bookingStartDate)) {
      const errorMsg = "Invalid Date Range.";
      showAlert({ type: "error", message: "Validation Error", description: errorMsg });
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
      const errorMsg = "Booking end date cannot be after the event has finished.";
      showAlert({ type: "error", message: "Invalid Date Range", description: errorMsg });
      setErrors({ general: errorMsg });
      setLoading(false);
      return;
    }

// NEW LINE - Use ticketsToSubmit array
const cleanTicketTypes = ticketsToSubmit.map(
(ticket) => ({

ticket_type: ticket.ticket_type || ticket.name,
 ticket_price: ticket.ticket_price || ticket.price,
 max_capacity: ticket.max_capacity || ticket.capacity,
 ticket_photo: ticket.ticket_photo || ticket.image || '', // Ensure photo is included if needed
})
);
    apiFormData.append("ticket_types", JSON.stringify(cleanTicketTypes));

    if (locationType === 'offline') {
    ticketsToSubmit.forEach((ticket, index) => {
        if (ticket.photoFile instanceof File) {
            apiFormData.append(`ticket_photo_${index}`, ticket.photoFile);
        }
    });
}

    if (hasSeatingLayout && seatingLayoutFile instanceof File) {
      apiFormData.append("ticket_layout", seatingLayoutFile);
    }

    try {
      await updateTicketDetails(ticketId, apiFormData);
      localStorage.removeItem(storageKey);
      navigate(`/ticket/ticket-terms/${ticketId}`);
      showAlert({
        type: "success",
        message: "Details Saved!",
        description: "Banking and ticket info has been updated.",
      });
    } catch (error) {
      console.error("Submission failed:", error);
      const errorDesc = error.response?.data?.message || "An error occurred while saving.";
      showAlert({ type: "error", message: "Submission Failed", description: errorDesc });
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
    const isOfflinePaid = paymentType === 'paid' && locationType === 'offline';
    const isOnlineOrRecordedPaid = paymentType === 'paid' && (locationType === 'online' || locationType === 'recorded');
  return (
    <div className={darkMode ? "dark " : ""} >
      <CustomScrollbarStyles isDark={darkMode} />
                  <Alert alert={alert} onClose={hideAlert} />
                              <ConfirmModal isOpen={confirmState.isOpen} onClose={() => setConfirmState({isOpen: false})} onConfirm={confirmState.onConfirm} title="Confirm Action" message={confirmState.message} darkMode={darkMode} />


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
              {errors.general && (
                <div className="p-4 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 rounded-lg">
                  {errors.general}
                </div>
              )}
              <section className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Payment type
                </h2>
                <p className="text-black dark:text-gray-400 text-sm">
                  Select if your event is free to attend or requires a ticket
                  purchase.
                </p>
                <div>
                  <label className="text-base font-medium text-gray-800 dark:text-gray-300 mb-3 block">
                    Event type? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentType"
                        value="free"
                        checked={paymentType === "free"}
                        onChange={() => setPaymentType("free")}
                        className="hidden peer"
                      />
                      <span className="w-5 h-5 border-2 border-black dark:border-gray-600 rounded-full flex items-center justify-center peer-checked:border-indigo-600 dark:peer-checked:border-indigo-500">
                        <span className="w-2.5 h-2.5 bg-indigo-600 dark:bg-indigo-500 rounded-full hidden peer-checked:block"></span>
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        Free
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentType"
                        value="paid"
                        checked={paymentType === "paid"}
                        onChange={() => setPaymentType("paid")}
                        className="hidden peer"
                      />
                      <span className="w-5 h-5 border-2 border-black dark:border-gray-600 rounded-full flex items-center justify-center peer-checked:border-indigo-600 dark:peer-checked:border-indigo-500">
                        <span className="w-2.5 h-2.5 bg-indigo-600 dark:bg-indigo-500 rounded-full hidden peer-checked:block"></span>
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        Paid
                      </span>
                    </label>
                  </div>
                </div>
              </section>

              {paymentType === "paid" && (
                <section className="bg-white dark:bg-[#2B2B2B] p-8 rounded-lg space-y-6 animate-fade-in shadow-sm dark:shadow-none">
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
                              Do you want to use the bank account used for group creation?
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
                          disabled={!groupHasBankAccount || groupBankDetailsIncomplete}
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
                        value={currentBankDetail.bank_acc_no || ""}
                        onChange={(e) => handleBankingDetailChange(0, e)}
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
                        IFSC code <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        id="bank_ifsc"
                        name="bank_ifsc"
                        value={currentBankDetail.bank_ifsc || ""}
                        onChange={(e) => handleBankingDetailChange(0, e)}
                        disabled={useGroupBankAccount}
                        placeholder="xxxxxxxxxxx"
                        className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-black dark:border-gray-700 rounded-md p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
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
                <div>
                  <label
                    htmlFor="total_capacity"
                    className="flex items-center text-base font-medium text-gray-800 dark:text-gray-300 mb-2"
                  >
                    Maximum number of people allowed(capacity)?{" "}
                    <span className="text-red-500 ml-1">*</span>{" "}
                    <InfoTooltip note="Set the total number of attendees for your event." />
                  </label>
                  <input
                    type="number"
                    id="total_capacity"
                    value={totalCapacity}
                    onChange={(e) => setTotalCapacity(e.target.value)}
                    placeholder="event capacity"
                    className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-black dark:border-gray-700 rounded-md p-3"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="font-medium text-gray-900 dark:text-white text-md">
                    Do you have seating layout?
                  </label>
                  <ToggleSwitch
                    checked={hasSeatingLayout}
                    onChange={() => setHasSeatingLayout(!hasSeatingLayout)}
                  />
                </div>
                {hasSeatingLayout && (
                  <div className="animate-fade-in grid grid-cols-2 gap-8 items-start">
                    <div className="col-span-1 space-y-2">
                      <label className="flex items-center text-base font-medium text-gray-800 dark:text-gray-300">
                        Upload seating layout{" "}
                        <InfoTooltip note="Upload an image of your event's seating arrangement." />
                      </label>
                      <div className="flex justify-center rounded-lg border border-dashed border-black dark:border-gray-700 px-6 py-10 text-center">
                        <label
                          htmlFor="seating-layout-upload"
                          className="cursor-pointer"
                        >
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400 dark:text-black"
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
                          <p className="text-sm text-black dark:text-gray-400">
                            Drag your file(s) or browse
                          </p>
                          <p className="text-xs text-gray-400 dark:text-black mt-1">
                            Max 10 MB files are allowed
                          </p>
                          <span className="mt-4 inline-block rounded-md font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm">
                            Browse file
                          </span>
                          <input
                            id="seating-layout-upload"
                            type="file"
                            className="sr-only"
                            onChange={handleSeatingLayoutChange}
                            accept="image/*"
                          />
                        </label>
                      </div>
                    </div>
                    <div className="col-span-1">
                      {seatingLayoutPreview && (
                        <div className="relative group w-full">
                          <img
                            src={seatingLayoutPreview}
                            alt="Seating layout preview"
                            className="w-full h-auto rounded-lg object-cover"
                          />
                          <div
                            onClick={removeSeatingLayout}
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
    minDate="booking_start_date"
/>
                                
                                
                </div>
              </section>
              {paymentType === "paid" && (
                            <section className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                     Ticketing details
                                </h2>
                                
                                {isOfflinePaid && (
                                    <>
                                        <p className="text-black dark:text-gray-400 text-sm">
                                            Add ticket types, set prices, and control how attendees book their spot.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleOpenModalForAdd}
                                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold flex items-center space-x-2 hover:bg-indigo-700 transition"
                                        >
                                            <span>Add tickets</span>
                                            <img src={Ticket_Form_Icon} alt="" />
                                        </button>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                                            {/* ... (Mapping of complex tickets using tickets.map) ... */}
                                        </div>
                                    </>
                                )}

                                {isOnlineOrRecordedPaid && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4   rounded-lg">
                                        <FormInput
                                            label="Ticket Price"
                                            id="simpleTicketPrice"
                                            name="simpleTicketPrice"
                                            type="number"
                                            value={simpleTicketPrice}
                                            onChange={(e) => setSimpleTicketPrice(e.target.value)}
                                            placeholder="Enter Price (e.g., 500)"
                                            info="Base price for the standard ticket type."
                                            darkMode={darkMode}
                                            required={false}
                                        />
                                        <FormInput
                                            label="Total Ticket Capacity "
                                            id="simpleTicketCapacity"
                                            name="simpleTicketCapacity"
                                            type="number"
                                            value={simpleTicketCapacity}
                                            onChange={(e) => setSimpleTicketCapacity(e.target.value)}
                                            placeholder="Enter total capacity"
                                            info="Maximum number of attendees allowed."
                                            darkMode={darkMode}
                                            required={false}
                                        />
                                    </div>
                                )}
                            </section>
                        )}
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
    </div>
  );
};
export default UpdateTicketDetails;