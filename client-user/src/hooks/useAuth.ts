'use client';

import { useEffect } from 'react';
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

  useEffect(() => {
    // Restore auth from localStorage on mount
    dispatch(restoreAuth());
  }, [dispatch]);

  useEffect(() => {
    if (requireAuth && !loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [requireAuth, loading, isAuthenticated, router]);

  return { user, token, isAuthenticated, loading };
};