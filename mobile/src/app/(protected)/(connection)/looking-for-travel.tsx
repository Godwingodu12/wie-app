import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NODES = {
  1: { x: 40, y: 50 },    
  2: { x: 240, y: 180 },  
  3: { x: 60, y: 310 },   
  4: { x: 260, y: 440 },  
};

const TravelIntroScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState(1);

  // 🔥 LOAD PROGRESS: Updates instantly when returning to this page
  useFocusEffect(
    useCallback(() => {
      const loadProgress = async () => {
        try {
          const savedProgress = await AsyncStorage.getItem('travel_step_reached');
          if (savedProgress) {
            setCompletedSteps(parseInt(savedProgress, 10));
          } else {
            setCompletedSteps(1);
          }
        } catch (e) {
          console.error("Failed to load progress", e);
        }
      };
      loadProgress();
    }, [])
  );

  // 🔥 CLOSE ROADMAP: Only deletes data when the user exits the travel flow completely
  const handleCloseRoadmap = async () => {
    try {
      await AsyncStorage.multiRemove([
        'travel_step_reached',
        'user_destinations',
        'user_travel_date',
        'user_travel_year',
        'user_connection_type',
        'user_group_kind'
      ]);
    } catch (e) {
      console.error("Failed to clear data", e);
    } finally {
      router.back(); // Goes back to Home Screen
    }
  };

  // 🔥 RESTORED EXACT ORIGINAL PUSH: Always goes straight to destinations
  const handleNext = () => {
    router.push('/(protected)/(connection)/destinations'); 
  };

  const roadPath = `
    M ${NODES[1].x + 40} ${NODES[1].y + 40} 
    C ${NODES[1].x + 180} ${NODES[1].y + 40}, ${NODES[2].x - 120} ${NODES[2].y + 40}, ${NODES[2].x + 40} ${NODES[2].y + 40}
    C ${NODES[2].x + 100} ${NODES[2].y + 60}, ${NODES[3].x - 60} ${NODES[3].y - 20}, ${NODES[3].x + 40} ${NODES[3].y + 40}
    C ${NODES[3].x + 140} ${NODES[3].y + 80}, ${NODES[4].x - 100} ${NODES[4].y + 40}, ${NODES[4].x + 40} ${NODES[4].y + 40}
  `;

  return (
    <View className="flex-1 bg-[#09090b]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <View style={{ paddingTop: insets.top }} className="flex-1 px-5">
        
        {/* HEADER */}
        <View className="flex-row items-center h-[60px] mb-2.5">
          {/* Triggers the data deletion ONLY when clicking this back arrow */}
          <TouchableOpacity onPress={handleCloseRoadmap}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1 h-1 bg-[#27272a] mx-[15px] rounded-full flex-row">
            <View 
              className="h-full bg-white rounded-full" 
              style={{ width: `${(completedSteps / 4) * 100}%` }} 
            />
          </View>
          <Text className="text-[#a1a1aa] text-[13px] font-semibold">01/07</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}>
          <View className="mt-2.5 mb-8">
            <Text className="text-white text-[28px] font-medium leading-tight">
              Are you ready to identify your travel partner/partners ?
            </Text>
          </View>

          <View className="relative h-[600px] w-full mt-2">
            <Svg height="100%" width="100%" className="absolute top-0 left-0 z-0">
              <Path d={roadPath} stroke="#3f3f46" strokeWidth="18" strokeLinecap="round" fill="none" />
              
              <Path 
                d={roadPath} 
                stroke="#8b5cf6" 
                strokeWidth="18" 
                strokeLinecap="round" 
                fill="none"
                strokeDasharray="1000"
                strokeDashoffset={1000 - (completedSteps - 1) * 333} 
              />
            </Svg>

            {[1, 2, 3, 4].map((step) => (
              <View 
                key={step}
                className="absolute w-24 h-24 z-10" 
                style={{ left: NODES[step as keyof typeof NODES].x, top: NODES[step as keyof typeof NODES].y }}
              >
                <Image 
                  source={step <= completedSteps ? require('@/assets/images/connection/platform_active.png') : require('@/assets/images/connection/platform_gray.png')} 
                  className="w-full h-full" 
                  resizeMode="contain" 
                />
                
                {step > 1 && <Text className="absolute top-5 w-full text-center text-white text-[18px] font-bold z-20">{step}</Text>}
                
                {step === completedSteps && (
                  <Image 
                    source={require('@/assets/images/connection/character_boy.png')} 
                    className="absolute"
                    style={{ width: 110, height: 190, right: -60, top: -100, zIndex: 30 }}
                    resizeMode="contain"
                  />
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View 
        className="px-5 bg-[#09090b] pt-2.5 pb-5 absolute bottom-0 w-full"
        style={{ paddingBottom: insets.bottom + 15 }}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={handleNext} className="w-full">
          <LinearGradient
            colors={['#937cf5', '#a855f7', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 9999, height: 56, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text className="text-white text-lg font-bold tracking-wide">Next</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TravelIntroScreen;
