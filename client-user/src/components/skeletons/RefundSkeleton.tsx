'use client';

import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useTheme } from '@/components/home/ThemeContext';

const RefundSkeleton = () => {
  const { isDark } = useTheme();

  return (
    <SkeletonTheme
      baseColor={isDark ? '#1a1a1a' : '#f3f4f6'}
      highlightColor={isDark ? '#2a2a2a' : '#e5e7eb'}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 animate-fadeIn">
        {/* Back Button */}
        <div className="mb-10">
          <Skeleton width={120} height={32} borderRadius={12} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* Status Card */}
            <div className={`p-8 rounded-2xl border ${isDark ? 'border-white/5 bg-white/5' : 'border-black/5 bg-white'}`}>
              <div className="flex justify-between mb-6">
                <Skeleton width={150} height={20} />
                <Skeleton width={80} height={20} borderRadius={8} />
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-8 mb-8">
                <Skeleton width={160} height={214} borderRadius={20} />
                <div className="flex-1 space-y-4 w-full">
                  <Skeleton width="90%" height={48} />
                  <Skeleton width="70%" height={24} />
                  <div className="pt-4">
                    <Skeleton width={120} height={28} borderRadius={12} />
                  </div>
                </div>
              </div>
              <Skeleton width="100%" height={64} borderRadius={16} />
            </div>

            {/* Timeline Card */}
            <div className={`p-8 rounded-2xl border ${isDark ? 'border-white/5 bg-white/5' : 'border-black/5 bg-white'}`}>
              <div className="flex justify-between mb-10">
                <Skeleton width={140} height={28} />
                <Skeleton width={100} height={28} borderRadius={12} />
              </div>
              <div className="space-y-12 relative">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-8">
                    <Skeleton circle width={40} height={40} />
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between">
                        <Skeleton width={150} height={20} />
                        <Skeleton width={120} height={16} />
                      </div>
                      <Skeleton width="40%" height={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className={`p-8 rounded-2xl border ${isDark ? 'border-white/5 bg-white/5' : 'border-black/5 bg-white'}`}>
              <Skeleton width={100} height={16} className="mb-6" />
              <Skeleton width="100%" height={28} className="mb-4" />
              <Skeleton width="80%" height={20} className="mb-8" />
              <div className="space-y-4">
                <Skeleton width="100%" height={56} borderRadius={16} />
              </div>
            </div>
            <div className={`p-8 rounded-2xl border ${isDark ? 'border-white/5 bg-white/5' : 'border-black/5 bg-white'}`}>
              <Skeleton width={150} height={24} className="mb-6" />
              <div className="space-y-4">
                <Skeleton width="100%" height={20} />
                <Skeleton width="100%" height={20} />
                <Skeleton width="100%" height={20} />
                <div className="pt-6 border-t border-white/5">
                  <Skeleton width="100%" height={40} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
};

export default RefundSkeleton;
