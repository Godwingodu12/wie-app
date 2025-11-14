'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyResetOTP } from '@/services/wieUserService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const VerifyResetOTPForm: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams.get('userId') || '';
  const identifier = searchParams.get('identifier') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    if (!userId) {
      setError('Invalid request. Please try again.');
      return;
    }

    try {
      setLoading(true);

      const response = await verifyResetOTP(userId, otp);

      if (response.success && response.data?.resetToken) {
        // Navigate to reset password page
        router.push(`/forgot-password/reset?userId=${userId}&token=${response.data.resetToken}`);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Invalid or expired OTP';
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
            Enter the OTP sent to <strong>{identifier}</strong>
          </p>
        </div>

        <Input
          label="Enter OTP"
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter 6-digit OTP"
          maxLength={6}
          required
        />

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Verify OTP
        </Button>
      </form>
    </div>
  );
};
export default VerifyResetOTPForm;