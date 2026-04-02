"use client";
import React from "react";
import { X } from "lucide-react";

interface MoreModalProps {
  onClose:              () => void;
  onDelete:             () => void;
  onArchive:            () => void;
  onSave:               () => void;
  onHighlight:          () => void;
  onCopyLink:           () => void;
  onShare:              () => void;
  onSettings:           () => void;
  onComments:           () => void;
  onRemoveMention?:     () => void;
  onToggleComments?:    () => void;
  isOwner:              boolean;
  isMentioned:          boolean;
  commentsDisabled?:    boolean;
  isArchived?:          boolean;
}

export default function MoreModal({
  onClose, onDelete, onArchive, onSave, onHighlight,
  onCopyLink, onShare, onSettings, onComments,
  onRemoveMention, onToggleComments,
  isOwner, isMentioned,
  commentsDisabled = false,
  isArchived = false,
}: MoreModalProps) {

  const ITEMS: { key: string; label: string; danger?: boolean; sub?: string }[] = [
    ...(isOwner ? [
      { key: "delete",          label: "Delete story",                    danger: true  },
      { key: "archive",         label: isArchived ? "Unarchive" : "Archive story"       },
      { key: "save",            label: "Save to device",
        sub: "Download this flux to your device"                                         },
      { key: "highlight",       label: "Add to diary",
        sub: "Save this flux to a diary highlight"                                       },
      { key: "toggleComments",  label: commentsDisabled
          ? "Turn on commenting"
          : "Turn off commenting",
        sub: commentsDisabled
          ? "Allow people to comment on this flux"
          : "No one can comment on this flux"                                            },
      { key: "settings",        label: "Go to flux settings"                            },
    ] : []),

    ...(isMentioned && !isOwner ? [
      { key: "removeMention",   label: "Remove from my stories",          danger: true  },
    ] : []),

    { key: "link",              label: "Copy link"                                      },
    { key: "share",             label: "Share"                                          },
  ];

  const handlers: Record<string, () => void> = {
    delete:         onDelete,
    archive:        onArchive,
    save:           onSave,
    highlight:      onHighlight,
    toggleComments: onToggleComments ?? (() => {}),
    settings:       onSettings,
    removeMention:  onRemoveMention ?? (() => {}),
    link:           onCopyLink,
    share:          onShare,
    comments:       onComments,
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
        paddingRight: 40, paddingBottom: 20,
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
      }}
    >
      <div style={{
        width: 430, maxHeight: 560, borderRadius: 12,
        background: "#16161A", border: "1px solid rgba(255,255,255,0.07)",
        display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "18px 20px 14px", position: "relative", flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <span style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>Options</span>
          <button
            onClick={onClose}
            style={{
              position: "absolute", right: 18, background: "none",
              border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)",
              display: "flex", padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div style={{ overflowY: "auto", flex: 1, scrollbarWidth: "none" }}>
          {ITEMS.map((item, i) => (
            <button
              key={item.key}
              onClick={() => { handlers[item.key]?.(); onClose(); }}
              style={{
                display: "flex", flexDirection: "column",
                width: "100%", textAlign: "left",
                padding: item.sub ? "12px 24px" : "15px 24px",
                background: "transparent", border: "none", cursor: "pointer",
                borderBottom: i < ITEMS.length - 1
                  ? "1px solid rgba(255,255,255,0.05)"
                  : "none",
                transition: "background 0.14s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <span style={{
                color: item.danger ? "#e53e3e" : "#fff",
                fontSize: 15, fontWeight: item.danger ? 600 : 400,
                letterSpacing: 0.1,
              }}>
                {item.label}
              </span>
              {item.sub && (
                <span style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: 12, marginTop: 2,
                }}>
                  {item.sub}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
