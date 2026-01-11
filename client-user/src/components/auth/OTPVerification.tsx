'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginSuccess } from '@/features/auth/authSlice';
import { signupVerifyOtp, resendOtp } from '@/services/wieUserService';
import { Button } from '../ui/Button';
import { OtpInput } from '../ui/OtpInput';
import { TopAlert } from '../ui/TopAlert';
import Link from 'next/link';

export const OTPVerification: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  // Alert state
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'error' | 'success'>('error');

  const searchParams = useSearchParams();
  const tempUserId = searchParams.get('tempUserId') || '';
  const method = searchParams.get('method');
  const identifier = searchParams.get('identifier');

  const dispatch = useDispatch();
  const router = useRouter();

  // Guard + cooldown timer
  useEffect(() => {
    if (!tempUserId) {
      router.replace('/signup');
      return;
    }

    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown, tempUserId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      setAlertType('error');
      setAlertMessage('OTP must be 6 digits');
      setShowAlert(true);
      return;
    }

    try {
      setLoading(true);

      const response = await signupVerifyOtp({
        tempUserId,
        otp,
      });

      if (response?.token && response?.user) {
        dispatch(loginSuccess({ token: response.token, user: response.user }));

        setAlertType('success');
        setAlertMessage('OTP verified successfully');
        setShowAlert(true);

        router.push('/home');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      setAlertType('error');
      setAlertMessage(
        err.response?.data?.message || 'OTP verification failed'
      );
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || !tempUserId) return;

    try {
      setResending(true);

      await resendOtp({ userId: tempUserId });

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

  return (
    <>
      {/* Top notification */}
      <TopAlert
        visible={showAlert}
        message={alertMessage}
        type={alertType}
        onClose={() => setShowAlert(false)}
      />

      <div className="w-full max-w-md mx-auto">
       

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
              onClick={() => router.push('/login')}
              className="text-[#8860D9] hover:text-purple-400"
            >
              Login
            </button>
          </div>

          
        </form>
      </div>
    </>
  );
};

export default OTPVerification;
