"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Check, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
export interface TextLayer {
  id:        string;
  text:      string;
  x:         number;
  y:         number;
  scale:     number;
  rotate:    number;
  color:     string;
  font:      string;
  align:     "left" | "center" | "right";
  fontSize:  number;
  effect:    TextEffect;
  animation: AnimationType;
  highlight: HighlightStyle;
}

export type TextEffect    = "none" | "neon" | "gradient" | "glass" | "shadow" | "highlight";
export type AnimationType = "none" | "fade" | "slideUp" | "zoom" | "bounce" | "typewriter" | "pulse" | "glow";
export type HighlightStyle = "none" | "box" | "rounded";

const FONTS = ["Inter", "Poppins", "Courier New", "Georgia", "Impact"];
const FONT_LABELS = ["Inter", "Poppins", "Typewriter", "Serif", "Bold"];

const COLORS = [
  "#ffffff", "#000000", "#FF3B30", "#FF9500", "#FFCC00",
  "#34C759", "#00C7BE", "#007AFF", "#5856D6", "#FF2D55",
  "#AF52DE", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
];

const BACKGROUNDS = [
  "#000000", "#1a1a2e", "#16213e", "#0f3460",
  "#FF3B30", "#FF9500", "#34C759", "#007AFF", "#5856D6",
  "linear-gradient(135deg,#667eea,#764ba2)",
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#fa709a,#fee140)",
  "linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "linear-gradient(135deg,#ffecd2,#fcb69f)",
  "linear-gradient(135deg,#ff9a9e,#fad0c4)",
  "linear-gradient(135deg,#2d3561,#c05c7e)",
];

const ANIMATIONS: { id: AnimationType; label: string; icon: string }[] = [
  { id: "none",       label: "None",       icon: "⊘"  },
  { id: "fade",       label: "Fade",       icon: "🌫"  },
  { id: "slideUp",    label: "Slide Up",   icon: "⬆"  },
  { id: "zoom",       label: "Zoom",       icon: "🔍"  },
  { id: "bounce",     label: "Bounce",     icon: "⬆⬇" },
  { id: "typewriter", label: "Type",       icon: "⌨"  },
  { id: "pulse",      label: "Pulse",      icon: "💓"  },
  { id: "glow",       label: "Glow",       icon: "✨"  },
];

const EFFECTS: { id: TextEffect; label: string }[] = [
  { id: "none",      label: "None"      },
  { id: "neon",      label: "Neon"      },
  { id: "gradient",  label: "Gradient"  },
  { id: "glass",     label: "Glass"     },
  { id: "shadow",    label: "Shadow"    },
  { id: "highlight", label: "Highlight" },
];

// ── Animation variants
function getAnimationProps(type: AnimationType) {
  switch (type) {
    case "fade":       return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.6 } };
    case "slideUp":    return { initial: { y: 60, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.5 } };
    case "zoom":       return { initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 0.4 } };
    case "bounce":     return { animate: { y: [0, -18, 0] }, transition: { repeat: Infinity, duration: 1.2, ease: "easeInOut" as const } };
    case "pulse":      return { animate: { scale: [1, 1.08, 1] }, transition: { repeat: Infinity, duration: 1.5 } };
    case "glow":       return { animate: { opacity: [1, 0.6, 1] }, transition: { repeat: Infinity, duration: 2 } };
    default:           return {};
  }
}

// ── Text effect styles 
function getEffectStyle(effect: TextEffect, color: string): React.CSSProperties {
  switch (effect) {
    case "neon":
      return {
        textShadow: `0 0 5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}, 0 0 40px ${color}`,
      };
    case "gradient":
      return {
        background:              "linear-gradient(45deg,#ff6b6b,#f7d794,#a8edea)",
        WebkitBackgroundClip:    "text",
        WebkitTextFillColor:     "transparent",
        backgroundClip:          "text",
      };
    case "glass":
      return {
        background:     "rgba(255,255,255,0.15)",
        backdropFilter: "blur(10px)",
        padding:        "8px 16px",
        borderRadius:   12,
        border:         "1px solid rgba(255,255,255,0.25)",
      };
    case "shadow":
      return { textShadow: "2px 2px 12px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)" };
    case "highlight":
      return {
        background:   "rgba(0,0,0,0.75)",
        padding:      "4px 10px",
        borderRadius: 6,
      };
    default:
      return {};
  }
}

// ── Typewriter component ───────────────────────────────────────────────────
function TypewriterText({ text }: { text: string }) {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    let i = 0;
    setDisplay("");
    const interval = setInterval(() => {
      i++;
      setDisplay(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  }, [text]);
  return <>{display}</>;
}

function DraggableTextLayer({ layer, isSelected, onSelect, onChange, containerRef }: {
  layer: TextLayer; isSelected: boolean;
  onSelect: () => void; onChange: (u: Partial<TextLayer>) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const [editing, setEditing] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; lx: number; ly: number } | null>(null);

  const getAnim = () => {
    switch (layer.animation) {
      case "fade":    return "txt-fade 0.6s ease forwards";
      case "slideUp": return "txt-slideUp 0.5s ease forwards";
      case "zoom":    return "txt-zoom 0.4s ease forwards";
      case "bounce":  return "txt-bounce 1.2s ease-in-out infinite";
      case "pulse":   return "txt-pulse 1.5s ease-in-out infinite";
      default:        return "none";
    }
  };

  return (
    <>
      <style>{`
        @keyframes txt-fade    { from{opacity:0} to{opacity:1} }
        @keyframes txt-slideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes txt-zoom    { from{opacity:0;transform:scale(0.2)} to{opacity:1;transform:scale(1)} }
        @keyframes txt-bounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes txt-pulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
      `}</style>
      <div
        key={`${layer.id}-${layer.animation}`}
        style={{
          position:     "absolute",
          left:         `${layer.x}%`,           // ✅ was "50%" with px offset in transform
          top:          `${layer.y}%`,           // ✅ was "50%"
          transform:    `translate(-50%, -50%) scale(${layer.scale}) rotate(${layer.rotate}deg)`,
          cursor:       editing ? "text" : "grab",
          touchAction:  "none",
          zIndex:       isSelected ? 10 : 5,
          outline:      isSelected && !editing ? "2px dashed rgba(255,255,255,0.6)" : "none",
          padding:      4,
          borderRadius: 4,
          minWidth:     60,
          animation:    getAnim(),
          ...getEffectStyle(layer.effect, layer.color),
        }}
        onPointerDown={(e) => {
          if (editing) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          dragStart.current = { mx: e.clientX, my: e.clientY, lx: layer.x, ly: layer.y };
          onSelect();
        }}
        onPointerMove={(e) => {
          if (!dragStart.current) return;
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;
          // ✅ Calculate delta as percentage of container size
          const dx = ((e.clientX - dragStart.current.mx) / rect.width)  * 100;
          const dy = ((e.clientY - dragStart.current.my) / rect.height) * 100;
          const nx = Math.max(5, Math.min(95, dragStart.current.lx + dx));
          const ny = Math.max(5, Math.min(95, dragStart.current.ly + dy));
          // Snap to center (50%) when within 2%
          onChange({
            x: Math.abs(nx - 50) < 2 ? 50 : nx,
            y: Math.abs(ny - 50) < 2 ? 50 : ny,
          });
        }}
        onPointerUp={() => { dragStart.current = null; }}
        onDoubleClick={() => { setEditing(true); onSelect(); }}
      >
        {editing ? (
          <textarea
            autoFocus
            value={layer.text}
            onChange={(e) => onChange({ text: e.target.value })}
            onBlur={() => setEditing(false)}
            style={{
              background: "transparent", border: "none", outline: "none",
              color: layer.color, fontFamily: layer.font,
              fontSize: layer.fontSize, textAlign: layer.align,
              resize: "none", minWidth: 120, minHeight: 40,
            }}
            rows={3}
          />
        ) : (
          <div style={{
            color: layer.color, fontFamily: layer.font,
            fontSize: layer.fontSize, textAlign: layer.align,
            whiteSpace: "pre-wrap", wordBreak: "break-word",
            maxWidth: 280, lineHeight: 1.3,
          }}>
            {layer.animation === "typewriter"
              ? <TypewriterText text={layer.text} />
              : layer.text || <span style={{ opacity: 0.35 }}>Tap to type…</span>
            }
          </div>
        )}
      </div>
    </>
  );
}

interface StoryTextCanvasProps {
  onDone:         (layers: TextLayer[], bg: string) => void;
  onClose:        () => void;
  initialLayers?: TextLayer[];
  initialBg?:     string;
  onLayerChange?: (layers: TextLayer[]) => void;
  onBgChange?:    (bg: string) => void;
}

export default function StoryTextCanvas({ onDone, onClose, initialLayers, initialBg, onLayerChange, onBgChange }: StoryTextCanvasProps) {
  const containerRef              = useRef<HTMLDivElement>(null);
  const [bg, setBg]                 = useState(initialBg ?? BACKGROUNDS[0]);
  const [layers, setLayers]         = useState<TextLayer[]>(() =>
    initialLayers && initialLayers.length > 0 ? initialLayers : []
  );
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    initialLayers && initialLayers.length > 0 ? initialLayers[0].id : null
  );

  useEffect(() => {
    if (initialLayers && initialLayers.length > 0) {
      setLayers(initialLayers);
      setSelectedId(prev => prev ?? initialLayers[0].id);
    }
  }, []); 
  const [tab, setTab]             = useState<"font" | "color" | "bg" | "align" | "animation" | "effect">("bg");
  const [typing, setTyping]       = useState(false);

  const selected = layers.find(l => l.id === selectedId) ?? null;

const addLayer = useCallback((): string => {
    const id = `txt_${Date.now()}`;
    const newLayer: TextLayer = {
      id, text: "", x: 50, y: 50, scale: 1, rotate: 0,
      color: "#ffffff", font: "Inter", align: "center",
      fontSize: 32, effect: "none", animation: "none", highlight: "none",
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedId(id);
    return id;
  }, []);

const updateLayer = (id: string, updates: Partial<TextLayer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  useEffect(() => {
    onBgChange?.(bg);
  }, [bg]);

    const deleteSelected = () => {
        if (!selectedId) return;
        setLayers(prev => prev.filter(l => l.id !== selectedId));
        setSelectedId(null);
    };

  const updateSelected = (updates: Partial<TextLayer>) => {
    if (!selectedId) return;
    updateLayer(selectedId, updates);
  };

const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    // Only auto-add a blank layer if no initial layers were passed
    if (!initialLayers || initialLayers.length === 0) {
      addLayer();
    }
  }, []);

  const PILL = "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)";

  return (
    <div style={{
      position:   "fixed",
      inset:      0,
      zIndex:     200,
      display:    "flex",
      flexDirection: "column",
      background: "#000",
    }}>
      {/* Top bar */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        padding:        "16px 20px",
        zIndex:         10,
        flexShrink:     0,
      }}>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex" }}
        >
          <X size={24} />
        </button>

        <div style={{ display: "flex", gap: 10 }}>
          {selectedId && (
            <button
              onClick={deleteSelected}
              style={{
                background: "rgba(255,59,48,0.2)", border: "1px solid rgba(255,59,48,0.4)",
                borderRadius: 20, padding: "6px 14px", color: "#FF3B30",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              Delete
            </button>
          )}
          <button
            onClick={addLayer}
            style={{
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 20, padding: "6px 14px", color: "#fff",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            + Text
          </button>
          <button
            onClick={() => onDone(layers, bg)}
            style={{
              background: PILL, border: "none",
              borderRadius: 20, padding: "6px 20px", color: "#fff",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Check size={14} /> Done
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        onClick={() => setSelectedId(null)}
        style={{
          flex:           1,
          position:       "relative",
          overflow:       "hidden",
          background:     bg,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          cursor:         "crosshair",
        }}
      >
        {/* Center snap guides */}
        {selectedId && (
          <>
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.15)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.15)", pointerEvents: "none" }} />
          </>
        )}

        {layers.map(layer => (
          <DraggableTextLayer
            key={layer.id}
            layer={layer}
            isSelected={selectedId === layer.id}
            onSelect={() => setSelectedId(layer.id)}
            onChange={(u) => updateLayer(layer.id, u)}
            containerRef={containerRef}
          />
        ))}

        {layers.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, pointerEvents: "none" }}>
            Tap + Text to add text
          </p>
        )}
      </div>

      {/* Bottom controls */}
      <div style={{
        background:  "rgba(0,0,0,0.9)",
        backdropFilter: "blur(20px)",
        borderTop:   "1px solid rgba(255,255,255,0.08)",
        flexShrink:  0,
        paddingBottom: "env(safe-area-inset-bottom, 12px)",
      }}>
        {/* Tab bar */}
        <div style={{ display: "flex", overflowX: "auto", scrollbarWidth: "none", gap: 4, padding: "10px 12px 6px" }}>
          {([
            { id: "bg",        label: "🎨 BG"    },
            { id: "color",     label: "🖊 Color"  },
            { id: "font",      label: "🔤 Font"   },
            { id: "align",     label: "☰ Align"  },
            { id: "animation", label: "✨ Anim"   },
            { id: "effect",    label: "💡 Effect" },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flexShrink:   0,
                padding:      "5px 12px",
                borderRadius: 20,
                fontSize:     11,
                fontWeight:   600,
                cursor:       "pointer",
                border:       "none",
                background:   tab === t.id ? PILL : "rgba(255,255,255,0.1)",
                color:        "#fff",
                whiteSpace:   "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: "8px 12px 14px", minHeight: 80 }}>

          {/* BG tab */}
          {tab === "bg" && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
              {BACKGROUNDS.map((b, i) => (
                <button
                  key={i}
                  onClick={() => { setBg(b); }}
                  style={{
                    flexShrink:   0,
                    width:        44,
                    height:       44,
                    borderRadius: 10,
                    background:   b,
                    border:       bg === b ? "3px solid #fff" : "2px solid rgba(255,255,255,0.2)",
                    cursor:       "pointer",
                  }}
                />
              ))}
            </div>
          )}

          {/* Color tab */}
          {tab === "color" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COLORS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => updateSelected({ color: c })}
                  style={{
                    width:        32,
                    height:       32,
                    borderRadius: "50%",
                    background:   c,
                    border:       selected?.color === c ? "3px solid #fff" : "2px solid rgba(255,255,255,0.2)",
                    cursor:       "pointer",
                  }}
                />
              ))}
            </div>
          )}

          {/* Font tab */}
          {tab === "font" && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
              {FONTS.map((f, i) => (
                <button
                  key={f}
                  onClick={() => updateSelected({ font: f })}
                  style={{
                    flexShrink:   0,
                    padding:      "8px 14px",
                    borderRadius: 10,
                    background:   selected?.font === f ? "rgba(136,96,217,0.4)" : "rgba(255,255,255,0.08)",
                    border:       selected?.font === f ? "1px solid #8860D9" : "1px solid rgba(255,255,255,0.12)",
                    color:        "#fff",
                    fontFamily:   f,
                    fontSize:     13,
                    cursor:       "pointer",
                    whiteSpace:   "nowrap",
                  }}
                >
                  {FONT_LABELS[i]}
                </button>
              ))}
            </div>
          )}

          {/* Align tab */}
          {tab === "align" && (
            <div style={{ display: "flex", gap: 10 }}>
              {(["left", "center", "right"] as const).map(a => (
                <button
                  key={a}
                  onClick={() => updateSelected({ align: a })}
                  style={{
                    width:          48,
                    height:         48,
                    borderRadius:   10,
                    background:     selected?.align === a ? "rgba(136,96,217,0.4)" : "rgba(255,255,255,0.08)",
                    border:         selected?.align === a ? "1px solid #8860D9" : "1px solid rgba(255,255,255,0.12)",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    cursor:         "pointer",
                    color:          "#fff",
                  }}
                >
                  {a === "left" ? <AlignLeft size={18} /> : a === "center" ? <AlignCenter size={18} /> : <AlignRight size={18} />}
                </button>
              ))}

              {/* Font size */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Size</span>
                <input
                  type="range"
                  min={14} max={72}
                  value={selected?.fontSize ?? 32}
                  onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
                  style={{ width: 100, accentColor: "#8860D9" }}
                />
                <span style={{ color: "#fff", fontSize: 11, minWidth: 24 }}>{selected?.fontSize ?? 32}</span>
              </div>
            </div>
          )}

          {/* Animation tab */}
          {tab === "animation" && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
              {ANIMATIONS.map(a => (
                <button
                  key={a.id}
                  onClick={() => updateSelected({ animation: a.id })}
                  style={{
                    flexShrink:    0,
                    padding:       "8px 12px",
                    borderRadius:  10,
                    background:    selected?.animation === a.id ? "rgba(136,96,217,0.4)" : "rgba(255,255,255,0.08)",
                    border:        selected?.animation === a.id ? "1px solid #8860D9" : "1px solid rgba(255,255,255,0.12)",
                    color:         "#fff",
                    fontSize:      11,
                    cursor:        "pointer",
                    whiteSpace:    "nowrap",
                    textAlign:     "center",
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{a.icon}</div>
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {/* Effect tab */}
          {tab === "effect" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {EFFECTS.map(ef => (
                <button
                  key={ef.id}
                  onClick={() => updateSelected({ effect: ef.id })}
                  style={{
                    padding:      "7px 14px",
                    borderRadius: 20,
                    background:   selected?.effect === ef.id ? "rgba(136,96,217,0.4)" : "rgba(255,255,255,0.08)",
                    border:       selected?.effect === ef.id ? "1px solid #8860D9" : "1px solid rgba(255,255,255,0.12)",
                    color:        "#fff",
                    fontSize:     12,
                    cursor:       "pointer",
                    whiteSpace:   "nowrap",
                  }}
                >
                  {ef.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
