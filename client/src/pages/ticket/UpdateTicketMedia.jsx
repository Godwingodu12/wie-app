// src/pages/UpdateTicketMedia.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { updateTicketMedia, getTicketById } from '../../services/ticketService';
import EventSidebar from "../../components/CreateGroup/EventSidebar";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import ExtraEventsPlanner from '../../components/modals/ExtraEventsPlanner'; // Import the new modal

// --- Helper Components & Functions ---
const InfoTooltip = ({ note }) => ( 
    <div className="relative flex items-center group ml-1.5"> 
        <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
        </svg> 
        <div className="absolute left-full ml-2 w-max max-w-xs p-2 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"> 
            {note} 
        </div> 
    </div> 
);

const fileToBase64 = (file) => new Promise((resolve, reject) => { 
    const reader = new FileReader(); 
    reader.readAsDataURL(file); 
    reader.onload = () => resolve(reader.result); 
    reader.onerror = error => reject(error); 
});

const base64ToFile = (base64, filename) => { 
    const arr = base64.split(','); 
    const mimeMatch = arr[0].match(/:(.*?);/); 
    if (!mimeMatch) return null; 
    const mime = mimeMatch[1]; 
    const bstr = atob(arr[1]); 
    let n = bstr.length; 
    const u8arr = new Uint8Array(n); 
    while (n--) { 
        u8arr[n] = bstr.charCodeAt(n); 
    } 
    return new File([u8arr], filename, { type: mime }); 
};

// --- Main Component ---
const UpdateTicketMedia = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    
    // Debug log to check if ticketId is available
    console.log('UpdateTicketMedia: ticketId from useParams:', ticketId);
    console.log('UpdateTicketMedia: current URL:', window.location.href);
    
    const [darkMode, setDarkMode] = useState(true);
    const [isEducationalOrg, setIsEducationalOrg] = useState(false);
    const [formData, setFormData] = useState({ 
        event_logo: null, 
        event_banner: null, 
        event_images: [], 
        college_authorisation: null 
    });
    const [previews, setPreviews] = useState({ 
        event_logo: null, 
        event_banner: null, 
        event_images: [], 
        college_authorisation: null 
    });
    const [existingMedia, setExistingMedia] = useState({ 
        event_logo: null, 
        event_banner: null, 
        event_images: [], 
        college_authorisation: null 
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isExtraEventsModalOpen, setIsExtraEventsModalOpen] = useState(false);
    
    const storageKey = `ticketMediaFormData_${ticketId}`;

    useEffect(() => {
        if (!initialLoading) { 
            sessionStorage.setItem(storageKey, JSON.stringify(previews)); 
        }
    }, [previews, storageKey, initialLoading]);

    useEffect(() => {
        const initializeState = async () => {
            let loadedPreviews = null;
            const savedState = sessionStorage.getItem(storageKey);
            if (savedState) {
                try { 
                    loadedPreviews = JSON.parse(savedState); 
                } catch (e) { 
                    sessionStorage.removeItem(storageKey); 
                }
            }
            if (loadedPreviews) {
                setPreviews(loadedPreviews);
                const newFormData = { event_images: [] };
                if (loadedPreviews.event_logo?.startsWith('data:')) 
                    newFormData.event_logo = base64ToFile(loadedPreviews.event_logo, 'event_logo_preview');
                if (loadedPreviews.event_banner?.startsWith('data:')) 
                    newFormData.event_banner = base64ToFile(loadedPreviews.event_banner, 'event_banner_preview');
                if (typeof loadedPreviews.college_authorisation === 'object' && loadedPreviews.college_authorisation?.data) { 
                    newFormData.college_authorisation = base64ToFile(loadedPreviews.college_authorisation.data, loadedPreviews.college_authorisation.name); 
                }
                loadedPreviews.event_images.forEach(img => { 
                    if (!img.isExisting && img.preview.startsWith('data:')) { 
                        newFormData.event_images.push(base64ToFile(img.preview, img.name)); 
                    } 
                });
                setFormData(fd => ({...fd, ...newFormData}));
            } else {
                try {
                    const response = await getTicketById(ticketId);
                    const ticketData = response?.ticket;
                    if (ticketData) {
                        const getUrl = (path) => path ? `${process.env.TICKET_API_BASE_URL}/${path.replace(/\\/g, '/')}` : null;
                        const serverMedia = { 
                            event_logo: getUrl(ticketData.event_logo), 
                            event_banner: getUrl(ticketData.event_banner), 
                            college_authorisation: ticketData.college_authorisation, 
                            event_images: (ticketData.event_images || []).map(img => ({ 
                                id: img.path, 
                                preview: getUrl(img.path), 
                                name: img.originalName, 
                                isExisting: true 
                            })) 
                        };
                        setPreviews(serverMedia);
                        setExistingMedia(serverMedia);
                    }
                } catch (error) { 
                    console.error("Failed to fetch media:", error); 
                }
            }
            setInitialLoading(false);
        };
        if (user?.role === 'organisation' && user?.organisation_type?.toLowerCase() === 'educational') { 
            setIsEducationalOrg(true); 
        }
        initializeState();
    }, [ticketId, storageKey, user]);

    const handleSingleFileChange = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        try {
            const base64 = await fileToBase64(file);
            if (type === 'college_authorisation') { 
                setPreviews(prev => ({ ...prev, [type]: { name: file.name, data: base64 } })); 
            } else { 
                setPreviews(prev => ({ ...prev, [type]: base64 })); 
            }
            setFormData(prev => ({ ...prev, [type]: file }));
            setErrors(prev => ({ ...prev, [type]: null }));
        } catch (error) { 
            setErrors(prev => ({ ...prev, [type]: "Could not read the selected file." })); 
        } finally { 
            setLoading(false); 
        }
    };

    const removeSingleFile = (type) => {
        setPreviews(prev => ({ ...prev, [type]: existingMedia[type] || null }));
        setFormData(prev => ({ ...prev, [type]: null }));
    };
    
    const handleMultipleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf'];
        const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
        if (invalidFiles.length > 0) { 
            setErrors(prev => ({ ...prev, event_images: "Only images, videos, and PDF documents are allowed" })); 
            return; 
        }
        setLoading(true);
        const fileProcessingPromises = files.map(async (file) => {
            try {
                const base64 = await fileToBase64(file);
                return { 
                    id: `${file.name}-${file.lastModified}`, 
                    preview: base64, 
                    name: file.name, 
                    isExisting: false, 
                    originalFile: file 
                };
            } catch (error) { 
                return null; 
            }
        });
        try {
            const processedItems = await Promise.all(fileProcessingPromises);
            const validItems = processedItems.filter(item => item !== null);
            if (validItems.length === 0) { 
                setErrors(prev => ({...prev, event_images: "Error processing files."})); 
                return; 
            }
            setPreviews(prev => ({ ...prev, event_images: [...prev.event_images, ...validItems] }));
            setFormData(prev => ({ 
                ...prev, 
                event_images: [ ...prev.event_images, ...validItems.map(item => item.originalFile) ] 
            }));
            setErrors(prev => ({...prev, event_images: null}));
        } catch (error) { 
            setErrors(prev => ({...prev, event_images: "Error processing one or more files."})); 
        } finally { 
            setLoading(false); 
        }
    };

    const removeImageFromList = (idToRemove) => {
        const fileToRemove = previews.event_images.find(img => img.id === idToRemove);
        if (!fileToRemove) return;
        setPreviews(prev => ({ 
            ...prev, 
            event_images: prev.event_images.filter(img => img.id !== idToRemove) 
        }));
        if (!fileToRemove.isExisting) {
            setFormData(prev => ({ 
                ...prev, 
                event_images: prev.event_images.filter(file => { 
                    const fileId = `${file.name}-${file.lastModified}`; 
                    return fileId !== idToRemove; 
                })
            }));
        }
    };

    const handleBack = useCallback(() => {
        sessionStorage.removeItem(storageKey);
        navigate(`/create-ticket/basic-info/${ticketId}`);
    }, [navigate, ticketId, storageKey]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const submitData = new FormData();
        if (formData.event_logo) submitData.append('event_logo', formData.event_logo);
        if (formData.event_banner) submitData.append('event_banner', formData.event_banner);
        if (formData.college_authorisation) submitData.append('college_authorisation', formData.college_authorisation);
        if (formData.event_images?.length) { 
            formData.event_images.forEach(file => { 
                if (file instanceof File) submitData.append('event_images', file); 
            }); 
        }
        
        try {
            await updateTicketMedia(ticketId, submitData);
            sessionStorage.removeItem(storageKey);
            console.log('UpdateTicketMedia: Opening modal with ticketId:', ticketId);
            setIsExtraEventsModalOpen(true);
        } catch (error) {
            console.error("Error submitting media:", error);
            const errorMessage = error.response?.data?.message || "An error occurred during upload.";
            setErrors({ general: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const handleModalYes = () => {
        console.log('UpdateTicketMedia: handleModalYes called with ticketId:', ticketId);
        setIsExtraEventsModalOpen(false);
        // Navigation will be handled by the modal itself
    };

    const handleModalNo = () => {
        console.log('UpdateTicketMedia: handleModalNo called with ticketId:', ticketId);
        setIsExtraEventsModalOpen(false);
        // Navigation will be handled by the modal itself
    };

    if (initialLoading) {
        return (
            <div className="dark bg-[#212426] min-h-screen flex items-center justify-center text-white">
                Loading Media Editor...
            </div>
        );
    }

    return (
        <div className={darkMode ? "dark" : ""}>
            <div className="bg-white dark:bg-[#212426] text-gray-800 dark:text-white min-h-screen flex">
                <EventSidebar darkMode={darkMode} progress={42} handleBack={handleBack} />
                <main className="flex-1 relative p-4 sm:p-6 md:p-8 overflow-y-auto">
                    <div className="absolute top-6 right-6 z-10">
                        <ThemeToggle isDark={darkMode} onToggle={() => setDarkMode(!darkMode)} />
                    </div>
                    <div className="w-full max-w-5xl mx-auto">
                        <header className="text-center mt-4 mb-12">
                            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 bg-[#2B2B2B] border border-gray-700">
                               <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                               </svg>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Showcase Your Event</h1>
                            <p className="text-gray-500 dark:text-gray-400">Drop your visuals here to bring your event to life.</p>
                        </header>
                        <form onSubmit={handleSubmit} className="space-y-12">
                            {isEducationalOrg && (
                                <FileInput 
                                    id="college_authorisation" 
                                    label="Authorisation Letter*" 
                                    onFileChange={handleSingleFileChange} 
                                    onRemove={removeSingleFile} 
                                    preview={previews.college_authorisation} 
                                    error={errors.college_authorisation} 
                                    isDocument={true} 
                                    maxSizeMB={10} 
                                    info="Required for educational organizations." 
                                />
                            )}
                            <div className="grid md:grid-cols-2 gap-8">
                                <FileInput 
                                    id="event_logo" 
                                    label="Event or Organisation Logo" 
                                    onFileChange={handleSingleFileChange} 
                                    onRemove={removeSingleFile} 
                                    preview={previews.event_logo} 
                                    error={errors.event_logo} 
                                    maxSizeMB={10} 
                                    info="1:1 ratio recommended." 
                                />
                                <FileInput 
                                    id="event_banner" 
                                    label="Event Banner" 
                                    onFileChange={handleSingleFileChange} 
                                    onRemove={removeSingleFile} 
                                    preview={previews.event_banner} 
                                    error={errors.event_banner} 
                                    maxSizeMB={10} 
                                    info="2:1 ratio recommended." 
                                />
                            </div>
                            <div>
                                <label className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                    Images & Videos <InfoTooltip note="Max 10 files (1 video)." />
                                </label>
                                {previews.event_images.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                                        {previews.event_images.map((img) => (
                                            <div key={img.id} className="relative aspect-square bg-gray-100 dark:bg-[#2B2B2B] rounded-lg overflow-hidden group">
                                                <img src={img.preview} alt={img.name || 'preview'} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button type="button" onClick={() => removeImageFromList(img.id)} className="text-white text-3xl font-bold">&times;</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <label htmlFor="event_images_input" className="relative rounded-lg p-5 text-center bg-gray-100 dark:bg-[#2B2B2B] flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[150px] border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                    </svg>
                                    <span className="text-indigo-500 dark:text-indigo-400 font-semibold">Add more files...</span>
                                    <input id="event_images_input" type="file" multiple onChange={handleMultipleFileChange} className="sr-only"/>
                                </label>
                            </div>
                            {errors.general && <p className="text-red-500 mt-4 text-center">{errors.general}</p>}
                            <div className="pt-8 flex justify-end gap-4">
                                <button 
                                    type="button" 
                                    onClick={handleBack} 
                                    className="px-8 py-3 rounded-lg font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                                >
                                    Go back
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={loading} 
                                    className="px-8 py-3 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {loading ? "Saving..." : "Save and continue"}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
            
            {/* Pass ticketId explicitly to the modal */}
            <ExtraEventsPlanner 
                isOpen={isExtraEventsModalOpen} 
                onYes={handleModalYes} 
                onNo={handleModalNo} 
                ticketId={ticketId}  // ← This is the key line that passes ticketId
            />
        </div>
    );
};

// --- Sub-Component: File Input ---
const FileInput = ({ id, label, info, acceptedFiles, maxSizeMB, error, preview, onFileChange, onRemove, isDocument = false }) => (
    <div>
        <label className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            {label}{info && <InfoTooltip note={info} />}
        </label>
        <div className={`relative rounded-lg p-5 text-center bg-gray-100 dark:bg-[#2B2B2B] min-h-[220px] flex justify-center items-center`}>
            {preview ? (
                <div className="w-full h-full min-h-[180px] flex justify-center items-center">
                    {isDocument ? (
                        <div className="text-center">
                            <span role="img" aria-label="document" className="text-5xl">📄</span>
                            <p className="mt-2 text-sm text-gray-300 break-all">
                                {typeof preview === 'object' ? preview.name : 'Document'}
                            </p>
                        </div>
                    ) : (
                        <img src={preview} alt={`${label} preview`} className="max-w-full max-h-[180px] object-contain rounded-lg"/>
                    )}
                    <button 
                        type="button" 
                        onClick={() => onRemove(id)} 
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 text-sm font-bold flex items-center justify-center"
                    >
                        &times;
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Drag & drop or <span className="font-semibold text-indigo-500 dark:text-indigo-400">browse</span>
                    </p>
                    <p className="text-xs text-gray-500">Max file size: {maxSizeMB}MB</p>
                </div>
            )}
            <input 
                id={id + "_input"} 
                type="file" 
                accept={acceptedFiles} 
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" 
                onChange={(e) => onFileChange(e, id)} 
            />
        </div>
        {error && <small className="text-red-500 mt-2 block text-left">{error}</small>}
    </div>
);

export default UpdateTicketMedia;