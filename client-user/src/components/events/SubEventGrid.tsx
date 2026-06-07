'use client';
import { useState, useMemo } from 'react';
import { SubEvent } from '@/types/ticket';
import { useTheme } from '@/components/home/ThemeContext';
import { useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';

interface SubEventCardProps {
  subEvent: SubEvent;
}

function SubEventCard({ subEvent }: SubEventCardProps) {
  const router = useRouter();
  const { isDark } = useTheme();

  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return 'TBA';
      const date = new Date(dateStr);
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
      
      if (isMobile) {
        return date.toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
      
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        weekday: 'long',
      });
    } catch {
      return dateStr || 'TBA';
    }
  };

  const getMinPrice = () => {
    if (!subEvent.ticket_types || subEvent.ticket_types.length === 0) return 'Free';
    const minPrice = Math.min(...subEvent.ticket_types.map(t => t.ticket_price));
    return minPrice === 0 ? 'Free' : `₹${minPrice.toLocaleString()}`;
  };

  const firstDate = subEvent.event_dates?.[0]?.start_date || '';

  const eventNavId = subEvent._id || (subEvent as any).id;

  return (
    <div
      className="group relative rounded-3xl overflow-hidden transition-all duration-300 hover:translate-y-[-4px] cursor-pointer h-[260px] sm:h-[320px]"
      onClick={() => router.push(`/events/${eventNavId}`)}
    >
      {/* Background Image */}
      <img
        src={subEvent.event_banner || (subEvent.event_images?.[0]?.path)}
        alt={subEvent.event_name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 flex justify-between items-end gap-3">
        <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
          <h3 className="text-white font-bold text-base sm:text-lg leading-tight truncate-2-lines">
            {subEvent.event_name}
          </h3>

          <div className="flex items-center gap-2 text-white/80 text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-[#B3B8E2]" />
            <span>{formatDate(firstDate)}</span>
          </div>

          <div className="flex items-center gap-2 text-white/90 text-xs font-bold">
            <span>{getMinPrice()}</span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/events/${eventNavId}`);
          }}
          className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-white text-[11px] sm:text-xs font-bold transition-all hover:opacity-90 active:scale-95 shadow-lg whitespace-nowrap"
          style={{
            background: 'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)',
          }}
        >
          Book now
        </button>
      </div>
    </div>
  );
}

interface SubEventGridProps {
  subEvents: SubEvent[];
}

export function SubEventGrid({ subEvents }: SubEventGridProps) {
  const { isDark } = useTheme();

  // Extract unique dates from sub-events for filtering
  const dates = useMemo(() => {
    if (!subEvents || !Array.isArray(subEvents)) return [];

    const uniqueDates: { id: string; day: string; date: string; month: string; raw: string }[] = [];
    const seen = new Set<string>();

    subEvents.forEach((se, seIdx) => {
      if (!se.event_dates) return;
      se.event_dates.forEach((ed, edIdx) => {
        const d = new Date(ed.start_date);
        const dateStr = d.toDateString();

        if (!seen.has(dateStr)) {
          seen.add(dateStr);
          uniqueDates.push({
            id: ed._id || `${seIdx}-${edIdx}`,
            day: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            date: d.getDate().toString(),
            month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
            raw: ed.start_date
          });
        }
      });
    });

    return uniqueDates.sort((a, b) => new Date(a.raw).getTime() - new Date(b.raw).getTime());
  }, [subEvents]);

  // Checklist: Set selectedDate initial state to null (to show all by default)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Filter: show all if selectedDate is null, otherwise filter by date
  const filteredSubEvents = useMemo(() => {
    if (!subEvents) return [];
    if (!selectedDate) return subEvents;

    return subEvents.filter(se =>
      se.event_dates?.some(ed => {
        const d1 = new Date(ed.start_date).toDateString();
        const d2 = new Date(selectedDate).toDateString();
        return d1 === d2;
      })
    );
  }, [subEvents, selectedDate]);

  if (!subEvents || subEvents.length === 0) return null;

  // Month Indicator based on selection or first item
  const currentMonth = useMemo(() => {
    if (selectedDate) {
      const found = dates.find(d => d.raw === selectedDate);
      if (found) return found.month;
    }
    return dates[0]?.month || '';
  }, [selectedDate, dates]);

  return (
    <div className="mt-10 space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
        Available events
      </h2>

      {/* Date Filter Selection Bar */}
      <div className="flex items-center gap-2 h-20">
        {/* Month Label (Rotated 90) */}
        {currentMonth && (
          <div className="flex items-center justify-center w-6 sm:w-8 shrink-0 select-none overflow-visible">
            <span 
              className="uppercase text-[10px] sm:text-[12px] tracking-[0.2em] transform -rotate-90 whitespace-nowrap font-bold"
              style={{ color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }}
            >
              {currentMonth}
            </span>
          </div>
        )}

        {/* Carousel of Dates */}
        <div className="flex-1 flex items-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-hide pb-2 pt-1 snap-x snap-mandatory">
          {/* Date Pills */}
          {dates.map((d, index) => {
            const isActive = selectedDate !== null
              ? new Date(d.raw).toDateString() === new Date(selectedDate).toDateString()
              : index === 0;

            return (
              <button
                key={d.id || index}
                onClick={() => setSelectedDate(d.raw)}
                className="flex flex-col items-center justify-center transition-all duration-300 active:scale-95 snap-center"
                style={{
                  width: '52px',
                  height: '62px',
                  minWidth: '52px',
                  borderRadius: '14px',
                  padding: '10px 8px',
                  background: isActive
                    ? 'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)'
                    : (isDark 
                        ? 'linear-gradient(180deg, #373737 0%, #262626 50%, #1C1C1C 100%)'
                        : 'linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 50%, #F3F4F6 100%)'),
                  color: isActive ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#111827'),
                  border: isActive ? 'none' : (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E5E7EB'),
                  flexShrink: 0,
                  boxShadow: isActive ? '0 8px 12px -3px rgba(139, 92, 246, 0.3)' : 'none'
                }}
              >
                <span className="text-[20px] sm:text-[22px] font-bold leading-none">{d.date}</span>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase opacity-80 mt-1">{d.day}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-4">
        {filteredSubEvents.map((se, index) => (
          <SubEventCard key={se._id || (se as any).id || index} subEvent={se} />
        ))}
        {filteredSubEvents.length === 0 && (
          <p className="col-span-full text-center py-10 opacity-50">
            No events available for this selection.
          </p>
        )}
      </div>
    </div>
  );
}
