import React from 'react';
import { useTheme } from '@/components/home/ThemeContext';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass';
}

export const Card: React.FC<CardProps> = ({ children, className = '', variant = 'default', ...rest }) => {
  const { isDark, themeStyles } = useTheme();
  
  const baseStyles = variant === 'glass' 
    ? `backdrop-blur-xl border border-white/10 ${isDark ? 'bg-white/5' : 'bg-white/70'}`
    : isDark 
      ? `bg-[#161b22] border border-white/[0.06]` 
      : `bg-white shadow-sm border border-gray-100`;

  return (
    <div
      className={`${baseStyles} rounded-2xl transition-all duration-300 ${className}`}
      style={{ background: themeStyles.cardBg }}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;
