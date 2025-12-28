"use client";

import PostsTab from "./PostsTab";

interface ProfileTabsProps {
  userId: string;
  isMobile: boolean;
  isOwnProfile?: boolean;
  activeTab: 'posts' | 'reels' | 'feed' | 'tags';
  setActiveTab: (tab: 'posts' | 'reels' | 'feed' | 'tags') => void;
}

type TabType = 'posts' | 'reels' | 'feed' | 'tags';

export default function ProfileTabs({ 
  userId, 
  isMobile, 
  isOwnProfile = true,
  activeTab,
  setActiveTab
}: ProfileTabsProps) {
  const tabs = [
    { id: 'posts' as TabType, label: 'Posts' },
    { id: 'reels' as TabType, label: 'Reels' },
    { id: 'feed' as TabType, label: 'Feed' },
    { id: 'tags' as TabType, label: 'Tags' },
  ];

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex justify-center mb-8 md:mb-10 w-full px-0">
        <div
          className="flex items-center justify-between bg-[#38383833] rounded-[12px] p-[3px] w-full max-w-[580px]"
          style={{ height: '48px' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex items-center justify-center text-[13px] md:text-[14px] font-medium transition-all text-white flex-1 hover:text-white/80"
              style={{
                height: '42px',
                borderRadius: '12px',
              }}
            >
              {activeTab === tab.id && (
                <div
                  className="absolute inset-0 rounded-[12px] p-[0.5px]"
                  style={{
                    background: 'linear-gradient(270deg, rgba(32, 32, 32, 0.5) -122.45%, rgba(96, 96, 96, 0.5) 100%)'
                  }}
                >
                  <div
                    className="w-full h-full rounded-[11.5px]"
                    style={{
                      background: 'linear-gradient(270deg, rgba(32, 32, 32, 0.2) -8.43%, rgba(96, 96, 96, 0.2) 100%)'
                    }}
                  />
                </div>
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="w-full min-h-[400px]">
        {activeTab === 'posts' && (
          <PostsTab userId={userId} isMobile={isMobile} />
        )}
        {activeTab === 'reels' && (
          <PostsTab userId={userId} isMobile={isMobile} isReels />
        )}
        {activeTab === 'feed' && (
          <div className="text-center py-20 text-gray-400">Feed coming soon...</div>
        )}
        {activeTab === 'tags' && (
          <div className="text-center py-20 text-gray-400">Tags coming soon...</div>
        )}
      </div>
    </div>
  );
}