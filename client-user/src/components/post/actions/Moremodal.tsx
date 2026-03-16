"use client";
import React from "react";
import { X } from "lucide-react";

interface MoreModalProps {
  onClose:       () => void;
  onDelete:      () => void;
  onArchive:     () => void;
  onSave:        () => void;
  onHighlight:   () => void;
  onCopyLink:    () => void;
  onShare:       () => void;
  onMention:     () => void;
  onSettings:    () => void;
  onComments:    () => void;
}

const ITEMS = [
  { key: "delete",    label: "Delete Story",          danger: true  },
  { key: "archive",   label: "Archive",               danger: false },
  { key: "save",      label: "Saved Photo",           danger: false },
  { key: "highlight", label: "Highlight",             danger: false },
  { key: "link",      label: "Copy link",             danger: false },
  { key: "share",     label: "Share",                 danger: false },
  { key: "mention",   label: "Add Mention",           danger: false },
  { key: "settings",  label: "Go to Story settings",  danger: false },
  { key: "comments",  label: "Turn off Commenting",   danger: false },
];

export default function MoreModal({
  onClose, onDelete, onArchive, onSave, onHighlight,
  onCopyLink, onShare, onMention, onSettings, onComments,
}: MoreModalProps) {
  const handlers: Record<string, () => void> = {
    delete:    onDelete,
    archive:   onArchive,
    save:      onSave,
    highlight: onHighlight,
    link:      onCopyLink,
    share:     onShare,
    mention:   onMention,
    settings:  onSettings,
    comments:  onComments,
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position:       "fixed",
        inset:          0,
        zIndex:         200,
        display:        "flex",
        alignItems:     "flex-end",
        justifyContent: "flex-end",
        paddingRight:   40,
        paddingBottom:  20,
        background:     "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          width:         430,
          height:        450,
          borderRadius:  12,
          background:    "#16161A",
          border:        "1px solid rgba(255,255,255,0.07)",
          display:       "flex",
          flexDirection: "column",
          overflow:      "hidden",
          boxShadow:     "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* ── Header */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          padding:        "18px 20px 14px",
          position:       "relative",
          flexShrink:     0,
          borderBottom:   "1px solid rgba(255,255,255,0.06)",
        }}>
          <span style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>More</span>
          <button
            onClick={onClose}
            style={{
              position:   "absolute",
              right:      18,
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

        {/* ── List items */}
        <div style={{ overflowY: "auto", flex: 1, scrollbarWidth: "none" }}>
          {ITEMS.map((item, i) => (
            <button
              key={item.key}
              onClick={() => { handlers[item.key]?.(); onClose(); }}
              style={{
                display:      "block",
                width:        "100%",
                textAlign:    "left",
                padding:      "15px 24px",
                background:   "transparent",
                border:       "none",
                cursor:       "pointer",
                color:        item.danger ? "#e53e3e" : "#fff",
                fontSize:     15,
                fontWeight:   item.danger ? 600 : 400,
                borderBottom: i < ITEMS.length - 1
                  ? "1px solid rgba(255,255,255,0.05)"
                  : "none",
                transition:   "background 0.14s",
                letterSpacing: 0.1,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}