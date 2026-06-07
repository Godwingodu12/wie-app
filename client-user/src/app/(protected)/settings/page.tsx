'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (window.innerWidth >= 1024) { // lg breakpoint is 1024px in Tailwind
      router.replace('/settings/account/profile');
    }
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="hidden lg:flex h-full w-full items-center justify-center text-gray-500">
      <p>Select a setting from the menu</p>
    </div>
  );
}
