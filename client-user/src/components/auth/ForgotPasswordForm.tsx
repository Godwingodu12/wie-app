'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { forgotPassword } from '@/services/wieUserService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import Link from 'next/link';

export const ForgotPasswordForm: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier) {
      setError('Please enter your email or phone number');
      return;
    }

    try {
      setLoading(true);

      // Determine if input is email or phone number
      const isEmail = identifier.includes('@');
      const payload = isEmail 
        ? { email: identifier } 
        : { contact_no: identifier };

      const response = await forgotPassword(payload);

      if (response.success && response.data?.userId) {
        // Navigate to OTP verification page
        router.push(`/forgot-password/verify?userId=${response.data.userId}&identifier=${encodeURIComponent(identifier)}`);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send OTP';
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
            Enter your email or phone number to receive an OTP for password reset
          </p>
        </div>

        <Input
          label="Email or Phone Number"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Enter email or phone number"
          required
        />

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Send OTP
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Remember your password?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  );
};
export default ForgotPasswordForm;