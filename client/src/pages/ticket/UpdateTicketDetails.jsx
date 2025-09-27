import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EventSidebar from "../../components/CreateGroup/EventSidebar";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
// --- API Service Imports ---
import { getTicketById, updateTicketDetails, getGroupView } from '../../services/ticketService';

// --- Reusable Helper Components ---
const InfoTooltip = ({ note }) => (
    <div className="relative flex items-center group ml-1.5">
        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
        <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20">
            {note}
        </div>
    </div>
);

const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
    <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} disabled={disabled} />
        <div className="w-11 h-6 bg-gray-200 dark:bg-[#363A3F] rounded-full peer peer-checked:bg-indigo-600 shadow-inner-dark after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
    </label>
);

// --- Create/Edit Ticket Modal Component ---
const CreateTicketModal = ({ isOpen, onClose, onSave, onResetAll, editingTicket, existingTickets }) => {
    const [localTickets, setLocalTickets] = useState([]);
    const [ticketType, setTicketType] = useState('');
    const [ticketPrice, setTicketPrice] = useState('');
    const [totalTickets, setTotalTickets] = useState('');
    const [ticketPhoto, setTicketPhoto] = useState(null);
    const [ticketPhotoPreview, setTicketPhotoPreview] = useState('');
    const [currentEditId, setCurrentEditId] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setLocalTickets(existingTickets || []);
            if (editingTicket) {
                setTicketType(editingTicket.name);
                setTicketPrice(editingTicket.price);
                setTotalTickets(editingTicket.capacity);
                setTicketPhotoPreview(editingTicket.image);
                setTicketPhoto(editingTicket.photoFile || null);
                setCurrentEditId(editingTicket.id);
            } else {
                setCurrentEditId(null); 
                setTicketType(''); 
                setTicketPrice(''); 
                setTotalTickets(''); 
                setTicketPhoto(null); 
                setTicketPhotoPreview('');
            }
        }
    }, [editingTicket, existingTickets, isOpen]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setTicketPhoto(file);
            setTicketPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleAddOrUpdateTicket = () => {
        if (!ticketType || !ticketPrice || !totalTickets) {
            alert("Please fill in all ticket details: Type, Price, and Total Tickets.");
            return;
        }

        const ticketData = { 
            name: ticketType, 
            price: ticketPrice, 
            capacity: totalTickets, 
            image: ticketPhotoPreview || `https://i.pravatar.cc/150?u=${Date.now()}`, 
            photoFile: ticketPhoto 
        };

        if (currentEditId) {
            const updatedList = localTickets.map(t => t.id === currentEditId ? { ...ticketData, id: currentEditId } : t);
            setLocalTickets(updatedList);
        } else {
            setLocalTickets([...localTickets, { ...ticketData, id: Date.now() }]);
        }
        
        setCurrentEditId(null);
        setTicketType(''); 
        setTicketPrice(''); 
        setTotalTickets(''); 
        setTicketPhoto(null); 
        setTicketPhotoPreview('');
    };

    const handleDeleteTicket = (ticketIdToDelete) => setLocalTickets(localTickets.filter(t => t.id !== ticketIdToDelete));
    const startEditing = (ticket) => { 
        setCurrentEditId(ticket.id); 
        setTicketType(ticket.name); 
        setTicketPrice(ticket.price); 
        setTotalTickets(ticket.capacity); 
        setTicketPhotoPreview(ticket.image); 
        setTicketPhoto(ticket.photoFile || null); 
    };
    
    const handleSave = () => { 
        onSave(localTickets); 
        onClose(); 
    };
    const handleResetAll = () => {
        setLocalTickets([]);
        setCurrentEditId(null);
        setTicketType('');
        setTicketPrice('');
        setTotalTickets('');
        setTicketPhoto(null);
        setTicketPhotoPreview('');
    };


    if (!isOpen) return null;

    return (
       <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#2B2B2B] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 flex justify-between items-center flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentEditId ? "Edit Ticket" : "Create Ticket"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 text-3xl hover:text-gray-800 dark:hover:text-white transition"
            >
              &times;
            </button>
          </div>
          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Scrollable Content */}
          <div className="flex-grow overflow-y-auto p-6">
            <div className="flex gap-6">
              {/* Left Side */}
              <div className="w-1/2 space-y-5 flex flex-col">
                <input
                  type="text"
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value)}
                  placeholder="e.g. VIP, General Admission"
                  className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Ticket price
                  </label>
                  <div className="flex items-center bg-gray-100 dark:bg-[#1c1c1f] border border-gray-300 dark:border-gray-700 rounded-md">
                    <span className="text-gray-500 dark:text-gray-400 pl-3">INR</span>
                    <input
                      type="number"
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(e.target.value)}
                      placeholder="Ticket price"
                      className="w-full bg-transparent p-3 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Total tickets
                  </label>
                  <input
                    type="number"
                    value={totalTickets}
                    onChange={(e) => setTotalTickets(e.target.value)}
                    placeholder="Total tickets available"
                    className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3"
                  />
                </div>

                <div className="flex-grow flex flex-col">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Upload ticket photo
                  </label>
                  <div className="flex-grow mt-2 flex justify-center items-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700 px-6 py-10 text-center">
                    <label htmlFor="ticket-photo-upload" className="cursor-pointer">
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
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        browse your files
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Max 10 MB files are allowed
                      </p>
                      <span className="mt-4 inline-block rounded-md font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm">
                        Browse file
                      </span>
                      <input
                        id="ticket-photo-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex-shrink-0">
                  <button
                    onClick={handleAddOrUpdateTicket}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition w-full"
                  >
                    {currentEditId ? "Update Ticket" : "+ Add Ticket"}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>

              {/* Right Side */}
              <div className="w-1/2 space-y-3">
                {localTickets.length === 0 ? (
                  <div className="text-center text-gray-500 pt-16">
                    No tickets added yet.
                  </div>
                ) : (
                  localTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="bg-gray-100 dark:bg-[#363A3F] p-3 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={ticket.image}
                          alt={ticket.name}
                          className="w-16 h-16 rounded-md object-cover"
                        />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {`${ticket.name} - ₹${Number(ticket.price).toLocaleString()}`}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Capacity: {ticket.capacity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startEditing(ticket)}
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
                          onClick={() => handleDeleteTicket(ticket.id)}
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
                  ))
                )}
              </div>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Footer */}
          <div className="p-6 flex justify-end gap-4 flex-shrink-0">
            <button
              onClick={handleResetAll}
              className="px-6 py-2 bg-gray-200 dark:bg-[#363A3F] text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            >
              Reset all
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 dark:bg-[#363A3F] text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
};

// --- Main Page Component ---
const UpdateTicketDetails = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(true);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [errors, setErrors] = useState({});

    // Define a unique key for localStorage based on the ticketId
    const storageKey = `bankingAndTicketsDraft_${ticketId}`;

    // Form State with initial values that can be loaded from localStorage
    const [paymentType, setPaymentType] = useState('free');
    const [useGroupBankAccount, setUseGroupBankAccount] = useState(false);
    const [bankingDetails, setBankingDetails] = useState([{ id: Date.now(), bank_acc_type: '', bank_acc_holder: '', bank_acc_no: '', bank_ifsc: '' }]);
    const [totalCapacity, setTotalCapacity] = useState('');
    const [hasSeatingLayout, setHasSeatingLayout] = useState(false);
    const [seatingLayoutFile, setSeatingLayoutFile] = useState(null);
    const [seatingLayoutPreview, setSeatingLayoutPreview] = useState(null);
    const [groupHasBankAccount, setGroupHasBankAccount] = useState(false);
    const [groupBankDetailsIncomplete, setGroupBankDetailsIncomplete] = useState(false);
    
    // Ticketing Details State
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [editingTicket, setEditingTicket] = useState(null);
    const [bookingStartDate, setBookingStartDate] = useState('');
    const [bookingEndDate, setBookingEndDate] = useState('');

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
                    getGroupView(ticketId)
                ]);

                const ticketData = ticketResponse.ticket || ticketResponse.data || ticketResponse;
                const groupData = groupResponse.group || groupResponse.data || groupResponse;

                // Load saved draft from localStorage
                const savedDraftRaw = localStorage.getItem(storageKey);
                const savedDraft = savedDraftRaw ? JSON.parse(savedDraftRaw) : null;

                // Set initial state from API, then override with draft if it exists
                if (ticketData) {
                    // ✅ FIX: Use consistent nullish coalescing operators (??) to avoid syntax errors
                    setPaymentType(savedDraft?.paymentType ?? ticketData.payment_type ?? 'free');
                    setTotalCapacity(savedDraft?.totalCapacity ?? ticketData.total_capacity ?? '');
                    setHasSeatingLayout(savedDraft?.hasSeatingLayout ?? !!ticketData.ticket_layout);
                    setBookingStartDate(savedDraft?.bookingStartDate ?? (ticketData.booking_start_date ? new Date(ticketData.booking_start_date).toISOString().split('T')[0] : ''));
                    setBookingEndDate(savedDraft?.bookingEndDate ?? (ticketData.booking_end_date ? new Date(ticketData.booking_end_date).toISOString().split('T')[0] : ''));
                    setTickets(savedDraft?.tickets ?? ticketData.ticket_types?.map(t => ({...t, id: t._id || Date.now(), name: t.ticket_type, price: t.ticket_price, capacity: t.max_capacity, image: t.ticket_photo })) ?? []);
                }
                
                if (groupData && groupData.primary_bank_acc_no) {
                    setGroupHasBankAccount(true);
                    
                    const { primary_bank_acc_type, primary_bank_acc_holder, primary_bank_acc_no, primary_bank_ifsc } = groupData;
                    const areDetailsComplete = primary_bank_acc_type && primary_bank_acc_holder && primary_bank_acc_no && primary_bank_ifsc;

                    if (areDetailsComplete) {
                        setUseGroupBankAccount(savedDraft?.useGroupBankAccount ?? true);
                        setBankingDetails([{
                            id: groupData._id,
                            bank_acc_type: primary_bank_acc_type,
                            bank_acc_holder: primary_bank_acc_holder,
                            bank_acc_no: primary_bank_acc_no,
                            bank_ifsc: primary_bank_ifsc
                        }]);
                    } else {
                        setGroupBankDetailsIncomplete(true);
                        setUseGroupBankAccount(false);
                    }
                } else {
                    setGroupHasBankAccount(false);
                    setUseGroupBankAccount(false);
                }

                if (savedDraft?.bankingDetails && !useGroupBankAccount) {
                    setBankingDetails(savedDraft.bankingDetails);
                }
                
            } catch (error) {
                console.error("Failed to fetch initial data", error);
                setErrors({ general: error.response?.data?.message || "Failed to load event data. Please try again later." });
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [ticketId, storageKey]); // Added storageKey to dependency array

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
            bookingEndDate
        };

        localStorage.setItem(storageKey, JSON.stringify(draftData));

    }, [paymentType, useGroupBankAccount, bankingDetails, totalCapacity, hasSeatingLayout, tickets, bookingStartDate, bookingEndDate, initialLoading, storageKey]);

    const handleBankingDetailChange = (index, event) => {
        const { name, value } = event.target;
        const list = [...bankingDetails];
        list[index][name] = value;
        setBankingDetails(list);
    };

    const handleSeatingLayoutChange = (e) => {
        const file = e.target.files[0];
        if (file?.type.startsWith('image/')) {
            setSeatingLayoutFile(file);
            setSeatingLayoutPreview(URL.createObjectURL(file));
        }
    };
    
    const removeSeatingLayout = () => {
        setSeatingLayoutFile(null);
        setSeatingLayoutPreview(null);
    };

    const handleOpenModalForEdit = (ticketToEdit) => { setEditingTicket(ticketToEdit); setIsTicketModalOpen(true); };
    const handleOpenModalForAdd = () => { setEditingTicket(null); setIsTicketModalOpen(true); };
    const handleSaveOrUpdateTickets = (updatedTickets) => setTickets(updatedTickets);
    const handleDeleteTicket = (ticketIdToDelete) => {
        if (window.confirm("Are you sure you want to delete this ticket type?")) {
            setTickets(tickets.filter(t => t.id !== ticketIdToDelete));
        }
    };
    const handleResetAllTickets = () => {
        if (window.confirm("Are you sure? This will remove all added ticket types.")) {
            setTickets([]);
        }
    };
    
    const handleGoBack = () => {
        localStorage.removeItem(storageKey);
        navigate(`/ticket/update-ticket-media/${ticketId}`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const apiFormData = new FormData();
        apiFormData.append('payment_type', paymentType);
        apiFormData.append('total_capacity', totalCapacity || '0');
        apiFormData.append('use_group_bank_account', useGroupBankAccount);
        apiFormData.append('booking_start_date', bookingStartDate);
        apiFormData.append('booking_end_date', bookingEndDate);

        if (paymentType === 'paid' && !useGroupBankAccount) {
            const cleanBankingDetails = bankingDetails.map(({ id, ...rest }) => rest);
            apiFormData.append('banking_details', JSON.stringify(cleanBankingDetails));
        }

        const cleanTicketTypes = tickets.map(({ id, image, photoFile, name, price, capacity }) => ({
            ticket_type: name,
            ticket_price: price,
            max_capacity: capacity,
        }));
        apiFormData.append('ticket_types', JSON.stringify(cleanTicketTypes));

        tickets.forEach((ticket, index) => {
            if (ticket.photoFile instanceof File) {
                apiFormData.append(`ticket_photo_${index}`, ticket.photoFile);
            }
        });
        
        if (hasSeatingLayout && seatingLayoutFile instanceof File) {
            apiFormData.append('ticket_layout', seatingLayoutFile);
        }
        try {
            await updateTicketDetails(ticketId, apiFormData);
            localStorage.removeItem(storageKey); 
            navigate(`/ticket/ticket-terms/${ticketId}`); 
        } catch (error) {
            console.error("Submission failed:", error);
            setErrors({ general: error.response?.data?.message || "An error occurred while saving." });
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <div className="dark bg-gray-100 dark:bg-[#111214] min-h-screen flex items-center justify-center text-gray-900 dark:text-white text-lg">Loading banking and ticket details...</div>;
    }

    const currentBankDetail = bankingDetails[0] || {};

    return (
        <div className={darkMode ? "dark" : ""}>
            <div className="bg-gray-50 dark:bg-[#111214] text-gray-800 dark:text-white min-h-screen flex">
                <EventSidebar darkMode={darkMode} progress={63} handleBack={handleGoBack} />
                <main className="flex-1 relative p-4 sm:p-6 md:p-8 overflow-y-auto">
                    <div className="absolute top-6 right-6 z-10"><ThemeToggle isDark={darkMode} onToggle={() => setDarkMode(!darkMode)} /></div>
                    <div className="w-full max-w-5xl mx-auto">
                        <header className="text-center mt-4 mb-16">
                            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 bg-indigo-100 dark:bg-[#21163b] border-2 border-indigo-200 dark:border-[#3c2e6f]">
                                <svg className="w-10 h-10 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                            </div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Banking & Tickets</h1>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-12">
                            {errors.general && <div className="p-4 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 rounded-lg">{errors.general}</div>}
                            <section className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment type</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Select if your event is free to attend or requires a ticket purchase.</p>
                                <div>
                                    <label className="text-base font-medium text-gray-800 dark:text-gray-300 mb-3 block">Event type? <span className="text-red-500">*</span></label>
                                    <div className="flex items-center space-x-6">
                                        <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="paymentType" value="free" checked={paymentType === 'free'} onChange={() => setPaymentType('free')} className="hidden peer"/><span className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center peer-checked:border-indigo-600 dark:peer-checked:border-indigo-500"><span className="w-2.5 h-2.5 bg-indigo-600 dark:bg-indigo-500 rounded-full hidden peer-checked:block"></span></span><span className="text-gray-700 dark:text-gray-300">Free</span></label>
                                        <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="paymentType" value="paid" checked={paymentType === 'paid'} onChange={() => setPaymentType('paid')} className="hidden peer"/><span className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center peer-checked:border-indigo-600 dark:peer-checked:border-indigo-500"><span className="w-2.5 h-2.5 bg-indigo-600 dark:bg-indigo-500 rounded-full hidden peer-checked:block"></span></span><span className="text-gray-700 dark:text-gray-300">Paid</span></label>
                                    </div>
                                </div>
                                {paymentType === 'paid' && (
                                    <div className="pt-4">
                                        <div className="flex items-center justify-between">
                                            <label className={`font-medium text-md ${groupHasBankAccount ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                                Do you want to use the bank account used for group creation?
                                            </label>
                                            <ToggleSwitch
                                                checked={useGroupBankAccount}
                                                onChange={() => setUseGroupBankAccount(!useGroupBankAccount)}
                                                disabled={!groupHasBankAccount || groupBankDetailsIncomplete}
                                            />
                                        </div>
                                        {groupBankDetailsIncomplete && (
                                            <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-2">
                                                This option is disabled because your group's primary bank account details are incomplete. Please update your group profile to use this feature.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </section>
                            
                            {paymentType === 'paid' && (
                                <section className="bg-white dark:bg-[#2B2B2B] p-8 rounded-lg space-y-6 animate-fade-in shadow-sm dark:shadow-none">
                                    <div className="flex items-center space-x-4"><h2 className="text-xl font-semibold text-gray-900 dark:text-white">Banking details</h2>{!useGroupBankAccount && <span className="px-3 py-1 bg-yellow-100 dark:bg-[#282115] text-yellow-800 dark:text-[#FFB800] text-xs font-medium rounded-md">Bank account must be a current account or merchant account</span>}</div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{useGroupBankAccount ? "This is the primary bank account associated with your group." : "Provide bank account details for payment processing, settlements, or refunds."}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-2">
                                        <div><label htmlFor="bank_acc_type" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Account type <span className="text-red-500 ml-1">*</span></label><div className="relative"><select id="bank_acc_type" name="bank_acc_type" value={currentBankDetail.bank_acc_type || ''} onChange={(e) => handleBankingDetailChange(0, e)} disabled={useGroupBankAccount} className="w-full appearance-none bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3 disabled:opacity-50 disabled:cursor-not-allowed"><option value="" className="bg-white dark:bg-gray-800">select account type</option><option value="current" className="bg-white dark:bg-gray-800">Current</option><option value="merchant" className="bg-white dark:bg-gray-800">Merchant</option></select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3"><svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div></div></div>
                                        <div><label htmlFor="bank_acc_holder" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Account holder name <span className="text-red-500 ml-1">*</span></label><input type="text" id="bank_acc_holder" name="bank_acc_holder" value={currentBankDetail.bank_acc_holder || ''} onChange={(e) => handleBankingDetailChange(0, e)} disabled={useGroupBankAccount} placeholder="eg. John Doe" className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3 disabled:opacity-50 disabled:cursor-not-allowed"/></div>
                                        <div><label htmlFor="bank_acc_no" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Account number <span className="text-red-500 ml-1">*</span></label><input type="text" id="bank_acc_no" name="bank_acc_no" value={currentBankDetail.bank_acc_no || ''} onChange={(e) => handleBankingDetailChange(0, e)} disabled={useGroupBankAccount} placeholder="xxxx-xxxx-xxxx-xxxx" className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3 disabled:opacity-50 disabled:cursor-not-allowed"/></div>
                                        <div><label htmlFor="bank_ifsc" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">IFSC code <span className="text-red-500 ml-1">*</span></label><input type="text" id="bank_ifsc" name="bank_ifsc" value={currentBankDetail.bank_ifsc || ''} onChange={(e) => handleBankingDetailChange(0, e)} disabled={useGroupBankAccount} placeholder="xxxxxxxxxxx" className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3 disabled:opacity-50 disabled:cursor-not-allowed"/></div>
                                    </div>
                                </section>
                            )}
                            
                            <section className="space-y-6 max-w-2xl">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Seating details</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Add event seating capacity and its layout</p>
                                <div><label htmlFor="total_capacity" className="flex items-center text-base font-medium text-gray-800 dark:text-gray-300 mb-2">Maximum number of people allowed(capacity)? <span className="text-red-500 ml-1">*</span> <InfoTooltip note="Set the total number of attendees for your event." /></label><input type="number" id="total_capacity" value={totalCapacity} onChange={(e) => setTotalCapacity(e.target.value)} placeholder="event capacity" className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3" /></div>
                                <div className="flex items-center justify-between"><label className="font-medium text-gray-900 dark:text-white text-md">Do you have seating layout?</label><ToggleSwitch checked={hasSeatingLayout} onChange={() => setHasSeatingLayout(!hasSeatingLayout)} /></div>
                                {hasSeatingLayout && (<div className="animate-fade-in grid grid-cols-2 gap-8 items-start"><div className="col-span-1 space-y-2"><label className="flex items-center text-base font-medium text-gray-800 dark:text-gray-300">Upload seating layout <InfoTooltip note="Upload an image of your event's seating arrangement." /></label><div className="flex justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700 px-6 py-10 text-center"><label htmlFor="seating-layout-upload" className="cursor-pointer"><svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg><p className="text-sm text-gray-500 dark:text-gray-400">Drag your file(s) or browse</p><p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Max 10 MB files are allowed</p><span className="mt-4 inline-block rounded-md font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm">Browse file</span><input id="seating-layout-upload" type="file" className="sr-only" onChange={handleSeatingLayoutChange} accept="image/*" /></label></div></div><div className="col-span-1">{seatingLayoutPreview && ( <div className="relative group w-full"><img src={seatingLayoutPreview} alt="Seating layout preview" className="w-full h-auto rounded-lg object-cover" /><div onClick={removeSeatingLayout} className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer rounded-lg"><span className="text-red-500 text-3xl font-bold">&times;</span></div></div> )}</div></div>)}
                            </section>
                            
                            <section className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Ticketing details</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Add ticket types, set prices, and control how attendees book their spot.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-2">
                                    <div><label htmlFor="booking_start_date" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Booking start date? <span className="text-red-500 ml-1">*</span></label><div className="relative"><input type="date" id="booking_start_date" name="booking_start_date" value={bookingStartDate} onChange={e => setBookingStartDate(e.target.value)} className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3 appearance-none"/><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3"><svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div></div></div>
                                    <div><label htmlFor="booking_end_date" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Booking end date? <span className="text-red-500 ml-1">*</span></label><div className="relative"><input type="date" id="booking_end_date" name="booking_end_date" value={bookingEndDate} onChange={e => setBookingEndDate(e.target.value)} className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3 appearance-none"/><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3"><svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div></div></div>
                                </div>
                                <button type="button" onClick={handleOpenModalForAdd} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold flex items-center space-x-2 hover:bg-indigo-700 transition"><span>Add tickets</span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5z" /></svg></button>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                                    {tickets.map(ticket => (
                                        <div key={ticket.id} className="bg-white dark:bg-[#2B2B2B] p-3 rounded-lg flex items-center justify-between shadow-sm dark:shadow-none">
                                            <div className="flex items-center space-x-3"><img src={ticket.image} alt={ticket.name} className="w-16 h-16 rounded-md object-cover" /><div><p className="font-semibold text-gray-900 dark:text-white">{`${ticket.name} - ₹${Number(ticket.price).toLocaleString()}`}</p><p className="text-xs text-gray-500 dark:text-gray-400">Capacity: {ticket.capacity}</p></div></div>
                                            <div className="flex items-center space-x-2">
                                                <button type="button" onClick={() => handleOpenModalForEdit(ticket)} className="text-gray-400 hover:text-gray-800 dark:hover:text-white transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg></button>
                                                <button type="button" onClick={() => handleDeleteTicket(ticket.id)} className="text-gray-400 hover:text-red-500 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                            
                            <div className="pt-8 flex justify-between items-center">
                                <button type="button" onClick={handleGoBack} className="px-10 py-4 rounded-xl font-semibold text-lg bg-gray-200 dark:bg-[#363A3F] text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 transition">Go back</button>
                                <button type="submit" disabled={loading} className="px-10 py-4 rounded-xl font-semibold text-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition">
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
                onSave={handleSaveOrUpdateTickets}
                onResetAll={handleResetAllTickets}
                editingTicket={editingTicket}
                existingTickets={tickets}
            />
        </div>
    );
};

export default UpdateTicketDetails;
