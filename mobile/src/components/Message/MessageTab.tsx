import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MotiView } from 'moti';

interface MessageTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MessageTabs = ({ activeTab, onTabChange }: MessageTabsProps) => {
  const TABS = ['All', 'Personal', 'Groups', 'Requests'];

  return (
    <View className="bg-black py-3">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => onTabChange(tab)}
              activeOpacity={0.9}
            >
              <MotiView
                animate={{
                  // Change: Active background is now White, Inactive is Zinc-900
                  backgroundColor: isActive ? '#FFFFFF' : '#18181b',
                  scale: isActive ? 1.02 : 1,
                }}
                transition={{ type: 'timing', duration: 200 }}
                className="px-6 py-2.5 rounded-full border border-zinc-800"
              >
                <Text 
                  className="text-sm font-rubik-medium tracking-wide"
                  style={{ 
                    // Change: Active text is now Black, Inactive is Zinc-400
                    color: isActive ? '#000000' : '#71717a' 
                  }}
                >
                  {tab}
                </Text>
              </MotiView>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
