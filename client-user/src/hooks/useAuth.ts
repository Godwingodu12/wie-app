'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/features/store';
import { restoreAuth } from '@/features/auth/authSlice';

export const useAuth = (requireAuth: boolean = false) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, token, isAuthenticated, loading } = useSelector(
    (state: RootState) => state.auth
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Restore auth from localStorage on mount (only once)
  useEffect(() => {
    if (!isInitialized) {
      dispatch(restoreAuth());
      setIsInitialized(true);
    }
  }, [dispatch, isInitialized]);
  // Handle protected route redirect
  useEffect(() => {
    // Only redirect after auth has been initialized and is not loading
    if (isInitialized && !loading && requireAuth && !isAuthenticated) {
      router.push('/login');
    }
  }, [requireAuth, loading, isAuthenticated, router, isInitialized]);

  return { 
    user, 
    token, 
    isAuthenticated, 
    loading: loading || !isInitialized // Consider loading until initialized
  };
};