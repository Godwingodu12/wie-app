import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
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
  ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

// Imports
import { CustomCalendar } from '@/components/Connection/Form/CustomCalendar';
import { GradientButton } from '@/components/Connection/UI/Buttons';
import { connectionService } from '@/services/connectionService';

// Types
type FieldErrors = Partial<{
  name: string;
  dob: string;
  location: string;
  qualifications: string;
  description: string;
}>;

const inputStyle = Platform.OS === 'web' 
  ? { outlineStyle: 'none', color: 'white' } 
  : { color: 'white' };

const DetailsScreen = () => {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  
  // --- STATES ---
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [dobString, setDobString] = useState(''); 
  const [showCalendar, setShowCalendar] = useState(false);
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [newQual, setNewQual] = useState('');
  const [qualFocused, setQualFocused] = useState(false);
  const qualBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  // --- CHECK EXISTING PROFILE ---
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await connectionService.getProfileStatus();
        if (response.success && response.isComplete) {
            router.replace('/(protected)/(connection)/ConnectionsScreen');
            return;
        }
      } catch (e) {
        console.log("Error checking profile status", e);
      } finally {
        setIsCheckingProfile(false);
      }
    };
    checkStatus();
  }, []);

  const QUALIFICATION_LIST = ['10th', '12th', 'Diploma', 'BA', 'BBA', 'BCom', 'BTech', 'MBA', 'MBBS', 'PhD', 'Engineer', 'Doctor', 'Teacher'];

  // --- LOGIC ---
  const handleDescriptionFocus = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const normalizeSpaces = (text: string) => text.trim().replace(/\s+/g, ' ');
  const normalizedQualQuery = normalizeSpaces(newQual);
  const filteredQualSuggestions = QUALIFICATION_LIST
    .filter((item) => item.toLowerCase().includes(normalizedQualQuery.toLowerCase()))
    .filter((item) => !qualifications.some((q) => q.toLowerCase() === item.toLowerCase()))
    .slice(0, 8);
  const shouldShowQualSuggestions = qualFocused && normalizedQualQuery.length > 0 && filteredQualSuggestions.length > 0;

  const isValidDobString = (value: string) => {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!match) return { ok: false as const, message: 'Invalid Date' };
    const d = Number(match[1]), m = Number(match[2]), y = Number(match[3]);
    if (d > 31 || m > 12 || y < 1900) return { ok: false as const, message: 'Invalid Date' };
    const candidate = new Date(y, m - 1, d);
    return { ok: true as const, date: candidate };
  };

  const handleNameChange = (text: string) => {
    const formatted = text.replace(/\s+/g, ' ').split(' ').map((w) => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '').join(' ');
    setName(formatted);
    if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
  };

  const handleManualDateChange = (text: string) => {
    let cleaned = text.replace(/\D/g, '');
    let masked = cleaned;
    if (cleaned.length > 2) masked = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length > 4) masked = masked.slice(0, 5) + '/' + cleaned.slice(4, 8);
    setDobString(masked);
    
    if (errors.dob) setErrors(prev => ({ ...prev, dob: undefined }));
    
    if (masked.length === 10) {
      const parsed = isValidDobString(masked);
      if (parsed.ok) setDob(parsed.date); else setDob(null);
    } else setDob(null);
  };

  const onDateSelectedFromCalendar = (date: Date) => {
    setDob(date);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    setDobString(`${day}/${month}/${year}`);
    setShowCalendar(false);
    if (errors.dob) setErrors(prev => ({ ...prev, dob: undefined }));
  };

  const addQual = (val: string) => {
    const trimmed = normalizeSpaces(val);
    if (!trimmed) { setErrors(prev => ({ ...prev, qualifications: 'Required' })); return; }
    if (!qualifications.includes(trimmed)) setQualifications([...qualifications, trimmed]);
    setNewQual('');
    setQualFocused(false);
    if (errors.qualifications) setErrors(prev => ({ ...prev, qualifications: undefined }));
  };

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // --- SAVE DATA AND NAVIGATE ---
  const handleNext = async () => {
    Keyboard.dismiss();
    const nextErrors: FieldErrors = {};
    let hasError = false;

    if (!normalizeSpaces(name)) { nextErrors.name = 'Name is required.'; hasError = true; }
    if (!normalizeSpaces(dobString)) { 
      nextErrors.dob = 'Date is required.'; 
      hasError = true; 
    } else if (dob) {
      const age = calculateAge(dob);
      if (age < 18) {
        nextErrors.dob = 'You must be at least 18 years old.';
        hasError = true;
      }
    } else {
      nextErrors.dob = 'Invalid date format.';
      hasError = true;
    }
    
    if (!normalizeSpaces(location)) { nextErrors.location = 'Location is required.'; hasError = true; }
    if (qualifications.length === 0) { nextErrors.qualifications = 'Required'; hasError = true; }
    
    setErrors(nextErrors);
    
    if (!hasError && dob) {
      setIsLoading(true);
      try {
        const calculatedAge = calculateAge(dob);
        // SAVE DATA TO ASYNC STORAGE
        await AsyncStorage.setItem('userName', name);
        await AsyncStorage.setItem('userAge', dobString); 
        await AsyncStorage.setItem('userLocation', location);
        await AsyncStorage.setItem('userQualifications', JSON.stringify(qualifications));
        await AsyncStorage.setItem('userDescription', description);

        // API CALL TO BACKEND
        const profileData = {
          displayName: name,
          dateOfBirth: dob,
          age: calculatedAge,
          gender: 'prefer-not-to-say', 
          location: {
            city: location,
            state: 'Unknown',
            country: 'Unknown',
            longitude: 0,
            latitude: 0,
            coordinates: {
              type: 'Point',
              coordinates: [0, 0]
            }
          },
          qualifications: qualifications,
          personalDescription: description,
          educationLevel: 'prefer-not-to-say'
        };

        try {
          await connectionService.updateOrCreateProfile(profileData);
        } catch (err) {
          console.log("Profile save failed:", err);
        }
        
        // Always push next to avoid blocking flow during development
        router.push('/(protected)/(connection)/photos');
      } catch (e) {
        console.error("Error saving data", e);
        // Fallback
        router.push('/(protected)/(connection)/photos');
      } finally {
        setIsLoading(false);
      }
    } else {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View className="flex-1">
          
          {/* HEADER */}
          <View className="flex-row items-center h-[60px] px-5 mb-2 shrink-0">
            <TouchableOpacity onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(protected)/(tabs)');
                }
            }}>
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <View className="flex-1 h-1 bg-[#1c1c1e] mx-[15px] rounded-sm">
              <View className="h-full bg-white rounded-sm w-[30%]" />
            </View>
            <Text className="text-[#4b5563] text-[13px] font-bold">02/07</Text>
          </View>

          <ScrollView 
            ref={scrollRef}
            className="flex-1 px-5"
            showsVerticalScrollIndicator={false} 
            keyboardShouldPersistTaps="always" 
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 150 }} 
          >
            <View className="my-5">
              <Text className="text-white text-[32px] font-bold leading-10">Add your{"\n"}Details...</Text>
              <Text className="text-[#57534e] text-base mt-1">Add your age, location, and qualifications</Text>
            </View>

            {/* NAME INPUT */}
            <View className="mb-5 z-0">
              <Text className="text-[#a8a29e] text-sm mb-2">Name</Text>
              <View className={`h-14 bg-[#0c0a09] rounded-xl flex-row items-center px-[15px] border ${errors.name ? 'border-red-500' : 'border-[#27272a]'}`}>
                <TextInput 
                  className="flex-1 text-base text-white"
                  value={name} 
                  onChangeText={handleNameChange}
                  placeholder="Enter name"
                  placeholderTextColor="#4b5563"
                  style={inputStyle as any} 
                />
              </View>
              {!!errors.name && <Text className="text-red-500 text-xs mt-1.5 ml-1">{errors.name}</Text>}
              <Text className="text-[#4b5563] text-xs mt-1">This name is visible for other user in this section</Text>
            </View>

            {/* DATE OF BIRTH */}
            <View className="mb-5 z-0">
              <Text className="text-[#a8a29e] text-sm mb-2">Date of Birth</Text>
              <View className={`h-14 bg-[#0c0a09] rounded-xl flex-row items-center px-[15px] border ${errors.dob ? 'border-red-500' : 'border-[#27272a]'}`}>
                <TextInput 
                  className="flex-1 text-base text-white"
                  value={dobString} 
                  onChangeText={handleManualDateChange}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#4b5563"
                  keyboardType="number-pad"
                  maxLength={10}
                  style={inputStyle as any}
                />
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowCalendar(true); }} className="p-1.5">
                  <Ionicons name="calendar-outline" size={22} color={errors.dob ? "#ef4444" : "#fff"} />
                </TouchableOpacity>
              </View>
              {!!errors.dob && <Text className="text-red-500 text-xs mt-1.5 ml-1">{errors.dob}</Text>}
              <Text className="text-[#eab308] text-xs mt-1">This is not visible for other users</Text>
            </View>

            {/* LOCATION */}
            <View className="mb-5 z-0">
              <Text className="text-[#a8a29e] text-sm mb-2">Location</Text>
              <View className={`h-14 bg-[#0c0a09] rounded-xl flex-row items-center px-[15px] border ${errors.location ? 'border-red-500' : 'border-[#27272a]'}`}>
                <TextInput 
                  className="flex-1 text-base text-white"
                  placeholder="Enter your location" 
                  placeholderTextColor="#4b5563"
                  value={location}
                  onChangeText={(t) => {
                    setLocation(t);
                    if (errors.location) setErrors(prev => ({ ...prev, location: undefined }));
                  }}
                  style={inputStyle as any}
                />
              </View>
              {!!errors.location && <Text className="text-red-500 text-xs mt-1.5 ml-1">{errors.location}</Text>}
            </View>

            {/* QUALIFICATIONS */}
            <View className={`mb-5 relative ${shouldShowQualSuggestions ? 'z-50' : 'z-10'}`}>
              <Text className="text-[#a8a29e] text-sm mb-2">Add qualifications</Text>
              <View className={`bg-[#0c0a09] rounded-3xl p-4 overflow-visible border ${errors.qualifications ? 'border-red-500' : 'border-[#27272a]'}`}>
                <View className="relative z-50 mb-3">
                  <View className="h-[50px] bg-[#1c1c1e] rounded-xl flex-row items-center px-3">
                    <Ionicons name="school-outline" size={20} color="#4b5563" />
                    <TextInput
                      className="flex-1 ml-2.5 text-sm text-white"
                      placeholder="Add qualification"
                      placeholderTextColor="#4b5563"
                      value={newQual}
                      onChangeText={(t) => { setNewQual(t); if (errors.qualifications) setErrors(prev => ({ ...prev, qualifications: undefined })); }}
                      onFocus={() => { if (qualBlurTimer.current) clearTimeout(qualBlurTimer.current); setQualFocused(true); }}
                      onBlur={() => { qualBlurTimer.current = setTimeout(() => setQualFocused(false), 200); }}
                      onSubmitEditing={() => addQual(newQual)}
                      returnKeyType="done"
                      autoCorrect={false}
                      style={inputStyle as any}
                    />
                    <TouchableOpacity onPress={() => addQual(newQual)} className="w-11 h-11 rounded-xl items-center justify-center ml-1">
                      <Ionicons name="add" size={26} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  {shouldShowQualSuggestions && (
                    <View className="absolute top-[56px] left-0 right-0 bg-[#1c1c1e] rounded-xl border border-[#333] z-[2000] overflow-hidden shadow-lg">
                      {filteredQualSuggestions.map((item) => (
                        <TouchableOpacity
                          key={item}
                          className="p-[15px] border-b border-[#2c2c2e]"
                          onPress={() => addQual(item)}
                          activeOpacity={0.7}
                        >
                          <Text className="text-[#d1d5db] text-[15px]">{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View className="flex-row flex-wrap mb-2">
                  {qualifications.map((item, index) => (
                    <View key={index} className="flex-row items-center bg-black border border-[#1c1c1e] rounded-[10px] px-3 py-2 mr-2 mb-2">
                      <Text className="text-[#d1d5db] mr-2">{item}</Text>
                      <TouchableOpacity onPress={() => setQualifications(qualifications.filter((_, i) => i !== index))}>
                        <Ionicons name="close" size={14} color="#4b5563" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
              {!!errors.qualifications && <Text className="text-red-500 text-xs mt-1.5 ml-1">{errors.qualifications}</Text>}
            </View>

            {/* DESCRIPTION */}
            <View className="mb-5 z-0">
              <Text className="text-[#a8a29e] text-sm mb-2">Personal description (Optional)</Text>
              <View className="h-[120px] bg-[#0c0a09] rounded-xl flex-row items-start pt-3 px-[15px] border border-[#27272a]">
                <TextInput 
                  className="flex-1 text-base text-white"
                  placeholder="Describe yourself here.." 
                  placeholderTextColor="#4b5563"
                  multiline
                  value={description}
                  onChangeText={setDescription}
                  onFocus={handleDescriptionFocus}
                  textAlignVertical="top"
                  style={inputStyle as any}
                />
              </View>
            </View>
          </ScrollView>

          {/* FOOTER */}
          <View className="bg-black pt-2 pb-5 px-5">
            <GradientButton 
              title={isLoading ? "Saving..." : "Next"} 
              onPress={handleNext} 
            />
          </View>

        </View>
      </KeyboardAvoidingView>

      <CustomCalendar 
        visible={showCalendar} 
        selectedDate={dob || new Date()} 
        maxDate={new Date()}
        onClose={() => setShowCalendar(false)} 
        onSelectDate={onDateSelectedFromCalendar} 
      />
    </SafeAreaView>
  );
};

export default DetailsScreen;
