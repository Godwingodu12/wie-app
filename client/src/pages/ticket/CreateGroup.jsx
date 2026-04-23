import React, { useState, useEffect,useRef } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  CreationGroup,
  getUserGroupCapabilities,
  getUserData,
  getGroupById,
  UpdateGroup,
} from "../../services/ticketService";
import Select from "react-select";
import { getImageUrl } from "../../utils/imageUtils";
import OrgIcon from "../../assets/Event/OrgIcon.svg";
import LightIcon from "../../assets/Event/LightIcon.svg";
import DarkIcon from "../../assets/Event/DarkIcon.svg";
import ThemeToggle from "../../components/HomePage/ThemeToggle";
import EventSidebar from "../../components/CreateGroup/EventSidebar";
import CustomScrollbarStyles from "../../components/CreateGroup/CustomScrollbarStyles.jsx";
import Alert from "../../components/CreateGroup/Alert";
import getInitialTheme from "../../components/CreateGroup/getIntialTheme.jsx";
import darkThemeStyles from "../../components/CreateGroup/darkThemeStyles.jsx";
import lightThemeStyles from "../../components/CreateGroup/lightThemeStyles.jsx";
// CSS for placeholders, which will be injected based on the theme

// Custom CSS for the light green scrollbar
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #4ADE80; /* This is a light green color */
    border-radius: 10px;
    border: 2px solid transparent;
    background-clip: content-box;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #34D399;
  }
`;

// Reusable InfoTooltip component
const InfoTooltip = ({ note }) => {
  const InfoIconSvg = () => (
    <svg
      className="w-4 h-4 text-blue-400"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <div className="relative flex items-center group ml-1">
      <InfoIconSvg />
      <div
        className={`absolute left-full top-1/2 -translate-y-1/2 ml-3 w-max max-w-xs p-3 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-lg 
                       opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10`}
      >
        {note}
        {/* SVG arrow pointing left */}
        <svg
          className="absolute text-gray-900 h-3 w-3 -left-1 top-1/2 -translate-y-1/2"
          x="0px"
          y="0px"
          viewBox="0 0 255 255"
        >
          <polygon className="fill-current" points="255,0 255,255 0,127.5" />
        </svg>
      </div>
    </div>
  );
};

const organisationTypeOptions = [
  "Private Limited",
  "Public Limited",
  "Partnership",
  "Proprietorship",
  "LLP",
  "NGO",
  "Educational",
  "Healthcare",
  "Non-profit",
  "Trust",
  "Society",
  "Other",
  "Institute",
].map((opt) => ({ value: opt, label: opt }));

const accountTypeOptions = [
  { value: "Current", label: "Current" },
  { value: "Merchant", label: "Merchant" },
];
const themeOverride = (theme) => ({
  ...theme,
  colors: { ...theme.colors, neutral0: "transparent" },
});
const customSelectStyles = (isDark) => ({
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "transparent",
    borderColor: state.isFocused ? "#6366F1" : isDark ? "#4A4A4A" : "#D1D5DB",
    padding: "0.5rem",
    borderRadius: "0.5rem",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#6366F1",
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "0 2px",
  }),
  input: (provided) => ({
    ...provided,
    color: isDark ? "#FFFFFF" : "#1F2937",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: isDark ? "#FFFFFF" : "#1F2937",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: isDark ? "#6B7280" : "#9CA3AF",
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: isDark ? "#2B2B2B" : "#FFFFFF",
    borderRadius: "0.5rem",
    zIndex: 50,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#4F46E5"
      : state.isFocused
      ? isDark
        ? "#374151"
        : "#E5E7EB"
      : "transparent",
    color: isDark ? "#FFFFFF" : "#1F2937",
    "&:active": {
      backgroundColor: "#4338CA",
    },
  }),
  menuList: (provided) => ({
    ...provided,
    "::-webkit-scrollbar": { width: "8px" },
    "::-webkit-scrollbar-track": { background: isDark ? "#232426" : "#f1f5f9" },
    "::-webkit-scrollbar-thumb": {
      backgroundColor: isDark ? "#4f4f4f" : "#cbd5e1",
      borderRadius: "10px",
      border: `2px solid ${isDark ? "#232426" : "#f1f5f9"}`,
    },
  }),
});

// GST sector classification (Indian GST law)
const GST_MANDATORY_SECTORS = [
  "Private Limited", "Public Limited", "Partnership",
  "Proprietorship", "LLP", "Sole Proprietorship",
  "Private", "Public Limited Company",
];
const GST_CONDITIONAL_SECTORS = ["NGO", "Non-profit", "Trust", "Society"];
const GST_EXEMPT_SECTORS      = ["Educational", "Healthcare", "Hospital", "Institute"];
const getGSTStatus = (orgType) => {
  if (!orgType) return "optional";
  const lower = orgType.toLowerCase().trim();
  if (GST_MANDATORY_SECTORS.includes(lower))  return "mandatory";
  if (GST_CONDITIONAL_SECTORS.includes(lower)) return "conditional";
  if (GST_EXEMPT_SECTORS.includes(lower))      return "exempt";
  return "optional"; // "other" and unknown types
};
const CreateGroup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [capabilities, setCapabilities] = useState(null);
  const [userData, setUserData] = useState(null);
  const [darkMode, setDarkMode] = useState(getInitialTheme());
  const [filePreviews, setFilePreviews] = useState({});
  const [hasGst, setHasGst] = useState("");
  const [existingGroups, setExistingGroups] = useState([]);
  const [ticketData, setTicketData] = useState(null);
  const [validatingFile, setValidatingFile] = useState(false);
  const { groupId } = useParams();
  const isEditMode = !!groupId;
  const errorFieldRefs = useRef({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact_no: "",
    address: "",
    gst_no: "",
    pan_no: "",
    organisation_type: "",
    grp_type: "organisation",
    primary_bank_acc_type: "",
    primary_bank_acc_holder: "",
    primary_bank_acc_no: "",
    primary_bank_ifsc: "",
  });

  const [files, setFiles] = useState({
    id_proof: null,
    bank_check: null,
    company_logo: null,
    company_certificate: null,
  });

  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null); // <-- ADD THIS

  // --- ADD THESE HANDLER FUNCTIONS ---
  const showAlert = (data) => setAlert({ ...data, show: true });
  const hideAlert = () => setAlert(null);

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

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
    fetchUserCapabilities();
  }, [groupId]);
  useEffect(() => {
    if (capabilities?.userRole === "admin" && Array.isArray(existingGroups)) {
      const creatableTypes = ["admin", "organisation"].filter((type) =>
        canCreateGroupType(type)
      );

      if (
        creatableTypes.length === 1 &&
        formData.grp_type !== creatableTypes[0]
      ) {
        handleGroupTypeChange({ target: { value: creatableTypes[0] } });
      }
    }
  }, [capabilities, existingGroups]);
  useEffect(() => {
    if (
      userData &&
      capabilities &&
      capabilities.userRole === "organisation" &&
      existingGroups.length === 0 &&
      !isEditMode
    ) {
      setFormData((prev) => ({
        ...prev,
        name: userData.name || "",
        email: userData.email || "",
        contact_no: userData.contact_no || "",
        address: userData.address || "",
        organisation_type: userData.organisation_type || "",
      }));
    }
  }, [userData, capabilities, existingGroups, isEditMode]);
  const fetchUserCapabilities = async () => {
    try {
      setLoading(true);
      // Fetch both capabilities and user data in parallel
      const [caps, userData] = await Promise.all([
        getUserGroupCapabilities(),
        getUserData(),
      ]);
      const userGroups = caps.userGroups || [];
      setCapabilities(caps);
      setExistingGroups(userGroups);
      if (userData) {
        setUserData(userData);
      }
      if (groupId) {
        try {
          const groupResponse = await getGroupById(groupId);
          const groupToEdit = groupResponse.group;
          if (groupToEdit) {
            // Set form data
            setFormData({
              name: groupToEdit.name || "",
              email: groupToEdit.email || "",
              contact_no: groupToEdit.contact_no || "",
              address: groupToEdit.address || "",
              gst_no: groupToEdit.gst_no || "",
              pan_no: groupToEdit.pan_no || "",
              organisation_type: groupToEdit.organisation_type || "",
              grp_type: groupToEdit.grp_type || "organisation",
              primary_bank_acc_type: groupToEdit.primary_bank_acc_type || "",
              primary_bank_acc_holder:
                groupToEdit.primary_bank_acc_holder || "",
              primary_bank_acc_no: groupToEdit.primary_bank_acc_no || "",
              primary_bank_ifsc: groupToEdit.primary_bank_ifsc || "",
            });
            // Set GST status
            if (groupToEdit.gst_no) {
              setHasGst("Yes");
            } else {
              setHasGst("No");
            }
            // Set file previews for existing files
            const newPreviews = {};
            if (groupToEdit.id_proof) {
              newPreviews.id_proof = getImageUrl(groupToEdit.id_proof);
            }
            if (groupToEdit.bank_check) {
              newPreviews.bank_check = getImageUrl(groupToEdit.bank_check);
            }
            if (groupToEdit.company_logo) {
              newPreviews.company_logo = getImageUrl(groupToEdit.company_logo);
            }
            if (groupToEdit.company_certificate) {
              newPreviews.company_certificate = getImageUrl(
                groupToEdit.company_certificate
              );
            }
            setFilePreviews(newPreviews);
          }
        } catch (error) {
          console.error("Error fetching group data:", error);
          console.error("Full error:", error.response?.data);
          showAlert({
            type: "error",
            message: "Error",
            description:
              error.response?.data?.message ||
              "Failed to load group data. Please try again.",
          });
          setLoading(false); // Set loading false before navigating
          setTimeout(() => {
            navigate("/ticket/groups");
          }, 2000);
          return;
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching capabilities:", error);
      showAlert({
        type: "error",
        message: "Error",
        description: "Failed to load data. Please try again.",
      });
      setLoading(false);
      setTimeout(() => {
        navigate("/ticket/groups");
      }, 2000);
    }
  };
  const canCreateGroupType = (groupType) => {
    if (!capabilities || !existingGroups) return false;

    if (capabilities.userRole === "admin") {
      if (groupType === "admin") {
        return (
          existingGroups.filter((g) => g.grp_type === "admin").length === 0
        );
      } else {
        return (
          existingGroups.filter((g) => g.grp_type === "organisation").length ===
          0
        );
      }
    } else {
      return existingGroups.length < 4;
    }
  };

  const getGroupCreationMessage = () => {
    if (!capabilities || !existingGroups) return "";

    if (capabilities.userRole === "admin") {
      const adminGroups = existingGroups.filter(
        (g) => g.grp_type === "admin"
      ).length;
      const orgGroups = existingGroups.filter(
        (g) => g.grp_type === "organisation"
      ).length;

      if (adminGroups >= 1 && orgGroups >= 1) {
        return "You have reached the maximum limit for group creation.";
      } else if (adminGroups >= 1) {
        return "You can create 1 more organisation group.";
      } else if (orgGroups >= 1) {
        return "You can create 1 more admin group.";
      } else {
        return "You can create 1 admin group and 1 organisation group.";
      }
    } else {
      const remaining = 4 - existingGroups.length;
      if (remaining <= 0) {
        return "You have reached the maximum limit of 4 groups.";
      } else {
        return `You can create ${remaining} more organisation group${
          remaining > 1 ? "s" : ""
        }.`;
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  const handleSelectChange = (selectedOption, { name }) => {
    setFormData((prev) => ({
      ...prev,
      [name]: selectedOption ? selectedOption.value : "",
    }));
  };

  const handleGroupTypeChange = (e) => {
    const value = e.target.value;
    setErrors({});
    setHasGst("");

    setFormData((prev) => {
      const newState = {
        ...prev,
        grp_type: value,
        gst_no: "",
      };

      if (value === "organisation") {
        newState.name = "";
        newState.email = "";
        newState.contact_no = "";
        newState.address = "";
        newState.organisation_type = "";
      }

      return newState;
    });
  };

  const handleGstChange = (e) => {
    const value = e.target.value;
    setHasGst(value);

    if (value === "No") {
      setFormData((prev) => ({ ...prev, gst_no: "" }));
    }

    if (errors.gst_no || errors.hasGst) {
      setErrors((prev) => ({ ...prev, gst_no: "", hasGst: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let firstErrorField = null;

    // Helper to add error and show alert
    const addError = (field, message) => {
      if (!firstErrorField) {
        // Only set the alert and field if it's the very first error
        showAlert({
          type: "error",
          message: "Validation Failed",
          description: message,
        });
        firstErrorField = field;
      }
      newErrors[field] = message;
    };
    if (formData.grp_type === "organisation") {
      if (!formData.name.trim())
        addError("name", "Organization name is required.");
      if (!formData.email.trim()) addError("email", "Email is required.");
      if (!formData.contact_no.trim())
        addError("contact_no", "Contact number is required.");
      if (!formData.organisation_type)
        addError("organisation_type", "Organisation type is required.");
      if (!formData.address.trim()) addError("address", "Address is required.");
      if (formData.organisation_type) {
          const gstStatus = getGSTStatus(formData.organisation_type);
          const isExempt  = gstStatus === "exempt";
          if (gstStatus === "mandatory" && !formData.gst_no.trim()) {
            addError(
              "gst_no",
              `GST number is mandatory for ${formData.organisation_type} organisations under Indian GST law.`
            );
          }
          if (!isExempt) {
            if (!files.bank_check && !filePreviews.bank_check) {
              addError("bank_check", "Cancelled bank cheque is required.");
            }
            if (!files.company_logo && !filePreviews.company_logo) {
              addError("company_logo", "Company logo is required.");
            }
          }
        }
    }
    if (!files.id_proof && !filePreviews.id_proof) {
      addError("id_proof", "Aadhaar card is required for verification.");
    }
    // PAN validation
    if (!formData.pan_no.trim()) {
      addError("pan_no", "PAN number is required.");
    } else if (!/^[A-Z0-9]{10}$/i.test(formData.pan_no)) {
      addError("pan_no", "PAN must be 10 alphanumeric characters.");
    }

    setErrors(newErrors);

    if (firstErrorField && errorFieldRefs.current[firstErrorField]) {
      // Use a slight delay to ensure the DOM is fully rendered after state update
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

    if (!isEditMode && !canCreateGroupType(formData.grp_type)) {
      showAlert({
        type: "error",
        message: "Limit Reached",
        description: `You cannot create more ${formData.grp_type} groups.`,
      });
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = new FormData();

      // Append all form data
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key]);
        }
      });

      // Append only new files (not existing ones)
      Object.keys(files).forEach((key) => {
        if (files[key]) {
          submitData.append(key, files[key]);
        }
      });

      if (files.id_proof) {
        showAlert({
          type: "info",
          message: "Validating Documents",
          description:
            "Please wait while we verify your Aadhaar card and bank details...",
        });
      }

      if (isEditMode) {
        // Update existing group
        await UpdateGroup(groupId, submitData);
        showAlert({
          type: "success",
          message: "Group Updated!",
          description: "Your group has been updated successfully.",
        });
        setTimeout(() => {
          navigate("/ticket/groups");
        }, 1500);
      } else {
        // Create new group
        const response = await CreationGroup(submitData);
        showAlert({
          type: "success",
          message: "Group Created!",
          description: "Redirecting you to the next step...",
        });
        setTimeout(() => {
          navigate(`/ticket/create-event/${response.group._id}`);
        }, 1500);
      }
    } catch (error) {
      console.error("Error saving group:", error);
      // Enhanced error handling for validation errors
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "An unexpected error occurred. Please try again.";
      const isValidationError =
        errorMessage.toLowerCase().includes("aadhaar") ||
        errorMessage.toLowerCase().includes("ifsc");
      showAlert({
        type: "error",
        message: isValidationError
          ? "Validation Failed"
          : isEditMode
          ? "Update Failed"
          : "Creation Failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };
  const handleBack = () => navigate(-1);
  if (loading || !capabilities || !userData) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? "bg-[#212426] text-white" : "bg-gray-100 text-black"
        }`}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <div className="text-lg">
            {isEditMode ? "Loading group data..." : "Loading..."}
          </div>
        </div>
      </div>
    );
  }
  const handleFileUpload = (name, file) => {
    setFiles((prev) => ({ ...prev, [name]: file }));

    if (file) {
      const fileType = file.type || "";
      if (fileType.startsWith("image/")) {
        const previewURL = URL.createObjectURL(file);
        setFilePreviews((prev) => ({ ...prev, [name]: previewURL }));
      } else {
        setFilePreviews((prev) => ({ ...prev, [name]: "FILE_SELECTED" }));
      }
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  const FileUploadArea = ({ label, name }) => {
    const openFileDialog = () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx";
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const allowedTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/jpeg",
          "image/png",
          "image/jpg",
        ];
        if (!allowedTypes.includes(file.type)) {
          showAlert({
            type: "error",
            message: "Invalid File Type",
            description: "Only PDF, DOC, DOCX, and image files are allowed.",
          });
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          showAlert({
            type: "error",
            message: "File Too Large",
            description: "File size must be less than 10MB.",
          });
          return;
        }
        handleFileUpload(name, file);
      };
      input.click();
    };
    const handleRemoveFile = (e) => {
      e.stopPropagation();
      setFiles((prev) => ({ ...prev, [name]: null }));
      setFilePreviews((prev) => ({ ...prev, [name]: null }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    };
    const hasError = !!errors[name];
    const hasFile = !!files[name];
    const previewUrl = filePreviews[name];
    const hasExistingFile = previewUrl && !hasFile;
    const hasNewFile = hasFile && files[name];
    return (
      <div className="space-y-2">
        <label
          className={`flex items-center text-sm font-medium ${
            darkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >
          {label}
          <InfoTooltip
            note={`Upload ${label.toLowerCase()} (PDF, DOC, DOCX, or image files up to 10MB)`}
          />
        </label>
        <div
          onClick={openFileDialog}
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors flex flex-col items-center justify-center min-h-[220px] cursor-pointer
          ${
            darkMode
              ? `bg-transparent ${
                  hasError ? "border-red-500" : "border-gray-600"
                } hover:border-gray-500`
              : `bg-white ${
                  hasError ? "border-red-500" : "border-gray-300"
                } hover:border-gray-400`
          }`}
        >
          {(hasFile || hasExistingFile) && (
            <button
              onClick={handleRemoveFile}
              className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-600"
              } transition-colors`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          <div className="flex flex-col items-center justify-center space-y-4 flex-grow">
            {previewUrl && previewUrl !== "FILE_SELECTED" ? (
              <div className="text-center">
                {previewUrl.match(/\.(jpg|jpeg|png|gif|svg)$/i) ||
                previewUrl.startsWith("blob:") ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-24 object-contain rounded mx-auto"
                  />
                ) : (
                  <div className="text-center">
                    <svg
                      className="w-12 h-12 mx-auto text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
                    <p className="text-sm mt-2">
                      {hasNewFile ? files[name]?.name : "Existing file"}
                    </p>
                  </div>
                )}
                {hasExistingFile && (
                  <p
                    className={`text-xs mt-2 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Existing file - Click to change
                  </p>
                )}
              </div>
            ) : hasFile ? (
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                <p className="text-sm mt-2">{files[name]?.name}</p>
              </div>
            ) : (
              <>
                <svg
                  className={`w-10 h-10 mx-auto ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Drag your file(s) or{" "}
                  <span className="font-semibold text-indigo-400">browse</span>
                </p>
                <p
                  className={`text-xs ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  Max 10 MB files are allowed
                </p>
              </>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openFileDialog();
              }}
              className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {hasFile || hasExistingFile ? "Change file" : "Browse file"}
            </button>
          </div>
        </div>
        {hasError && (
          <p className="text-red-500 text-sm mt-1">{errors[name]}</p>
        )}
      </div>
    );
  };
  return (
    <>
      <CustomScrollbarStyles isDark={darkMode} />
      <Alert alert={alert} onClose={hideAlert} darkMode={darkMode} />

      <div className={`min-h-screen flex ${darkMode ? "dark" : "light"}`}>
        {!isEditMode && (
          <EventSidebar
            darkMode={darkMode}
            onBackClick={handleBack}
            formProgress={{}}
            groupId={{}}
          />
        )}
        <div
          className={`${
            isEditMode ? "w-full" : "flex-1"
          } transition-colors duration-300`}
          style={{ backgroundColor: darkMode ? "#212426" : "#F9FAFB" }}
        >
          <div className="absolute top-6 right-6 z-10">
            <ThemeToggle
              isDark={darkMode}
              onToggle={() => setDarkMode(!darkMode)}
            />
          </div>
          <div className="hidden lg:flex justify-end p-6">
            <div
              onClick={() => setDarkMode(!darkMode)}
              className="w-[92px] h-[48px] rounded-full cursor-pointer relative px-[4px] flex items-center justify-between transition-all duration-300"
              style={{
                background: darkMode ? "#212426" : "#E5E7EB",
                boxShadow: darkMode
                  ? "inset -1px -1px 2px rgba(255, 255, 255, 0.06), inset 1px 1px 3px rgba(0, 0, 0, 0.4)"
                  : "inset 2px 2px 4px #cdd3da, inset -2px -2px 4px #fdffff",
              }}
            >
              <div
                className="absolute top-[4px] left-[4px] w-[40px] h-[40px] rounded-full transition-all duration-300 z-10"
                style={{
                  transform: darkMode ? "translateX(44px)" : "translateX(0)",
                  backgroundColor: darkMode ? "#2E2E2E" : "#FFFFFF",
                  boxShadow: darkMode
                    ? "inset -1px -1px 1px rgba(255, 255, 255, 0.05), inset 1px 1px 2px rgba(0, 0, 0, 0.3)"
                    : "2px 2px 4px #cdd3da, -2px -2px 4px #fdffff",
                }}
              />
              <div className="w-[40px] h-[40px] flex items-center justify-center z-20">
                <img
                  src={LightIcon}
                  alt="Light Mode"
                  className={`w-[18px] h-[18px] ${
                    !darkMode ? "filter brightness-0" : ""
                  }`}
                />
              </div>
              <div className="w-[40px] h-[40px] flex items-center justify-center z-20">
                <img
                  src={DarkIcon}
                  alt="Dark Mode"
                  className={`w-[18px] h-[18px] ${
                    !darkMode ? "filter brightness-0" : ""
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6 lg:mb-8">
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                  style={{ backgroundColor: darkMode ? "#1E1242" : "#1E1242" }}
                >
                  <img
                    src={OrgIcon}
                    alt="Organization"
                    className="w-8 h-8 filter brightness-0 invert"
                  />
                </div>
                <p
                  className={`text-sm mb-2 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  SECTION 1/6
                </p>
                <h1
                  className={`text-xl lg:text-2xl font-semibold lg:mb-8 ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {isEditMode
                    ? "Update your group"
                    : "Create your group to organize the event"}
                </h1>
                <div
                  className={`mt-4 p-3 rounded-lg ${
                    darkMode
                      ? "bg-blue-900/20 border border-blue-700/30 text-blue-300"
                      : "bg-blue-50 border border-blue-200 text-blue-700"
                  }`}
                >
                  <p className="text-sm">{getGroupCreationMessage()}</p>
                </div>
              </div>

              {errors.general && (
                <div
                  className={`border px-4 py-3 rounded-lg mb-6 ${
                    darkMode
                      ? "bg-red-900/50 border-red-500 text-red-200"
                      : "bg-red-100 border-red-400 text-red-700"
                  }`}
                >
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-6">
                  {capabilities.userRole === "admin" &&
                    (() => {
                      const creatableTypes = ["admin", "organisation"].filter(
                        (type) => canCreateGroupType(type)
                      );

                      if (creatableTypes.length > 1 && !isEditMode) {
                        return (
                          <div>
                            <label
                              className={`flex items-center text-sm font-medium mb-3 ${
                                darkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              Event created under{" "}
                              <span className="text-red-400 mx-1">*</span>
                              <InfoTooltip note="Choose to create this event under your personal Admin profile or a new Organisation." />
                            </label>
                            <div className="flex space-x-6">
                              {creatableTypes.map((type) => (
                                <label
                                  key={type}
                                  className="flex items-center space-x-2 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name="grp_type"
                                    value={type}
                                    checked={formData.grp_type === type}
                                    onChange={handleGroupTypeChange}
                                    disabled={isEditMode}
                                    className={`w-4 h-4 text-indigo-600 focus:ring-indigo-500 ${
                                      darkMode
                                        ? "bg-gray-800 border-gray-600"
                                        : "bg-gray-100 border-gray-300"
                                    }`}
                                  />
                                  <span
                                    className={`${
                                      darkMode
                                        ? "text-gray-300"
                                        : "text-gray-700"
                                    } capitalize`}
                                  >
                                    {type}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div>
                          <label
                            className={`block text-sm font-medium mb-3 ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Event created under{" "}
                            <span className="text-red-400">*</span>
                          </label>
                          <div
                            className={`px-4 capitalize font-medium ${
                              darkMode ? "text-gray-200" : "text-gray-800"
                            }`}
                          >
                            {isEditMode ? formData.grp_type : creatableTypes[0]}
                          </div>
                        </div>
                      );
                    })()}
                  {formData.grp_type === "admin" && (
                    <div className="space-y-6">
                      <div
                        className={`p-4 rounded-lg ${
                          darkMode
                            ? "bg-gray-800/50 border border-gray-700"
                            : "bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <h3
                          className={`text-lg font-semibold mb-4 ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Admin Group Details
                        </h3>
                        <div
                          className={`p-3 rounded ${
                            darkMode
                              ? "bg-blue-900/20 text-blue-300"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          <p className="text-sm mb-2">
                            Admin details will be automatically filled from your
                            profile:
                          </p>
                          <ul className="text-sm space-y-1">
                            <li>• Name: {userData?.name || "Not set"}</li>
                            <li>• Email: {userData?.email || "Not set"}</li>
                            <li>
                              • Contact: {userData?.contact_no || "Not set"}
                            </li>
                          </ul>
                        </div>
                        {(!userData?.name ||
                          !userData?.email ||
                          !userData?.contact_no) && (
                          <div
                            className={`mt-3 p-3 rounded ${
                              darkMode
                                ? "bg-red-900/20 border border-red-700/30 text-red-300"
                                : "bg-red-50 border border-red-200 text-red-700"
                            }`}
                          >
                            <p className="text-sm">
                              Please update your profile with missing
                              information before creating an admin group.
                            </p>
                          </div>
                        )}
                      </div>
                      <div>
                        <label
                          className={`flex items-center text-sm font-medium mb-3 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Do you have GST registration{" "}
                          <span className="text-red-400 mx-1">*</span>
                          <InfoTooltip note="Select if you are registered under the Goods and Services Tax." />
                        </label>
                        <div className="flex space-x-6">
                          {["Yes", "No"].map((option) => (
                            <label
                              key={option}
                              className="flex items-center space-x-2 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="hasGst"
                                value={option}
                                checked={hasGst === option}
                                onChange={handleGstChange}
                                className={`w-4 h-4 text-indigo-600 focus:ring-indigo-500 ${
                                  darkMode
                                    ? "bg-gray-800 border-gray-600"
                                    : "bg-gray-100 border-gray-300"
                                }`}
                              />
                              <span
                                className={`${
                                  darkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                        {errors.hasGst && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.hasGst}
                          </p>
                        )}
                      </div>

                      {hasGst === "Yes" && (
                        <div className="mt-4">
                          <label
                            className={`flex items-center text-sm font-medium mb-2 ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            GST IN <span className="text-red-400 mx-1">*</span>
                            <InfoTooltip note="Enter your 15-digit GST Identification Number." />
                          </label>
                          <input
                            type="text"
                            name="gst_no"
                            value={formData.gst_no}
                            onChange={handleInputChange}
                            placeholder="Enter your GST number"
                            className={`w-full px-4 py-3 border rounded-lg h-12 focus:outline-none focus:ring-2 focus:ring-indigo-500
                                  ${
                                    darkMode
                                      ? "text-white border-gray-600"
                                      : "text-gray-900 border-gray-300"
                                  }
                                  ${errors.gst_no ? "border-red-500" : ""}`}
                            style={{
                              backgroundColor: darkMode ? "#212426" : "white",
                            }}
                          />
                          {errors.gst_no && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.gst_no}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {formData.grp_type === "organisation" && (
                    <>
                      <div>
                        <label
                          className={`flex items-center text-sm font-medium mb-2 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Organization name{" "}
                          <span className="text-red-400 mx-1">*</span>
                          <InfoTooltip note="Enter the legal name of your organization." />
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter your organization name"
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-12
                            ${
                              darkMode
                                ? "text-white border-gray-600"
                                : "text-gray-900 border-gray-300"
                            }
                            ${errors.name ? "border-red-500" : ""}`}
                          ref={(el) => (errorFieldRefs.current.name = el)}
                          style={{
                            backgroundColor: darkMode ? "#212426" : "white",
                          }}
                        />
                        {errors.name && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.name}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label
                            className={`flex items-center text-sm font-medium mb-2 ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Organisation email ID{" "}
                            <span className="text-red-400 mx-1">*</span>
                            <InfoTooltip note="This email will be used for official communication." />
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Enter your organization email"
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-12
                              ${
                                darkMode
                                  ? "text-white border-gray-600"
                                  : "text-gray-900 border-gray-300"
                              }
                              ${errors.email ? "border-red-500" : ""}`}
                            ref={(el) => (errorFieldRefs.current.email = el)}
                            style={{
                              backgroundColor: darkMode ? "#212426" : "white",
                            }}
                          />
                          {errors.email && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.email}
                            </p>
                          )}
                        </div>
                        <div>
                          <label
                            className={`flex items-center text-sm font-medium mb-2 ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Organisation contact{" "}
                            <span className="text-red-400 mx-1">*</span>
                            <InfoTooltip note="Enter a 10-digit mobile number." />
                          </label>
                          <input
                            type="tel"
                            name="contact_no"
                            value={formData.contact_no}
                            onChange={handleInputChange}
                            placeholder="Enter your contact number"
                            maxLength="10"
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-12
                              ${
                                darkMode
                                  ? "text-white border-gray-600"
                                  : "text-gray-900 border-gray-300"
                              }
                              ${errors.contact_no ? "border-red-500" : ""}`}
                            ref={(el) =>
                              (errorFieldRefs.current.contact_no = el)
                            }
                            style={{
                              backgroundColor: darkMode ? "#212426" : "white",
                            }}
                          />
                          {errors.contact_no && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.contact_no}
                            </p>
                          )}
                        </div>
                      </div>
                      <div
                        ref={(el) =>
                          (errorFieldRefs.current.organisation_type = el)
                        }
                      >
                        <label
                          className={`flex items-center text-sm font-medium mb-2 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Type of organization{" "}
                          <span className="text-red-400 mx-1">*</span>
                          <InfoTooltip note="Select the legal structure of your organization." />
                        </label>
                        <Select
                          name="organisation_type"
                          options={organisationTypeOptions}
                          value={organisationTypeOptions.find(
                            (option) =>
                              option.value === formData.organisation_type
                          )}
                          onChange={handleSelectChange}
                          placeholder="Select your organization type"
                          styles={customSelectStyles(darkMode)}
                          theme={(theme) => themeOverride(theme, darkMode)}
                        />
                        {errors.organisation_type && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.organisation_type}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          className={`flex items-center text-sm font-medium mb-2 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Organisation address{" "}
                          <span className="text-red-400 mx-1">*</span>
                          <InfoTooltip note="Enter the official registered address." />
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Enter your organisation address"
                          rows="4"
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[100px]
                            ${
                              darkMode
                                ? "text-white border-gray-600"
                                : "text-gray-900 border-gray-300"
                            }
                            ${errors.address ? "border-red-500" : ""}`}
                          ref={(el) => (errorFieldRefs.current.address = el)}
                          style={{
                            backgroundColor: darkMode ? "#212426" : "white",
                          }}
                        />
                        {errors.address && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.address}
                          </p>
                        )}
                      </div>
                      {(() => {
                        const gstStatus = getGSTStatus(formData.organisation_type);
                        const isMandatory   = gstStatus === "mandatory";
                        const isConditional = gstStatus === "conditional";
                        const isExempt      = gstStatus === "exempt";

                        const gstNote = isMandatory
                          ? "Mandatory for your organisation type under Indian GST law."
                          : isConditional
                          ? "Optional — required only if you conduct commercial activities or cross ₹20L turnover."
                          : isExempt
                          ? "Generally exempt — enter only if your organisation has voluntarily registered for GST."
                          : "Enter your GST number if registered.";

                        const gstBadge = isMandatory
                          ? { text: "Required", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" }
                          : isConditional
                          ? { text: "Conditional", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" }
                          : isExempt
                          ? { text: "Usually Exempt", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" }
                          : { text: "Optional", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };

                        return (
                          <div>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <label
                                className={`flex items-center text-sm font-medium ${
                                  darkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                GST IN
                                {isMandatory && <span className="text-red-400 mx-1">*</span>}
                                <InfoTooltip note={gstNote} />
                              </label>
                              {formData.organisation_type && (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${gstBadge.cls}`}>
                                  {gstBadge.text}
                                </span>
                              )}
                            </div>

                            {/* Contextual hint for conditional/exempt sectors */}
                            {(isConditional || isExempt) && formData.organisation_type && (
                              <p className={`text-xs mb-2 ${
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }`}>
                                {isConditional
                                  ? "For NGOs, Trusts & Societies: GST applies only if conducting ticketed/commercial events."
                                  : "For Educational & Healthcare: GST is exempt for core services but applies to paid events."}
                              </p>
                            )}

                            <input
                              type="text"
                              name="gst_no"
                              value={formData.gst_no}
                              onChange={handleInputChange}
                              placeholder={
                                isMandatory
                                  ? "Enter your GST number (mandatory)"
                                  : "Enter your GST number (if registered)"
                              }
                              className={`w-full px-4 py-3 border rounded-lg h-12 focus:outline-none focus:ring-2 focus:ring-indigo-500
                                ${darkMode ? "text-white border-gray-600" : "text-gray-900 border-gray-300"}
                                ${errors.gst_no ? "border-red-500" : ""}`}
                              ref={(el) => (errorFieldRefs.current.gst_no = el)}
                              style={{ backgroundColor: darkMode ? "#212426" : "white" }}
                            />
                            {errors.gst_no && (
                              <p className="text-red-500 text-sm mt-1">{errors.gst_no}</p>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  )}

                  <div>
                    <label
                      className={`flex items-center text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      PAN number <span className="text-red-400 mx-1">*</span>
                      <InfoTooltip note="Enter your 10-digit Permanent Account Number." />
                    </label>
                    <input
                      type="text"
                      name="pan_no"
                      value={formData.pan_no}
                      onChange={handleInputChange}
                      placeholder="Enter your PAN number"
                      className={`w-full px-4 py-3 border rounded-lg h-12 focus:outline-none focus:ring-2 focus:ring-indigo-500
                        ${
                          darkMode
                            ? "text-white border-gray-600"
                            : "text-gray-900 border-gray-300"
                        }
                        ${errors.pan_no ? "border-red-500" : ""}`}
                      ref={(el) => (errorFieldRefs.current.pan_no = el)}
                      style={{
                        backgroundColor: darkMode ? "#212426" : "white",
                      }}
                    />
                    {errors.pan_no && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.pan_no}
                      </p>
                    )}
                  </div>

                  <div
                    className={`rounded-xl p-6 md:p-8 ${
                      darkMode ? "" : "bg-white border"
                    }`}
                    style={darkMode ? { backgroundColor: "#2B2B2B" } : {}}
                  >
                    <div className="space-y-6">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <h2
                          className={`text-lg font-semibold ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Primary banking details
                        </h2>
                        <span
                          className={`text-xs font-medium px-3 py-1 rounded-full ${
                            darkMode
                              ? "bg-yellow-400/20 text-yellow-300"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          Bank account must be a current account or merchant
                          account
                        </span>
                      </div>
                      <p
                        className={`text-sm -mt-4 ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Provide bank account details for payment processing,
                        settlements, or refunds.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(() => {
                          const inputStyle = {
                            background: "transparent",
                            border: darkMode
                              ? "1px solid #4A4A4A"
                              : "1px solid #D1D5DB",
                          };

                          return (
                            <>
                              <div>
                                <label
                                  className={`flex items-center text-sm font-medium mb-2 ${
                                    darkMode ? "text-gray-300" : "text-gray-700"
                                  }`}
                                >
                                  Account type
                                  <InfoTooltip note="Select if your account is Savings or Current." />
                                </label>
                                <Select
                                  name="primary_bank_acc_type"
                                  options={accountTypeOptions}
                                  value={accountTypeOptions.find(
                                    (option) =>
                                      option.value ===
                                      formData.primary_bank_acc_type
                                  )}
                                  onChange={handleSelectChange}
                                  placeholder="Select your account type"
                                  styles={customSelectStyles(darkMode)}
                                  theme={(theme) =>
                                    themeOverride(theme, darkMode)
                                  }
                                  ref={(el) =>
                                    (errorFieldRefs.current.primary_bank_acc_type =
                                      el)
                                  }
                                />
                                {errors.primary_bank_acc_type && (
                                  <p className="text-red-500 text-sm mt-1">
                                    {errors.primary_bank_acc_type}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label
                                  className={`flex items-center text-sm font-medium mb-2 ${
                                    darkMode ? "text-gray-300" : "text-gray-700"
                                  }`}
                                >
                                  Account holder name
                                  <InfoTooltip note="Enter the full name as it appears on your bank account." />
                                </label>
                                <input
                                  type="text"
                                  name="primary_bank_acc_holder"
                                  value={formData.primary_bank_acc_holder}
                                  onChange={handleInputChange}
                                  placeholder="eg: John Doe"
                                  className={`w-full px-4 py-3 rounded-lg h-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                    darkMode ? "text-white" : "text-gray-900"
                                  }
                                                      ${
                                                        errors.primary_bank_acc_holder
                                                          ? "ring-2 ring-red-500"
                                                          : ""
                                                      }`}
                                  ref={(el) =>
                                    (errorFieldRefs.current.primary_bank_acc_holder =
                                      el)
                                  }
                                  style={inputStyle}
                                />
                                {errors.primary_bank_acc_holder && (
                                  <p className="text-red-500 text-sm mt-1">
                                    {errors.primary_bank_acc_holder}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label
                                  className={`flex items-center text-sm font-medium mb-2 ${
                                    darkMode ? "text-gray-300" : "text-gray-700"
                                  }`}
                                >
                                  Account number
                                  <InfoTooltip note="Enter your complete bank account number." />
                                </label>
                                <input
                                  type="text"
                                  name="primary_bank_acc_no"
                                  value={formData.primary_bank_acc_no}
                                  onChange={handleInputChange}
                                  placeholder="XXXX - XXXX - XXXX - XXXX"
                                  className={`w-full px-4 py-3 rounded-lg h-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                    darkMode ? "text-white" : "text-gray-900"
                                  }
                                                      ${
                                                        errors.primary_bank_acc_no
                                                          ? "ring-2 ring-red-500"
                                                          : ""
                                                      }`}
                                  ref={(el) =>
                                    (errorFieldRefs.current.primary_bank_acc_no =
                                      el)
                                  }
                                  style={inputStyle}
                                />
                                {errors.primary_bank_acc_no && (
                                  <p className="text-red-500 text-sm mt-1">
                                    {errors.primary_bank_acc_no}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label
                                  className={`flex items-center text-sm font-medium mb-2 ${
                                    darkMode ? "text-gray-300" : "text-gray-700"
                                  }`}
                                >
                                  IFSC code
                                  <InfoTooltip note="Enter the 11-character IFSC code of your bank branch." />
                                </label>
                                <input
                                  type="text"
                                  name="primary_bank_ifsc"
                                  value={formData.primary_bank_ifsc}
                                  onChange={handleInputChange}
                                  placeholder="XXXXXXXXXXX"
                                  maxLength="11"
                                  className={`w-full px-4 py-3 rounded-lg h-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                    darkMode ? "text-white" : "text-gray-900"
                                  }
                                                      ${
                                                        errors.primary_bank_ifsc
                                                          ? "ring-2 ring-red-500"
                                                          : ""
                                                      }`}
                                  ref={(el) =>
                                    (errorFieldRefs.current.primary_bank_ifsc =
                                      el)
                                  }
                                  style={inputStyle}
                                />
                                {errors.primary_bank_ifsc && (
                                  <p className="text-red-500 text-sm mt-1">
                                    {errors.primary_bank_ifsc}
                                  </p>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formData.grp_type === "admin" && (
                      <>
                        <FileUploadArea
                          label="Aadhaar card *"
                          name="id_proof"
                          ref={(el) => (errorFieldRefs.current.id_proof = el)}
                        />
                        <FileUploadArea
                          label="Cancelled bank cheque"
                          name="bank_check"
                          ref={(el) => (errorFieldRefs.current.bank_check = el)}
                        />
                      </>
                    )}

                    {formData.grp_type === "organisation" && (
                      <>
                        <FileUploadArea
                          label="Aadhaar card *"
                          name="id_proof"
                          ref={(el) => (errorFieldRefs.current.id_proof = el)}
                        />
                        <FileUploadArea
                          label="Cancelled bank cheque"
                          name="bank_check"
                          ref={(el) => (errorFieldRefs.current.bank_check = el)}
                        />
                        <FileUploadArea
                          label="Company logo"
                          name="company_logo"
                          ref={(el) =>
                            (errorFieldRefs.current.company_logo = el)
                          }
                        />
                        <FileUploadArea
                          label="MOA/AOA/Company certificates"
                          name="company_certificate"
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8">
                  <button
                    type="button"
                    onClick={() => navigate("/ticket/groups")}
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3 rounded-lg transition-colors disabled:opacity-50 h-12 min-w-[120px] font-semibold"
                    style={{
                      backgroundColor: darkMode ? "#363A3F" : "#E5E7EB",
                      color: darkMode ? "white" : "#374151",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      (!isEditMode && !canCreateGroupType(formData.grp_type))
                    }
                    className="w-full sm:w-auto px-8 py-3 text-white rounded-lg transition-colors disabled:opacity-50 h-12 min-w-[120px] font-semibold"
                    style={{
                      backgroundColor: darkMode ? "#1E1242" : "#1E1242",
                    }}
                  >
                    {loading
                      ? isEditMode
                        ? "Updating..."
                        : "Creating..."
                      : isEditMode
                      ? "Update group"
                      : "Add group"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default CreateGroup;
