import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// 👇 Verify this path matches your project structure
import { GradientButton } from '@/components/Connection/UI/Buttons';

import { connectionService } from '@/services/connectionService';
import { ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LocationReasonScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      await connectionService.createLocationPurpose({
        reason: reason,
        status: 'draft'
      });
      await AsyncStorage.setItem('user_purpose_code', 'location');
      router.push('/(protected)/(connection)/PersonNearLocationScreen');
    } catch (e) {
      console.error(e);
      router.push('/(protected)/(connection)/PersonNearLocationScreen');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1 bg-[#09090b]"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1" style={{ paddingTop: insets.top }}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />

            {/* HEADER */}
            <View className="flex-row items-center h-[60px] px-5">
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="white" />
              </TouchableOpacity>
              
              <View className="flex-1 h-[2px] bg-[#1c1c1e] mx-4 rounded-full overflow-hidden">
                <View className="h-full bg-white w-[28%] rounded-full" />
              </View>
              
              <Text className="text-[#a8a29e] text-[13px] font-medium">02/07</Text>
            </View>

            {/* CONTENT */}
            <View className="flex-1 px-5 mt-4">
              <Text className="text-white text-[24px] font-semibold leading-tight">
                What is your reason for finding a person via location?
              </Text>

              <View className="mt-8">
                <Text className="text-[#52525b] text-[15px] font-medium mb-4">
                  Your need
                </Text>
                
                {/* TEXT INPUT BOX */}
                <View className="bg-[#161618] rounded-[18px] p-5 h-[160px] border border-[#27272a]">
                  <TextInput
                    multiline
                    placeholder="Eg:Looking for someone to join me at the coffee shop for co-working"
                    placeholderTextColor="#3f3f46"
                    // 🔥 REDUCED TEXT SIZE TO 8px TO ENSURE SINGLE LINE FIT
                    className="text-white text-[8px]" 
                    style={{ 
                      textAlignVertical: 'top', 
                      height: '100%',
                      paddingTop: 0,
                    }}
                    value={reason}
                    onChangeText={setReason}
                    cursorColor="white"
                    selectionColor="#8b5cf6"
                  />
                </View>
              </View>
            </View>

            {/* FOOTER ACTION BUTTONS */}
            <View 
              className="px-5 flex-row justify-between items-center mb-4"
              style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }}
            >
              <TouchableOpacity 
                onPress={() => router.push('/(protected)/(connection)/interests')} 
                className="flex-1 mr-2 h-[56px] justify-center items-center rounded-full border border-[#27272a] bg-transparent"
              >
                <Text className="text-white text-[16px] font-semibold">Skip</Text>
              </TouchableOpacity>
              
              <View className="flex-1 ml-2 h-[56px]">
                <GradientButton title="Next" onPress={handleNext} />
              </View>
            </View>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}
