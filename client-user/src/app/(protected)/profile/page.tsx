"use client";

import { useEffect, useState, Suspense } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { logoutSuccess, updateUser } from "@/features/auth/authSlice";
import { getProfile } from "@/services/wieUserService";
import { getFollowStats } from "@/services/followService";
import {
  Plus,
  Menu,
  MoreHorizontal,
  Pencil,
  Share2,
  Loader2,
  LogOut,
  Settings
} from 'lucide-react';

import cameraImg from "@/assets/profile/camera.png";
import ProfileImage from "@/assets/profile/ProfileImage.jpg";
import SideBar from "@/components/home/SideBar";
import { useSidebar } from "@/context/SidebarContext";

function ProfileContent() {
  const { isCollapsed, isMobile } = useSidebar();
  const { user, loading: authLoading } = useAuth(true);
  const dispatch = useDispatch();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Mock data for highlights
  const highlights = [
    { id: 1, label: 'Travel', img: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=150&h=150&fit=crop' },
    { id: 2, label: 'Fooding', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=150&h=150&fit=crop' },
    { id: 3, label: 'Friends', img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&h=150&fit=crop' },
    { id: 4, label: 'Architect', img: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=150&h=150&fit=crop' },
    { id: 5, label: 'Car', img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=150&h=150&fit=crop' },
    { id: 6, label: 'Random', img: 'https://images.unsplash.com/photo-1496449903678-68ddcb189a24?w=150&h=150&fit=crop' },
    { id: 7, label: 'Mask', img: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&h=150&fit=crop' },
    { id: 8, label: 'Films', img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=150&h=150&fit=crop' },
    { id: 9, label: 'Me', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop' },
  ];

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
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    if (user?.id) {
      fetchUserData();
    }
  }, [dispatch, user?.id]);

  const handleLogout = () => {
    dispatch(logoutSuccess());
    router.push("/login");
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const displayUser = user;
  const marginLeft = isMobile ? "0px" : isCollapsed ? "120px" : "281px";

  if (authLoading || !displayUser) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#050505] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#8860D9]" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-white font-sans selection:bg-[#5E5CE6] selection:text-white flex overflow-x-hidden"
      style={{
        backgroundColor: '#0C1014'
      }}
    >
      <SideBar />

      <main
        className={`transition-all duration-300 ease-in-out flex-grow ${
          isMobile ? "pb-24 px-0 pt-0" : "p-8"
        }`}
        style={{ marginLeft: isMobile ? '0px' : marginLeft }}
      >
        {/* Main Card Container */}
        <div
          className={`w-full relative overflow-hidden flex flex-col ${isMobile ? 'rounded-none min-h-screen' : 'md:rounded-[32px] rounded-[24px]'}`}
          style={{
            maxWidth: '1440px',
            minHeight: isMobile ? '100vh' : '85vh',
            background: 'linear-gradient(180deg, rgba(55, 55, 55, 0.2) 0%, rgba(38, 38, 38, 0.2) 50%, rgba(28, 28, 28, 0.2) 100%)',
            border: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: isMobile ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Card Content Wrapper for Padding */}
          <div className={`${isMobile ? 'p-4 pt-8' : 'p-5 md:p-10'} relative z-10`}>

            {/* Header Area inside Card */}
            <div className="flex justify-between items-start mb-6 md:mb-8">
              <div className="flex flex-col">
                <h2 className="text-xl font-medium text-white/90 tracking-tight">
                  @{displayUser.username || displayUser.name?.toLowerCase().replace(/\s+/g, '')}
                </h2>
              </div>

              {/* Menu Toggle (3 bars) */}
              <div className="relative z-20">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                >
                  <Menu size={20} />
                </button>
                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#1C1C1E] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          router.push('/settings');
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors text-left"
                      >
                        <Settings size={16} />
                        <span>Settings</span>
                      </button>
                      <div className="h-px bg-white/10 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-3 text-[#FF453A] text-sm font-medium hover:bg-white/5 transition-colors text-left"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Profile Info Section - Centered Layout */}
            <div className="flex flex-col items-center w-full px-4 md:px-10 mb-8">

              <div className="flex flex-col items-center gap-6 mb-8 w-full max-w-lg">
                {/* Avatar */}
                <div className="relative">
                  {/* Gradient Ring Wrapper */}
                  <div
                    className="p-[3px] rounded-full shadow-xl -mt-6"
                    style={{
                      background: 'linear-gradient(147.67deg, #2979FF 13.16%, #6B9CF0 54.09%, #9DC1FF 100.03%)'
                    }}
                  >
                    <div className={`${isMobile ? 'w-24 h-24' : 'w-[124px] h-[124px]'} rounded-full overflow-hidden border-[3px] border-[#1C1C1E] relative transition-all duration-300`}>
                      {displayUser.profile_picture ? (
                        <Image
                          src={displayUser.profile_picture}
                          alt="Profile"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] flex items-center justify-center">
                          <span className="text-4xl font-bold text-white">
                            {displayUser.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Small Plus Icon on Avatar */}
                  <div className="absolute bottom-1 right-1 bg-[#2C2C2E] p-1.5 rounded-full border-[3px] border-[#0a0a0a] z-10 cursor-pointer hover:bg-[#3C3C3E] transition-colors">
                    <Plus size={14} className="text-white" />
                  </div>
                </div>

                {/* Name & Handle - Strictly Centered */}
                <div className="flex flex-col items-center text-center gap-1">
                  <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white tracking-tight`}>
                    {displayUser.name || displayUser.username || 'User'}
                  </h1>
                  <p className="text-[#B5B5B5] text-sm font-medium">
                    @{displayUser.username || displayUser.name?.toLowerCase().replace(/\s+/g, '')}
                  </p>
                  {displayUser.is_verified && (
                    <div className="mt-1 bg-blue-500 rounded-full px-2 py-0.5 flex items-center gap-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-white font-medium">Verified</span>
                    </div>
                  )}
                </div>

                {/* Bio - Strictly Centered */}
                <div className="text-sm text-gray-400 text-center leading-relaxed px-4">
                  <p>{displayUser.bio || "No bio yet"}</p>
                </div>
              </div>

              {/* Stats Row - Centered with Loading State */}
              <div className="flex items-center justify-center gap-6 md:gap-10 mb-8 w-full">
                <button
                  className="text-center hover:opacity-80 transition-opacity"
                  onClick={() => {
                    // Navigate to posts tab or filter
                  }}
                >
                  <div className={`text-[18px] md:text-[20px] font-bold text-white leading-none`}>
                    {displayUser.posts_count || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Posts</div>
                </button>

                <div className="h-10 w-[0.5px] border-l-[0.5px] border-[#B5B5B5]"></div>

                <button
                  className="text-center hover:opacity-80 transition-opacity"
                  onClick={() => router.push('/profile/followers')}
                >
                  {statsLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#8860D9] mx-auto" />
                  ) : (
                    <div className={`text-[18px] md:text-[20px] font-bold text-white leading-none`}>
                      {formatNumber(followStats.followers)}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">Followers</div>
                </button>

                <div className="h-10 w-[0.5px] border-l-[0.5px] border-[#B5B5B5]"></div>

                <button
                  className="text-center hover:opacity-80 transition-opacity"
                  onClick={() => router.push('/profile/following')}
                >
                  {statsLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#8860D9] mx-auto" />
                  ) : (
                    <div className={`text-[18px] md:text-[20px] font-bold text-white leading-none`}>
                      {formatNumber(followStats.following)}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">Following</div>
                </button>
              </div>

              {/* Action Buttons - Centered - Flex Wrap for better mobile flow */}
              <div className={`flex flex-wrap justify-center gap-2 md:gap-3 w-full max-w-2xl px-0 md:px-2`}>
                {/* Edit Profile */}
                <button
                  onClick={() => router.push('/profile/edit-profile')}
                  className="group relative flex items-center justify-center gap-2 transition-all text-white overflow-hidden flex-1 min-w-[130px] max-w-[162px] hover:scale-105"
                  style={{
                    height: '46px',
                    borderRadius: '100px',
                  }}
                >
                  {/* Gradient Border & Background */}
                  <div
                    className="absolute inset-0 rounded-[100px] p-[0.5px]"
                    style={{
                      background: 'linear-gradient(270deg, rgba(32, 32, 32, 0.2) -8.43%, rgba(96, 96, 96, 0.2) 100%)'
                    }}
                  >
                    <div
                      className="w-full h-full rounded-[100px]"
                      style={{
                        background: 'linear-gradient(270deg, rgba(32, 32, 32, 0.2) -8.43%, rgba(96, 96, 96, 0.2) 100%)'
                      }}
                    />
                  </div>
                  <div className="relative z-10 flex items-center gap-2">
                    <Pencil size={isMobile ? 14 : 16} />
                    <span className="text-[12px] md:text-sm font-medium whitespace-nowrap">Edit Profile</span>
                  </div>
                </button>

                {/* Add Posts */}
                <button
                  className="group relative flex items-center justify-center gap-2 transition-all text-white overflow-hidden flex-1 min-w-[130px] max-w-[162px] hover:scale-105"
                  style={{
                    height: '46px',
                    borderRadius: '100px',
                  }}
                >
                  {/* Gradient Border & Background */}
                  <div
                    className="absolute inset-0 rounded-[100px] p-[0.5px]"
                    style={{
                      background: 'linear-gradient(270deg, rgba(32, 32, 32, 0.2) -8.43%, rgba(96, 96, 96, 0.2) 100%)'
                    }}
                  >
                    <div
                      className="w-full h-full rounded-[100px]"
                      style={{
                        background: 'linear-gradient(270deg, rgba(32, 32, 32, 0.2) -8.43%, rgba(96, 96, 96, 0.2) 100%)'
                      }}
                    />
                  </div>
                  <div className="relative z-10 flex items-center gap-2">
                    <Plus size={isMobile ? 16 : 18} />
                    <span className="text-[12px] md:text-sm font-medium whitespace-nowrap">Add Posts</span>
                  </div>
                </button>

                {/* Share */}
                <button
                  className="group relative flex items-center justify-center gap-2 transition-all text-white overflow-hidden flex-1 min-w-[130px] max-w-[162px] hover:scale-105"
                  style={{
                    height: '46px',
                    borderRadius: '100px',
                  }}
                >
                  {/* Gradient Border & Background */}
                  <div
                    className="absolute inset-0 rounded-[100px] p-[0.5px]"
                    style={{
                      background: 'linear-gradient(270deg, rgba(32, 32, 32, 0.2) -8.43%, rgba(96, 96, 96, 0.2) 100%)'
                    }}
                  >
                    <div
                      className="w-full h-full rounded-[100px]"
                      style={{
                        background: 'linear-gradient(270deg, rgba(32, 32, 32, 0.2) -8.43%, rgba(96, 96, 96, 0.2) 100%)'
                      }}
                    />
                  </div>
                  <div className="relative z-10 flex items-center gap-2">
                    <Share2 size={isMobile ? 16 : 18} />
                    <span className="text-[12px] md:text-sm font-medium whitespace-nowrap">Share</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Highlights Section */}
            <div className="w-full flex justify-center mb-8 md:mb-10 px-0">
              <div className="flex justify-start md:justify-center gap-4 overflow-x-auto pb-4 w-full max-w-4xl scrollbar-hide px-2">
                {/* Add Highlight */}
                <div className="flex flex-col items-center gap-2 min-w-[70px] cursor-pointer group flex-shrink-0">
                  <div
                    className="flex items-center justify-center transition-all group-hover:scale-105"
                    style={{
                      width: '70px',
                      height: '100px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      background: '#3838380D',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <Plus size={24} className="text-gray-400" />
                  </div>
                  <span className="text-xs text-gray-400">Add</span>
                </div>

                {/* Highlight Items */}
                {highlights.map((item) => (
                  <div key={item.id} className="flex flex-col items-center gap-2 min-w-[70px] cursor-pointer group flex-shrink-0">
                    <div
                      className="relative overflow-hidden backdrop-blur-[4px] transition-all group-hover:scale-105"
                      style={{
                        width: '70px',
                        height: '100px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        background: '#3838380D',
                      }}
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
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center mb-8 md:mb-10 w-full px-0">
              <div
                className="flex items-center justify-between bg-[#38383833] rounded-[12px] p-[3px] w-full max-w-[480px]"
                style={{ height: '48px' }}
              >
                {['Post', 'Reels', 'Feeds', 'Tags'].map((tab, index) => (
                  <button
                    key={tab}
                    className="relative flex items-center justify-center text-[13px] md:text-[14px] font-medium transition-all text-white flex-1 hover:text-white/80"
                    style={{
                      height: '42px',
                      borderRadius: '12px',
                    }}
                  >
                    {index === 0 && (
                      <div
                        className="absolute inset-0 rounded-[12px] p-[0.5px]"
                        style={{
                          background: 'linear-gradient(270deg, rgba(32, 32, 32, 0.5) -122.45%, rgba(96, 96, 96, 0.5) 100%)'
                        }}
                      >
                        <div
                          className="w-full h-full rounded-[11.5px]"
                          style={{
                            background: 'linear-gradient(270deg, rgba(32, 32, 32, 0.2) -8.43%, rgba(96, 96, 96, 0.2) 100%)'
                          }}
                        />
                      </div>
                    )}
                    <span className="relative z-10">{tab}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Grid / Empty State - All White Theme */}
            <div className="flex flex-col items-center justify-center py-10">
              <div className="mb-0 opacity-100" style={{ width: '300px', height: '273px', transform: 'rotate(0deg)' }}>
                <img src={cameraImg.src} alt="Camera" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-white text-xl font-bold mb-4 -mt-10">No Post Yet!</h3>

              <button
                className="px-10 py-2.5 rounded-full text-white text-sm font-medium transition-all hover:opacity-90"
                style={{
                  background: 'linear-gradient(349.06deg, #8E74E1 4.79%, #6E53D1 49.49%, #4D439B 88.77%)'
                }}
              >
                Create
              </button>
            </div>

          </div>
        </div>
      </main>

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
        <div className="flex justify-center items-center min-h-screen bg-black">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
export const dynamic = "force-dynamic";
