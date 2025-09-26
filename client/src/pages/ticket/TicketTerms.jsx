import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicketById } from "../../services/ticketService";
import EventSidebar from '../../components/CreateGroup/EventSidebar';
import ThemeToggle from '../../components/HomePage/ThemeToggle.jsx';
import { updateTicketTerms } from '../../services/ticketService';

// --- Helper Component: Icon ---
const RulesIcon = () => (
    <svg className="w-8 h-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.633 2.124a2.25 2.25 0 0 1 2.232-1.124h12.27a2.25 2.25 0 0 1 2.231 1.124l3.58 6.876a2.25 2.25 0 0 1 0 2.25l-3.58-6.876a2.25 2.25 0 0 1-2.232-1.124H5.865a2.25 2.25 0 0 1-2.231 1.124l-3.58 6.876a2.25 2.25 0 0 1 0 2.25L3.633 2.124Z"></path>
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z"></path>
    </svg>
);

// --- Main Component ---
const EventTermsAndConditionsPage = () => {
    // Hooks for routing and form state
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const [isChecked, setIsChecked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [ticketData, setTicketData] = useState(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    useEffect(() => {
        const fetchTicketData = async () => {
            try {
                setDataLoading(true);                
                const response = await getTicketById(ticketId);        
                let ticketInfo = response;
                if (response.data) {
                    ticketInfo = response.data;
                }
                if (response.ticket) {
                    ticketInfo = response.ticket;
                }
                setTicketData(ticketInfo);
            } catch (err) {
                console.error('Error fetching ticket data:', err);
                setError('Failed to load ticket data');
            } finally {
                setDataLoading(false);
            }
        };

        if (ticketId) {
            fetchTicketData();
        }
    }, [ticketId]);
const handleGoBack = () => {
    if (dataLoading) {
        console.log('Data still loading, please wait...'); // Debug log
        return;
    }
    if (!ticketData) {
        console.warn('No ticket data available'); // Debug log
        navigate(`/ticket/update-ticket-details/${ticketId}`);
        return;
    }
    const hasSubEvents = ticketData.sub_events && 
                        Array.isArray(ticketData.sub_events) && 
                        ticketData.sub_events.length > 0;
    // Navigate based on conditions
    if (hasSubEvents) {
        console.log('Navigating to update-ticket-addons'); // Debug log
        navigate(`/ticket/update-ticket-addons/${ticketId}`);
    } else {
        console.log('Navigating to update-ticket-details'); // Debug log
        navigate(`/ticket/update-ticket-details/${ticketId}`);
    }
};
const handleHostEvent = async (event) => {
    event.preventDefault(); // Prevents the page from reloading on form submission

    if (!isChecked) {
        setError('You must agree to the terms and conditions to host the event.');
        return;
    }
    
    if (!ticketId) {
        setError('Ticket ID is missing.');
        return;
    }

    setIsLoading(true);
    setError('');
    
    try {
        console.log('Submitting terms for ticket:', ticketId); // Debug log
        
        const updateData = {
            terms_accepted: true,
            company_terms_version: '2.0',
        };
        
        console.log('Update data:', updateData); // Debug log
        
        const response = await updateTicketTerms(ticketId, updateData);
        
        console.log('Terms update successful:', response); // Debug log
        
        // Navigate to preview page
        navigate(`/ticket/ticket-preview/${ticketId}`);
        
    } catch (err) {
        console.error('Terms update failed:', err); // Debug log
        
        // Better error handling
        let errorMessage = 'An unexpected error occurred.';
        
        if (err.response) {
            // Server responded with error status
            errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
        } else if (err.request) {
            // Network error
            errorMessage = 'Network error. Please check your connection.';
        } else if (err.message) {
            // Other error
            errorMessage = err.message;
        }
        
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
};
    return (
        <div className={darkMode ? "dark" : ""}>
            <div className="bg-white dark:bg-[#111111] text-gray-800 dark:text-white min-h-screen flex">
                <EventSidebar darkMode={darkMode} progress={100} handleBack={handleGoBack} />
                <main className="flex-1 relative p-4 sm:p-6 md:p-8 overflow-y-auto">
                    <div className="absolute top-6 right-6 z-10">
                        <ThemeToggle isDark={darkMode} onToggle={() => setDarkMode(!darkMode)} />
                    </div>
                    <div className="w-full max-w-5xl mx-auto">
                        <header className="text-center mt-4 mb-12">
                            <div className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-6 bg-gray-100 dark:bg-[#2B2B2B]">
                                <RulesIcon />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">I've reviewed the rules and I'm ready to roll!</h1>
                        </header>
                        <form onSubmit={handleHostEvent} className="space-y-8">
                            <div>
                                <label className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Terms and conditions</label>
                                <div className="h-96 flex flex-col bg-gray-50 dark:bg-[#1C1C1C] rounded-lg border border-gray-300 dark:border-gray-700">
                                    
                                    <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-gray-600 dark:text-gray-300 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                                        <p className="font-semibold text-base text-gray-800 dark:text-white">Welcome!</p>
                                        <p>
                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam cursus a quis tincidunt. Volutpat vitae diam sed nisl bibendum leo senectus donec auctor. Dictumst varius feugiat eu elit. Placerat viverra vitae ligula nunc. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet accumsan vitae ut nisl vel dolor. Scelerisque vitae quam justo pellentesque cursus justo porttitor bibendum.
                                        </p>
                                        <p>
                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam cursus a quis tincidunt. Volutpat vitae diam sed nisl bibendum leo senectus donec auctor. Dictumst varius feugiat eu elit. Placerat viverra vitae ligula nunc.
                                        </p>
                                        <p>
                                            Nullam cursus a quis tincidunt. Volutpat vitae diam sed nisl bibendum leo senectus donec auctor. Dictumst varius feugiat eu elit. Placerat viverra vitae ligula nunc. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet accumsan vitae ut nisl vel dolor.
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700/50">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="terms-agree"
                                                checked={isChecked}
                                                onChange={(e) => setIsChecked(e.target.checked)}
                                                className="w-5 h-5 mr-3 bg-gray-100 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-600 ring-offset-gray-800 focus:ring-2 accent-indigo-600"
                                            />
                                            <label htmlFor="terms-agree" className="text-base text-gray-700 dark:text-gray-300">Agree terms and conditions</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {error && <p className="text-red-500 text-center">{error}</p>}
                            <div className="pt-6 flex justify-end gap-4">
                                <button 
                                    type="button" 
                                    onClick={handleGoBack} 
                                    disabled={dataLoading}
                                    className="px-6 py-2.5 rounded-lg font-medium bg-gray-200 dark:bg-[#2B2B2B] text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {dataLoading ? 'Loading...' : 'Go back'}
                                </button>
                                <button type="button" className="px-6 py-2.5 rounded-lg font-medium bg-gray-200 dark:bg-[#2B2B2B] text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                                    Save for later
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isLoading || !isChecked}
                                    className="px-6 py-2.5 rounded-lg font-medium bg-indigo-700 text-white hover:bg-indigo-800 disabled:bg-[#2B2B2B] disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isLoading ? "Creating event..." : "Create event"}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};
export default EventTermsAndConditionsPage;
