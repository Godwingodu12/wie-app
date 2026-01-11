'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/features/auth/authSlice';
import { resetPassword } from '@/services/wieUserService';
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Image from 'next/image';
import EyeIcon from '@/assets/Auth/Eye.svg';

interface ResetPasswordFormProps {
  onError: (msg: string) => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onError }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      onError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      onError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      onError('Passwords do not match');
      return;
    }

    if (!userId) {
      onError('Invalid request. Please try again.');
      return;
    }

    try {
      setLoading(true);
      const response = await resetPassword(userId, newPassword);

      if (response.success && response.data?.token && response.data?.user) {
        dispatch(loginSuccess({
          token: response.data.token,
          user: response.data.user,
        }));
        router.push('/home');
      } else {
        onError('Failed to reset password');
      }
    } catch (err: any) {
      onError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* New Password */}
        <div className="relative">
          <Input
            placeholder="New Password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="pr-14"
            required
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(p => !p)}
            className="absolute right-5 top-1/2 -translate-y-1/2"
          >
            <Image src={EyeIcon} alt="Toggle password" width={20} height={20} />
          </button>
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <Input
            placeholder="Re-enter Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pr-14"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(p => !p)}
            className="absolute right-5 top-1/2 -translate-y-1/2"
          >
            <Image src={EyeIcon} alt="Toggle password" width={20} height={20} />
          </button>
        </div>

        <Button
          type="submit"
          loading={loading}
          className="w-full h-[56px] rounded-full text-white
                     bg-gradient-to-b
                     from-[#B3B8E2] via-[#8860D9] to-[#9575CD]"
        >
          Reset Password
        </Button>

        {/* Password Rules */}
        <ul className="text-sm text-gray-400 list-disc list-inside space-y-1">
          <li>Password must be at least 8 characters long</li>
          <li>Minimum 2 special characters</li>
          <li>Minimum 2 alphabets and numbers</li>
        </ul>
      </form>
    </div>
  );
};
export default ResetPasswordForm;
