'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/home/ThemeContext';
import { User, ShieldCheck, SquareUser, ChevronRight } from 'lucide-react';

export default function AccountManagementPage() {
  const { themeStyles } = useTheme();

  const accountOptions = [
    {
      title: 'Profile Details',
      description: 'Manage your personal information and profile settings',
      icon: User,
      href: '/settings/account/profile',
    },
    {
      title: 'Password & Security',
      description: 'Update your password and security settings',
      icon: ShieldCheck,
      href: '/settings/account/security',
    },
    {
      title: 'Personal Details',
      description: 'Manage your email, phone number, and date of birth',
      icon: SquareUser,
      href: '/settings/account/personal-details',
    },
  ];

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: themeStyles.text }}>
          Account Management
        </h2>
        <p style={{ color: themeStyles.textSecondary }}>
          Manage your account settings and security preferences
        </p>
      </div>

      <div className="space-y-4">
        {accountOptions.map((option) => {
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
