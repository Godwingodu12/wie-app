"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getProfile } from "@/services/wieUserService";
// Assets
import UserDemoIcon from "@/assets/Home/UserDemoIcon.svg";
import DummyPost from "@/assets/Home/dummypost.png";
import LikeIcon from "@/assets/Home/LikeIcon.svg";
import CommentIcon from "@/assets/Home/CommentIcon.svg";
import ShareCountIcon from "@/assets/Home/ShareCount.svg";
import SaveIcon from "@/assets/Home/ShareIcon.svg";
import QrCode from "@/assets/Home/QrCode.png";
import ProfileImage from "@/assets/profile/ProfileImage.jpg";
import { getFluxFeed, getMyFluxes, viewFlux } from "@/services/mediaService";
import type { FeedFluxGroup, Flux } from "@/services/mediaService";
// Icons
import {
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Play,
  MapPin,
  Calendar,
  Heart as HeartOutline,
} from "lucide-react";

import SideBar from "@/components/home/SideBar";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/components/home/ThemeContext";

// ✅ Extracted EventCategoryList component
import EventCategoryList from "@/components/events/Eventcategorylist";

// --- Types ---
interface Story {
  id: string;
  username: string;
  avatar: string;
  hasStory: boolean;
  isOwn?: boolean;
}
interface Post {
  id: string;
  user: {
    name: string;
    avatar: string;
    location: string;
    isVerified?: boolean;
  };
  createdAt: string;
  image: string;
  likes: number;
  comments: number;
  shares: number;
  description: string;
  hashtags: string[];
  likedBy: { name: string; avatar: string }[];
}

const dummyPosts: Post[] = [
  {
    id: "1",
    user: {
      name: "SangeethPalliyal",
      avatar: ProfileImage.src,
      location: "Azrael, Empuraan",
      isVerified: true,
    },
    createdAt: "11 hours ago",
    image: "",
    likes: 1200,
    comments: 1111,
    shares: 666,
    description:
      "Mesmerizing colors and graceful movements! This tropical bird truly embodies the beauty of nature...",
    hashtags: ["#nature", "#birds", "#tropical"],
    likedBy: [{ name: "Gokul_Gopalan", avatar: ProfileImage.src }],
  },
  {
    id: "2",
    user: {
      name: "Joyal K Francis",
      avatar: ProfileImage.src,
      location: "Kochi, India",
      isVerified: false,
    },
    createdAt: "2 hours ago",
    image: "",
    likes: 850,
    comments: 420,
    shares: 100,
    description: "Night lights in the city. #UrbanLife",
    hashtags: ["#city", "#night", "#vibes"],
    likedBy: [{ name: "Sangeeth", avatar: ProfileImage.src }],
  },
];

const suggestedProfiles = [
  { id: 1, name: "san_geeth__palliyal", handle: "follows you" },
  { id: 2, name: "san_geeth__palliyal", handle: "follows you" },
  { id: 3, name: "san_geeth__palliyal", handle: "follows you" },
  { id: 4, name: "san_geeth__palliyal", handle: "follows you" },
];

const popularEvents = [
  { title: "A Study of Great Artists", date: "25 January 2025", location: "Malappuram", image: DummyPost },
  { title: "A Study of Great Artists", date: "25 January 2025", location: "Malappuram", image: DummyPost },
  { title: "A Study of Great Artists", date: "25 January 2025", location: "Malappuram", image: DummyPost },
  { title: "A Study of Great Artists", date: "25 January 2025", location: "Malappuram", image: DummyPost },
];

const suggestedReels = [1, 2, 3, 4, 5, 6];

export default function HomePage() {
  const { isCollapsed, isMobile } = useSidebar();
  const { themeStyles, isDark } = useTheme();
  const [userProfile,   setUserProfile]   = useState<any>(null);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [myFluxes,      setMyFluxes]      = useState<Flux[]>([]);
  const [feedGroups,    setFeedGroups]    = useState<FeedFluxGroup[]>([]);
  const [fluxLoading,   setFluxLoading]   = useState(true);
  const router = useRouter();
  const storiesRef = useRef<HTMLDivElement>(null);
  const [viewedFluxIds, setViewedFluxIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("viewedFluxIds");
      const parsed: string[] = stored ? JSON.parse(stored) : [];
      return new Set<string>(parsed.filter((id): id is string => typeof id === "string")); 
    } catch {
      return new Set<string>();
    }
  });
  const scrollStories = (direction: "left" | "right") => {
    storiesRef.current?.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  const marginLeft = isMobile ? "0" : "281px";

  useEffect(() => {
      const fetchProfile = async () => {
        try {
          const profile = await getProfile();
          setUserProfile(profile);
        } catch (e) {
          console.error("Error fetching profile:", e);
        }
      };
      const fetchFluxes = async () => {
        try {
          const [mine, feed] = await Promise.all([
            getMyFluxes(),
            getFluxFeed(),
          ]);
          setMyFluxes(mine);
          setFeedGroups(
            feed.filter((g) => !g.isSelf && g.fluxes.length > 0)
          );
        } catch (e) {
          console.error("Error fetching fluxes:", e);
        } finally {
          setFluxLoading(false);
        }
      };

      fetchProfile();
      fetchFluxes();
    }, []);

  const toggleDescription = (postId: string) => {
    setExpandedPosts((prev) => {
      const n = new Set(prev);
      n.has(postId) ? n.delete(postId) : n.add(postId);
      return n;
    });
  };

  const markFluxViewed = async (fluxId: string) => {
    if (viewedFluxIds.has(fluxId)) return;

    setViewedFluxIds((prev) => {
      const next = new Set(prev);
      next.add(fluxId);
      try {
        localStorage.setItem("viewedFluxIds", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });

    try {
      await viewFlux(fluxId);
    } catch (e) {
      console.warn("markFluxViewed failed silently:", e);
    }
  };

  const truncateText = (text: string, limit: number) => {
    const words = text.split(" ");
    return words.length > limit
      ? { text: words.slice(0, limit).join(" ") + "...", truncated: true }
      : { text, truncated: false };
  };
  const myFluxViewed =
    myFluxes.length > 0 && myFluxes.every((f) => viewedFluxIds.has(f._id));
  return (
    <div
      className="h-screen overflow-y-auto scrollbar-hide font-sans selection:bg-[#8860D9] selection:text-white"
      style={{ backgroundColor: themeStyles.background, color: themeStyles.text }}
    >
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <SideBar />

      <main className="transition-all duration-300 ease-in-out" style={{ marginLeft }}>
        <div className="w-full max-w-[1600px] mx-auto flex justify-center xl:justify-between gap-10 pt-4 px-4 md:px-12 xl:px-20">

          {/* LEFT / CENTER FEED  */}
          <div className="flex-1 max-w-[700px] min-w-0 flex flex-col gap-8">

            {/* ── Stories / Flux Section — always render "Your story", others only if present ── */}
            {!fluxLoading && (
              <div className="relative -mx-4 md:-mx-12 xl:-mx-20 flex items-center lg:ml-12">

                {/* ── My Story bubble — always shown ── */}
                <div className="pl-4 md:pl-12 xl:pl-20 flex-shrink-0">
                  <button
                    onClick={() => {
                      if (myFluxes.length > 0) {
                        markFluxViewed(myFluxes[0]._id);
                        router.push(`/post/flux-view?fluxId=${myFluxes[0]._id}`);
                      } else {
                        router.push("/post/flux");
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    style={{ width: 72 }}
                  >
                  
                    <div
                      className="relative overflow-hidden transition-all group-hover:scale-105"
                      style={{
                        width:        70,
                        height:       100,
                        borderRadius: 12,
                        padding:      myFluxes.length > 0 ? 2 : 0,
                        background: myFluxes.length > 0
                          ? myFluxViewed
                            ? "linear-gradient(147.67deg,#555 13%,#888 100%)"  
                            : "linear-gradient(147.67deg,#8860D9 13%,#B3B8E2 100%)" 
                          : "transparent",
                        border: myFluxes.length > 0
                          ? "none"
                          : "1.5px dashed rgba(255,255,255,0.25)",

                      }}
                    >
                      <div style={{
                        width:        "100%",
                        height:       "100%",
                        borderRadius: myFluxes.length > 0 ? 10 : 12,
                        overflow:     "hidden",
                        position:     "relative",
                        background:   "#1a1a1a",
                      }}>
                        {/* Profile picture always as background */}
                        <Image
                          src={userProfile?.profile_picture ?? ProfileImage}
                          alt="my story"
                          fill
                          sizes="70px"
                          className="object-cover"
                          style={{ opacity: myFluxes.length > 0 ? 1 : 0.6 }}
                          unoptimized={!!userProfile?.profile_picture}
                        />

                        {/* + badge when no flux */}
                        {myFluxes.length === 0 && (
                          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm"
                              style={{ background: "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)" }}
                            >
                              +
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-center truncate w-full" style={{ color: themeStyles.textSecondary }}>
                      Your Flux
                    </span>
                  </button>
                </div>

                {/* ── Other users' flux bubbles — only if feed has data ── */}
                {feedGroups.length > 0 && (
                  <div className="flex-1 min-w-0 relative group">
                    <button
                      onClick={() => scrollStories("left")}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-[28px] h-[28px] rounded-[8px] border border-white/10 backdrop-blur-md hidden lg:flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 p-[6px]"
                      style={{ backgroundColor: themeStyles.pillBg }}
                    >
                      <ChevronLeft className="w-[16px] h-[16px]" style={{ color: themeStyles.text }} />
                    </button>
                    <button
                      onClick={() => scrollStories("right")}
                      className="absolute right-4 md:right-12 xl:right-20 top-1/2 -translate-y-1/2 z-20 w-[28px] h-[28px] rounded-[8px] border border-white/10 backdrop-blur-md hidden lg:flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 p-[6px]"
                      style={{ backgroundColor: themeStyles.pillBg }}
                    >
                      <ChevronRight className="w-[16px] h-[16px]" style={{ color: themeStyles.text }} />
                    </button>

                    <div
                      ref={storiesRef}
                      className="flex gap-4 overflow-x-auto scrollbar-hide py-2 pl-4 pr-4 md:pr-12 xl:pr-20 scroll-smooth"
                    >
                      {feedGroups.map((group) => {
                        const firstFlux  = group.fluxes[0];
                        const userAvatar = group.user?.profile_picture ?? null;
                        const username   = group.user?.username ?? group._id;
                        const fluxId     = firstFlux?._id ?? "";
                        const allViewed = group.fluxes.every((f) => f._id != null && viewedFluxIds.has(f._id));
                        const isCloseFriend = group.fluxes.some(
                                                  (f) => f.visibility === "close_friends"
                                                );                         
                        return (
                          <button
                            key={group._id}
                            onClick={() => {
                              markFluxViewed(fluxId); 
                              router.push(`/post/flux-view?fluxId=${fluxId}&userId=${group._id}`);
                            }}
                            className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group/item"
                            style={{ width: 72 }}
                          >
                            <div
                              className="relative overflow-hidden transition-all group-hover/item:scale-105"
                              style={{
                                width: 70, height: 100, borderRadius: 12, padding: 2,
                                background: allViewed
                                  ? "linear-gradient(147.67deg,#444 13%,#777 100%)"  
                                  : isCloseFriend
                                    ? "linear-gradient(147.67deg,#22c55e 13%,#16a34a 100%)"   
                                    : "linear-gradient(147.67deg,#2979FF 13%,#6B9CF0 54%,#9DC1FF 100%)", 
                              }}
                            >
                              <div style={{
                                width: "100%", height: "100%", borderRadius: 10,
                                overflow: "hidden", position: "relative", background: "#1a1a1a",
                              }}>
                                <Image
                                  src={userAvatar || ProfileImage}
                                  alt={username}
                                  fill
                                  sizes="70px"
                                  className="object-cover"
                                  unoptimized={!!userAvatar}
                                />
                              </div>
                            </div>
                            <span className="text-[11px] text-center truncate w-full" style={{ color: themeStyles.textSecondary }}>
                              {username}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* ✅ Event Categories — now a standalone component */}
            <EventCategoryList />

            {/* --- Feed Posts --- */}
            <div className="flex flex-col gap-6 pb-20 mx-[10px]">
              {dummyPosts.map((post) => {
                const { text: desc, truncated } = truncateText(post.description, 18);
                const isExpanded = expandedPosts.has(post.id);

                return (
                  <article key={post.id} className="w-full flex flex-col gap-3 mb-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-[38px] h-[38px] rounded-full overflow-hidden bg-[#222]">
                          {/* ✅ FIX — explicit width + height (no fill), no CSS size override */}
                          <Image
                            src={post.user.avatar}
                            alt={post.user.name}
                            width={38}
                            height={38}
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span
                              className="text-[14px] font-semibold leading-none"
                              style={{ color: themeStyles.text }}
                            >
                              {post.user.name}
                            </span>
                            {post.user.isVerified && (
                              <div className="bg-blue-500 rounded-full p-[2px] w-3 h-3 flex items-center justify-center">
                                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] mt-0.5" style={{ color: themeStyles.textSecondary }}>
                            {post.user.location} <span className="mx-1">•</span> {post.createdAt}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button className="w-[62px] h-[26px] rounded-[25px] flex items-center justify-center text-[11px] font-semibold text-white bg-[linear-gradient(180deg,_#B3B8E2_0%,_#8860D9_50%,_#9575CD_100%)]">
                          Follow
                        </button>
                        <MoreHorizontal className="w-5 h-5 cursor-pointer" style={{ color: themeStyles.text }} />
                      </div>
                    </div>

                    {/* Post Image */}
                    <div className="relative w-full aspect-square bg-[#1a1a1a] rounded-[24px] overflow-hidden border border-white/5">
                      <Image
                        src={DummyPost}
                        alt="Post content"
                        fill
                        sizes="(max-width: 700px) 100vw, 700px"
                        className="object-cover"
                        priority={post.id === "1"}
                      />
                    </div>

                    {/* Actions Pill & Save */}
                    <div className="flex items-center justify-between px-1 mt-1">
                      <div
                        className="flex items-center rounded-full px-4 py-2.5 gap-6"
                        style={{ backgroundColor: themeStyles.pillBg }}
                      >
                        <button className="flex items-center gap-2 group">
                          {/* ✅ FIX — SVG icons: use explicit equal width+height, no CSS override */}
                          <Image
                            src={LikeIcon}
                            alt="Like"
                            width={20}
                            height={20}
                            className="group-active:scale-90 transition-transform"
                            style={{ filter: themeStyles.iconFilter }}
                          />
                          <span className="text-[13px] font-medium" style={{ color: themeStyles.text }}>1,200</span>
                        </button>
                        <button className="flex items-center gap-2">
                          <Image
                            src={CommentIcon}
                            alt="Comment"
                            width={18}
                            height={18}
                            style={{ filter: themeStyles.iconFilter }}
                          />
                          <span className="text-[13px] font-medium" style={{ color: themeStyles.text }}>1,111</span>
                        </button>
                        <button className="flex items-center gap-2">
                          <Image
                            src={ShareCountIcon}
                            alt="Share"
                            width={18}
                            height={18}
                            style={{ filter: themeStyles.iconFilter }}
                          />
                          <span className="text-[13px] font-medium" style={{ color: themeStyles.text }}>666</span>
                        </button>
                      </div>

                      <button
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                        style={{ backgroundColor: themeStyles.pillBg }}
                      >
                        <Image
                          src={SaveIcon}
                          alt="Save"
                          width={18}
                          height={18}
                          style={{ filter: themeStyles.iconFilter }}
                        />
                      </button>
                    </div>

                    {/* Description */}
                    <div className="px-1 text-[13px] leading-relaxed" style={{ color: themeStyles.textSecondary }}>
                      {isExpanded ? post.description : desc}
                      {truncated && !isExpanded && (
                        <button
                          onClick={() => toggleDescription(post.id)}
                          className="ml-1 font-medium"
                          style={{ color: themeStyles.textSecondary }}
                        >
                          more
                        </button>
                      )}
                    </div>

                    {/* Liked By */}
                    <div className="px-1 flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-4 h-4 rounded-full border border-black relative bg-gray-700 overflow-hidden">
                            {/* ✅ FIX — fill + sizes for these tiny avatar circles */}
                            <Image src={ProfileImage} alt="" fill sizes="16px" className="rounded-full object-cover" />
                          </div>
                        ))}
                      </div>
                      <span className="text-[12px] text-[#888]">
                        Liked by{" "}
                        <span className="font-medium" style={{ color: themeStyles.text }}>
                          {post.likedBy[0]?.name}
                        </span>{" "}
                        and others
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* ================= RIGHT SIDEBAR ================= */}
          <div className="hidden xl:flex w-[320px] 2xl:w-[380px] flex-col gap-10 pt-2 h-fit sticky top-6">

            {/* Suggested Profiles */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[16px] font-bold" style={{ color: themeStyles.text }}>
                  Suggested Profiles
                </h3>
                <button className="text-xs text-[#8860D9] font-medium hover:underline">see all</button>
              </div>
              <div className="flex flex-col gap-4">
                {suggestedProfiles.map((profile, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-[#222] overflow-hidden relative border border-white/5 flex-shrink-0">
                        {/* ✅ FIX — fill + sizes, no conflicting width/height + CSS */}
                        <Image
                          src={UserDemoIcon}
                          alt={profile.name}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-semibold truncate" style={{ color: themeStyles.text }}>
                          {profile.name}
                        </span>
                        <span className="text-[11px] truncate" style={{ color: themeStyles.textSecondary }}>
                          {profile.handle}
                        </span>
                      </div>
                    </div>
                    <button className="w-[62px] h-[26px] rounded-[25px] flex items-center justify-center text-[11px] font-semibold text-white bg-[linear-gradient(180deg,_#B3B8E2_0%,_#8860D9_50%,_#9575CD_100%)] flex-shrink-0">
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Events */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[16px] font-bold" style={{ color: themeStyles.text }}>Popular events</h3>
                <button className="text-xs text-transparent bg-clip-text bg-[linear-gradient(180deg,_#B3B8E2_0%,_#8860D9_50%,_#9575CD_100%)] font-medium hover:opacity-80 transition-opacity">
                  see all
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {popularEvents.map((evt, i) => (
                  <div
                    key={i}
                    className="w-full h-[260px] flex flex-col p-3 rounded-[12px] border transition-colors cursor-pointer group relative overflow-hidden"
                    style={{ background: themeStyles.cardBg, borderColor: themeStyles.border }}
                  >
                    <div className="w-full h-[140px] rounded-[8px] overflow-hidden relative mb-3">
                      {/* ✅ FIX — fill + sizes for event card images */}
                      <Image
                        src={evt.image}
                        alt="Event"
                        fill
                        sizes="(max-width: 1280px) 50vw, 190px"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div
                        className="absolute top-2 right-2 w-7 h-7 backdrop-blur-md rounded-full flex items-center justify-center border transition-colors z-10"
                        style={{ backgroundColor: themeStyles.pillBg, borderColor: themeStyles.border }}
                      >
                        <HeartOutline className="w-3.5 h-3.5 text-[#8860D9] fill-[#8860D9]" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-[14px] font-semibold leading-tight truncate" style={{ color: themeStyles.text }}>
                        {evt.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px]" style={{ color: themeStyles.textSecondary }}>
                        <Calendar className="w-3.5 h-3.5 text-[#8860D9]" />
                        <span>{evt.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]" style={{ color: themeStyles.textSecondary }}>
                        <MapPin className="w-3.5 h-3.5 text-[#8860D9]" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                      <div className="flex -space-x-2 mt-1.5">
                        {[1, 2, 3, 4].map((x) => (
                          <div
                            key={x}
                            className="w-6 h-6 rounded-full border relative overflow-hidden"
                            style={{ borderColor: isDark ? themeStyles.background : "#FFFFFF" }}
                          >
                            {/* ✅ FIX — fill + sizes for avatar stacks */}
                            <Image src={UserDemoIcon} alt="" fill sizes="24px" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Reels */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[16px] font-bold" style={{ color: themeStyles.text }}>Suggested reels</h3>
                <button className="text-xs text-transparent bg-clip-text bg-[linear-gradient(180deg,_#B3B8E2_0%,_#8860D9_50%,_#9575CD_100%)] font-medium hover:opacity-80 transition-opacity">
                  see all
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {suggestedReels.map((item) => (
                  <div key={item} className="relative aspect-[3/5] bg-[#1a1a1a] rounded-xl overflow-hidden cursor-pointer group">
                    {/* ✅ FIX — fill + sizes for reel thumbnails */}
                    <Image
                      src={DummyPost}
                      alt="Reel"
                      fill
                      sizes="(max-width: 1280px) 33vw, 120px"
                      className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute top-2 right-2 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-[6px] flex items-center justify-center border border-white/30">
                      <Play className="w-3.5 h-3.5 text-white fill-white" />
                    </div>
                    <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex flex-col gap-4 mt-4 pt-6 text-[11px]"
              style={{ borderTop: `1px solid ${themeStyles.border}`, color: themeStyles.textSecondary }}
            >
              <div className="flex flex-col gap-3">
                <span className="font-medium" style={{ color: themeStyles.text }}>Download mobile app</span>
                <div className="w-24 h-24 relative p-1 bg-white rounded-lg overflow-hidden">
                  {/* ✅ FIX — fill + sizes for QR code */}
                  <Image src={QrCode} alt="QR Code" fill sizes="96px" className="object-contain" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-x-2 gap-y-1 leading-normal">
                  <a href="#" className="hover:underline">About</a> ·
                  <a href="#" className="hover:underline">Help</a> ·
                  <a href="#" className="hover:underline">Privacy</a> ·
                  <a href="#" className="hover:underline">Terms</a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
