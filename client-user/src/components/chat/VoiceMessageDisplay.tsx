'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { useTheme } from "@/components/home/ThemeContext";

interface VoiceMessageDisplayProps {
  audioURL: string;
  duration: number;
  isSender: boolean;
  timestamp: string;
}

export default function VoiceMessageDisplay({ audioURL, duration, isSender, timestamp }: VoiceMessageDisplayProps) {
  const { themeStyles, isDark } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const validDuration = duration > 0 ? duration : 1;

  useEffect(() => {
    if (!audioURL.startsWith('data:audio/')) {
      setError(true);
    }

    return () => {
      cleanup();
    };
  }, [audioURL]);

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  };

  const togglePlayback = async () => {
    if (error) {
      alert('Unable to play this voice message');
      return;
    }

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      setIsPlaying(false);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      try {
        setIsLoading(true);

        if (!audioRef.current) {
          const audio = new Audio();
          audio.preload = 'auto';
          audioRef.current = audio;

          audio.onerror = () => {
            setError(true);
            setIsPlaying(false);
            setIsLoading(false);
          };

          audio.onloadeddata = () => {
            setIsLoading(false);
          };

          audio.onended = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
            }
          };

          audio.src = audioURL;
          audio.load();
        }

        await audioRef.current.play();
        setIsPlaying(true);
        setIsLoading(false);

        const updateTime = () => {
          if (audioRef.current && !audioRef.current.paused) {
            setCurrentTime(audioRef.current.currentTime);
            animationFrameRef.current = requestAnimationFrame(updateTime);
          }
        };
        updateTime();

      } catch (e) {
        setError(true);
        setIsLoading(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  const progress = validDuration > 0 ? (currentTime / validDuration) * 100 : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 min-w-[240px]">
        <button
          onClick={togglePlayback}
          disabled={isLoading || error}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition ${isLoading || error ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{
            backgroundColor: isSender
              ? 'rgba(255, 255, 255, 0.2)'
              : isDark ? '#2D2F39' : themeStyles.hoverBg
          }}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : error ? (
            <span className="text-red-400 text-xs">✕</span>
          ) : isPlaying ? (
            <Pause size={18} style={{ color: isSender ? '#fff' : themeStyles.text }} />
          ) : (
            <Play size={18} className="ml-0.5" style={{ color: isSender ? '#fff' : themeStyles.text }} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-0.5 mb-1 h-8">
            {[...Array(30)].map((_, i) => {
              const height = 8 + Math.random() * 24;
              const isPassed = (i / 30) * 100 <= progress;
              return (
                <div
                  key={i}
                  className="w-1 rounded-full transition-all duration-100"
                  style={{
                    height: `${height}px`,
                    backgroundColor: isSender
                      ? isPassed ? '#fff' : 'rgba(255, 255, 255, 0.3)'
                      : isPassed ? '#8860D9' : (isDark ? '#2D2F39' : 'rgba(0,0,0,0.1)')
                  }}
                />
              );
            })}
          </div>

          <div className="text-xs" style={{ color: isSender ? 'rgba(255, 255, 255, 0.8)' : themeStyles.textSecondary }}>
            {formatTime(isPlaying ? currentTime : validDuration)}
          </div>
        </div>
      </div>
      {error && (
        <div className="text-xs text-red-400 text-center">
          Failed to load audio
        </div>
      )}
    </div>
  );
}
