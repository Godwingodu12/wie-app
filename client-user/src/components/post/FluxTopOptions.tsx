"use client";

import React from "react";
import { MapPin, AtSign } from "lucide-react";

type Duration = 15 | 30 | 60;

interface FluxTopOptionsProps {
  duration: Duration;
  onDurationChange: (d: Duration) => void;
  onMentionClick: () => void;
  onLocationClick: () => void;
  activeTool: string | null;
}

const GRADIENT = "linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)";

export default function FluxTopOptions({
  duration,
  onDurationChange,
  onMentionClick,
  onLocationClick,
  activeTool,
}: FluxTopOptionsProps) {
  const durations: Duration[] = [15, 30, 60];

  return (
    <div className="flex items-center" style={{ gap: 12 }}>
      {/* Duration Pills */}
      {durations.map((d) => (
        <button
          key={d}
          onClick={() => onDurationChange(d)}
          className="flex items-center justify-center text-[13px] font-semibold transition-all duration-200 hover:scale-105"
          style={{
            width: 42,
            height: 42,
            borderRadius: 50,
            background: duration === d ? GRADIENT : "rgba(255,255,255,0.08)",
            border: duration === d ? "none" : "1px solid rgba(255,255,255,0.15)",
            color: "#fff",
            backdropFilter: "blur(8px)",
          }}
        >
          {d}
        </button>
      ))}

      {/* Mention */}
      <button
        onClick={onMentionClick}
        className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white transition-all duration-200 hover:scale-105"
        style={{
          height: 42,
          borderRadius: 50,
          background:
            activeTool === "mention" ? GRADIENT : "rgba(255,255,255,0.08)",
          border:
            activeTool === "mention"
              ? "none"
              : "1px solid rgba(255,255,255,0.15)",
          backdropFilter: "blur(8px)",
          whiteSpace: "nowrap",
        }}
      >
        <AtSign size={15} />
        Mention
      </button>

      {/* Location */}
      <button
        onClick={onLocationClick}
        className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white transition-all duration-200 hover:scale-105"
        style={{
          height: 42,
          borderRadius: 50,
          background:
            activeTool === "location" ? GRADIENT : "rgba(255,255,255,0.08)",
          border:
            activeTool === "location"
              ? "none"
              : "1px solid rgba(255,255,255,0.15)",
          backdropFilter: "blur(8px)",
          whiteSpace: "nowrap",
        }}
      >
        <MapPin size={15} />
        Location
      </button>
    </div>
  );
}
