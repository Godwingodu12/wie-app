"use client";

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useTheme } from "@/components/home/ThemeContext";

export default function BookingSkeleton() {
  const { isDark, themeStyles } = useTheme();

  return (
    <SkeletonTheme
      baseColor={isDark ? "#1e1e1e" : "#e0e0e0"}
      highlightColor={isDark ? "#2e2e2e" : "#f0f0f0"}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
        {/* Hero Section */}
        <div className="mb-10 text-center sm:text-left">
          <Skeleton width="40%" height={32} className="mb-2 min-w-[150px]" />
          <Skeleton width="60%" height={16} className="mx-auto sm:mx-0" />
        </div>

        {/* Controls Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8">
          <div className="lg:col-span-12 xl:col-span-8">
            <Skeleton height={54} borderRadius={12} />
          </div>
          <div className="lg:col-span-12 xl:col-span-4 flex flex-nowrap sm:flex-wrap gap-2 p-1 overflow-x-auto no-scrollbar">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} width={80} height={36} borderRadius={12} className="flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-6">
          <Skeleton width="20%" height={24} className="mb-4 min-w-[120px]" />
          
          {/* Table Header (Desktop) */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-2 mb-2 opacity-50">
            {[4, 2, 2, 1, 1, 2].map((span, i) => (
              <div key={i} className={`col-span-${span}`}>
                <Skeleton width="50%" height={10} />
              </div>
            ))}
          </div>

          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 rounded-xl border border-white/5 bg-white/5">
              {/* Desktop Layout */}
              <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                <div className="col-span-4 flex items-center gap-4">
                  <Skeleton width={48} height={48} borderRadius={8} className="flex-shrink-0" />
                  <div className="flex flex-col gap-1 w-full">
                    <Skeleton width="70%" height={16} />
                    <Skeleton width="40%" height={10} />
                  </div>
                </div>
                <div className="col-span-2">
                  <Skeleton width="60%" height={12} />
                </div>
                <div className="col-span-2">
                  <Skeleton width="80%" height={12} />
                </div>
                <div className="col-span-1">
                  <Skeleton width="40%" height={10} />
                </div>
                <div className="col-span-1 text-right">
                  <Skeleton width="70%" height={18} />
                </div>
                <div className="col-span-2 flex justify-end">
                  <Skeleton width="100%" height={24} borderRadius={999} className="max-w-[70px]" />
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="block lg:hidden space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <Skeleton width={40} height={40} borderRadius={8} className="flex-shrink-0" />
                    <div className="flex flex-col gap-1">
                      <Skeleton width={120} height={16} />
                      <Skeleton width={60} height={10} />
                    </div>
                  </div>
                  <Skeleton width={60} height={22} borderRadius={999} />
                </div>
                <div className="flex justify-between border-t border-white/5 pt-4">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton width="40%" height={10} />
                    <Skeleton width="60%" height={14} />
                  </div>
                  <div className="text-right space-y-1.5 flex-1">
                    <Skeleton width="30%" height={10} className="ml-auto" />
                    <Skeleton width="50%" height={20} className="ml-auto" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonTheme>
  );
}
