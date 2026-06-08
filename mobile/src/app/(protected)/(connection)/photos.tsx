import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// 🔥 IMPORT ASYNC STORAGE
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import your custom GradientButton
import { GradientButton } from '@/components/Connection/UI/Buttons';

import { connectionService } from '@/services/connectionService';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = width * 0.4; 
const MAX_PHOTOS = 6;
const MIN_PHOTOS = 4;

const PhotoUploadScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- FETCH EXISTING PHOTOS ---
  useEffect(() => {
    loadExisting();
  }, []);

  const loadExisting = async () => {
    try {
      const response = await connectionService.getProfile();
      if (response.success && response.data?.photos) {
        setExistingPhotos(response.data.photos);
      }
    } catch (e) {
      console.log("Error loading existing photos", e);
    }
  };

  const pickImage = async () => {
    setError(null);
    if (photos.length + existingPhotos.length >= MAX_PHOTOS) {
      setError(`Limit Reached: Maximum ${MAX_PHOTOS} photos allowed.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
      setError(null);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setError(null);
  };

  const deleteExistingPhoto = async (publicId: string) => {
    try {
        await connectionService.deletePhoto(publicId);
        setExistingPhotos(prev => prev.filter(p => p.publicId !== publicId));
    } catch (e: any) {
        Alert.alert("Error", e.message || "Failed to delete photo");
    }
  };

  // 🔥 UPDATED LOGIC: Uploads photos to the backend
  const handleNext = async () => {
    const totalPhotos = photos.length + existingPhotos.length;
    
    // If user has 0 new photos but already has some on server, let them pass
    if (photos.length === 0 && existingPhotos.length >= MIN_PHOTOS) {
      router.push('/(protected)/(connection)/face-verification');
      return;
    }

    if (totalPhotos < MIN_PHOTOS) {
      setError(`Please add at least ${MIN_PHOTOS} photos to continue.`);
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      if (photos.length > 0) {
        // 1. 🔥 UPLOAD ALL SELECTED PHOTOS to backend
        await connectionService.uploadPhotos(photos);
        
        // 2. 🔥 SAVE ALL SELECTED PHOTOS (4, 5, or 6) as a JSON string for local use
        await AsyncStorage.setItem('userPhotos', JSON.stringify(photos));
        
        // 3. Save the first one specifically for the small header icon
        await AsyncStorage.setItem('userProfilePic', photos[0]);
      }
      
      console.log(`${photos.length} new photos saved successfully.`);
      router.push('/(protected)/(connection)/face-verification');
    } catch (e: any) {
      console.log("Error saving photos", e);
      setError(e.message || "Failed to upload photos. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const ChecklistItem = ({ text, isPositive }: { text: string; isPositive: boolean }) => (
    <View className="flex-row items-center gap-2.5">
      <Ionicons 
        name={isPositive ? "checkmark" : "close"} 
        size={18} 
        color={isPositive ? "#10b981" : "#ef4444"} 
      />
      <Text className="text-[#d4d4d8] text-sm">{text}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#09090b]" edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <View className="flex-1 px-5">
        <View className="flex-row items-center h-[60px] mb-2.5">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1 h-1 bg-[#1c1c1e] mx-[15px] rounded-sm">
            <View className="h-full bg-white rounded-sm w-[42%]" />
          </View>
          <Text className="text-[#a8a29e] text-[13px] font-semibold">03/07</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <View className="mt-2.5 mb-[30px]">
            <Text className="text-white text-[34px] font-bold leading-tight">Add your best{"\n"}Photos...</Text>
            <Text className="text-[#71717a] text-base mt-2.5">
              Add your best photos to get the higher amount of day matches
            </Text>
          </View>

          <View className="flex-row flex-wrap justify-center items-center gap-[15px] mt-2.5">
            {/* EXISTING PHOTOS (FROM SERVER) */}
            {existingPhotos.map((photo, index) => (
                <View key={`existing-${index}`} className="relative" style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}>
                    <Image 
                    source={{ uri: photo.url }} 
                    className="w-full h-full bg-[#1c1c1e]"
                    style={{ borderRadius: PHOTO_SIZE / 2 }} 
                    />
                    <TouchableOpacity 
                    className="absolute top-1 right-2.5 bg-red-500 w-7 h-7 rounded-full justify-center items-center border-2 border-[#09090b] z-10"
                    onPress={() => deleteExistingPhoto(photo.publicId)}
                    >
                    <Ionicons name="trash" size={14} color="white" />
                    </TouchableOpacity>
                </View>
            ))}

            {/* NEWLY SELECTED PHOTOS (LOCAL) */}
            {photos.map((uri, index) => (
              <View key={`new-${index}`} className="relative" style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}>
                <Image 
                  source={{ uri }} 
                  className="w-full h-full bg-[#1c1c1e]"
                  style={{ borderRadius: PHOTO_SIZE / 2 }} 
                />
                <TouchableOpacity 
                  className="absolute top-1 right-2.5 bg-[#3f3f46] w-7 h-7 rounded-full justify-center items-center border-2 border-[#09090b] z-10"
                  onPress={() => removePhoto(index)}
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
                {index === 0 && existingPhotos.length === 0 && (
                  <View className="absolute bottom-2 self-center bg-black/60 px-3 py-1 rounded-full">
                    <Text className="text-white text-[10px] font-bold">Profile Pic</Text>
                  </View>
                )}
              </View>
            ))}

            {photos.length + existingPhotos.length < MAX_PHOTOS && (
              <TouchableOpacity 
                className={`bg-[#161618] justify-center items-center border ${error ? 'border-red-500' : 'border-[#27272a]'}`}
                style={{ width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: PHOTO_SIZE / 2 }}
                onPress={pickImage} 
                activeOpacity={0.7}
              >
                <View className="w-12 h-12 rounded-3xl bg-[#52525b] justify-center items-center mb-2">
                  <Ionicons name="add" size={28} color="white" />
                </View>
                <Text className="text-[#a1a1aa] text-sm">Add photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {error && <Text className="text-red-500 text-sm text-center mt-4 font-medium">{error}</Text>}

          <View className="mt-10 gap-3">
            <ChecklistItem text="Clear face photos" isPositive={true} />
            <ChecklistItem text="Recent photos" isPositive={true} />
            <ChecklistItem text="Variety (face, full body, activity shots)" isPositive={true} />
            <ChecklistItem text="No group photos without clear indication" isPositive={false} />
            <ChecklistItem text="No AI-generated or heavily edited images" isPositive={false} />
          </View>
        </ScrollView>
      </View>

      <View className="absolute bottom-0 left-0 right-0 px-5 bg-[#09090b] pt-2.5" style={{ paddingBottom: insets.bottom + 20 }}>
        {isLoading ? (
          <View className="h-[56px] justify-center items-center bg-[#1c1c1e] rounded-full">
            <ActivityIndicator color="#8b5cf6" />
          </View>
        ) : (
          <GradientButton title="Next" onPress={handleNext} />
        )}
      </View>
    </SafeAreaView>
  );
};

export default PhotoUploadScreen;
