'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { forgotPassword } from '@/services/wieUserService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import Link from 'next/link';

export const ForgotPasswordForm: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier) {
      setError('Please enter your email');
      setAlertVisible(true);
      return;
    }

    try {
      setLoading(true);

      // Determine if input is email or phone number
      const payload = { email: identifier };

      const response = await forgotPassword(payload);

      if (response.success && response.data?.userId) {
        // Navigate to OTP verification page
        router.push(`/forgot-password/verify?userId=${response.data.userId}&identifier=${encodeURIComponent(identifier)}`);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send OTP';
      setError(errorMessage);
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center mb-6">
          <p className="text-gray-600">
            Enter your email to receive an OTP for password reset
          </p>
        </div>

        <Input
          label="Email"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Enter email"
          required
        />

        <Alert
          message={error}
          visible={alertVisible}
          onClose={() => setAlertVisible(false)}
          type="error"
        />

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
