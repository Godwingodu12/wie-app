"use client";

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useTheme } from "@/components/home/ThemeContext";

export default function ExploreSkeleton() {
  const { isDark } = useTheme();

  return (
    <SkeletonTheme
      baseColor={isDark ? "#1e1e1e" : "#e0e0e0"}
      highlightColor={isDark ? "#2e2e2e" : "#f0f0f0"}
    >
      <div className="w-full max-w-[700px] px-4 py-8 animate-fadeIn mx-auto">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <Skeleton width="40%" height={32} className="mb-2 min-w-[140px]" />
          <Skeleton width="80%" height={16} className="mx-auto sm:mx-0" />
        </div>

        {/* Search Bar */}
        <div className="mb-10">
          <Skeleton height={50} borderRadius={16} />
        </div>

        {/* User Cards */}
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton circle width={50} height={50} className="flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-1">
                    <Skeleton width="60%" height={18} className="min-w-[100px]" />
                    <Skeleton width="30%" height={12} className="min-w-[60px]" />
                  </div>
                </div>
                <Skeleton width={80} height={32} borderRadius={999} className="self-end sm:self-center" />
              </div>
              
              {/* Bio */}
              <div className="space-y-2 mb-4">
                <Skeleton width="95%" height={12} />
                <Skeleton width="70%" height={12} />
              </div>

              {/* Stats */}
              <div className="flex gap-6">
                <Skeleton width="30%" height={14} className="min-w-[80px]" />
                <Skeleton width="30%" height={14} className="min-w-[80px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonTheme>
  );
}
