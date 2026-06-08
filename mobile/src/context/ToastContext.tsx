import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withSequence, 
  runOnJS 
} from 'react-native-reanimated';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const hideToast = useCallback(() => {
    translateY.value = withTiming(-100, { duration: 300 }, () => {
      runOnJS(setToast)(null);
    });
    opacity.value = withTiming(0, { duration: 300 });
  }, []);

  const showToast = useCallback(({ message, type = 'success', duration = 3000 }: ToastOptions) => {
    setToast({ message, type, duration });
    
    // Animation Sequence
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withSequence(
      withSpring(50, { damping: 12, stiffness: 100 }), // Slide down to 50px from top
      withTiming(50, { duration: duration }), // Stay there
      withTiming(-100, { duration: 300 }, () => { // Slide back up
        runOnJS(setToast)(null);
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getIcon = () => {
    if (!toast) return null;
    switch (toast.type) {
      case 'success': return <CheckCircle2 color="#10B981" size={24} />;
      case 'error': return <AlertCircle color="#EF4444" size={24} />;
      case 'info': return <Info color="#3B82F6" size={24} />;
      default: return <CheckCircle2 color="#10B981" size={24} />;
    }
  };

  const getBorderColor = () => {
    if (!toast) return '#333';
    switch (toast.type) {
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      case 'info': return '#3B82F6';
      default: return '#333';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View 
          style={[styles.toastContainer, animatedStyle, { borderColor: getBorderColor() }]}
          className="absolute top-0 self-center z-[9999] w-[90%] bg-[#1A1C1E]/95 backdrop-blur-xl border-l-4 rounded-xl px-4 py-4 flex-row items-center shadow-2xl"
        >
          <View className="mr-3">
            {getIcon()}
          </View>
          <Text className="flex-1 text-white font-bold text-sm leading-5">
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
  },
});
