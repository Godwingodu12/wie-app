'use client';

import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useTheme } from '@/components/home/ThemeContext';

const BookingDetailSkeleton = () => {
  const { isDark } = useTheme();

  return (
    <SkeletonTheme
      baseColor={isDark ? '#1a1a1a' : '#f3f4f6'}
      highlightColor={isDark ? '#2a2a2a' : '#e5e7eb'}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 animate-fadeIn">
        {/* Header/Back Button */}
        <div className="mb-8">
          <Skeleton width={120} height={32} borderRadius={12} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area (Left) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Details Card */}
            <div className={`p-4 sm:p-8 rounded-2xl border ${isDark ? 'border-white/5 bg-white/5' : 'border-black/5 bg-white'}`}>
              <div className="flex flex-col sm:flex-row gap-6 mb-8 items-center sm:items-start">
                <Skeleton width={160} height={224} borderRadius={12} />
                <div className="flex-1 space-y-4 w-full text-center sm:text-left">
                  <Skeleton width="80%" height={40} />
                  <div className="flex gap-3 justify-center sm:justify-start">
                    <Skeleton width={80} height={24} borderRadius={20} />
                    <Skeleton width={80} height={24} borderRadius={12} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Skeleton width={60} height={16} />
                    <Skeleton width={100} height={16} />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton width={60} height={16} />
                    <Skeleton width={100} height={16} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Skeleton width={60} height={16} />
                    <Skeleton width={120} height={16} />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton width={60} height={16} />
                    <Skeleton width={100} height={16} />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary Card */}
            <div className={`p-6 sm:p-8 rounded-2xl border ${isDark ? 'border-white/5 bg-white/5' : 'border-black/5 bg-white'}`}>
              <Skeleton width={150} height={24} className="mb-6" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton width={100} height={16} />
                    <Skeleton width={60} height={16} />
                  </div>
                ))}
                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                  <Skeleton width={120} height={24} />
                  <Skeleton width={100} height={32} />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Area (Right) */}
          <div className="space-y-8">
            {/* Ticket Card */}
            <div className={`p-8 rounded-2xl border ${isDark ? 'border-white/5 bg-white/5' : 'border-black/5 bg-white'}`}>
              <div className="flex flex-col items-center">
                <Skeleton width={160} height={160} borderRadius={12} className="mb-6" />
                <Skeleton width={100} height={24} className="mb-4" />
                <Skeleton width="100%" height={56} borderRadius={12} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Skeleton width="100%" height={80} borderRadius={12} />
              <Skeleton width="100%" height={70} borderRadius={12} />
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
};

export default BookingDetailSkeleton;
