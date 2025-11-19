'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/features/auth/authSlice';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  useEffect(() => {
    const processCallback = () => {
      try {
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');
        
        if (!token || !userParam) {
          throw new Error('Missing authentication data');
        }

        // Parse user data
        const user = JSON.parse(decodeURIComponent(userParam));
        
        // Dispatch login success with token and user data
        dispatch(loginSuccess({ 
          token, 
          user 
        }));
        
        // Navigate to home page
        router.push('/protected/home');
      } catch (error: any) {
        console.error('Google callback error:', error);
        const errorMessage = error.message || 'Google login failed';
        router.push(`/login?error=${encodeURIComponent(errorMessage)}`);
      }
    };

    processCallback();
  }, [searchParams, dispatch, router]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">Completing Google sign in...</p>
    </div>
  );
}

export const dynamic = 'force-dynamic';