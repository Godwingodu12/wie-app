'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Event } from '@/types/ticket';
import { useTheme } from '@/components/home/ThemeContext';
import { TicketCard } from './TicketCard';

interface ConfirmSelectionModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  event: Event | null;
  selectedSeats: string[];
  seatPrices: Array<{ seatId: string; ticketType: string; price: number }>;
  total: number;
  isFree: boolean;
  platformFee: number;
  isBooking: boolean;
}

export const ConfirmSelectionModal: React.FC<ConfirmSelectionModalProps> = ({
  show,
  onClose,
  onConfirm,
  event,
  selectedSeats,
  seatPrices,
  total,
  isFree,
  platformFee,
  isBooking
}) => {
  const { isDark } = useTheme();

  if (!show || !event) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        show ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className={`relative border rounded-3xl p-8 pt-6 w-full max-w-[420px] shadow-2xl flex flex-col items-center transition-all duration-500 transform ${
          show ? "scale-100 translate-y-0" : "scale-95 translate-y-8"
        }`}
        style={{
          background: isDark ? "rgba(28, 32, 36, 0.4)" : "rgba(255, 255, 255, 0.3)",
          backdropFilter: "blur(60px) saturate(180%)",
          WebkitBackdropFilter: "blur(60px) saturate(180%)",
          borderColor: isDark ? "rgba(149, 117, 205, 0.15)" : "rgba(149, 117, 205, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-6 text-sm font-black uppercase tracking-[0.2em] text-white">
          Confirm Selection
        </p>

        <TicketCard 
          event={event}
          selectedSeats={seatPrices.map(s => ({ label: s.seatId, row: s.seatId, col: s.seatId }))}
          quantity={selectedSeats.length}
          total={total}
          isFree={isFree}
          platformFee={platformFee}
          ticketType={seatPrices.length > 0 ? seatPrices[0].ticketType : undefined}
        />

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8 w-full justify-center items-center">
          <button
            onClick={onClose}
            className="flex-1 max-w-[145px] h-[42px] rounded-full text-[13px] font-bold transition-all flex items-center justify-center border border-white/20 bg-white/10 text-white hover:bg-white/20 active:scale-95"
          >
            Modify
          </button>
          <button
            onClick={onConfirm}
            disabled={isBooking}
            style={{
              height: '42px',
              borderRadius: '21px',
              background: 'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)',
            }}
            className="flex-1 max-w-[145px] text-white text-[13px] font-bold shadow-lg shadow-purple-500/10 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isBooking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
