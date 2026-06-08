import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface FollowTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOwnProfile: boolean;
}

export const FollowTabs = ({ activeTab, onTabChange, isOwnProfile }: FollowTabsProps) => {
  // Define the logic for which tabs appear
  const TABS = isOwnProfile 
    ? ['Followers', 'Following', 'Requested', 'Received'] 
    : ['Followers', 'Following', 'Mutual'];

  return (
    <View className="border-b border-zinc-800 bg-black">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity 
              key={tab} 
              onPress={() => onTabChange(tab)}
              className="px-4 py-4"
            >
              <Text className={`font-rubik-medium text-base ${isActive ? 'text-white' : 'text-gray-500'}`}>
                {tab}
              </Text>
              {isActive && <View className="absolute bottom-0 left-4 right-4 h-[2px] bg-white rounded-full" />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
