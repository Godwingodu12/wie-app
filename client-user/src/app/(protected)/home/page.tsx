'use client';

import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Users, BookOpen, Search } from 'lucide-react';
export default function DashboardPage() {
  const { user } = useAuth(true);
  const router = useRouter();

  const handleNearbyEventsClick = () => {
    router.push('/events/nearby');
  };

  const handleAllEventsClick = () => {
    router.push('/events');
  };
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Header
          title={`Welcome back, ${user?.name || 'User'}!`}
          subtitle="Here's what's happening in your WIE community"
        />

        {/* Featured Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Category Events Card - Add after All Events Card */}
          <Card className="hover:shadow-xl transition-shadow cursor-pointer bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-600 rounded-full">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Browse by Category</h3>
                  <p className="text-sm text-gray-600">Explore events by your interests</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">
                Discover events organized by categories like Sports, Music, Arts, and more.
              </p>
              
              <button
                onClick={() => router.push('/events/categories')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                Explore Categories
              </button>
            </div>
          </Card>
          {/* Nearby Events Card */}
          <Card className="hover:shadow-xl transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-600 rounded-full">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Find Nearby Events</h3>
                  <p className="text-sm text-gray-600">Discover events happening around you</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">
                Use your location or search by city to find exciting events within your radius.
              </p>
              
              <button
                onClick={handleNearbyEventsClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Search Nearby Events
              </button>
            </div>
          </Card>
          {/* All Events Card */}
          <Card className="hover:shadow-xl transition-shadow cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-600 rounded-full">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">All Live Events</h3>
                  <p className="text-sm text-gray-600">Browse all upcoming events</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">
                Explore all live events happening across different locations and categories.
              </p>
              
              <button
                onClick={handleAllEventsClick}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                View All Events
              </button>
            </div>
          </Card>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Event Categories</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2">0</p>
              <p className="text-gray-600 text-sm">No upcoming events registered</p>
            </div>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Your Connections</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2">0</p>
              <p className="text-gray-600 text-sm">Start connecting with others</p>
            </div>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Resources</h3>
              </div>
              <p className="text-gray-600 mb-3">Explore learning materials</p>
              <button className="text-orange-600 hover:text-orange-700 font-medium text-sm">
                Browse Resources →
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
