'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/features/auth/authSlice';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Suspense } from 'react';

function AppleCallbackContent() {
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
          router.replace(`/login?error=${encodeURIComponent(error)}`);
          return;
        }

        if (!token || !userParam) {
          router.replace('/login?error=Apple+login+failed');
          return;
        }

        const user = JSON.parse(decodeURIComponent(userParam));

        localStorage.setItem('token', token);
        dispatch(loginSuccess({ token, user }));
        router.replace('/home');
      } catch (error: any) {
        router.replace(`/login?error=${encodeURIComponent('Apple login failed')}`);
      }
    };

    processCallback();
  }, [searchParams, dispatch, router]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#0B0E14]">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-white/60">Completing Apple sign in...</p>
    </div>
  );
}

export default function AppleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col justify-center items-center min-h-screen bg-[#0B0E14]">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <AppleCallbackContent />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';