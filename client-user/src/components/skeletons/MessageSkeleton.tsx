"use client";

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useTheme } from "@/components/home/ThemeContext";

export default function MessageSkeleton() {
  const { isDark, themeStyles } = useTheme();

  return (
    <SkeletonTheme
      baseColor={isDark ? "#1e1e1e" : "#e0e0e0"}
      highlightColor={isDark ? "#2e2e2e" : "#f0f0f0"}
    >
      <div className="h-full flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <Skeleton width="30%" height={24} className="min-w-[100px]" />
            <Skeleton width={32} height={32} circle className="flex-shrink-0" />
          </div>
          <Skeleton height={40} borderRadius={12} />
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-hidden p-4 space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton circle width={48} height={48} />
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <Skeleton width="40%" height={14} className="min-w-[80px]" />
                  <Skeleton width="15%" height={10} className="min-w-[40px]" />
                </div>
                <Skeleton width="80%" height={12} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonTheme>
  );
}
