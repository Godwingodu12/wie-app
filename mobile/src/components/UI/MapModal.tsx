import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState, useRef } from 'react';
import { 
  ActivityIndicator, 
  Keyboard, 
  Modal, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Region } from './MapViewWrapper';

// --- UPDATED INTERFACE: Now accepts an object with coords ---
interface MapModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (data: { address: string; latitude: number; longitude: number }) => void;
}

export const MapModal = ({ visible, onClose, onSelectLocation }: MapModalProps) => {
  const mapRef = useRef<MapView>(null);
  
  // Default: San Francisco
  const [region, setRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.015,
    longitudeDelta: 0.0121,
  });

  const [searchText, setSearchText] = useState('');
  const [detectedAddress, setDetectedAddress] = useState("Move map to select location");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingAddress, setLoadingAddress] = useState(false);

  useEffect(() => {
    if (visible) {
      locateUser();
    }
  }, [visible]);

  const locateUser = async () => {
    setIsSearching(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        mapRef.current?.animateToRegion(newRegion, 1000);
        setRegion(newRegion);
        fetchAddressForCoords(newRegion.latitude, newRegion.longitude);
      }
    } catch (e) {
      console.log("Error getting location", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    Keyboard.dismiss();
    setIsSearching(true);

    try {
      const results = await Location.geocodeAsync(searchText);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        mapRef.current?.animateToRegion(newRegion, 1000);
        setRegion(newRegion);
        fetchAddressForCoords(latitude, longitude);
      } else {
        alert("Location not found");
      }
    } catch (error) {
      alert("Error searching location");
    } finally {
      setIsSearching(false);
    }
  };

  const fetchAddressForCoords = async (lat: number, lng: number) => {
    setLoadingAddress(true);
    try {
      const address = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (address.length > 0) {
        const place = address[0];
        const parts = [
          place.name !== place.city ? place.name : null,
          place.street,
          place.city,
          place.region,
          place.country
        ].filter(Boolean); 
        setDetectedAddress([...new Set(parts)].join(', '));
      } else {
        setDetectedAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch (e) {
      setDetectedAddress("Unknown Location");
    } finally {
      setLoadingAddress(false);
    }
  };

  const onRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    // Note: You might want to debounce this call in production
    fetchAddressForCoords(newRegion.latitude, newRegion.longitude);
  };

  const confirmLocation = () => {
    // --- FIX: Pass back Object with Address AND Coords ---
    onSelectLocation({
      address: detectedAddress || searchText || "Selected Location",
      latitude: region.latitude,
      longitude: region.longitude
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View className="flex-1 bg-black relative">
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={region}
          onRegionChangeComplete={onRegionChangeComplete}
          showsUserLocation={true}
          userInterfaceStyle="dark"
        />

        <View className="absolute top-0 bottom-0 left-0 right-0 justify-center items-center pointer-events-none pb-9">
          <Ionicons name="location" size={48} color="#ef4444" /> 
        </View>

        <SafeAreaView className="absolute top-0 left-0 right-0 z-20">
          <View className="px-5 pt-2 pb-2 flex-row gap-3 items-center">
            <View className="flex-1 h-12 bg-white rounded-lg flex-row items-center px-3 shadow-md border border-gray-200">
              <TouchableOpacity onPress={handleSearch}>
                <Ionicons name="search" size={20} color="#71717a" />
              </TouchableOpacity>
              <TextInput 
                className="flex-1 ml-2 text-black text-base h-full"
                placeholder="Search here..."
                placeholderTextColor="#a1a1aa"
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Ionicons name="close-circle" size={18} color="#d4d4d8" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={onClose} className="bg-black/60 h-10 w-10 rounded-full items-center justify-center backdrop-blur-md">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <TouchableOpacity onPress={locateUser} className="absolute right-5 bottom-[220px] bg-white w-12 h-12 rounded-full items-center justify-center shadow-lg z-10">
          <Ionicons name="locate" size={26} color="#000" />
        </TouchableOpacity>

        <View className="absolute bottom-0 left-0 right-0 bg-[#1c1c1e] rounded-t-[24px] p-6 shadow-2xl border-t border-[#27272a]">
          <Text className="text-[#a1a1aa] text-xs font-bold uppercase mb-2">Select Location</Text>
          <View className="flex-row items-start mb-6">
            <Ionicons name="location" size={24} color="#6366f1" style={{ marginTop: 2, marginRight: 10 }} />
            <View className="flex-1">
              {isLoadingAddress ? (
                <Text className="text-white text-lg font-medium">Locating...</Text>
              ) : (
                <Text className="text-white text-lg font-medium leading-6" numberOfLines={2}>
                  {detectedAddress}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={confirmLocation} className="h-14 bg-[#6366f1] rounded-full flex-row items-center justify-center shadow-lg shadow-indigo-500/30">
            <Text className="text-white text-lg font-bold mr-2">Confirm Location</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
