import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { mediaService } from '@/services/mediaService';
import { useToast } from '@/context/ToastContext';

const CreatePostScreen = () => {
  const [media, setMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'], // Support both images and videos
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });

    if (!result.canceled) {
      setMedia(result.assets[0].uri);
      setMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
    }
  };

  const handleUpload = async () => {
    if (!media) {
      showToast({ message: "Please select a photo or video first", type: 'error' });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      const filename = media.split('/').pop() || 'upload.jpg';
      const extension = filename.split('.').pop();
      const type = mediaType === 'video' ? `video/${extension || 'mp4'}` : `image/${extension || 'jpg'}`;

      // @ts-ignore
      formData.append('media', {
        uri: media,
        name: filename,
        type: type,
      } as any);
      
      formData.append('caption', caption || '');
      formData.append('visibility', 'public');
      formData.append('isStory', 'false');
      formData.append('isPersistent', 'true');
      formData.append('type', mediaType === 'video' ? 'reel' : 'post');

      await mediaService.createPost(formData);
      
      showToast({ message: `${mediaType === 'video' ? 'Reel' : 'Post'} uploaded successfully!`, type: 'success' });
      router.back();
    } catch (error: any) {
      showToast({ message: error.message || "Failed to upload", type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <Stack.Screen options={{ 
          headerShown: true, 
          title: 'New Post',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleUpload} disabled={isUploading}>
                {isUploading ? (
                    <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                    <Text className="text-blue-500 font-bold text-lg">Share</Text>
                )}
            </TouchableOpacity>
          )
      }} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4">
          <View className="flex-row mt-6">
            <TouchableOpacity 
                onPress={pickMedia}
                className="w-24 h-32 bg-zinc-900 rounded-xl items-center justify-center overflow-hidden border border-zinc-800"
            >
                {media ? (
                    mediaType === 'video' ? (
                      <View className="items-center justify-center">
                        <Ionicons name="videocam" size={32} color="white" />
                        <Text className="text-white text-[8px] mt-1">Video Selected</Text>
                      </View>
                    ) : (
                      <Image source={{ uri: media }} className="w-full h-full" />
                    )
                ) : (
                    <>
                        <Ionicons name="add-circle-outline" size={32} color="#71717a" />
                        <Text className="text-zinc-500 text-[10px] mt-2">Select Media</Text>
                    </>
                )}
            </TouchableOpacity>

            <View className="flex-1 ml-4 justify-start">
                <TextInput
                    placeholder="Write a caption..."
                    placeholderTextColor="#52525b"
                    multiline
                    value={caption}
                    onChangeText={setCaption}
                    className="text-white text-base max-h-32"
                />
            </View>
          </View>
          
          <View className="mt-10 border-t border-zinc-900 pt-6">
              <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-zinc-900">
                  <View className="flex-row items-center">
                    <Ionicons name="location-outline" size={22} color="white" />
                    <Text className="text-white ml-3 text-base">Add Location</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#52525b" />
              </TouchableOpacity>
              
              <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-zinc-900">
                  <View className="flex-row items-center">
                    <Ionicons name="musical-notes-outline" size={22} color="white" />
                    <Text className="text-white ml-3 text-base">Add Music</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#52525b" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-zinc-900">
                  <View className="flex-row items-center">
                    <Ionicons name="person-add-outline" size={22} color="white" />
                    <Text className="text-white ml-3 text-base">Tag People</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#52525b" />
              </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreatePostScreen;
