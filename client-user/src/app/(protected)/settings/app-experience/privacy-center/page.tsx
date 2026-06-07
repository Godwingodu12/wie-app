'use client';

import React from 'react';
import { useTheme } from '@/components/home/ThemeContext';

export default function PrivacyCenterPage() {
  const { themeStyles } = useTheme();

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: themeStyles.text }}>
          Privacy Center
        </h2>
        <p style={{ color: themeStyles.textSecondary }}>
          Learn about our privacy practices and manage your data
        </p>
      </div>
    </div>
  );
}
