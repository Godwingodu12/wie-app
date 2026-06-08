import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar, 
  Dimensions, 
  StyleSheet
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  interpolate, 
  Extrapolate,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { GradientButton } from '@/components/Connection/UI/Buttons';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

// 65% Width for the "Peek" Effect
const ITEM_WIDTH = WINDOW_WIDTH * 0.65; 
const SPACER = (WINDOW_WIDTH - ITEM_WIDTH) / 2;

const STAGES_DATA = [
  { id: '1', label: 'Stage 1', color: '#D1D5DB', textColor: '#000', title: 'Depression Stage', desc: "It's okay to take time to heal", image: require('@/assets/images/connection/depression.png') },
  { id: '2', label: 'Stage 2', color: '#FCD34D', textColor: '#000', title: 'Neutral Stage', desc: "Moving forward at your own pace", image: require('@/assets/images/connection/neutral.png') },
  { id: '3', label: 'Stage 3', color: '#A3E635', textColor: '#000', title: 'Move on', desc: "Ready for new beginnings", image: require('@/assets/images/connection/move_on.png') },
];

// --- 1. FIXED SLIDE BUTTON ---
const SlideStageButton = ({ currentIndex, stages, onSlideNext, onSlidePrev }: any) => {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const sliderWidth = WINDOW_WIDTH - 40; 
  const thumbWidth = 140; 
  const nubWidth = 6;     
  const gap = 8;          
  const totalThumbWidth = thumbWidth + gap + nubWidth; 
  const maxTrack = sliderWidth - totalThumbWidth - 4;

  useEffect(() => {
    let target = 0;
    if (currentIndex === 0) target = 0;
    else if (currentIndex >= stages.length - 1) target = maxTrack;
    else target = maxTrack / 2;

    translateX.value = withSpring(target, { damping: 20, stiffness: 150 });
  }, [currentIndex]);

  const panGesture = Gesture.Pan()
    .onStart(() => { startX.value = translateX.value; })
    .onUpdate((event) => {
      let nextPos = startX.value + event.translationX;
      if (nextPos < 0) nextPos = 0;
      if (nextPos > maxTrack) nextPos = maxTrack;
      translateX.value = nextPos;
    })
    .onEnd((event) => {
      const threshold = 40;
      if (event.translationX > threshold && currentIndex < stages.length - 1) {
        runOnJS(onSlideNext)();
      } else if (event.translationX < -threshold && currentIndex > 0) {
        runOnJS(onSlidePrev)();
      } else {
        let target = currentIndex === 0 ? 0 : (currentIndex >= stages.length - 1 ? maxTrack : maxTrack / 2);
        translateX.value = withSpring(target);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const currentStage = stages[currentIndex];

  return (
    <View 
      className="h-[64px] bg-[#1C1C1E] rounded-xl mx-5 mb-8 justify-center relative overflow-hidden border border-[#2a2a2a]"
    >
      {/* 🔥 STATIC BACKGROUND TEXT (Fixed, Small, Centered in Track) */}
      <View 
        style={[
          StyleSheet.absoluteFill, 
          { 
            zIndex: 0, 
            alignItems: 'flex-end', // Aligns text to the right side
            justifyContent: 'center', 
            paddingRight: 24 
          }
        ]}
      >
         <Text className="text-[#444] text-[11px] font-medium tracking-wide">
           Slide to change the stages
         </Text>
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View 
          style={[
            animatedStyle, 
            { 
              width: totalThumbWidth, 
              height: 54, 
              marginLeft: 4,
              flexDirection: 'row', 
              alignItems: 'center',
              zIndex: 10 // Ensures button slides ON TOP of text
            }
          ]}
        >
          {/* Colored Card */}
          <View 
            style={{ 
              width: thumbWidth, 
              height: '100%', 
              backgroundColor: currentStage.color, 
              borderRadius: 12,
              alignItems: 'center', 
              justifyContent: 'center'
            }}
          >
            <Text style={{ color: currentStage.textColor, fontWeight: '600', fontSize: 15 }}>
              {currentStage.label}
            </Text>
          </View>

          {/* White Curved Nub */}
          <View 
            style={{
              width: nubWidth,
              height: 24, 
              backgroundColor: 'white',
              borderRadius: 10, 
              marginLeft: gap, 
            }} 
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// --- 2. STAGE ITEM ---
const StageItem = ({ item, index, scrollX, currentIndex }: any) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH,
    ];

    const scale = interpolate(scrollX.value, inputRange, [0.8, 1, 0.8], Extrapolate.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.6, 1, 0.6], Extrapolate.CLAMP);

    return { opacity, transform: [{ scale }] };
  });

  const isActive = index === currentIndex;

  return (
    <View style={{ width: ITEM_WIDTH, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.Image 
        source={item.image}
        style={[{ width: '100%', height: 260, resizeMode: 'contain' }, animatedStyle]}
        blurRadius={isActive ? 0 : 10} 
      />
      <View style={{ opacity: isActive ? 1 : 0, marginTop: 40, alignItems: 'center' }}>
        <Text className="text-white text-[24px] font-bold text-center">{item.title}</Text>
        <Text className="text-[#71717a] text-[15px] text-center mt-2 px-6">{item.desc}</Text>
      </View>
    </View>
  );
};

// --- 3. MAIN SCREEN ---
export default function RelationshipStageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<Animated.FlatList<any>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const updateIndex = (offset: number) => {
    const newIndex = Math.round(offset / ITEM_WIDTH);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      runOnJS(updateIndex)(event.contentOffset.x);
    },
  });

  const handleNext = () => {
    if (currentIndex < STAGES_DATA.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToOffset({ offset: nextIndex * ITEM_WIDTH, animated: true });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      flatListRef.current?.scrollToOffset({ offset: prevIndex * ITEM_WIDTH, animated: true });
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#09090b' }}>
      <View className="flex-1" style={{ paddingTop: insets.top }}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />
        
        {/* Header */}
        <View className="flex-row items-center h-[60px] px-5 mb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1 h-1 bg-[#1c1c1e] mx-4 rounded-full">
            <View className="h-full bg-white w-[28%] rounded-full" />
          </View>
          <Text className="text-[#a8a29e] text-[13px] font-semibold">02/07</Text>
        </View>

        <View className="flex-1">
          <Text className="text-white text-[28px] font-bold px-5 mt-2 mb-8 leading-tight">
            Which stage are you{"\n"}in now?
          </Text>

          {/* SLIDE BUTTON */}
          <SlideStageButton 
            currentIndex={currentIndex}
            stages={STAGES_DATA}
            onSlideNext={handleNext}
            onSlidePrev={handlePrev}
          />

          <View className="flex-1 justify-center">
            <Animated.FlatList
              ref={flatListRef}
              data={STAGES_DATA}
              horizontal
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              snapToInterval={ITEM_WIDTH} 
              snapToAlignment="start"
              decelerationRate="fast"
              bounces={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              contentContainerStyle={{ 
                paddingHorizontal: SPACER,
                alignItems: 'center' 
              }}
              renderItem={({ item, index }) => (
                <StageItem 
                  item={item} 
                  index={index} 
                  scrollX={scrollX} 
                  currentIndex={currentIndex} 
                />
              )}
            />
          </View>
        </View>

        <View className="px-5 mb-10">
          <GradientButton title="Next" onPress={() => router.push('/(protected)/(connection)/BusinessStageScreen')} />
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
