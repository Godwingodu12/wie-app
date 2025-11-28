import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { checkCanSetPassword, setPasswordForGoogleUser } from '@/services/wieUserService';
import { useRouter } from "next/navigation";
export default function SetPasswordComponent() {
  const router = useRouter();
  const [canSetPassword, setCanSetPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkPasswordStatus();
  }, []);
    const checkPasswordStatus = async () => {
        try {
            const response = await checkCanSetPassword();
            setCanSetPassword(response.canSetPassword);
            setLoading(false);
        } catch (err) {
            console.error('Error checking password status:', err);
            setLoading(false);
        }
    };
    const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
    }

    if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
    }

    try {
        // Use service API instead of fetch()
        const response = await setPasswordForGoogleUser({
        password,
        confirmPassword,
        });

        if (response.success) {
        setSuccess(response.message || 'Password set successfully');
        setPassword('');
        setConfirmPassword('');

        setTimeout(() => {
            router.push("/profile?password-set=1");
        }, 2000);
        } else {
        setError(response.message || 'Failed to set password');
        }
    } catch (err) {
        console.error(err);
        setError('An error occurred. Please try again.');
    }
    };
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!canSetPassword) {
    return (
      <div className="max-w-md mx-auto p-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3 text-gray-600">
          <CheckCircle className="w-5 h-5" />
          <p>Password is already set for your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Lock className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Set Password</h2>
        </div>
        <p className="text-gray-600 text-sm">
          You signed up with Google. Set a password to enable email/password login.
        </p>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter password (min 6 characters)"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Confirm your password"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Set Password
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>After setting a password:</strong> You can login using either Google or email/password.
        </p>
      </div>
    </div>
  );
}