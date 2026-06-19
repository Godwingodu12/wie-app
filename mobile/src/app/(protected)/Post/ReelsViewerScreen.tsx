import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, FlatList, Dimensions, ActivityIndicator, StatusBar, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { mediaService } from '@/services/mediaService';
import { ReelPlayer } from '@/components/Reel/ReelPlayer';
import { reelsState } from '@/store/reelsState';

export default function ReelsViewerScreen() {
  const { height } = useWindowDimensions();
  const { reelId } = useLocalSearchParams();
  const [reels, setReels] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchReels = async () => {
      try {
        let feed = reelsState.feed;
        if (feed.length === 0) {
          feed = await mediaService.getReelsFeed(1, 30);
          reelsState.feed = feed;
        }
        setReels(feed);
        
        if (reelId) {
          const index = feed.findIndex((r: any) => String(r._id || r.id) === String(reelId));
          if (index !== -1) {
            setActiveIndex(index);
            reelsState.activeIndex = index;
          }
        } else if (reelsState.activeIndex > 0) {
          setActiveIndex(reelsState.activeIndex);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, [reelId]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setActiveIndex(newIndex);
      reelsState.activeIndex = newIndex;
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = useCallback(({ item, index }: { item: any, index: number }) => (
    <ReelPlayer reel={item} isActive={index === activeIndex} />
  ), [activeIndex]);

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <Stack.Screen options={{ animation: 'slide_from_right', headerShown: false, gestureEnabled: true, gestureDirection: 'horizontal' }} />
        <ActivityIndicator color="white" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ 
        animation: 'slide_from_right', 
        headerShown: false, 
        gestureEnabled: true, 
        gestureDirection: 'horizontal',
        gestureResponseDistance: 30
      }} />
      <StatusBar barStyle="light-content" hidden={false} translucent backgroundColor="transparent" />
      <FlatList
        ref={flatListRef}
        data={reels}
        keyExtractor={(item) => String(item._id || item.id)}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialScrollIndex={activeIndex}
        getItemLayout={(data, index) => ({ length: height, offset: height * index, index })}
        windowSize={3}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        removeClippedSubviews={true}
      />
    </View>
  );
}
