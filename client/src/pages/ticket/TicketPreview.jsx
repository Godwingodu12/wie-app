import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTicketById } from "../../services/ticketService";
import { useCallback } from 'react';
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TicketIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>;
const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 21l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>;
const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>;
const EnlargeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" /></svg>;
const CakeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 3.5a1.5 1.5 0 013 0V5h2.25a.75.75 0 010 1.5H11v3.75a.75.75 0 01-1.5 0V6.5H8V8a.75.75 0 01-1.5 0V6.5H5.25a.75.75 0 010-1.5H7.5V3.5zM3 9.75a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75zM3 13.25a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /><path d="M5 16.5a1 1 0 00-1 1v.25a.75.75 0 001.5 0V17.5a1 1 0 00-1-1zM15 16.5a1 1 0 00-1 1v.25a.75.75 0 001.5 0V17.5a1 1 0 00-1-1z" /></svg>;
const ShrinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 9V5m0 0H6M10 5l-7 7m18-7v4m0 0h-4m4 0l-7 7m-7 7v-4m0 0H6m-4 0l7-7m18 7v-4m0 0h-4m4 0l-7-7" /></svg>;
const TicketPreview = () => {
    const { ticketId } = useParams();
    const API_BASE_URL = import.meta.env.VITE_TICKET_API_BASE_URL;
    console.log("API_BASE_URL:", API_BASE_URL);
const navigate = useNavigate();

    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('About & Dates');
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const heroRef = useRef(null);

    const handleGoBack = useCallback(() => {
        navigate(-1); // This navigates to the previous page in history
    }, [navigate]);
    
    // --- FULLSCREEN LOGIC ---
    const handleToggleFullscreen = () => {
        const element = heroRef.current;
        if (!element) return;

        if (!isFullscreen) {
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.mozRequestFullScreen) { // Firefox
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) { // Chrome, Safari, Opera
                element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) { // IE/Edge
                element.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    };
    const minPrice = useMemo(() => {
    // Only calculate for paid events
    if (!eventData || eventData.payment_type !== 'paid') {
        return null;
    }

    // Combine tickets from the main event and all sub-events
    const allTicketTypes = [
        ...(eventData.ticket_types || []),
        ...(eventData.sub_events || []).flatMap(sub => sub.ticket_types || [])
    ];

    // Get an array of all positive prices
    const prices = allTicketTypes
        .map(ticket => Number(ticket.ticket_price || ticket.price)) // Handles both 'price' and 'ticket_price'
        .filter(price => price > 0);

    if (prices.length === 0) {
        return null; // No priced tickets found
    }

    // Return the lowest price
    return Math.min(...prices);
}, [eventData]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    useEffect(() => {
        const fetchTicketData = async () => {
            if (!ticketId) {
                setError("No Ticket ID provided in the URL.");
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const response = await getTicketById(ticketId);
                const ticketInfo = response?.ticket || response?.data?.ticket || response?.data || response;

                            console.log("Fetched Event Data:", ticketInfo);

                
                if (!ticketInfo || !ticketInfo._id) {
                     throw new Error("Ticket data not found in the API response.");
                }

                setEventData(ticketInfo);
                
            } catch (err) {
                console.error("API call failed:", err);
                setError(err.message || 'Failed to fetch event data.');
            } finally {
                setLoading(false);
            }
        };

        fetchTicketData();
        window.scrollTo(0, 0);
    }, [ticketId]);

    const subEvents = useMemo(() => eventData?.sub_events || [], [eventData]);

    const tabs = ['About & Dates', 'Event guidelines', 'Artists', 'Photos', 'Hashtags', 'Additional info'];
    const activeTabStyle = { background: 'linear-gradient(270deg, rgba(36, 158, 255, 0.8) -8.43%, rgba(255, 255, 255, 0.8) 171.23%)' };
    const boxStyle = { background: 'linear-gradient(133.41deg, rgba(41, 121, 255, 0.1) -14.78%, rgba(185, 208, 247, 0.05) 100%)' };
    const selectedDateStyle = { background: 'linear-gradient(147.67deg, #2979FF 13.16%, #9DC1FF 100.03%)' };
    
    const fullDescription = useMemo(() => eventData?.event_description?.split('\n') || [], [eventData]);
    const truncatedDescription = useMemo(() => fullDescription.slice(0, 2), [fullDescription]);
    
    const allDates = useMemo(() => {
        if (!eventData?.event_dates?.length) return [];
        const { event_dates } = eventData;
        const startDate = new Date(event_dates[0].start_date);
        const endDate = event_dates[0].end_date ? new Date(event_dates[0].end_date) : new Date(startDate);
        const minDate = new Date(startDate);
        minDate.setDate(minDate.getDate() - 5);
        const maxDate = new Date(endDate);
        maxDate.setDate(maxDate.getDate() + 5);
        const range = [];
        let currentDate = new Date(minDate);
        while (currentDate <= maxDate) {
            range.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return range;
    }, [eventData]);

    const [selectedDate, setSelectedDate] = useState(null);
    
    useEffect(() => {
        if (eventData?.event_dates?.length) {
            setSelectedDate(eventData.event_dates[0]?.start_date || null);
        }
    }, [eventData]);

    const filteredSubEvents = useMemo(() => {
        if (!selectedDate) return [];
        return subEvents.filter(event => event.event_dates?.[0]?.start_date === selectedDate);
    }, [selectedDate, subEvents]);

    const scrollContainerRef = useRef(null);

    useEffect(() => {
        if (selectedDate && scrollContainerRef.current) {
            const selectedButton = scrollContainerRef.current.querySelector(`[data-date="${selectedDate}"]`);
            if (selectedButton) {
                setTimeout(() => {
                    selectedButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }, 100);
            }
        }
    }, [selectedDate]);

    const handleScroll = (direction) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
        }
    };

const mainEventDateRange = useMemo(() => {
    if (!eventData?.event_dates?.length) return [];

    const range = [];

    eventData.event_dates.forEach(({ start_date, end_date }) => {
        let currentDate = new Date(start_date);
        const lastDate = new Date(end_date);
        while (currentDate <= lastDate) {
            range.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });

    // To remove duplicate dates, if needed:
    const uniqueDates = Array.from(new Set(range.map(date => date.toISOString().split('T')[0])))
                             .map(dateStr => new Date(dateStr));

    return uniqueDates;
}, [eventData]);


    const renderContent = () => {
        if (!eventData) return null;

        switch (activeTab) {
            case 'About & Dates':
                return (
                    <div className="space-y-4">
                        <div style={boxStyle} className="p-6 rounded-xl">
                            <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-4">ABOUT THE PERFORMANCE</h3>
                            <div className="space-y-4 text-gray-300 text-sm">
                                {(isDescriptionExpanded ? fullDescription : truncatedDescription).map((line, index) => (
                                    <p key={index} className="flex">
                                        <span className="text-gray-500 mr-3">-</span>
                                        <span>{line}</span>
                                    </p>
                                ))}
                            </div>
                            {fullDescription.length > 2 && (
                                <button onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} className="text-white font-bold mt-6 tracking-widest text-sm">
                                    {isDescriptionExpanded ? 'READ LESS' : 'READ MORE'}
                                </button>
                            )}

                            {eventData.location_type === 'offline' && eventData.venue && eventData.location && (
                                <div className="mt-6 border-t border-gray-700 pt-6">
                                     <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-4">VENUE & LOCATION</h3>
                                     <p className="text-gray-300 text-sm"><LocationIcon/> {eventData.venue}, {eventData.location}</p>
                                </div>
                            )}
                        </div>
                        <div style={boxStyle} className="p-6 rounded-xl">
                            <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-4">EVENT DATES</h3>
                            <div className="flex flex-wrap gap-4">
                                {mainEventDateRange.map((date, index) => {
                                    const formatted = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
                                    return (
                                        <button key={index} className="bg-[#2979FF4D] text-white/80 font-semibold py-3 px-4 rounded-lg flex items-center justify-center text-sm">
                                            <CakeIcon/>
                                            {formatted}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            case 'Artists':
                 return (
                    <div style={boxStyle} className="p-6 rounded-xl">
                        {eventData.guests && eventData.guests.length > 0 ? (
                            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                                {eventData.guests.map(guest => (
                                    <div key={guest.guest_name} className="text-center">
                                       <img src={`${API_BASE_URL}/${guest.guest_profile?.replace('src\\', '').replace(/\\/g, '/')}`} alt={guest.guest_name} className="w-24 h-24 rounded-full object-cover mx-auto mb-2 border-2 border-gray-600"/>
                                        <p className="font-semibold text-white">{guest.guest_name}</p>
                                        <a href={guest.guest_link} className="text-xs text-blue-400 hover:underline">View Profile</a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center">No artists information available.</p>
                        )}
                    </div>
                 );
            case 'Photos':
                return (
                    <div style={boxStyle} className="p-6 rounded-xl">
                        {eventData.event_images && eventData.event_images.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {eventData.event_images.map((image, index) => (
                                    <div key={index} className="aspect-square rounded-lg overflow-hidden">
                                      <img src={`${API_BASE_URL}/${image.path?.replace('src\\', '').replace(/\\/g, '/')}`}  alt={`Event gallery ${index + 1}`}  className="w-full h-full object-cover"/>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center">No photos available.</p>
                        )}
                    </div>
                );
            case 'Hashtags':
                return (
                    <div style={boxStyle} className="p-6 rounded-xl">
                        {eventData.hashtag && eventData.hashtag.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {eventData.hashtag.map(tag => (
                                    <span key={tag} className="bg-gray-700 text-gray-200 text-sm font-medium px-3 py-1 rounded-full">{tag}</span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center">No hashtags available.</p>
                        )}
                    </div>
                );
            case 'Additional info':
                return (
                    <div style={boxStyle} className="p-6 rounded-xl">
                        <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-4">PROHIBITED ITEMS</h3>
                        {eventData.prohibited_items && eventData.prohibited_items.length > 0 ? (
                            <ul className="space-y-2 text-gray-300 text-sm list-disc list-inside">
                               {eventData.prohibited_items.map((item, index) => (
                                  <li key={index}>{item}</li>
                               ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400">No prohibited items listed.</p>
                        )}
                    </div>
                );
            default:
                return (
                    <div style={boxStyle} className="p-6 rounded-xl">
                         <p className="text-gray-400">Content for {activeTab} will be displayed here.</p>
                    </div>
                );
        }
    };
    
    if (loading) return <div className="bg-[#0D0D0D] text-white flex items-center justify-center min-h-screen">Loading event...</div>;
    if (error) return <div className="bg-[#0D0D0D] text-red-400 flex items-center justify-center min-h-screen">Error: {error}</div>;
    if (!eventData) return <div className="bg-[#0D0D0D] text-white flex items-center justify-center min-h-screen">No event data found.</div>;
const finalBannerUrl = `${API_BASE_URL}/${eventData.event_banner}`;
    console.log("Final Constructed Banner URL:", finalBannerUrl);
    const eventDate = eventData.event_dates?.[0]?.start_date ? new Date(eventData.event_dates[0].start_date) : new Date();
    const formattedDate = eventDate.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
    const formattedTime = eventData.event_dates?.[0]?.start_time ? 
        new Date(`1970-01-01T${eventData.event_dates[0].start_time}Z`).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) : 
        'Time TBA';

    return (
        <>
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
            <div className="bg-[#0D0D0D] text-gray-300 min-h-screen p-4 md:p-8 font-sans">
                <div className="max-w-7xl mx-auto space-y-8">
                    <button onClick={handleGoBack} className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
                        <BackIcon />
                        Back
                    </button>

                    <div 
                        ref={heroRef}
                        className="relative rounded-2xl overflow-hidden text-white p-6 md:p-10 min-h-[450px] md:min-h-[550px] flex flex-col justify-between" 
style={{ backgroundImage: `url(${API_BASE_URL}/${(eventData.event_banner || '').replace('src\\', '').replace(/\\/g, '/')})`, backgroundSize: 'cover', backgroundPosition: 'center' }}                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                        <div className="relative z-10">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {eventData.event_category && <span className="bg-white/10 backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full">{eventData.event_category}</span>}
                                {eventData.event_subcategory && <span className="bg-white/10 backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full">{eventData.event_subcategory}</span>}
                                {eventData.event_language && eventData.event_language.map(lang => (
                                    <span key={lang} className="bg-white/10 backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full">{lang}</span>
                                ))}
                                {eventData.payment_type && <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">{eventData.payment_type}</span>}
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-3">{eventData.event_name || 'Event Name'}</h1>
                            <div className="space-y-2 text-gray-200 text-sm md:text-base">
                                <p><CalendarIcon />{formattedDate}, {formattedTime}</p>
                                {eventData.location && <p><LocationIcon />{eventData.location}</p>}
                                {eventData.payment_type === 'paid' ? (
    minPrice ? (
        <p><TicketIcon />Tickets starting from ₹{minPrice.toLocaleString()}</p>
    ) : (
        <p><TicketIcon />Paid Event</p> // Fallback for paid events with no tickets yet
    )
) : (
    <p><TicketIcon />Free Entry</p>
)}
                            </div>
                        </div>
                        <div className="relative z-10">
                             <div className="h-2 mb-6"></div>
                            <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
                                <div className="flex items-center gap-4 flex-1 justify-start">
                                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-transform duration-300 transform hover:scale-105 shadow-lg">Book Now</button>
                                    <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-3 px-4 rounded-full flex items-center transition-colors duration-300"><HeartIcon /> Wishlist</button>
                                </div>
                                <div className="w-full md:w-auto order-first md:order-none flex-shrink-0">
                                    <div className="flex items-center justify-center gap-1 bg-black/20 p-1.5 rounded-full backdrop-blur-sm border border-white/10">
                                        <button className="bg-transparent hover:bg-white/10 text-white font-semibold py-2 px-2 sm:px-4 rounded-full flex items-center transition-colors duration-300 text-sm"><HeartIcon /> Like count</button>
                                        <button className="bg-transparent hover:bg-white/10 text-white font-semibold py-2 px-2 sm:px-4 rounded-full flex items-center transition-colors duration-300 text-sm"><TicketIcon /> Ticket count</button>
                                        <button className="bg-transparent hover:bg-white/10 text-white font-semibold py-2 px-2 sm:px-4 rounded-full flex items-center transition-colors duration-300 text-sm"><ShareIcon /> Share count</button>
                                    </div>
                                </div>
                                <div className="flex items-center flex-1 justify-end">
                                     <button 
                                        onClick={handleToggleFullscreen} 
                                        className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full transition-colors duration-300"
                                    >
                                        {isFullscreen ? <ShrinkIcon /> : <EnlargeIcon />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8 justify-center">
                        <div className="w-full flex justify-center">
                            <div className="bg-[#1C1C1E] p-1.5 rounded-2xl inline-flex mx-auto">
                                <nav className="flex items-center gap-1">
                                    {tabs.map(tab => {
                                        const isActive = activeTab === tab;
                                        let count = null;
                                        if (tab === 'Artists' && eventData.guests) count = eventData.guests.length;
                                        if (tab === 'Photos' && eventData.event_images) count = eventData.event_images.length;
                                        
                                        return (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className={`relative whitespace-nowrap py-3 px-5 rounded-xl font-semibold text-sm transition-all duration-300 focus:outline-none ${isActive ? 'text-white shadow-md' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                                                style={isActive ? activeTabStyle : {}}
                                            >
                                                {tab}
                                                {count > 0 && (
                                                    <sup className={`ml-1 text-xs font-bold ${isActive ? 'text-white' : 'text-blue-400'}`}>{count}</sup>
                                                )}
                                            </button>
                                        );
                                    })}
                                </nav>
                            </div>
                        </div>
                        <div>{renderContent()}</div>
                    </div>

                    <div style={boxStyle} className="p-6 rounded-2xl">
                        <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-6">Add-on shows</h3>
                        <div className="bg-[#2979FF1A] p-2 rounded-xl mb-6">
                            <div className="flex items-center">
                                <span className="font-bold text-sm text-gray-300 px-2">Date</span>
                                <button onClick={() => handleScroll('left')} className="p-2 rounded-full hover:bg-white/10"><ChevronLeftIcon /></button>
                                <div ref={scrollContainerRef} className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
                                    {allDates.map(date => {
                                        const dateString = date.toISOString().split('T')[0];
                                        const isSelected = selectedDate === dateString;
                                        return (
                                            <button 
                                                key={dateString}
                                                data-date={dateString}
                                                onClick={() => setSelectedDate(dateString)}
                                                className={`text-center py-2 px-3 w-20 flex-shrink-0 transition-colors duration-300 ${isSelected ? 'text-white' : 'rounded-lg text-gray-300 hover:bg-white/10'}`}
                                                style={isSelected ? selectedDateStyle : {}}
                                            >
                                                <p className="text-xs">{date.toLocaleDateString('en-US', { month: 'short' })}</p>
                                                <p className="font-bold text-lg">{date.getDate()}</p>
                                                <p className="text-xs">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                                <button onClick={() => handleScroll('right')} className="p-2 rounded-full hover:bg-white/10"><ChevronRightIcon /></button>
                            </div>
                        </div>
                        {filteredSubEvents.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {filteredSubEvents.map(event => (
                                    <div key={event._id} style={boxStyle} className="rounded-xl overflow-hidden group transform hover:-translate-y-2 transition-transform duration-300 shadow-lg">
                                        <img src={`${API_BASE_URL}/${event.event_banner?.replace('src\\', '').replace(/\\/g, '/')}`} alt={event.event_name} className="w-full h-40 object-cover" />
                                        <div className="p-4">
                                            <h3 className="font-bold text-lg text-white mb-1">{event.event_name}</h3>
                                            <p className="text-sm text-gray-400 mb-3">{event.event_dates?.[0]?.start_date ? new Date(event.event_dates[0].start_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date TBA'}</p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-green-400 font-semibold bg-green-900/50 px-3 py-1 text-sm rounded-md">
                                                    ₹{event.ticket_types?.[0]?.ticket_price || 'Free'}
                                                </span>
                                                <button className="bg-blue-600 text-white text-sm font-bold py-2 px-4 rounded-lg group-hover:bg-blue-700 transition-colors">View</button>
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
                </div>
            </div>
        </>
    );
};
export default TicketPreview;
