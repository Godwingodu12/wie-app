'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/home/ThemeContext';
import { Lock, ChevronRight } from 'lucide-react';

export default function PasswordSecurityPage() {
  const { themeStyles } = useTheme();

  return (
    <div className="w-full relative">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: themeStyles.text }}>
          Password & Security
        </h2>
        <p style={{ color: themeStyles.textSecondary }}>
          Manage your password and account security settings
        </p>
      </div>

      <Link
        href="/settings/privacy/change-password"
        className="block w-full text-left rounded-xl shadow-sm hover:shadow-md transition-all p-6 hover:border-opacity-50"
        style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg transition-colors" style={{ background: themeStyles.pillBg }}>
              <Lock className="w-6 h-6" style={{ color: themeStyles.text }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: themeStyles.text }}>
                Change Password
              </h3>
              <p className="text-sm" style={{ color: themeStyles.textSecondary }}>
                Update your account password regularly for better security
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: themeStyles.textSecondary }} />
        </div>
      </Link>
    </div>
  );
}
