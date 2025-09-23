import React, { useState, useEffect } from "react";
import { getMe } from "../../services/userService.js";
import { useNavigate } from 'react-router-dom';


import SideBar from "../../components/HomePage/SideBar.jsx";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";

import WieLogo from "../../assets/HomePage/WieLogo.svg";
import NotificationIcon from "../../assets/HomePage/NotificationIcon.svg";

import PersonalIcon from "../../assets/Settings/PersonalIcon.svg";
import PasswordIcon from "../../assets/Settings/PasswordIcon.svg";
import EventIcon from "../../assets/Settings/EventIcon.svg";
import EditIcon from "../../assets/Settings/EditIcon.svg";
import NotificationSettingsIcon from "../../assets/Settings/NotificationSettingsIcon.svg";
import SyncIcon from "../../assets/Settings/SyncIcon.svg";
import NetworksIcon from "../../assets/Settings/NetworksIcon.svg";
import GroupIcon from "../../assets/Settings/GroupIcon.svg";
import ActiveIcon from "../../assets/Settings/ActiveIcon.svg";
import LanguagesIcon from "../../assets/Settings/LanguagesIcon.svg";
import BackArrowIcon from "../../assets/Settings/BackArrowIcon.svg";
import CameraIcon from "../../assets/Settings/CameraIcon.svg";
import WhatsappIcon from "../../assets/Settings/WhatsAppIcon.svg";
import InstagramIcon from "../../assets/Settings/InstagramIcon.svg";
import FacebookIcon from "../../assets/Settings/FacebookIcon.svg";
import LinkedInIcon from "../../assets/Settings/LinkedInIcon.svg";
import XIcon from "../../assets/Settings/XIcon.svg";

const HEADER_HEIGHT = 72;

const EditProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [formData, setFormData] = useState({
    website: "",
    bio: "",
    gender: "Prefer not to say",
    showBadge: true,
    showSuggestion: true
  });

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
        const res = await getMe();
        setUser(res.data);
        
        // Populate form with user data
        setFormData({
          website: res.data.website || "",
          bio: res.data.bio || "",
          gender: res.data.gender || "Prefer not to say",
          showBadge: res.data.showBadge !== undefined ? res.data.showBadge : true,
          showSuggestion: res.data.showSuggestion !== undefined ? res.data.showSuggestion : true
        });
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // Add your submit logic here
    console.log("Form data to submit:", formData);
  };

  const theme = isDark
    ? {
        bg: "bg-[#212426]",
        text: "text-white",
        notificationShadow: "inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)",
        cardShadow: "inset 8px 8px 16px rgba(0,0,0,0.4), inset -8px -8px 16px rgba(60,60,60,0.1)",
        inputShadow: "inset 4px 4px 8px rgba(0,0,0,0.3), inset -4px -4px 8px rgba(60,60,60,0.1)",
        buttonShadow: "4px 4px 8px rgba(0,0,0,0.3), -4px -4px 8px rgba(60,60,60,0.1)",
        sidebarBg: "bg-[#1a1c1e]",
        inputBg: "bg-[#2a2d30]",
        borderColor: "border-[#3a3c40]",
        separatorColor: "rgba(255,255,255,0.3)"
      }
    : {
        bg: "bg-[#f0f2f5]",
        text: "text-gray-900",
        notificationShadow: "inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)",
        cardShadow: "inset 8px 8px 16px rgba(0,0,0,0.1), inset -8px -8px 16px rgba(255,255,255,0.8)",
        inputShadow: "inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.8)",
        buttonShadow: "4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.8)",
        sidebarBg: "bg-gray-50",
        inputBg: "bg-gray-50",
        borderColor: "border-gray-200",
        separatorColor: "rgba(255,255,255,0.3)"
      };

  const sidebarItems = [
    {
      title: "Wie account centre",
      subtitle: "Your space, your relationships, how your account works for you.",
      items: [
        { icon: PersonalIcon, text: "Personal details", active: false },
        { icon: PasswordIcon, text: "Password & security", active: false },
        { icon: EventIcon, text: "Event history", active: false }
      ]
    },
    {
      title: "How to use Wie centre",
      items: [
        { icon: EditIcon, text: "Edit profile", active: true }, // This is active
        { icon: NotificationSettingsIcon, text: "Notification", active: false }
      ]
    },
    {
      title: "For professional use",
      items: [
        { icon: SyncIcon, text: "Sync account", active: false },
        { icon: NetworksIcon, text: "Networks", active: false },
        { icon: GroupIcon, text: "Group settings", active: false }
      ]
    },
    {
      title: "What you see",
      items: [
        { icon: ActiveIcon, text: "Active devices", active: false },
        { icon: LanguagesIcon, text: "Languages and region", active: false }
      ]
    }
  ];

  return (
    <div className={`${theme.bg} ${theme.text} min-h-screen flex overflow-hidden transition-colors duration-300`}>
      {/* Original Sidebar */}
      <div className={`hidden md:flex flex-col flex-shrink-0 ${theme.bg} transition-colors duration-300`}>
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
          <div className="hidden md:flex items-center gap-4 w-full">
            <div className="flex-1 min-w-0">
              <SearchBar
                theme={theme}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  style={{ boxShadow: theme.notificationShadow }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${theme.bg} transition-colors duration-300`}
                >
                  <img
                    src={NotificationIcon}
                    alt="Notification"
                    className={`w-4 h-4 ${isDark ? 'filter brightness-0 invert' : 'filter brightness-0'}`}
                  />
                </div>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                  12
                </span>
              </div>
              <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
            </div>
          </div>
        </header>

        {/* Main Content with Settings Sidebar and Edit Profile */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Single Neumorphic Container */}
            <div 
              className={`${theme.bg} rounded-[2.5rem] transition-colors duration-300 flex overflow-hidden`}
              style={{ boxShadow: theme.cardShadow }}
            >
              {/* Settings Sidebar */}
              <div className=" relative w-80 p-6 ">
                  <div className="absolute right-0 top-0 h-full w-[0.1px] bg-gradient-to-b from-transparent via-white/30 to-transparent pointer-events-none" />

                <div className="flex items-center gap-2 mb-8">
  <button
    className="p-3 rounded-full transition-all duration-300"
                     style={{ boxShadow: theme.notificationShadow }} 

  >
    <img
      src={BackArrowIcon}
      alt="Back"
                                onClick={() => navigate('/Profile')}

      className={`w-3 h-3  ${isDark ? "filter brightness-0 invert" : "filter brightness-0"}`}
    />
  </button>
  <h2 className="text-lg font-semibold">Settings</h2>
</div>


                <div className="space-y-8">
                  {sidebarItems.map((section, sectionIndex) => (
                    <div key={sectionIndex}>
                      <h3 className="font-semibold text-sm mb-2">{section.title}</h3>
                      {section.subtitle && (
                        <p className="text-xs text-gray-500 mb-4">{section.subtitle}</p>
                      )}
                      <div className="space-y-1">
                        {section.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                              item.active 
                                ? 'text-blue-700 dark:text-blue-300' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 opacity-60'
                            }`}
                            style={item.active ? {
                              boxShadow: isDark 
                                ? '4px 4px 8px rgba(0,0,0,0.3), -4px -4px 8px rgba(60,60,60,0.1)'
                                : '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.8)',
                              backgroundColor: isDark ? '#2a2d30' : '#f8f9fa'
                            } : {}}
                          >
                            <img 
                              src={item.icon} 
                              alt={`${item.text} Icon`} 
                              className={`w-5 h-5 ${
                                isDark 
                                  ? item.active 
                                    ? 'filter brightness-0 invert opacity-100' 
                                    : 'filter brightness-0 invert opacity-60'
                                  : item.active
                                    ? 'filter brightness-0 opacity-100'
                                    : 'filter brightness-0 opacity-60'
                              }`} 
                            />
                            <span className="text-sm">{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              

              {/* Edit Profile Form */}
              <div className="flex-1 p-8">
                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-2xl font-bold mb-2">Edit Profile</h1>
                  <p className="text-gray-500 text-sm">
                    Make it yours! Edit your name, bio, photo, and more to reflect the real you
                  </p>
                </div>

                {/* Profile Picture Section */}
                <div className="flex items-center justify-center mb-8">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                          <span className="text-white text-2xl font-bold">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#1E1242] rounded-full flex items-center justify-center text-white border-2 border-white">
                      <img src={CameraIcon} alt="Edit" className="w-4 h-4"/>
                    </button>
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h3 className="font-semibold">{user?.name || 'Loading...'}</h3>
                  <p className="text-sm text-gray-500">@{user?.username || 'loading'}</p>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Website */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                      <label className="col-span-3 text-sm font-medium flex justify-end">Website</label>
                      <input
                        type="text"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder=" "
                        className={`col-span-9 px-4 py-3 rounded-lg ${theme.inputBg} ${theme.text} transition-colors duration-300 border-2 border-white opacity-35 outline-none`}
                        style={{ boxShadow: theme.inputShadow }}
                      />
                    </div>


                {/* Bio */}
<div className="grid grid-cols-12 gap-4">
  <label className="col-span-3 text-sm font-medium flex justify-end">Bio</label>
  <div className="col-span-9">
    <textarea
      value={formData.bio}
      onChange={(e) => handleInputChange('bio', e.target.value)}
      rows={4}
      maxLength={150}
      placeholder=""
      className={`w-full px-4 py-3 rounded-lg ${theme.inputBg} ${theme.text} transition-colors duration-300 border-2 border-white opacity-35 outline-none resize-none`}
      style={{ boxShadow: theme.inputShadow }}
    />
    <div className="text-left text-xs text-gray-500 mt-1">
      {formData.bio.length}/150
    </div>

   {/* Show wie account badge */}
<div className="flex items-center gap-3 mt-4">
  <span className="text-sm font-medium">Show wie account badge</span>

  <div
    className="relative w-12 h-6 rounded-full cursor-pointer transition-all duration-300 ml-3"
    style={{
      backgroundColor: "#212426",
      boxShadow: `
        inset 3px 3px 6px rgba(0, 0, 0, 0.7),
        inset -3px -3px 6px rgba(255, 255, 255, 0.12)
      `,
    }}
    onClick={() => handleInputChange("showBadge", !formData.showBadge)}
  >
    <div
      className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-300 ${
        formData.showBadge ? "translate-x-6" : "translate-x-0.5"
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




                  {/* Gender */}
                  <div className="grid grid-cols-12 gap-4 items-center py-3">
                    <label className="col-span-3 text-sm font-medium flex justify-end">Gender</label>
                    <div className="col-span-9 relative">
                      <select
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg ${theme.inputBg} ${theme.text} transition-colors duration-300 border-2 border-white opacity-35 outline-none appearance-none cursor-pointer`}
                        style={{ boxShadow: theme.inputShadow }}
                      >
                        <option value="Prefer not to say">Prefer not to say</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

{/* Show wie account suggestion on profile */}
<div className="grid grid-cols-12 gap-4 items-center mt-4">
  <label className="col-span-3" /> {/* Empty label for alignment */}
  <div className="col-span-9">
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium">
        Show wie account suggestion on profile
      </span>

      {/* Neumorphic Toggle */}
      <div
        className="relative w-12 h-6 rounded-full cursor-pointer transition-all duration-300"
        style={{
          backgroundColor: "#212426",
          boxShadow: `
            inset 3px 3px 6px rgba(0, 0, 0, 0.7),
            inset -3px -3px 6px rgba(255, 255, 255, 0.12)
          `,
        }}
        onClick={() => handleInputChange("showSuggestion", !formData.showSuggestion)}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-300 ${
            formData.showSuggestion ? "translate-x-6" : "translate-x-0.5"
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


                 {/* Connect accounts with Submit button on same line */}
<div className="grid grid-cols-12 gap-4 items-center">
  {/* Empty label space to align with textbox start */}
  <div className="col-span-3" /> 

  {/* Content starts where textbox starts */}
  <div className="col-span-9 flex items-center justify-between">
    {/* Label + Icons */}
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium">Connect accounts</span>
      <div className="flex gap-3">
        {[
          { name: 'whatsapp', icon: <img src={WhatsappIcon} alt="WhatsApp" className="w-5 h-5" /> },
          { name: 'instagram', icon: <img src={InstagramIcon} alt="Instagram" className="w-6 h-6" />},
          { name: 'X', icon:  <img src={XIcon} alt="X" className="w-4 h-4" />},
          { name: 'facebook', icon:  <img src={FacebookIcon} alt="FaceBook" className="w-6 h-6" /> },
          { name: 'linkedin', icon:  <img src={LinkedInIcon} alt="LinkedIn" className="w-6 h-6" /> }
        ].map((social) => (
          <div
            key={social.name}
            className={`w-10 h-10  flex items-center justify-center cursor-pointer transition-colors duration-300 hover:bg-opacity-80`}      
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
      className={`px-12 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors duration-300`}
      style={{ boxShadow: theme.buttonShadow }}
    >
      Submit
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
  );
};

export default EditProfile;