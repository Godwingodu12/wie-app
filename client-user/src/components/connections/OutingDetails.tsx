import React, { useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";
import boyImg from "../../assets/connections/boyImg.png";
import girlImg from "../../assets/connections/girlImg.png";
import { useTheme } from "../home/ThemeContext";
import { ConnectionNavigation } from "./ConnectionNavigation";

// --- Types ---
type OutingType = "cafe" | "nature" | "shopping" | "museum" | "photography";
type CompanionType = "group" | "single";
type GroupPreference = "boys" | "girls" | "mixed";

interface FormData {
  outingType: OutingType | null;
  date: string;
  time: string;
  companionType: CompanionType | null;
  groupPreference: GroupPreference | null;
}

// --- Constants ---
const OUTING_TYPES = [
  {
    id: "cafe" as OutingType,
    title: "Cafe/Restaurant visit",
    icon: "☕",
  },
  {
    id: "nature" as OutingType,
    title: "Nature Walk/Hiking",
    icon: "🌵",
  },
  {
    id: "shopping" as OutingType,
    title: "Shopping/Market Visit",
    icon: "🛍️",
  },
  {
    id: "museum" as OutingType,
    title: "Museum/Gallery Visit",
    icon: "🗿",
  },
  {
    id: "photography" as OutingType,
    title: "Photography Walk",
    icon: "📷",
  },
];

const COMPANION_OPTIONS = [
  {
    id: "group" as CompanionType,
    title: "Group of Peoples",
    subtitle: "4+ member",
    images: [boyImg, girlImg],
  },
  {
    id: "single" as CompanionType,
    title: "Single person",
    subtitle: "Find one travel buddy",
    image: boyImg,
  },
];

const GROUP_PREFERENCES = [
  {
    id: "boys" as GroupPreference,
    title: "Boys only",
    subtitle: "This group include only boys",
    images: [boyImg, boyImg],
  },
  {
    id: "girls" as GroupPreference,
    title: "Girls only",
    subtitle: "This group include only girls",
    images: [girlImg, girlImg],
  },
  {
    id: "mixed" as GroupPreference,
    title: "Boys & Girls",
    subtitle: "This is a mixed group",
    images: [boyImg, girlImg],
  },
];

interface OutingDetailsProps {
    onProgress: (current: number, total: number) => void;
    onComplete: () => void;
    onBack: () => void;
}

export function OutingDetails({ onProgress, onComplete, onBack }: OutingDetailsProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    outingType: null,
    date: "",
    time: "",
    companionType: null,
    groupPreference: null,
  });

  const totalSteps = 2;
  const { isDark, themeStyles } = useTheme();

  useEffect(() => {
    onProgress(step, totalSteps);
  }, [step, onProgress]);

  const handleNext = () => {
    if (step === 1) setStep(2);
    else {
      console.log("Outing details completed", formData);
      onComplete();
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else onBack();
  };

  const updateFormData = (key: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="w-full max-w-[1400px] px-6 py-8 flex flex-col font-sans">

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-4 md:px-6 w-full overflow-hidden py-4 md:py-8">
        <div className="flex-1 flex flex-col justify-start w-full">
          {step === 1 ? (
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Question 1: Outing Type */}
              <h1 className="text-2xl md:text-4xl font-normal mb-8 md:mb-12 text-left" style={{ color: isDark ? themeStyles.text : '#111827' }}>
                What kind of day outing are you planning?
              </h1>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-12 md:mb-16">
                {OUTING_TYPES.map((type) => {
                  const isSelected = formData.outingType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => updateFormData("outingType", type.id)}
                      className={`
                        relative group flex flex-col items-center justify-center p-4 md:p-6 rounded-3xl border transition-all duration-300 aspect-square
                        ${isSelected ? (isDark ? "bg-white text-black" : "bg-black text-white") + " border-transparent shadow-xl scale-105" : (isDark ? "bg-transparent border-gray-800 text-gray-400 border-white/5" : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50")}
                      `}
                      style={{ backgroundColor: !isSelected && isDark ? themeStyles.pillBg : undefined }}
                    >
                      <div className="text-3xl md:text-5xl mb-2 md:mb-3">{type.icon}</div>
                      <p
                        className={`text-[10px] md:text-xs text-center font-medium leading-tight ${isSelected ? (isDark ? "text-black" : "text-white") : (isDark ? "text-gray-300" : "text-gray-500")}`}
                      >
                        {type.title}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Question 2: When */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <h2 className="text-2xl md:text-4xl font-normal mb-6 md:mb-8 text-left" style={{ color: isDark ? themeStyles.text : '#111827' }}>
                  When are you planning this outing?
                </h2>

                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label className={`block text-sm mb-2 ml-1 text-left ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Date of visit
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Select a date"
                        value={formData.date}
                        onChange={(e) => updateFormData("date", e.target.value)}
                        onFocus={(e) => (e.target.type = "date")}
                        onBlur={(e) =>
                          !e.target.value && (e.target.type = "text")
                        }
                        className={`w-full border rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all outline-none ${isDark ? 'border-gray-800 text-white placeholder-gray-600' : 'border-gray-200 text-gray-900 bg-white placeholder-gray-400'}`}
                        style={{ backgroundColor: isDark ? themeStyles.pillBg : undefined }}
                      />
                      <Calendar className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm mb-2 ml-1 text-left ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Time of visit
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Select a time"
                        value={formData.time}
                        onChange={(e) => updateFormData("time", e.target.value)}
                        onFocus={(e) => (e.target.type = "time")}
                        onBlur={(e) =>
                          !e.target.value && (e.target.type = "text")
                        }
                        className={`w-full border rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all outline-none ${isDark ? 'border-gray-800 text-white placeholder-gray-600' : 'border-gray-200 text-gray-900 bg-white placeholder-gray-400'}`}
                        style={{ backgroundColor: isDark ? themeStyles.pillBg : undefined }}
                      />
                      <Clock className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Question 3: Companion */}
              <h1 className="text-2xl md:text-4xl font-normal mb-8 md:mb-10 text-left" style={{ color: isDark ? themeStyles.text : '#111827' }}>
                Who would you like to go with?
              </h1>

              <div className="flex flex-wrap gap-4 md:gap-8 mb-8 md:mb-12">
                {COMPANION_OPTIONS.map((option) => {
                  const isSelected = formData.companionType === option.id;
                  const hasMultipleImages = "images" in option;
                  return (
                    <button
                      key={option.id}
                      onClick={() => updateFormData("companionType", option.id)}
                      className={`
                        relative flex flex-col items-center justify-between transition-all duration-300 rounded-[32px] overflow-hidden w-[45%] md:w-[200px] border
                        ${isSelected ? (isDark ? "bg-white" : "bg-black") + " scale-105 border-transparent shadow-xl" : (isDark ? "border-gray-800" : "bg-white border-gray-200 hover:bg-gray-50")}
                      `}
                      style={{
                        backgroundColor: !isSelected && isDark ? themeStyles.pillBg : undefined,
                        height: "240px",
                        padding: "32px 16px 24px 16px",
                      }}
                    >
                      <div className="flex-1 flex justify-center items-center w-full mb-4">
                        {hasMultipleImages ? (
                          <div className="flex items-center justify-center -space-x-8">
                            {(option as any).images.map(
                              (img: any, i: number) => (
                                <img
                                  key={i}
                                  src={img.src || img} // Handle next/image import object or string
                                  alt=""
                                  className="h-24 md:h-28 w-auto object-contain z-10 first:z-0"
                                />
                              )
                            )}
                          </div>
                        ) : (
                          <img
                            src={(option as any).image.src || (option as any).image}
                            alt=""
                            className="h-28 md:h-32 w-auto object-contain"
                          />
                        )}
                      </div>
                      <div className="text-center">
                        <h3
                          className={`text-base md:text-lg font-medium mb-1 ${isSelected ? (isDark ? "text-black" : "text-white") : (isDark ? "text-white" : "text-gray-900")}`}
                        >
                          {option.title}
                        </h3>
                        <p
                          className={`text-[10px] md:text-xs ${isSelected ? (isDark ? "text-gray-600" : "text-gray-400") : (isDark ? "text-gray-400" : "text-gray-500")}`}
                        >
                          {option.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Conditional: Group Preference */}
              {formData.companionType === "group" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <h2 className="text-2xl md:text-4xl font-normal mb-6 md:mb-8 text-left" style={{ color: isDark ? themeStyles.text : '#111827' }}>
                    Select your preferred group?
                  </h2>

                  <div className="flex flex-wrap gap-4 md:gap-8">
                    {GROUP_PREFERENCES.map((pref) => {
                      const isSelected = formData.groupPreference === pref.id;
                      const hasMultipleImages = "images" in pref;
                      return (
                        <button
                          key={pref.id}
                          onClick={() => updateFormData("groupPreference", pref.id)}
                          className={`
                            relative flex flex-col items-center justify-between transition-all duration-300 rounded-[32px] overflow-hidden w-[45%] md:w-[200px] border
                            ${isSelected ? (isDark ? "bg-white" : "bg-black") + " scale-105 border-transparent shadow-xl" : (isDark ? "border-gray-800" : "bg-white border-gray-200 hover:bg-gray-50")}
                          `}
                          style={{
                             backgroundColor: !isSelected && isDark ? themeStyles.pillBg : undefined,
                             height: "240px",
                             padding: "32px 16px 24px 16px",
                          }}
                        >
                          <div className="flex-1 flex justify-center items-center w-full mb-4">
                            {hasMultipleImages ? (
                              <div className="flex items-center justify-center -space-x-8">
                                {(pref as any).images.map(
                                  (img: any, i: number) => (
                                    <img
                                      key={i}
                                      src={img.src || img}
                                      alt=""
                                      className="h-24 md:h-28 w-auto object-contain z-10 first:z-0"
                                    />
                                  )
                                )}
                              </div>
                            ) : (
                              <img
                                src={(pref as any).image.src || (pref as any).image}
                                alt=""
                                className="h-28 md:h-32 w-auto object-contain"
                              />
                            )}
                          </div>
                          <div className="text-center">
                            <h3
                              className={`text-base md:text-lg font-medium mb-1 ${isSelected ? (isDark ? "text-black" : "text-white") : (isDark ? "text-white" : "text-gray-900")}`}
                            >
                              {pref.title}
                            </h3>
                            <p
                              className={`text-[10px] md:text-xs ${isSelected ? (isDark ? "text-gray-600" : "text-gray-400") : (isDark ? "text-gray-400" : "text-gray-500")}`}
                            >
                              {pref.subtitle}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="px-4 py-6 md:px-6 w-full">
        <ConnectionNavigation
          onBack={handleBack}
          onNext={handleNext}
          nextLabel={step === totalSteps ? "Complete" : undefined}
        />
      </footer>
    </div>
  );
}
