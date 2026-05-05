'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EventWithLocation } from '@/types/ticket';
import { useTheme } from '@/components/home/ThemeContext';

interface PopularEventBannerProps {
  events: EventWithLocation[];
  onViewAll: () => void;
  title?: string;
}

export default function PopularEventBanner({
  events,
  onViewAll,
  title = "Popular Events",
}: PopularEventBannerProps) {
  const router = useRouter();
  const { themeStyles } = useTheme();
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((p) => (p + 1) % events.length);
    }, 6000);
  }, [events.length]);

  useEffect(() => {
    if (events.length < 2) {
      setActive(0);
      return;
    }
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer, events.length]);

  if (!events.length) return null;

  const currentEvent = events[active];
  if (!currentEvent) return null;

  const desktopImage = (currentEvent as any).event_banner || null;
  const mobileImage  = (currentEvent as any).event_portrait || (currentEvent as any).event_banner || null;

  return (
    <div className="mb-14 px-4 sm:px-0">
      {/* Header Section */}
      <div className="flex items-end justify-between mb-6 px-1">
        <h2 className="font-semibold text-2xl sm:text-3xl tracking-tight" style={{ color: themeStyles.text }}>
          {title}
        </h2>
        <button
          onClick={onViewAll}
          className="group flex items-center gap-2 text-xs font-semibold uppercase tracking-widest transition-all hover:opacity-70"
          style={{ color: '#8860D9' }}
        >
          Explore All
          <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
        </button>
      </div>

      {/* Hero Banner Container - Wider aspect for reduced height */}
      <div
        className="relative w-full overflow-hidden cursor-pointer mx-auto bg-black group aspect-[2/1] sm:aspect-[3/1]"
        style={{ borderRadius: 12, maxWidth: 1147 }}
        onClick={() => {
          const id = currentEvent._id || (currentEvent as any).id;
          if (id) router.push(`/events/${id}`);
        }}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Background Image Layers */}
            <div className="absolute inset-0">
              <img
                src={desktopImage || mobileImage}
                alt={currentEvent.event_name}
                className="hidden sm:block absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
              />
              <img
                src={mobileImage || desktopImage}
                alt={currentEvent.event_name}
                className="block sm:hidden absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent hidden md:block" />
            </div>

            {/* Event Details Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 lg:p-10">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="max-w-3xl space-y-3"
              >
                <div className="space-y-1">
                  <h1 className="text-white font-semibold text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-tight tracking-tight">
                    {currentEvent.event_name}
                  </h1>
                </div>

                <div className="flex items-center gap-6 text-white/90 text-[10px] sm:text-xs font-semibold tracking-wider uppercase">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[#8860D9]" />
                    {currentEvent.event_dates?.[0]?.start_date
                      ? new Date(currentEvent.event_dates[0].start_date).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })
                      : 'TBA'}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Minimalist Indicators (Dots instead of counts) */}
        <div className="absolute bottom-6 right-8 flex gap-2 z-10">
          {events.slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setActive(i); resetTimer(); }}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === active ? 'w-6 bg-[#8860D9]' : 'w-1 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
