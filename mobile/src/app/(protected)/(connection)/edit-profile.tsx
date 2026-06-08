import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState, useEffect } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import { wieUserService } from '@/services/wieUserService';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  // --- FORM STATES ---
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [purpose, setPurpose] = useState('');
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [newQual, setNewQual] = useState('');
  const [qualFocused, setQualFocused] = useState(false);
  const [userPhotos, setUserPhotos] = useState<string[]>([]);
  
  // --- UI FEEDBACK STATES ---
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const toastY = useRef(new Animated.Value(100)).current;

  const QUALIFICATION_LIST = ['10th', '12th', 'Diploma', 'BA', 'BBA', 'BCom', 'BTech', 'MBA', 'MBBS', 'PhD', 'Engineer', 'Doctor', 'Teacher'];

  // --- AGE CALCULATION LOGIC ---
  const calculateAgeFromDate = (birthDate: Date) => {
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
    }
    return calculatedAge;
  };

  const parseAgeOrDob = (input: string) => {
    const trimmed = input.trim();
    // 1. Check if it's a numeric age (1-3 digits)
    if (/^\d{1,3}$/.test(trimmed)) {
      return parseInt(trimmed);
    }
    // 2. Check if it's a DOB string (DD/MM/YYYY)
    const dobMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
    if (dobMatch) {
      const d = Number(dobMatch[1]), m = Number(dobMatch[2]), y = Number(dobMatch[3]);
      const date = new Date(y, m - 1, d);
      if (!isNaN(date.getTime())) {
        return calculateAgeFromDate(date);
      }
    }
    return NaN;
  };

  const handleAgeChange = (text: string) => {
    let cleaned = text.replace(/\D/g, '');
    let masked = text;
    // Apply DD/MM/YYYY mask if it looks like a date
    if (text.includes('/') || text.length > 3) {
        masked = cleaned;
        if (cleaned.length > 2) masked = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
        if (cleaned.length > 4) masked = masked.slice(0, 5) + '/' + cleaned.slice(4, 8);
    }
    setAge(masked);
  };

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const profile = await wieUserService.getProfile();
        if (profile) {
            const d = profile;
            setName(d.displayName || d.name || '');
            
            if (d.dateOfBirth) {
              const date = new Date(d.dateOfBirth);
              const day = date.getDate().toString().padStart(2, '0');
              const month = (date.getMonth() + 1).toString().padStart(2, '0');
              const year = date.getFullYear();
              setAge(`${day}/${month}/${year}`);
            } else {
              setAge(d.age?.toString() || '');
            }
            
            setLocation(d.location?.city || d.location || '');
            setQualifications(d.qualifications || []);
            setPurpose(d.personalDescription || d.bio || '');
            if (d.photos) {
                const urls = d.photos.map((p: any) => typeof p === 'string' ? p : p.url);
                setUserPhotos(urls);
            }
        } else {
          const keys = ['userName', 'userAge', 'userLocation', 'userQualifications', 'userPurpose', 'userPhotos'];
          const stores = await AsyncStorage.multiGet(keys);
          stores.forEach(([key, value]) => {
            if (!value) return;
            if (key === 'userName') setName(value);
            if (key === 'userAge') setAge(value);
            if (key === 'userLocation') setLocation(value);
            if (key === 'userQualifications') setQualifications(JSON.parse(value));
            if (key === 'userPurpose') setPurpose(value);
            if (key === 'userPhotos') setUserPhotos(JSON.parse(value));
          });
        }
      } catch (e) { 
        console.error("Error loading profile data:", e); 
      }
    };
    loadData();
  }, []);

  // --- QUALIFICATION LOGIC ---
  const normalizeSpaces = (text: string) => text.trim().replace(/\s+/g, ' ');
  const normalizedQualQuery = normalizeSpaces(newQual);
  
  const filteredQualSuggestions = QUALIFICATION_LIST
    .filter((item) => item.toLowerCase().includes(normalizedQualQuery.toLowerCase()))
    .filter((item) => !qualifications.some((q) => q.toLowerCase() === item.toLowerCase()))
    .slice(0, 8);

  const shouldShowQualSuggestions = qualFocused && normalizedQualQuery.length > 0 && filteredQualSuggestions.length > 0;

  const addQual = (val: string) => {
    const trimmed = normalizeSpaces(val);
    if (trimmed && !qualifications.includes(trimmed)) {
      setQualifications([...qualifications, trimmed]);
      setNewQual('');
      setQualFocused(false);
      Keyboard.dismiss();
    }
  };

  // --- SAVE LOGIC ---
  const handleSave = async () => {
    Keyboard.dismiss();
    
    const finalAge = parseAgeOrDob(age);
    if (isNaN(finalAge) || finalAge < 18) {
      Alert.alert("Invalid Age", "You must be at least 18 years old. Please enter your age or date of birth (DD/MM/YYYY).");
      return;
    }

    setIsSaving(true);
    
    try {
      const updateData = {
        displayName: name,
        age: finalAge,
        location: { city: location },
        qualifications,
        personalDescription: purpose,
      };
      await wieUserService.updatePersonalDetails(updateData);

      await AsyncStorage.multiSet([
        ['userName', name],
        ['userAge', finalAge.toString()],
        ['userLocation', location],
        ['userQualifications', JSON.stringify(qualifications)],
        ['userPurpose', purpose],
        ['userPhotos', JSON.stringify(userPhotos)]
      ]);
      
      setIsSaving(false);
      triggerSuccessToast();
    } catch (e: any) { 
      setIsSaving(false);
      console.error("Error saving profile:", e);
      Alert.alert("Error", e.message || "Failed to save profile changes.");
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
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        <ScrollView 
          ref={scrollRef}
          contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}
          className="flex-1 px-6"
          keyboardShouldPersistTaps="always"
        >
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          
          <Text className="text-white text-3xl font-bold mb-8">Edit profile</Text>

          <View className="space-y-6">
            <View>
              <Text className="text-[#a8a29e] text-sm mb-2 ml-1">Name</Text>
              <TextInput value={name} onChangeText={setName} className="bg-[#18181b] text-white p-5 rounded-2xl border border-[#27272a]" placeholder="Name" placeholderTextColor="#71717a" />
            </View>

            <View>
              <Text className="text-[#a8a29e] text-sm mb-2 ml-1">Age</Text>
              <TextInput 
                value={age} 
                onChangeText={handleAgeChange} 
                className="bg-[#18181b] text-white p-5 rounded-2xl border border-[#27272a]" 
                placeholder="Age or DD/MM/YYYY" 
                placeholderTextColor="#71717a" 
              />
            </View>

            <View>
              <Text className="text-[#a8a29e] text-sm mb-2 ml-1">Location</Text>
              <TextInput value={location} onChangeText={setLocation} className="bg-[#18181b] text-white p-5 rounded-2xl border border-[#27272a]" placeholder="Enter location" placeholderTextColor="#71717a" />
            </View>

            <View className={`mb-2 relative ${shouldShowQualSuggestions ? 'z-50' : 'z-10'}`}>
              <Text className="text-[#a8a29e] text-sm mb-2 ml-1">Add qualifications</Text>
              <View className="bg-[#18181b] p-5 rounded-[24px] border border-[#27272a]">
                <View className="relative z-50 mb-4">
                  <View className="flex-row items-center bg-[#27272a] rounded-xl px-4 h-14">
                    <Ionicons name="search" size={18} color="#71717a" />
                    <TextInput
                      className="flex-1 ml-2 text-white h-full"
                      value={newQual}
                      onChangeText={setNewQual}
                      onFocus={() => setQualFocused(true)}
                      onBlur={() => setTimeout(() => setQualFocused(false), 200)}
                      onSubmitEditing={() => addQual(newQual)}
                      placeholder="Search qualifications"
                      placeholderTextColor="#71717a"
                    />
                    <TouchableOpacity onPress={() => addQual(newQual)}>
                       <Ionicons name="add" size={26} color="white" />
                    </TouchableOpacity>
                  </View>

                  {shouldShowQualSuggestions && (
                    <View className="absolute top-[60px] left-0 right-0 bg-[#27272a] rounded-xl border border-[#3f3f46] z-[999] overflow-hidden">
                      {filteredQualSuggestions.map((item) => (
                        <TouchableOpacity key={item} className="p-4 border-b border-[#3f3f46]" onPress={() => addQual(item)}>
                          <Text className="text-zinc-300 text-sm">{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                
                <View className="flex-row flex-wrap gap-2">
                  {qualifications.map((tag) => (
                    <View key={tag} className="flex-row items-center bg-[#09090b] px-4 py-2 rounded-xl border border-zinc-800">
                      <Text className="text-zinc-300 text-[13px] font-semibold mr-2">{tag}</Text>
                      <TouchableOpacity onPress={() => setQualifications(qualifications.filter(q => q !== tag))}>
                        <Ionicons name="close" size={14} color="#71717a" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View>
              <Text className="text-[#a8a29e] text-sm mb-2 ml-1">Describe your purpose</Text>
              <TextInput value={purpose} onChangeText={setPurpose} multiline className="bg-[#18181b] text-white p-5 rounded-3xl border border-[#27272a] h-32" textAlignVertical="top" placeholder="Your purpose..." placeholderTextColor="#71717a" />
            </View>

            <Text className="text-white text-xl font-bold mb-2">My photos</Text>
            <View className="flex-row flex-wrap gap-4 py-4">
              {userPhotos.map((uri, index) => (
                <View key={index} className="relative">
                  <Image source={{ uri }} className="w-24 h-32 rounded-[40px]" />
                  <TouchableOpacity 
                    onPress={() => {
                        const updated = userPhotos.filter((_, i) => i !== index);
                        setUserPhotos(updated);
                        AsyncStorage.setItem('userPhotos', JSON.stringify(updated));
                    }} 
                    className="absolute -top-1 -right-1 bg-[#27272a] rounded-full p-1.5 border border-[#09090b]"
                  >
                    <Ionicons name="close" size={14} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity onPress={() => router.push('/(protected)/(connection)/photos')} className="w-24 h-32 bg-[#18181b] rounded-[40px] items-center justify-center border border-dashed border-[#3f3f46]">
                <Ionicons name="add" size={24} color="#71717a" />
                <Text className="text-[#71717a] text-[11px] font-bold mt-2">Add photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row gap-4 mt-10">
            <TouchableOpacity onPress={() => router.back()} className="flex-1 h-16 rounded-full border border-[#27272a] items-center justify-center">
              <Text className="text-white font-semibold">Go back</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleSave} disabled={isSaving} className="flex-1 h-16 rounded-full overflow-hidden">
              <LinearGradient colors={['#937cf5', '#a855f7', '#8b5cf6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="w-full h-full items-center justify-center">
                {isSaving ? <ActivityIndicator color="white" /> : <Text className="text-white font-semibold">Save changes</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showSuccess && (
        <Animated.View 
          style={{ transform: [{ translateY: toastY }] }}
          className="absolute bottom-10 left-10 right-10 bg-zinc-900 border border-purple-500 py-4 px-6 rounded-2xl flex-row items-center justify-center"
        >
          <Ionicons name="checkmark-circle" size={20} color="#a855f7" />
          <Text className="text-white ml-2 font-semibold">Changes saved successfully!</Text>
        </Animated.View>
      )}
    </View>
  );
}
