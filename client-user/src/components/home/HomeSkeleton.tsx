"use client";

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useTheme } from "@/components/home/ThemeContext";

export default function HomeSkeleton() {
  const { isDark } = useTheme();

  return (
    <SkeletonTheme
      baseColor={isDark ? "#1e1e1e" : "#e0e0e0"}
      highlightColor={isDark ? "#2e2e2e" : "#f0f0f0"}
    >
      <div className="flex flex-col gap-8 w-full max-w-[700px] px-4 md:px-0 animate-fadeIn">

        {/* Stories skeleton */}
        <div className="flex gap-4 overflow-hidden py-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0" style={{ width: 72 }}>
              <Skeleton width={70} height={100} borderRadius={12} />
              <Skeleton width={50} height={10} />
            </div>
          ))}
        </div>

        {/* Event categories skeleton */}
        <div className="flex gap-3 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} width={90} height={34} borderRadius={25} />
          ))}
        </div>

        {/* Post skeletons */}
        {[1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-3 w-full" style={{ animationDelay: `${i * 80}ms` }}>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton circle width={38} height={38} />
                <div className="flex flex-col gap-1">
                  <Skeleton width={120} height={13} />
                  <Skeleton width={80} height={11} />
                </div>
              </div>
              <Skeleton width={60} height={26} borderRadius={25} />
            </div>

            {/* Post image */}
            <Skeleton width="100%" height={340} borderRadius={24} />

            {/* Action pill */}
            <div className="flex items-center justify-between">
              <Skeleton width={180} height={44} borderRadius={999} />
              <Skeleton circle width={40} height={40} />
            </div>

            {/* Description */}
            <Skeleton width="90%" height={12} />
            <Skeleton width="60%" height={12} />
          </div>
        ))}
      </div>
    </SkeletonTheme>
  );
}