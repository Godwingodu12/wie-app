"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Ticket, Heart, Users, Radio } from "lucide-react";
import { useTheme } from "@/components/home/ThemeContext";
import type { EventWithLocation } from "@/types/ticket";

interface Props {
  events: any[];
  loading: boolean;
}

export default function ExploreFeaturedEvent({ events, loading }: Props) {
  const { themeStyles, isDark } = useTheme();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {Array(3).fill(null).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-72 h-40 rounded-2xl animate-pulse" style={{ background: themeStyles.pillBg }} />
        ))}
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      {events.slice(0, 8).map(event => {
        const thumb = event.event_banner ?? event.event_portrait ?? event.event_logo;
        const startDate = event.event_dates?.[0]?.start_date;
        const locationText = event.location_type === "online" ? "Online" : event.venue ?? event.location ?? "";
        const isLive = event.event_status === "live" || event.isLive;

        return (
          <div
            key={event._id}
            onClick={() => router.push(`/events/${event._id}`)}
            className="relative flex-shrink-0 w-72 h-40 rounded-2xl overflow-hidden cursor-pointer group"
          >
            {/* Background */}
            {thumb ? (
              <img src={thumb} alt={event.event_name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#1a1a2e,#2d1b4e)" }} />
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            {/* Live badge */}
            {isLive && (
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                <Radio size={8} className="animate-pulse" />LIVE
              </div>
            )}

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white font-bold text-sm leading-tight line-clamp-1 mb-1">{event.event_name}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-[10px]">{locationText}</p>
                  {startDate && (
                    <p className="text-white/60 text-[10px]">
                      {new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); router.push(`/events/${event._id}`); }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold text-white"
                  style={{ background: "rgba(136,96,217,0.85)", backdropFilter: "blur(4px)" }}
                >
                  <Ticket size={10} />Book tickets
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}