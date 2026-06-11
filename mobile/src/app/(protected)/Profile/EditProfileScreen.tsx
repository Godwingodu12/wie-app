import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, Alert, TextInput, Switch } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

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
  const [gender, setGender] = useState(user.gender || 'Male');
  const [accountType, setAccountType] = useState('Public');
  const [showAccountBadge, setShowAccountBadge] = useState(true);
  const [showAccountSuggestions, setShowAccountSuggestions] = useState(true);
  
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showAccountTypeDropdown, setShowAccountTypeDropdown] = useState(false);

  const [profilePic, setProfilePic] = useState(user.profile_picture);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty =
    name !== user.name ||
    username !== user.username ||
    bio !== user.bio ||
    website !== (user.website || '') ||
    gender !== (user.gender || 'Male') ||
    profilePic !== user.profile_picture;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
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

  const renderLabel = (label: string) => (
    <Text className="text-[#A0A0A0] text-[13px] font-rubik-medium mb-2 ml-1">{label}</Text>
  );

  const renderInput = (label: string, value: string, onChangeText: (t: string) => void, placeholder: string, multiline: boolean = false) => (
    <View className="mb-6">
      {renderLabel(label)}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#52525B"
        multiline={multiline}
        className={`bg-[#121214] border border-[#1C2024] rounded-2xl px-4 text-white text-base ${
          multiline ? 'min-h-[100px] py-4' : 'h-[56px]'
        }`}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );

  const renderSelector = (label: string, value: string, isOpen: boolean, onToggle: () => void, options: string[], onSelect: (val: string) => void) => (
    <View className="mb-6">
      {renderLabel(label)}
      <TouchableOpacity 
        onPress={onToggle}
        activeOpacity={0.7}
        className="bg-[#121214] border border-[#1C2024] rounded-2xl px-4 h-[56px] flex-row items-center justify-between"
      >
        <Text className="text-white text-base">{value}</Text>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#A0A0A0" />
      </TouchableOpacity>
      
      {isOpen && (
        <View className="mt-2 gap-2">
          {options.filter(opt => opt !== value).map((opt) => (
            <TouchableOpacity 
              key={opt}
              onPress={() => {
                onSelect(opt);
                onToggle();
              }}
              activeOpacity={0.7}
              className="bg-[#121214] border border-[#1C2024] rounded-2xl px-4 h-[56px] justify-center"
            >
              <Text className={`text-base text-white`}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderToggle = (label: string, value: boolean, onValueChange: (v: boolean) => void) => (
    <View className="flex-row items-center justify-between mb-6">
      <Text numberOfLines={1} className="text-white text-[13px] font-rubik-medium flex-1 mr-2">{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#3F3F46', true: '#2563EB' }}
        thumbColor="#FFFFFF"
        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
      />
    </View>
  );

  return (
    <SafeAreaView className='flex-1 bg-black'>
      {/* Header */}
      <View className='flex-row items-center px-4 py-4 gap-4'>
        <TouchableOpacity onPress={() => router.back()} className='w-10 h-10 bg-[#1C2024] rounded-full items-center justify-center'>
          <Ionicons name='arrow-back' size={24} color="white" />
        </TouchableOpacity>
        <Text className='text-white font-rubik-bold text-xl'>Edit profile</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
          
          {/* Profile Picture Section */}
          <View className="items-center py-8">
            <View className="relative">
              <Image
                source={profilePic ? { uri: profilePic } : images.defaultAvatar}
                className="w-[100px] h-[100px] rounded-full border-2 border-[#1C2024]"
              />
              <TouchableOpacity 
                onPress={pickImage}
                activeOpacity={0.8}
                className="absolute bottom-0 right-0 bg-[#1C2024] w-8 h-8 rounded-full items-center justify-center border-2 border-black"
              >
                <Ionicons name="camera" size={16} color="white" />
              </TouchableOpacity>
            </View>
            <Text className="text-white text-[17px] font-rubik-bold mt-4">{name || 'Your Name'}</Text>
          </View>

          {renderInput('Name', name, setName, 'Enter your name')}
          {renderInput('Username', username, setUsername, 'Enter username')}
          {renderInput('Avatar', '', () => {}, 'Avatar', false)}
          {renderInput('Website', website, setWebsite, 'https://example.com')}
          {renderInput('Bio', bio, setBio, 'Write something about yourself...', true)}

          {renderToggle('Show wie account badge', showAccountBadge, setShowAccountBadge)}
          
          {renderSelector(
            'Gender', 
            gender, 
            showGenderDropdown, 
            () => setShowGenderDropdown(!showGenderDropdown),
            ['Male', 'Female', 'Other'],
            setGender
          )}

          {renderToggle('Show wie account suggestion on profile', showAccountSuggestions, setShowAccountSuggestions)}

          {renderSelector(
            'Account type', 
            accountType, 
            showAccountTypeDropdown, 
            () => setShowAccountTypeDropdown(!showAccountTypeDropdown),
            ['Public', 'Private'],
            setAccountType
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 bg-black/90 p-6 pb-8 border-t border-[#1C2024] flex-row gap-3">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="flex-1 h-[56px] bg-[#1C2024] rounded-full items-center justify-center"
        >
          <Text className="text-white font-rubik-semibold text-base">Cancel</Text>
        </TouchableOpacity>
        <BlueGrdBtn 
          title="Save Changes" 
          onPress={handleSave} 
          containerClassName="flex-1" 
          height={56}
          disabled={!isDirty || isSaving}
        />
      </View>
    </SafeAreaView>
  );
};

export default EditProfileScreen;
