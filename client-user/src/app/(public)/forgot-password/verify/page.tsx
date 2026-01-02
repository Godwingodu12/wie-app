'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { VerifyResetOTPForm } from '@/components/auth/VerifyResetOTPForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Image from 'next/image';
import LockIcon from '@/assets/forgot-password/LockIcon.svg';
import { NavBar } from '@/components/auth/NavBar';
import BackIcon from '@/assets/forgot-password/BackIcon.svg';


function VerifyContent() {
    const router = useRouter();
  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white flex flex-col">
      
      {/* Navbar at top */}
      <NavBar />
      {/* Back button row (hidden on small screens) */}
            <div className="hidden md:flex px-6 mt-4">
              <button
                onClick={() => router.push('/forgot-password')}
                className="w-10 h-10 rounded-full bg-[#1C2024B2]
                           flex items-center justify-center
                           hover:bg-[#2A2F35] transition"
              >
                <Image src={BackIcon} alt="Back" className="w-5 h-5" />
              </button>
            </div>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">

          {/* Lock Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#2F2F2F] flex items-center justify-center">
              <Image src={LockIcon} alt="Lock" className="w-8 h-8" />
            </div>
          </div>

          {/* Title */}
<h1 className="text-3xl font-extrabold tracking-tight mb-2">
  Verification code
</h1>

{/* Description */}
<p className="text-gray-400 text-sm mb-8">
  Please enter your code we sent to
  <br />
  your email or phone to verify your account.
</p>


          {/* OTP Form */}
          <VerifyResetOTPForm />

        </div>
      </div>
    </div>
  );
}

export default function VerifyResetOTPPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#0a0b0d]">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';
