"use client";

import React from "react";
import Image from "next/image";
import Music from "@/assets/post/musicIcon.png";
import TextIcon from "@/assets/post/TextIcon.png";
import Sticker from "@/assets/post/stickerIcon.png";
import Filter from "@/assets/post/filtersIcon.png";
import ReDo from "@/assets/post/redoIcon.png";
import Undo from "@/assets/post/undoIcon.png";
import More from "@/assets/post/moreIcon.png";

export type FluxTool =
  | "music"
  | "text"
  | "sticker"
  | "filter"
  | "mention"
  | "location"
  | "undo"
  | "redo"
  | "more"
  | null;

interface FluxToolbarProps {
  activeTool: FluxTool;
  onSelect: (tool: FluxTool) => void;
  onUndo: () => void;
  onRedo: () => void;
}

const GRADIENT = "linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)";

const tools: { id: FluxTool; icon: any; label: string; isAction?: boolean }[] = [
  { id: "music",   icon: Music,    label: "Music" },
  { id: "sticker", icon: Sticker,  label: "Sticker" },
  { id: "mention", icon: null,     label: "Mention" },
  { id: "text",    icon: TextIcon, label: "Text" },
  { id: "filter",  icon: Filter,   label: "Filter" },
  { id: "undo",    icon: Undo,     label: "Undo",  isAction: true },
  { id: "redo",    icon: ReDo,     label: "Redo",  isAction: true },
  { id: "more",    icon: More,     label: "More" },
];

export default function FluxToolbar({
  activeTool,
  onSelect,
  onUndo,
  onRedo,
}: FluxToolbarProps) {
  const handleClick = (tool: FluxTool) => {
    if (tool === "undo") { onUndo(); return; }
    if (tool === "redo") { onRedo(); return; }
    onSelect(activeTool === tool ? null : tool);
  };

  return (
    <div
      className="flex flex-col items-center"
      style={{ width: 42, gap: 24 }}
    >
      {tools.map(({ id, icon, label }) => {
        const isActive = activeTool === id;
        return (
          <button
            key={id}
            onClick={() => handleClick(id)}
            title={label}
            className="flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
            style={{
              width: 42,
              height: 42,
              borderRadius: 50,
              padding: 6,
              background: isActive ? GRADIENT : "rgba(255,255,255,0.08)",
              border: isActive ? "none" : "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
            }}
          >
            {icon ? (
              <Image
                src={icon}
                alt={label}
                width={22}
                height={22}
                className="object-contain"
                style={{
                  filter: isActive
                    ? "brightness(0) invert(1)"
                    : "brightness(0) invert(0.7)",
                }}
              />
            ) : (
              // Mention — @  symbol
              <span
                className="text-[15px] font-bold"
                style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.7)" }}
              >
                @
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}