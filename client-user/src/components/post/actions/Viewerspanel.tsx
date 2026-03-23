"use client";
import React from "react";
import { X, Eye, Trash2, Send } from "lucide-react";

interface Viewer {
  id:     string;
  name:   string;
  avatar: string | null;
}

const DUMMY_VIEWERS: Viewer[] = [
  { id: "0", name: "Joyal",    avatar: null },
  { id: "1", name: "Sangeeth", avatar: null },
  ...Array.from({ length: 6 }, (_, i) => ({
    id:     String(i + 2),
    name:   "Joyal",
    avatar: null,
  })),
];

interface ViewersPanelProps {
  viewCount: number;
  onClose:   () => void;
  onDeleteStory: () => void;
}

export default function ViewersPanel({
  viewCount,
  onClose,
  onDeleteStory,
}: ViewersPanelProps) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position:       "fixed",
        inset:          0,
        zIndex:         200,
        display:        "flex",
        alignItems:     "flex-end",
        justifyContent: "flex-start",
        paddingLeft:    291,
        paddingBottom:  20,
        background:     "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          width:         344,
          height:        492,
          borderRadius:  12,
          background:    "#16161A",
          border:        "1px solid rgba(255,255,255,0.07)",
          display:       "flex",
          flexDirection: "column",
          overflow:      "hidden",
          boxShadow:     "0 24px 64px rgba(0,0,0,0.6)",
          padding:       24,
        }}
      >
        {/* ── Header */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          position:       "relative",
          marginBottom:   16,
          flexShrink:     0,
        }}>
          <span style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>Views</span>
          <button
            onClick={onClose}
            style={{
              position:   "absolute",
              right:      0,
              background: "none",
              border:     "none",
              cursor:     "pointer",
              color:      "rgba(255,255,255,0.5)",
              display:    "flex",
              padding:    4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── View count row */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          paddingBottom:  12,
          marginBottom:   8,
          borderBottom:   "1px solid rgba(255,255,255,0.06)",
          flexShrink:     0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Eye size={15} color="rgba(255,255,255,0.45)" />
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
              {viewCount} views
            </span>
          </div>
          <button
            onClick={onDeleteStory}
            style={{
              background: "none",
              border:     "none",
              cursor:     "pointer",
              display:    "flex",
              padding:    4,
            }}
          >
            <Trash2 size={16} color="#e53e3e" />
          </button>
        </div>

        {/* ── Viewer list */}
        <div style={{
          flex:           1,
          overflowY:      "auto",
          scrollbarWidth: "none",
          marginRight:    -8,
          paddingRight:   8,
        }}>
          {DUMMY_VIEWERS.map((v) => (
            <div
              key={v.id}
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:          12,
                padding:      "8px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              {/* Avatar */}
              <div style={{
                width:        40,
                height:       40,
                borderRadius: "50%",
                background:   "linear-gradient(135deg,#2a2a35,#3d3950)",
                border:       "1px solid rgba(255,255,255,0.08)",
                flexShrink:   0,
                overflow:     "hidden",
              }}>
                {v.avatar && (
                  <img src={v.avatar} alt={v.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>

              {/* Name */}
              <span style={{ flex: 1, color: "#fff", fontSize: 14, fontWeight: 500 }}>
                {v.name}
              </span>

              {/* Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", padding: 2,
                  color: "rgba(255,255,255,0.4)",
                }}>
                  <Send size={14} />
                </button>
                <button style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", padding: 2,
                }}>
                  <Trash2 size={14} color="rgba(229,62,62,0.7)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
