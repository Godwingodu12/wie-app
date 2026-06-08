import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { LabeledInput } from '@/components/Profile/Settings/LabeledInput';
import BlueGrdBtn from '@/components/BlueGrdBtn';
import { useUser } from '@/context/UserContext';
import images from '@/constants/defaultAvatar';
import { useToast } from '@/context/ToastContext';

const EditProfileScreen = () => {
  const { user, updateUser } = useUser();
  const { showToast } = useToast();

  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);
  const [website, setWebsite] = useState(user.website || '');
  const [gender, setGender] = useState(user.gender || '');
  const [profilePic, setProfilePic] = useState(user.profile_picture);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty =
    name !== user.name ||
    username !== user.username ||
    bio !== user.bio ||
    website !== (user.website || '') ||
    gender !== (user.gender || '') ||
    profilePic !== user.profile_picture;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setProfilePic(null);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const data: any = { name, username, bio, website, gender };
      
      if (profilePic !== user.profile_picture) {
        if (profilePic) {
          const filename = profilePic.split('/').pop() || 'profile.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;
          
          data.profile_picture = {
            uri: profilePic,
            name: filename,
            type,
          };
        } else {
          data.profile_picture = null;
        }
      }

      await updateUser(data);
      showToast({ message: "Profile updated successfully", type: 'success' });
      router.back();
    } catch (error: any) {
      showToast({ message: error.message || "Failed to update profile", type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-black'>
      <View className='flex-row justify-between px-3 items-center py-4'>
        <View className='flex-row gap-3 items-center'>
          <TouchableOpacity onPress={() => router.back()} className='w-10 h-10 bg-[#1C2024] rounded-full items-center justify-center'>
            <Ionicons name='arrow-back' size={24} color="white" />
          </TouchableOpacity>
          <Text className='text-white font-rubik-bold text-lg'>Edit Profile</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

          <View className="items-center py-6">

            <Image
              source={profilePic ? { uri: profilePic } : images.defaultAvatar}
              className="w-28 h-28 rounded-full border-2 border-[#121214]"
            />

            <View className="flex gap-1 mt-4 items-center">
              <TouchableOpacity onPress={pickImage}>
                <Text className="text-blue-500 font-rubik-medium">Change Photo</Text>
              </TouchableOpacity>

              {profilePic && (
                <TouchableOpacity onPress={removeImage}>
                  <Text className="text-red-500 font-rubik-medium">Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <LabeledInput label="Name" value={name} onChangeText={setName} />
          <LabeledInput label="Username" value={username} onChangeText={setUsername} />
          <LabeledInput label="Website" value={website} onChangeText={setWebsite} />
          <LabeledInput label="Bio" value={bio} onChangeText={setBio} multiline={true} />

          <View className="mb-10">
            <Text className="text-gray-400 text-sm mb-2 font-medium ml-1">Gender</Text>
            <View className="flex-row gap-3">
              {['Male', 'Female', 'Other'].map((g) => (
                <TouchableOpacity 
                  key={g}
                  onPress={() => setGender(g)}
                  className={`px-6 py-3 rounded-full border ${gender === g ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-white/10'}`}
                >
                  <Text className={`text-sm font-rubik-medium ${gender === g ? 'text-white' : 'text-gray-400'}`}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {isDirty && (
        <View className="absolute bottom-0 left-0 right-0 bg-[#121214] p-6 pb-8 flex-row gap-3">
          <TouchableOpacity onPress={() => router.back()} className="flex-1 h-[56px] bg-[#1C2024] rounded-full items-center justify-center">
            <Text className="text-white font-rubik-semibold text-base">Cancel</Text>
          </TouchableOpacity>
          <BlueGrdBtn title="Save Changes" onPress={handleSave} containerClassName="flex-1" height={56} />
        </View>
      )}
    </SafeAreaView>
  );
};

export default EditProfileScreen;
