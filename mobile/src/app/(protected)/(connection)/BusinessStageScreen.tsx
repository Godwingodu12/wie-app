import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar, 
  Dimensions, 
  StyleSheet,
  Image
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
import { LinearGradient } from 'expo-linear-gradient';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

// --- METRICS ---
// 55% Width for the "Close Up" effect (Same as Development Stage)
const ITEM_WIDTH = WINDOW_WIDTH * 0.55; 
const SPACER = (WINDOW_WIDTH - ITEM_WIDTH) / 2;

// --- DATA (4 Stages) ---
const BUSINESS_STAGES = [
  { 
    id: '1', 
    label: 'Idea Stage', 
    color: '#EAB308', // Yellow
    textColor: '#000', 
    title: 'Idea Stage', 
    desc: "Just starting, concept phase", 
    image: require('@/assets/images/connection/idea_bulb.png') 
  },
  { 
    id: '2', 
    label: 'Early stage', 
    color: '#C084FC', // Purple
    textColor: '#000', 
    title: 'Early stage', 
    desc: "MVP built, initial traction", 
    image: require('@/assets/images/connection/early_checklist.png') 
  },
  { 
    id: '3', 
    label: 'Growth stage', 
    color: '#1E3A8A', // Blue
    textColor: '#FFF', 
    title: 'Growth stage', 
    desc: "Scaling, proven model", 
    image: require('@/assets/images/connection/growth_rocket.png') 
  },
  { 
    id: '4', 
    label: 'Established', 
    color: '#6366F1', // Indigo
    textColor: '#FFF', 
    title: 'Established', 
    desc: "Market leader, expansion", 
    image: require('@/assets/images/connection/established_target.png') 
  },
];

// --- 1. SLIDE BUTTON COMPONENT ---
const SlideStageButton = ({ currentIndex, stages, onSlideNext, onSlidePrev }: any) => {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const sliderWidth = WINDOW_WIDTH - 40; 
  const thumbWidth = 140; 
  const nubWidth = 6;     
  const gap = 8;          
  const totalThumbWidth = thumbWidth + gap + nubWidth; 
  const maxTrack = sliderWidth - totalThumbWidth - 4;

  // Calculate target position based on 4 items
  const getTargetPosition = (index: number) => {
    'worklet';
    if (index === 0) return 0;
    if (index >= stages.length - 1) return maxTrack;
    return (maxTrack / (stages.length - 1)) * index;
  };

  useEffect(() => {
    translateX.value = withSpring(getTargetPosition(currentIndex), { 
        damping: 20, 
        stiffness: 150 
    });
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
        translateX.value = withSpring(getTargetPosition(currentIndex));
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const activeColor = stages[currentIndex]?.color || '#EAB308';

  return (
    <View className="h-[64px] bg-[#1C1C1E] rounded-xl mx-5 mb-8 justify-center relative overflow-hidden border border-[#2a2a2a]">
      {/* Background Text */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 0, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 24 }]}>
         <Text className="text-[#444] text-[11px] font-medium tracking-wide">
           Slide to change stage
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
              zIndex: 10 
            }
          ]}
        >
          {/* Colored Card */}
          <View 
            style={{ 
              width: thumbWidth, 
              height: '100%', 
              backgroundColor: activeColor, 
              borderRadius: 12,
              alignItems: 'center', 
              justifyContent: 'center'
            }}
          >
            <Text style={{ color: stages[currentIndex].textColor, fontWeight: '600', fontSize: 15 }}>
              {stages[currentIndex].label}
            </Text>
          </View>
          {/* White Nub */}
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

    // Scale Logic: 0.85 scale for side items (Close Up effect)
    const scale = interpolate(scrollX.value, inputRange, [0.85, 1, 0.85], Extrapolate.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], Extrapolate.CLAMP);

    return { opacity, transform: [{ scale }] };
  });

  const isActive = index === currentIndex;

  return (
    <View style={{ width: ITEM_WIDTH, alignItems: 'center', justifyContent: 'center' }}>
      
      {/* IMAGE */}
      <Animated.Image 
        source={item.image}
        style={[{ width: '100%', height: 260, resizeMode: 'contain' }, animatedStyle]}
        blurRadius={isActive ? 0 : 2} 
      />
      
      {/* TEXT CONTENT */}
      <Animated.View 
        style={[
            { 
                width: '120%', 
                alignItems: 'center', 
                justifyContent: 'center',
                paddingHorizontal: 0,
                marginTop: 20,
                opacity: isActive ? 1 : 0 
            }
        ]}
      >
        <Text className="text-white text-[24px] font-bold text-center" numberOfLines={1}>
            {item.title}
        </Text>
        <Text className="text-[#71717a] text-[15px] text-center mt-2 px-2" numberOfLines={2}>
            {item.desc}
        </Text>
      </Animated.View>
    </View>
  );
};

// --- 3. MAIN SCREEN ---
export default function BusinessStageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<Animated.FlatList<any>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const updateIndex = (offset: number) => {
    const newIndex = Math.round(offset / ITEM_WIDTH);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < BUSINESS_STAGES.length) {
      setCurrentIndex(newIndex);
    }
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      runOnJS(updateIndex)(event.contentOffset.x);
    },
  });

  const handleNextStage = () => {
    if (currentIndex < BUSINESS_STAGES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToOffset({ offset: nextIndex * ITEM_WIDTH, animated: true });
    }
  };

  const handlePrevStage = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      flatListRef.current?.scrollToOffset({ offset: prevIndex * ITEM_WIDTH, animated: true });
    }
  };

  const handleNext = () => {
    console.log("Selected Stage:", BUSINESS_STAGES[currentIndex].label);
    router.push('/(protected)/(tabs)');
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#09090b' }}>
      <View className="flex-1" style={{ paddingTop: insets.top }}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />
        
        {/* HEADER */}
        <View className="flex-row items-center h-[60px] px-5 mb-2">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1 h-1 bg-[#27272a] mx-4 rounded-full overflow-hidden">
            <View className="h-full bg-white w-[28%] rounded-full" />
          </View>
          <Text className="text-[#78716c] text-[13px] font-semibold">02/07</Text>
        </View>

        {/* TITLE */}
        <View className="px-5 mt-2 mb-8">
            <Text className="text-white text-[28px] font-bold leading-tight">
            What stage is your{"\n"}business/career at?
            </Text>
        </View>

        {/* SLIDE BUTTON */}
        <SlideStageButton 
          currentIndex={currentIndex}
          stages={BUSINESS_STAGES}
          onSlideNext={handleNextStage}
          onSlidePrev={handlePrevStage}
        />

        {/* CAROUSEL CONTAINER */}
        <View className="flex-1 justify-center relative">
          <Animated.FlatList
            ref={flatListRef}
            data={BUSINESS_STAGES}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            
            // 🔥 FIXED SCROLLING PHYSICS (Same as Development)
            snapToInterval={ITEM_WIDTH} 
            snapToAlignment="start" 
            decelerationRate="fast" 
            disableIntervalMomentum={true} 
            bounces={false}
            
            // 🔥 HEADER/FOOTER SPACERS FOR CENTERING
            // This ensures 1st and Last items snap to center perfectly
            ListHeaderComponent={<View style={{ width: SPACER }} />}
            ListFooterComponent={<View style={{ width: SPACER }} />}
            
            onScroll={onScroll}
            scrollEventThrottle={16}
            
            renderItem={({ item, index }) => (
              <StageItem item={item} index={index} scrollX={scrollX} currentIndex={currentIndex} />
            )}
          />
        </View>

        {/* FOOTER */}
        <View className="px-5 mb-8 pt-4 flex-row justify-between items-center gap-3">
            <TouchableOpacity 
                onPress={() => router.push('/(protected)/(tabs)')} 
                className="flex-1 h-[54px] justify-center items-center rounded-full border border-[#333] bg-[#18181b]"
            >
                <Text className="text-white font-semibold text-[16px]">Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={handleNext}
                className="flex-1 h-[54px] rounded-full overflow-hidden"
            >
                 <LinearGradient
                    colors={['#A855F7', '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                 >
                    <Text className="text-white font-bold text-[16px]">Next</Text>
                 </LinearGradient>
            </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
