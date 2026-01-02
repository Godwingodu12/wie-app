'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { restoreAuth } from '@/features/auth/authSlice';
import { SidebarProvider } from '@/context/SidebarContext';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(restoreAuth());
  }, [dispatch]);

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">{children}</main>
      </div>
    </SidebarProvider>
  );
}
