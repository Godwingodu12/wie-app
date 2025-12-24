'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyResetOTP, resendOtp } from '@/services/wieUserService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const VerifyResetOTPForm: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams.get('userId') || '';
  const identifier = searchParams.get('identifier') || '';

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendOtp = async () => {
    if (cooldown > 0) return;

    setError('');
    setSuccess('');
    setResending(true);

    try {
      const response = await resendOtp({ userId });
      
      setSuccess(response.message || 'OTP resent successfully');
      setRemainingAttempts(response.remainingAttempts ?? null);
      setCooldown(60); // 60 second cooldown
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to resend OTP';
      setError(errorMessage);
      
      // If rate limited, show remaining attempts
      if (err.response?.status === 429) {
        setRemainingAttempts(0);
      }
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
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
          <p className="text-white/60">
            Enter the OTP sent to <strong className="text-white">{identifier}</strong>
          </p>
          {remainingAttempts !== null && (
            <p className="text-sm text-yellow-400 mt-2">
              {remainingAttempts > 0 
                ? `${remainingAttempts} attempt(s) remaining`
                : 'No attempts remaining. Please try again later.'}
            </p>
          )}
        </div>

        <input
          type="tel"
          inputMode="numeric"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          placeholder="Enter 6-digit OTP"
          maxLength={6}
          className="w-full px-4 py-3 text-white bg-transparent border border-gray-700 rounded-md caret-white focus:border-purple-500 focus:outline-none"
        />

        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
            {success}
          </div>
        )}

        <Button 
          type="submit" 
          loading={loading} 
          className="w-full h-[56px] rounded-full text-white bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD]"
        >
          Verify OTP
        </Button>

        {/* Resend OTP Button */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resending || cooldown > 0 || remainingAttempts === 0}
            className={`text-sm ${
              cooldown > 0 || remainingAttempts === 0
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-purple-400 hover:text-purple-300'
            }`}
          >
            {resending ? (
              'Resending...'
            ) : cooldown > 0 ? (
              `Resend OTP in ${cooldown}s`
            ) : remainingAttempts === 0 ? (
              'No attempts remaining'
            ) : (
              'Resend OTP'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VerifyResetOTPForm;
