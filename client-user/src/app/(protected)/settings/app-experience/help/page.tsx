'use client';

import React from 'react';
import { useTheme } from '@/components/home/ThemeContext';

export default function HelpSupportPage() {
  const { themeStyles } = useTheme();

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: themeStyles.text }}>
          Help & Support
        </h2>
        <p style={{ color: themeStyles.textSecondary }}>
          Get help with your account and find answers to common questions
        </p>
      </div>
    </div>
  );
}
