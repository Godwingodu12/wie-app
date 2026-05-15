'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import WIEImage from '@/assets/Auth/WieLogo.png';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { AppleAuthButton } from '@/components/auth/AppleAuthButton';
import { MicrosoftAuthButton } from '@/components/auth/MicrosoftAuthButton';
import { NavBar } from '@/components/auth/NavBar';
import TopImage from '@/assets/Auth/TopImage.svg';
import LoginSignupNavbar from '@/components/auth/LoginSignupNavbar';


function LoginContent() {
  const { isAuthenticated, loading } = useAuth(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(redirect || '/home');
    }
  }, [isAuthenticated, loading, router, redirect]);

  if (loading || isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0E14]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0B0E14] flex flex-col items-center justify-center px-4 py-12 sm:px-6 overflow-x-hidden">
      <LoginSignupNavbar />

      {/* Main content wrapper */}
      <div className="w-full max-w-md flex flex-col items-center z-10">
        {/* Wie pill */}
        <div className="flex flex-col items-center mb-6 sm:mb-8 transition-transform duration-500 hover:scale-105">
          <div className="flex items-center justify-center px-4 py-4 rounded-[28px] bg-[#2F2F2F] shadow-xl border border-white/5">
            <img
              src={WIEImage.src}
              alt="Wie"
              className="w-12 h-12 sm:w-16 sm:h-16"
            />
          </div>
          <h1 className="mt-4 text-white text-3xl font-bold tracking-tight">
            Wie
          </h1>
        </div>

        {/* Top image - subtle and themed */}
        <div className="hidden sm:flex items-center justify-center mb-2 opacity-80 pointer-events-none">
          <img src={TopImage.src} alt="" className="max-w-[280px]" />
        </div>

        {/* Login Form Section */}
        <div className="w-full flex flex-col items-center">
          <div className="w-full text-center mb-8 px-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Welcome back
            </h2>
            <p className="text-base text-gray-400 leading-relaxed max-w-[280px] mx-auto">
              Continue your journey by exploring new features
            </p>
          </div>

          <div className="w-full bg-white/[0.02] border border-white/5 rounded-[40px] p-1 sm:p-2 backdrop-blur-sm shadow-2xl">
            <div className="p-4 sm:p-8 w-full">
              <LoginForm />
            </div>
          </div>
        </div>

        {/* SOCIAL LOGIN */}
        <div className="w-full mt-10">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center w-full gap-4 px-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
              <span className="text-white/40 text-xs font-medium uppercase tracking-widest">
                or continue with
              </span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
            </div>

            <div className="flex gap-6">
              <div className="hover:scale-110 transition-transform"><GoogleAuthButton /></div>
              <div className="hover:scale-110 transition-transform"><AppleAuthButton /></div>
              <div className="hover:scale-110 transition-transform"><MicrosoftAuthButton /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-[#8860D9] opacity-[0.03] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#B3B8E2] opacity-[0.03] blur-[120px] pointer-events-none" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#0B0E14]">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
