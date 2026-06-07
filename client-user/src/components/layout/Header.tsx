import React from 'react';
import { useTheme } from '@/components/home/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { themeStyles } = useTheme();
  
  return (
    <div className="mb-8">
      <h1 className={`text-4xl font-bold tracking-tight ${themeStyles.text}`}>{title}</h1>
      {subtitle && <p className={`mt-3 text-lg font-medium opacity-80 ${themeStyles.textSecondary || themeStyles.text}`}>{subtitle}</p>}
    </div>
  );
};

export default Header;
