import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MusicLabelProps {
  audioTitle: string;
  onPress?: () => void;
}

const MusicLabel: React.FC<MusicLabelProps> = ({ audioTitle, onPress }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Reset animation state when audioTitle changes or widths change
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    scrollAnim.setValue(0);

    // Only start animation if text is longer than container
    if (audioTitle && textWidth > containerWidth && containerWidth > 0) {
      const scrollDistance = textWidth - containerWidth + 24; // extra padding at the end

      const startAnimation = () => {
        // Pattern: Pause 1s -> Scroll R to L -> Pause 1s -> Return smoothly -> Pause 1s -> Repeat
        animationRef.current = Animated.loop(
          Animated.sequence([
            Animated.delay(1000), // Pause 1 second at start
            Animated.timing(scrollAnim, {
              toValue: -scrollDistance,
              duration: Math.max(3000, scrollDistance * 35), // Speed proportional to distance
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.delay(1000), // Pause 1 second at the end
            Animated.timing(scrollAnim, {
              toValue: 0,
              duration: 1500, // Return smoothly to start
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.delay(1000), // Pause 1 second before repeating
          ])
        );
        animationRef.current.start();
      };

      startAnimation();
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [audioTitle, textWidth, containerWidth, scrollAnim]);

  if (!audioTitle) return null;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity 
        activeOpacity={0.6} 
        onPress={onPress}
        style={styles.container}
      >
        <Ionicons name="musical-note" color="white" size={10} style={styles.icon} />
        
        <View 
          style={styles.mask}
          onLayout={(e) => {
            const width = e.nativeEvent.layout.width;
            if (width > 0) setContainerWidth(width);
          }}
        >
          {/* Measurement Text: Hidden element used to measure the full width of the text */}
          <View style={styles.measureContainer}>
            <Text 
              style={styles.text}
              onLayout={(e) => {
                const width = e.nativeEvent.layout.width;
                if (width > 0) setTextWidth(width);
              }}
            >
              {audioTitle}
            </Text>
          </View>

          <Animated.View style={[
            styles.animatedContent,
            { transform: [{ translateX: scrollAnim }] }
          ]}>
            <Text 
              style={[
                styles.text, 
                // If we are animating, we need the text to not truncate
                textWidth > containerWidth && containerWidth > 0 ? { width: textWidth + 30 } : {}
              ]}
              numberOfLines={1}
            >
              {audioTitle}
            </Text>
          </Animated.View>
        </View>

      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  icon: {
    marginRight: 4,
  },
  mask: {
    flex: 1,
    overflow: 'hidden',
    maxWidth: 220, 
    height: 16, // Fixed height to prevent layout jumps
    justifyContent: 'center',
  },
  measureContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0,
    zIndex: -1,
    width: 2000, // Large enough to allow the text to expand fully for measurement
    flexDirection: 'row',
  },
  animatedContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'normal',
    flexShrink: 0, // Prevent text from shrinking
  }
});

export default React.memo(MusicLabel);
