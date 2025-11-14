'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/features/auth/authSlice';
import { resetPassword } from '@/services/wieUserService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const ResetPasswordForm: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();

  const userId = searchParams.get('userId') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!userId) {
      setError('Invalid request. Please try again.');
      return;
    }

    try {
      setLoading(true);

      const response = await resetPassword(userId, newPassword);

      if (response.success && response.data?.token && response.data?.user) {
        // Login the user automatically
        dispatch(loginSuccess({ 
          token: response.data.token, 
          user: response.data.user 
        }));
        
        // Navigate to home page
        router.push('/home');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to reset password';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center mb-6">
          <p className="text-gray-600">
            Enter your new password
          </p>
        </div>

        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          required
        />

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Reset Password
        </Button>
      </form>
    </div>
  );
};
export default ResetPasswordForm;