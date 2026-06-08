import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export type TabType = 'Post' | 'Reels' | 'Feeds' | 'Tags';
const TABS: TabType[] = ['Post', 'Reels', 'Feeds', 'Tags'];

interface Props {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  availableTabs?: TabType[]; // Optional: only show tabs that have content
}

export const TabSwitcher = ({ activeTab, onTabChange, availableTabs }: Props) => {
  const tabsToShow = availableTabs && availableTabs.length > 0 ? availableTabs : TABS;
  
  return (
    <View className="px-4 py-2">
      <View className="flex-row bg-[#121212] p-1 rounded-2xl">
        {tabsToShow.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => onTabChange(tab)}
            className={`flex-1 py-3 rounded-xl ${activeTab === tab ? 'bg-[#1C1C1E]' : ''}`}
          >
            <Text className={`text-center font-semibold ${activeTab === tab ? 'text-white' : 'text-zinc-500'}`}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
