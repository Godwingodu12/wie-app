import React, { useRef, useState, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from '@/components/UI/MapViewWrapper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

// Import Custom Components 
import { GreenAddButton, SquareIconButton } from '@/components/Connection/UI/Buttons';
import { CustomCalendar } from '@/components/Connection/Form/CustomCalendar';
import { MapModal } from '@/components/Connection/UI/MapModal';

const inputStyle = Platform.OS === 'web' 
  ? { outlineStyle: 'none', color: 'white' } 
  : { color: 'white' };

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#000000" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#000000" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#1c1c1c" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

const DestinationsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const miniMapRef = useRef<MapView>(null);

  const [destinations, setDestinations] = useState<string[]>([]); 
  const [locationInput, setLocationInput] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [dateInput, setDateInput] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [errors, setErrors] = useState<{ location?: string; date?: string }>({});

  useFocusEffect(
    useCallback(() => {
      const loadPersistedData = async () => {
        try {
          const savedDests = await AsyncStorage.getItem('user_destinations');
          const savedDate = await AsyncStorage.getItem('user_travel_date');
          if (savedDests) setDestinations(JSON.parse(savedDests));
          if (savedDate) setDateInput(savedDate);
        } catch (e) {
          console.error("Failed to load destinations", e);
        }
      };
      loadPersistedData();
    }, [])
  );

  // 🔥 Format date as user types (DD/MM/YYYY)
  const handleDateChange = (text: string) => {
    // Remove any non-numerical characters
    let cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;

    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }

    setDateInput(formatted);
    if (errors.date) setErrors(prev => ({ ...prev, date: undefined }));
  };

  const onDateSelected = (date: Date) => {
    if (!date) return;
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    setDateInput(`${d}/${m}/${y}`);
    setErrors(prev => ({ ...prev, date: undefined }));
    setShowCalendar(false);
  };

  const getSelectedDateObj = () => {
    if (dateInput && dateInput.length === 10) {
      const [d, m, y] = dateInput.split('/').map(Number);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return new Date(y, m - 1, d);
    }
    return new Date();
  };

  const handleAddLocation = () => {
    setErrors(prev => ({ ...prev, location: undefined }));
    const trimmedLoc = locationInput.trim();
    if (!trimmedLoc) {
      if (destinations.length === 0) setErrors(prev => ({ ...prev, location: "Please enter a location." }));
      return;
    }
    if (destinations.length >= 5) {
      setErrors(prev => ({ ...prev, location: "Limit reached (Max 5)." }));
      return;
    }
    setDestinations([...destinations, trimmedLoc]);
    setLocationInput('');
    setSelectedCoords(null);
    Keyboard.dismiss();
  };

  const removeDestination = (index: number) => {
    setDestinations(destinations.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    // Basic date validation (length check)
    if (destinations.length === 0 || dateInput.length < 10) {
      setErrors({
        location: destinations.length === 0 ? "Add at least one location" : undefined,
        date: dateInput.length < 10 ? "Enter full date (DD/MM/YYYY)" : undefined
      });
      return;
    }
    
    try {
      await AsyncStorage.setItem('user_destinations', JSON.stringify(destinations));
      await AsyncStorage.setItem('user_travel_date', dateInput);
      await AsyncStorage.setItem('travel_step_reached', '2');
      router.push('/(protected)/(connection)/connection'); 
    } catch (e) { 
      console.error(e); 
    }
  };

  const handleMapSelection = (data: { address: string; latitude: number; longitude: number }) => {
    setLocationInput(data.address);
    setSelectedCoords({ latitude: data.latitude, longitude: data.longitude });
    setErrors(prev => ({...prev, location: undefined}));
    miniMapRef.current?.animateToRegion({
      latitude: data.latitude,
      longitude: data.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  };

  return (
    <View className="flex-1 bg-[#09090b]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View className="flex-1" style={{ paddingTop: insets.top }}>
          
          <View className="flex-row items-center h-[60px] px-5 mb-2">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <View className="flex-1 h-1 bg-[#1c1c1e] mx-[15px] rounded-sm">
              <View className="h-full bg-white rounded-sm w-[28%]" />
            </View>
            <Text className="text-[#a8a29e] text-[13px] font-semibold">02/07</Text>
          </View>

          <ScrollView ref={scrollRef} className="flex-1 px-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 150 }}>
            <View className="my-5">
              <Text className="text-white text-[15px] font-bold leading-9">Did you have any specific destinations, or are you planning for a travel?</Text>
            </View>

            <View className="flex-row flex-wrap gap-3 mb-8">
              {destinations.map((dest, index) => (
                <View key={index} className="flex-row items-center bg-[#1c1c1e] px-4 py-3 rounded-xl border border-[#27272a]">
                  <Text className="text-white font-medium mr-2">{dest}</Text>
                  <TouchableOpacity onPress={() => removeDestination(index)}>
                    <Ionicons name="close" size={16} color="#71717a" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View className="mb-5">
              <Text className="text-[#a8a29e] text-sm mb-2">Location</Text>
              <View className="flex-row items-center mb-4">
                <View className={`flex-1 h-14 bg-[#0c0a09] rounded-xl flex-row items-center px-[15px] border ${errors.location ? 'border-red-500' : 'border-[#27272a]'}`}>
                  <TextInput 
                    className="flex-1 text-base text-white"
                    placeholder="City/Region, Country" 
                    placeholderTextColor="#4b5563"
                    value={locationInput}
                    onChangeText={(t) => {
                      setLocationInput(t);
                      if (errors.location) setErrors(prev => ({ ...prev, location: undefined }));
                    }}
                    style={inputStyle as any}
                  />
                </View>
                
                {locationInput.length > 0 ? (
                  <TouchableOpacity 
                    onPress={handleAddLocation}
                    className="ml-3 w-14 h-14 bg-[#27272a] rounded-xl items-center justify-center border border-[#3f3f46]"
                  >
                    <Ionicons name="checkmark-sharp" size={28} color="white" />
                  </TouchableOpacity>
                ) : (
                  <SquareIconButton icon="map-outline" onPress={() => setShowMap(true)} />
                )}
              </View>

              <View className="w-full h-[150px] bg-[#18181b] rounded-2xl overflow-hidden border border-[#27272a]">
                <MapView
                  ref={miniMapRef}
                  style={{ width: '100%', height: '100%' }}
                  customMapStyle={darkMapStyle}
                  region={selectedCoords ? { ...selectedCoords, latitudeDelta: 0.01, longitudeDelta: 0.01 } : { latitude: 10.0159, longitude: 76.3419, latitudeDelta: 10, longitudeDelta: 10 }}
                  liteMode={true} 
                >
                  {selectedCoords && <Marker coordinate={selectedCoords} pinColor="#8b5cf6" />}
                </MapView>
              </View>
              {errors.location && <Text className="text-red-500 text-xs mt-2 ml-1">{errors.location}</Text>}
            </View>

            <View className="mb-8">
              <Text className="text-[#a8a29e] text-sm mb-2">Date of visit</Text>
              <View className={`h-14 bg-[#0c0a09] rounded-xl flex-row items-center px-[15px] border ${errors.date ? 'border-red-500' : 'border-[#27272a]'}`}>
                {/* 🔥 Manual Typing Enabled Here */}
                <TextInput 
                  className="flex-1 text-base text-white" 
                  value={dateInput} 
                  onChangeText={handleDateChange}
                  keyboardType="numeric"
                  maxLength={10}
                  placeholder="DD/MM/YYYY" 
                  placeholderTextColor="#4b5563" 
                />
                <TouchableOpacity onPress={() => setShowCalendar(true)}>
                  <Ionicons name="calendar-outline" size={22} color="#71717a" />
                </TouchableOpacity>
              </View>
              {errors.date && <Text className="text-red-500 text-xs mt-2 ml-1">{errors.date}</Text>}
            </View>

            <View className="items-center mb-2">
              <GreenAddButton title="Add more locations" onPress={handleAddLocation} />
              <Text className="text-[#52525b] text-xs mt-3">You can add maximum 5 locations</Text>
            </View>
          </ScrollView>

          <View className="px-5 pt-2" style={{ paddingBottom: insets.bottom + 15 }}>
            <TouchableOpacity onPress={handleNext} activeOpacity={0.9}>
              <LinearGradient
                colors={['#937cf5', '#a855f7', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text className="text-white font-bold text-lg">Next</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>

      <MapModal visible={showMap} onClose={() => setShowMap(false)} onSelectLocation={handleMapSelection} />
      <CustomCalendar visible={showCalendar} onClose={() => setShowCalendar(false)} onSelectDate={onDateSelected} selectedDate={getSelectedDateObj()} />
    </View>
  );
};

export default DestinationsScreen;
