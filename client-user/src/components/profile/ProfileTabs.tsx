"use client";
import PostsTab from "./PostsTab";
import { useTheme } from "@/components/home/ThemeContext";

interface ProfileTabsProps {
  userId:         string;
  isMobile:       boolean;
  isOwnProfile?:  boolean;
  currentUserId?: string;           // ← ADD
  activeTab:      "posts" | "reels" | "feed" | "tags";
  setActiveTab:   (tab: "posts" | "reels" | "feed" | "tags") => void;
}

type TabType = "posts" | "reels" | "feed" | "tags";

export default function ProfileTabs({
  userId,
  isMobile,
  isOwnProfile  = true,
  currentUserId,                    // ← ADD
  activeTab,
  setActiveTab,
}: ProfileTabsProps) {
  const { themeStyles } = useTheme();

  const tabs: { id: TabType; label: string }[] = [
    { id: "posts", label: "Posts" },
    { id: "reels", label: "Reels" },
    { id: "feed",  label: "Feed"  },
    { id: "tags",  label: "Tags"  },
  ];

  return (
    <div className="w-full">
      <div className="flex justify-center mb-4 sm:mb-6 md:mb-8 lg:mb-10 w-full px-2 sm:px-4 md:px-0">
        <div
          className="flex items-center justify-between rounded-xl p-[3px] w-full max-w-[280px] sm:max-w-[340px] md:max-w-[480px] lg:max-w-[580px] h-9 sm:h-10 md:h-11 lg:h-12"
          style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex items-center justify-center text-[10px] sm:text-[11px] md:text-[13px] lg:text-[14px] font-medium transition-all flex-1 h-[30px] sm:h-[34px] md:h-[38px] lg:h-[42px] rounded-xl hover:opacity-80"
              style={{ color: themeStyles.text }}
            >
              {activeTab === tab.id && (
                <div
                  className="absolute inset-0 rounded-xl p-[0.5px]"
                  style={{
                    background:
                      "linear-gradient(270deg,rgba(32,32,32,0.5) -122.45%,rgba(96,96,96,0.5) 100%)",
                  }}
                >
                  <div
                    className="w-full h-full rounded-[11.5px]"
                    style={{ background: themeStyles.pillBg }}
                  />
                </div>
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full min-h-[400px]">
        {activeTab === "posts" && (
          <PostsTab
            userId={userId}
            isMobile={isMobile}
            isOwnProfile={isOwnProfile}
            currentUserId={currentUserId}   // ← ADD
          />
        )}
        {activeTab === "reels" && (
          <PostsTab
            userId={userId}
            isMobile={isMobile}
            isReels
            isOwnProfile={isOwnProfile}
            currentUserId={currentUserId}   // ← ADD
          />
        )}
        {activeTab === "feed" && (
          <div className="text-center py-20" style={{ color: themeStyles.textSecondary }}>
            Feed coming soon…
          </div>
        )}
        {activeTab === "tags" && (
          <div className="text-center py-20" style={{ color: themeStyles.textSecondary }}>
            Tags coming soon…
          </div>
        )}
      </div>
    </div>
  );
}
