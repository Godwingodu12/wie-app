import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getTicketById, goLiveEvent, updateTicketTerms,confirmEvent } from '../../services/ticketService';
import EventSidebar from '../../components/CreateGroup/EventSidebar';
import ThemeToggle from '../../components/HomePage/ThemeToggle.jsx';
import Alert from '../../components/CreateGroup/Alert';
import TcIcon from "../../assets/Event/T&cIcon.svg?react";
import CustomScrollbarStyles from '../../components/CreateGroup/CustomScrollbarStyles.jsx';

const EventTermsAndConditionsPage = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // --- State Management ---
    const [isChecked, setIsChecked] = useState(false);
    const [isPreviewChecked, setIsPreviewChecked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [ticketData, setTicketData] = useState(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const [alert, setAlert] = useState(null);

    // --- Alert System ---
    const showAlert = (data) => setAlert({ ...data, show: true });
    const hideAlert = () => setAlert(null);

    useEffect(() => {
        const fetchTicketData = async () => {
            try {
                setDataLoading(true);
                const response = await getTicketById(ticketId);
                let ticketInfo = response?.ticket || response?.data || response;
                setTicketData(ticketInfo);
            } catch (err) {
                console.error('Error fetching ticket data:', err);
                showAlert({type: 'error', message: 'Load Failed', description: 'Failed to load event data.'});
            } finally {
                setDataLoading(false);
            }
        };
        if (ticketId) {
            fetchTicketData();
        }
    }, [ticketId]);

    const handleGoBack = useCallback(async () => {
        if (dataLoading) return;
        
        try {
            // Re-fetch ticket data to ensure we have the latest form_progress
            const response = await getTicketById(ticketId);
            const latestTicket = response?.ticket || response?.data || response;
            
            // Determine the previous step based on form_progress
            const previousStep = latestTicket?.form_progress?.add_on_events 
                ? `/ticket/update-ticket-addons/${ticketId}` 
                : `/ticket/update-ticket-details/${ticketId}`;
            
            console.log('Navigating back to:', previousStep);
            navigate(previousStep);
            
        } catch (err) {
            console.error('Error fetching ticket data for navigation:', err);
            // Fallback navigation if API call fails
            const fallbackStep = ticketData?.form_progress?.add_on_events 
                ? `/ticket/update-ticket-addons/${ticketId}` 
                : `/ticket/update-ticket-details/${ticketId}`;
            navigate(fallbackStep);
        }
    }, [navigate, ticketId, ticketData, dataLoading]);

    const handleSaveForLater = useCallback(async () => {
        if (!ticketId) {
            showAlert({type: 'error', message: 'Error', description: 'Ticket ID is missing.'});
            return;
        }

        setIsLoading(true);
        
        try {
            // Call confirmEvent API to save the event
            await confirmEvent(ticketId);
            
            showAlert({
                type: 'success', 
                message: 'Event Saved!', 
                description: 'Your event has been saved successfully.'
            });
            
            // Navigate to confirm events page after a short delay
            setTimeout(() => {
                navigate('/ticket/confirm-events');
            }, 1500);

        } catch (err) {
            console.error('Error saving event:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save event. Please try again.';
            showAlert({
                type: 'error', 
                message: 'Save Failed', 
                description: errorMessage
            });
        } finally {
            setIsLoading(false);
        }
    }, [ticketId, navigate]);

    const handlePreview = useCallback(() => {
        // Opens the preview page in a new tab
        navigate(`/ticket/ticket-preview/${ticketId}`);
    }, [ticketId]);

    const handleHostEvent = async (event) => {
        event.preventDefault();

        if (!isChecked) {
            showAlert({type: 'error', message: 'Agreement Required', description: 'You must agree to the terms and conditions to host the event.'});
            return;
        }

        if (!isPreviewChecked) {
            showAlert({type: 'error', message: 'Preview Required', description: 'You must preview the event page and confirm before creating the event.'});
            return;
        }

        if (!ticketId) {
            showAlert({type: 'error', message: 'Error', description: 'Ticket ID is missing.'});
            return;
        }

        setIsLoading(true);
        
        try {
            const updateData = {
                terms_accepted: true,
                company_terms_version: '2.0', // This can be dynamic in the future
            };
            await updateTicketTerms(ticketId, updateData);
            await goLiveEvent(ticketId);
            
            showAlert({type: 'success', message: 'Event Created!', description: 'Your event is now successfully hosted.'});
            
            setTimeout(() => {
                navigate('/ticket/confirm-events');
            }, 1500);

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'An unexpected error occurred.';
            showAlert({type: 'error', message: 'Submission Failed', description: errorMessage});
        } finally {
            setIsLoading(false);
        }
    };

    if (dataLoading) {
        return (
            <div className="dark bg-[#111111] min-h-screen flex items-center justify-center text-white">
                Loading Terms...
            </div>
        );
    }

    return (
        <div className={darkMode ? "dark" : ""}>
            <CustomScrollbarStyles isDark={darkMode} />
            <Alert alert={alert} onClose={hideAlert} />
            <div className="bg-white dark:bg-[#111111] text-gray-800 dark:text-white min-h-screen flex flex-col md:flex-row">
                <EventSidebar 
                    darkMode={darkMode} 
                    onBackClick={handleGoBack} 
                    formProgress={ticketData?.form_progress || {}} 
                    groupId={ticketData?.groupId} 
                    ticketId={ticketId} 
                />
                <main className="flex-1 relative p-4 sm:p-6 md:p-8 overflow-y-auto">
                    <div className="absolute top-6 right-6 z-10">
                        <ThemeToggle isDark={darkMode} onToggle={() => setDarkMode(!darkMode)} />
                    </div>
                    <div className="w-full max-w-5xl mx-auto">
                        <header className="text-center mt-4 mb-12">
                            <div className={`w-20 h-20 rounded-full mx-auto my-4 flex items-center justify-center ${darkMode ? "bg-[#1E1242]" : "bg-indigo-100"}`}>
                                <img src={TcIcon} alt="" className="w-10 h-10 text-indigo-500" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                                I've reviewed the rules and I'm ready to roll!
                            </h1>
                        </header>
                        <form onSubmit={handleHostEvent} className="space-y-8">
                            <div>
                                <label className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2">
                                    Terms and conditions
                                </label>
                                <div className="h-96 flex flex-col bg-gray-50 dark:bg-[#1C1C1C] rounded-lg border border-gray-300 dark:border-gray-700">
                                    <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-gray-600 dark:text-gray-300 custom-scrollbar">
                                        <p className="font-semibold text-base text-gray-800 dark:text-white">Welcome!</p>
                                        
                                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam cursus a quis tincidunt. Volutpat vitae diam sed nisl bibendum leo senectus donec auctor. Dictumst varius feugiat eu elit. Placerat viverra vitae ligula nunc. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet accumsan vitae ut nisl vel dolor. Scelerisque vitae quam justo pellentesque cursus justo porttitor bibendum.</p>
                                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam cursus a quis tincidunt. Volutpat vitae diam sed nisl bibendum leo senectus donec auctor. Dictumst varius feugiat eu elit. Placerat viverra vitae ligula nunc.</p>
                                        <p>Nullam cursus a quis tincidunt. Volutpat vitae diam sed nisl bibendum leo senectus donec auctor. Dictumst varius feugiat eu elit. Placerat viverra vitae ligula nunc. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet accumsan vitae ut nisl vel dolor.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handlePreview}
                                        className="my-4 w-48 mx-4 px-4 py-2 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                                    >
                                        Preview Event Page
                                    </button>
                                    <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700/50">
                                        <div className="flex items-center mb-4">
                                            <input
                                                type="checkbox"
                                                id="details-confirm"
                                                checked={isPreviewChecked}
                                                onChange={(e) => setIsPreviewChecked(e.target.checked)}
                                                className="w-4 h-4 mr-3 bg-gray-100 border-gray-400 rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-600 ring-offset-gray-800 focus:ring-2 accent-indigo-600"
                                            />
                                            <label htmlFor="details-confirm" className="text-base text-gray-700 dark:text-gray-300">
                                                I have previewed the Event Page and confirmed.
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="terms-agree"
                                                checked={isChecked}
                                                onChange={(e) => setIsChecked(e.target.checked)}
                                                className="w-4 h-4 mr-3 bg-gray-100 border-gray-400 rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-600 ring-offset-gray-800 focus:ring-2 accent-indigo-600"
                                            />
                                            <label htmlFor="terms-agree" className="text-base text-gray-700 dark:text-gray-300">
                                                Agree to terms and conditions
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 flex flex-col sm:flex-row justify-end gap-4">
                                <button 
                                    type="button" 
                                    onClick={handleGoBack} 
                                    disabled={dataLoading || isLoading}
                                    className="px-6 py-2.5 rounded-lg font-medium bg-gray-200 dark:bg-[#2B2B2B] text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {dataLoading ? 'Loading...' : 'Go back'}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleSaveForLater}
                                    disabled={isLoading}
                                    className="px-6 py-2.5 rounded-lg font-medium bg-gray-200 dark:bg-[#2B2B2B] text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isLoading ? "Saving..." : "Save for later"}
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isLoading || !isChecked || !isPreviewChecked}
                                    className="px-6 py-2.5 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-[#2B2B2B] disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isLoading ? "Hosting event..." : "Host event"}
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
