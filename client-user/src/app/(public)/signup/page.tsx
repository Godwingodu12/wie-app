'use client';

import { Suspense, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import SignupForm from '@/components/auth/SignupForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import WIEImage from '@/assets/Auth/WieLogo.svg'; 
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import {AppleAuthButton} from '@/components/auth/AppleAuthButton';
import {MicrosoftAuthButton} from '@/components/auth/MicrosoftAuthButton';
import LoginSignupNavbar from '@/components/auth/LoginSignupNavbar';
import TopImage from '@/assets/Auth/TopImage.svg';

function SignupContent() {
  const { isAuthenticated, loading } = useAuth(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/home');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0E14]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
<div className="min-h-screen bg-[#0B0E14] flex flex-col items-center px-4 sm:px-6">
  <LoginSignupNavbar/>
{/* Wie pill — centered to full page */}
<div className="w-full flex flex-col items-center mt-6 sm:mt-8">
  
  {/* Logo pill (keep on all devices) */}
  <div className="flex items-center justify-center px-3.5 py-3.5 rounded-3xl bg-[#2F2F2F]">
    <img
      src={WIEImage.src}
      alt="Wiehive"
      className="w-12 h-12 sm:w-14 sm:h-14"
    />
  </div>

  {/* App name — HIDE ON SMALL DEVICES */}
  <h1 className="hidden sm:block mt-2 text-white text-3xl font-semibold">
    Wiehive
  </h1>
</div>


<div className="hidden sm:flex items-center justify-center overflow-hidden">
  <img
    src={TopImage.src}
    alt="Image"
    className="scale-100"
  />
</div>
{/* Center – Form */}
<div className="relative w-full max-w-md mx-auto flex flex-col pt-1">
  {/* Card */}
  <div className="p-8 flex flex-col items-center text-center">
    <h2 className="text-3xl font-bold text-white mb-2">
      Welcome to Wiehive
    </h2>

    <h3 className="text-lg text-[#686868] mb-6 leading-relaxed">
      Start your new journey with Wiehive <br />
      by creating a new account
    </h3>

    <SignupForm />
  </div>
</div>

             {/* SOCIAL LOGIN — SAFE CENTERED */}
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

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#0B0E14]">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}