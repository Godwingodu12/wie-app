'use client';

import { Suspense } from 'react';
import { VerifyResetOTPForm } from '@/components/auth/VerifyResetOTPForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Image from 'next/image';
import WieLogo from '@/assets/forgot-password/WieLogo.svg';
import { FcGoogle } from 'react-icons/fc';
import { FaApple, FaMicrosoft } from 'react-icons/fa';

function VerifyContent() {
  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white overflow-hidden relative flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-center gap-12 md:gap-32"> {/* Removed negative margin to align content lower */}

          {/* Left Side: Logo and Title */}
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative w-32 h-32">
              <Image
                src={WieLogo}
                alt="Community Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
              Verification code
            </h1>
          </div>

          {/* Right Side: Form */}
          <div className="w-full max-w-md flex flex-col items-center">
            <div className="w-full text-center md:text-left mb-8">
              <p className="text-gray-400 text-base leading-relaxed">
                Please enter the code we sent to your email or phone to verify your account
              </p>
            </div>

            {/* The OTP Form Container */}
            <div className="w-full">
              <VerifyResetOTPForm />
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Social Login - Positioned at Bottom */}
      <div className="w-full pb-8 pt-4">
        <div className="max-w-md mx-auto px-4">
          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-gray-800 w-full absolute"></div>
            <span className="bg-[#0a0b0d] px-4 text-sm text-white font-medium relative z-10">
              or login with
            </span>
          </div>

          <div className="flex justify-center gap-6">
            <SocialButton>
              <FcGoogle className="w-6 h-6" />
            </SocialButton>
            <SocialButton>
              <FaApple className="w-6 h-6 text-white" />
            </SocialButton>
            <SocialButton>
              {/* Custom Microsoft Logo SVG */}
              <svg className="w-6 h-6" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                <path fill="#f35325" d="M1 1h10v10H1z"/>
                <path fill="#81bc06" d="M12 1h10v10H12z"/>
                <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                <path fill="#ffba08" d="M12 12h10v10H12z"/>
              </svg>
            </SocialButton>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper for the social icons
function SocialButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="w-12 h-12 rounded-full bg-gray-800/50 flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700/50">
      {children}
    </button>
  );
}

export default function VerifyResetOTPPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-[#0a0b0d]">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';
