'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import WIEImage from '@/assets/Auth/WieLogo.svg';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { AppleAuthButton } from '@/components/auth/AppleAuthButton';
import { MicrosoftAuthButton } from '@/components/auth/MicrosoftAuthButton';
import { NavBar } from '@/components/auth/NavBar';
import TopImage from '@/assets/Auth/TopImage.svg';

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
    <div className="min-h-screen bg-[#0B0E14] flex flex-col items-center px-4 sm:px-6">
      <NavBar />

      {/* Wie pill */}
      <div className="w-full flex flex-col items-center mt-6 sm:mt-8">
        <div className="flex items-center justify-center px-3.5 py-3.5 rounded-3xl bg-[#2F2F2F]">
          <img
            src={WIEImage.src}
            alt="Wiehive"
            className="w-12 h-12 sm:w-14 sm:h-14"
          />
        </div>

        <h1 className="hidden sm:block mt-2 text-white text-3xl font-semibold">
          Wiehive
        </h1>
      </div>

      {/* Top image */}
      <div className="hidden sm:flex items-center justify-center overflow-hidden">
        <img src={TopImage.src} alt="Image" className="scale-100" />
      </div>

      {/* Center – Login Form */}
      <div className="relative w-full max-w-md mx-auto flex flex-col pt-1">
        <div className="p-8 flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back to Wiehive
          </h2>

          <h3 className="text-lg text-[#686868] mb-6 leading-relaxed">
            Continue your journey with Wiehive<br />
            by exiting new  features
          </h3>

          <LoginForm />
        </div>
      </div>

      {/* SOCIAL LOGIN */}
      <div className="w-full flex justify-center pb-10">
        <div className="w-full max-w-md flex flex-col items-center gap-4">
          <div className="flex items-center w-full gap-3">
            <span className="flex-1 h-px bg-white/20" />
            <span className="text-white/60 text-sm whitespace-nowrap">
              or login with
            </span>
            <span className="flex-1 h-px bg-white/20" />
          </div>

          <div className="flex gap-4">
            <GoogleAuthButton />
            <AppleAuthButton />
            <MicrosoftAuthButton />
          </div>
        </div>
      </div>
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
