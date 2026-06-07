"use client";
import React from "react";
import { useTheme } from "@/components/home/ThemeContext";
import { EventCard } from "@/components/events/EventCard";
import type { EventWithLocation } from "@/types/ticket";

interface ExploreEventGridProps {
  events: any[];
  loading: boolean;
  isLive?: boolean;
}

export default function ExploreEventGrid({ events, loading, isLive }: ExploreEventGridProps) {
  const { themeStyles } = useTheme();

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array(8).fill(null).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: themeStyles.cardBg, height: 290 }}>
            <div className="h-40" style={{ background: themeStyles.pillBg }} />
            <div className="p-3 flex flex-col gap-2">
              <div className="h-3 w-3/4 rounded-full" style={{ background: themeStyles.pillBg }} />
              <div className="h-2.5 w-1/2 rounded-full" style={{ background: themeStyles.pillBg }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 gap-3">
        <span className="text-5xl">🎪</span>
        <p className="text-sm" style={{ color: themeStyles.textSecondary }}>
          {isLive ? "No live events right now" : "No events found"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4 justify-start">
      {events.map(event => (
        <EventCard
          key={event._id}
          event={event as EventWithLocation}
          showDistance={!!event.distance}
          isLiked={event.isLiked ?? false}
          isCancelled={event.event_status === "cancelled"}
        />
      ))}
    </div>
  );
}