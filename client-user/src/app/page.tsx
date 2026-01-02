'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/home');
    }
  }, [isAuthenticated, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If authenticated, show loading while redirecting
  if (isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to WIE
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Women in Engineering - Join our community and connect with amazing
            women in technology
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link href="/signup">
              <Button>
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button>
                Login
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-4xl mb-4">🌟</div>
            <h3 className="text-xl font-semibold mb-2">Connect</h3>
            <p className="text-gray-600">
              Network with women engineers from around the world
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">Learn</h3>
            <p className="text-gray-600">
              Access resources and events to grow your skills
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-2">Grow</h3>
            <p className="text-gray-600">
              Advance your career with mentorship and opportunities
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
