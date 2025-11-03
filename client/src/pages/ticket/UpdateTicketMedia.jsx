import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { updateTicketMedia, getTicketById } from "../../services/ticketService";
import { getMe } from "../../services/userService";
import EventSidebar from "../../components/CreateGroup/EventSidebar";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import ExtraEventsPlanner from "../../components/modals/ExtraEventsPlanner";
import Alert from "../../components/CreateGroup/Alert"; // Import the Alert component

import MediaIcon from "../../assets/Event/MediaIcon.svg?react";
import InfoTooltip from "../../components/CreateGroup/InfoTooltip.jsx";
import FileInput from "../../components/CreateGroup/FileInput.jsx";
import CustomScrollbarStyles from "../../components/CreateGroup/CustomScrollbarStyles.jsx";

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    return savedTheme === "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

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

  // Map MIME types to extensions
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

  // Add proper extension if missing
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
  const { user } = useSelector((state) => state.auth);
  const showAlert = location.state?.showAlert;
  const [darkMode, setDarkMode] = useState(getInitialTheme());
  const [isEducationalOrg, setIsEducationalOrg] = useState(false);
  const [formData, setFormData] = useState({
    event_logo: null,
    event_banner: null,
    event_images: [],
    college_authorisation: null,
  });
  const [previews, setPreviews] = useState({
    event_logo: null,
    event_banner: null,
    event_images: [],
    college_authorisation: null,
  });
  const [existingMedia, setExistingMedia] = useState({
    event_logo: null,
    event_banner: null,
    event_images: [],
    college_authorisation: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isExtraEventsModalOpen, setIsExtraEventsModalOpen] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [userDetails,setUserDetails] =useState(null);
  const [alert, setAlert] = useState(null); // State for local alert management

  const storageKey = `ticketMediaFormData_${ticketId}`;

  const displayAlert =
    showAlert || ((data) => setAlert({ ...data, show: true }));
  const hideAlert = () => setAlert(null);
  // Fetch user details to determine organization type
  const fetchUserDetails = async () => {
    try {
      const response = await getMe();

      if (response.data) {
        setUserDetails(response.data);
        const isEdu =
          response.data.role === "organisation" &&
          response.data.organisation_type?.toLowerCase() === "educational";
        setIsEducationalOrg(isEdu);
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      // Fallback to Redux state if API call fails
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
      // Only save new uploads to session storage, not existing server data
      const dataToSave = {
        event_logo: previews.event_logo?.startsWith("data:")
          ? previews.event_logo
          : null,
        event_banner: previews.event_banner?.startsWith("data:")
          ? previews.event_banner
          : null,
        college_authorisation: previews.college_authorisation?.data?.startsWith(
          "data:"
        )
          ? previews.college_authorisation
          : null,
        event_images:
          previews.event_images?.filter(
            (img) => !img.isExisting && img.preview?.startsWith("data:")
          ) || [],
      };

      // Only save if there's actual new data
      const hasNewData =
        dataToSave.event_logo ||
        dataToSave.event_banner ||
        dataToSave.college_authorisation ||
        dataToSave.event_images.length > 0;

      if (hasNewData) {
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(dataToSave));
        } catch (e) {
          if (e.name === "QuotaExceededError") {
            const reducedData = {
              event_logo: dataToSave.event_logo,
              event_banner: dataToSave.event_banner,
              college_authorisation: dataToSave.college_authorisation,
              event_images: [], // Don't save images if quota exceeded
            };
            try {
              sessionStorage.setItem(storageKey, JSON.stringify(reducedData));
            } catch (err) {
              console.error(
                "Could not save to session storage even after reducing data:",
                err
              );
              sessionStorage.removeItem(storageKey);
            }
          } else {
            console.error("Error saving to session storage:", e);
          }
        }
      }
    }
  }, [previews, storageKey, initialLoading]);
  useEffect(() => {
    const initializeState = async () => {
      setInitialLoading(true);

      try {
        // Fetch user details first
        await fetchUserDetails();

        // Step 1: Fetch the "source of truth" from the database
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
        // Helper function to construct URLs - handle Windows backslashes
        const API_BASE_URL = import.meta.env.VITE_TICKET_API_BASE_URL;
        const getUrl = (path) => {
          if (!path) return null;

          if (path.startsWith("http://") || path.startsWith("https://")) {
            return path;
          }
          // Legacy: Handle old local paths (for backward compatibility)
          const API_BASE_URL = import.meta.env.VITE_TICKET_API_BASE_URL;
          let cleanPath = path.replace(/\\/g, "/");
          cleanPath = cleanPath.replace(/^src\//, "");
          cleanPath = cleanPath.replace(/^\//, "");
          return `${API_BASE_URL}/${cleanPath}`;
        };

        // Prepare server media data
        const serverMedia = {
          event_logo: ticket.event_logo ? getUrl(ticket.event_logo) : null,
          event_banner: ticket.event_banner
            ? getUrl(ticket.event_banner)
            : null,
          college_authorisation: ticket.college_authorisation
            ? {
                name: ticket.college_authorisation.split(/[/\\]/).pop(),
                url: getUrl(ticket.college_authorisation),
              }
            : null,
          event_images: (ticket.event_images || []).map((img, index) => ({
            id: img.path || `existing-${index}`,
            preview: getUrl(img.path),
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
              college_authorisation:
                savedPreviews.college_authorisation?.data?.startsWith("data:")
                  ? savedPreviews.college_authorisation
                  : serverMedia.college_authorisation,
              event_images: [
                // Keep existing server images
                ...serverMedia.event_images,
                // Add new unsaved images
                ...(savedPreviews.event_images || []).filter(
                  (img) => !img.isExisting && img.preview?.startsWith("data:")
                ),
              ],
            };

            setPreviews(mergedPreviews);

            // Re-create File objects for the formData state from the saved base64 data
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

            savedPreviews.event_images?.forEach((img) => {
              if (!img.isExisting && img.preview?.startsWith("data:")) {
                newFormData.event_images.push(
                  base64ToFile(img.preview, img.name)
                );
              }
            });

            setFormData((fd) => ({ ...fd, ...newFormData }));
          } catch (parseError) {
            console.error("Failed to parse session storage:", parseError);
            // If session data is corrupted, use server data
            setPreviews(serverMedia);
            sessionStorage.removeItem(storageKey);
          }
        } else {
          setPreviews(serverMedia);
        }
      } catch (error) {
        console.error("Failed to fetch initial ticket data:", error);
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

    // Validate file types based on field
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

    // Validate file size (50MB limit)
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
    const savedStateJSON = sessionStorage.getItem(storageKey);
    if (savedStateJSON) {
      try {
        const savedState = JSON.parse(savedStateJSON);
        savedState[type] = null;
        sessionStorage.setItem(storageKey, JSON.stringify(savedState));
      } catch (e) {
        console.error("Error updating session storage:", e);
      }
    }
  };

  const handleMultipleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Count existing images (both from server and newly added)
    const currentImages = previews.event_images || [];
    const currentCount = currentImages.length;
    // Check total files limit
    if (currentCount + files.length > 10) {
      setErrors((prev) => ({
        ...prev,
        event_images: `Cannot add ${files.length} files. Maximum 10 files allowed (currently have ${currentCount}).`,
      }));
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/flv",
      "video/webm",
    ];

    const invalidFiles = files.filter(
      (file) => !allowedTypes.includes(file.type)
    );
    if (invalidFiles.length > 0) {
      setErrors((prev) => ({
        ...prev,
        event_images:
          "Only images (JPG, JPEG, PNG, GIF, WEBP) and videos (MP4, AVI, MOV, WMV, FLV, WEBM) are allowed",
      }));
      return;
    }

    // Check video count limit
    const videoTypes = [
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/flv",
      "video/webm",
    ];
    const newVideoCount = files.filter((file) =>
      videoTypes.includes(file.type)
    ).length;
    const existingVideoCount = currentImages.filter((img) => {
      // Check by mime type or file extension
      if (img.mimeType) {
        return videoTypes.includes(img.mimeType);
      }
      if (img.name) {
        const ext = img.name.toLowerCase().split(".").pop();
        return ["mp4", "avi", "mov", "wmv", "flv", "webm"].includes(ext);
      }
      return false;
    }).length;

    if (existingVideoCount + newVideoCount > 1) {
      setErrors((prev) => ({
        ...prev,
        event_images: `Maximum 1 video file allowed. You already have ${existingVideoCount} video(s).`,
      }));
      return;
    }

    // Check file sizes
    const maxSize = 50 * 1024 * 1024; // 50MB
    const oversizedFiles = files.filter((file) => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setErrors((prev) => ({
        ...prev,
        event_images: `One or more files exceed the 50MB limit: ${oversizedFiles
          .map((f) => f.name)
          .join(", ")}`,
      }));
      return;
    }

    setLoading(true);
    const fileProcessingPromises = files.map(async (file) => {
      try {
        const base64 = await fileToBase64(file);
        return {
          id: `${file.name}-${file.lastModified}-${Date.now()}`, // More unique ID
          preview: base64,
          name: file.name,
          isExisting: false,
          mimeType: file.type,
          originalFile: file,
        };
      } catch (error) {
        console.error("Error processing file:", file.name, error);
        return null;
      }
    });

    try {
      const processedItems = await Promise.all(fileProcessingPromises);
      const validItems = processedItems.filter((item) => item !== null);

      if (validItems.length === 0) {
        setErrors((prev) => ({
          ...prev,
          event_images: "Error processing files.",
        }));
        setLoading(false);
        return;
      }

      console.log("Processed items:", validItems);

      // Update previews - keep existing and add new
      setPreviews((prev) => ({
        ...prev,
        event_images: [...(prev.event_images || []), ...validItems],
      }));

      // Update formData - keep existing File objects and add new ones
      setFormData((prev) => {
        const existingFiles = prev.event_images || [];
        const newFiles = validItems.map((item) => item.originalFile);
        return {
          ...prev,
          event_images: [...existingFiles, ...newFiles],
        };
      });

      setErrors((prev) => ({ ...prev, event_images: null }));

      displayAlert({
        type: "success",
        message: "Files Added",
        description: `${validItems.length} file(s) added successfully`,
      });
    } catch (error) {
      console.error("Error in file processing:", error);
      setErrors((prev) => ({
        ...prev,
        event_images: "Error processing one or more files.",
      }));
    } finally {
      setLoading(false);
    }
  };

  const removeImageFromList = (idToRemove) => {
    const fileToRemove = previews.event_images.find(
      (img) => img.id === idToRemove
    );
    if (!fileToRemove) return;

    setPreviews((prev) => ({
      ...prev,
      event_images: prev.event_images.filter((img) => img.id !== idToRemove),
    }));

    if (!fileToRemove.isExisting) {
      setFormData((prev) => ({
        ...prev,
        event_images: prev.event_images.filter((file) => {
          const fileId = `${file.name}-${file.lastModified}`;
          return fileId !== idToRemove;
        }),
      }));

      // Update session storage
      const savedStateJSON = sessionStorage.getItem(storageKey);
      if (savedStateJSON) {
        try {
          const savedState = JSON.parse(savedStateJSON);
          if (savedState.event_images) {
            savedState.event_images = savedState.event_images.filter(
              (img) => img.id !== idToRemove
            );
            sessionStorage.setItem(storageKey, JSON.stringify(savedState));
          }
        } catch (e) {
          console.error("Error updating session storage:", e);
        }
      }
    }
  };
  const handleBack = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    if (ticketData?.groupId) {
      navigate(`/ticket/create-event/${ticketData.groupId}/${ticketId}`);
    } else {
      // Fallback: try to navigate without groupId (will use the alternate route)
      console.warn("No groupId found, navigating with ticketId only");
      navigate(`/ticket/create-event/${ticketId}`);
    }
  }, [navigate, ticketId, storageKey, ticketData]);
  const validateForm = async () => {
    const newErrors = {};
    if (isEducationalOrg && !previews.college_authorisation) {
      newErrors.college_authorisation =
        "College authorization file is required for educational organizations.";
    }
    const hasBanner = !!previews.event_banner;
    try {
      const response = await getTicketById(ticketId);
      const progress = response?.ticket?.form_progress;
      if (!progress?.media && !hasBanner) {
        newErrors.general = "Event banner is required to proceed.";
      }
    } catch (err) {
      console.error(
        "Could not fetch form progress, performing fallback validation.",
        err
      );
      if (!hasBanner) {
        newErrors.general = "Event banner is required to proceed.";
      }
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

    // Track if we're uploading any new files
    let hasNewFiles = false;

    // Only append NEW files (File objects), not existing server URLs
    if (formData.event_logo instanceof File) {
      submitData.append("event_logo", formData.event_logo);
      hasNewFiles = true;
      console.log("Appending new event_logo file");
    }

    if (formData.event_banner instanceof File) {
      submitData.append("event_banner", formData.event_banner);
      hasNewFiles = true;
      console.log("Appending new event_banner file");
    }

    if (formData.college_authorisation instanceof File) {
      submitData.append(
        "college_authorisation",
        formData.college_authorisation
      );
      hasNewFiles = true;
      console.log("Appending new college_authorisation file");
    }
    if (
      formData.event_images &&
      Array.isArray(formData.event_images) &&
      formData.event_images.length > 0
    ) {
      let imageCount = 0;
      formData.event_images.forEach((file, index) => {
        if (file instanceof File) {
          submitData.append("event_images", file);
          hasNewFiles = true;
          imageCount++;
          console.log(
            `Appending event_images[${index}]: ${file.name} (${file.type}, ${(
              file.size /
              1024 /
              1024
            ).toFixed(2)}MB)`
          );
        } else {
          console.log(
            `Skipping event_images[${index}]: Not a File object`,
            typeof file
          );
        }
      });
      console.log(`Total new event_images to upload: ${imageCount}`);
    } else {
      console.log("No event_images to upload or invalid format:", {
        exists: !!formData.event_images,
        isArray: Array.isArray(formData.event_images),
        length: formData.event_images?.length || 0,
      });
    }
    console.log("FormData contents:");
    for (let pair of submitData.entries()) {
      console.log(
        pair[0],
        pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]
      );
    }
    if (!hasNewFiles) {
      console.log(
        "No new files to upload. Checking if existing media meets requirements..."
      );
      try {
        // Step 1: Re-fetch the ticket to get the latest form_progress
        const updatedTicketResponse = await getTicketById(ticketId);
        const updatedTicket = updatedTicketResponse?.ticket;
        const progress = updatedTicket?.form_progress;

        // Step 2: Check if a path for Step 4 has already been chosen
        if (progress?.add_on_events) {
          navigate(`/ticket/update-ticket-addons/${ticketId}`);
        } else if (progress?.banking_tickets) {
          navigate(`/ticket/update-ticket-details/${ticketId}`);
        } else {
          // If no path is chosen yet, show the modal
          setIsExtraEventsModalOpen(true);
        }

        setLoading(false);
        return;
      } catch (error) {
        console.error("Error checking progress:", error);
        setLoading(false);
        return;
      }
    }

    console.log("Uploading new files...");

    try {
      // Step 1: Upload the media
      const response = await updateTicketMedia(ticketId, submitData);
      console.log("Upload response:", response);

      sessionStorage.removeItem(storageKey);

      displayAlert({
        type: "success",
        message: "Media Saved!",
        description: "Your event visuals have been updated.",
      });

      // Step 2: Re-fetch the ticket to get the latest form_progress and updated media
      const updatedTicketResponse = await getTicketById(ticketId);
      const updatedTicket = updatedTicketResponse?.ticket;
      const progress = updatedTicket?.form_progress;

      // Update the ticket data state with fresh data
      setTicketData(updatedTicket);

      // Clear formData for newly uploaded files
      setFormData({
        event_logo: null,
        event_banner: null,
        event_images: [],
        college_authorisation: null,
      });

      // Step 3: Check if a path for Step 4 has already been chosen
      if (progress?.add_on_events) {
        navigate(`/ticket/update-ticket-addons/${ticketId}`);
      } else if (progress?.banking_tickets) {
        navigate(`/ticket/update-ticket-details/${ticketId}`);
      } else {
        // If no path is chosen yet, show the modal
        setIsExtraEventsModalOpen(true);
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An error occurred during upload.";
      displayAlert({
        type: "error",
        message: "Upload Failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };
  const handleModalYes = () => {
    setIsExtraEventsModalOpen(false);
  };
  const handleModalNo = () => {
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
      <CustomScrollbarStyles isDark={darkMode} />
      <Alert alert={alert} onClose={hideAlert} />
      <div className="bg-white dark:bg-[#212426] text-gray-800 dark:text-white min-h-screen flex">
        <EventSidebar
          onBackClick={handleBack}
          darkMode={darkMode}
          // Pass props from your 'ticketData' state object
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
                  error={errors.college_authorisation}
                  isDocument={true}
                  acceptedFiles=".pdf,.doc,.docx"
                  maxSizeMB={50}
                  info="Required for educational organizations. Upload PDF, DOC, or DOCX file."
                />
              )}
              <div className="grid md:grid-cols-2 gap-8 ">
                <FileInput
                  id="event_logo"
                  label="Event or Organisation Logo" // No asterisk - optional
                  onFileChange={handleSingleFileChange}
                  onRemove={removeSingleFile}
                  preview={previews.event_logo}
                  error={errors.event_logo}
                  acceptedFiles=".jpg,.jpeg,.png,.gif,.webp"
                  maxSizeMB={50}
                  info="Optional. 1:1 ratio recommended. JPG, JPEG, PNG, GIF, or WEBP format."
                />
                <FileInput
                  id="event_banner"
                  label="Event Banner*" // Added asterisk to show it's required
                  onFileChange={handleSingleFileChange}
                  onRemove={removeSingleFile}
                  preview={previews.event_banner}
                  error={errors.event_banner}
                  acceptedFiles=".jpg,.jpeg,.png,.gif,.webp"
                  maxSizeMB={50}
                  info="Required. 2:1 ratio recommended. JPG, JPEG, PNG, GIF, or WEBP format."
                />
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2">
                  Images & Videos{" "}
                  <InfoTooltip note="Optional. Max 10 files total, max 1 video. Supported: JPG, JPEG, PNG, GIF, WEBP, MP4, AVI, MOV, WMV, FLV, WEBM." />
                </label>
                {previews.event_images && previews.event_images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                    {previews.event_images.map((img) => {
                      // Determine if it's a video based on the name or MIME type
                      const isVideo =
                        img.name &&
                        (img.name.toLowerCase().endsWith(".mp4") ||
                          img.name.toLowerCase().endsWith(".avi") ||
                          img.name.toLowerCase().endsWith(".mov") ||
                          img.name.toLowerCase().endsWith(".wmv") ||
                          img.name.toLowerCase().endsWith(".flv") ||
                          img.name.toLowerCase().endsWith(".webm"));

                      return (
                        <div
                          key={img.id}
                          className="relative aspect-square bg-gray-100 dark:bg-[#2B2B2B] rounded-lg overflow-hidden group"
                        >
                          {isVideo ? (
                            <video
                              src={img.preview}
                              className="w-full h-full object-cover"
                              controls
                              preload="metadata"
                            />
                          ) : (
                            <img
                              src={img.preview}
                              alt={img.name || "preview"}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeImageFromList(img.id)}
                              className="text-white text-3xl font-bold hover:text-red-400 hover:scale-110 transition-transform"
                              aria-label="Remove file"
                            >
                              &times;
                            </button>
                          </div>
                          <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded truncate max-w-[90%]">
                            {img.isExisting ? "Existing" : "New"}
                          </div>
                          {/* Show filename on hover */}
                          <div className="absolute top-1 left-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded truncate opacity-0 group-hover:opacity-100 transition-opacity">
                            {img.name || "Unknown"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <label
                  htmlFor="event_images_input"
                  className="relative rounded-lg p-5 text-center bg-gray-100 dark:bg-[#2B2B2B] flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[150px] border-2 border-dashed border-black dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
                >
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    ></path>
                  </svg>
                  <span className="text-indigo-500 dark:text-indigo-400 font-semibold">
                    {previews.event_images && previews.event_images.length > 0
                      ? "Add more files..."
                      : "Upload images & videos"}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-200">
                    {previews.event_images ? previews.event_images.length : 0}
                    /10 files • Max 1 video
                  </span>
                  <input
                    id="event_images_input"
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.wmv,.flv,.webm"
                    onChange={(e) => {
                      handleMultipleFileChange(e);
                      // Clear the input so the same file can be selected again if needed
                      e.target.value = "";
                    }}
                    className="sr-only"
                  />
                </label>
                {errors.event_images && (
                  <p className="text-red-500 mt-2 text-sm">
                    {errors.event_images}
                  </p>
                )}
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

      <ExtraEventsPlanner
        isOpen={isExtraEventsModalOpen}
        onYes={handleModalYes}
        onNo={handleModalNo}
        ticketId={ticketId}
      />
    </div>
  );
};
export default UpdateTicketMedia;
