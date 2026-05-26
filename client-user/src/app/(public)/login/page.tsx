'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import WIEImage from '@/assets/Auth/WieLogo.png';
import WIEImageWhite from '@/assets/Auth/WieLogoWhite.png';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { AppleAuthButton } from '@/components/auth/AppleAuthButton';
import { MicrosoftAuthButton } from '@/components/auth/MicrosoftAuthButton';
import { NavBar } from '@/components/auth/NavBar';
import TopImage from '@/assets/Auth/TopImage.svg';
import LoginSignupNavbar from '@/components/auth/LoginSignupNavbar';
import { useTheme } from '@/components/home/ThemeContext';

function LoginContent() {
  const { isAuthenticated, loading } = useAuth(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const { isDark } = useTheme();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(redirect || '/home');
    }
  }, [isAuthenticated, loading, router, redirect]);

  if (loading || isAuthenticated) {
    return (
      <div className={`flex items-center justify-center min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0B0E14]' : 'bg-[#F9FAFB]'}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:px-6 overflow-x-hidden transition-colors duration-300 ${isDark ? 'bg-[#0B0E14]' : 'bg-[#F9FAFB]'}`}>
      <LoginSignupNavbar />

      {/* Main content wrapper */}
      <div className="w-full max-w-md flex flex-col items-center z-10">
        {/* Wie pill */}
        <div className="flex flex-col items-center mb-6 sm:mb-8 transition-transform duration-500 hover:scale-105">
          <div className="flex items-center justify-center">
            {isDark ? (
              <img
                src={WIEImageWhite.src}
                alt="Wie"
                className="w-20 h-20 sm:w-28 sm:h-28"
              />
            ) : (
              <img
                src={WIEImage.src}
                alt="Wie"
                className="w-20 h-20 sm:w-28 sm:h-28"
              />
            )}
          </div>
          <h1 className={`mt-4 text-3xl font-bold tracking-tight transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Wie
          </h1>
        </div>

        {/* Top image - subtle and themed */}
        <div className={`hidden sm:flex items-center justify-center mb-2 opacity-80 pointer-events-none transition-all duration-300 ${!isDark ? 'filter invert brightness-50 opacity-40' : ''}`}>
          <img src={TopImage.src} alt="" className="max-w-[280px]" />
        </div>

        {/* Login Form Section */}
        <div className="w-full flex flex-col items-center">
          <div className="w-full text-center mb-8 px-2">
            <h2 className={`text-2xl sm:text-3xl font-bold mb-3 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Welcome back
            </h2>
            <p className={`text-base leading-relaxed max-w-[280px] mx-auto transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Continue your journey by exploring new features
            </p>
          </div>

          <div className={`w-full border rounded-[40px] p-1 sm:p-2 backdrop-blur-sm shadow-2xl transition-all duration-300 ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white/70 border-gray-200 shadow-xl'}`}>
            <div className="p-4 sm:p-8 w-full">
              <LoginForm />
            </div>
          </div>
        </div>

        {/* SOCIAL LOGIN */}
        <div className="w-full mt-10">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center w-full gap-4 px-4">
              <div className={`flex-1 h-px bg-gradient-to-r transition-all duration-300 ${isDark ? 'from-transparent to-white/10' : 'from-transparent to-gray-200'}`} />
              <span className={`text-xs font-medium uppercase tracking-widest transition-colors duration-300 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                or continue with
              </span>
              <div className={`flex-1 h-px bg-gradient-to-l transition-all duration-300 ${isDark ? 'from-transparent to-white/10' : 'from-transparent to-gray-200'}`} />
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
      <div className={`absolute top-1/4 -left-20 w-64 h-64 bg-[#8860D9] blur-[100px] pointer-events-none transition-opacity duration-300 ${isDark ? 'opacity-[0.03]' : 'opacity-[0.05]'}`} />
      <div className={`absolute bottom-1/4 -right-20 w-80 h-80 bg-[#B3B8E2] blur-[120px] pointer-events-none transition-opacity duration-300 ${isDark ? 'opacity-[0.03]' : 'opacity-[0.05]'}`} />
    </div>
  );
}

export default function LoginPage() {
  const { isDark } = useTheme();
  return (
    <Suspense
      fallback={
        <div className={`flex items-center justify-center min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0B0E14]' : 'bg-[#F9FAFB]'}`}>
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
