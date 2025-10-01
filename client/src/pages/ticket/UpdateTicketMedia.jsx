// src/pages/UpdateTicketMedia.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { updateTicketMedia, getTicketById } from '../../services/ticketService';
import { getMe } from "../../services/userService";
import EventSidebar from "../../components/CreateGroup/EventSidebar";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import ExtraEventsPlanner from '../../components/modals/ExtraEventsPlanner';

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
    
    // Map MIME types to extensions
    const mimeToExtension = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'video/mp4': '.mp4',
        'video/avi': '.avi',
        'video/mov': '.mov',
        'video/wmv': '.wmv',
        'video/flv': '.flv',
        'video/webm': '.webm',
        'application/pdf': '.pdf',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
    };
    
    // Add proper extension if missing
    const extension = mimeToExtension[mime] || '';
    const finalFilename = filename.includes('.') ? filename : filename + extension;
    
    const bstr = atob(arr[1]); 
    let n = bstr.length; 
    const u8arr = new Uint8Array(n); 
    while (n--) { 
        u8arr[n] = bstr.charCodeAt(n); 
    } 
    return new File([u8arr], finalFilename, { type: mime }); 
};

// --- Main Component ---
const UpdateTicketMedia = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    
    console.log('UpdateTicketMedia: ticketId from useParams:', ticketId);
    console.log('UpdateTicketMedia: current URL:', window.location.href);
    
    const [darkMode, setDarkMode] = useState(true);
    const [userDetails, setUserDetails] = useState(null);
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
    const [ticketData, setTicketData] = useState(null);
    const storageKey = `ticketMediaFormData_${ticketId}`;

    // Fetch user details to determine organization type
    const fetchUserDetails = async () => {
        try {
            const response = await getMe();
            console.log('User details response:', response);
            
            if (response.data) {
                setUserDetails(response.data);
                const isEdu = response.data.role === 'organisation' && 
                             response.data.organisation_type?.toLowerCase() === 'educational';
                setIsEducationalOrg(isEdu);
                console.log('Is educational organization:', isEdu);
            }
        } catch (error) {
            console.error('Failed to fetch user details:', error);
            // Fallback to Redux state if API call fails
            if (user?.role === 'organisation' && user?.organisation_type?.toLowerCase() === 'educational') {
                setIsEducationalOrg(true);
            }
        }
    };

    useEffect(() => {
        if (!initialLoading) { 
            sessionStorage.setItem(storageKey, JSON.stringify(previews)); 
        }
    }, [previews, storageKey, initialLoading]);

    useEffect(() => {
        const initializeState = async () => {
            // First fetch user details
            await fetchUserDetails();
            
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
                    newFormData.college_authorisation = base64ToFile(loadedPreviews.college_authorisation.data, loadedPreviews.college_authorisation.name || 'college_authorisation_preview'); 
                }
                loadedPreviews.event_images.forEach((img, index) => { 
                    if (!img.isExisting && img.preview.startsWith('data:')) { 
                        const filename = img.name || `event_image_${index}_preview`;
                        newFormData.event_images.push(base64ToFile(img.preview, filename)); 
                    } 
                });
                setFormData(fd => ({...fd, ...newFormData}));
            }
            
            // Always fetch ticket data to get groupId
            try {
                const response = await getTicketById(ticketId);
                const ticket = response?.ticket;
                if (ticket) {
                    setTicketData(ticket); // Store the ticket data
                    
                    // Only set media if not loaded from session storage
                    if (!loadedPreviews) {
                        const getUrl = (path) => path ? `${import.meta.env.VITE_TICKET_API_BASE_URL}/${path.replace(/\\/g, '/')}` : null;
                        const serverMedia = { 
                            event_logo: getUrl(ticket.event_logo), 
                            event_banner: getUrl(ticket.event_banner), 
                            college_authorisation: ticket.college_authorisation, 
                            event_images: (ticket.event_images || []).map(img => ({ 
                                id: img.path, 
                                preview: getUrl(img.path), 
                                name: img.originalName, 
                                isExisting: true 
                            })) 
                        };
                        setPreviews(serverMedia);
                        setExistingMedia(serverMedia);
                    }
                }
            } catch (error) { 
                console.error("Failed to fetch ticket data:", error); 
            }
            
            setInitialLoading(false);
        };

        initializeState();
    }, [ticketId, storageKey]);

    const handleSingleFileChange = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file types based on field
        const allowedTypes = {
            event_logo: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
            event_banner: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
            college_authorisation: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        };

        if (allowedTypes[type] && !allowedTypes[type].includes(file.type)) {
            const typeNames = {
                event_logo: 'images (JPG, JPEG, PNG, GIF, WEBP)',
                event_banner: 'images (JPG, JPEG, PNG, GIF, WEBP)',
                college_authorisation: 'documents (PDF, DOC, DOCX)'
            };
            setErrors(prev => ({ 
                ...prev, 
                [type]: `Only ${typeNames[type]} are allowed for ${type.replace('_', ' ')}.` 
            }));
            return;
        }

        // Validate file size (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            setErrors(prev => ({ 
                ...prev, 
                [type]: 'File size must be less than 50MB.' 
            }));
            return;
        }

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
        setErrors(prev => ({ ...prev, [type]: null }));
    };
    
    const handleMultipleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Check total files limit
        const currentCount = previews.event_images.length;
        if (currentCount + files.length > 10) {
            setErrors(prev => ({ 
                ...prev, 
                event_images: `Cannot add ${files.length} files. Maximum 10 files allowed (currently have ${currentCount}).` 
            }));
            return;
        }

        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'
        ];
        
        const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
        if (invalidFiles.length > 0) { 
            setErrors(prev => ({ 
                ...prev, 
                event_images: "Only images (JPG, JPEG, PNG, GIF, WEBP) and videos (MP4, AVI, MOV, WMV, FLV, WEBM) are allowed" 
            })); 
            return; 
        }

        // Check video count limit
        const videoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
        const newVideoCount = files.filter(file => videoTypes.includes(file.type)).length;
        const existingVideoCount = previews.event_images.filter(img => 
            img.name && videoTypes.some(type => img.name.toLowerCase().endsWith(type.split('/')[1]))
        ).length;

        if (existingVideoCount + newVideoCount > 1) {
            setErrors(prev => ({ 
                ...prev, 
                event_images: "Maximum 1 video file allowed in event images" 
            }));
            return;
        }

        // Check file sizes
        const maxSize = 50 * 1024 * 1024; // 50MB
        const oversizedFiles = files.filter(file => file.size > maxSize);
        if (oversizedFiles.length > 0) {
            setErrors(prev => ({ 
                ...prev, 
                event_images: "One or more files exceed the 50MB limit" 
            }));
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
        if (ticketData?.groupId) {
            navigate(`/ticket/create-event/${ticketData.groupId}/${ticketId}`);
        } else {
            // Fallback: try to navigate without groupId (will use the alternate route)
            console.warn('No groupId found, navigating with ticketId only');
            navigate(`/ticket/create-event/${ticketId}`);
        }
    }, [navigate, ticketId, storageKey, ticketData]);
    const validateForm = () => {
        const newErrors = {};
        
        // Check if educational org needs college authorization
        if (isEducationalOrg && !formData.college_authorisation && !existingMedia.college_authorisation) {
            newErrors.college_authorisation = "College authorization file is required for educational organizations.";
        }

        // Check if at least one media file is provided
        const hasLogo = formData.event_logo || existingMedia.event_logo;
        const hasBanner = formData.event_banner || existingMedia.event_banner;
        const hasImages = formData.event_images.length > 0 || previews.event_images.some(img => img.isExisting);
        
        if (!hasLogo && !hasBanner && !hasImages) {
            newErrors.general = "At least one media file (logo, banner, or images) must be uploaded.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        const submitData = new FormData();
        
        // Only append files that are actually File objects
        if (formData.event_logo instanceof File) {
            submitData.append('event_logo', formData.event_logo);
        }
        if (formData.event_banner instanceof File) {
            submitData.append('event_banner', formData.event_banner);
        }
        if (formData.college_authorisation instanceof File) {
            submitData.append('college_authorisation', formData.college_authorisation);
        }
        if (formData.event_images?.length) { 
            formData.event_images.forEach(file => { 
                if (file instanceof File) {
                    submitData.append('event_images', file);
                }
            }); 
        }

        // Debug: Log what's being sent
        console.log('Submitting form data:');
        for (let [key, value] of submitData.entries()) {
            console.log(key, value);
        }
        
        try {
            const response = await updateTicketMedia(ticketId, submitData);
            console.log('Upload successful:', response);
            sessionStorage.removeItem(storageKey);
            setIsExtraEventsModalOpen(true);
        } catch (error) {
            console.error("Error submitting media:", error);
            const errorMessage = error.response?.data?.message || error.message || "An error occurred during upload.";
            setErrors({ general: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const handleModalYes = () => {
        console.log('UpdateTicketMedia: handleModalYes called with ticketId:', ticketId);
        setIsExtraEventsModalOpen(false);
    };

    const handleModalNo = () => {
        console.log('UpdateTicketMedia: handleModalNo called with ticketId:', ticketId);
        setIsExtraEventsModalOpen(false);
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
                                    acceptedFiles=".pdf,.doc,.docx" 
                                    maxSizeMB={50} 
                                    info="Required for educational organizations. Upload PDF, DOC, or DOCX file." 
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
                                    acceptedFiles=".jpg,.jpeg,.png,.gif,.webp"
                                    maxSizeMB={50} 
                                    info="1:1 ratio recommended. JPG, JPEG, PNG, GIF, or WEBP format." 
                                />
                                <FileInput 
                                    id="event_banner" 
                                    label="Event Banner" 
                                    onFileChange={handleSingleFileChange} 
                                    onRemove={removeSingleFile} 
                                    preview={previews.event_banner} 
                                    error={errors.event_banner} 
                                    acceptedFiles=".jpg,.jpeg,.png,.gif,.webp"
                                    maxSizeMB={50} 
                                    info="2:1 ratio recommended. JPG, JPEG, PNG, GIF, or WEBP format." 
                                />
                            </div>
                            
                            <div>
                                <label className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                    Images & Videos <InfoTooltip note="Max 10 files total, max 1 video. Supported: JPG, JPEG, PNG, GIF, WEBP, MP4, AVI, MOV, WMV, FLV, WEBM." />
                                </label>
                                {previews.event_images.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                                        {previews.event_images.map((img) => (
                                            <div key={img.id} className="relative aspect-square bg-gray-100 dark:bg-[#2B2B2B] rounded-lg overflow-hidden group">
                                                {img.name && img.name.includes('.mp4') ? (
                                                    <video src={img.preview} className="w-full h-full object-cover" controls />
                                                ) : (
                                                    <img src={img.preview} alt={img.name || 'preview'} className="w-full h-full object-cover" />
                                                )}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button type="button" onClick={() => removeImageFromList(img.id)} className="text-white text-3xl font-bold hover:text-red-400">&times;</button>
                                                </div>
                                                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                                    {img.isExisting ? 'Existing' : 'New'}
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
                                    <span className="text-xs text-gray-500">
                                        {previews.event_images.length}/10 files • Max 1 video
                                    </span>
                                    <input 
                                        id="event_images_input" 
                                        type="file" 
                                        multiple 
                                        accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.wmv,.flv,.webm"
                                        onChange={handleMultipleFileChange} 
                                        className="sr-only"
                                    />
                                </label>
                                {errors.event_images && <p className="text-red-500 mt-2 text-sm">{errors.event_images}</p>}
                            </div>
                            
                            {errors.general && <p className="text-red-500 mt-4 text-center font-medium">{errors.general}</p>}
                            
                            <div className="pt-8 flex justify-end gap-4">
                                <button 
                                    type="button" 
                                    onClick={handleBack} 
                                    disabled={loading}
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
            
            <ExtraEventsPlanner 
                isOpen={isExtraEventsModalOpen} 
                onYes={handleModalYes} 
                onNo={handleModalNo} 
                ticketId={ticketId}
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
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 text-sm font-bold flex items-center justify-center hover:bg-red-700"
                    >
                        &times;
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Drag & drop or <span className="font-semibold text-indigo-500 dark:text-indigo-400 cursor-pointer">browse</span>
                    </p>
                    <p className="text-xs text-gray-500">Max file size: {maxSizeMB}MB</p>
                    {acceptedFiles && (
                        <p className="text-xs text-gray-400">
                            Accepted: {acceptedFiles.replace(/\./g, '').toUpperCase()}
                        </p>
                    )}
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
        {error && <small className="text-red-500 mt-2 block text-left font-medium">{error}</small>}
    </div>
);
export default UpdateTicketMedia;
