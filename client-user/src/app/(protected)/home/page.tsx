"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getProfile } from "@/services/wieUserService";

// Assets (Assuming these paths exist based on your code)
import StoryPlusIcon from "@/assets/Home/StoryPlusIcon.svg";
import UserDemoIcon from "@/assets/Home/UserDemoIcon.svg";
import DummyPost from "@/assets/Home/dummypost.png";
import LikeIcon from "@/assets/Home/LikeIcon.svg";
import CommentIcon from "@/assets/Home/CommentIcon.svg";
import ShareCountIcon from "@/assets/Home/ShareCount.svg";
import SaveIcon from "@/assets/Home/ShareIcon.svg";
import QrCode from "@/assets/Home/QrCode.png";

import UserJpg from "@/assets/Home/user.jpg";
import DanceImg from "@/assets/Home/danceImg.jpg";
import FoodImg from "@/assets/Home/foodImg.jpg";
import EntertainmentImg from "@/assets/Home/entertainmentImg.jpg";
import SportsImg from "@/assets/Home/sportsImg.jpg";
import MusicImg from "@/assets/Home/musicImg.jpg";
import ArtsImg from "@/assets/Home/artsImg.jpg";
import BusinessImg from "@/assets/Home/businessImg.jpg";
import FilmImg from "@/assets/Home/filmImg.jpg";
import TravelImg from "@/assets/Home/travelImg.jpg";
import FestivalImg from "@/assets/Home/festivalImg.jpg";
import EnvironmentImg from "@/assets/Home/environmentImg.jpg";
import ReligiousImg from "@/assets/Home/religuosImg.jpg";
import EducationImg from "@/assets/Home/educationImg.jpg";

// Icons
import {
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Play,
  MapPin,
  Calendar,
  Heart as HeartOutline,
  UserPlus,
  X,
} from "lucide-react";

import SideBar from "@/components/home/SideBar";
import { useSidebar } from "@/context/SidebarContext";

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

// --- Dummy Data ---

const dummyStories: Story[] = [
  { id: "1", username: "Your story", avatar: "", hasStory: false, isOwn: true },
  { id: "2", username: "Gokul", avatar: "/avatars/gokul.jpg", hasStory: true },
  {
    id: "3",
    username: "Sangeeth",
    avatar: "/avatars/sangeeth.jpg",
    hasStory: true,
  },
  {
    id: "4",
    username: "Ajeesh",
    avatar: "/avatars/ajeesh.jpg",
    hasStory: true,
  },
  {
    id: "5",
    username: "Sangeeth",
    avatar: "/avatars/sangeeth2.jpg",
    hasStory: true,
  },
  {
    id: "6",
    username: "Sangeeth",
    avatar: "/avatars/sangeeth3.jpg",
    hasStory: true,
  },
];

const dummyPosts: Post[] = [
  {
    id: "1",
    user: {
      name: "SangeethPalliyal",
      avatar: "/avatars/sangeeth.jpg",
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
    likedBy: [{ name: "Gokul_Gopalan", avatar: "/avatars/gokul.jpg" }],
  },
  {
    id: "2",
    user: {
      name: "Joyal K Francis",
      avatar: "/avatars/joyal.jpg",
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
    likedBy: [{ name: "Sangeeth", avatar: "/avatars/sangeeth.jpg" }],
  },
];

const suggestedProfiles = [
  { id: 1, name: "san_geeth__palliyal", handle: "follows you" },
  { id: 2, name: "san_geeth__palliyal", handle: "follows you" },
  { id: 3, name: "san_geeth__palliyal", handle: "follows you" },
  { id: 4, name: "san_geeth__palliyal", handle: "follows you" },
];

const popularEvents = [
  {
    title: "A Study of Great Artists",
    date: "25 January 2025",
    location: "Malappuram",
    image: DummyPost,
  },
  {
    title: "A Study of Great Artists",
    date: "25 January 2025",
    location: "Malappuram",
    image: DummyPost,
  },
  {
    title: "A Study of Great Artists",
    date: "25 January 2025",
    location: "Malappuram",
    image: DummyPost,
  },
  {
    title: "A Study of Great Artists",
    date: "25 January 2025",
    location: "Malappuram",
    image: DummyPost,
  },
];

const suggestedReels = [1, 2, 3, 4, 5, 6];

const CATEGORIES_DATA = [
  {
    id: "Entertainment & Performing Arts",
    label: "Entertainment",
    image: EntertainmentImg,
  },
  {
    id: "Dance",
    label: "Dance",
    image: DanceImg,
  },
  {
    id: "Food, Lifestyle, & Wellness",
    label: "Food",
    image: FoodImg,
  },
  {
    id: "Sports, Fitness, & Adventure",
    label: "Sports",
    image: SportsImg,
  },
  {
    id: "Music",
    label: "Music",
    image: MusicImg,
  },
  {
    id: "Arts, Culture, & Literature",
    label: "Arts",
    image: ArtsImg,
  },
  {
    id: "Business & Innovation",
    label: "Business",
    image: BusinessImg,
  },
  {
    id: "Film, Media, & Gaming",
    label: "Film",
    image: FilmImg,
  },
  {
    id: "Travel, Holidays, & Tourism",
    label: "Travel",
    image: TravelImg,
  },
  {
    id: "Festivals & Celebrations",
    label: "Festivals",
    image: FestivalImg,
  },
  {
    id: "Environment, Sustainability, & Agriculture",
    label: "Environment",
    image: EnvironmentImg,
  },
  {
    id: "Religious & Spiritual Events",
    label: "Religious",
    image: ReligiousImg,
  },
  {
    id: "Education & Learning",
    label: "Education",
    image: EducationImg,
  },
];

export default function HomePage() {
  const { isCollapsed, isMobile } = useSidebar();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const router = useRouter();

  // --- Refs & Scroll Logic (From your code) ---
  const categoriesRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: "left" | "right") => {
    if (categoriesRef.current) {
      const scrollAmount = 300;
      categoriesRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const marginLeft = isMobile ? "0" : isCollapsed ? "80px" : "281px";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getProfile();
        setUserProfile(profile);
      } catch (e) {
        console.error("Error fetching profile:", e);
      }
    };
    fetchProfile();
  }, []);

  const toggleDescription = (postId: string) => {
    setExpandedPosts((prev) => {
      const n = new Set(prev);
      n.has(postId) ? n.delete(postId) : n.add(postId);
      return n;
    });
  };

  const truncateText = (text: string, limit: number) => {
    const words = text.split(" ");
    return words.length > limit
      ? { text: words.slice(0, limit).join(" ") + "...", truncated: true }
      : { text, truncated: false };
  };

  const formatCount = (n: number) =>
    n >= 1000
      ? (n / 1000).toFixed(1).replace(/\.0$/, "") +
        "," +
        (n % 1000).toString().padStart(3, "0").slice(0, 1) +
        "00"
      : n.toString();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#8860D9] selection:text-white">
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
      <SideBar />

      <main
        className="transition-all duration-300 ease-in-out"
        style={{ marginLeft }}
      >
        <div className="w-full max-w-[1600px] mx-auto flex justify-between gap-10 pt-4 px-4 md:px-12 xl:px-20">
          {/* ================= LEFT / CENTER FEED ================= */}
          <div className="flex-1 max-w-[700px] min-w-0 flex flex-col gap-8">
            <div className="relative w-[calc(100%+48px)] -ml-12 overflow-hidden">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2 px-1">
                {dummyStories.map((story) => (
                  <div
                    key={story.id}
                    className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 w-[72px]"
                  >
                    <div
                      className={`relative w-[70px] h-[70px] rounded-full flex items-center justify-center p-[3px]`}
                      style={{
                        background: story.isOwn
                          ? "transparent"
                          : "linear-gradient(147.67deg, #2979FF 13.16%, #6B9CF0 54.09%, #9DC1FF 100.03%)",
                      }}
                    >
                      {/* Removed the intermediate gap div */}
                      <div className="w-full h-full rounded-full bg-[#1a1a1a] overflow-hidden relative">
                        {/* Used UserJpg for all stories as requested */}
                        <Image
                          src={UserJpg}
                          alt={story.username}
                          fill
                          className="object-cover"
                        />
                      </div>
                      {story.isOwn && (
                        <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#2979FF] border-[3px] border-[#0a0a0a] flex items-center justify-center text-white font-bold text-sm">
                          +
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-[#dbdbdb] text-center truncate w-full">
                      {story.username}
                    </span>
                  </div>
                ))}
              </div>
            </div>


            {/* --- Event Categories (Integrated from your code) --- */}
            <div className="relative mx-[30px]">
              <div className="flex justify-between items-end mb-3 px-1">
                <h2 className="text-[17px] font-semibold text-white tracking-tight">
                  Event categories
                </h2>
                <button
                  onClick={() => router.push(`/events/categories`)}
                  className="text-xs text-transparent bg-clip-text bg-[linear-gradient(180deg,_#B3B8E2_0%,_#8860D9_50%,_#9575CD_100%)] hover:opacity-80 transition-opacity font-medium"
                >
                  see all
                </button>
              </div>

              <div className="relative group">
                {/* Scroll Buttons */}
                <button
                  onClick={() => scrollCategories("left")}
                  className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-[28px] h-[28px] rounded-[8px] bg-black/50 border border-white/10 backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-black/80 p-[6px]"
                >
                  <ChevronLeft className="w-[16px] h-[16px]" />
                </button>
                <button
                  onClick={() => scrollCategories("right")}
                  className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-[28px] h-[28px] rounded-[8px] bg-black/50 border border-white/10 backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-black/80 p-[6px]"
                >
                  <ChevronRight className="w-[16px] h-[16px]" />
                </button>

                <div
                  ref={categoriesRef}
                  className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
                >
                  {CATEGORIES_DATA.map((cat, index) => (
                    <button
                      key={cat.id}
                      onClick={() =>
                        router.push(
                          `/events/categories?category=${encodeURIComponent(
                            cat.id
                          )}`
                        )
                      }
                      className="flex-shrink-0 w-[139px] h-[63px] rounded-[12px] relative overflow-hidden group/card hover:scale-[1.02] transition-transform duration-300 backdrop-blur-[15px]"
                    >
                      {/* Background */}
                      {cat.image ? (
                        <>
                          <Image
                            src={cat.image}
                            alt={cat.label}
                            fill
                            className="object-cover transition-transform duration-500 group-hover/card:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover/card:bg-black/20 transition-colors" />
                        </>
                      ) : (
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${
                            index % 2 === 0
                              ? "from-[#2e1d40] to-[#1a1a1a]"
                              : "from-[#1a2c40] to-[#1a1a1a]"
                          } opacity-80 group-hover/card:opacity-100 transition-opacity`}
                        ></div>
                      )}

                      {/* Text */}
                      {/* Text Container with Blur */}
                      <div className="absolute bottom-0 inset-x-0 py-2 flex items-center justify-center backdrop-blur-[5px] z-10 bg-black/20">
                        <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 leading-none">
                          {cat.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* --- Feed Posts --- */}
            <div className="flex flex-col gap-6 pb-20 mx-[10px]">
              {dummyPosts.map((post) => {
                const { text: desc, truncated } = truncateText(
                  post.description,
                  18,
                );
                const isExpanded = expandedPosts.has(post.id);

                return (
                  <article
                    key={post.id}
                    className="w-full flex flex-col gap-3 mb-4"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-[38px] h-[38px] rounded-full overflow-hidden bg-[#222]">
                          <Image
                            src={UserDemoIcon}
                            alt={post.user.name}
                            width={38}
                            height={38}
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="text-[14px] font-semibold text-white leading-none">
                              {post.user.name}
                            </span>
                            {post.user.isVerified && (
                              <div className="bg-blue-500 rounded-full p-[2px] w-3 h-3 flex items-center justify-center">
                                <svg
                                  className="w-2 h-2 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] text-[#888] mt-0.5">
                            {post.user.location} <span className="mx-1">•</span>{" "}
                            {post.createdAt}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button className="w-[62px] h-[26px] rounded-[25px] flex items-center justify-center text-[11px] font-semibold text-white bg-[linear-gradient(180deg,_#B3B8E2_0%,_#8860D9_50%,_#9575CD_100%)]">
                          Follow
                        </button>
                        <MoreHorizontal className="text-white w-5 h-5 cursor-pointer" />
                      </div>
                    </div>

                    {/* Image */}
                    <div className="relative w-full aspect-square bg-[#1a1a1a] rounded-[24px] overflow-hidden border border-white/5">
                      <Image
                        src={DummyPost}
                        alt="Post content"
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Actions Pill & Save */}
                    <div className="flex items-center justify-between px-1 mt-1">
                      {/* Dark Pill Container */}
                      <div className="flex items-center bg-[#1e1e1e] rounded-full px-4 py-2.5 gap-6">
                        <button className="flex items-center gap-2 group">
                          <Image
                            src={LikeIcon}
                            alt="Like"
                            width={20}
                            height={20}
                            className="group-active:scale-90 transition-transform"
                          />
                          <span className="text-[13px] font-medium text-white">
                            1,200
                          </span>
                        </button>

                        <button className="flex items-center gap-2">
                          <Image
                            src={CommentIcon}
                            alt="Comment"
                            width={18}
                            height={18}
                          />
                          <span className="text-[13px] font-medium text-white">
                            1,111
                          </span>
                        </button>

                        <button className="flex items-center gap-2">
                          <Image
                            src={ShareCountIcon}
                            alt="Share"
                            width={18}
                            height={18}
                          />
                          <span className="text-[13px] font-medium text-white">
                            666
                          </span>
                        </button>
                      </div>

                      <button className="w-10 h-10 rounded-full bg-[#1e1e1e] flex items-center justify-center hover:bg-[#2a2a2a] transition-colors">
                        <Image
                          src={SaveIcon}
                          alt="Save"
                          width={18}
                          height={18}
                        />
                      </button>
                    </div>

                    {/* Description */}
                    <div className="px-1 text-[13px] text-[#dbdbdb] leading-relaxed">
                      {isExpanded ? post.description : desc}
                      {truncated && !isExpanded && (
                        <button
                          onClick={() => toggleDescription(post.id)}
                          className="text-[#888] ml-1"
                        >
                          more
                        </button>
                      )}
                    </div>

                    {/* Liked By */}
                    <div className="px-1 flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        <div className="w-4 h-4 rounded-full border border-black relative bg-gray-700">
                          <Image
                            src={UserDemoIcon}
                            alt=""
                            fill
                            className="rounded-full"
                          />
                        </div>
                        <div className="w-4 h-4 rounded-full border border-black relative bg-gray-700">
                          <Image
                            src={UserDemoIcon}
                            alt=""
                            fill
                            className="rounded-full"
                          />
                        </div>
                        <div className="w-4 h-4 rounded-full border border-black relative bg-gray-700">
                          <Image
                            src={UserDemoIcon}
                            alt=""
                            fill
                            className="rounded-full"
                          />
                        </div>
                      </div>
                      <span className="text-[12px] text-[#888]">
                        Liked by{" "}
                        <span className="text-white font-medium">
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
          <div className="hidden xl:flex w-[380px] 2xl:w-[480px] flex-col gap-10 pt-2 h-fit sticky top-6">
            {/* Suggested Profiles */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[16px] font-bold text-white">
                  Suggested Profiles
                </h3>
                <button className="text-xs text-[#8860D9] font-medium hover:underline">
                  see all
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {suggestedProfiles.map((profile, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#222] overflow-hidden relative border border-white/5">
                        <Image
                          src={UserDemoIcon}
                          alt={profile.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-white">
                          {profile.name}
                        </span>
                        <span className="text-[11px] text-[#888]">
                          {profile.handle}
                        </span>
                      </div>
                    </div>
                    <button className="w-[62px] h-[26px] rounded-[25px] flex items-center justify-center text-[11px] font-semibold text-white bg-[linear-gradient(180deg,_#B3B8E2_0%,_#8860D9_50%,_#9575CD_100%)]">
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Events */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[16px] font-bold text-white">
                  Popular events
                </h3>
                <button className="text-xs text-transparent bg-clip-text bg-[linear-gradient(180deg,_#B3B8E2_0%,_#8860D9_50%,_#9575CD_100%)] font-medium hover:opacity-80 transition-opacity">
                  see all
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {popularEvents.map((evt, i) => (
                  <div
                    key={i}
                    className="w-[213px] h-[260px] flex flex-col p-3 rounded-[12px] bg-[#131313] border border-white/5 hover:bg-[#1a1a1a] transition-colors cursor-pointer group relative overflow-hidden"
                  >
                    {/* Event Image */}
                    <div className="w-full h-[140px] rounded-[8px] overflow-hidden relative mb-3">
                      <Image
                        src={evt.image}
                        alt="Event"
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-2 right-2 w-7 h-7 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-colors z-10">
                        <HeartOutline className="w-3.5 h-3.5 text-[#8860D9] fill-[#8860D9]" />
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-[14px] font-semibold text-white leading-tight truncate">
                        {evt.title}
                      </h4>

                      <div className="flex items-center gap-2 text-[11px] text-[#dbdbdb]">
                        <Calendar className="w-3.5 h-3.5 text-[#8860D9]" />
                        <span>{evt.date}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#dbdbdb]">
                        <MapPin className="w-3.5 h-3.5 text-[#8860D9]" />
                        <span className="truncate">{evt.location}</span>
                      </div>

                      {/* Avatars */}
                      <div className="flex -space-x-2 mt-1.5">
                        {[1, 2, 3, 4].map((x) => (
                          <div
                            key={x}
                            className="w-6 h-6 rounded-full border border-[#131313] bg-gray-600 relative overflow-hidden"
                          >
                            <Image src={UserDemoIcon} alt="" fill />
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
                <h3 className="text-[16px] font-bold text-white">
                  Suggested reels
                </h3>
                <button className="text-xs text-transparent bg-clip-text bg-[linear-gradient(180deg,_#B3B8E2_0%,_#8860D9_50%,_#9575CD_100%)] font-medium hover:opacity-80 transition-opacity">
                  see all
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {suggestedReels.map((item) => (
                  <div
                    key={item}
                    className="relative aspect-[3/5] bg-[#1a1a1a] rounded-xl overflow-hidden cursor-pointer group"
                  >
                    <Image
                      src={DummyPost}
                      alt="Reel"
                      fill
                      className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute top-2 right-2 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-[6px] flex items-center justify-center border border-white/30">
                      <Play className="w-3.5 h-3.5 text-white fill-white" />
                    </div>
                    <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Section */}
            <div className="flex flex-col gap-4 mt-4 border-t border-white/5 pt-6 text-[11px] text-[#dbdbdb]">
              <div className="flex flex-col gap-3">
                <span className="font-medium">
                  Download mobile app
                </span>
                <div className="w-24 h-24 relative">
                  <Image src={QrCode} alt="QR Code" fill className="object-contain" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-x-2 gap-y-1 leading-normal">
                  <a href="#" className="hover:underline">
                    About
                  </a>
                  ·
                  <a href="#" className="hover:underline">
                    Help
                  </a>
                  ·
                  <a href="#" className="hover:underline">
                    Privacy
                  </a>
                  ·
                  <a href="#" className="hover:underline">
                    Terms
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
