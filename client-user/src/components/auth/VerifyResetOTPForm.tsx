'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyResetOTP, resendOtp } from '@/services/wieUserService';
import { Button } from '../ui/Button';
import { OtpInput } from '../ui/OtpInput';
import { TopAlert } from '../ui/TopAlert';

export const VerifyResetOTPForm: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  // Alert state
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'error' | 'success'>('error');

  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams.get('userId') || '';
  const identifier = searchParams.get('identifier') || '';

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendOtp = async () => {
    if (cooldown > 0) return;

    setResending(true);

    try {
      await resendOtp({ userId });
      setCooldown(60);

      setAlertType('success');
      setAlertMessage('Verification code sent successfully');
      setShowAlert(true);
    } catch (err: any) {
      setAlertType('error');
      setAlertMessage(
        err.response?.data?.message || 'Failed to resend verification code'
      );
      setShowAlert(true);
    } finally {
          setResending(false);
        }
      };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setAlertType('error');
      setAlertMessage('OTP must be 6 digits');
      setShowAlert(true);
      return;
    }


    try {
      setLoading(true);
      const response = await verifyResetOTP(userId, otp);

      if (response.success && response.data?.resetToken) {
        router.push(
          `/forgot-password/reset?userId=${userId}&token=${response.data.resetToken}`
        );
      }
    } catch (err: any) {
      setAlertMessage(
        err.response?.data?.message ||
          'The verification code you entered is incorrect. Please try again'
      );
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Top notification */}
      <TopAlert
        visible={showAlert}
        message={alertMessage}
        type={alertType}
        onClose={() => setShowAlert(false)}
      />


      <form onSubmit={handleSubmit} className="space-y-5">
        {/* OTP Boxes */}
        <OtpInput value={otp} onChange={setOtp} />

        {/* Resend */}
        <div className="text-center text-sm">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={cooldown > 0 || resending}
            className={
              cooldown > 0
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-[#8860D9] hover:text-purple-400'
            }
          >
            {resending
              ? 'Resending...'
              : cooldown > 0
              ? `Resend code (${cooldown}s)`
              : 'Resend code'}
          </button>
        </div>

        {/* Change contact details */}
        <div className="text-center text-sm text-gray-400">
          Click here to{' '}
          <button
            type="button"
            className="text-[#8860D9] hover:text-purple-400"
          >
            change contact details
          </button>
        </div>

        {/* Verify Button */}
        <Button
          type="submit"
          loading={loading}
          className="w-full h-[56px] rounded-full text-white
                     bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD]"
        >
          Verify
        </Button>

        {/* Login */}
        <div className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <button
            type="button"
            className="text-[#8860D9] hover:text-purple-400"
          >
            Login
          </button>
        </div>
      </form>
    </>
  );
};

export default VerifyResetOTPForm;
