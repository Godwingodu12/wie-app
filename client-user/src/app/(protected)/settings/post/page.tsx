"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Film, BookOpen, ChevronRight, Zap, Star, Clock } from "lucide-react";

const PURPLE = "linear-gradient(135deg,#8860D9,#B3B8E2)";
const GREEN  = "linear-gradient(135deg,#22c55e,#16a34a)";
const BLUE   = "linear-gradient(135deg,#3b82f6,#6366f1)";

interface NavCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  accent: string;
  badge?: string;
}

const cards: NavCard[] = [
  {
    icon: <Film size={22} color="#fff" />,
    title: "Flux Settings",
    description: "Privacy, interactions, close friends, story duration & advanced controls",
    href: "/settings/post/flux",
    accent: PURPLE,
  },
  {
    icon: <BookOpen size={22} color="#fff" />,
    title: "Diary Settings",
    description: "Manage your diaries, visibility, and archived story collections",
    href: "/settings/post/diary",
    accent: BLUE,
  },
];

export default function PostSettingsPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100%",
        background: "transparent",
        color: "#fff",
        fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
        padding: "24px",
      }}
    >
      {/* Section title */}
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 20 }}>
        Post & Flux
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {cards.map((card) => (
          <button
            key={card.href}
            onClick={() => router.push(card.href)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "18px 20px",
              borderRadius: 16,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
          >
            {/* Icon bubble */}
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: card.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              }}
            >
              {card.icon}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>
                  {card.title}
                </span>
                {card.badge && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "1px 8px",
                      borderRadius: 8,
                      background: "rgba(136,96,217,0.25)",
                      color: "#B3B8E2",
                    }}
                  >
                    {card.badge}
                  </span>
                )}
              </div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                {card.description}
              </p>
            </div>

            <ChevronRight size={18} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} />
          </button>
        ))}
      </div>

      {/* Info note */}
      <div
        style={{
          marginTop: 24,
          padding: "14px 16px",
          borderRadius: 12,
          background: "rgba(136,96,217,0.07)",
          border: "1px solid rgba(136,96,217,0.18)",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.7, margin: 0 }}>
          Changes to Flux Settings apply to all new fluxes. Existing fluxes retain their original settings unless edited individually.
        </p>
      </div>
    </div>
  );
}
