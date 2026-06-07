'use client';
import React, { useEffect, useRef, useState } from 'react';
import { X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../home/ThemeContext';
import {
  registerFaceFromProfile,
  startFaceSession,
  submitFaceFrame,
  completeFaceVerification,
} from '../../services/connectionService';
import type { PoseLabel, SubmitFrameResponse } from '../../types/connection';

type VerifyStage =
  | 'registering'
  | 'instructions'
  | 'liveness'
  | 'matching'
  | 'success'
  | 'failed';

interface UploadedPhoto { url: string; publicId: string; }

interface Props {
  uploadedPhotos: UploadedPhoto[];   // ← photos already on Cloudinary
  onClose: () => void;
  onVerified: () => void;
}

const POSE_META: Record<PoseLabel, { label: string; arrow: string }> = {
  center: { label: 'Look straight ahead', arrow: '👀' },
  left: { label: 'Turn head LEFT', arrow: '⬅️' },
  right: { label: 'Turn head RIGHT', arrow: '➡️' },
  up: { label: 'Look UP', arrow: '⬆️' },
  down: { label: 'Look DOWN', arrow: '⬇️' },
};

const POSE_DURATION_MS = 1600;
const FRAME_INTERVAL_MS = 400;

export const FaceVerificationModal: React.FC<Props> = ({
  uploadedPhotos,
  onClose,
  onVerified,
}) => {
  const { isDark, themeStyles } = useTheme();

  const [stage, setStage] = useState<VerifyStage>('registering');
  const [errorMsg, setErrorMsg] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [sequence, setSequence] = useState<PoseLabel[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [similarity, setSimilarity] = useState(0);
  const [guidePoseIdx, setGuidePoseIdx] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const guideCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const guideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const livenessOKRef = useRef(false);
  const isRegisteredRef = useRef(false);
  // Step 1: register embeddings from uploaded photos 
  useEffect(() => {
    (async () => {
      if (isRegisteredRef.current) {
        setStage('instructions');
        return;
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setErrorMsg('Session expired. Please refresh the page and try again.');
        setStage('failed');
        return;
      }

      if (uploadedPhotos.length < 2) {
        setErrorMsg('Please upload at least 2 photos before face verification.');
        setStage('failed');
        return;
      }

      try {
        const res = await registerFaceFromProfile();

        if (res.success) {
          isRegisteredRef.current = true;

          // If already verified, skip liveness and call onVerified directly
          if ((res as any).alreadyVerified) {
            onVerified();
            return;
          }

          setStage('instructions');
        } else {
          setErrorMsg(res.message || 'Face registration failed. Please try again.');
          setStage('failed');
        }
      } catch (err: any) {
        const serverMsg = err?.response?.data?.message || '';
        const networkMsg = err?.message || '';
        const status = err?.response?.status;

        if (status === 503 || serverMsg.includes('unavailable')) {
          setErrorMsg(serverMsg || 'Verification service is temporarily unavailable.');
        } else if (networkMsg.includes('ECONNREFUSED') || networkMsg.includes('Network Error')) {
          setErrorMsg('Could not reach the server. Please check your connection.');
        } else if (status === 401) {
          setErrorMsg('Session expired. Please refresh the page and try again.');
        } else {
          setErrorMsg(serverMsg || networkMsg || 'Something went wrong. Please try again.');
        }
        setStage('failed');
      }
    })();
  }, [uploadedPhotos, onVerified]);

  // Cleanup on unmount 
  useEffect(() => {
    return () => {
      stopCamera();
      if (frameTimerRef.current) clearInterval(frameTimerRef.current);
      if (guideTimerRef.current) clearInterval(guideTimerRef.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setErrorMsg('Camera permission denied. Please allow camera access and try again.');
      setStage('failed');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startGuideAnimation = (seq: PoseLabel[]) => {
    let idx = 0;
    setGuidePoseIdx(0);
    guideTimerRef.current = setInterval(() => {
      idx = (idx + 1) % seq.length;
      setGuidePoseIdx(idx);
    }, POSE_DURATION_MS);
  };

  const beginVerification = async () => {
    setStage('liveness');
    await startCamera();

    try {
      const res = await startFaceSession();
      if (!res.success || !res.session_id) {
        setErrorMsg(
          (res as any).error ||
          (res as any).message ||
          'Could not start verification session.'
        );
        setStage('failed');
        return;
      }
      setSessionId(res.session_id);
      setSequence(res.challenge_sequence);
      startGuideAnimation(res.challenge_sequence);
      startSendingFrames(res.session_id);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Session error. Please try again.');
      setStage('failed');
    }
  };

  const startSendingFrames = (sid: string) => {
    livenessOKRef.current = false;
    frameTimerRef.current = setInterval(async () => {
      if (livenessOKRef.current || !videoRef.current) return;

      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 320;
      canvas.height = videoRef.current.videoHeight || 240;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          const result: SubmitFrameResponse = await submitFaceFrame(sid, blob);
          setCurrentStep(result.current_step);
          setCompletedSteps(result.completed_steps || []);

          if (result.liveness_complete && !livenessOKRef.current) {
            livenessOKRef.current = true;
            clearInterval(frameTimerRef.current!);
            if (guideTimerRef.current) clearInterval(guideTimerRef.current);
            runFaceMatch(sid);
          }
        } catch (error) {
          console.error('Error submitting face frame:', error);
        }
      }, 'image/jpeg', 0.85);
    }, FRAME_INTERVAL_MS);
  };

  const runFaceMatch = async (sid: string) => {
    setStage('matching');
    stopCamera();
    try {
      const result = await completeFaceVerification(sid);
      setSimilarity(result.similarity);
      if (result.verified) {
        setStage('success');
      } else {
        setErrorMsg(result.message || 'Face did not match profile photos.');
        setStage('failed');
      }
    } catch (err: any) {
      setErrorMsg('Verification error. Please try again.');
      setStage('failed');
    }
  };

  // ── Guide canvas drawing ───────────────────────────────────────
  useEffect(() => {
    if (stage !== 'liveness' || !guideCanvasRef.current || sequence.length === 0) return;
    const canvas = guideCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pose = sequence[guidePoseIdx] || 'center';
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(61,107,255,.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const ox = pose === 'left' ? -20 : pose === 'right' ? 20 : 0;
    const oy = pose === 'up' ? -16 : pose === 'down' ? 16 : 0;
    const faceX = cx + ox, faceY = cy + oy;
    const rX = 44 - Math.abs(ox) * 0.25, rY = 58;

    ctx.shadowColor = 'rgba(61,107,255,.4)'; ctx.shadowBlur = 22;
    ctx.beginPath(); ctx.ellipse(faceX, faceY, rX, rY, 0, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? '#181d2e' : '#e8ecff'; ctx.fill();
    ctx.strokeStyle = '#3d6bff'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.shadowBlur = 0;

    const eyeSpread = rX * 0.40;
    [[faceX - eyeSpread, faceY - 12], [faceX + eyeSpread, faceY - 12]].forEach(([ex, ey]) => {
      ctx.beginPath(); ctx.ellipse(ex, ey, 8 - Math.abs(ox) * 0.07, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#3d6bff'; ctx.fill();
      ctx.beginPath(); ctx.arc(ex - 2, ey - 2, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fill();
    });

    ctx.beginPath(); ctx.ellipse(faceX, faceY + 6, 4, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(61,107,255,.5)'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(faceX - 12, faceY + 24);
    ctx.quadraticCurveTo(faceX, faceY + 31, faceX + 12, faceY + 24);
    ctx.strokeStyle = 'rgba(100,120,200,.5)'; ctx.lineWidth = 2; ctx.stroke();

    if (pose !== 'center') {
      const arrows: Record<string, [number, number, string]> = {
        left: [faceX - rX - 24, faceY, '◀'], right: [faceX + rX + 24, faceY, '▶'],
        up: [faceX, faceY - rY - 20, '▲'], down: [faceX, faceY + rY + 20, '▼'],
      };
      const [ax, ay, arrow] = arrows[pose];
      ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#f5a623';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(arrow, ax, ay);
    }
  }, [guidePoseIdx, stage, isDark, sequence]);

  const surface = isDark ? themeStyles.pillBg : '#ffffff';
  const textCol = isDark ? '#e8ecff' : '#111827';
  const mutedCol = isDark ? '#6b7399' : '#6b7280';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: surface, color: textCol }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h2 className="text-xl font-bold">Face Verification</h2>
            <p className="text-sm mt-0.5" style={{ color: mutedCol }}>
              Prove it's really you — no fakes allowed
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10">
            <X size={18} />
          </button>
        </div>

        {/* REGISTERING */}
        {stage === 'registering' && (
          <div className="flex flex-col items-center gap-4 py-16 px-6">
            <Loader2 size={40} className="animate-spin text-[#3d6bff]" />
            <p className="text-sm" style={{ color: mutedCol }}>
              Preparing your face profile…
            </p>
          </div>
        )}

        {/* INSTRUCTIONS */}
        {stage === 'instructions' && (
          <div className="px-6 pb-6 space-y-5">
            <div className="rounded-xl p-4 space-y-2 border"
              style={{ borderColor: isDark ? '#252b42' : '#e5e7eb', background: isDark ? '#0a0c14' : '#f9fafb' }}>
              {(['center', 'left', 'right', 'up', 'down'] as PoseLabel[]).map((p) => (
                <div key={p} className="flex items-center gap-3 text-sm">
                  <span className="text-lg">{POSE_META[p].arrow}</span>
                  <span style={{ color: mutedCol }}>{POSE_META[p].label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-center" style={{ color: mutedCol }}>
              Follow the guide animation. The system detects each movement automatically.
            </p>
            <button onClick={beginVerification}
              className="w-full h-12 rounded-[25px] bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white font-semibold hover:opacity-90 transition-opacity">
              Start Verification
            </button>
          </div>
        )}

        {/* LIVENESS */}
        {stage === 'liveness' && (
          <div className="px-4 pb-5 space-y-3">
            <div className="rounded-xl overflow-hidden border relative"
              style={{ borderColor: isDark ? '#252b42' : '#e5e7eb', height: 130 }}>
              <canvas ref={guideCanvasRef} width={480} height={130} className="w-full h-full" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-mono"
                style={{ background: 'rgba(10,12,20,.8)', color: '#3d6bff', border: '1px solid #252b42' }}>
                {sequence[guidePoseIdx] ? POSE_META[sequence[guidePoseIdx]].label : ''}
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden border-2 transition-colors"
              style={{
                borderColor: completedSteps.length === sequence.length && sequence.length > 0 ? '#1ddb8b' : '#3d6bff',
                height: 220, background: '#000',
              }}>
              <video ref={videoRef} autoPlay muted playsInline
                className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 480 220">
                <defs>
                  <mask id="vm">
                    <rect width="480" height="220" fill="white" />
                    <ellipse cx="240" cy="110" rx="80" ry="98" fill="black" />
                  </mask>
                </defs>
                <rect width="480" height="220" fill="rgba(10,12,20,.4)" mask="url(#vm)" />
                <ellipse cx="240" cy="110" rx="80" ry="98"
                  fill="none" stroke="#3d6bff" strokeWidth="2.5" strokeDasharray="6 4" />
              </svg>
            </div>

            <div className="flex justify-center gap-2 flex-wrap">
              {sequence.map((pose, i) => {
                const done = i < currentStep;
                const current = i === currentStep;
                return (
                  <div key={i} className="flex flex-col items-center gap-1 transition-all"
                    style={{ opacity: done || current ? 1 : 0.3, transform: current ? 'scale(1.15)' : 'scale(1)' }}>
                    <span className="text-lg">{POSE_META[pose].arrow}</span>
                    <span className="text-[9px] font-mono uppercase"
                      style={{ color: done ? '#1ddb8b' : current ? '#3d6bff' : mutedCol }}>
                      {pose}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MATCHING */}
        {stage === 'matching' && (
          <div className="flex flex-col items-center gap-4 py-16 px-6">
            <Loader2 size={40} className="animate-spin text-[#8860D9]" />
            <p className="text-sm" style={{ color: mutedCol }}>Matching face against profile…</p>
          </div>
        )}

        {/* SUCCESS */}
        {stage === 'success' && (
          <div className="flex flex-col items-center gap-4 py-10 px-6">
            <CheckCircle size={56} className="text-[#1ddb8b]" />
            <h3 className="text-xl font-bold">Identity Verified</h3>
            <p className="text-sm text-center" style={{ color: mutedCol }}>
              Match confidence: {(similarity * 100).toFixed(1)}%
            </p>
            <button onClick={onVerified}
              className="w-full h-12 rounded-[25px] bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white font-semibold hover:opacity-90 mt-2">
              Continue
            </button>
          </div>
        )}

        {/* FAILED */}
        {stage === 'failed' && (
          <div className="flex flex-col items-center gap-4 py-10 px-6">
            <XCircle size={56} className="text-[#ff4d6d]" />
            <h3 className="text-xl font-bold">Verification Failed</h3>
            <p className="text-sm text-center" style={{ color: mutedCol }}>{errorMsg}</p>
            <div className="flex gap-3 w-full mt-2">
              <button onClick={onClose}
                className="flex-1 h-12 rounded-[25px] border border-[#9575CD] font-medium"
                style={{ color: textCol }}>
                Cancel
              </button>
              <button
                onClick={() => {
                  setStage('registering');
                  setErrorMsg('');
                  setCurrentStep(0);
                  setCompletedSteps([]);
                }}
                className="flex-1 h-12 rounded-[25px] bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white font-semibold hover:opacity-90">
                Try Again
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
