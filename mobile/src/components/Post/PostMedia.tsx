import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, FlatList, ViewToken, Animated, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import GradientHeartIcon from '../UI/GradientHeartIcon';
import { getMediaSource } from '@/utils/imageUtils';

export type MediaRatio = '1:1' | '4:5' | '9:16' | '16:9' | '4:3';

interface MediaItem {
    url: string;
    type: 'image' | 'video' | string;
}

interface PostMediaProps {
    items: MediaItem[];
    ratio?: string | number | null;
    onDoubleTap?: () => void;
    musicPreviewUrl?: string;
    isActive?: boolean;
    isReelPost?: boolean;
}

const RATIOS = { 
    '1:1': 1, 
    '4:5': 0.8, 
    '9:16': 9/16, 
    '16:9': 363/196, 
    '4:3': 4/3 
};

const VideoPlayerItem = React.memo(({ url, isMuted, containerHeight, isReel }: { url: string, isMuted: boolean, containerHeight: number, isReel: boolean }) => {
    const player = useVideoPlayer(url, (player) => {
        player.loop = true;
        player.muted = isMuted;
        player.play();
    });

    React.useEffect(() => {
        player.muted = isMuted;
    }, [isMuted]);

    return (
        <VideoView
            player={player}
            style={{ width: '100%', height: '100%' }}
            contentFit={isReel ? "cover" : "contain"}
            nativeControls={false}
            allowsPictureInPicture={false}
        />
    );
});

const PostMedia: React.FC<PostMediaProps> = React.memo((props) => {
    const { items, ratio, onDoubleTap, musicPreviewUrl, isActive = true, isReelPost = false } = props;
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const POST_WIDTH = SCREEN_WIDTH - 12;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [lastTap, setLastTap] = useState(0);
    const [loadErrors, setLoadErrors] = useState<Record<number, boolean>>({});
    const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});
    
    const soundRef = useRef<Audio.Sound | null>(null);
    const heartScale = useRef(new Animated.Value(0)).current;

    // Background music handling for image posts
    useEffect(() => {
        let isCancelled = false;
        
        const setupAudio = async () => {
            if (!musicPreviewUrl || !isActive) {
                if (soundRef.current) {
                    await soundRef.current.unloadAsync().catch(() => {});
                    soundRef.current = null;
                }
                return;
            }

            try {
                if (soundRef.current) {
                    await soundRef.current.unloadAsync().catch(() => {});
                }

                try {
                    const { sound } = await Audio.Sound.createAsync(
                        { uri: musicPreviewUrl },
                        { shouldPlay: true, isMuted: isMuted, isLooping: true }
                    );

                    if (!isCancelled) {
                        soundRef.current = sound;
                    } else {
                        await sound.unloadAsync().catch(() => {});
                    }
                } catch (audioError: any) {
                    // Suppress AudioFocusNotAcquiredException which happens if OS denies audio control        
                    console.warn("Audio playback issue (focus denied by OS):", audioError.message);
                }
            } catch (error) {
                console.log("Error playing background music:", error);
            }
        };

        setupAudio();

        return () => {
            isCancelled = true;
            if (soundRef.current) {
                soundRef.current.unloadAsync();
                soundRef.current = null;
            }
        };
    }, [musicPreviewUrl, isActive]);

    // Handle mute state changes for background music
    useEffect(() => {
        if (soundRef.current) {
            soundRef.current.setIsMutedAsync(isMuted);
        }
    }, [isMuted]);

    // Exact mapping for ratios
    const ratioMap = RATIOS;
    
    let isMissingRatio = false;
    let currentRatio = RATIOS['1:1']; // baseline
    const normalizedRatio = String(ratio).trim();
    
    if (ratioMap[normalizedRatio as keyof typeof ratioMap]) {
        currentRatio = ratioMap[normalizedRatio as keyof typeof ratioMap];
    } else {
        const numericRatio = parseFloat(normalizedRatio);
        if (!isNaN(numericRatio) && numericRatio > 0) {
            currentRatio = numericRatio;
        } else {
            // Missing or invalid ratio (e.g. web upload without selected ratio)
            currentRatio = RATIOS['4:5'];
            isMissingRatio = true;
        }
    }
    
    // STRICT SEPARATION: Reels vs Normal Posts
    // Reel posts get their own fixed styling (center-cropped to 4:5 in the feed)
    // Normal posts retain their exact ratio and original layout without clamping.
    if (isReelPost) {
        currentRatio = RATIOS['4:5'];
    }

    const containerHeight = POST_WIDTH / currentRatio;
    const imageContentFit = (isReelPost || isMissingRatio) ? "cover" : "contain";

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

    const renderItemContent = (item: any, index: number) => {
        const mediaUrl = item.url || item.mediaUrl || item.fluxMediaUrl || (typeof item === 'string' ? item : null);
        const source = getMediaSource(mediaUrl);

        if (item.type === 'video' || item.mediaType === 'video') {
            return (
                <View className="flex-1 w-full justify-center bg-black">
                    <VideoPlayerItem url={typeof source === 'object' ? source.uri : source} isMuted={isMuted} containerHeight={containerHeight} isReel={isReelPost} />
                    <TouchableOpacity
                        onPress={() => setIsMuted(!isMuted)}
                        className="absolute bottom-3 right-3 bg-black/60 w-8 h-8 rounded-full items-center justify-center z-10"
                    >
                        <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={16} color="white" />
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View className="flex-1 w-full justify-center items-center bg-black">
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
                        contentFit={imageContentFit}
                        transition={300}
                        onLoadStart={() => setLoadingStates(prev => ({ ...prev, [index]: true }))}
                        onLoadEnd={() => setLoadingStates(prev => ({ ...prev, [index]: false }))}
                        onError={() => {
                            setLoadErrors(prev => ({ ...prev, [index]: true }));
                            setLoadingStates(prev => ({ ...prev, [index]: false }));
                        }}
                    />
                )}
            </View>
        );
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        return (
            <TouchableOpacity
                activeOpacity={1}
                onPress={handleDoubleTap}
                style={{ width: POST_WIDTH, height: containerHeight, borderRadius: 24 }}
                className="bg-neutral-900 justify-center items-center overflow-hidden"
            >
                {renderItemContent(item, index)}

                <Animated.View
                    style={{ transform: [{ scale: heartScale }], position: 'absolute' }}
                    className="z-50"
                >
                    <GradientHeartIcon size={100} focused={true} />
                </Animated.View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="w-full bg-black items-center">
            <View style={{ height: containerHeight, width: POST_WIDTH }}>
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    horizontal
                    pagingEnabled
                    scrollEnabled={items?.length > 1}
                    showsHorizontalScrollIndicator={false}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                    keyExtractor={(_, index) => index.toString()}
                />

                <View className="absolute top-3 right-3 flex-row items-center gap-2 z-20">
                    {musicPreviewUrl && items[0]?.type !== 'video' && (
                        <TouchableOpacity
                            onPress={() => setIsMuted(!isMuted)}
                            className="bg-black/60 w-8 h-8 rounded-full items-center justify-center"
                        >
                            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={16} color="white" />
                        </TouchableOpacity>
                    )}

                    {items.length > 1 && (
                        <View className="bg-black/70 px-2.5 py-1 rounded-full">
                            <Text className="text-white text-[11px] font-bold">
                                {currentIndex + 1}/{items.length}
                            </Text>
                        </View>
                    )}
                </View>
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
});

export default PostMedia;