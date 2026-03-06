'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import { updateUser } from '@/features/auth/authSlice';
import { Lock, CheckCircle, X, Loader2 } from 'lucide-react';
import { getAccountPrivacy, updateAccountPrivacy } from '@/services/wieUserService';
import { useTheme } from '@/components/home/ThemeContext';

export default function PrivacyPage() {
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { user } = useAuth();
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
      if (user) {
        dispatch(updateUser({ ...user, accountPrivacy: newPrivacy } as any));
      }
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

  return (
    <div className="w-full">
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

      {/* Account Privacy Card */}
      <div
        className="rounded-2xl shadow-sm p-6 transition-colors mb-6"
        style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
      >
        <h2 className="text-xl font-semibold mb-5" style={{ color: themeStyles.text }}>
          Account privacy
        </h2>

        <div
          className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3 mb-4"
          style={{ background: isDark ? '#1f2229' : themeStyles.pillBg }}
        >
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4" style={{ color: themeStyles.text }} />
            <span className="text-sm font-medium" style={{ color: themeStyles.text }}>
              Private account
            </span>
          </div>

          {loading ? (
            <div className="flex items-center gap-2" style={{ color: themeStyles.textSecondary }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : (
            <button
              type="button"
              role="switch"
              aria-checked={accountPrivacy === 'private'}
              onClick={handleTogglePrivacy}
              disabled={updating}
              className={`relative inline-flex items-center rounded-full transition-colors ${
                updating ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              }`}
              style={{
                width: '60px',
                height: '30px',
                borderRadius: '30px',
                padding: '2px',
                gap: '10px',
                opacity: 1,
                background: accountPrivacy === 'private'
                  ? 'linear-gradient(147.67deg, #2979FF 13.16%, #6B9CF0 54.09%, #9DC1FF 100.03%)'
                  : '#212426',
              }}
            >
              <span className="sr-only">Toggle account privacy</span>
              <span
                className={`inline-block rounded-full bg-white shadow transition-transform ${
                  accountPrivacy === 'private' ? 'translate-x-[30px]' : 'translate-x-[2px]'
                }`}
                style={{ width: '26px', height: '26px' }}
              />
            </button>
          )}
        </div>

        <p className="text-xs leading-5 mb-2" style={{ color: themeStyles.textSecondary }}>
          When your account is public, your profile and posts can be seen by anyone, on or off Wie,
          even if they don’t have a Wie account.
        </p>
        <p className="text-xs leading-5" style={{ color: themeStyles.textSecondary }}>
          When your account is private, only followers that you approve can see what you share,
          including your photos or videos on hashtag and location pages, and your followers and
          following lists. Certain info on your profile, such as your profile picture and username,
          is visible to everyone on and off Wie.
          {' '}
          <a href="#" className="font-medium" style={{ color: '#60a5fa' }}>
            Learn more
          </a>
        </p>

        {updating && !loading && (
          <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: themeStyles.textSecondary }}>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Updating...</span>
          </div>
        )}
      </div>

    </div>
  );
}
