"use client";

import { useEffect, useRef } from "react";
import {
  injectInvisibleWatermark,
  showVisibleWatermark,
} from "@/utils/fluxWatermark";
import { reportFluxScreenshot } from "@/services/mediaService";

interface ScreenshotProtectionOptions {
  enabled: boolean;
  fluxId: string | null;
  isOwner: boolean;
  userId: string;
  username?: string;
  alwaysReport?: boolean;  
  onDetected?: () => void;
}

export const useScreenshotProtection = ({
  enabled,
  fluxId,
  isOwner,
  userId,
  username = "viewer",
  alwaysReport = false,
  onDetected,
}: ScreenshotProtectionOptions) => {
  const cleanupWmRef = useRef<(() => void) | null>(null);
  const detectedRef = useRef(false);

  // ── Show the screenshot-detected overlay ──────────────────────────────────
  const showDetectedOverlay = () => {
    document.getElementById("flux-detected-overlay")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "flux-detected-overlay";
    Object.assign(overlay.style, {
      position:        "fixed",
      inset:           "0",
      width:           "100vw",
      height:          "100vh",
      background:      "rgba(0,0,0,0.96)",
      zIndex:          "2147483647",
      display:         "flex",
      flexDirection:   "column",
      alignItems:      "center",
      justifyContent:  "center",
      gap:             "14px",
      color:           "#fff",
      textAlign:       "center",
      padding:         "32px",
      transform:       "translateZ(0)",
      backdropFilter:  "blur(20px)",
    });

    overlay.innerHTML = `
      <div style="font-size:56px;line-height:1;margin-bottom:4px">🔒</div>
      <p style="font-size:18px;font-weight:800;max-width:320px;line-height:1.4;margin:0;letter-spacing:-0.3px">
        Screenshot detected
      </p>
      <p style="font-size:13px;color:rgba(255,255,255,0.55);max-width:300px;line-height:1.8;margin:0">
        This flux is watermarked with your account ID.<br/>
        Any shared screenshots can be traced back to you.
      </p>
      <div style="
        margin-top:4px;
        padding:10px 20px;
        borderRadius:10px;
        background:rgba(239,68,68,0.12);
        border:1px solid rgba(239,68,68,0.3);
        border-radius:10px;
        max-width:300px;
      ">
        <p style="font-size:12px;color:#ef4444;margin:0;line-height:1.6;font-weight:600">
          ⚠️ The content creator has been notified.
        </p>
      </div>
      <button id="flux-detected-dismiss" style="
        margin-top:8px;padding:13px 36px;border:none;border-radius:28px;
        background:linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%);
        color:#fff;font-size:14px;font-weight:700;cursor:pointer;
        box-shadow:0 4px 20px rgba(136,96,217,0.5);
      ">Continue viewing</button>
    `;

    document.body.appendChild(overlay);

    document.getElementById("flux-detected-dismiss")
      ?.addEventListener("click", () => {
        overlay.remove();
        detectedRef.current = false;
        showVisibleWatermark(false);
      });

    // Show visible watermark at the same time
    showVisibleWatermark(true);
    onDetected?.();
  };

    // Inject watermark whenever flux or user changes 
    useEffect(() => {
    // Never watermark for owner or missing data
    if (isOwner || !fluxId || !userId) {
        cleanupWmRef.current?.();
        cleanupWmRef.current = null;
        return;
    }

    const t = setTimeout(() => {
        cleanupWmRef.current?.();
        cleanupWmRef.current = injectInvisibleWatermark({
        userId,
        fluxId,
        username,
        });
    }, 300);

    return () => {
        clearTimeout(t);
        cleanupWmRef.current?.();
        cleanupWmRef.current = null;
    };
    // ── Removed `enabled` from deps — watermark always active for viewers ──
    }, [isOwner, fluxId, userId, username]);

    // ── Detection listeners
    useEffect(() => {
    // Always clean up overlay when owner or no fluxId
    if (isOwner || !fluxId) {
        document.getElementById("flux-detected-overlay")?.remove();
        document.body.classList.remove("flux-protection-active");
        return;
    }

    // Active protection class only when blocking is enabled
    if (enabled) {
        document.body.classList.add("flux-protection-active");
    }

    const reportToBackend = () => {
    if (!fluxId) return;
    const platform =
        /iPhone|iPad|Android/i.test(navigator.userAgent) ? "mobile" : "web";
    reportFluxScreenshot(fluxId, platform).catch(() => {});
    };

    const trigger = () => {
      // Always report to backend — backend decides whether to notify based on owner settings
      reportToBackend();

      if (detectedRef.current) return;
      detectedRef.current = true;

      // Show overlay only when blocking is enabled
      if (enabled) {
        showDetectedOverlay();
      }

      onDetected?.();
    };

    const onBlur = () => trigger();

    const onVisibilityChange = () => {
        if (document.visibilityState === "hidden") trigger();
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (
        e.key === "PrintScreen" ||
        (e.metaKey && e.shiftKey && ["3", "4", "5", "s", "S"].includes(e.key)) ||
        (e.key === "s" && e.shiftKey && (e.metaKey || e.ctrlKey))
        ) {
        e.preventDefault();
        trigger();
        }
    };

    const onContextMenu = (e: MouseEvent) => {
        if ((e.target as HTMLElement)?.closest("[data-flux-card]")) {
        e.preventDefault();
        }
    };

    const onDragStart = (e: DragEvent) => {
        if ((e.target as HTMLElement)?.closest("[data-flux-card]")) {
        e.preventDefault();
        }
    };

    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("keydown", onKeyDown, { capture: true });
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);

    return () => {
        window.removeEventListener("blur", onBlur);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        document.removeEventListener("keydown", onKeyDown, { capture: true });
        document.removeEventListener("contextmenu", onContextMenu);
        document.removeEventListener("dragstart", onDragStart);
        document.getElementById("flux-detected-overlay")?.remove();
        document.body.classList.remove("flux-protection-active");
    };
    // ── Depends on fluxId and isOwner only — not on enabled ──
    // This ensures listeners attach even when blocking is off
    }, [fluxId, isOwner]);

  // Reset on flux change
  useEffect(() => {
    detectedRef.current = false;
    document.getElementById("flux-detected-overlay")?.remove();
  }, [fluxId]);
};