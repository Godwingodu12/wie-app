import React, { useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

interface SlideStageButtonProps {
  currentIndex: number;
  stages: any[]; 
  onSlideNext: () => void;
  onSlidePrev: () => void;
}

export const SlideStageButton: React.FC<SlideStageButtonProps> = ({
  currentIndex,
  stages,
  onSlideNext,
  onSlidePrev,
}) => {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const sliderWidth = WINDOW_WIDTH - 40; 
  const thumbWidth = 140;
  const padding = 4;
  const maxTrack = sliderWidth - thumbWidth - (padding * 2);

  const getTargetPosition = (index: number) => {
    'worklet';
    if (index === 0) return 0;
    if (index >= stages.length - 1) return maxTrack;
    // For 4 stages, we distribute the middle positions
    // If stages.length is 4, maxTrack / (stages.length - 1) * index
    return (maxTrack / (stages.length - 1)) * index;
  };

  useEffect(() => {
    translateX.value = withSpring(getTargetPosition(currentIndex), {
      damping: 20,
      stiffness: 150,
    });
  }, [currentIndex]);

  // Safety check
  const currentStage = stages && stages[currentIndex] ? stages[currentIndex] : { color: '#333', label: '', textColor: '#fff' };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      let nextPos = startX.value + event.translationX;
      if (nextPos < 0) nextPos = 0;
      if (nextPos > maxTrack) nextPos = maxTrack;
      translateX.value = nextPos;
    })
    .onEnd((event) => {
      const dragDiff = event.translationX;
      const threshold = 30;

      if (dragDiff > threshold && currentIndex < stages.length - 1) {
        runOnJS(onSlideNext)();
      } else if (dragDiff < -threshold && currentIndex > 0) {
        runOnJS(onSlidePrev)();
      } else {
        translateX.value = withSpring(getTargetPosition(currentIndex));
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View className="h-[54px] bg-[#1C1C1E] rounded-lg mx-5 mb-4 justify-center relative overflow-hidden">
      {/* Background Labels */}
      <View className="absolute inset-0 flex-row items-center px-6 justify-between">
         <Text className="text-[#444] text-[10px]">{currentIndex > 0 ? "< Back" : ""}</Text>
         <Text className="text-[#444] text-[10px]">{currentIndex < stages.length - 1 ? "Next >" : ""}</Text>
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            thumbStyle,
            {
              width: thumbWidth,
              height: 46,
              marginLeft: padding,
              zIndex: 10,
            },
          ]}
        >
          <View
            style={{
              flex: 1,
              height: '100%',
              backgroundColor: currentStage.color,
              borderRadius: 8,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: currentStage.textColor, fontWeight: '700', fontSize: 13 }}>
              {currentStage.label}
            </Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};
