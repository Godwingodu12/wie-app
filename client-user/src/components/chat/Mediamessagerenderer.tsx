'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
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

export interface RenderMediaOptions {
  uploadProgress?: number;
  currentUserId?: string;
  chatId?: string;
  onMarkViewed?: (messageId: string, finalView?: boolean) => void;
  replayedSet?: Set<string>;
  addToReplayed?: (id: string) => void;
}

export const renderMediaMessage = (
  message: any,
  isSender: boolean,
  themeStyles: any,
  isDark: boolean,
  options: RenderMediaOptions | number = {},
): React.ReactNode => {
  // backwards-compat: old callers may pass a number for uploadProgress
  const opts: RenderMediaOptions =
    typeof options === 'number' ? { uploadProgress: options } : options;
  const { uploadProgress, currentUserId, onMarkViewed, replayedSet, addToReplayed } = opts;
  switch (message.messageType) {
    case 'image':
      return (
        <ImageMessage
          msg={message} isSender={isSender} isDark={isDark} themeStyles={themeStyles}
          uploadProgress={uploadProgress} currentUserId={currentUserId}
          onMarkViewed={onMarkViewed} replayedSet={replayedSet} addToReplayed={addToReplayed}
        />
      );
    case 'video':
      return (
        <VideoMessage
          msg={message} isSender={isSender} isDark={isDark} themeStyles={themeStyles}
          uploadProgress={uploadProgress} currentUserId={currentUserId}
          onMarkViewed={onMarkViewed} replayedSet={replayedSet} addToReplayed={addToReplayed}
        />
      );
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
function CaptionText({
  content,
  isSender,
  themeStyles,
}: {
  content?: string;
  isSender: boolean;
  themeStyles: any;
}) {
  if (!content || content.startsWith('📷') || content.startsWith('🎥') ||
      content.startsWith('📎') || content.startsWith('🎵') ||
      content.startsWith('🎤') || content === '📍 Location' ||
      content === '👤 Contact' || content === '👤 Profile' ||
      content === '🎟️ Event') return null;

  return (
    <p
      className="text-[13px] leading-snug mt-1.5 break-words"
      style={{ color: isSender ? 'rgba(255,255,255,0.92)' : themeStyles.text }}
    >
      {content}
    </p>
  );
}
function Lightbox({
  images,
  startIndex,
  onClose,
  hideDownload = false,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
  hideDownload?: boolean;
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
        {!hideDownload && (
          <DownloadBtn url={images[cur]} filename={`image_${cur + 1}.jpg`} isSender={false} />
        )}
      </div>
    </div>
  );
}

const ViewOnceCircle = ({ color = '#fff', size = 22 }: { color?: string; size?: number }) => (
  <div
    className="rounded-full border-2 flex items-center justify-center font-bold flex-shrink-0"
    style={{ width: size, height: size, borderColor: color, color, fontSize: size * 0.45 }}
  >
    1
  </div>
);
//  View Mode Selector Sheet 
export type MediaViewMode = 'view_once' | 'allow_replay' | 'keep';

interface ViewModeSelectorSheetProps {
  files: File[];
  onConfirm: (viewMode: MediaViewMode, caption: string) => void;
  onClose: () => void;
  isDark: boolean;
  caption?: string;
  onCaptionChange?: (val: string) => void;
}

export function ViewModeSelectorSheet({
  files,
  onConfirm,
  onClose,
  isDark,
  caption = '',
  onCaptionChange,
}: ViewModeSelectorSheetProps) {
  const [selectedMode, setSelectedMode] = React.useState<MediaViewMode>('keep');
  const [localCaption, setLocalCaption] = React.useState(caption);
  const captionRef = React.useRef<HTMLInputElement>(null);

  const handleCaptionChange = (val: string) => {
    setLocalCaption(val);
    onCaptionChange?.(val);
  };
  const [previewUrls, setPreviewUrls] = React.useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = React.useState(0);

  // Generate blob preview URLs for selected files
  React.useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviewUrls(urls);
    setPreviewIndex(0);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [files]);

  if (!files.length || !previewUrls.length) return null;

  const isVideo = files[previewIndex]?.type?.startsWith('video/');

  const MODES: {
    id: MediaViewMode;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: 'view_once',
      label: 'View Once',
      sublabel: 'Disappears after opening',
      color: '#F472B6',
      icon: (
        <div
          className="rounded-full border-[2px] flex items-center justify-center font-bold"
          style={{ width: 22, height: 22, borderColor: 'currentColor', fontSize: 10 }}
        >
          1
        </div>
      ),
    },
    {
      id: 'allow_replay',
      label: 'Allow Replay',
      sublabel: 'Can be replayed once',
      color: '#60A5FA',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 4v6h6"/>
          <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
        </svg>
      ),
    },
    {
      id: 'keep',
      label: 'Keep in Chat',
      sublabel: 'Stays in conversation',
      color: '#34D399',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      ),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
      >
        <X size={18} color="#fff" />
      </button>

      {/* ── Full-size preview ── */}
      <div className="flex-1 w-full flex flex-col items-center justify-center px-4 pb-4 min-h-0">
        {/* Thumbnail strip (if multiple files) */}
        {files.length > 1 && (
          <div className="flex gap-2 mb-3 flex-wrap justify-center">
            {previewUrls.map((url, i) => (
              <button
                key={i}
                onClick={() => setPreviewIndex(i)}
                className="relative overflow-hidden rounded-lg flex-shrink-0"
                style={{
                  width: 48, height: 48,
                  border: i === previewIndex
                    ? '2px solid #5494FF'
                    : '2px solid transparent',
                  opacity: i === previewIndex ? 1 : 0.55,
                }}
              >
                {files[i]?.type?.startsWith('video/')
                  ? <video src={url} className="w-full h-full object-cover" preload="metadata" />
                  : <img src={url} alt="" className="w-full h-full object-cover" />
                }
              </button>
            ))}
          </div>
        )}

        {/* Main preview */}
        <div
          className="relative rounded-2xl overflow-hidden flex items-center justify-center"
          style={{
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 340px)',
            width: '100%',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          {isVideo ? (
            <video
              key={previewUrls[previewIndex]}
              src={previewUrls[previewIndex]}
              controls
              className="rounded-2xl"
              style={{ maxHeight: 'calc(100vh - 340px)', maxWidth: '100%', display: 'block' }}
            />
          ) : (
            <img
              key={previewUrls[previewIndex]}
              src={previewUrls[previewIndex]}
              alt="Preview"
              className="rounded-2xl"
              style={{
                maxHeight: 'calc(100vh - 340px)',
                maxWidth: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          )}

          {/* File count badge */}
          {files.length > 1 && (
            <div
              className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[11px] font-bold text-white"
              style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
            >
              {previewIndex + 1} / {files.length}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom sheet ── */}
      <div
        className="w-full rounded-t-[24px] px-5 pt-5 pb-8 flex flex-col gap-4"
        style={{
          backgroundColor: isDark ? '#18181b' : '#ffffff',
          border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        }}
      >
        {/* Mode options */}
        <div className="flex gap-3">
          {MODES.map(mode => {
            const isActive = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className="flex-1 flex flex-col items-center gap-2 py-3.5 rounded-2xl transition-all"
                style={{
                  backgroundColor: isActive
                    ? `${mode.color}22`
                    : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  border: `1.5px solid ${isActive ? mode.color : 'transparent'}`,
                  color: isActive ? mode.color : isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)',
                }}
              >
                {/* Icon */}
                <span style={{ color: isActive ? mode.color : isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)' }}>
                  {mode.icon}
                </span>

                {/* Label */}
                <span
                  className="text-[11px] font-semibold text-center leading-tight"
                  style={{ color: isActive ? mode.color : isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}
                >
                  {mode.label}
                </span>

                {/* Sublabel */}
                <span
                  className="text-[9px] text-center leading-tight"
                  style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)' }}
                >
                  {mode.sublabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Caption input */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-full"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          }}
        >
          <input
            ref={captionRef}
            type="text"
            value={localCaption}
            onChange={(e) => handleCaptionChange(e.target.value)}
            placeholder="Add a caption..."
            maxLength={500}
            className="flex-1 bg-transparent border-none outline-none text-[14px]"
            style={{ color: isDark ? '#fff' : '#111' }}
          />
          {localCaption.length > 0 && (
            <button
              type="button"
              onClick={() => handleCaptionChange('')}
              className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X size={14} color={isDark ? '#fff' : '#333'} />
            </button>
          )}
        </div>

        <button
          onClick={() => onConfirm(selectedMode, localCaption)}
          className="w-full py-3.5 rounded-full text-[15px] font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(147.67deg, #2979FF 13.16%, #6B9CF0 54.09%, #9DC1FF 100.03%)',
          }}
        >
          Send {files.length > 1 ? `${files.length} Files` : isVideo ? 'Video' : 'Photo'}
        </button>
      </div>
    </div>
  );
}
const getViewMode = (msg: any): 'view_once' | 'allow_replay' | 'keep' => {
  return (
    msg.viewMode ||
    msg.chat_images?.[0]?.viewMode ||
    msg.chat_videos?.[0]?.viewMode ||
    'keep'
  );
};

const isViewedByUser = (msg: any, userId?: string): boolean => {
  if (!userId) return false;
  const imgViewed = msg.chat_images?.[0]?.viewedBy?.includes(userId);
  const vidViewed = msg.chat_videos?.[0]?.viewedBy?.includes(userId);
  return !!(imgViewed || vidViewed);
};

interface MediaMsgProps {
  msg: any;
  isSender: boolean;
  isDark: boolean;
  themeStyles: any;
  uploadProgress?: number;
  currentUserId?: string;
  onMarkViewed?: (messageId: string, finalView?: boolean) => void;
  replayedSet?: Set<string>;
  addToReplayed?: (id: string) => void;
}

function ImageMessage({
  msg, isSender, isDark, themeStyles, uploadProgress,
  currentUserId, onMarkViewed, replayedSet, addToReplayed,
}: MediaMsgProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isViewing, setIsViewing]       = useState(false);
  const viewMode    = getViewMode(msg);
  const isEphemeral = viewMode === 'view_once' || viewMode === 'allow_replay';
  const viewed      = isViewedByUser(msg, currentUserId);

  const handleOpen = () => {
    if (!isEphemeral || isSender) { setLightboxOpen(true); return; }
    if (viewed && !isViewing) return;

    // Set isViewing BEFORE calling onMarkViewed so the re-render
    // from viewedBy update doesn't collapse to "Opened" mid-open
    setIsViewing(true);
    setLightboxOpen(true);

    if (viewMode === 'allow_replay') {
      const alreadyReplayed = replayedSet?.has(msg._id);
      if (alreadyReplayed) {
        onMarkViewed?.(msg._id, true);
      } else {
        addToReplayed?.(msg._id);
        onMarkViewed?.(msg._id, false);
      }
    } else {
      onMarkViewed?.(msg._id, true);
    }
  };

  const handleClose = () => {
    setLightboxOpen(false);
    setIsViewing(false);
  };

  const images: string[] = (() => {
    if (msg._localPreviews?.length) return msg._localPreviews;
    const raw = msg.chat_images || [];
    return raw.map((img: any) => (typeof img === 'string' ? img : img.url)).filter(Boolean);
  })();

  // ── Ephemeral receiver states ──────────────────────────────────────────
  if (isEphemeral && !isSender) {
    // Actively viewing — render the "Opened" chip AND the lightbox on top
    if (isViewing && images.length > 0) {
      return (
        <>
          {/* Chip stays in the bubble while lightbox is open */}
          <div className="flex items-center gap-2 py-1 px-1">
            <ViewOnceCircle color={themeStyles.textSecondary} size={20} />
            <span className="text-[13px]" style={{ color: themeStyles.textSecondary }}>
              {viewMode === 'allow_replay' ? 'Replayed' : 'Opened'}
            </span>
          </div>
          {/* Full-screen lightbox rendered via portal-like fixed positioning */}
          <Lightbox images={images} startIndex={0} onClose={handleClose} hideDownload />
        </>
      );
    }

    // Already consumed — show status chip only
    if (viewed) {
      return (
        <div className="flex items-center gap-2 py-1 px-1">
          <ViewOnceCircle color={themeStyles.textSecondary} size={20} />
          <span className="text-[13px]" style={{ color: themeStyles.textSecondary }}>
            {viewMode === 'allow_replay' ? 'Replayed' : 'Opened'}
          </span>
        </div>
      );
    }

    // Not yet viewed — tap prompt
    return (
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 py-1 px-1 hover:opacity-80 transition-opacity"
      >
        <ViewOnceCircle color="#fff" size={22} />
        <span className="text-[13px] text-white font-medium">
          {viewMode === 'view_once' ? 'Tap to view photo' : 'Tap to view · replay once'}
        </span>
      </button>
    );
  }

  if (isEphemeral && isSender) {
    const allViewers: string[] = (msg.chat_images || []).flatMap(
      (img: any) => Array.isArray(img?.viewedBy) ? img.viewedBy : []
    );
    const receiverViewed = allViewers.some(
      (id: string) => id !== currentUserId && id !== '' && id !== undefined
    );
    return (
      <div className="flex items-center gap-2 py-1 px-1">
        <ViewOnceCircle color="rgba(255,255,255,0.9)" size={22} />
        <div className="flex flex-col">
          <span className="text-[13px] text-white font-medium">
            {viewMode === 'view_once' ? 'View once' : 'View once · replay'}
          </span>
          <span className="text-[10px] text-white/60">
            {receiverViewed ? 'Opened' : 'Not yet opened'}
          </span>
        </div>
      </div>
    );
  }

  // ── Normal (keep) image display ────────────────────────────────────────
  if (!images.length) return null;

  return (
    <>
      <div
        className={`grid gap-1 cursor-pointer ${
          images.length === 1 ? '' : 'grid-cols-2'
        }`}
        onClick={handleOpen}
      >
        {images.slice(0, 4).map((src, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-lg"
            style={{ maxWidth: 220, maxHeight: 220 }}
          >
            <img
              src={src}
              alt="chat"
              className="w-full h-full object-cover block"
              style={{ maxHeight: 220 }}
            />
            {uploadProgress !== undefined && uploadProgress < 100 && i === 0 && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                <svg width="44" height="44" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3.5"/>
                  <circle
                    cx="22" cy="22" r="18" fill="none" stroke="#fff" strokeWidth="3.5"
                    strokeDasharray={`${2 * Math.PI * 18}`}
                    strokeDashoffset={`${2 * Math.PI * 18 * (1 - (uploadProgress || 0) / 100)}`}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                  />
                </svg>
                <span className="text-white text-[11px] font-bold">{uploadProgress}%</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {lightboxOpen && (
        <Lightbox images={images} startIndex={0} onClose={handleClose} />
      )}
      <CaptionText content={msg.content} isSender={isSender} themeStyles={themeStyles} />
    </>
  );
}

function VideoMessage({
  msg, isSender, isDark, themeStyles, uploadProgress,
  currentUserId, onMarkViewed, replayedSet, addToReplayed,
}: MediaMsgProps) {
  const [playing, setPlaying]       = useState(false);
  const [isViewing, setIsViewing]   = useState(false);
  const videoRef                    = useRef<HTMLVideoElement>(null);
  const viewMode                    = getViewMode(msg);
  const isEphemeral                 = viewMode === 'view_once' || viewMode === 'allow_replay';
  const viewed                      = isViewedByUser(msg, currentUserId);

  const videos: any[] = msg.chat_videos || [];
  const videoSrc      = videos[0]?.url || '';

  const handlePlay = () => {
    if (!isEphemeral || isSender) { setPlaying(true); return; }
    if (viewed && !isViewing) return;

    // Set isViewing BEFORE onMarkViewed so re-render from viewedBy
    // update doesn't collapse to "Opened" before the player shows
    setIsViewing(true);
    setPlaying(true);

    if (viewMode === 'allow_replay') {
      const alreadyReplayed = replayedSet?.has(msg._id);
      onMarkViewed?.(msg._id, !!alreadyReplayed);
      if (!alreadyReplayed) addToReplayed?.(msg._id);
    } else {
      onMarkViewed?.(msg._id, true);
    }
  };

  const handleClose = () => {
    setIsViewing(false);
    setPlaying(false);
  };

  // ── Ephemeral receiver states ──────────────────────────────────────────
  if (isEphemeral && !isSender) {
    // Actively viewing — show fullscreen player
    if (isViewing && videoSrc) {
      return (
        <>
          {/* Status chip stays in bubble while player is open */}
          <div className="flex items-center gap-2 py-1 px-1">
            <ViewOnceCircle color={themeStyles.textSecondary} size={20} />
            <span className="text-[13px]" style={{ color: themeStyles.textSecondary }}>
              {viewMode === 'allow_replay' ? 'Replayed' : 'Opened'}
            </span>
          </div>
          {/* Fullscreen video player */}
          <div
            className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
            onClick={handleClose}
          >
            <button
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center z-10"
              onClick={handleClose}
            >
              <X size={18} color="#fff" />
            </button>
            <video
              src={videoSrc}
              controls
              autoPlay
              controlsList="nodownload"
              onContextMenu={e => e.preventDefault()}
              className="max-w-full max-h-[85vh] rounded-xl"
              onClick={e => e.stopPropagation()}
            />
          </div>
        </>
      );
    }

    // Already consumed — show status chip only
    if (viewed) {
      return (
        <div className="flex items-center gap-2 py-1 px-1">
          <ViewOnceCircle color={themeStyles.textSecondary} size={20} />
          <span className="text-[13px]" style={{ color: themeStyles.textSecondary }}>
            {viewMode === 'allow_replay' ? 'Replayed' : 'Opened'}
          </span>
        </div>
      );
    }

    // Not yet viewed — tap prompt
    return (
      <button
        onClick={handlePlay}
        className="flex items-center gap-2 py-1 px-1 hover:opacity-80 transition-opacity"
      >
        <ViewOnceCircle color="#fff" size={22} />
        <span className="text-[13px] text-white font-medium">
          {viewMode === 'view_once' ? 'Tap to view video' : 'Tap to view · replay once'}
        </span>
      </button>
    );
  }

  if (isEphemeral && isSender) {
    const allViewers: string[] = (msg.chat_videos || []).flatMap(
      (vid: any) => Array.isArray(vid?.viewedBy) ? vid.viewedBy : []
    );
    const receiverViewed = allViewers.some(
      (id: string) => id !== currentUserId && id !== '' && id !== undefined
    );
    return (
      <div className="flex items-center gap-2 py-1 px-1">
        <ViewOnceCircle color="rgba(255,255,255,0.9)" size={22} />
        <div className="flex flex-col">
          <span className="text-[13px] text-white font-medium">
            {viewMode === 'view_once' ? 'View once' : 'View once · replay'}
          </span>
          <span className="text-[10px] text-white/60">
            {receiverViewed ? 'Opened' : 'Not yet opened'}
          </span>
        </div>
      </div>
    );
  }

  if (!videoSrc) return null;

  return (
    <div
      className="relative overflow-hidden rounded-lg cursor-pointer"
      style={{ maxWidth: 260 }}
    >
      {playing ? (
        <video
          ref={videoRef}
          src={videoSrc}
          controls
          autoPlay
          {...(isEphemeral ? { controlsList: 'nodownload', onContextMenu: (e: React.MouseEvent) => e.preventDefault() } : {})}
          className="w-full rounded-lg"
          style={{ maxHeight: 320 }}
        />
      ) : (
        <div
          onClick={handlePlay}
          className="relative flex items-center justify-center bg-black rounded-lg overflow-hidden"
          style={{ minWidth: 180, minHeight: 120, maxWidth: 260, maxHeight: 260 }}
        >
          <video
            src={videoSrc}
            className="w-full h-full object-cover opacity-70"
            preload="metadata"
          />
          <div className="absolute w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          {uploadProgress !== undefined && uploadProgress < 100 && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3.5"/>
                <circle
                  cx="22" cy="22" r="18" fill="none" stroke="#fff" strokeWidth="3.5"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset={`${2 * Math.PI * 18 * (1 - (uploadProgress || 0) / 100)}`}
                  style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                />
              </svg>
              <span className="text-white text-[11px] font-bold">{uploadProgress}%</span>
            </div>
          )}
        </div>
      )}
       <CaptionText content={msg.content} isSender={isSender} themeStyles={themeStyles} />
    </div>
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
      <CaptionText content={msg.content} isSender={isSender} themeStyles={themeStyles} />
    </div>
  );
}

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
      <CaptionText content={msg.content} isSender={isSender} themeStyles={themeStyles} />
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
    {/* Map preview — fully local SVG, no external requests */}
      <div
        className="relative flex items-center justify-center"
        style={{ height: '90px', backgroundColor: isDark ? '#1a2035' : '#dbeafe', overflow: 'hidden' }}
      >
        {/* SVG fake map tile — zero network calls */}
        <svg
          width="100%"
          height="90"
          viewBox="0 0 230 90"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* Background */}
          <rect width="230" height="90" fill={isDark ? '#1a2035' : '#d1e8d1'} />

          {/* Grid lines */}
          {[23, 46, 69, 92, 115, 138, 161, 184, 207].map(x => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="90" stroke={isDark ? '#2a3550' : '#b8d8b8'} strokeWidth="0.8" />
          ))}
          {[18, 36, 54, 72].map(y => (
            <line key={`h${y}`} x1="0" y1={y} x2="230" y2={y} stroke={isDark ? '#2a3550' : '#b8d8b8'} strokeWidth="0.8" />
          ))}

          {/* Fake roads */}
          <path d="M0 45 Q57 38 115 45 Q172 52 230 45" stroke={isDark ? '#3a4a6a' : '#ffffff'} strokeWidth="4" fill="none" />
          <path d="M0 45 Q57 38 115 45 Q172 52 230 45" stroke={isDark ? '#4a5a7a' : '#f0f0f0'} strokeWidth="2" fill="none" strokeDasharray="none" />
          <path d="M80 0 Q95 45 90 90" stroke={isDark ? '#3a4a6a' : '#ffffff'} strokeWidth="3" fill="none" />
          <path d="M150 0 Q160 45 155 90" stroke={isDark ? '#3a4a6a' : '#ffffff'} strokeWidth="2" fill="none" />

          {/* Park / block fills */}
          <rect x="10" y="5" width="55" height="28" rx="3" fill={isDark ? '#1e3a2a' : '#c8e6c9'} opacity="0.7" />
          <rect x="160" y="55" width="55" height="28" rx="3" fill={isDark ? '#1e3a2a' : '#c8e6c9'} opacity="0.7" />
          <rect x="100" y="55" width="40" height="22" rx="3" fill={isDark ? '#2a2a3a' : '#e3e3e3'} opacity="0.6" />
        </svg>

        {/* Pin icon centred on top of the SVG */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {isLive && !expired
            ? <Navigation size={26} style={{ color: '#34D399', filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.7))', position: 'relative', zIndex: 2 }} />
            : <MapPin size={26} style={{ color: '#5494FF', filter: 'drop-shadow(0 0 4px rgba(84,148,255,0.6))', position: 'relative', zIndex: 2 }} />
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
// ─── Caption Sheet for Doc / Audio 
export function CaptionSheet({
  file,
  isDark,
  themeStyles,
  onClose,
  onSend,
}: {
  file: File;
  isDark: boolean;
  themeStyles: any;
  onClose: () => void;
  onSend: (caption: string) => void;
}) {
  const [caption, setCaption] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const ext     = file.name.split('.').pop()?.toLowerCase() || 'file';
  const isAudio = file.type.startsWith('audio/');
  const sizeStr = file.size > 1_048_576
    ? `${(file.size / 1_048_576).toFixed(1)} MB`
    : `${(file.size / 1024).toFixed(0)} KB`;

  const EXT_COLORS: Record<string, string> = {
    pdf: '#F87171', doc: '#60A5FA', docx: '#60A5FA',
    xls: '#34D399', xlsx: '#34D399', csv: '#34D399',
    mp3: '#FB923C', wav: '#FB923C', m4a: '#FB923C', ogg: '#FB923C',
  };
  const color = EXT_COLORS[ext] || '#9CA3AF';

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-[24px] px-5 pt-5 pb-8 flex flex-col gap-4"
        style={{
          backgroundColor: isDark ? '#18181b' : '#ffffff',
          border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* File preview row */}
        <div
          className="flex items-center gap-3 p-3 rounded-2xl"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}22` }}
          >
            {isAudio
              ? <Music size={22} style={{ color }} />
              : <FileText size={22} style={{ color }} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-[14px] font-semibold truncate"
              style={{ color: isDark ? '#fff' : '#111' }}
            >
              {file.name}
            </p>
            <p
              className="text-[11px] mt-0.5 uppercase font-bold"
              style={{ color }}
            >
              {ext} · {sizeStr}
            </p>
          </div>
        </div>

        {/* Caption input */}
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-full"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(caption); } }}
            placeholder="Add a caption..."
            maxLength={500}
            className="flex-1 bg-transparent border-none outline-none text-[14px]"
            style={{ color: isDark ? '#fff' : '#111' }}
          />
          {caption.length > 0 && (
            <button
              type="button"
              onClick={() => setCaption('')}
              className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X size={14} color={isDark ? '#fff' : '#333'} />
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full text-[14px] font-semibold transition-opacity hover:opacity-75"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              color: isDark ? 'rgba(255,255,255,0.7)' : '#555',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSend(caption)}
            className="flex-1 py-3 rounded-full text-[14px] font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(147.67deg, #2979FF 13.16%, #6B9CF0 54.09%, #9DC1FF 100.03%)',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
