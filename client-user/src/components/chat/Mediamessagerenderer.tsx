'use client';
import React, { useState, useCallback,useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin, Navigation, FileText, Music, User,
  Calendar, Phone, ExternalLink, Download,
  X, ChevronLeft, ChevronRight,
  Loader2, FileArchive, FileSpreadsheet,
} from 'lucide-react';
import { format } from 'date-fns';

export const isMediaMessage = (msg: any): boolean => {
  if (!msg?.messageType) return false;
  return [
    'image', 'video', 'audio', 'file', 'sticker',
    'location', 'live_location', 'contact', 'profile', 'event',
  ].includes(msg.messageType);
};

export const renderMediaMessage = (
  message: any,
  isSender: boolean,
  themeStyles: any,
  isDark: boolean,
  uploadProgress?: number,   
): React.ReactNode => {
  switch (message.messageType) {
    case 'image':
      return <ImageMessage msg={message} isSender={isSender} isDark={isDark} themeStyles={themeStyles} uploadProgress={uploadProgress} />;
    case 'video':
      return <VideoMessage msg={message} isSender={isSender} isDark={isDark} themeStyles={themeStyles} uploadProgress={uploadProgress} />;
    case 'audio':
      return <AudioFileMessage msg={message} isSender={isSender} isDark={isDark} themeStyles={themeStyles} />;
    case 'file':
      return <FileMessage msg={message} isSender={isSender} isDark={isDark} themeStyles={themeStyles} />;
    case 'sticker':
      return <StickerMessage msg={message} />;
    case 'location':
    case 'live_location':
      return <LocationMessage msg={message} isSender={isSender} isDark={isDark} themeStyles={themeStyles} />;
    case 'contact':
      return <ContactMessage msg={message} isSender={isSender} isDark={isDark} themeStyles={themeStyles} />;
    case 'profile':
      return <ProfileMessage msg={message} isSender={isSender} isDark={isDark} themeStyles={themeStyles} />;
    case 'event':
      return <EventMessage msg={message} isSender={isSender} isDark={isDark} themeStyles={themeStyles} />;
    default:
      return null;
  }
};
// ─── Download helper ───────────────────────────────────────────────────────────
async function triggerDownload(url: string, filename: string) {
  try {
    const res  = await fetch(url);
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = href;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(href), 5000);
  } catch {
    // Fallback: direct link (browser handles save dialog)
    const a    = document.createElement('a');
    a.href     = url;
    a.target   = '_blank';
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

// ─── Download button ───────────────────────────────────────────────────────────
function DownloadBtn({
  url,
  filename,
  label = 'Download',
  isSender,
}: {
  url: string;
  filename: string;
  label?: string;
  isSender: boolean;
}) {
  const [busy, setBusy] = useState(false);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (busy) return;
      setBusy(true);
      await triggerDownload(url, filename);
      setBusy(false);
    },
    [url, filename, busy],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-opacity hover:opacity-75 active:scale-95"
      style={{
        backgroundColor: isSender ? 'rgba(255,255,255,0.18)' : 'rgba(84,148,255,0.15)',
        color: isSender ? '#fff' : '#5494FF',
      }}
    >
      {busy ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
      {label}
    </button>
  );
}

// ─── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [cur, setCur] = useState(startIndex);
  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setCur(i => (i - 1 + images.length) % images.length); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setCur(i => (i + 1) % images.length); };

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95"
      onClick={onClose}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/10 rounded-full p-2 text-white hover:bg-white/25 transition z-10"
      >
        <X size={20} />
      </button>

      {/* Image */}
      <div
        className="relative flex items-center justify-center w-full h-full px-12"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={images[cur]}
          alt={`Image ${cur + 1}`}
          style={{
            maxWidth: '90vw',
            maxHeight: '85vh',
            objectFit: 'contain',
            borderRadius: '12px',
            display: 'block',
          }}
        />

        {/* Prev / Next */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2 text-white hover:bg-black/80 transition"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2 text-white hover:bg-black/80 transition"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-4 flex flex-col items-center gap-2">
        {images.length > 1 && (
          <p className="text-white/50 text-xs">{cur + 1} / {images.length}</p>
        )}
        <DownloadBtn url={images[cur]} filename={`image_${cur + 1}.jpg`} isSender={false} />
      </div>
    </div>
  );
}

function ImageMessage({ msg, isSender, isDark, themeStyles, uploadProgress }: any) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [errored, setErrored]         = useState<number[]>([]);

  // Support all possible field names the backend/socket might use
  const images: string[] = (
    msg.chat_images?.length         ? msg.chat_images  :
    msg.mediaUrls?.length           ? msg.mediaUrls    :
    []
  ).filter(Boolean);

  // Optimistic local preview (set before upload finishes — see ChatWindow patch)
  const localPreviews: string[] = msg._localPreviews || [];

  // Use local previews if we don't have Cloudinary URLs yet
  const displayImages = images.length > 0 ? images : localPreviews;

  if (displayImages.length === 0) {
    return <span className="text-sm italic opacity-50">📷 Sending image…</span>;
  }

  const count      = displayImages.length;
  const isUploading = images.length === 0 && localPreviews.length > 0;

  // Grid sizing
  const cellW = count === 1 ? 220 : count === 2 ? 106 : 70;
  const cellH = count === 1 ? 165 : count === 2 ? 80  : 70;

  return (
    <>
      {lightboxIdx !== null && images.length > 0 && (
        <Lightbox
          images={images}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      <div>
        {/* Upload progress spinner overlay */}
        {isUploading && (
          <div className="flex items-center gap-1.5 mb-1 opacity-60">
            <Loader2 size={12} className="animate-spin" />
            <span className="text-[11px]">Uploading…</span>
          </div>
        )}

        {/* Image grid */}
        <div className="flex flex-wrap gap-[3px]" style={{ maxWidth: `${count === 1 ? 220 : 215}px` }}>
          {displayImages.slice(0, 4).map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => !isUploading && images.length > 0 && setLightboxIdx(i)}
              className="relative overflow-hidden flex-shrink-0 focus:outline-none"
              style={{
                width:  `${cellW}px`,
                height: `${cellH}px`,
                borderRadius: count === 1 ? '14px' : '10px',
                cursor: isUploading ? 'default' : 'pointer',
              }}
            >
              {errored.includes(i) ? (
                <div
                  className="w-full h-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: isDark ? '#333' : '#e5e7eb' }}
                >
                  🖼️
                </div>
              ) : (
                <img
                  src={url}
                  alt={`image-${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={() => setErrored(prev => [...prev, i])}
                />
              )}

              {/* +N overlay on 4th cell */}
              {i === 3 && count > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xl">
                  +{count - 4}
                </div>
              )}

              {/* Upload progress overlay */}
              {isUploading && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 'inherit' }}
                >
                  {uploadProgress !== undefined && uploadProgress < 100 ? (
                    <>
                      <svg width="44" height="44" viewBox="0 0 44 44">
                        <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3.5"/>
                        <circle
                          cx="22" cy="22" r="18"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 18}`}
                          strokeDashoffset={`${2 * Math.PI * 18 * (1 - uploadProgress / 100)}`}
                          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.3s ease' }}
                        />
                      </svg>
                      <span className="text-white text-[11px] font-bold mt-1">{uploadProgress}%</span>
                    </>
                  ) : (
                    <Loader2 size={18} className="animate-spin text-white" />
                  )}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Caption */}
        {msg.content && !['📷 Image', '📷 Sending image…'].includes(msg.content) && (
          <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: isSender ? '#fff' : themeStyles.text }}>
            {msg.content}
          </p>
        )}
      </div>
    </>
  );
}

function VideoMessage({ msg, isSender, isDark, themeStyles, uploadProgress }: any) {
  const [showFullscreen, setShowFullscreen] = useState(false);

  const video       = msg.chat_videos?.[0];
  const videoUrl    = video?.url || msg._localVideoUrl || null;

  if (!videoUrl) return <span className="text-sm italic opacity-50">🎥 Sending video…</span>;

  const isLocal     = videoUrl.startsWith('blob:');
  const filename    = video?.originalName || 'video.mp4';
  const durationSec = video?.duration || 0;
  const sizeMB      = video?.size ? (video.size / 1048576).toFixed(1) : null;
  const fmt         = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

  return (
    <>
      {/* ── Fullscreen modal with download ── */}
      {showFullscreen && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95"
          onClick={() => setShowFullscreen(false)}
        >
          <button
            type="button"
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 right-4 bg-white/10 rounded-full p-2 text-white hover:bg-white/25 transition z-10"
          >
            <X size={20} />
          </button>

          <div
            className="flex flex-col items-center gap-4"
            onClick={e => e.stopPropagation()}
          >
            <video
              src={videoUrl}
              controls
              autoPlay
              playsInline
              style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: '12px' }}
            />
            {!isLocal && (
              <DownloadBtn url={videoUrl} filename={filename} isSender={false} />
            )}
          </div>
        </div>
      )}

      {/* ── Inline preview (click to open fullscreen) ── */}
      <div style={{ maxWidth: '242px' }}>
        <div
          className="relative overflow-hidden cursor-pointer"
          style={{ borderRadius: '14px', width: '242px' }}
          onClick={() => !isLocal && setShowFullscreen(true)}
        >
          <video
            src={videoUrl}
            playsInline
            preload="metadata"
            style={{
              display: 'block',
              width: '100%',
              maxHeight: '190px',
              borderRadius: '14px',
              pointerEvents: 'none',  // prevent native controls inline
            }}
          />

          {/* Play overlay */}
          {!isLocal && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/35 transition-colors">
              <div className="w-12 h-12 rounded-full bg-black/55 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}

          {isLocal && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
            >
              {uploadProgress !== undefined && uploadProgress < 100 ? (
                <>
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4"/>
                    <circle
                      cx="24" cy="24" r="20"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - uploadProgress / 100)}`}
                      style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.3s ease' }}
                    />
                  </svg>
                  <span className="text-white text-[12px] font-bold mt-1">{uploadProgress}%</span>
                </>
              ) : (
                <Loader2 size={22} className="animate-spin text-white" />
              )}
            </div>
          )}
        </div>

        {(durationSec > 0 || sizeMB) && (
          <div className="flex items-center mt-1 px-0.5">
            <span className="text-[10px] opacity-50" style={{ color: isSender ? '#fff' : themeStyles.textSecondary }}>
              {durationSec ? fmt(durationSec) : ''}
              {sizeMB ? ` · ${sizeMB} MB` : ''}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

function AudioFileMessage({ msg, isSender, isDark, themeStyles }: any) {
  // Backend stores as: chat_audio: [{ url, duration, size, mimeType, originalName }]
  const audio      = msg.chat_audio?.[0];
  const url        = audio?.url || msg._localAudioUrl || null;

  if (!url) return <span className="text-sm italic opacity-50">🎵 Sending audio…</span>;

  const isLocal    = url.startsWith('blob:');
  const filename   = audio?.originalName || 'audio.mp3';
  const durationSec = audio?.duration    || 0;
  const sizeMB     = audio?.size ? (audio.size / 1048576).toFixed(1) : null;

  return (
    <div
      className="rounded-[14px] px-3 py-2.5"
      style={{
        backgroundColor: isSender
          ? 'rgba(255,255,255,0.13)'
          : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
        minWidth: '200px',
        maxWidth: '252px',
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: isSender ? 'rgba(255,255,255,0.18)' : 'rgba(251,146,60,0.18)' }}
        >
          <Music size={16} style={{ color: isSender ? '#fff' : '#FB923C' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[12px] font-semibold truncate"
            style={{ color: isSender ? '#fff' : themeStyles.text }}
          >
            {filename}
          </p>
          <p className="text-[10px] opacity-55" style={{ color: isSender ? '#fff' : themeStyles.textSecondary }}>
            {durationSec ? `${Math.floor(durationSec / 60)}:${String(Math.round(durationSec % 60)).padStart(2, '0')}` : ''}
            {sizeMB ? ` · ${sizeMB} MB` : ''}
          </p>
        </div>
      </div>

      {/* Native audio player */}
      <audio
        src={url}
        controls
        style={{ width: '100%', height: '28px' }}
      />

      {!isLocal && (
        <DownloadBtn url={url} filename={filename} isSender={isSender} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FILE / DOCUMENT
// ══════════════════════════════════════════════════════════════════════════════
const EXT_COLORS: Record<string, string> = {
  pdf: '#F87171', doc: '#60A5FA', docx: '#60A5FA',
  xls: '#34D399', xlsx: '#34D399', csv: '#34D399',
  ppt: '#FB923C', pptx: '#FB923C',
  txt: '#9CA3AF', zip: '#FBBF24', rar: '#FBBF24', '7z': '#FBBF24',
};

function FileIcon({ ext, color, size = 18 }: { ext: string; color: string; size?: number }) {
  if (['zip','rar','7z'].includes(ext)) return <FileArchive size={size} style={{ color }} />;
  if (['xls','xlsx','csv'].includes(ext)) return <FileSpreadsheet size={size} style={{ color }} />;
  return <FileText size={size} style={{ color }} />;
}

function FileMessage({ msg, isSender, isDark, themeStyles }: any) {
  const [showModal, setShowModal] = useState(false);

  const file    = msg.chat_files?.[0];
  const url     = file?.url || null;

  if (!url) return <span className="text-sm italic opacity-50">📎 Sending file…</span>;

  const ext     = (file?.extension || file?.name?.split('.').pop() || 'file').toLowerCase();
  const color   = EXT_COLORS[ext] || '#9CA3AF';
  const name    = file?.name || 'Document';
  const isLocal = url.startsWith('blob:');
  const sizeStr = file?.size
    ? file.size > 1_048_576
      ? `${(file.size / 1_048_576).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`
    : null;

  return (
    <>
      {/* ── Bottom-sheet modal with Open + Download ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/75"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-[22px] p-6 flex flex-col gap-5 pb-8"
            style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }}
            onClick={e => e.stopPropagation()}
          >
            {/* File info */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}22` }}
              >
                <FileIcon ext={ext} color={color} size={26} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[15px] font-semibold truncate"
                  style={{ color: isDark ? '#fff' : '#111' }}
                >
                  {name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] uppercase font-bold" style={{ color }}>
                    {ext}
                  </span>
                  {sizeStr && (
                    <span
                      className="text-[11px] opacity-55"
                      style={{ color: isDark ? '#aaa' : '#666' }}
                    >
                      · {sizeStr}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-[13px] font-semibold transition-opacity hover:opacity-75"
                style={{
                  backgroundColor: isDark ? '#2a2a2a' : '#f3f4f6',
                  color: '#5494FF',
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={14} /> Open
              </a>
              {!isLocal && (
                <div className="flex-1">
                  <DownloadBtn
                    url={url}
                    filename={name}
                    label="Download"
                    isSender={false}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Inline file card (tap to open modal) ── */}
      <div
        className="rounded-[14px] overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
        style={{
          minWidth: '200px',
          maxWidth: '262px',
          backgroundColor: isSender
            ? 'rgba(255,255,255,0.13)'
            : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
          border: `0.5px solid ${isSender ? 'rgba(255,255,255,0.12)' : themeStyles.border}`,
        }}
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center gap-3 px-3 py-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}22` }}
          >
            <FileIcon ext={ext} color={color} />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-[13px] font-semibold truncate"
              style={{ color: isSender ? '#fff' : themeStyles.text }}
            >
              {name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] uppercase font-bold" style={{ color }}>
                {ext}
              </span>
              {sizeStr && (
                <span
                  className="text-[10px] opacity-55"
                  style={{ color: isSender ? '#fff' : themeStyles.textSecondary }}
                >
                  · {sizeStr}
                </span>
              )}
            </div>
          </div>
          {/* Tap hint */}
          <ExternalLink
            size={13}
            style={{
              color: isSender ? 'rgba(255,255,255,0.45)' : themeStyles.textSecondary,
              flexShrink: 0,
            }}
          />
        </div>
      </div>
    </>
  );
}

function StickerMessage({ msg }: { msg: any }) {
  const url = msg.stickerData?.url;
  if (!url) return null;
  return (
    <div style={{ width: '128px', height: '128px' }}>
      <img
        src={url}
        alt="sticker"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
}

function LocationMessage({ msg, isSender, isDark, themeStyles }: any) {
  const loc = msg.locationData;
  if (!loc?.latitude || !loc?.longitude) {
    return <span className="text-sm italic opacity-50">📍 Location</span>;
  }

  const mapsUrl = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
  const isLive  = loc.isLive;
  const expired = loc.liveExpiry && new Date(loc.liveExpiry) < new Date();

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-[14px] overflow-hidden transition-opacity hover:opacity-90"
      style={{
        width: '230px',
        textDecoration: 'none',
        border: `0.5px solid ${isLive && !expired ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.08)'}`,
        backgroundColor: isSender
          ? 'rgba(255,255,255,0.1)'
          : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      }}
    >
      {/* Map preview */}
      <div
        className="relative flex items-center justify-center"
        style={{ height: '90px', backgroundColor: isDark ? '#1a2035' : '#dbeafe', overflow: 'hidden' }}
      >
        <img
          src={`https://staticmap.openstreetmap.de/staticmap.php?center=${loc.latitude},${loc.longitude}&zoom=15&size=300x90&maptype=mapnik&markers=${loc.latitude},${loc.longitude},red`}
          alt="map"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {isLive && !expired
            ? <Navigation size={26} style={{ color: '#34D399', filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.7))' }} />
            : <MapPin size={26} style={{ color: '#5494FF', filter: 'drop-shadow(0 0 4px rgba(84,148,255,0.6))' }} />
          }
        </div>
      </div>

      {/* Label */}
      <div className="px-3 py-2">
        {isLive && !expired ? (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse inline-block" />
            <span className="text-[12px] font-semibold text-[#34D399]">Live Location</span>
          </div>
        ) : (
          <p className="text-[13px] font-semibold" style={{ color: isSender ? '#fff' : themeStyles.text }}>
            {loc.name || loc.address?.split(',')[0] || 'Location'}
          </p>
        )}
        {loc.address && (
          <p className="text-[10px] mt-0.5 truncate opacity-60" style={{ color: isSender ? '#fff' : themeStyles.textSecondary }}>
            {loc.address}
          </p>
        )}
        <p className="text-[10px] mt-0.5 opacity-35 font-mono" style={{ color: isSender ? '#fff' : themeStyles.textSecondary }}>
          {loc.latitude?.toFixed(5)}, {loc.longitude?.toFixed(5)}
        </p>
      </div>
    </a>
  );
}

function ContactMessage({ msg, isSender, isDark, themeStyles }: any) {
  const [showModal, setShowModal] = useState(false);
  const c = msg.contactData;

  if (!c?.name) return <span className="text-sm italic opacity-50">👤 Contact</span>;

  return (
    <>
      {/* ── Bottom-sheet modal with download ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/75"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-[22px] p-6 flex flex-col gap-4 pb-8"
            style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ backgroundColor: isDark ? '#2a2a2a' : '#e5e7eb' }}
              >
                {c.avatar
                  ? <img src={c.avatar} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <User size={24} style={{ color: '#60A5FA' }} />
                }
              </div>
              <div>
                <p className="text-[17px] font-bold" style={{ color: isDark ? '#fff' : '#111' }}>
                  {c.name}
                </p>
                {c.phone?.[0] && (
                  <p className="text-[13px] mt-0.5 opacity-60" style={{ color: isDark ? '#ccc' : '#555' }}>
                    {c.phone[0]}
                  </p>
                )}
              </div>
            </div>

            {/* Phone links */}
            {c.phone?.map((ph: string, i: number) => (
              <a
                key={i}
                href={`tel:${ph}`}
                className="flex items-center gap-3 py-2.5 px-4 rounded-xl transition-opacity hover:opacity-75"
                style={{
                  backgroundColor: isDark ? '#2a2a2a' : '#f3f4f6',
                  color: '#60A5FA',
                  textDecoration: 'none',
                }}
              >
                <Phone size={15} />
                <span className="text-[14px] font-medium">{ph}</span>
              </a>
            ))}

            {/* vCard download if available */}
            {c.vCard && (
              <DownloadBtn
                url={`data:text/vcard;charset=utf-8,${encodeURIComponent(c.vCard)}`}
                filename={`${c.name.replace(/\s+/g, '_')}.vcf`}
                label="Save Contact"
                isSender={false}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Inline contact card (tap to open modal) ── */}
      <div
        className="rounded-[14px] overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
        style={{
          width: '230px',
          backgroundColor: isSender
            ? 'rgba(255,255,255,0.1)'
            : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          border: `0.5px solid ${isSender ? 'rgba(255,255,255,0.15)' : themeStyles.border}`,
        }}
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center gap-3 px-3 py-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: isSender ? 'rgba(255,255,255,0.18)' : 'rgba(96,165,250,0.18)' }}
          >
            {c.avatar
              ? <img src={c.avatar} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <User size={18} style={{ color: isSender ? '#fff' : '#60A5FA' }} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold truncate" style={{ color: isSender ? '#fff' : themeStyles.text }}>
              {c.name}
            </p>
            {c.phone?.[0] && (
              <p className="text-[11px] opacity-65" style={{ color: isSender ? '#fff' : themeStyles.textSecondary }}>
                {c.phone[0]}
              </p>
            )}
          </div>
          {/* Tap hint */}
          <ExternalLink
            size={13}
            style={{
              color: isSender ? 'rgba(255,255,255,0.45)' : themeStyles.textSecondary,
              flexShrink: 0,
            }}
          />
        </div>
      </div>
    </>
  );
}


function ProfileMessage({
  msg,
  isSender,
  isDark,
  themeStyles,
}: {
  msg: any;
  isSender: boolean;
  isDark: boolean;
  themeStyles: any;
}) {
  const [showModal,   setShowModal]   = useState<boolean>(false);
  const [profile,     setProfile]     = useState<any>(msg?.profileData || {});
  const [loadingUser, setLoadingUser] = useState<boolean>(false);

    useEffect(() => {
    const p = msg.profileData;
    if (!p?.userId) return;
    setLoadingUser(true);
    import('@/services/wieUserService')
        .then(mod => mod.getUserById(p.userId))
        .then(user => {
        const resolvedAvatar =
            user.profile_picture ||
            p.avatar             || 
            null;
        setProfile({
            userId:      user.id|| p.userId,
            name:        user.name        || p.name        || user.username || 'Wie User',
            username:    user.username    || p.username    || '',
            avatar:      resolvedAvatar,
            bio:         user.bio         || p.bio         || '',
            is_verified: user.is_verified ?? p.is_verified ?? false,
        });
        })
        .catch(() => {
        // On error fall back to whatever is stored in profileData
        setProfile(p);
        })
        .finally(() => setLoadingUser(false));
    }, [msg.profileData?.userId]); 

  if (!profile?.userId && !profile?.name) {
    return <span className="text-sm italic opacity-50">👤 Profile</span>;
  }

  const displayName = profile.name || profile.username || 'Wie User';
  const initial     = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* ── Expanded modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.80)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-[24px] overflow-hidden pb-10"
            style={{
              backgroundColor: isDark ? '#121316' : '#ffffff',
              border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Banner */}
            <div
              className="w-full h-24"
              style={{ background: 'linear-gradient(135deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)' }}
            />

            <div className="px-5 relative">
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-full overflow-hidden -mt-10 shadow-lg"
                style={{ border: `4px solid ${isDark ? '#121316' : '#fff'}` }}
              >
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={displayName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                    style={{ background: 'linear-gradient(135deg,#B3B8E2,#8860D9)' }}
                  >
                    {initial}
                  </div>
                )}
              </div>

              {/* Name row */}
              <div className="mt-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <p
                    className="text-[18px] font-bold"
                    style={{ color: isDark ? '#fff' : '#111' }}
                  >
                    {displayName}
                  </p>
                  {profile.is_verified && (
                    <svg className="w-4 h-4 flex-shrink-0" fill="#60A5FA" viewBox="0 0 20 20">
                      <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                    </svg>
                  )}
                </div>

                {profile.username && (
                  <p
                    className="text-[13px] mt-0.5"
                    style={{ color: isDark ? 'rgba(255,255,255,0.45)' : '#888' }}
                  >
                    @{profile.username}
                  </p>
                )}

                {profile.bio && (
                  <p
                    className="text-[13px] mt-2 leading-relaxed"
                    style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#555' }}
                  >
                    {profile.bio}
                  </p>
                )}
              </div>
                {profile.userId && (
                    <a
                        href={`/profile/${profile.userId}`}
                        className="block w-full text-center py-3 rounded-full text-[14px] font-semibold transition-opacity hover:opacity-80"
                        style={{
                        background: "linear-gradient(147.67deg,#2979FF 13%,#6B9CF0 54%,#9DC1FF 100%)",
                        color: "#fff",
                        textDecoration: "none",
                        }}
                    >
                        View Profile
                    </a>
                )}
            </div>
          </div>
        </div>
      )}

      {/* ── Inline card ── */}
      <div
        className="rounded-[16px] overflow-hidden cursor-pointer transition-opacity hover:opacity-90"
        style={{
          width: '230px',
          backgroundColor: isSender
            ? 'rgba(255,255,255,0.12)'
            : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
          border: `0.5px solid ${
            isSender
              ? 'rgba(255,255,255,0.18)'
              : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
          }`,
        }}
        onClick={() => setShowModal(true)}
      >
        {/* Mini banner */}
        <div
          className="w-full h-10"
          style={{
            background: 'linear-gradient(135deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)',
            opacity: 0.85,
          }}
        />

        <div className="px-3 pb-3 relative">
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-full overflow-hidden -mt-6 shadow-md"
            style={{
              border: `3px solid ${
                isSender ? 'rgba(84,148,255,0.6)' : isDark ? '#1a1a1a' : '#fff'
              }`,
            }}
          >
            {loadingUser ? (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#B3B8E2,#8860D9)' }}
              >
                <svg
                  className="animate-spin w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12" cy="12" r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
              </div>
            ) : profile.avatar ? (
              <img
                src={profile.avatar}
                alt={displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white text-lg font-bold"
                style={{ background: 'linear-gradient(135deg,#B3B8E2,#8860D9)' }}
              >
                {initial}
              </div>
            )}
          </div>

          {/* Name */}
          <div className="mt-2">
            {loadingUser ? (
              <div
                className="h-3.5 w-24 rounded-full animate-pulse"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                }}
              />
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <p
                    className="text-[14px] font-semibold truncate"
                    style={{ color: isSender ? '#fff' : themeStyles.text }}
                  >
                    {displayName}
                  </p>
                  {profile.is_verified && (
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="#60A5FA" viewBox="0 0 20 20">
                      <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                    </svg>
                  )}
                </div>

                {profile.username && (
                  <p
                    className="text-[11px] mt-0.5 truncate"
                    style={{
                      color: isSender
                        ? 'rgba(255,255,255,0.55)'
                        : themeStyles.textSecondary,
                    }}
                  >
                    @{profile.username}
                  </p>
                )}
              </>
            )}
          </div>

          <p
            className="text-[10px] mt-2 font-medium"
            style={{
              color: isSender ? 'rgba(255,255,255,0.4)' : themeStyles.textSecondary,
            }}
          >
            Tap to view profile
          </p>
        </div>
      </div>
    </>
  );
}


function EventMessage({
  msg,
  isSender,
  isDark,
  themeStyles,
}: {
  msg: any;
  isSender: boolean;
  isDark: boolean;
  themeStyles: any;
}) {
  const router = useRouter();
  const [eventData, setEventData] = useState<any>(msg.eventData || {});
  const [loading,   setLoading]   = useState(false);

  // ── Always fetch fresh from API using eventId ─────────────────────────────
  useEffect(() => {
    const e = msg.eventData;
    if (!e?.eventId) return;

    // If both name and image are present, no fetch needed
    if ((e.title || e.event_name) && (e.image || e.event_portrait || e.event_banner)) {
      setEventData(e);
      return;
    }

    setLoading(true);
    import('@/services/ticketUserService')
      .then(mod => mod.searchEventsByName({ searchQuery: e.title || e.event_name || '' }))
      .then(res => {
        const byCategory = res?.data?.eventsByCategory ?? {};
        const allEvents  = Object.values(byCategory).flat() as any[];
        const match      = allEvents.find(
          (ev: any) => (ev._id || ev.id) === e.eventId
        );
        if (match) {
          setEventData({
            eventId:    e.eventId,
            title:      match.event_name  || match.title  || e.title      || 'Event',
            image:      match.event_portrait || match.event_banner || match.image || e.image || null,
            venue:      match.venue       || match.location || e.venue    || null,
            startDate:  match.event_dates?.[0]?.start_date || match.startDate || e.startDate || null,
            endDate:    match.event_dates?.[0]?.end_date   || match.endDate   || e.endDate   || null,
            ticketUrl:  match.ticketUrl   || e.ticketUrl   || null,
            description: match.description || e.description || '',
          });
        } else {
          setEventData(e);
        }
      })
      .catch(() => setEventData(e))
      .finally(() => setLoading(false));
  }, [msg.eventData?.eventId]); // eslint-disable-line

  const e = eventData;

  if (!e?.eventId && !e?.title) {
    return <span className="text-sm italic opacity-50">🎟️ Event</span>;
  }

  const title      = e.title      || e.event_name   || 'Event';
  const imageUrl   = e.image      || e.event_portrait || e.event_banner || null;
  const venue      = e.venue      || e.location     || null;
  const startDate  = e.startDate  || e.start_date   || null;
  const eventId    = e.eventId    || e.id            || null;

  const formattedDate = (() => {
    if (!startDate) return null;
    try { return format(new Date(startDate), 'MMM d, yyyy · h:mm a'); }
    catch { return String(startDate); }
  })();

  return (
    <div
      className="rounded-[16px] overflow-hidden cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]"
      style={{
        width: '240px',
        backgroundColor: isSender
          ? 'rgba(255,255,255,0.12)'
          : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
        border: `0.5px solid ${
          isSender
            ? 'rgba(255,255,255,0.18)'
            : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
        }`,
      }}
      onClick={() => { if (eventId) router.push(`/events/${eventId}`); }}
    >
      {/* ── Image ── */}
      <div
        className="w-full relative overflow-hidden"
        style={{ height: '130px', backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0' }}
      >
        {loading ? (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#F472B6 0%,#A855F7 100%)', opacity: 0.4 }}
          >
            <svg className="animate-spin w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#F472B6 0%,#A855F7 100%)' }}
          >
            <Calendar size={32} className="text-white opacity-60" />
          </div>
        )}

        {/* Gradient overlay */}
        {!loading && (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)' }}
          />
        )}

        {/* Badge */}
        <div
          className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ backgroundColor: 'rgba(244,114,182,0.9)', color: '#fff' }}
        >
          🎟️ Event
        </div>
      </div>

      {/* ── Details ── */}
      <div className="px-3 py-2.5">
        {loading ? (
          <>
            <div
              className="h-3.5 w-36 rounded-full animate-pulse mb-2"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
            />
            <div
              className="h-2.5 w-24 rounded-full animate-pulse"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
            />
          </>
        ) : (
          <>
            <p
              className="text-[13px] font-semibold line-clamp-2 leading-snug"
              style={{ color: isSender ? '#fff' : themeStyles.text }}
            >
              {title}
            </p>

            {venue && (
              <div className="flex items-center gap-1 mt-1.5">
                <MapPin size={10} className="flex-shrink-0 text-[#F472B6]" />
                <p
                  className="text-[11px] truncate"
                  style={{ color: isSender ? 'rgba(255,255,255,0.6)' : themeStyles.textSecondary }}
                >
                  {venue}
                </p>
              </div>
            )}

            {formattedDate && (
              <div className="flex items-center gap-1 mt-1">
                <Calendar size={10} className="flex-shrink-0 text-[#F472B6]" />
                <p
                  className="text-[11px]"
                  style={{ color: isSender ? 'rgba(255,255,255,0.6)' : themeStyles.textSecondary }}
                >
                  {formattedDate}
                </p>
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <div
          className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold"
          style={{
            background: 'linear-gradient(135deg,#F472B6 0%,#A855F7 100%)',
            color: '#fff',
            opacity: loading ? 0.5 : 1,
          }}
        >
          View Event
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </div>
  );
}