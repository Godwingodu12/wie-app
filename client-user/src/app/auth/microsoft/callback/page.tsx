'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/features/auth/authSlice';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Suspense } from 'react';

function MicrosoftCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  useEffect(() => {
    const processCallback = () => {
      try {
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');
        const error = searchParams.get('error');

        if (error) {
          console.error('Microsoft callback error:', error);
          router.replace(`/login?error=${encodeURIComponent(error)}`);
          return;
        }

        if (!token || !userParam) {
          console.error('Missing token or user in Microsoft callback');
          router.replace('/login?error=Microsoft+login+failed');
          return;
        }

        const user = JSON.parse(decodeURIComponent(userParam));

        // Store token in localStorage so auth guard sees it immediately
        localStorage.setItem('token', token);

        dispatch(loginSuccess({ token, user }));

        // Use replace so user can't go back to callback page
        router.replace('/home');
      } catch (error: any) {
        console.error('Microsoft callback processing error:', error);
        router.replace(`/login?error=${encodeURIComponent('Microsoft login failed')}`);
      }
    };

    processCallback();
  }, [searchParams, dispatch, router]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#0B0E14]">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-white/60">Completing Microsoft sign in...</p>
    </div>
  );
}

export default function MicrosoftCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col justify-center items-center min-h-screen bg-[#0B0E14]">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <MicrosoftCallbackContent />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';