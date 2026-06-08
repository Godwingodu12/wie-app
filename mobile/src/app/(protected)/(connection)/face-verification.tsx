import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera'; 

// Import the standard button component
import { GradientButton } from '@/components/Connection/UI/Buttons';

const FaceVerificationScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleNext = () => {
    router.push('/(protected)/(connection)/orientation'); 
  };

  if (!permission) {
    return <View className="flex-1 bg-[#09090b]" />;
  }

  return (
    <View className="flex-1 bg-[#09090b]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* Main Container */}
      <View style={{ paddingTop: insets.top }} className="flex-1 px-6">
        
        {/* HEADER */}
        <View className="flex-row items-center h-[60px] mb-8">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1 h-[2px] bg-[#1c1c1e] mx-[15px] rounded-full">
            <View className="h-full bg-white rounded-full w-[42%]" />
          </View>
          <Text className="text-[#a8a29e] text-[13px] font-semibold">03/07</Text>
        </View>

        {/* TITLE SECTION - Positioned at the top */}
        <View className="mb-12">
          <Text className="text-white text-[32px] font-medium">Face verification</Text>
          <Text className="text-[#71717a] text-lg mt-1">Used to verify your identity.</Text>
        </View>

        {/* CAMERA CIRCLE - Positioned higher up the screen */}
        <View className="items-center">
          <View 
            style={{ 
              width: 300, 
              height: 300, 
              borderRadius: 150,
              borderWidth: 1.5,
              borderColor: '#3b82f6',
            }}
            className="bg-[#161618] overflow-hidden"
          >
            {permission.granted ? (
              <CameraView 
                style={{ flex: 1 }} 
                facing="front" 
              />
            ) : (
              <TouchableOpacity 
                className="flex-1 justify-center items-center px-8" 
                onPress={requestPermission}
              >
                <Ionicons name="camera-reverse" size={40} color="#3b82f6" />
                <Text className="text-white text-center mt-4 text-sm font-medium">
                  Allow Camera Access
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* This View pushes everything above it to the top */}
        <View className="flex-1" />

      </View>

      {/* FOOTER BUTTON - Bottom Aligned */}
      <View 
        className="px-6"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
        <GradientButton 
          title="Next" 
          onPress={handleNext} 
        />
      </View>
    </View>
  );
};

export default FaceVerificationScreen;
