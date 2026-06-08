import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Dimensions, FlatList, ViewToken, Animated, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { getMediaSource } from '@/utils/imageUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type MediaRatio = '1:1' | '4:5' | '9:16' | '16:9';

interface MediaItem {
    url: string;
    type: 'image' | 'video' | string;
}

interface PostMediaProps {
    items: MediaItem[];
    ratio: MediaRatio;
    onDoubleTap?: () => void;
}

const RATIOS = { '1:1': 1, '4:5': 0.8, '9:16': 0.5625, '16:9': 1.77 };

const VideoPlayerItem = React.memo(({ url, isMuted, containerHeight }: { url: string, isMuted: boolean, containerHeight: number }) => {
    const player = useVideoPlayer(url, (player) => {
        player.loop = true;
        player.muted = isMuted;
        player.play();
    });

    // Update mute state when it changes
    React.useEffect(() => {
        player.muted = isMuted;
    }, [isMuted]);

    return (
        <VideoView
            player={player}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            nativeControls={false}
            allowsPictureInPicture={false}
        />
    );
});

const PostMedia: React.FC<PostMediaProps> = ({ items, ratio, onDoubleTap }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [lastTap, setLastTap] = useState(0);
    const [loadErrors, setLoadErrors] = useState<Record<number, boolean>>({});
    const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});

    const heartScale = useRef(new Animated.Value(0)).current;
    const containerHeight = SCREEN_WIDTH / RATIOS[ratio];

    const animateHeart = useCallback(() => {
        Animated.sequence([
            Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 3 }),
            Animated.delay(500),
            Animated.timing(heartScale, { toValue: 0, duration: 100, useNativeDriver: true }),
        ]).start();
    }, [heartScale]);

    const handleDoubleTap = useCallback(() => {
        const now = Date.now();
        const DOUBLE_PRESS_DELAY = 300;
        if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
            animateHeart();
            onDoubleTap?.();
        } else {
            setLastTap(now);
        }
    }, [lastTap, animateHeart, onDoubleTap]);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) setCurrentIndex(viewableItems[0].index ?? 0);
    }).current;

    const renderItem = useCallback(({ item, index }: { item: any, index: number }) => {
        // Handle various possible URL fields from different backend versions/mappings
        const mediaUrl = item.url || item.mediaUrl || item.fluxMediaUrl || (typeof item === 'string' ? item : null);
        const source = getMediaSource(mediaUrl);

        // Log for debugging if we're in development
        if (__DEV__ && (!mediaUrl || !source)) {
            console.warn(`[PostMedia] Missing URL for item ${index}:`, item);
        }

        return (
            <TouchableOpacity
                activeOpacity={1}
                onPress={handleDoubleTap}
                style={{ width: SCREEN_WIDTH, height: containerHeight }}
                className="bg-neutral-900 justify-center items-center overflow-hidden"
            >
                {item.type === 'video' || item.mediaType === 'video' ? (
                    <View className="flex-1 w-full">
                        <VideoPlayerItem url={typeof source === 'object' ? source.uri : source} isMuted={isMuted} containerHeight={containerHeight} />
                        <TouchableOpacity
                            onPress={() => setIsMuted(!isMuted)}
                            className="absolute bottom-3 right-3 bg-black/60 w-8 h-8 rounded-full items-center justify-center"
                        >
                            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="w-full h-full justify-center items-center">
                        {loadingStates[index] && !loadErrors[index] && (
                            <View className="absolute z-10">
                                <ActivityIndicator color="#3b82f6" />
                            </View>
                        )}

                        {loadErrors[index] || !source ? (
                            <View className="items-center justify-center">
                                <Ionicons name="image-outline" size={48} color="#4B5563" />
                                <Text className="text-gray-500 mt-2 font-rubik text-xs">Content unavailable</Text>
                            </View>
                        ) : (
                            <Image
                                source={source}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                                transition={300}
                                onLoadStart={() => setLoadingStates(prev => ({ ...prev, [index]: true }))}
                                onLoadEnd={() => setLoadingStates(prev => ({ ...prev, [index]: false }))}
                                onError={() => {
                                    if (__DEV__) {
                                        console.error(`[PostMedia] Failed to load image: ${mediaUrl}`);
                                    }
                                    setLoadErrors(prev => ({ ...prev, [index]: true }));
                                    setLoadingStates(prev => ({ ...prev, [index]: false }));
                                }}
                            />
                        )}
                    </View>
                )}


                <Animated.View
                    style={{ transform: [{ scale: heartScale }], position: 'absolute' }}
                    className="z-50"
                >
                    <Ionicons name="heart" size={80} color="#2979FF" />
                </Animated.View>
            </TouchableOpacity>
        );
    }, [isMuted, loadingStates, loadErrors, containerHeight, handleDoubleTap]);
    return (
        <View className="w-full bg-black">
            <View style={{ height: containerHeight }}>
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                    keyExtractor={(_, index) => index.toString()}
                />

                {items.length > 1 && (
                    <View className="absolute top-3 right-3 bg-black/70 px-2.5 py-1 rounded-full z-10">
                        <Text className="text-white text-[11px] font-bold">
                            {currentIndex + 1}/{items.length}
                        </Text>
                    </View>
                )}
            </View>

            {items.length > 1 && (
                <View className="flex-row justify-center items-center space-x-1.5 mt-2 gap-1">
                    {items.map((_, i) => (
                        <View
                            key={i}
                            style={{ width: i === currentIndex ? 6 : 4, height: i === currentIndex ? 6 : 4 }}
                            className={`rounded-full ${i === currentIndex ? 'bg-blue-500' : 'bg-gray-500'}`}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

export default PostMedia;
