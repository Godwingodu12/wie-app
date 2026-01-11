'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import ShieldIcon from '@/assets/forgot-password/ShieldIcon.svg';
import SuccessIcon from '@/assets/forgot-password/SuccessIcon.svg';

interface TopAlertProps {
  message: string;
  type?: 'error' | 'success';
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export const TopAlert: React.FC<TopAlertProps> = ({
  message,
  type = 'error',
  visible,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <div
        className="
          flex items-center gap-3
          px-5 py-3
          rounded-2xl
          backdrop-blur-md
          shadow-xl
          border border-[#2E2E2E]
          bg-[#1C202466]
          transition-all duration-300 ease-out
        "
      >
        {/* Icon */}
        <div className="w-10 h-10 flex items-center justify-center">
          <Image
            src={type === 'success' ? SuccessIcon : ShieldIcon}
            alt={type === 'success' ? 'Success' : 'Alert'}
            className="w-8 h-8"
          />
        </div>

        {/* Message */}
        <p className="text-white text-base font-medium">
          {message}
        </p>
      </div>
    </div>
  );
};

export default TopAlert;
