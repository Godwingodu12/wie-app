import React, { useEffect, useRef } from 'react';
import { Text, TouchableOpacity, FlatList, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export const TabSection = ({ 
  tabs, 
  activeTab, 
  onTabPress 
}: { 
  tabs: string[], 
  activeTab: string, 
  onTabPress: (t: string) => void 
}) => {
  // 1. Create a reference for the FlatList
  const flatListRef = useRef<FlatList>(null);

  // 2. Automatically scroll to the active tab when it changes
  useEffect(() => {
    const index = tabs.indexOf(activeTab);
    if (index !== -1) {
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5, // Centers the active tab in the list
      });
    }
  }, [activeTab]);

  return (
    <FlatList
      ref={flatListRef}
      horizontal
      data={tabs}
      keyExtractor={(item) => item}
      showsHorizontalScrollIndicator={false}
      // Added initialScrollIndex and onScrollToIndexFailed to prevent crashes
      onScrollToIndexFailed={(info) => {
        flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
      }}
      contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 4 }}
      renderItem={({ item }) => {
        const isActive = activeTab === item;

        return (
          <TouchableOpacity
            onPress={() => onTabPress(item)}
            activeOpacity={0.8}
            className="mr-3"
          >
            {isActive ? (
              /* ACTIVE TAB: White Shade Gradient */
              <View className="rounded-2xl border-[0.5px] border-[#616060] overflow-hidden"> 
                <LinearGradient
                  // Changed colors to White/Off-White shades
                  colors={['#FFFFFF', '#F5F5F5', '#E0E0E0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.5, y: 0.5 }}
                  className="px-8 py-3"
                >
                  {/* Changed text color to black so it is visible on white */}
                  <Text className="font-rubik-bold text-black text-center">
                    {item}
                  </Text>
                </LinearGradient>
              </View>
            ) : (
              /* INACTIVE TAB: 30% Opacity 3-Stop Gradient */
              <View className="rounded-2xl border-[0.5px] border-[#616060]/30 overflow-hidden">
                <LinearGradient
                  colors={[
                      'rgba(55, 55, 55, 0.3)', 
                      'rgba(38, 38, 38, 0.3)', 
                      'rgba(28, 28, 28, 0.3)'
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.5, y: 0.5 }}
                  className="px-8 py-3"
                >
                  <Text className="font-rubik-bold text-gray-500 text-center">
                    {item}
                  </Text>
                </LinearGradient>
              </View>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
};
