'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface AlertProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export const Alert: React.FC<AlertProps> = ({
  message,
  type = 'error',
  visible,
  onClose,
  duration = 5000,
}) => {
  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  const variants = {
    initial: { opacity: 0, y: -20, scale: 0.95, x: '-50%' },
    animate: { opacity: 1, y: 0, scale: 1, x: '-50%' },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 }, x: '-50%' },
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-[#052c1e]/90',
          border: 'border-[#10b981]/30',
          icon: <CheckCircle2 className="w-5 h-5 text-[#10b981]" />,
          shadow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]',
        };
      case 'info':
        return {
          bg: 'bg-[#1e293b]/90',
          border: 'border-[#3b82f6]/30',
          icon: <Info className="w-5 h-5 text-[#3b82f6]" />,
          shadow: 'shadow-[0_0_30px_rgba(59,130,246,0.15)]',
        };
      default:
        return {
          bg: 'bg-[#2c1212]/90',
          border: 'border-[#ef4444]/30',
          icon: <AlertCircle className="w-5 h-5 text-[#ef4444]" />,
          shadow: 'shadow-[0_0_30px_rgba(239,68,68,0.15)]',
        };
    }
  };

  const styles = getStyles();

  if (typeof document === 'undefined') return null;

  const content = (
    <AnimatePresence>
      {visible && (
        <motion.div
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`fixed top-10 left-1/2 z-[99999] w-[90%] max-w-md ${styles.bg} ${styles.border} border ${styles.shadow} backdrop-blur-2xl rounded-2xl p-4 flex items-start gap-4 shadow-2xl ring-1 ring-white/10`}
          style={{ x: '-50%' }}
        >
          <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold leading-relaxed tracking-wide">
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 text-white/40 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return typeof window !== 'undefined'
    ? require('react-dom').createPortal(content, document.body)
    : null;
};

export default Alert;
