'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { changePassword, checkCanSetPassword } from '@/services/wieUserService';
import { useTheme } from '@/components/home/ThemeContext';
import SetPasswordComponent from '@/components/auth/SetPasswordComponent';

export default function ChangePassword() {
  const router = useRouter();
  const { themeStyles, isDark } = useTheme();

  // State for rendering logic
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [canSetPassword, setCanSetPassword] = useState(false);

  // Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await checkCanSetPassword();
        setCanSetPassword(response.canSetPassword);
      } catch (error) {
        console.error("Failed to check password status", error);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkStatus();
  }, []);

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2"
             style={{ borderColor: isDark ? 'white' : 'black' }}></div>
      </div>
    );
  }

  if (canSetPassword) {
    return <SetPasswordComponent />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      const response = await changePassword({
        currentPassword,
        newPassword,
      });

      if (response.success) {
        router.push('/settings/privacy?success=Password changed successfully');
      } else {
        setError(response.message || 'Failed to change password');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'An error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="max-w-2xl mx-auto py-6"
    >
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="p-2 rounded-lg"
            style={{ background: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2' }}
          >
            <Lock className={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: themeStyles.text }}>
            Change Password
          </h2>
        </div>
        <p className="text-sm" style={{ color: themeStyles.textSecondary }}>
          Update your password to keep your account secure
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 border rounded-lg flex items-start gap-3"
             style={{
               backgroundColor: isDark ? 'rgba(127, 29, 29, 0.1)' : '#FEF2F2',
               borderColor: isDark ? 'rgba(127, 29, 29, 0.3)' : '#FECACA'
             }}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: themeStyles.text }}>
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
              style={{
                background: isDark ? '#27272A' : '#FFFFFF',
                border: `1px solid ${themeStyles.border}`,
                color: themeStyles.text
              }}
              placeholder="Enter current password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity"
              style={{ color: themeStyles.textSecondary }}
              disabled={loading}
            >
              {showCurrentPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: themeStyles.text }}>
            New Password
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
              style={{
                background: isDark ? '#27272A' : '#FFFFFF',
                border: `1px solid ${themeStyles.border}`,
                color: themeStyles.text
              }}
              placeholder="Enter new password (min 6 characters)"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity"
              style={{ color: themeStyles.textSecondary }}
              disabled={loading}
            >
              {showNewPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: themeStyles.text }}>
            Confirm New Password
          </label>
          <input
            type={showNewPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
            style={{
              background: isDark ? '#27272A' : '#FFFFFF',
              border: `1px solid ${themeStyles.border}`,
              color: themeStyles.text
            }}
            placeholder="Confirm your new password"
            disabled={loading}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 border rounded-lg"
           style={{
             backgroundColor: isDark ? 'rgba(30, 58, 138, 0.1)' : '#EFF6FF',
             borderColor: isDark ? 'rgba(30, 58, 138, 0.3)' : '#BFDBFE'
           }}>
        <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
          Password Requirements:
        </h3>
        <ul className={`text-sm space-y-1 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
          <li>• At least 6 characters long</li>
          <li>• Different from your current password</li>
          <li>• Use a mix of letters, numbers, and symbols for better security</li>
        </ul>
      </div>
    </div>
  );
}
