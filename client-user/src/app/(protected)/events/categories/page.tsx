"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import SideBar from "@/components/home/SideBar";
import { useSidebar } from "@/context/SidebarContext";
import { useEventSearch } from "@/hooks/events/useEventSearch";
import { useFilteredEvents } from "@/hooks/events/useFilteredEvents";
import {
  MapPin,
  Navigation,
  Search,
  Filter,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
} from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/components/home/ThemeContext";
import { EVENT_CATEGORIES, FilterEventsParams, EventWithLocation } from "@/types/ticket";
import { EventCard } from "@/components/events/EventCard";
import FilterSearchEvents from "@/components/events/FilterSearchEvents";
import EventCategoryList from "@/components/events/Eventcategorylist";
import PopularEventBanner from "@/components/events/PopularEventBanner";
import EnableLocation from "@/components/events/EnableLocation";
import SearchIcon from "@/assets/Event/serachIcon.png";
import FilterButtonIcon from "@/assets/Event/FilterButton.png";

// Reusable EventRow component matching the nearby page design
function EventRow({
  title,
  events,
  onSeeAll,
}: {
  title: string;
  events: any[];
  onSeeAll?: () => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const { themeStyles, isDark } = useTheme();

  const scroll = (dir: "left" | "right") => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.8;
      rowRef.current.scrollBy({
        left: dir === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!events || !events.length) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-semibold text-base" style={{ color: themeStyles.text }}>{title}</h3>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-xs font-medium"
            style={{
              background:
                "linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            see all
          </button>
        )}
      </div>

      <div className="relative group/row">
        <button
          onClick={() => scroll("left")}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 shadow-lg hover:scale-110 active:scale-95"
          style={{ 
            background: isDark ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.9)", 
            border: `1px solid ${themeStyles.border}`,
            backdropFilter: "blur(8px)"
          }}
        >
          <ChevronLeft className="w-5 h-5" style={{ color: themeStyles.text }} />
        </button>

        <button
          onClick={() => scroll("right")}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 shadow-lg hover:scale-110 active:scale-95"
          style={{ 
            background: isDark ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.9)", 
            border: `1px solid ${themeStyles.border}`,
            backdropFilter: "blur(8px)"
          }}
        >
          <ChevronRight className="w-5 h-5" style={{ color: themeStyles.text }} />
        </button>

        <div
          ref={rowRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 px-1"
        >
          {events.map((ev, idx) => (
            <EventCard key={`${ev._id ?? "ev"}-${idx}`} event={ev} showDistance={true} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CategoryEventsPage() {
  const authData = useAuth(true);
  const user: any = (authData as any)?.user ?? null;
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category");

  const { isCollapsed, isMobile } = useSidebar();

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [hasActiveSearch, setHasActiveSearch] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterEventsParams>({});
  const [isUsingAdvancedFilter, setIsUsingAdvancedFilter] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const {
    eventsByCategory,
    categories,
    totalEvents,
    suggestionsByCategory,
    hasSuggestions,
    totalSuggestions,
    loading,
    error,
    locationSource,
    currentSearchType,
    fetchInitialEvents,
    searchByName,
    searchByCategory,
    searchByLocation,
    searchByCurrentLocation,
    clearAndReset,
    popularEvents,
    fetchPopularEvents,
  } = useEventSearch();

  const { themeStyles, isDark } = useTheme();

  const {
    eventsByCategory: filteredEventsByCategory,
    loading: filterLoading,
    error: filterError,
    appliedFilters,
    totalEvents: filteredTotalEvents,
    filterEvents,
    clearFilters,
  } = useFilteredEvents();

  const displayEventsByCategory = isUsingAdvancedFilter
    ? filteredEventsByCategory
    : eventsByCategory;
  const displayLoading = isUsingAdvancedFilter ? filterLoading : loading;
  const displayError = isUsingAdvancedFilter ? filterError : error;
  const displayEventsByCategoryWithSubEventLogic = Object.fromEntries(
    Object.entries(displayEventsByCategory).map(([category, events]) => [
      category,
      (events as any[]).filter(
        (event: any) => !("isSubEvent" in event && event.isSubEvent)
      ),
    ])
  );

  // Initial load
  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
      setHasActiveSearch(true);
      searchByCategory(categoryFromUrl);
    } else {
      fetchInitialEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFromUrl]);

  // Periodic refresh of event stats every 10 seconds when page is visible
  useEffect(() => {
    if (typeof window === "undefined") return;
    const refreshInterval = setInterval(() => {
      if (!document.hidden) {
        Object.values(displayEventsByCategoryWithSubEventLogic).forEach(
          (events: any) => {
            events.forEach((event: any) => {
              if (event.loadEventStats) event.loadEventStats();
            });
          }
        );
      }
    }, 10000);
    return () => clearInterval(refreshInterval);
  }, [displayEventsByCategoryWithSubEventLogic]);

  // Location Handlers
  const handleLocationGranted = async (coords: {
    latitude: number;
    longitude: number;
    displayName?: string;
  }) => {
    setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
    setLocationModalOpen(false);
    setIsUsingAdvancedFilter(false);
    setSelectedCategory(undefined);
    try {
      await searchByLocation({ location: "Current Location", ...coords });
      setHasActiveSearch(true);
    } catch (err: any) {
      alert(err.message || "Failed to search location");
    }
  };

  const handleManualLocation = async (location: string) => {
    setLocationModalOpen(false);
    if (!location.trim()) return;
    try {
      setIsUsingAdvancedFilter(false);
      setSelectedCategory(undefined);
      await searchByLocation({ location: location.trim() });
      setHasActiveSearch(true);
    } catch (err: any) {
      alert(err.message || "Failed to search location");
    }
  };

  // Search Handlers
  const handleEventNameSearch = async () => {
    if (!searchInput.trim()) return;
    try {
      setIsUsingAdvancedFilter(false);
      setSelectedCategory(undefined);
      await searchByName(searchInput.trim());
      setHasActiveSearch(true);
    } catch (err: any) {
      alert(err.message || "Failed to search events");
    }
  };

  const handleClearSearch = async () => {
    setSelectedCategory(undefined);
    setSearchInput("");
    setHasActiveSearch(false);
    setIsUsingAdvancedFilter(false);
    setActiveFilters({});
    clearFilters();
    try {
      await clearAndReset();
    } catch (err: any) {
      console.error("Failed to reset search", err);
    }
  };

  // Advanced Filters Handler
  const handleApplyAdvancedFilters = async (
    response: any,
    filters: FilterEventsParams
  ) => {
    try {
      setActiveFilters(filters);
      setIsUsingAdvancedFilter(true);
      setHasActiveSearch(true);

      if (user?.latitude && user?.longitude && !filters.location) {
        filters.latitude = user.latitude;
        filters.longitude = user.longitude;
      }

      await filterEvents(filters);

      // Refresh popular events based on new filters
      if (filters.category) {
        fetchPopularEvents(filters.category);
      } else if (filters.searchQuery) {
        fetchPopularEvents(undefined, 10, filters.searchQuery);
      } else {
        fetchPopularEvents();
      }

      setIsFilterModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to apply filters");
    }
  };

  const sidebarWidth = isMobile ? 0 : isCollapsed ? 92 : 281;

  const renderContent = () => {
    if (displayLoading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        </div>
      );
    }

    if (displayError) {
      return (
        <div className="p-4 rounded-2xl bg-red-900/20 border border-red-900/50 flex items-center justify-center">
          <p className="text-red-400">{displayError}</p>
        </div>
      );
    }

    const hasMainResults = Object.keys(displayEventsByCategoryWithSubEventLogic).length > 0;
    const hasSuggestionResults = Object.keys(suggestionsByCategory).length > 0;

    let elements: JSX.Element[] = [];

    // Popular Events Section (if category is selected or searched)
    if (popularEvents && popularEvents.length > 0) {
      const activeCategory = selectedCategory || activeFilters.category;
      const popularTitle = activeCategory
        ? `Popular in ${activeCategory}`
        : searchInput
          ? `Popular for "${searchInput}"`
          : "Popular Events";

      elements.push(
        <PopularEventBanner
          key="popular-events"
          title={popularTitle}
          events={popularEvents}
          onViewAll={() => {
            const category = selectedCategory || activeFilters.category;
            if (category) {
              router.push(`/events/categories?category=${encodeURIComponent(category)}`);
            }
          }}
        />
      );
    }

    // Main Results
    if (hasMainResults) {
      Object.entries(displayEventsByCategoryWithSubEventLogic).forEach(
        ([category, events]) => {
          elements.push(
            <EventRow
              key={`main-${category}`}
              title={`${category} (${(events as any[]).length})`}
              events={events as any[]}
              onSeeAll={selectedCategory ? undefined : () => {
                router.push(`/events/categories?category=${encodeURIComponent(category)}`);
              }}
            />
          );
        }
      );
    }

    // Empty State
    if (!hasMainResults && !displayLoading) {
      elements.push(
        <div
          key="empty"
          className="py-12 text-center border rounded-2xl flex flex-col items-center justify-center min-h-[200px]"
          style={{
            backgroundColor: themeStyles.cardBg.includes('gradient') ? 'transparent' : themeStyles.cardBg,
            backgroundImage: themeStyles.cardBg.includes('gradient') ? themeStyles.cardBg : 'none',
            borderColor: themeStyles.border
          }}
        >
          <AlertCircle className="w-12 h-12 mb-4" style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }} />
          <p className="text-lg mb-2" style={{ color: themeStyles.textSecondary }}>
            {currentSearchType === "location"
              ? `No events found in this location`
              : currentSearchType === "category" && selectedCategory
              ? `No events found for "${selectedCategory}" in your area`
              : currentSearchType === "name" && searchInput
              ? `No events found matching "${searchInput}"`
              : "No events found"}
          </p>
          <button
            onClick={handleClearSearch}
            className="mt-4 text-purple-400 hover:text-purple-300 font-semibold transition-colors flex items-center gap-2 px-4 py-2"
          >
            <RotateCcw className="w-4 h-4" />
            Clear filters and view all events
          </button>
        </div>
      );
    }

    // Suggestions Section
    if (!isUsingAdvancedFilter && hasSuggestions && hasSuggestionResults && !hasMainResults) {
      elements.push(
        <div key="suggestions" className="mt-8 pt-8 border-t" style={{ borderTopColor: themeStyles.border }}>
          <div className="mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: themeStyles.text }}>
              <AlertCircle className="w-5 h-5 text-purple-400" />
              Suggested Events Nearby
            </h3>
            <p className="text-sm mt-1" style={{ color: themeStyles.textSecondary }}>
              {`We found ${totalSuggestions} event(s) in nearby areas that might interest you`}
            </p>
          </div>

          {Object.entries(suggestionsByCategory).map(([category, events]) => (
            <EventRow
              key={`suggestion-${category}`}
              title={`${category} (${(events as any[]).length} suggested)`}
              events={events as any[]}
              onSeeAll={() => {
                router.push(`/events/categories?category=${encodeURIComponent(category)}`);
              }}
            />
          ))}
        </div>
      );
    }

    return elements;
  };

  return (
    <div className="min-h-screen">
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <SideBar />

      <div
        className="flex-1 min-h-screen transition-colors duration-300"
        style={{
          marginLeft: `${sidebarWidth}px`,
          backgroundColor: themeStyles.background,
        }}
      >
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div
              className="flex items-center gap-3 w-full px-4"
              style={{
                height: 48,
                borderRadius: 10,
                background: isDark ? "#38383866" : "#E5E7EB",
                border: `1px solid ${isDark ? "#3D4149" : "#D1D5DB"}`,
              }}
            >
              {/* Location button */}
              <button
                onClick={() => setLocationModalOpen(true)}
                className="flex items-center gap-1.5 flex-shrink-0 px-2 py-1 rounded-lg transition-all"
                style={{
                  background: locationSource !== "none" ? "rgba(136,96,217,0.18)" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"),
                  border: "1px solid " + (locationSource !== "none" ? "rgba(136,96,217,0.4)" : (isDark ? "#3D4149" : "#D1D5DB")),
                  maxWidth: 160,
                }}
                title="Set location"
              >
                {locationSource === "gps" || userLocation ? (
                  <Navigation className="w-3 h-3 text-green-400 flex-shrink-0" />
                ) : locationSource !== "none" ? (
                  <MapPin className="w-3 h-3 text-purple-400 flex-shrink-0" />
                ) : (
                  <MapPin className={`w-3 h-3 flex-shrink-0 ${isDark ? "text-white/30" : "text-black/30"}`} />
                )}
                <span
                  className="text-xs truncate font-medium"
                  style={{
                    color: locationSource !== "none" ? (isDark ? "#c4b5fd" : "#8860D9") : (isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)"),
                    maxWidth: 110,
                  }}
                >
                  {locationSource !== "none" ? "Map Location Active" : "Set location"}
                </span>
              </button>

              <div className="w-px h-5 flex-shrink-0" style={{ background: isDark ? "#3D4149" : "#D1D5DB" }} />

              <Image
                src={SearchIcon}
                alt="Search"
                width={16}
                height={16}
                style={{ opacity: 0.5, flexShrink: 0, filter: isDark ? 'none' : 'invert(1)' }}
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEventNameSearch()}
                placeholder="Search events, categories..."
                className={`flex-1 bg-transparent text-sm outline-none min-w-0 ${isDark ? "text-white placeholder-white/25" : "text-black placeholder-black/40"}`}
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    if (hasActiveSearch) handleClearSearch();
                  }}
                  className={`${isDark ? "text-white/40 hover:text-white/70" : "text-black/40 hover:text-black/60"} text-xs transition-colors flex-shrink-0`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => setIsFilterModalOpen(true)}
                className={`flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg transition-all relative ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
                style={{ border: `1px solid ${isDark ? "#3D4149" : "#D1D5DB"}` }}
              >
                <Image src={FilterButtonIcon} alt="Filter" width={16} height={16} />
                {Object.keys(activeFilters).length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active Filter Chips */}
          {(hasActiveSearch || Object.keys(activeFilters).length > 0) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeFilters.category && (
                <span
                  className={`px-3 py-1 rounded-full text-xs ${isDark ? "text-white/80" : "text-black/70"}`}
                  style={{ background: isDark ? "#2D3139" : "#E5E7EB", border: `1px solid ${isDark ? "#3D4149" : "#D1D5DB"}` }}
                >
                  {activeFilters.category.split(',')[0].trim()}
                </span>
              )}
              {activeFilters.radius && (
                <span
                  className={`px-3 py-1 rounded-full text-xs ${isDark ? "text-white/80" : "text-black/70"}`}
                  style={{ background: isDark ? "#2D3139" : "#E5E7EB", border: `1px solid ${isDark ? "#3D4149" : "#D1D5DB"}` }}
                >
                  {activeFilters.radius} km
                </span>
              )}
              {selectedCategory && (
                <span
                  className={`px-3 py-1 rounded-full text-xs ${isDark ? "text-white/80" : "text-black/70"}`}
                  style={{ background: isDark ? "#2D3139" : "#E5E7EB", border: `1px solid ${isDark ? "#3D4149" : "#D1D5DB"}` }}
                >
                  {selectedCategory}
                </span>
              )}
              <button
                onClick={handleClearSearch}
                className={`px-3 py-1 rounded-full text-xs transition-colors border ${isDark ? "text-red-400 hover:text-red-300 bg-[#2D3139] border-[#3D4149]" : "text-red-600 hover:text-red-500 bg-white border-[#D1D5DB]"}`}
              >
                Clear All
              </button>
            </div>
          )}

          {/* Event Categories List */}
          <div className="mb-6">
            <EventCategoryList />
          </div>

          {/* Results Sections */}
          <div className="space-y-6">
            {renderContent()}
          </div>
        </div>
      </div>

      <FilterSearchEvents
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyAdvancedFilters}
        initialFilters={activeFilters}
        userLocation={userLocation}
      />

      <EnableLocation
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onLocationGranted={handleLocationGranted}
        onManualLocation={handleManualLocation}
      />
    </div>
  );
}
