import React, { useState, useEffect, useRef } from "react";
import "react-international-phone/style.css";
import { PhoneInput, defaultCountries, parseCountry } from "react-international-phone";
import { getUserData } from "../../services/ticketService";
import { personalDetails } from "../../services/authService.js";
import { getImageUrl } from "../../utils/imageUtils.js";
import SideBar from "../../components/HomePage/SideBar.jsx";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import SettingsNavigation from "../../components/settings/SettingsNavigation.jsx";
import Alert from '../../components/CreateGroup/Alert';
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import HandBurgerIcon from "../../assets/HomePage/HandBurgerIcon.svg";
import CameraIcon from "../../assets/Settings/CameraIcon.svg";  
import ProfileImage from "../../assets/PROFILEPAGE/ProfileImage.png";

const HEADER_HEIGHT = 72;

const PersonalDetails = () => {
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    secondaryEmail: "",
    phone: "",
    address: "",
  });

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Country selector states
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(parseCountry(defaultCountries[0]));
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [fullPhoneValue, setFullPhoneValue] = useState("+91");
  // Parse all countries from react-international-phone
  const countries = defaultCountries.map((country) => parseCountry(country));
  const [alert, setAlert] = useState(null);
  const showAlert = (data) => setAlert({ ...data, show: true });
  const hideAlert = () => setAlert(null);
    // Handle responsive view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserData();
        console.log("User data fetched:", res.data); // Debug log
        setUser(res.data);
        setFormData({
          name: res.data.name || "",
          username: res.data.username || "",
          email: res.data.email || "",
          secondaryEmail: res.data.secondary_email || "",
          phone: res.data.contact_no || "",
          address: res.data.address || "",
        });
        
        // Set country from user data
        if (res.data.country_iso2 && res.data.country_code) {
          const country = countries.find(c => c.iso2.toLowerCase() === res.data.country_iso2.toLowerCase());
          if (country) {
            setSelectedCountry(country);
            setFullPhoneValue(res.data.country_code);
          }
        }
        
        // Set image preview - Enhanced logging
        console.log("User image URL:", res.data.image); // Debug log
        if (res.data.image) {
          let imageUrl;
          // Check if it's a Cloudinary URL or needs getImageUrl
          if (res.data.image.startsWith('http://') || res.data.image.startsWith('https://')) {
            imageUrl = res.data.image;
          } else {
            imageUrl = getImageUrl(res.data.image, "auth");
          }
          console.log("Setting image preview to:", imageUrl); // Debug log
          setImagePreview(imageUrl);
        } else {
          console.log("No image found, using default ProfileImage"); // Debug log
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
        showAlert({
          type: 'error', 
          message: 'Load Failed', 
          description: 'Failed to load Personal data.'
        });
      }
    };
    fetchUser();
  }, []);
  // Theme toggle
  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
const handleCountrySelect = (country) => {
  setSelectedCountry(country);
  const countryCode = country.dialCode.startsWith('+') ? country.dialCode : `+${country.dialCode}`;
  setFullPhoneValue(countryCode);
  setIsCountryModalOpen(false);
  setCountrySearchQuery("");
};
  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
      country.dialCode.includes(countrySearchQuery)
  );

  // Image handling
  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
  };
const handleSubmit = async () => {
  setIsLoading(true);
  try {
    const formDataToSend = new FormData();
    
    // Append all form fields
    formDataToSend.append('name', formData.name);
    formDataToSend.append('username', formData.username);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('secondary_email', formData.secondaryEmail);
    formDataToSend.append('contact_no', formData.phone);
    
    // Ensure country code has + prefix
    const countryCode = selectedCountry.dialCode.startsWith('+') 
      ? selectedCountry.dialCode 
      : `+${selectedCountry.dialCode}`;
    formDataToSend.append('country_code', countryCode);
    formDataToSend.append('country_iso2', selectedCountry.iso2.toLowerCase());
    formDataToSend.append('address', formData.address);

    if (selectedImage) {
      formDataToSend.append("image", selectedImage);
    }

    const response = await personalDetails(formDataToSend);
    if (response.success) {
      showAlert({
        type: 'success', 
        message: 'Personal data updated!', 
        description: 'Your data has been saved successfully.'
      });
      setUser(response.user);
      
      // Update form data with response
      setFormData({
        name: response.user.name || "",
        username: response.user.username || "",
        email: response.user.email || "",
        secondaryEmail: response.user.secondary_email || "",
        phone: response.user.contact_no || "",
        address: response.user.address || "",
      });
      
      // Update selected country if available
      if (response.user.country_code && response.user.country_iso2) {
        const country = countries.find(c => c.iso2.toLowerCase() === response.user.country_iso2.toLowerCase());
        if (country) {
          setSelectedCountry(country);
        }
      }
      
      // Update image preview
      if (response.user.image) {
        if (response.user.image.startsWith('http://') || response.user.image.startsWith('https://')) {
          setImagePreview(response.user.image);
        } else {
          setImagePreview(getImageUrl(response.user.image, "auth"));
        }
      }
      setSelectedImage(null);
    }
  } catch (err) {
    console.error("Failed to update personal details", err);
    showAlert({
      type: 'error', 
      message: 'Update Failed', 
      description: err.response?.data?.message || "Failed to update personal details. Please try again."
    });
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
      <div className={`${theme.bg} ${theme.text} min-h-screen flex overflow-hidden transition-colors duration-300`}>
        {/* Sidebar */}
        <div className={`hidden lg:flex flex-col flex-shrink-0 ${theme.bg}`}>
          <div className="flex items-center justify-center" style={{ height: HEADER_HEIGHT }}>
            <img src={WieLogo} alt="Wie Logo" className="w-10 h-10 lg:w-12 lg:h-12" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <SideBar user={user} theme={theme} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between px-4 md:px-6" style={{ height: HEADER_HEIGHT }}>
            <div className="flex items-center justify-between w-full lg:hidden">
              <button onClick={() => setIsMobileSidebarOpen(true)}>
                <img
                  src={HandBurgerIcon}
                  alt="Menu"
                  className={`w-6 h-6 ${isDark ? "filter brightness-0 invert" : ""}`}
                  style={{ filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)' }}
                />
              </button>
              <img src={WieLogo} alt="Wie Logo" className="w-8 h-8" />
              <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
            </div>
            <div className="hidden lg:flex items-center gap-4 w-full">
              <div className="flex-1 min-w-0">
                <SearchBar theme={theme} value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
              </div>
              <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
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
                isOpen={isMobileSidebarOpen}
                onClose={() => setIsMobileSidebarOpen(false)}
              />
                <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                  <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-2">Personal details</h1>
                    <p className="text-gray-500 text-sm">
                      Provide your personal information, even if the account is used for a business, a pet or something else. This won't be a part of your public profile.
                    </p>
                  </div>
                  {/* Profile Picture */}
                  <div className="flex items-center justify-center mb-8">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden cursor-pointer" onClick={handleImageClick}>
                        {imagePreview ? (
                          <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <img src={ProfileImage} alt="Profile" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <button
                        onClick={handleImageClick}
                        className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#1E1242] rounded-full flex items-center justify-center text-white border-2 border-white"
                      >
                        <img src={CameraIcon} alt="Edit" className="w-4 h-4" />
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </div>
                  </div>
                  {/* Form Fields */}
                  <div className="space-y-6 md:pr-12 lg:pr-16">
                    {/* Name */}
<div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
  <label className="col-span-1 md:col-span-3 text-sm font-medium md:flex md:justify-end md:pr-2 pt-3">
    Name
  </label>
  <div className="col-span-1 md:col-span-8">
    <input
      type="text"
      value={formData.name}
      onChange={(e) => handleInputChange("name", e.target.value)}
      placeholder="Your name"
      className={`w-full px-4 py-3 rounded-lg ${theme.inputBg} ${theme.text} border ${isDark ? "border-white" : "border-black"}  outline-none transition-colors duration-300`}
    />
    <div className="mt-1 text-xs text-gray-500">
      <p>
        Help people discover your account by using the name you're known by:
        either your full name, nickname or business name.
      </p>
      <p>You can only change your name twice within 14 days.</p>
    </div>
  </div>
</div>

{/* Username */}
<div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
  <label className="col-span-1 md:col-span-3 text-sm font-medium md:flex md:justify-end md:pr-2 pt-3">
    Username
  </label>
  <div className="col-span-1 md:col-span-8">
    <input
      type="text"
      value={formData.username}
      onChange={(e) => handleInputChange("username", e.target.value)}
      placeholder="username"
      className={`w-full px-4 py-3 rounded-lg ${theme.inputBg} ${theme.text} border ${isDark ? "border-white" : "border-black"}  outline-none transition-colors duration-300`}
    />
    <p className="text-xs text-gray-500 mt-1">
      In most cases, you'll be able to change your username back to{" "}
      <span className="font-semibold">{formData.username}</span> for another 14 days.{" "}
      <span className="text-blue-500 cursor-pointer">Learn more</span>
    </p>
  </div>
</div>


                    {/* Email */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <label className="col-span-1 md:col-span-3 text-sm font-medium md:flex md:justify-end md:pr-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="email@example.com"
                        className={`col-span-1 md:col-span-8 px-4 py-3 rounded-lg ${theme.inputBg} ${theme.text} border ${isDark ? "border-white" : "border-black"} outline-none transition-colors duration-300`}
                      />
                    </div>

                    {/* Secondary Email */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <label className="col-span-1 md:col-span-3 text-sm font-medium md:flex md:justify-end md:pr-2">
                        Secondary Email
                      </label>
                      <input
                        type="email"
                        value={formData.secondaryEmail}
                        onChange={(e) => handleInputChange("secondaryEmail", e.target.value)}
                        placeholder="secondary@example.com"
                        className={`col-span-1 md:col-span-8 px-4 py-3 rounded-lg ${theme.inputBg} ${theme.text} border ${isDark ? "border-white" : "border-black"} outline-none transition-colors duration-300`}
                      />
                    </div>

                    {/* Phone Input with Modal Country Selector */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <label className="col-span-1 md:col-span-3 text-sm font-medium md:flex md:justify-end md:pr-2">
                        Phone
                      </label>
                      <div className="col-span-1 md:col-span-8">
                        <div className={`flex items-stretch rounded-lg border ${isDark ? "border-white" : "border-black"} overflow-hidden`}>
                          {/* Country Flag Button */}
                          <button
                            type="button"
                            onClick={() => setIsCountryModalOpen(true)}
                            className={`${theme.inputBg} flex items-center justify-center hover:bg-opacity-80 transition-colors`}
                            style={{
                              borderRight: isDark
                                ? "1px solid rgba(255,255,255,0.2)"
                                : "1px solid rgba(0,0,0,0.1)",
                              minHeight: "52px",
                              width: "60px",
                            }}
                          >
                            <img
                              src={`https://flagcdn.com/h40/${selectedCountry.iso2.toLowerCase()}.png`}
                              alt={selectedCountry.name}
                              className="w-7 h-5 rounded-sm shadow-sm"
                            />
                          </button>

                          {/* Phone Number Input */}
                          <input
                            type="tel"
                            placeholder="8714552304"
                            value={formData.phone}
                            onChange={(e) => {
                              const cleanNumber = e.target.value.replace(/\D/g, '');
                              handleInputChange("phone", cleanNumber);
                            }}
                            className={`flex-1 px-4 py-3 ${theme.inputBg} ${theme.text} outline-none border-0`}
                            style={{ minHeight: "52px" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      <label className="col-span-1 md:col-span-3 text-sm font-medium md:flex md:justify-end md:pr-2 pt-3">
                        Address
                      </label>
                      <textarea
                        rows={4}
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        placeholder="Your address"
                        className={`col-span-1 md:col-span-8 px-4 py-3 rounded-lg ${theme.inputBg} ${theme.text} border ${isDark ? "border-white" : "border-black"} outline-none resize-none transition-colors duration-300`}
                      />
                    </div>

                    {/* Submit */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mt-6">
                      <div className="col-span-1 md:col-span-3" />
                      <div className="col-span-1 md:col-span-8 flex justify-end">
                        <button
                          onClick={handleSubmit}
                          disabled={isLoading}
                          className="px-12 py-2 text-white rounded-full font-medium transition-colors duration-300 disabled:opacity-50"
                          style={{
                            backgroundColor: "var(--SecondaryBtnColor, #5E5CE6)",
                            cursor: isLoading ? "not-allowed" : "pointer",
                          }}
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
      {alert && <Alert alert={alert} onClose={hideAlert} />}
      {/* Country Selection Modal */}
      {isCountryModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsCountryModalOpen(false)}
        >
          <div
            className={`${theme.bg} ${theme.text} rounded-2xl w-full max-w-md shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Select Country</h2>
                <button
                  onClick={() => setIsCountryModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Search Input */}
              <input
                type="text"
                placeholder="Search country..."
                value={countrySearchQuery}
                onChange={(e) => setCountrySearchQuery(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg ${theme.inputBg} ${theme.text} border-2 border-white/20 outline-none`}
                autoFocus
              />
            </div>

            {/* Countries List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <button
                    key={country.iso2}
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors ${
                      selectedCountry.iso2 === country.iso2 ? 'bg-white/5' : ''
                    }`}
                  >
                    <img
                      src={`https://flagcdn.com/h40/${country.iso2.toLowerCase()}.png`}
                      alt={country.name}
                      className="w-7 h-5 rounded-sm shadow-sm flex-shrink-0"
                    />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{country.name}</div>
                      <div className="text-sm opacity-60">+{country.dialCode}</div>
                    </div>
                    {selectedCountry.iso2 === country.iso2 && (
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-8 text-center opacity-50">
                  No countries found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default PersonalDetails;
