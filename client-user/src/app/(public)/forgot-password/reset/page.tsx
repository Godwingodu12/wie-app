'use client';

import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Image from 'next/image';
import WieLogo from '@/assets/forgot-password/WieLogo.svg';

function ResetContent() {
  return (
    // Updated background to deep dark/black
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-12">

        {/* Left Side: Logo and Title */}
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative w-32 h-32">
            <Image
              src={WieLogo}
              alt="Community Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">
            Reset Password
          </h1>
        </div>

        {/* Right Side: The Form Box */}
        <div className="w-full max-w-sm flex flex-col justify-center">
          <p className="text-gray-400 text-center mb-8 text-base leading-relaxed">
            Enter a new password
          </p>
          <ResetPasswordForm />
        </div>

      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-[#0a0a0b]">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <ResetContent />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';
