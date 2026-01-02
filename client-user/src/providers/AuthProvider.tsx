'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/features/store';
import { restoreAuth } from '@/features/auth/authSlice';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const [isInitialized, setIsInitialized] = useState(false);
  const authState = useSelector((state: RootState) => state?.auth);

  useEffect(() => {
    // Restore auth immediately on mount
    dispatch(restoreAuth());
    setIsInitialized(true);
  }, [dispatch]);

  // Don't render children until auth is initialized
  if (!isInitialized || authState?.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0C1014]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8860D9]"></div>
      </div>
    );
  }

  return <>{children}</>;
}