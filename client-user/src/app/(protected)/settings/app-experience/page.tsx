'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/home/ThemeContext';
import { Bell, HeadphonesIcon, ShieldCheck, ChevronRight } from 'lucide-react';

export default function AppExperiencePage() {
  const { themeStyles } = useTheme();

  const appExperienceOptions = [
    {
      title: 'Notifications',
      description: 'Manage your notification preferences and settings',
      icon: Bell,
      href: '/settings/app-experience/notifications',
    },
    {
      title: 'Help & Support',
      description: 'Get help, contact support, and view FAQs',
      icon: HeadphonesIcon,
      href: '/settings/app-experience/help',
    },
    {
      title: 'Privacy Center',
      description: 'Learn about our privacy practices and your data rights',
      icon: ShieldCheck,
      href: '/settings/app-experience/privacy-center',
    },
  ];

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: themeStyles.text }}>
          App Experience
        </h2>
        <p style={{ color: themeStyles.textSecondary }}>
          Customize your app experience and access support resources
        </p>
      </div>

      <div className="space-y-4">
        {appExperienceOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Link
              key={option.href}
              href={option.href}
              className="block rounded-xl shadow-sm hover:shadow-md transition-all p-6 hover:border-opacity-50"
              style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg transition-colors" style={{ background: themeStyles.pillBg }}>
                    <Icon className="w-6 h-6" style={{ color: themeStyles.text }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: themeStyles.text }}>
                      {option.title}
                    </h3>
                    <p className="text-sm" style={{ color: themeStyles.textSecondary }}>
                      {option.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5" style={{ color: themeStyles.textSecondary }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
