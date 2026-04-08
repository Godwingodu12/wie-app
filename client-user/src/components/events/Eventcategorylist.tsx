"use client";

import React, { useRef } from "react";
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
];

export default function EventCategoryList() {
  const router = useRouter();
  const { themeStyles } = useTheme();
  const categoriesRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    categoriesRef.current?.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
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
          {CATEGORIES_DATA.map((cat, index) => (
            <button
              key={cat.id}
              onClick={() =>
                router.push(
                  `/events/categories?category=${encodeURIComponent(cat.id)}`
                )
              }
              className="
                flex-shrink-0 w-[139px] h-[63px]
                rounded-[12px] relative overflow-hidden
                group/card hover:scale-[1.02]
                transition-transform duration-300
                backdrop-blur-[15px]
              "
            >
              {/* Background image — fix: add sizes to suppress the "fill without sizes" warning */}
              <Image
                src={cat.image}
                alt={cat.label}
                fill
                sizes="139px"
                className="object-cover transition-transform duration-500 group-hover/card:scale-110"
              />

              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/40 group-hover/card:bg-black/20 transition-colors" />

              {/* Label bar */}
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
  );
}