"use client";

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useTheme } from "@/components/home/ThemeContext";

export default function NotificationSkeleton() {
  const { isDark, themeStyles } = useTheme();

  return (
    <SkeletonTheme
      baseColor={isDark ? "#1e1e1e" : "#e0e0e0"}
      highlightColor={isDark ? "#2e2e2e" : "#f0f0f0"}
    >
      <div className="flex flex-col space-y-2 animate-fadeIn">
        {/* Skeleton items matching NotificationItem structure */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{ borderBottom: `1px solid ${themeStyles.border}` }}
          >
            {/* Avatar or Event Banner Placeholder */}
            <div className="flex-shrink-0">
              <Skeleton circle={i % 2 === 0} width={48} height={48} />
            </div>

            {/* Content area */}
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              {/* Message line 1 */}
              <Skeleton width="90%" height={14} className="min-w-[150px]" />
              {/* Message line 2 (shorter) or time */}
              <Skeleton width="40%" height={12} className="min-w-[80px]" />
            </div>

            {/* Optional action placeholder (e.g. for follow button) */}
            {i % 3 === 0 && (
              <div className="flex-shrink-0">
                <Skeleton width={70} height={32} borderRadius={100} />
              </div>
            )}
          </div>
        ))}
      </div>
    </SkeletonTheme>
  );
}
