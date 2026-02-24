'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lock, Shield, Eye, ChevronRight, CheckCircle, X, Globe, Loader2 } from 'lucide-react';
import { getAccountPrivacy, updateAccountPrivacy } from '@/services/wieUserService';
import { useTheme } from '@/components/home/ThemeContext';

export default function PrivacyPage() {
  const searchParams = useSearchParams();
  const [successMessage, setSuccessMessage] = useState('');
  const [accountPrivacy, setAccountPrivacy] = useState<'public' | 'private'>('public');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const { isDark, themeStyles } = useTheme();

  useEffect(() => {
    const success = searchParams.get('success');
    if (success) {
      setSuccessMessage(success);
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchAccountPrivacy();
  }, []);

  const fetchAccountPrivacy = async () => {
    try {
      setLoading(true);
      const res = await getAccountPrivacy();
      setAccountPrivacy(res.accountPrivacy as 'public' | 'private');
    } catch (error) {
      console.error('Failed to fetch account privacy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePrivacy = async () => {
    const newPrivacy = accountPrivacy === 'public' ? 'private' : 'public';

    try {
      setUpdating(true);
      await updateAccountPrivacy({ accountPrivacy: newPrivacy });
      setAccountPrivacy(newPrivacy);
      setSuccessMessage(
        newPrivacy === 'private'
          ? 'Your account is now private. New followers will need your approval.'
          : 'Your account is now public. Anyone can follow you without approval.'
      );
    } catch (error: any) {
      console.error('Failed to update account privacy:', error);
      alert(error.response?.data?.message || 'Failed to update account privacy');
    } finally {
      setUpdating(false);
    }
  };

  const privacyOptions = [
    {
      title: 'Change Password',
      description: 'Update your account password',
      icon: Lock,
      href: '/settings/privacy/change-password',
    },
    {
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security',
      icon: Shield,
      href: '/settings/privacy/two-factor',
    },
    {
      title: 'Privacy Settings',
      description: 'Control who can see your information',
      icon: Eye,
      href: '/settings/privacy/visibility',
    },
  ];

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: themeStyles.text }}>
          Privacy & Security
        </h2>
        <p style={{ color: themeStyles.textSecondary }}>
          Manage your account security and privacy
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 rounded-lg flex items-start justify-between gap-3 bg-green-500/10 border border-green-500/20">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-500 text-sm font-medium">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-green-500 hover:text-green-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Account Privacy Toggle */}
      <div
        className="mb-6 rounded-xl shadow-sm p-6 transition-colors"
        style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 rounded-lg transition-colors" style={{ background: themeStyles.pillBg }}>
              {accountPrivacy === 'private' ? (
                <Lock className="w-6 h-6" style={{ color: themeStyles.text }} />
              ) : (
                <Globe className="w-6 h-6" style={{ color: themeStyles.text }} />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1" style={{ color: themeStyles.text }}>
                Account Privacy
              </h3>
              <p className="text-sm mb-4" style={{ color: themeStyles.textSecondary }}>
                {accountPrivacy === 'private'
                  ? 'Your account is private. Only approved followers can see your posts.'
                  : 'Your account is public. Anyone can see your posts and follow you.'}
              </p>

              {loading ? (
                <div className="flex items-center gap-2" style={{ color: themeStyles.textSecondary }}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (
                <button
                  onClick={handleTogglePrivacy}
                  disabled={updating}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    updating
                      ? 'opacity-50 cursor-not-allowed'
                      : accountPrivacy === 'private'
                        ? 'bg-[#8860D9] text-white hover:bg-[#7b54c4]'
                        : ''
                  }`}
                  style={
                    !updating && accountPrivacy !== 'private'
                      ? {
                          background: themeStyles.pillBg,
                          color: themeStyles.text,
                        }
                      : {}
                  }
                >
                  {updating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </span>
                  ) : accountPrivacy === 'private' ? (
                    'Switch to Public'
                  ) : (
                    'Switch to Private'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {privacyOptions.map((option) => {
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
