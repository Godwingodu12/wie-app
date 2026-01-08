'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, X, Send, Trash2, Pause, Play, Square } from 'lucide-react';

interface VoiceRecorderProps {
  onSendVoice: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onSendVoice, onCancel, disabled = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const MAX_RECORDING_TIME = 720;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true
      });
      
      streamRef.current = stream;
      
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/ogg';
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) {
          alert('No audio was recorded. Please check your microphone and try again.');
          onCancel();
          return;
        }
        
        const blob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType
        });
        
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        
        const tempAudio = new Audio(url);
        
        await new Promise<void>((resolve) => {
          let resolved = false;
          
          const finalize = (duration: number) => {
            if (resolved) return;
            resolved = true;
            setAudioDuration(duration);
            resolve();
          };
          
          tempAudio.onloadedmetadata = () => {
            const actualDuration = tempAudio.duration;
            if (actualDuration && isFinite(actualDuration) && actualDuration > 0) {
              finalize(actualDuration);
            } else {
              finalize(recordingTime);
            }
          };
          
          tempAudio.onerror = () => {
            finalize(recordingTime);
          };
          
          setTimeout(() => {
            finalize(recordingTime);
          }, 2000);
        });
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.onerror = () => {
        alert('Recording error occurred. Please try again.');
        onCancel();
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= MAX_RECORDING_TIME) {
            stopRecording();
            alert('Maximum recording time reached (12 minutes)');
          }
          return newTime;
        });
      }, 1000);
      
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        alert('Microphone permission denied. Please allow microphone access in your browser settings and try again.');
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotReadableError') {
        alert('Microphone is being used by another application. Please close other apps using the microphone and try again.');
      } else {
        alert(`Unable to access microphone: ${error.message}`);
      }
      
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= MAX_RECORDING_TIME) {
            stopRecording();
            alert('Maximum recording time reached (12 minutes)');
          }
          return newTime;
        });
      }, 1000);
    }
  };

  const playAudio = () => {
    if (audioURL && !audioRef.current) {
      const audio = new Audio();
      audio.src = audioURL;
      audio.preload = 'auto';
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        if (audio.duration && isFinite(audio.duration)) {
          setAudioDuration(audio.duration);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      audio.play().catch(() => {
        alert('Failed to play audio preview');
      });
      
      setIsPlaying(true);

      const updateTime = () => {
        if (audioRef.current && !audioRef.current.paused) {
          setPlaybackTime(audioRef.current.currentTime);
          animationFrameRef.current = requestAnimationFrame(updateTime);
        }
      };
      updateTime();
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      } else {
        audioRef.current.play();
        setIsPlaying(true);
        const updateTime = () => {
          if (audioRef.current && !audioRef.current.paused) {
            setPlaybackTime(audioRef.current.currentTime);
            animationFrameRef.current = requestAnimationFrame(updateTime);
          }
        };
        updateTime();
      }
    }
  };

  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioBlob(null);
    setAudioURL(null);
    setIsPlaying(false);
    setPlaybackTime(0);
    setRecordingTime(0);
    setAudioDuration(0);
    audioChunksRef.current = [];
    
    startRecording();
  };

  const sendVoice = () => {
    if (audioBlob) {
      let finalDuration = recordingTime;
      
      if (audioDuration && isFinite(audioDuration) && audioDuration > 0) {
        finalDuration = Math.floor(audioDuration);
      }
      
      finalDuration = Math.max(1, finalDuration);
      
      onSendVoice(audioBlob, finalDuration);
      cleanup();
    }
  };

  const handleCancel = () => {
    cleanup();
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const displayDuration = audioDuration && isFinite(audioDuration) && audioDuration > 0 
    ? audioDuration 
    : recordingTime;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a1a1a] border border-[#2D2F39] rounded-lg p-4 shadow-lg animate-slide-up">
      <div className="flex items-center gap-3">
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-white font-medium">
              {formatTime(recordingTime)}
            </span>
          </div>
        )}

        {!isRecording && audioBlob && (
          <div className="flex items-center gap-2">
            <button
              onClick={playAudio}
              className="p-2 bg-[#2D2F39] hover:bg-[#3D3F49] rounded-full transition"
            >
              {isPlaying ? (
                <Pause size={18} className="text-white" />
              ) : (
                <Play size={18} className="text-white ml-0.5" />
              )}
            </button>
            <div className="flex-1">
              <div className="text-sm text-white">
                {formatTime(isPlaying ? playbackTime : displayDuration)}
              </div>
              {displayDuration > 0 && (
                <div className="w-32 h-1 bg-[#2D2F39] rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-[#8860D9] to-[#B3B8E2] transition-all duration-100"
                    style={{ width: `${(playbackTime / displayDuration) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1" />

        {isRecording ? (
          <>
            <button
              onClick={isPaused ? resumeRecording : pauseRecording}
              className="p-2 bg-[#2D2F39] hover:bg-[#3D3F49] rounded-full transition"
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? (
                <Play size={18} className="text-white" />
              ) : (
                <Pause size={18} className="text-white" />
              )}
            </button>
            <button
              onClick={stopRecording}
              className="p-2 bg-[#2D2F39] hover:bg-[#3D3F49] rounded-full transition"
              title="Stop"
            >
              <Square size={18} className="text-white fill-white" />
            </button>
            <button
              onClick={() => {
                stopRecording();
                setTimeout(sendVoice, 500);
              }}
              className="p-2 bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] hover:opacity-90 rounded-full transition"
              title="Send"
            >
              <Send size={18} className="text-white" />
            </button>
          </>
        ) : audioBlob ? (
          <>
            <button
              onClick={deleteRecording}
              className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition"
              title="Delete"
            >
              <Trash2 size={18} className="text-white" />
            </button>
            <button
              onClick={sendVoice}
              disabled={disabled}
              className="p-2 bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] hover:opacity-90 disabled:opacity-50 rounded-full transition"
              title="Send"
            >
              <Send size={18} className="text-white" />
            </button>
          </>
        ) : null}

        <button
          onClick={handleCancel}
          className="p-2 hover:bg-[#2D2F39] rounded-full transition"
          title="Cancel"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}