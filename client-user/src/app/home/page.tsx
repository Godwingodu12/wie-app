'use client';

import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';

export default function DashboardPage() {
  const { user } = useAuth(true);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Header
          title={`Welcome back, ${user?.name || 'User'}!`}
          subtitle="Here's what's happening in your WIE community"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <h3 className="text-lg font-semibold mb-2">Upcoming Events</h3>
            <p className="text-gray-600">No upcoming events</p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-2">Your Connections</h3>
            <p className="text-gray-600">0 connections</p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-2">Resources</h3>
            <p className="text-gray-600">Explore learning materials</p>
          </Card>
        </div>
      </div>
    </div>
  );
}