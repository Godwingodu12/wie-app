"use client";
// ─────────────────────────────────────────────────────────
//  FILE: src/app/(protected)/post/add-post/page.tsx  (CREATE NEW)
// ─────────────────────────────────────────────────────────
import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, ChevronDown,
  ImageIcon, Video, X, Loader2,
  MapPin, Users, Globe, Lock, UserCheck,
  Plus, Check,
} from "lucide-react";
import { useTheme } from "@/components/home/ThemeContext";
import { createPost } from "@/services/postService";
import type { PostVisibility } from "@/types/post";

// ── Types ─────────────────────────────────────────────────
type Step = "pick" | "edit" | "posting" | "done";

interface PreviewItem {
  file:     File;
  url:      string;
  type:     "image" | "video";
  duration?: number;
}

const VISIBILITY_OPTIONS: {
  value:  PostVisibility;
  label:  string;
  sub:    string;
  icon:   React.ReactNode;
}[] = [
  { value: "public",    label: "Public",       sub: "Anyone can see",       icon: <Globe    size={16} /> },
  { value: "followers", label: "Followers",    sub: "Followers only",       icon: <UserCheck size={16} /> },
  { value: "only_me",   label: "Only Me",      sub: "Private",              icon: <Lock      size={16} /> },
];

const MAX_FILES  = 10;
const MAX_MB     = 200;

export default function AddPostPage() {
  const { themeStyles } = useTheme();
  const router          = useRouter();

  const [step,       setStep]       = useState<Step>("pick");
  const [previews,   setPreviews]   = useState<PreviewItem[]>([]);
  const [activeIdx,  setActiveIdx]  = useState(0);
  const [caption,    setCaption]    = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [location,   setLocation]   = useState("");
  const [showVisPicker, setShowVisPicker] = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [error,      setError]      = useState("");
  const [dragging,   setDragging]   = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [caption]);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [previews]);

  const processFiles = useCallback((files: FileList | File[]) => {
    setError("");
    const arr = Array.from(files);

    if (previews.length + arr.length > MAX_FILES) {
      setError(`Max ${MAX_FILES} files allowed.`);
      return;
    }

    const items: PreviewItem[] = [];
    for (const file of arr) {
      if (file.size > MAX_MB * 1024 * 1024) {
        setError(`"${file.name}" exceeds ${MAX_MB} MB.`);
        continue;
      }
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) {
        setError(`"${file.name}" is not a supported format.`);
        continue;
      }
      items.push({ file, url: URL.createObjectURL(file), type: isVideo ? "video" : "image" });
    }

    if (items.length === 0) return;
    setPreviews((prev) => [...prev, ...items]);
    setStep("edit");
  }, [previews]);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const removeFile = (idx: number) => {
    URL.revokeObjectURL(previews[idx].url);
    const next = previews.filter((_, i) => i !== idx);
    setPreviews(next);
    if (next.length === 0) setStep("pick");
    else setActiveIdx(Math.min(activeIdx, next.length - 1));
  };

  const handlePost = async () => {
    if (!previews.length) return;
    setStep("posting");
    setProgress(0);
    setError("");
    try {
      await createPost(
        {
          files:          previews.map((p) => p.file),
          caption:        caption.trim() || undefined,
          visibility,
          locationLabel:  location.trim() || undefined,
        },
        (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      );
      setStep("done");
      setTimeout(() => router.push("/home"), 1500);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Upload failed. Please try again.");
      setStep("edit");
    }
  };

  const currentVis = VISIBILITY_OPTIONS.find((o) => o.value === visibility)!;

  // ── PICK STEP ─────────────────────────────────────────
  if (step === "pick") {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: themeStyles.background, color: themeStyles.text }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-4 sticky top-0 z-10"
          style={{ background: themeStyles.background, borderBottom: `1px solid ${themeStyles.border}` }}
        >
          <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: themeStyles.pillBg }}>
            <ArrowLeft size={20} style={{ color: themeStyles.text }} />
          </button>
          <h1 className="text-[16px] font-semibold" style={{ color: themeStyles.text }}>New Post</h1>
          <div className="w-9" />
        </div>

        {/* Drop zone */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div
            className="w-full max-w-md flex flex-col items-center gap-6"
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div
              className="w-full aspect-square max-w-xs flex flex-col items-center justify-center gap-4 rounded-3xl cursor-pointer transition-all duration-200"
              style={{
                border:     `2px dashed ${dragging ? "#8860D9" : themeStyles.border}`,
                background: dragging ? "rgba(136,96,217,0.08)" : themeStyles.cardBg,
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)" }}
              >
                <Plus size={36} className="text-white" />
              </div>
              <div className="text-center px-6">
                <p className="text-[15px] font-semibold" style={{ color: themeStyles.text }}>
                  Drag & drop files here
                </p>
                <p className="text-[13px] mt-1" style={{ color: themeStyles.textSecondary }}>
                  or tap to browse
                </p>
              </div>
            </div>

            {/* Format hints */}
            <div className="flex gap-6">
              {[
                { icon: <ImageIcon size={20} />, label: "Photos", sub: "JPG, PNG, WEBP, HEIC" },
                { icon: <Video      size={20} />, label: "Videos", sub: "MP4, MOV, WEBM" },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: themeStyles.pillBg, color: "#8860D9" }}
                  >
                    {icon}
                  </div>
                  <span className="text-[12px] font-semibold" style={{ color: themeStyles.text }}>{label}</span>
                  <span className="text-[10px] text-center" style={{ color: themeStyles.textSecondary }}>{sub}</span>
                </div>
              ))}
            </div>

            <p className="text-[12px] text-center" style={{ color: themeStyles.textSecondary }}>
              Up to {MAX_FILES} files · Max {MAX_MB} MB each
            </p>

            {error && (
              <p className="text-[13px] text-[#FF453A] text-center font-medium">{error}</p>
            )}

            <button
              className="w-full py-3.5 rounded-2xl text-white font-semibold text-[15px]"
              style={{ background: "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)" }}
              onClick={() => fileInputRef.current?.click()}
            >
              Choose Files
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFilePick}
        />
      </div>
    );
  }

  // ── POSTING / DONE STEP ───────────────────────────────
  if (step === "posting" || step === "done") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6 px-8"
        style={{ background: themeStyles.background }}
      >
        {step === "done" ? (
          <>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)" }}
            >
              <Check size={40} className="text-white" />
            </div>
            <p className="text-[18px] font-bold text-center" style={{ color: themeStyles.text }}>
              Posted! 🚀
            </p>
            <p className="text-[14px] text-center" style={{ color: themeStyles.textSecondary }}>
              Redirecting to your feed…
            </p>
          </>
        ) : (
          <>
            {/* Preview thumb */}
            {previews[0] && (
              <div className="w-24 h-24 rounded-2xl overflow-hidden relative">
                <Image src={previews[0].url} alt="" fill className="object-cover" />
                {previews.length > 1 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm font-bold">
                    +{previews.length}
                  </div>
                )}
              </div>
            )}
            <div className="w-full max-w-xs">
              <div className="flex justify-between mb-1">
                <span className="text-[13px]" style={{ color: themeStyles.textSecondary }}>Uploading…</span>
                <span className="text-[13px] font-semibold" style={{ color: "#8860D9" }}>{progress}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: themeStyles.pillBg }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width:      `${progress}%`,
                    background: "linear-gradient(90deg,#B3B8E2,#8860D9)",
                  }}
                />
              </div>
            </div>
            <Loader2 size={24} className="animate-spin text-[#8860D9]" />
          </>
        )}
      </div>
    );
  }

  // ── EDIT STEP ─────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: themeStyles.background, color: themeStyles.text }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4 sticky top-0 z-20"
        style={{ background: themeStyles.background, borderBottom: `1px solid ${themeStyles.border}` }}
      >
        <button
          onClick={() => setStep("pick")}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: themeStyles.pillBg }}
        >
          <ArrowLeft size={20} style={{ color: themeStyles.text }} />
        </button>
        <h1 className="text-[16px] font-semibold" style={{ color: themeStyles.text }}>New Post</h1>
        <button
          onClick={handlePost}
          className="px-5 py-2 rounded-full text-white text-[13px] font-semibold active:scale-95 transition-transform"
          style={{ background: "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)" }}
        >
          Post
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {/* ── Media preview carousel ──────────────────── */}
        <div
          className="relative w-full"
          style={{ aspectRatio: "4/5", maxHeight: 520, background: "#0a0a0a" }}
        >
          {previews[activeIdx]?.type === "video" ? (
            <video
              key={previews[activeIdx].url}
              src={previews[activeIdx].url}
              className="w-full h-full object-contain"
              controls muted playsInline
            />
          ) : previews[activeIdx] ? (
            <Image
              src={previews[activeIdx].url}
              alt=""
              fill
              className="object-contain"
            />
          ) : null}

          {/* Carousel arrows */}
          {previews.length > 1 && (
            <>
              {activeIdx > 0 && (
                <button
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center"
                  onClick={() => setActiveIdx((i) => i - 1)}
                >
                  <ArrowLeft size={16} className="text-white" />
                </button>
              )}
              {activeIdx < previews.length - 1 && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center"
                  onClick={() => setActiveIdx((i) => i + 1)}
                >
                  <ArrowRight size={16} className="text-white" />
                </button>
              )}
              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {previews.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    style={{
                      width:        i === activeIdx ? 16 : 6,
                      height:       6,
                      borderRadius: 3,
                      background:   i === activeIdx ? "#8860D9" : "rgba(255,255,255,0.5)",
                      transition:   "all 0.2s",
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Remove current */}
          <button
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center"
            onClick={() => removeFile(activeIdx)}
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* ── Thumbnail strip ─────────────────────────── */}
        {previews.length > 1 && (
          <div className="flex gap-2 px-4 py-3 overflow-x-auto">
            {previews.map((p, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all"
                style={{
                  border: i === activeIdx ? "2px solid #8860D9" : `2px solid ${themeStyles.border}`,
                }}
              >
                {p.type === "video" ? (
                  <video src={p.url} className="w-full h-full object-cover" muted />
                ) : (
                  <Image src={p.url} alt="" fill className="object-cover" />
                )}
              </button>
            ))}
            {/* Add more */}
            {previews.length < MAX_FILES && (
              <button
                className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center border-2 border-dashed"
                style={{ borderColor: themeStyles.border, background: themeStyles.pillBg }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus size={20} style={{ color: "#8860D9" }} />
              </button>
            )}
          </div>
        )}

        {/* ── Form ─────────────────────────────────────── */}
        <div className="px-4 flex flex-col gap-4 pt-4">
          {/* Caption */}
          <div
            className="rounded-2xl p-4"
            style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
          >
            <textarea
              ref={textareaRef}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption… (optional)"
              maxLength={2200}
              rows={3}
              className="w-full bg-transparent outline-none resize-none text-[14px] leading-relaxed"
              style={{ color: themeStyles.text }}
            />
            <div className="flex justify-end mt-2">
              <span className="text-[11px]" style={{ color: themeStyles.textSecondary }}>
                {caption.length}/2200
              </span>
            </div>
          </div>

          {/* Location */}
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
          >
            <MapPin size={18} style={{ color: "#8860D9" }} />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location (optional)"
              className="flex-1 bg-transparent outline-none text-[14px]"
              style={{ color: themeStyles.text }}
            />
          </div>

          {/* Visibility picker */}
          <div className="relative">
            <button
              onClick={() => setShowVisPicker(!showVisPicker)}
              className="w-full flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
              style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
            >
              <div className="flex items-center gap-3">
                <div className="text-[#8860D9]">{currentVis.icon}</div>
                <div className="text-left">
                  <p className="text-[14px] font-medium" style={{ color: themeStyles.text }}>
                    {currentVis.label}
                  </p>
                  <p className="text-[11px]" style={{ color: themeStyles.textSecondary }}>
                    {currentVis.sub}
                  </p>
                </div>
              </div>
              <ChevronDown
                size={16}
                style={{
                  color:     themeStyles.textSecondary,
                  transform: showVisPicker ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              />
            </button>

            {showVisPicker && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowVisPicker(false)} />
                <div
                  className="absolute top-full mt-1 left-0 right-0 rounded-2xl overflow-hidden z-30 shadow-2xl"
                  style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
                >
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:opacity-80 transition-opacity"
                      onClick={() => { setVisibility(opt.value); setShowVisPicker(false); }}
                    >
                      <div className="text-[#8860D9]">{opt.icon}</div>
                      <div className="text-left flex-1">
                        <p className="text-[14px] font-medium" style={{ color: themeStyles.text }}>{opt.label}</p>
                        <p className="text-[11px]" style={{ color: themeStyles.textSecondary }}>{opt.sub}</p>
                      </div>
                      {visibility === opt.value && (
                        <Check size={16} style={{ color: "#8860D9" }} />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Settings hints */}
          <div
            className="rounded-2xl px-4 py-3 flex flex-col gap-2"
            style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px]" style={{ color: themeStyles.text }}>Tag people</span>
              <div className="flex items-center gap-1">
                <Users size={14} style={{ color: themeStyles.textSecondary }} />
                <span className="text-[12px]" style={{ color: themeStyles.textSecondary }}>
                  After posting
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px]" style={{ color: themeStyles.text }}>Advanced settings</span>
              <ArrowRight size={14} style={{ color: themeStyles.textSecondary }} />
            </div>
          </div>

          {error && (
            <div
              className="rounded-2xl px-4 py-3 text-[13px] text-[#FF453A] font-medium"
              style={{ background: "rgba(255,69,58,0.1)", border: "1px solid rgba(255,69,58,0.3)" }}
            >
              {error}
            </div>
          )}

          {/* Post button (bottom CTA) */}
          <button
            onClick={handlePost}
            className="w-full py-4 rounded-2xl text-white font-bold text-[16px] active:scale-[0.98] transition-transform"
            style={{ background: "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)" }}
          >
            Share Post 🚀
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFilePick}
      />
    </div>
  );
}