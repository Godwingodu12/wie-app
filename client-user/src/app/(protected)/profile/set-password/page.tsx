'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkCanSetPassword } from '@/services/wieUserService';
import SetPasswordComponent from '@/components/auth/SetPasswordComponent';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function SetPasswordPage() {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function verify() {
      try {
        const result = await checkCanSetPassword();
        if (result.canSetPassword) {
          setAllowed(true);
        } else {
          router.push('/profile');
        }
      } catch (err) {
        router.push('/profile');
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <SetPasswordComponent />
    </div>
  );
}
