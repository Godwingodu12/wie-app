"use client";
import { useRouter } from "next/navigation";
import { Star, ArrowLeft } from "lucide-react";

export default function PostSettingsPage() {
  const router = useRouter();
  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0C", color: "#fff",
      fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12,
        padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
          <ArrowLeft size={16} />
        </button>
        <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>Flux Settings</h1>
      </div>

      <div style={{ padding: "12px 24px" }}>
        <button
          onClick={() => router.push("/settings/post/close-friends")}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 14,
            padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", textAlign: "left" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%",
            background: "linear-gradient(135deg,#22c55e,#16a34a)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Star size={18} color="#fff" fill="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, margin: 0 }}>Close Friends</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "3px 0 0" }}>
              Manage who sees your close friends stories
            </p>
          </div>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18 }}>›</span>
        </button>
      </div>
    </div>
  );
}