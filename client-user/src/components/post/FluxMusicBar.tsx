"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Play, Pause, Volume2, VolumeX } from "lucide-react";

interface FluxMusicBarProps {
  songTitle:    string;
  artistName:   string;
  albumArt?:    string | null;
  previewUrl?:  string | null;
  isPlaying:    boolean;                    // controlled from parent
  onPlayPause:  () => void;                 // controlled from parent
  onMuteToggle: (muted: boolean) => void;   // controlled from parent
  onRemove:     () => void;
}

export default function FluxMusicBar({
  songTitle,
  artistName,
  albumArt,
  previewUrl,
  isPlaying,
  onPlayPause,
  onMuteToggle,
  onRemove,
}: FluxMusicBarProps) {
  const [isMuted,  setIsMuted]  = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  // ── Progress animation — driven by RAF (no own Audio instance) ─────────────
  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    let startTime: number | null = null;
    const DURATION = 30000; // 30s preview max

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = (now - startTime) % DURATION;
      setProgress(elapsed / DURATION);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  // Reset progress when song changes
  useEffect(() => {
    setProgress(0);
    setIsMuted(false);
  }, [previewUrl]);

  const handleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    onMuteToggle(next);
  };

  const BAR_COUNT = 48;
  const heights   = [40, 70, 55, 85, 45, 95, 60, 75, 50, 80];

  return (
    <div
      className="flex items-center gap-2.5 flex-shrink-0"
      style={{
        width: 340,
        borderRadius: 12,
        background: "rgba(18,18,20,0.95)",
        border: "1px solid rgba(255,255,255,0.09)",
        backdropFilter: "blur(20px)",
        padding: "9px 12px",
      }}
    >
      {/* Album art */}
      <div
        className="relative w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden"
        style={{ background: "linear-gradient(135deg,#6B3FA0,#2979FF)" }}
      >
        {albumArt && (
          <img src={albumArt} alt={songTitle} className="w-full h-full object-cover" />
        )}
        {isPlaying && (
          <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
            <div className="flex gap-[2px] items-end h-[10px]">
              {[55, 100, 70].map((h, i) => (
                <div
                  key={i}
                  className="w-[2px] rounded-full bg-white animate-bounce"
                  style={{ height: `${h}%`, animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Song info */}
      <div className="flex flex-col justify-center" style={{ width: 72, flexShrink: 0 }}>
        <p className="text-white text-[11px] font-semibold truncate leading-tight">
          {songTitle}
        </p>
        <p className="text-white/40 text-[10px] truncate">{artistName}</p>
      </div>

      {/* Waveform */}
      <div className="flex-1 flex items-end gap-[1.5px] overflow-hidden" style={{ height: 28 }}>
        {Array.from({ length: BAR_COUNT }).map((_, i) => {
          const isPast = i / BAR_COUNT <= progress;
          return (
            <div
              key={i}
              className="flex-1 rounded-full"
              style={{
                height: `${heights[i % heights.length]}%`,
                background: isPast
                  ? "linear-gradient(180deg,#B3B8E2,#8860D9)"
                  : "rgba(255,255,255,0.1)",
                transition: "background 0.08s",
              }}
            />
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Play / Pause */}
        <button
          onClick={onPlayPause}
          disabled={!previewUrl}
          className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30"
          style={{
            background: "rgba(136,96,217,0.35)",
            border: "1px solid rgba(136,96,217,0.55)",
          }}
          title={!previewUrl ? "No preview available" : isPlaying ? "Pause" : "Play"}
        >
          {isPlaying
            ? <Pause size={9} className="text-white fill-white" />
            : <Play  size={9} className="text-white fill-white" />
          }
        </button>

        {/* Sound on / off */}
        <button
          onClick={handleMute}
          className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{
            background: isMuted ? "rgba(136,96,217,0.25)" : "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
          title={isMuted ? "Sound on" : "Sound off"}
        >
          {isMuted
            ? <VolumeX size={9} className="text-white/50" />
            : <Volume2 size={9} className="text-white" />
          }
        </button>

        {/* Remove */}
        <button
          onClick={onRemove}
          className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
          title="Remove"
        >
          <X size={9} className="text-white/45" />
        </button>
      </div>
    </div>
  );
}