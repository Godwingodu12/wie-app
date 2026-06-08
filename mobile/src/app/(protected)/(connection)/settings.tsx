import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Switch, 
  StatusBar, 
  Animated, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // --- STATES ---
  const [isHidden, setIsHidden] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const toastY = useRef(new Animated.Value(100)).current;

  // 1. LOAD SAVED STATE ON MOUNT
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedValue = await AsyncStorage.getItem('userAccountHidden');
        if (savedValue !== null) {
          setIsHidden(JSON.parse(savedValue));
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    };
    loadSettings();
  }, []);

  // 2. SAVE LOGIC
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Permanently save the current toggle state
      await AsyncStorage.setItem('userAccountHidden', JSON.stringify(isHidden));
      
      // UX Feedback delay
      setTimeout(() => {
        setIsSaving(false);
        triggerSuccessToast();
      }, 800);
    } catch (e) {
      setIsSaving(false);
      console.error(e);
    }
  };

  const triggerSuccessToast = () => {
    setShowSuccess(true);
    Animated.spring(toastY, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();

    setTimeout(() => {
      Animated.timing(toastY, {
        toValue: 100,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setShowSuccess(false));
    }, 3000);
  };

  return (
    <View className="flex-1 bg-[#09090b]">
      <StatusBar barStyle="light-content" />
      
      <View style={{ paddingTop: insets.top + 20 }} className="px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        
        <Text className="text-white text-4xl font-bold mb-10">Settings</Text>

        <View className="flex-row justify-between items-center py-4">
          <Text className="text-zinc-300 text-lg">Hide Wie account from others.</Text>
          <Switch
            trackColor={{ false: '#27272a', true: '#a855f7' }}
            thumbColor={isHidden ? '#ffffff' : '#71717a'}
            ios_backgroundColor="#27272a"
            onValueChange={(value) => setIsHidden(value)} // Updates local state
            value={isHidden}
          />
        </View>
      </View>

      {/* FOOTER BUTTONS */}
      <View 
        style={{ paddingBottom: insets.bottom + 20 }} 
        className="absolute bottom-0 left-0 right-0 px-6 flex-row gap-4"
      >
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="flex-1 h-16 rounded-full border border-zinc-800 items-center justify-center bg-black/20"
        >
          <Text className="text-white text-lg font-semibold">Go back</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleSave} 
          disabled={isSaving}
          className="flex-1 h-16 rounded-full overflow-hidden"
        >
          <LinearGradient
            colors={['#937cf5', '#a855f7', '#8b5cf6']}
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }}
            className="w-full h-full items-center justify-center"
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-semibold">Save changes</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* SUCCESS TOAST */}
      {showSuccess && (
        <Animated.View 
          style={{ transform: [{ translateY: toastY }] }}
          className="absolute bottom-32 left-10 right-10 bg-zinc-900 border border-purple-500 py-4 px-6 rounded-2xl flex-row items-center justify-center shadow-2xl"
        >
          <Ionicons name="checkmark-circle" size={20} color="#a855f7" />
          <Text className="text-white ml-2 font-semibold">Settings saved!</Text>
        </Animated.View>
      )}
    </View>
  );
}
