'use client';

import React, { useState, useRef } from 'react';
import { useTheme } from '@/components/home/ThemeContext';
import CameraModal from '@/components/chat/CameraModal';

const GalleryIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <rect x="2" y="2" width="22" height="22" rx="5" stroke="#A78BFA" strokeWidth="1.8"/>
    <circle cx="9" cy="9" r="2.5" fill="#A78BFA"/>
    <path d="M2 17l6-6 5 5 3-3 8 8" stroke="#A78BFA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CameraIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <path d="M23 19a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3l2-3h6l2 3h3a2 2 0 012 2z" stroke="#F87171" strokeWidth="1.8" strokeLinejoin="round"/>
    <circle cx="13" cy="14" r="3.5" stroke="#F87171" strokeWidth="1.8"/>
  </svg>
);

const LocationIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <path d="M13 2C9.13 2 6 5.13 6 9c0 5.25 7 15 7 15s7-9.75 7-15c0-3.87-3.13-7-7-7z" stroke="#34D399" strokeWidth="1.8" strokeLinejoin="round"/>
    <circle cx="13" cy="9" r="2.5" stroke="#34D399" strokeWidth="1.8"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <circle cx="13" cy="9" r="4" stroke="#60A5FA" strokeWidth="1.8"/>
    <path d="M4 22c0-4.418 4.03-8 9-8s9 3.582 9 8" stroke="#60A5FA" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const DocumentIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <path d="M14 2H6a2 2 0 00-2 2v18a2 2 0 002 2h14a2 2 0 002-2V10L14 2z" stroke="#C084FC" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M14 2v8h8" stroke="#C084FC" strokeWidth="1.8" strokeLinejoin="round"/>
    <line x1="8" y1="14" x2="18" y2="14" stroke="#C084FC" strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="8" y1="18" x2="14" y2="18" stroke="#C084FC" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const AudioIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <circle cx="9" cy="18" r="3" stroke="#FB923C" strokeWidth="1.8"/>
    <circle cx="20" cy="15" r="3" stroke="#FB923C" strokeWidth="1.8"/>
    <path d="M12 18V7l11-3v11" stroke="#FB923C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PollIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <rect x="3" y="10" width="6" height="12" rx="1.5" stroke="#FBBF24" strokeWidth="1.8"/>
    <rect x="10" y="6" width="6" height="16" rx="1.5" stroke="#FBBF24" strokeWidth="1.8"/>
    <rect x="17" y="13" width="6" height="9" rx="1.5" stroke="#FBBF24" strokeWidth="1.8"/>
  </svg>
);

const EventsIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <rect x="3" y="5" width="20" height="18" rx="3" stroke="#F472B6" strokeWidth="1.8"/>
    <path d="M3 11h20" stroke="#F472B6" strokeWidth="1.8"/>
    <path d="M8 3v4M18 3v4" stroke="#F472B6" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M8 16l2.5 2.5L18 13" stroke="#F472B6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ICON_BG: Record<string, string> = {
  Gallery:  'rgba(167,139,250,0.15)',
  Camera:   'rgba(248,113,113,0.15)',
  Location: 'rgba(52,211,153,0.15)',
  Profile:  'rgba(96,165,250,0.15)',
  Document: 'rgba(192,132,252,0.15)',
  Audio:    'rgba(251,146,60,0.15)',
  Poll:     'rgba(251,191,36,0.15)',
  Events:   'rgba(244,114,182,0.15)',
};

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGallery: (files: File[]) => void;
  onSelectCamera: () => void;
  onSelectLocation: () => void;
  onSelectProfile: () => void;
  onSelectDocument: (file: File) => void;
  onSelectAudio: (file: File) => void;
  onSelectPoll?: () => void;
  onSelectEvents: () => void;
}

interface MediaItem {
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelectGallery,
  onSelectCamera,
  onSelectLocation,
  onSelectProfile,
  onSelectDocument,
  onSelectAudio,
  onSelectPoll,
  onSelectEvents,
}: MediaPickerModalProps) {
  const { isDark } = useTheme();

  const galleryInputRef  = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef    = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);

  if (!isOpen) return null;

  const items: MediaItem[] = [
    {
      label: 'Gallery',
      icon: <GalleryIcon />,
      action: () => galleryInputRef.current?.click(),
    },
    {
        label: 'Camera',
        icon: <CameraIcon />,
        action: () => {
            onClose();
            setShowCamera(true);
        },
    },
    {
      label: 'Location',
      icon: <LocationIcon />,
      action: () => { onClose(); onSelectLocation(); },
    },
    {
      label: 'Profile',
      icon: <ProfileIcon />,
      action: () => { onClose(); onSelectProfile(); },
    },
    {
      label: 'Document',
      icon: <DocumentIcon />,
      action: () => documentInputRef.current?.click(),
    },
    {
      label: 'Audio',
      icon: <AudioIcon />,
      action: () => audioInputRef.current?.click(),
    },
    {
      label: 'Poll',
      icon: <PollIcon />,
      action: () => { onClose(); onSelectPoll?.(); },
    },
    {
      label: 'Events',
      icon: <EventsIcon />,
      action: () => { onClose(); onSelectEvents(); },
    },
  ];

  return (
    <>
      {/* Hidden file inputs */}
        <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length) { onClose(); onSelectGallery(files); }
            e.target.value = '';
        }}
        />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) { onClose(); onSelectDocument(file); }
          e.target.value = '';
        }}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) { onClose(); onSelectAudio(file); }
          e.target.value = '';
        }}
      />

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Modal — matches spec: w=342, h=202, border-radius=21, glassmorphism */}
      <div
        className="absolute z-50"
        style={{
          /* Position: anchored above the input bar, left-aligned */
          bottom: 'calc(100% + 8px)',
          left: '0',
          width: '342px',

          /* Spec dimensions */
          height: '202px',
          borderRadius: '21px',

          /* Spec background */
          background: isDark
            ? 'linear-gradient(90.06deg, rgba(41,121,255,0.12) -327.97%, rgba(95,95,95,0.12) 147.32%)'
            : 'linear-gradient(90.06deg, rgba(41,121,255,0.08) -327.97%, rgba(95,95,95,0.08) 147.32%)',

          /* Spec border */
          border: '0.5px solid',
          borderColor: isDark
            ? 'rgba(96,96,96,0.35)'
            : 'rgba(96,96,96,0.25)',

          /* Spec backdrop-filter */
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',

          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          padding: '24px',
          boxSizing: 'border-box',

          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Row 1 — Gallery, Camera, Location, Profile */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '294px',   // spec inner width
            height: '70px',
          }}
        >
          {items.slice(0, 4).map((item) => (
            <MediaButton key={item.label} item={item} isDark={isDark} />
          ))}
        </div>

        {/* Row 2 — Document, Audio, Poll, Events */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '294px',
            height: '70px',
          }}
        >
          {items.slice(4, 8).map((item) => (
            <MediaButton key={item.label} item={item} isDark={isDark} />
          ))}
        </div>
      </div>
      <CameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={(files) => {
            setShowCamera(false);
            onSelectGallery(files);
        }}
      />
    </>
  );
}

function MediaButton({ item, isDark }: { item: MediaItem; isDark: boolean }) {
  return (
    <button
      type="button"
      onClick={item.action}
      style={{
        width: '48px',
        height: '70px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '8px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
      }}
    >
      {/* Icon container */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          backgroundColor: ICON_BG[item.label] || 'rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.15s ease, opacity 0.15s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.93)';
          (e.currentTarget as HTMLDivElement).style.opacity = '0.8';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLDivElement).style.opacity = '1';
        }}
      >
        {item.icon}
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: '10px',
          fontWeight: 500,
          color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)',
          letterSpacing: '0.01em',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {item.label}
      </span>
    </button>
  );
}