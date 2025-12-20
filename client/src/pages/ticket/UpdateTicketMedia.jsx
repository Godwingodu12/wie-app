import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { updateTicketMedia, getTicketById } from "../../services/ticketService";
import { getUserData } from "../../services/ticketService";
import EventSidebar from "../../components/CreateGroup/EventSidebar";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import Alert from "../../components/CreateGroup/Alert";
import { SlSizeFullscreen } from "react-icons/sl";
import { arrayMove } from "@dnd-kit/sortable";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

import MediaIcon from "../../assets/Event/MediaIcon.svg?react";
import InfoTooltip from "../../components/CreateGroup/InfoTooltip.jsx";
import FileInput from "../../components/CreateGroup/FileInput.jsx";
import ScrollBarStyle from "../../components/ScrollBarStyle.jsx";
// IMPORT the necessary utility function
import { getTicketImageUrl } from "../../utils/imageUtils"; // Assuming imageUtils path
import getInitialTheme from "../../components/CreateGroup/getIntialTheme.jsx";
import FullScreenViewer from "../../components/CreateGroup/FullScreenViewer.jsx";
import FileMediaInput from "../../components/CreateGroup/FileMediaInput.jsx";
import SortablePhoto from "../../components/CreateGroup/SortablePhoto.jsx";

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const base64ToFile = (base64, filename) => {
  const arr = base64.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) return null;
  const mime = mimeMatch[1];

  const mimeToExtension = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/avi": ".avi",
    "video/mov": ".mov",
    "video/wmv": ".wmv",
    "video/flv": ".flv",
    "video/webm": ".webm",
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      ".docx",
  };

  const extension = mimeToExtension[mime] || "";
  const finalFilename = filename.includes(".")
    ? filename
    : filename + extension;

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
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const showAlert = location.state?.showAlert;
  const [darkMode, setDarkMode] = useState(getInitialTheme());
  const [isEducationalOrg, setIsEducationalOrg] = useState(false);
  const [fullScreenViewer, setFullScreenViewer] = useState(null);
  const [formData, setFormData] = useState({
    event_logo: null,
    event_banner: null,
    event_portrait: null,
    event_images: [],
    event_videos: [],
    college_authorisation: null,
  });
  const [previews, setPreviews] = useState({
    event_logo: null,
    event_banner: null,
    event_portrait: null,
    event_images: [],
    event_videos: [],
    college_authorisation: null,
  });
  const [existingMedia, setExistingMedia] = useState({
    event_logo: null,
    event_banner: null,
    event_portrait: null,
    event_images: [],
    event_videos: [],
    college_authorisation: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [ticketData, setTicketData] = useState(null);
  const [userDetails, setUserDetails] = useState(null); // Added for consistency
  const [alert, setAlert] = useState(null);
const [isReorderingImages, setIsReorderingImages] = useState(false);
const [isReorderingVideos, setIsReorderingVideos] = useState(false);

const [removedFields, setRemovedFields] = useState([]);
  const storageKey = `ticketMediaFormData_${ticketId}`;

  const displayAlert =
    showAlert || ((data) => setAlert({ ...data, show: true }));
  const hideAlert = () => setAlert(null);

  const openViewer = useCallback((url, mimeType, name) => {
    setFullScreenViewer({ url, mimeType, name });
  }, []);
  
  const closeViewer = useCallback(() => {
    setFullScreenViewer(null);
  }, []);

  // Fetch user details to determine organization type
  const fetchUserDetails = async () => {
    try {
      const response = await getUserData();

      if (response.data) {
        setUserDetails(response.data);
        const isEdu =
          response.data.role === "organisation" &&
          response.data.organisation_type?.toLowerCase() === "educational";
        setIsEducationalOrg(isEdu);
      }
    } catch (error) {
      if (
        user?.role === "organisation" &&
        user?.organisation_type?.toLowerCase() === "educational"
      ) {
        setIsEducationalOrg(true);
      }
    }
  };

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

useEffect(() => {
  if (!initialLoading) {
    const dataToSave = {
      event_logo: previews.event_logo?.startsWith("data:")
        ? previews.event_logo
        : null,
      event_banner: previews.event_banner?.startsWith("data:")
        ? previews.event_banner
        : null,
      event_portrait: previews.event_portrait?.startsWith("data:")
        ? previews.event_portrait
        : null,
      college_authorisation: previews.college_authorisation?.data?.startsWith("data:")
        ? previews.college_authorisation
        : null,
      event_images: previews.event_images?.filter(
          (img) => !img.isExisting && img.preview?.startsWith("data:")
        ) || [],
      event_videos: previews.event_videos?.filter(
          (vid) => !vid.isExisting && vid.preview?.startsWith("data:")
        ) || [],
    };

    const hasNewData =
      dataToSave.event_logo ||
      dataToSave.event_banner ||
      dataToSave.event_portrait || // Added
      dataToSave.college_authorisation ||
      dataToSave.event_images.length > 0 ||
      dataToSave.event_videos.length > 0; // Added

    if (hasNewData) {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(dataToSave));
      } catch (e) {
        if (e.name === "QuotaExceededError") {
          const reducedData = {
            event_logo: dataToSave.event_logo,
            event_banner: dataToSave.event_banner,
            event_portrait: dataToSave.event_portrait, // Added
            college_authorisation: dataToSave.college_authorisation,
            event_images: [],
            event_videos: [], // Added
          };
          try {
            sessionStorage.setItem(storageKey, JSON.stringify(reducedData));
          } catch (err) {
            sessionStorage.removeItem(storageKey);
          }
        }
      }
    }
  }
}, [previews, storageKey, initialLoading]);

  useEffect(() => {
    const initializeState = async () => {
      setInitialLoading(true);

      try {
        await fetchUserDetails();

        const response = await getTicketById(ticketId);
        const ticket = response?.ticket;
        if (!ticket) {
          displayAlert({
            type: "error",
            message: "Load Failed",
            description: "Could not load event data.",
          });
          setInitialLoading(false);
          return;
        }
        setTicketData(ticket);
        const serverMedia = {
          event_logo: ticket.event_logo
            ? getTicketImageUrl(ticket.event_logo)
            : null,
          event_banner: ticket.event_banner
            ? getTicketImageUrl(ticket.event_banner)
            : null,
            event_portrait: ticket.event_portrait ? getTicketImageUrl(ticket.event_portrait) : null,
          // FIX: Handle college_authorisation consistently
          college_authorisation: ticket.college_authorisation
            ? {
                name: ticket.college_authorisation.split(/[/\\]/).pop(),
                url: getTicketImageUrl(ticket.college_authorisation),
                data: getTicketImageUrl(ticket.college_authorisation), // Add data property for consistency
              }
            : null,
            event_videos: (ticket.event_videos || []).map((vid, index) => ({
    id: vid.path || `existing-vid-${index}`,
    preview: getTicketImageUrl(vid.path),
    name: vid.originalName || `video-${index}`,
    isExisting: true,
    mimeType: vid.mimeType,
  })),
          event_images: (ticket.event_images || []).map((img, index) => ({
            id: img.path || `existing-${index}`,
            preview: getTicketImageUrl(img.path),
            name:
              img.originalName ||
              img.path?.split(/[/\\]/).pop() ||
              `image-${index}`,
            isExisting: true,
            mimeType: img.mimeType,
          })),
        };
        setExistingMedia(serverMedia);
        const savedStateJSON = sessionStorage.getItem(storageKey);
        if (savedStateJSON) {
          try {
            const savedPreviews = JSON.parse(savedStateJSON);
            const mergedPreviews = {
              event_logo: savedPreviews.event_logo?.startsWith("data:")
                ? savedPreviews.event_logo
                : serverMedia.event_logo,
              event_banner: savedPreviews.event_banner?.startsWith("data:")
                ? savedPreviews.event_banner
                : serverMedia.event_banner,
              // FIX: Properly handle college_authorisation preview
              college_authorisation:
                savedPreviews.college_authorisation?.data?.startsWith("data:")
                  ? savedPreviews.college_authorisation
                  : serverMedia.college_authorisation,
              event_portrait: savedPreviews.event_portrait?.startsWith("data:")
    ? savedPreviews.event_portrait
    : serverMedia.event_portrait,
  event_images: [
    ...serverMedia.event_images,
    ...(savedPreviews.event_images || []).filter(img => !img.isExisting)
  ],
  event_videos: [
    ...serverMedia.event_videos || [], // Ensure videos from server are handled
    ...(savedPreviews.event_videos || []).filter(vid => !vid.isExisting)
  ],
              
            };
            setPreviews(mergedPreviews);
            const newFormData = { event_images: [] };
            if (savedPreviews.event_logo?.startsWith("data:")) {
              newFormData.event_logo = base64ToFile(
                savedPreviews.event_logo,
                "event_logo"
              );
            }
            if (savedPreviews.event_banner?.startsWith("data:")) {
              newFormData.event_banner = base64ToFile(
                savedPreviews.event_banner,
                "event_banner"
              );
            }

            if (
              savedPreviews.college_authorisation?.data?.startsWith("data:")
            ) {
              newFormData.college_authorisation = base64ToFile(
                savedPreviews.college_authorisation.data,
                savedPreviews.college_authorisation.name
              );
            }
            if (savedPreviews.event_portrait?.startsWith("data:")) {
  newFormData.event_portrait = base64ToFile(savedPreviews.event_portrait, "event_portrait");
}
savedPreviews.event_videos?.forEach((vid) => {
  if (!vid.isExisting) {
    newFormData.event_videos.push(base64ToFile(vid.preview, vid.name));
  }
});

            savedPreviews.event_images?.forEach((img) => {
              if (!img.isExisting && img.preview?.startsWith("data:")) {
                newFormData.event_images.push(
                  base64ToFile(img.preview, img.name)
                );
              }
            });

            setFormData((fd) => ({ ...fd, ...newFormData }));
          } catch (parseError) {
            setPreviews(serverMedia);
            sessionStorage.removeItem(storageKey);
          }
        } else {
          setPreviews(serverMedia);
        }
      } catch (error) {
        displayAlert({
          type: "error",
          message: "Load Failed",
          description: "Could not load event data. Please try again.",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    initializeState();
  }, [ticketId, storageKey]);

  const handleSingleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = {
      event_logo: [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ],
      event_banner: [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ],
      college_authorisation: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    };

    if (allowedTypes[type] && !allowedTypes[type].includes(file.type)) {
      const typeNames = {
        event_logo: "images (JPG, JPEG, PNG, GIF, WEBP)",
        event_banner: "images (JPG, JPEG, PNG, GIF, WEBP)",
        college_authorisation: "documents (PDF, DOC, DOCX)",
      };
      setErrors((prev) => ({
        ...prev,
        [type]: `Only ${typeNames[type]} are allowed for ${type.replace(
          "_",
          " "
        )}.`,
      }));
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        [type]: "File size must be less than 50MB.",
      }));
      return;
    }

    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      if (type === "college_authorisation") {
        setPreviews((prev) => ({
          ...prev,
          [type]: { name: file.name, data: base64 },
        }));
      } else {
        setPreviews((prev) => ({ ...prev, [type]: base64 }));
      }
      setFormData((prev) => ({ ...prev, [type]: file }));
      setErrors((prev) => ({ ...prev, [type]: null }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [type]: "Could not read the selected file.",
      }));
    } finally {
      setLoading(false);
    }
  };

const removeSingleFile = (type) => {
  setPreviews((prev) => ({ ...prev, [type]: null }));
  setFormData((prev) => ({ ...prev, [type]: null }));
  setErrors((prev) => ({ ...prev, [type]: null }));
  
  // Track that this field was explicitly cleared
  setRemovedFields(prev => [...new Set([...prev, type])]);

  const savedStateJSON = sessionStorage.getItem(storageKey);
  if (savedStateJSON) {
    const savedState = JSON.parse(savedStateJSON);
    savedState[type] = null;
    sessionStorage.setItem(storageKey, JSON.stringify(savedState));
  }
};

const handleMultipleFileChange = async (e, targetField) => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  const currentFiles = previews[targetField] || [];
  const limit = targetField === 'event_images' ? 10 : 5;

  if (currentFiles.length + files.length > limit) {
    setErrors((prev) => ({
      ...prev,
      [targetField]: `Maximum ${limit} files allowed for this section.`,
    }));
    return;
  }

  setLoading(true);
  const fileProcessingPromises = files.map(async (file) => {
    try {
      const base64 = await fileToBase64(file);
      return {
        id: `${file.name}-${Date.now()}`,
        preview: base64,
        name: file.name,
        isExisting: false,
        mimeType: file.type,
        originalFile: file,
      };
    } catch (error) { return null; }
  });

  const validItems = (await Promise.all(fileProcessingPromises)).filter(Boolean);

  setPreviews((prev) => ({
    ...prev,
    [targetField]: [...prev[targetField], ...validItems],
  }));

  setFormData((prev) => ({
    ...prev,
    [targetField]: [...prev[targetField], ...validItems.map(i => i.originalFile)],
  }));
  setLoading(false);
};
const handleDragEnd = (event, targetField) => {
  const { active, over } = event;
  if (active.id !== over.id) {
    setPreviews((prev) => {
      const oldIndex = prev[targetField].findIndex((item) => item.id === active.id);
      const newIndex = prev[targetField].findIndex((item) => item.id === over.id);
      return {
        ...prev,
        [targetField]: arrayMove(prev[targetField], oldIndex, newIndex),
      };
    });
  }
};
const handleReorderToggle = (targetField) => {
  const isImage = targetField === 'event_images';
  const currentState = isImage ? isReorderingImages : isReorderingVideos;
  const setState = isImage ? setIsReorderingImages : setIsReorderingVideos;

  if (currentState) {
    // User clicked "Done"
    displayAlert({
      type: "success",
      message: "Order Saved",
      description: `The sequence for ${isImage ? 'images' : 'videos'} has been updated.`
    });
    setState(false);
  } else {
    // User clicked "Reorder"
    setState(true);
  }
};
const removeImageFromList = (idToRemove, targetField = 'event_images') => {
  const itemToRemove = previews[targetField].find((img) => img.id === idToRemove);
  if (!itemToRemove) return;

  // Remove from Previews
  setPreviews((prev) => ({
    ...prev,
    [targetField]: prev[targetField].filter((img) => img.id !== idToRemove),
  }));

  // If it was a new file, remove it from formData
  if (!itemToRemove.isExisting) {
    setFormData((prev) => {
      // Find the index of this item among ONLY the new files in the previews list
      const newItemsOnly = previews[targetField].filter(item => !item.isExisting);
      const indexInNewItems = newItemsOnly.findIndex(item => item.id === idToRemove);
      
      const updatedFiles = [...prev[targetField]];
      if (indexInNewItems !== -1) {
        updatedFiles.splice(indexInNewItems, 1);
      }
      
      return { ...prev, [targetField]: updatedFiles };
    });
  }
};

  const handleBack = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    if (ticketData?.groupId) {
      navigate(`/ticket/create-event/${ticketData.groupId}/${ticketId}`);
    } else {
      navigate(`/ticket/create-event/${ticketId}`);
    }
  }, [navigate, ticketId, storageKey, ticketData]);

  const validateForm = async () => {
    const newErrors = {};
    
    if (isEducationalOrg && !previews.college_authorisation) {
      newErrors.college_authorisation =
        "College authorization file is required for educational organizations.";
    }

    // Check for banner - either existing or new upload
    const hasBanner = !!previews.event_banner;
    
    if (!hasBanner) {
      newErrors.event_banner = "Event banner is required to proceed.";
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      displayAlert({
        type: "error",
        message: "Missing Required Files",
        description: firstError,
      });
      return false;
    }
    
    return true;
  };
const handleSubmit = async (e) => {
    e.preventDefault();

    if (!(await validateForm())) {
      return;
    }

    setLoading(true);
    const submitData = new FormData();

    // 1. Detect if any single file was deleted (Present in existingMedia but null in previews)
    const isSingleFileDeleted = 
      (!!existingMedia.event_logo && !previews.event_logo) ||
      (!!existingMedia.event_banner && !previews.event_banner) ||
      (!!existingMedia.event_portrait && !previews.event_portrait) ||
      (!!existingMedia.college_authorisation && !previews.college_authorisation);

    // 2. Check for brand new binary files
    const hasNewFiles = !!(
      formData.event_logo || 
      formData.event_banner || 
      formData.event_portrait || 
      formData.college_authorisation || 
      formData.event_images.length > 0 || 
      formData.event_videos.length > 0
    );

    // 3. Check for gallery changes (surviving URLs)
    const currentImages = previews.event_images.filter(img => img.isExisting).map(img => img.path || img.preview);
    const originalImages = (existingMedia.event_images || []).map(img => img.path || img.preview || img);
    
    const isGalleryModified = 
      currentImages.length !== originalImages.length || 
      JSON.stringify(currentImages) !== JSON.stringify(originalImages);

    // Final Modification Check
    const anyChangesMade = hasNewFiles || isGalleryModified || isSingleFileDeleted;

    console.log("🧐 Submit Check:", { hasNewFiles, isGalleryModified, isSingleFileDeleted, anyChangesMade });

    // EXIT GATE: If absolutely nothing changed, just navigate away
    if (!anyChangesMade) {      
      sessionStorage.removeItem(storageKey);
      navigate(`/ticket/update-ticket-details/${ticketId}`);
      setLoading(false);
      return;
    }

    // --- Build FormData for API Call ---

    // Handle Single Files (Logo, Banner, Portrait, Auth)
    const singleFileFields = ["event_logo", "event_banner", "event_portrait", "college_authorisation"];
    singleFileFields.forEach(field => {
      if (formData[field] instanceof File) {
        submitData.append(field, formData[field]);
      } else if (previews[field]) {
        const val = previews[field].url || previews[field].data || previews[field];
        if (typeof val === 'string' && !val.startsWith('data:')) {
            submitData.append(`existing_${field}`, val);
        }
      } else {
        // Explicitly tell backend to wipe the field
        submitData.append(`delete_${field}`, "true");
      }
    });

    // Handle Gallery Images (Keep-list and New Files)
    submitData.append("existing_event_images", JSON.stringify(currentImages));
    const imageOrder = previews.event_images.map(img => img.isExisting ? (img.path || img.preview) : img.name);
    submitData.append("image_order", JSON.stringify(imageOrder));
    formData.event_images.forEach(file => submitData.append("event_images", file));

    // Handle Gallery Videos
    const currentVideos = previews.event_videos.filter(vid => vid.isExisting).map(vid => vid.path || vid.preview);
    submitData.append("existing_event_videos", JSON.stringify(currentVideos));
    const videoOrder = previews.event_videos.map(vid => vid.isExisting ? (vid.path || vid.preview) : vid.name);
    submitData.append("video_order", JSON.stringify(videoOrder));
    formData.event_videos.forEach(file => submitData.append("event_videos", file));

    try {
      await updateTicketMedia(ticketId, submitData);
      sessionStorage.removeItem(storageKey); 
  localStorage.removeItem(storageKey);
      displayAlert({
        type: "success",
        message: "Media Saved!",
        description: "Your visuals have been updated successfully.",
      });
      navigate(`/ticket/update-ticket-details/${ticketId}`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Upload Failed";
      displayAlert({ type: "error", message: "Error", description: errorMessage });
    } finally {
      setLoading(false);
    }
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
      <ScrollBarStyle isDark={darkMode} />
      {fullScreenViewer && (
            <FullScreenViewer
               fileUrl={fullScreenViewer.url}
               fileType={fullScreenViewer.mimeType}
               fileName={fullScreenViewer.name}
               onClose={closeViewer}
               darkMode={darkMode}
            />
         )}
      <Alert alert={alert} onClose={hideAlert} darkMode={darkMode} />
      <div className="bg-white dark:bg-[#212426] text-gray-800 dark:text-white min-h-screen flex">
        <EventSidebar
          onBackClick={handleBack}
          darkMode={darkMode}
          formProgress={ticketData?.form_progress || {}}
          groupId={ticketData?.groupId}
          ticketId={ticketId}
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
                <img src={MediaIcon} alt="h-15 w-15" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Showcase Your Event
              </h1>
              <p className="text-black dark:text-gray-400">
                Drop your visuals here to bring your event to life.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-12 ">
              {isEducationalOrg && (
                <FileInput
                  id="college_authorisation"
                  label="Authorisation Letter*"
                  onFileChange={handleSingleFileChange}
                  onRemove={removeSingleFile}
                  preview={
                    previews.college_authorisation?.data ||
                    previews.college_authorisation?.url ||
                    previews.college_authorisation
                  }
                  onPreviewClick={() => {
                              if (previews.college_authorisation) {
                                 // Determine the primary URL/Data source
                                 const fileData = previews.college_authorisation;
                      const fileUrl = fileData.data || fileData.url || fileData;
                      
                                 openViewer(
                                    fileUrl,
                                    fileData.mimeType || "application/pdf",
                                    fileData.name || "Authorization Document"
                                 );
                              }
                           }}
                  error={errors.college_authorisation}
                  isDocument={true}
                  acceptedFiles=".pdf,.doc,.docx"
                  maxSizeMB={1.5}
                  info="Required for educational organizations. Upload PDF, DOC, or DOCX file."
                />
              )}
              <div className=" gap-8 ">
                <FileMediaInput
                  id="event_logo"
                  label="Event or Organisation Logo"
                                    aspectRatio={1 / 1}

                  onFileChange={handleSingleFileChange}
                  onRemove={removeSingleFile}
                  preview={previews.event_logo}
                  error={errors.event_logo}
                  acceptedFiles=".jpg,.jpeg,.png,.gif,.webp"
                  maxSizeMB={50}
                  onPreviewClick={() => {
                              if (previews.event_logo) {
                                 const fileData = previews.event_logo;
                      const fileUrl = fileData.data || fileData.url || fileData; 
                      
                                 openViewer(
                                    fileUrl,
                                    fileData.mimeType || "image/jpeg",
                                    fileData.name || "Event Logo"
                                 );
                              }
                           }}
                  info="Optional. 1:1 ratio recommended. JPG, JPEG, PNG, GIF, or WEBP format."
                />
                <FileMediaInput
                  id="event_banner"
                  label="Event Banner*"
                  aspectRatio={16 / 9}
                  onFileChange={handleSingleFileChange}
                  onRemove={removeSingleFile}
                  preview={previews.event_banner}

                  error={errors.event_banner}
                  acceptedFiles=".jpg,.jpeg,.png,.gif,.webp"
                  maxSizeMB={1.5}
                  info="Required. 2:1 ratio recommended. JPG, JPEG, PNG, GIF, or WEBP format."
                  onPreviewClick={() => {
                              if (previews.event_banner) {
                                 const fileData = previews.event_banner;
                        // For single images (logo/banner), preview directly holds the URL/Data URI string
                        const fileUrl = fileData.data || fileData.url || fileData;
                        const fileName = fileData.name || "Event Banner";
                        const mimeType = fileData.mimeType || "image/jpeg";
                        
                                 openViewer(fileUrl, mimeType, fileName);
                              }
                           }}
                />
                <FileMediaInput
  id="event_portrait"
  label="Portrait image (for mobile app)"
  aspectRatio={3 / 4} // 900x1200 is 3:4
  resolution="400px by 400px"
  onFileChange={handleSingleFileChange}
  onRemove={removeSingleFile}
  preview={previews.event_portrait}
  error={errors.event_portrait}
  acceptedFiles=".jpg,.jpeg,.png,.webp"
  maxSizeMB={1.5}
  info="Resolution: (900px by 1200px). Recommended for mobile app views."
  onPreviewClick={() => {
    if (previews.event_portrait) {
      const url = previews.event_portrait.data || previews.event_portrait.url || previews.event_portrait;
      openViewer(url, "image/jpeg", "Portrait Image");
    }
  }}
/>
              </div>
{/* --- IMAGE GALLERY --- */}
<div className="mt-8">

  <div className=" justify-between items-center mb-4  pb-2">
    <label className="text-sm font-medium text-white flex items-center gap-2">
      Image galleries<InfoTooltip note="Max 10 videos. Max Size :1.5MB, Only .jpeg, .jpg files allowed Resolution: (900px by 1200px)" />
    </label>


</div>
  <div className=" rounded-xl border border-dashed border-gray-600 p-3">
    <div className="flex gap-2 justify-end">

     
        <button 
    type="button" 
    onClick={() => handleReorderToggle('event_images')} // Call the function here
    className={`px-3 py-1 text-xs rounded border border-gray-600 flex items-center gap-2 transition-colors ${
      isReorderingImages 
        ? "bg-green-600 text-white border-green-500 hover:bg-green-700" 
        : "bg-[#2B2B2B] text-gray-300 hover:bg-[#333]"
    }`}
  >
    <span className="text-lg">⠿</span> 
    {isReorderingImages ? "Done Reordering" : "Reorder"}
  </button>
  
  <button 
    type="button" 
    onClick={() => document.getElementById('image_upload').click()} 
    className="px-3 py-1 bg-indigo-600 text-xs rounded text-white hover:bg-indigo-700"
  >
    Browse file
  </button>
    

    </div>
      <DndContext 
    collisionDetection={closestCenter} 
    onDragEnd={(e) => handleDragEnd(e, 'event_images')}
  >
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-6  ">
      <SortableContext items={previews.event_images} strategy={rectSortingStrategy}>
        {previews.event_images.map((img) => (
          <SortablePhoto
            key={img.id} 
            img={img} 
            isReordering={isReorderingImages} 
            onRemove={removeImageFromList}
            targetField="event_images" 
          />
        ))}
      </SortableContext>
      <input id="image_upload" type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleMultipleFileChange(e, 'event_images')} />
    </div>
  </DndContext>
  </div>


</div>

{/* --- VIDEO SNEAK PEEK --- */}
{/* --- VIDEO SNEAK PEEK --- */}
<div className="mt-10">
  <div className="flex justify-between items-center mb-4 pb-2">
    <label className="text-sm font-medium text-white flex items-center gap-2">
      Video sneak peek <InfoTooltip note="Max 5 videos. Duration 10s-1m." />
    </label>
    
  </div>
  <div className="rounded-xl border border-dashed border-gray-600 p-3"> 
    <div className="flex gap-2 justify-end">
      <button 
        type="button" 
        onClick={() => handleReorderToggle('event_videos')}
        className={`px-3 py-1 text-xs rounded border border-gray-600 flex items-center gap-2 transition-colors ${
          isReorderingVideos ? "bg-green-600 text-white border-green-500" : "bg-[#2B2B2B] text-gray-300"
        }`}
      >
        <span className="text-lg">⠿</span> {isReorderingVideos ? "Done Reordering" : "Reorder"}
      </button>
      <button 
        type="button" 
        onClick={() => document.getElementById('video_input').click()}
        className="px-3 py-1 bg-[#4F46E5] text-xs text-white rounded hover:bg-[#4338CA]"
      >
        Browse file
      </button>
    </div>
      <DndContext 
    collisionDetection={closestCenter} 
    onDragEnd={(e) => handleDragEnd(e, 'event_videos')}
  >
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-6 ">
      <SortableContext items={previews.event_videos || []} strategy={rectSortingStrategy}>
        {previews.event_videos?.map((vid) => (
          <SortablePhoto
            key={vid.id} 
            img={vid} // SortablePhoto can be used for videos if it renders the preview correctly
            isReordering={isReorderingVideos} 
            onRemove={(id) => removeImageFromList(id, 'event_videos')}
            targetField="event_videos" 
          />
        ))}
      </SortableContext>
      <input id="video_input" type="file" multiple accept="video/*" className="hidden" onChange={(e) => handleMultipleFileChange(e, 'event_videos')} />
    </div>
  </DndContext>
  </div>


</div>

              {errors.general && (
                <p className="text-red-500 mt-4 text-center font-medium">
                  {errors.general}
                </p>
              )}

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
    </div>
  );
};
export default UpdateTicketMedia;
