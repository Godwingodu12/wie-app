'use client';

import React from 'react';
import { useTheme } from '@/components/home/ThemeContext';

export default function NotificationsPage() {
  const { themeStyles } = useTheme();

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: themeStyles.text }}>
          Notifications
        </h2>
        <p style={{ color: themeStyles.textSecondary }}>
          Choose what notifications you want to receive and how you want to be notified
        </p>
      </div>
    </div>
  );
}
