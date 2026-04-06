import React, { useState } from 'react';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { setPasswordForGoogleUser } from '@/services/wieUserService';
import { useRouter } from "next/navigation";
import { useTheme } from '@/components/home/ThemeContext';

export default function SetPasswordComponent() {
  const router = useRouter();
  const { themeStyles, isDark } = useTheme();
  const [loading, setLoading] = useState(false); // Changed default to false as we don't check status here anymore
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
    }

    const specialCharCount = (password.match(/[^A-Za-z0-9]/g) || []).length;
    if (specialCharCount < 2) {
        setError('Password must contain at least 2 special characters');
        return;
    }

    const alphaCount = (password.match(/[a-zA-Z]/g) || []).length;
    if (alphaCount < 2) {
        setError('Password must contain at least 2 alphabets');
        return;
    }

    const numCount = (password.match(/[0-9]/g) || []).length;
    if (numCount < 2) {
        setError('Password must contain at least 2 numbers');
        return;
    }

    if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
    }

    setLoading(true);

    try {
        const response = await setPasswordForGoogleUser({
        password,
        confirmPassword,
        });

        if (response.success) {
        setSuccess(response.message || 'Password set successfully');
        setPassword('');
        setConfirmPassword('');

        setTimeout(() => {
            router.push("/settings/privacy?success=Password set successfully");
        }, 2000);
        } else {
        setError(response.message || 'Failed to set password');
        }
    } catch (err: any) {
        console.error(err);
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
            style={{ background: isDark ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF' }}
          >
            <Lock className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: themeStyles.text }}>
            Set Password
          </h2>
        </div>
        <p className="text-sm" style={{ color: themeStyles.textSecondary }}>
          You signed up with Google. Set a password to enable email/password login.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 border rounded-lg flex items-start gap-3"
             style={{
               backgroundColor: isDark ? 'rgba(127, 29, 29, 0.1)' : '#FEF2F2',
               borderColor: isDark ? 'rgba(127, 29, 29, 0.3)' : '#FECACA'
             }}>
            <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 border rounded-lg flex items-start gap-3"
             style={{
               backgroundColor: isDark ? 'rgba(6, 78, 59, 0.1)' : '#ECFDF5',
               borderColor: isDark ? 'rgba(6, 78, 59, 0.3)' : '#A7F3D0'
             }}>
            <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>{success}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: themeStyles.text }}>
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              style={{
                background: isDark ? '#27272A' : '#FFFFFF',
                border: `1px solid ${themeStyles.border}`,
                color: themeStyles.text
              }}
              placeholder="Enter password (min 8 characters)"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity"
              style={{ color: themeStyles.textSecondary }}
              disabled={loading}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: themeStyles.text }}>
            Confirm Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            style={{
              background: isDark ? '#27272A' : '#FFFFFF',
              border: `1px solid ${themeStyles.border}`,
              color: themeStyles.text
            }}
            placeholder="Confirm your password"
            disabled={loading}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Setting Password...' : 'Set Password'}
          </button>
        </div>
      </form>
      <div className="mt-6 p-4 border rounded-lg"
          style={{
            backgroundColor: isDark ? 'rgba(30, 58, 138, 0.1)' : '#EFF6FF',
            borderColor: isDark ? 'rgba(30, 58, 138, 0.3)' : '#BFDBFE'
          }}>
        <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
          <strong>After setting a password:</strong> You can login using either your social account (Google / Apple / Microsoft) or email/password.
        </p>
      </div>
    </div>
  );
}
