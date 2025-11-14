'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginSuccess } from '@/features/auth/authSlice';
import { signupVerifyOtp, resendOtp } from '@/services/wieUserService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import Link from 'next/link';
export const OTPVerification: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const searchParams = useSearchParams();
  const tempUserId = searchParams.get('tempUserId');
  const method = searchParams.get('method');
  const identifier = searchParams.get('identifier');
  
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    if (!tempUserId) {
      router.push('/signup');
      return;
    }

    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [tempUserId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    if (!tempUserId) {
      setError('Invalid verification session');
      return;
    }

    try {
      setLoading(true);
      
      const verifyData: any = {
        tempUserId: tempUserId,
        otp: otp,
      };

      // Add name if provided
      if (name.trim()) {
        verifyData.name = name.trim();
      }

      const response = await signupVerifyOtp(verifyData);
      
      if (response.token && response.user) {
        dispatch(loginSuccess({ token: response.token, user: response.user }));
        router.push('/home');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'OTP verification failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || !tempUserId) return;

    try {
      setResendLoading(true);
      await resendOtp({ userId: tempUserId });
      
      // Reset timer
      setResendTimer(60);
      setCanResend(false);
      
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to resend OTP';
      setError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Verify OTP</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter the 6-digit code sent to your {method === 'email' ? 'email' : 'phone'}
        </p>
        {identifier && (
          <p className="mt-1 text-sm font-medium text-gray-800">
            {identifier}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="OTP Code"
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
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

      <div className="mt-4 text-center">
        {canResend ? (
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendLoading}
            className="text-blue-600 hover:underline text-sm disabled:opacity-50"
          >
            {resendLoading ? 'Sending...' : 'Resend OTP'}
          </button>
        ) : (
          <p className="text-sm text-gray-600">
            Resend OTP in {resendTimer} seconds
          </p>
        )}
      </div>

      <div className="mt-4 text-center">
        <Link href="/signup" className="text-sm text-gray-600 hover:text-blue-600">
          ← Back to signup
        </Link>
      </div>
    </div>
  );
};
export default OTPVerification;