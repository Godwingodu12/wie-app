import React, { useState, useEffect, useRef } from "react";
import { getMe } from "../../services/userService.js";
import { editProfile } from "../../services/authService.js";
import { useNavigate } from "react-router-dom";
import { getImageUrl, getOptimizedImageUrl } from '../../utils/imageUtils.js';
import SideBar from "../../components/HomePage/SideBar.jsx";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import SettingsNavigation from "../../components/settings/SettingsNavigation.jsx";
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import HandBurgerIcon from "../../assets/HomePage/HandBurgerIcon.svg";
import CameraIcon from "../../assets/Settings/CameraIcon.svg";
import WhatsappIcon from "../../assets/Settings/WhatsAppIcon.svg";
import InstagramIcon from "../../assets/Settings/InstagramIcon.svg";
import FacebookIcon from "../../assets/Settings/FacebookIcon.svg";
import LinkedInIcon from "../../assets/Settings/LinkedInIcon.svg";
import XIcon from "../../assets/Settings/XIcon.svg";

const HEADER_HEIGHT = 72;

const EditProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    website: "",
    bio: "",
    gender: "Prefer not to say",
    showBadge: true,
    showSuggestion: true,
  });

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getMe();
        setUser(res.data);

        setFormData({
          website: res.data.website || "",
          bio: res.data.bio || "",
          gender: res.data.gender || "Prefer not to say",
          showBadge:
            res.data.showBadge !== undefined ? res.data.showBadge : true,
          showSuggestion:
            res.data.showSuggestion !== undefined
              ? res.data.showSuggestion
              : true,
        });
        if (res.data.image) {
          setImagePreview(getImageUrl(res.data.image, 'auth'));
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, []);

  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        alert("Please select a valid image file (JPEG, PNG, or GIF)");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      setSelectedImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("website", formData.website);
      formDataToSend.append("bio", formData.bio);
      if (user?.role === 'admin') {
        formDataToSend.append("gender", formData.gender.toLowerCase());
      }
      if (selectedImage) {
        formDataToSend.append("image", selectedImage);
      }
      const response = await editProfile(formDataToSend);
      if (response.success) {
        alert("Profile updated successfully!");
        setUser(response.user);
        if (response.user.image) {
          setImagePreview(getImageUrl(response.user.image, 'auth'));
        }
        setSelectedImage(null);
      }
    } catch (err) {
      console.error("Failed to update profile", err);
      alert(
        err.response?.data?.error ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const theme = isDark
    ? {
        bg: "bg-[#212426]",
        text: "text-white",
        notificationShadow:
          "inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)",
        cardShadow:
          "inset 8px 8px 16px rgba(0,0,0,0.4), inset -8px -8px 16px rgba(60,60,60,0.1)",
        inputShadow:
          "inset 4px 4px 8px rgba(0,0,0,0.3), inset -4px -4px 8px rgba(60,60,60,0.1)",
        buttonShadow:
          "4px 4px 8px rgba(0,0,0,0.3), -4px -4px 8px rgba(60,60,60,0.1)",
        sidebarBg: "bg-[#1a1c1e]",
        inputBg: "bg-[#2a2d30]",
        borderColor: "border-[#3a3c40]",
        separatorColor: "rgba(255,255,255,0.3)",
      }
    : {
        bg: "bg-[#f0f2f5]",
        text: "text-gray-900",
        notificationShadow:
          "inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)",
        cardShadow:
          "inset 8px 8px 16px rgba(0,0,0,0.1), inset -8px -8px 16px rgba(255,255,255,0.8)",
        inputShadow:
          "inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.8)",
        buttonShadow:
          "4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.8)",
        sidebarBg: "bg-gray-50",
        inputBg: "bg-gray-50",
        borderColor: "border-gray-200",
        separatorColor: "rgba(255,255,255,0.3)",
      };

  return (
    <>
    <style>{`
        /* Main page scrollbar */
        body::-webkit-scrollbar,
        html::-webkit-scrollbar,
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }
        
        body::-webkit-scrollbar-track,
        html::-webkit-scrollbar-track,
        .overflow-y-auto::-webkit-scrollbar-track {
          background: ${isDark ? '#1f2937' : '#f1f1f1'};
        }
        
        body::-webkit-scrollbar-thumb,
        html::-webkit-scrollbar-thumb,
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: ${isDark ? '#4b5563' : '#cbd5e1'};
          border-radius: 10px;
        }
        
        body::-webkit-scrollbar-thumb:hover,
        html::-webkit-scrollbar-thumb:hover,
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#6b7280' : '#94a3b8'};
        }
      `}</style>
    <div
      className={`${theme.bg} ${theme.text} min-h-screen flex overflow-hidden transition-colors duration-300`}
    >
      {/* Original Sidebar */}
      <div
        className={`hidden lg:flex flex-col flex-shrink-0 ${theme.bg} transition-colors duration-300`}
      >
        <div
          className="flex items-center justify-center"
          style={{ height: HEADER_HEIGHT }}
        >
          <img
            src={WieLogo}
            alt="Wie Logo"
            className="w-10 h-10 lg:w-12 lg:h-12"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <SideBar user={user} theme={theme} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        <header
          className="flex items-center justify-between px-4 md:px-6"
          style={{ height: HEADER_HEIGHT }}
        >
          <div className="flex items-center justify-between w-full lg:hidden">
            <button onClick={() => setIsMobileNavOpen(true)}>
              <img
                src={HandBurgerIcon}
                alt="Menu"
                className={`w-6 h-6 ${
                  isDark ? "filter brightness-0 invert" : ""
                }`}
                style={{ filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)' }}
              />
            </button>
            <img src={WieLogo} alt="Wie Logo" className="w-8 h-8" />
            <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
          </div>
          <div className="hidden lg:flex items-center gap-4 w-full">
            <div className="flex-1 min-w-0">
              <SearchBar
                theme={theme}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-[1560px] mx-auto">
          <div
            className={`${theme.bg} transition-colors duration-300 flex flex-col lg:flex-row overflow-hidden`}
            style={{ 
              borderRadius: '50px',
              boxShadow: '6px 6px 12px 0px rgba(0, 0, 0, 0.18) inset, -6px -6px 12px 0px rgba(255, 255, 255, 0.08) inset',
              minHeight: '808px'
            }}
          >
            <SettingsNavigation
              theme={theme}
              isDark={isDark}
              isMobile={isMobile}
              isOpen={isMobileNavOpen}
              onClose={() => setIsMobileNavOpen(false)}
            />
            {/* Edit Profile Form */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto">
              <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Edit Profile</h1>
                <p className="text-gray-500 text-sm">
                  Make it yours! Edit your name, bio, photo, and more to
                  reflect the real you
                </p>
              </div>

                {/* Profile Picture Section */}
                <div className="flex items-center justify-center mb-8">
                  <div className="relative">
                    <div
                      className="w-24 h-24 rounded-full overflow-hidden cursor-pointer"
                      onClick={handleImageClick}
                    >
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                          <span className="text-white text-2xl font-bold">
                            {user?.name?.[0]?.toUpperCase() || "U"}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleImageClick}
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#1E1242] rounded-full flex items-center justify-center text-white border-2 border-white"
                    >
                      <img src={CameraIcon} alt="Edit" className="w-4 h-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h3 className="font-semibold">
                    {user?.name || "Loading..."}
                  </h3>
                </div>
                {/* Form Fields - Shifted left for better alignment */}
                <div className="space-y-4 md:pr-12 lg:pr-16">
                  {/* Website */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <label className="col-span-1 md:col-span-3 text-sm font-medium md:flex md:justify-end md:pr-2">
                      Website
                    </label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) =>
                        handleInputChange("website", e.target.value)
                      }
                      placeholder="https://example.com"
                      className={`col-span-1 md:col-span-8 px-4 py-3 rounded-lg ${theme.inputBg} ${theme.text} transition-colors duration-300 border-2 border-white opacity-35 outline-none`}
                      style={{ boxShadow: theme.inputShadow }}
                    />
                  </div>
                  {/* Bio */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <label className="col-span-1 md:col-span-3 text-sm font-medium md:flex md:justify-end">
                      Bio
                    </label>
                    <div className="col-span-1 md:col-span-8">
                      <textarea
                        value={formData.bio}
                        onChange={(e) =>
                          handleInputChange("bio", e.target.value)
                        }
                        rows={4}
                        maxLength={150}
                        placeholder="Tell us about yourself..."
                        className={`w-full px-4 py-3 rounded-lg ${theme.inputBg} ${theme.text} transition-colors duration-300 border-2 border-white opacity-35 outline-none resize-none`}
                        style={{ boxShadow: theme.inputShadow }}
                      />
                      <div className="text-left text-xs text-gray-500 mt-1">
                        {formData.bio.length}/150
                      </div>

                      {/* Show wie account badge */}
                      <div className="flex items-center gap-3 mt-4">
                        <span className="text-sm font-medium">
                          Show wie account badge
                        </span>
                        <div
                          className="relative w-12 h-6 rounded-full cursor-pointer transition-all duration-300 ml-3"
                          style={{
                            backgroundColor: "#212426",
                            boxShadow: `
                              inset 3px 3px 6px rgba(0, 0, 0, 0.7),
                              inset -3px -3px 6px rgba(255, 255, 255, 0.12)
                            `,
                          }}
                          onClick={() =>
                            handleInputChange("showBadge", !formData.showBadge)
                          }
                        >
                          <div
                            className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-300 ${
                              formData.showBadge
                                ? "translate-x-6"
                                : "translate-x-0.5"
                            }`}
                            style={{
                              backgroundColor: "#5E5CE6",
                              boxShadow: `
                                2px 2px 5px rgba(0, 0, 0, 0.6),
                                -2px -2px 6px rgba(255, 255, 255, 0.15)
                              `,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                        
                  {/* Gender - Only show for admin users */}
                  {user?.role === 'admin' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <label className="col-span-1 md:col-span-3 text-sm font-medium md:flex md:justify-end">
                        Gender
                      </label>
                      <div className="col-span-1 md:col-span-8 relative">
                        <select
                          value={formData.gender}
                          onChange={(e) =>
                            handleInputChange("gender", e.target.value)
                          }
                          className={`w-full px-4 py-3 rounded-lg ${theme.inputBg} ${theme.text} transition-colors duration-300 border-2 border-white opacity-35 outline-none appearance-none cursor-pointer`}
                          style={{ boxShadow: theme.inputShadow }}
                        >
                          <option value="Prefer not to say">
                            Prefer not to say
                          </option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        <svg
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
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
                  )}


                  {/* Show wie account suggestion on profile */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <label className="col-span-1 md:col-span-3 text-sm font-medium md:flex md:justify-end" />
                    <div className="col-span-1 md:col-span-8">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">
                          Show wie account suggestion on profile
                        </span>
                        <div
                          className="relative w-12 h-6 rounded-full cursor-pointer transition-all duration-300"
                          style={{
                            backgroundColor: "#212426",
                            boxShadow: `
                              inset 3px 3px 6px rgba(0, 0, 0, 0.7),
                              inset -3px -3px 6px rgba(255, 255, 255, 0.12)
                            `,
                          }}
                          onClick={() =>
                            handleInputChange(
                              "showSuggestion",
                              !formData.showSuggestion
                            )
                          }
                        >
                          <div
                            className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-300 ${
                              formData.showSuggestion
                                ? "translate-x-6"
                                : "translate-x-0.5"
                            }`}
                            style={{
                              backgroundColor: "#5E5CE6",
                              boxShadow: `
                                2px 2px 5px rgba(0, 0, 0, 0.6),
                                -2px -2px 6px rgba(255, 255, 255, 0.15)
                              `,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connect accounts with Submit button */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 md:col-span-3 text-sm font-medium md:flex md:justify-end md:pr-2" />
                    <div className="col-span-1 md:col-span-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">
                          Connect accounts
                        </span>
                        <div className="flex gap-3">
                          {[
                            {
                              name: "whatsapp",
                              icon: (
                                <img
                                  src={WhatsappIcon}
                                  alt="WhatsApp"
                                  className="w-5 h-5"
                                />
                              ),
                            },
                            {
                              name: "instagram",
                              icon: (
                                <img
                                  src={InstagramIcon}
                                  alt="Instagram"
                                  className="w-6 h-6"
                                />
                              ),
                            },
                            {
                              name: "X",
                              icon: (
                                <img src={XIcon} alt="X" className="w-4 h-4" />
                              ),
                            },
                            {
                              name: "facebook",
                              icon: (
                                <img
                                  src={FacebookIcon}
                                  alt="FaceBook"
                                  className="w-6 h-6"
                                />
                              ),
                            },
                            {
                              name: "linkedin",
                              icon: (
                                <img
                                  src={LinkedInIcon}
                                  alt="LinkedIn"
                                  className="w-6 h-6"
                                />
                              ),
                            },
                          ].map((social) => (
                            <div
                              key={social.name}
                              className={`w-10 h-10 flex items-center justify-center cursor-pointer transition-colors duration-300 hover:bg-opacity-80`}
                              title={`Connect ${social.name}`}
                            >
                              <span className="text-lg">{social.icon}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className={`px-12 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                        style={{ boxShadow: theme.buttonShadow }}
                      >
                        {isLoading ? "Saving..." : "Submit"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    </>
  );
};
export default EditProfile;
