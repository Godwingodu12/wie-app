'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera, Video, FlipHorizontal, Circle, Square, Loader2 } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (files: File[]) => void;
}

type Mode = 'photo' | 'video';
type FacingMode = 'environment' | 'user';

export default function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const videoRef        = useRef<HTMLVideoElement>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const recorderRef     = useRef<MediaRecorder | null>(null);
  const chunksRef       = useRef<Blob[]>([]);
  const canvasRef       = useRef<HTMLCanvasElement>(null);

  const [mode,          setMode]          = useState<Mode>('photo');
  const [facingMode,    setFacingMode]    = useState<FacingMode>('environment');
  const [permState,     setPermState]     = useState<'requesting' | 'granted' | 'denied' | 'idle'>('idle');
  const [isRecording,   setIsRecording]   = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [flash,         setFlash]         = useState(false);
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Stop all tracks ────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // ── Start camera stream ────────────────────────────────────────────────────
  const startCamera = useCallback(async (facing: FacingMode) => {
    stopStream();
    setPermState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setPermState('granted');
    } catch (err: any) {
      setPermState(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'denied'
          : 'denied',
      );
    }
  }, [stopStream]);

  // ── On open/close ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setPermState('idle');
      setIsRecording(false);
      setRecordSeconds(0);
      setMode('photo');
      startCamera(facingMode);
    } else {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (!isOpen) stopStream();
    };
  }, [isOpen]); // eslint-disable-line

  // ── Flip camera ────────────────────────────────────────────────────────────
  const handleFlip = () => {
    const next: FacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  // ── Take photo ─────────────────────────────────────────────────────────────
  const handlePhoto = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture([file]);
      handleClose();
    }, 'image/jpeg', 0.92);
  }, [onCapture]); // eslint-disable-line

  // ── Record video ───────────────────────────────────────────────────────────
  const handleRecordStart = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const ext  = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const file = new File([blob], `video_${Date.now()}.${ext}`, { type: mimeType });
      onCapture([file]);
      handleClose();
    };

    recorder.start(100);
    setIsRecording(true);
    setRecordSeconds(0);
    timerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
  }, [onCapture]); // eslint-disable-line

  const handleRecordStop = useCallback(() => {
    recorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const handleClose = useCallback(() => {
    stopStream();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setRecordSeconds(0);
    onClose();
  }, [stopStream, onClose]);

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (!isOpen) return null;

  // ── Permission denied screen ───────────────────────────────────────────────
  if (permState === 'denied') {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center px-8 text-center gap-5">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}
        >
          <Camera size={30} className="text-red-400" />
        </div>

        <div>
          <p className="text-white text-[18px] font-semibold mb-2">Camera Access Denied</p>
          <p className="text-white/55 text-[13px] leading-relaxed">
            This app needs camera permission to take photos and videos.
            Please allow camera access in your browser settings and try again.
          </p>
        </div>

        {/* Step-by-step instructions */}
        <div
          className="w-full rounded-2xl p-4 text-left"
          style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)' }}
        >
          <p className="text-white/70 text-[12px] font-semibold mb-3 uppercase tracking-wider">
            How to allow camera
          </p>
          {[
            'Click the 🔒 lock icon in your browser address bar',
            'Find "Camera" in the permissions list',
            'Change it to "Allow"',
            'Refresh the page and try again',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 mb-2.5">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                style={{ backgroundColor: '#5494FF', color: '#fff' }}
              >
                {i + 1}
              </span>
              <p className="text-white/65 text-[13px] leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={handleClose}
            className="flex-1 py-3 rounded-full text-[14px] font-semibold"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
          >
            Cancel
          </button>
          <button
            onClick={() => startCamera(facingMode)}
            className="flex-1 py-3 rounded-full text-[14px] font-semibold"
            style={{
              background: 'linear-gradient(147.67deg,#2979FF 13%,#6B9CF0 54%,#9DC1FF 100%)',
              color: '#fff',
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Main camera UI ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">

      {/* Flash overlay */}
      {flash && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none" style={{ opacity: 0.85 }} />
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 pt-10 pb-4 z-10 absolute top-0 left-0 right-0">
        <button
          onClick={handleClose}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        >
          <X size={18} className="text-white" />
        </button>

        {/* Recording timer */}
        {isRecording && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-[13px] font-semibold tabular-nums">
              {fmtTime(recordSeconds)}
            </span>
          </div>
        )}

        {/* Flip camera */}
        <button
          onClick={handleFlip}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        >
          <FlipHorizontal size={18} className="text-white" />
        </button>
      </div>

      {/* ── Video preview (full screen) ── */}
      <div className="flex-1 relative overflow-hidden">
        {permState === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black z-10">
            <Loader2 size={28} className="animate-spin text-white/60" />
            <p className="text-white/50 text-[13px]">Starting camera…</p>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width:      '100%',
            height:     '100%',
            objectFit:  'cover',
            transform:  facingMode === 'user' ? 'scaleX(-1)' : 'none',
            display:    'block',
          }}
        />
      </div>

      {/* ── Bottom controls ── */}
      <div
        className="flex flex-col items-center gap-5 pb-10 pt-6"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      >
        {/* Mode toggle */}
        <div
          className="flex items-center rounded-full p-1"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          <button
            onClick={() => { if (isRecording) return; setMode('photo'); }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all"
            style={{
              backgroundColor: mode === 'photo' ? '#fff' : 'transparent',
              color:           mode === 'photo' ? '#000' : 'rgba(255,255,255,0.6)',
            }}
          >
            <Camera size={13} />
            Photo
          </button>
          <button
            onClick={() => { if (isRecording) return; setMode('video'); }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all"
            style={{
              backgroundColor: mode === 'video' ? '#fff' : 'transparent',
              color:           mode === 'video' ? '#000' : 'rgba(255,255,255,0.6)',
            }}
          >
            <Video size={13} />
            Video
          </button>
        </div>

        {/* Shutter / Record button */}
        <div className="flex items-center justify-center">
          {mode === 'photo' ? (
            // Photo shutter
            <button
              onClick={handlePhoto}
              disabled={permState !== 'granted'}
              className="relative flex items-center justify-center transition-transform active:scale-90"
              style={{
                width:  '72px',
                height: '72px',
              }}
            >
              {/* Outer ring */}
              <div
                className="absolute inset-0 rounded-full border-4 border-white"
                style={{ opacity: permState === 'granted' ? 1 : 0.3 }}
              />
              {/* Inner fill */}
              <div
                className="w-[56px] h-[56px] rounded-full bg-white"
                style={{ opacity: permState === 'granted' ? 1 : 0.3 }}
              />
            </button>
          ) : (
            // Video record button
            <button
              onClick={isRecording ? handleRecordStop : handleRecordStart}
              disabled={permState !== 'granted'}
              className="relative flex items-center justify-center transition-transform active:scale-90"
              style={{ width: '72px', height: '72px' }}
            >
              {/* Outer ring */}
              <div
                className="absolute inset-0 rounded-full border-4"
                style={{
                  borderColor: isRecording ? '#ef4444' : 'white',
                  opacity: permState === 'granted' ? 1 : 0.3,
                }}
              />
              {/* Inner — circle when idle, square when recording */}
              <div
                style={{
                  width:           isRecording ? '28px' : '52px',
                  height:          isRecording ? '28px' : '52px',
                  borderRadius:    isRecording ? '6px' : '50%',
                  backgroundColor: isRecording ? '#ef4444' : 'white',
                  transition:      'all 0.2s ease',
                  opacity:         permState === 'granted' ? 1 : 0.3,
                }}
              />
            </button>
          )}
        </div>

        <p className="text-white/35 text-[11px]">
          {mode === 'photo'
            ? 'Tap to take a photo'
            : isRecording
              ? 'Tap to stop recording'
              : 'Tap to start recording'
          }
        </p>
      </div>
    </div>
  );
}