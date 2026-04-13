"use client";

import React, { useRef, useState, useEffect } from "react";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@/components/home/ThemeContext";

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
import MotorImg from "@/assets/Home/motorImg.jpg";
import NightImg from "@/assets/Home/nightImg.jpg";
import OtherImg from "@/assets/Home/otherImg.jpg";

interface Category {
  id: string;
  label: string;
  image: StaticImageData;
}

const CATEGORIES_DATA: Category[] = [
  { id: "Entertainment & Performing Arts", label: "Entertainment", image: EntertainmentImg },
  { id: "Dance",                           label: "Dance",         image: DanceImg },
  { id: "Food, Lifestyle, & Wellness",     label: "Food",          image: FoodImg },
  { id: "Sports, Fitness, & Adventure",    label: "Sports",        image: SportsImg },
  { id: "Music",                           label: "Music",         image: MusicImg },
  { id: "Arts, Culture, & Literature",     label: "Arts",          image: ArtsImg },
  { id: "Business & Innovation",           label: "Business",      image: BusinessImg },
  { id: "Film, Media, & Gaming",           label: "Film",          image: FilmImg },
  { id: "Travel, Holidays, & Tourism",     label: "Travel",        image: TravelImg },
  { id: "Festivals & Celebrations",        label: "Festivals",     image: FestivalImg },
  {
    id: "Environment, Sustainability, & Agriculture",
    label: "Environment",
    image: EnvironmentImg,
  },
  { id: "Religious & Spiritual Events",    label: "Religious",     image: ReligiousImg },
  { id: "Education & Learning",            label: "Education",     image: EducationImg },
  { id: "Motorsport Racing",               label: "Motorsports",   image: MotorImg },
  { id: "Night Life",                      label: "Nightlife",     image: NightImg },
  { id: "Other",                           label: "Other",         image: OtherImg },
];

export default function EventCategoryList() {
  const router = useRouter();
  const { themeStyles, isDark } = useTheme();
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  useEffect(() => {
    setMounted(true);
  }, []);
  const scroll = (direction: "left" | "right") => {
    categoriesRef.current?.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };
  const handleCategoryClick = (cat: Category) => {
    // Optimistic: highlight card immediately before route change
    setActiveCategory(cat.id);
    router.push(`/events/categories?category=${encodeURIComponent(cat.id)}`);
  };
  return (
    <div className="relative mx-4 md:mx-[30px]">
      {/* Header */}
      <div className="flex justify-between items-end mb-3 px-1">
        <h2
          className="text-[17px] font-semibold tracking-tight"
          style={{ color: themeStyles.text }}
        >
          Event categories
        </h2>
        <button
          onClick={() => router.push("/events/categories")}
          className="text-xs text-transparent bg-clip-text bg-[linear-gradient(180deg,_#B3B8E2_0%,_#8860D9_50%,_#9575CD_100%)] hover:opacity-80 transition-opacity font-medium"
        >
          see all
        </button>
      </div>

      {/* Scrollable list with hover-reveal arrows */}
      <div className="relative group">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          aria-label="Scroll left"
          className="
            absolute -left-3 top-1/2 -translate-y-1/2 z-20
            w-[28px] h-[28px] rounded-[8px]
            border border-white/10 backdrop-blur-md
            hidden sm:flex items-center justify-center
            transition-opacity duration-200
            p-[6px]
            "
          style={{ backgroundColor: themeStyles.pillBg }}
        >
          <ChevronLeft
            className="w-[16px] h-[16px]"
            style={{ color: themeStyles.text }}
          />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          aria-label="Scroll right"
          className="
            absolute -right-3 top-1/2 -translate-y-1/2 z-20
            w-[28px] h-[28px] rounded-[8px]
            border border-white/10 backdrop-blur-md
            hidden sm:flex items-center justify-center
            transition-opacity duration-200
            p-[6px]
            "
          style={{ backgroundColor: themeStyles.pillBg }}
        >
          <ChevronRight
            className="w-[16px] h-[16px]"
            style={{ color: themeStyles.text }}
          />
        </button>

        {/* Cards strip */}
        <div
          ref={categoriesRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        >
          {!mounted
            ? /* Skeleton cards while component hydrates */
              [...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[139px] h-[63px] rounded-[12px] animate-pulse"
                  style={{
                    backgroundColor: isDark ? "#1e1e1e" : "#e5e7eb",
                    animationDelay: `${i * 80}ms`,
                  }}
                />
              ))
            : /* Real cards with optimistic active state */
              CATEGORIES_DATA.map((cat) => {
                const isActiveCat = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className="
                      flex-shrink-0 w-[139px] h-[63px]
                      rounded-[12px] relative overflow-hidden
                      group/card hover:scale-[1.02]
                      transition-transform duration-300
                      backdrop-blur-[15px]
                    "
                    style={{
                      outline: isActiveCat ? "2px solid #8860D9" : "none",
                      outlineOffset: "2px",
                    }}
                  >
                    <Image
                      src={cat.image}
                      alt={cat.label}
                      fill
                      sizes="139px"
                      className="object-cover transition-transform duration-500 group-hover/card:scale-110"
                    />

                    {/* Overlay — brighter when optimistically active */}
                    <div
                      className="absolute inset-0 transition-colors duration-200"
                      style={{
                        backgroundColor: isActiveCat
                          ? "rgba(136,96,217,0.35)"
                          : "rgba(0,0,0,0.40)",
                      }}
                    />

                    {/* Label bar */}
                    <div className="absolute bottom-0 inset-x-0 py-2 flex items-center justify-center backdrop-blur-[5px] z-10 bg-black/20">
                      <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 leading-none">
                        {cat.label}
                      </span>
                    </div>
                  </button>
                );
              })}
        </div>
      </div>
    </div>
  );
}
