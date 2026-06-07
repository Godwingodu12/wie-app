'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/features/store';

export const useAuth = (requireAuth: boolean = false) => {
  const router = useRouter();
  
  // Add null check for auth state
  const authState = useSelector((state: RootState) => state?.auth);
  const { user, token, isAuthenticated, loading } = authState || {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true
  };

  // Handle protected route redirect
  useEffect(() => {
    if (!loading && requireAuth && !isAuthenticated) {
      router.push('/login');
    }
  }, [requireAuth, loading, isAuthenticated, router]);

  return { 
    user, 
    token, 
    isAuthenticated, 
    loading
  };
};
