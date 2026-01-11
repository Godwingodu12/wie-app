"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { logoutSuccess, updateUser } from "@/features/auth/authSlice";
import { getProfile, logout, updateProfile } from "@/services/wieUserService";
import { getFollowStats } from "@/services/followService";
import FollowersModal from "@/components/profile/FollowersModal";
import FollowingModal from "@/components/profile/FollowingModal";
import ImageCropModal from "@/components/profile/ImageCropModal";
import {
  Plus,
  Menu,
  Share2,
  Loader2,
  LogOut,
  Settings,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import ProfileImage from "@/assets/profile/ProfileImage.jpg";
import SideBar from "@/components/home/SideBar";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/components/home/ThemeContext";
import ProfileTabs from "@/components/profile/ProfileTabs";

function ProfileContent() {
  const { isCollapsed, isMobile } = useSidebar();
  const { themeStyles } = useTheme();
  const { user, loading: authLoading } = useAuth(true);
  const dispatch = useDispatch();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [followStats, setFollowStats] = useState({
    followers: 0,
    following: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [tempProfilePicture, setTempProfilePicture] = useState<string | null>(
    null,
  );
  // Mock data for highlights
  const highlights = [
    {
      id: 1,
      label: "Travel",
      img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=150&h=150&fit=crop",
    },
    {
      id: 2,
      label: "Fooding",
      img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=150&h=150&fit=crop",
    },
    {
      id: 3,
      label: "Friends",
      img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&h=150&fit=crop",
    },
    {
      id: 4,
      label: "Architect",
      img: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=150&h=150&fit=crop",
    },
    {
      id: 5,
      label: "Car",
      img: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=150&h=150&fit=crop",
    },
    {
      id: 6,
      label: "Random",
      img: "https://images.unsplash.com/photo-1496449903678-68ddcb189a24?w=150&h=150&fit=crop",
    },
    {
      id: 7,
      label: "Mask",
      img: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&h=150&fit=crop",
    },
    {
      id: 8,
      label: "Films",
      img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=150&h=150&fit=crop",
    },
    {
      id: 9,
      label: "Me",
      img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    },
  ];
  const [activeTab, setActiveTab] = useState<
    "posts" | "reels" | "feed" | "tags"
  >("posts");
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const highlightsRef = useRef<HTMLDivElement>(null);

  const scrollHighlights = (direction: "left" | "right") => {
    if (highlightsRef.current) {
      const scrollAmount = 250; // Scroll by ~3 items
      highlightsRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch profile
        const profile = await getProfile();
        dispatch(updateUser(profile));

        // Fetch follow stats
        if (profile?.id) {
          setStatsLoading(true);
          const stats = await getFollowStats(profile.id);
          setFollowStats(stats);
        }
      } catch (err: any) {
        console.error("Failed to fetch user data:", err);

        // If token is invalid (401/403), logout
        if (
          err.message?.includes("401") ||
          err.message?.includes("403") ||
          err.message?.includes("token")
        ) {
          handleLogout();
        }
      } finally {
        setStatsLoading(false);
      }
    };

    if (user?.id) {
      fetchUserData();
    }
  }, [dispatch, user?.id]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      setIsMenuOpen(false);

      // Call logout API to invalidate token
      await logout();

      // Clear Redux state
      dispatch(logoutSuccess());
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if API fails, clear local state and redirect
      dispatch(logoutSuccess());
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const getProfileUrl = () => {
    if (typeof window === "undefined" || !displayUser) return "";
    const username = displayUser.username || displayUser.id;
    return `${window.location.origin}/profile/${username}`;
  };

  const handleShareProfile = async () => {
    const url = getProfileUrl();
    if (!url) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${displayUser?.name || "User"}'s Profile`,
          text: `Check out ${displayUser?.name || "this user"}'s profile on our app!`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        console.log("Profile URL copied to clipboard");
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      setUploadingImage(true);

      // Fetch the default profile image
      const response = await fetch(ProfileImage.src);
      const blob = await response.blob();

      // Create a File object
      const file = new File([blob], "default-profile.jpg", {
        type: "image/jpeg",
      });

      // Create FormData
      const formData = new FormData();
      formData.append("profile_picture", file);

      // Upload as if it were a user-selected image
      const updatedUser = await updateProfile(formData);

      dispatch(updateUser(updatedUser));
      setShowActionModal(false);
    } catch (error) {
      console.error("Failed to reset profile picture:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  const displayUser = user;
  if (authLoading || !displayUser) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ background: themeStyles.background, color: themeStyles.text }}>
        <Loader2 className="w-8 h-8 animate-spin text-[#8860D9]" />
      </div>
    );
  }
  return (
    <div
      className="h-screen overflow-y-auto scrollbar-hide font-sans selection:bg-[#5E5CE6] selection:text-white flex overflow-x-hidden"
      style={{
        backgroundColor: themeStyles.background,
        color: themeStyles.text
      }}
    >
      <SideBar />
      <main
          className={`transition-all duration-300 ease-in-out flex-1 w-full
            pb-24 px-0 pt-0
            sm:p-4 sm:pb-24
            md:p-6 md:pb-6
            lg:p-8 lg:pb-8
            lg:ml-[250px] xl:ml-[281px]`}
      >
        {/* Main Card Container */}
        <div
          className={`w-full relative overflow-hidden flex flex-col mx-auto
            rounded-none sm:rounded-[20px] md:rounded-[28px] lg:rounded-[32px]
            my-0 sm:my-2 md:my-4 lg:my-8
            min-h-screen sm:min-h-[calc(100vh-48px)] md:min-h-[calc(100vh-56px)] lg:min-h-[calc(100vh-64px)]
            border-none sm:border md:border
            shadow-none sm:shadow-lg md:shadow-xl lg:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]
            max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[700px] xl:max-w-[1200px]
          `}
          style={{
            background: themeStyles.cardBg,
            borderColor: themeStyles.border,
          }}
        >
          {/* Card Content Wrapper for Padding */}
          <div
            className={`p-4 pt-6 sm:p-5 md:p-8 lg:p-10 relative z-10 w-full flex flex-col`}
          >
            {/* Header Area inside Card */}
            <div className="flex justify-between items-center mb-4 sm:mb-6 md:mb-8 w-full">
              <div className="flex items-center gap-2 sm:gap-3">
                <h2 className="text-base sm:text-lg md:text-xl font-medium tracking-tight truncate max-w-[150px] sm:max-w-[200px] md:max-w-none" style={{ color: themeStyles.text }}>
                  @
                  {displayUser.username ||
                    displayUser.name?.toLowerCase().replace(/\s+/g, "")}
                </h2>
              </div>

              {/* Menu Toggle (3 dots) */}
              <div className="relative z-20">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  disabled={loggingOut}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-colors disabled:opacity-50"
                  style={{ background: themeStyles.pillBg, color: themeStyles.text }}
                >
                  {loggingOut ? (
                    <Loader2 size={18} className="animate-spin sm:w-5 sm:h-5" />
                  ) : (
                    <Menu size={18} className="sm:w-5 sm:h-5" />
                  )}
                </button>
                {isMenuOpen && (
                  <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsMenuOpen(false)}
                      />
                      <div
                        className="absolute right-0 top-full mt-2 w-[200px] sm:w-[286px] rounded-[20px] sm:rounded-[30px] shadow-2xl z-50 overflow-hidden py-2 sm:py-4 flex flex-col backdrop-blur-xl"
                        style={{
                          background: themeStyles.cardBg,
                          border: `1px solid ${themeStyles.border}`
                        }}
                      >
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            router.push("/settings");
                          }}
                          className="w-full flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium hover:opacity-80 transition-opacity text-left"
                          style={{ color: themeStyles.text }}
                        >
                        <Settings size={16} />
                        <span>Settings</span>
                      </button>
                      <div className="h-px my-1" style={{ background: themeStyles.divider }} />
                      <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-full flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 text-[#FF453A] text-xs sm:text-sm font-medium hover:opacity-80 transition-opacity text-left disabled:opacity-50"
                      >
                        {loggingOut ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <LogOut size={16} />
                        )}
                        <span>{loggingOut ? "Logging out..." : "Logout"}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Profile Info Section - Centered Layout */}
            <div className="flex flex-col items-center w-full px-0 sm:px-4 md:px-8 lg:px-10 mb-6 sm:mb-8">
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 mb-6 sm:mb-8 w-full max-w-lg">
                {/* Avatar */}
                <div className="relative">
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Validate file type
                        const allowedTypes = [
                          "image/jpeg",
                          "image/jpg",
                          "image/png",
                          "image/gif",
                          "image/webp",
                        ];
                        if (!allowedTypes.includes(file.type)) {
                          alert(
                            "Only JPG, JPEG, PNG, GIF, and WEBP images are allowed",
                          );
                          e.target.value = "";
                          return;
                        }

                        // Validate file size (5MB max)
                        if (file.size > 5 * 1024 * 1024) {
                          alert("Image size must be less than 5MB");
                          e.target.value = "";
                          return;
                        }

                        // Create preview URL and open crop modal
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setSelectedImage(reader.result as string);
                          setShowCropModal(true);
                        };
                        reader.readAsDataURL(file);

                        // Reset input
                        e.target.value = "";
                      }
                    }}
                  />

                  {/* Gradient Ring Wrapper */}
                  <div
                    className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-[124px] lg:h-[124px] rounded-full overflow-hidden border-[3px] border-[#1C1C1E] relative transition-all duration-300 shadow-xl -mt-4 sm:-mt-6`}
                  >
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                      </div>
                    )}
                    {tempProfilePicture || displayUser.profile_picture ? (
                      <Image
                        src={tempProfilePicture || displayUser.profile_picture!}
                        alt="Profile"
                        fill
                        className="object-cover"
                        key={tempProfilePicture || displayUser.profile_picture} // Force re-render on change
                      />
                    ) : (
                      <Image
                        src={ProfileImage}
                        alt="Default Profile"
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>

                  {/* Small Plus Icon on Avatar - Now opens modal */}
                  <button
                    onClick={() => setShowActionModal(true)}
                    className={`absolute bottom-1 right-1 bg-[#2C2C2E] p-1.5 rounded-full border-[2.5px] border-white z-10 cursor-pointer hover:bg-[#3C3C3E] transition-colors ${
                      uploadingImage ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {uploadingImage ? (
                      <Loader2 size={14} className="text-white animate-spin" />
                    ) : (
                      <Plus size={14} className="text-white" />
                    )}
                  </button>

                  {/* Profile Action Modal - Positioned Relative to Avatar */}
                  {showActionModal && (
                    <>
                      <div
                        className="fixed inset-0 z-[60]"
                        onClick={() => setShowActionModal(false)}
                      />
                      <div
                        className="absolute z-[70] flex flex-col justify-start text-white overflow-hidden"
                        style={{
                          width: "286px",
                          top: "100%",
                          marginTop: "16px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          borderRadius: "30px",
                          background: themeStyles.cardBg,
                          backdropFilter: "blur(80px)",
                          border: `1px solid ${themeStyles.border}`,
                          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                        }}
                      >
                        {/* Close Button */}
                        <button
                          onClick={() => setShowActionModal(false)}
                          className="absolute top-5 right-5 text-white/50 hover:text-white transition-colors"
                        >
                          <X size={20} />
                        </button>

                        {/* Menu Items */}
                        <div className="flex flex-col gap-4 p-8 pt-10">
                          <button className="text-left text-[15px] font-medium transition-colors hover:opacity-80" style={{ color: themeStyles.text }}>
                            Add story
                          </button>
                          <button className="text-left text-[15px] font-medium transition-colors hover:opacity-80" style={{ color: themeStyles.text }}>
                            Add post
                          </button>
                          <button
                            onClick={() => {
                              document.getElementById("avatar-upload")?.click();
                              setShowActionModal(false);
                            }}
                            className="text-left text-[15px] font-medium transition-colors hover:opacity-80" style={{ color: themeStyles.text }}
                          >
                            Change profile picture
                          </button>
                          <button
                            onClick={handleRemoveProfilePicture}
                            className="text-left text-[15px] font-medium transition-colors hover:opacity-80" style={{ color: themeStyles.text }}
                          >
                            Remove profile picture
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {/* Name & Handle - Strictly Centered */}
                <div className="flex flex-col items-center text-center gap-0.5 sm:gap-1">
                  <div className="flex items-center justify-center gap-1">
                    <h1
                      className={`text-lg sm:text-xl md:text-2xl lg:text-[26px] font-bold tracking-tight`}
                      style={{ color: themeStyles.text }}
                    >
                      {displayUser.name || displayUser.username || "User"}
                    </h1>
                  </div>
                  <p className="text-[#B5B5B5] text-xs sm:text-sm md:text-base font-medium">
                    @
                    {displayUser.username ||
                      displayUser.name?.toLowerCase().replace(/\s+/g, "")}
                  </p>
                </div>

                {/* Bio - Strictly Centered */}
                <div className="text-sm text-center leading-relaxed px-4 max-w-md" style={{ color: themeStyles.textSecondary }}>
                  <p>{displayUser.bio || "No bio yet"}</p>
                </div>
              </div>
              {/* Stats Row - WITH MODAL TRIGGERS */}
              <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-8 lg:gap-10 mb-6 sm:mb-8 w-full flex-wrap">
                <button
                  className="text-center hover:opacity-80 transition-opacity"
                  onClick={() => setActiveTab("posts")}
                >
                  <div
                    className={`text-base sm:text-lg md:text-xl lg:text-[22px] font-bold leading-none`}
                    style={{ color: themeStyles.text }}
                  >
                    {displayUser.posts_count || 0}
                  </div>
                  <div className="text-xs mt-1" style={{ color: themeStyles.textSecondary }}>Posts</div>
                </button>
                <div className="h-10 w-[0.5px] border-l-[0.5px]" style={{ borderColor: themeStyles.divider }}></div>
                <button
                  className="text-center hover:opacity-80 transition-opacity"
                  onClick={() => setShowFollowersModal(true)}
                >
                  {statsLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#8860D9] mx-auto" />
                  ) : (
                  <div
                    className={`text-base sm:text-lg md:text-xl lg:text-[22px] font-bold leading-none`}
                    style={{ color: themeStyles.text }}
                  >
                    {formatNumber(followStats.followers)}
                  </div>
                  )}
                  <div className="text-[10px] sm:text-xs mt-0.5 sm:mt-1" style={{ color: themeStyles.textSecondary }}>Followers</div>
                </button>

                <div className="h-10 w-[0.5px] border-l-[0.5px]" style={{ borderColor: themeStyles.divider }}></div>

                <button
                  className="text-center hover:opacity-80 transition-opacity"
                  onClick={() => setShowFollowingModal(true)} // ✅ OPEN MODAL
                >
                  {statsLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#8860D9] mx-auto" />
                  ) : (
                    <div
                      className={`text-base sm:text-lg md:text-xl lg:text-[22px] font-bold leading-none`}
                      style={{ color: themeStyles.text }}
                    >
                      {formatNumber(followStats.following)}
                    </div>
                  )}
                  <div className="text-[10px] sm:text-xs mt-0.5 sm:mt-1" style={{ color: themeStyles.textSecondary }}>Following</div>
                </button>
              </div>
              {/* Action Buttons - Centered - Flex Wrap for better mobile flow */}
              <div
                className={`flex flex-wrap justify-center gap-2 sm:gap-2.5 md:gap-3 w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl px-0 md:px-2 mb-6 sm:mb-8`}
              >
                {/* Edit Profile */}
                <button
                  onClick={() => router.push("/profile/edit-profile")}
                  className="group relative flex items-center justify-center gap-2 transition-all text-white overflow-hidden flex-1 min-w-[110px] sm:min-w-[130px] max-w-[200px] hover:scale-105"
                  style={{
                    height: "46px",
                    borderRadius: "100px",
                  }}
                >
                  {/* Gradient Border & Background */}
                  <div
                    className="absolute inset-0 rounded-[100px] p-[0.5px]"
                    style={{
                      background: themeStyles.pillBg
                    }}
                  >
                    <div
                      className="w-full h-full rounded-[100px]"
                      style={{
                        background: themeStyles.pillBg
                      }}
                    />
                  </div>
                  <div className="relative z-10 flex items-center gap-2">
                    <Pencil size={16} className="sm:w-[18px] sm:h-[18px]" style={{ color: themeStyles.text }} />
                    <span className="text-[12px] sm:text-[13px] md:text-sm font-medium whitespace-nowrap" style={{ color: themeStyles.text }}>
                      Edit Profile
                    </span>
                  </div>
                </button>

                {/* Share */}
                <button
                  onClick={handleShareProfile}
                  className="group relative flex items-center justify-center gap-2 transition-all text-white overflow-hidden flex-1 min-w-[110px] sm:min-w-[130px] max-w-[200px] hover:scale-105"
                  style={{
                    height: "46px",
                    borderRadius: "100px",
                  }}
                >
                  {/* Gradient Border & Background */}
                  <div
                    className="absolute inset-0 rounded-[100px] p-[0.5px]"
                    style={{
                      background: themeStyles.pillBg
                    }}
                  >
                    <div
                      className="w-full h-full rounded-[100px]"
                      style={{
                        background: themeStyles.pillBg
                      }}
                    />
                  </div>
                  <div className="relative z-10 flex items-center gap-2">
                    <Share2 size={16} className="sm:w-[18px] sm:h-[18px]" style={{ color: themeStyles.text }} />
                    <span className="text-[12px] sm:text-[13px] md:text-sm font-medium whitespace-nowrap" style={{ color: themeStyles.text }}>
                      Share
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Highlights Section with Arrows */}
            <div className="w-full flex justify-center items-center mb-8 md:mb-10 relative">
              {/* Left Arrow */}
              <button
                onClick={() => scrollHighlights("left")}
                className="absolute left-0 z-10 w-8 h-8 sm:w-9 sm:h-9 hidden lg:flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              >
                <ChevronLeft size={18} />
              </button>

              {/* Scrollable Container */}
              <div
                ref={highlightsRef}
                className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 w-full max-w-[280px] sm:max-w-lg md:max-w-4xl scrollbar-hide px-8 sm:px-4 md:px-0"
              >
                {/* Add Highlight */}
                <div className="flex flex-col items-center gap-2 min-w-[70px] cursor-pointer group flex-shrink-0">
                  <div
                    className="flex items-center justify-center transition-all group-hover:scale-105 w-[70px] h-[100px] rounded-xl border border-white/50 bg-[#3838380D] backdrop-blur-[4px]"
                  >
                    <Plus size={24} className="text-gray-400" />
                  </div>
                  <span className="text-xs text-gray-400">Add</span>
                </div>

                {/* Highlight Items */}
                {highlights.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col items-center gap-2 min-w-[70px] cursor-pointer group flex-shrink-0"
                  >
                    <div
                      className="relative overflow-hidden backdrop-blur-[4px] transition-all group-hover:scale-105 w-[70px] h-[100px] rounded-xl border border-white/50 bg-[#3838380D]"
                    >
                      <img
                        src={item.img}
                        alt={item.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs text-gray-400">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => scrollHighlights("right")}
                className="absolute right-0 z-10 w-8 h-8 sm:w-9 sm:h-9 hidden lg:flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            {/* Profile Tabs - Posts, Reels, Feed, Tags */}
            {displayUser.id && (
              <div className="w-full">
                <ProfileTabs
                  userId={displayUser.id}
                  isMobile={isMobile}
                  isOwnProfile={true}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={displayUser.id}
        userName={displayUser.name ?? undefined}
        isOwnProfile={true}
        onCountChange={(type, change) => {
          if (type === "following") {
            setFollowStats((prev) => ({
              ...prev,
              following: Math.max(0, prev.following + change),
            }));
          }
        }}
      />
      <FollowingModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        userId={displayUser.id}
        userName={displayUser.name ?? undefined}
        isOwnProfile={true}
        onCountChange={(change) => {
          setFollowStats((prev) => ({
            ...prev,
            following: Math.max(0, prev.following + change),
          }));
        }}
      />

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={showCropModal}
        onClose={() => {
          setShowCropModal(false);
          setSelectedImage(null);
        }}
        imageSrc={selectedImage || ""}
        uploading={uploadingImage}
        onCropComplete={async (croppedBlob) => {
          try {
            setUploadingImage(true);

            // Create FormData with cropped image
            const formData = new FormData();
            const croppedFile = new File([croppedBlob], "profile-picture.jpg", {
              type: "image/jpeg",
            });
            formData.append("profile_picture", croppedFile);

            // Upload the image
            const updatedUser = await updateProfile(formData);

            // Create temporary preview URL for immediate display
            const previewUrl = URL.createObjectURL(croppedBlob);
            setTempProfilePicture(previewUrl);

            // Update Redux state with server response
            dispatch(updateUser(updatedUser));

            // Close modal
            setShowCropModal(false);
            setSelectedImage(null);

            // Clear temp preview after a delay to allow server image to load
            setTimeout(() => {
              setTempProfilePicture(null);
              URL.revokeObjectURL(previewUrl);
            }, 2000);
          } catch (error: any) {
            console.error("Failed to update profile picture:", error);
            alert(
              error.response?.data?.message ||
                "Failed to update profile picture",
            );
          } finally {
            setUploadingImage(false);
          }
        }}
      />
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen" style={{ background: "#050505" }}>
          <Loader2 className="w-8 h-8 animate-spin text-[#8860D9]" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
export const dynamic = "force-dynamic";
