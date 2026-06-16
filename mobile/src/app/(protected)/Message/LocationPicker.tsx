import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { chatService } from '@/services/chatService';

interface Place {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

const LocationPicker = () => {
  const { chatId } = useLocalSearchParams();
  const [region, setRegion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [isLiveLocationSharing, setIsLiveLocationSharing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const isEnabled = await Location.hasServicesEnabledAsync();
        if (!isEnabled) {
          console.warn("Location services are disabled");
          setLoading(false);
          return;
        }

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLoading(false);
          return;
        }

        // Try high accuracy first, fallback to balanced if it fails
        let location;
        try {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        } catch (e) {
          console.warn("High accuracy location failed, trying low accuracy...");
          location = await Location.getLastKnownPositionAsync({});
          if (!location) {
            location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Low,
            });
          }
        }

        if (!location) throw new Error("Could not get current location");

        const initialRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(initialRegion);
        
        // Mock nearby places based on current location
        setNearbyPlaces([
          { 
            id: '1', 
            name: 'Cherpulassery', 
            address: 'Cherpulassery Municipal Bus Stand, Cherpulassery, 679341, KL, IN',
            latitude: location.coords.latitude + 0.001,
            longitude: location.coords.longitude + 0.001
          },
          { 
            id: '2', 
            name: 'Nahdi Kuzhimanthi', 
            address: 'Shornur-Perinthalmanna Rd, Perinthalmanna, 679322, KL, IN',
            latitude: location.coords.latitude - 0.001,
            longitude: location.coords.longitude - 0.001
          },
          { 
            id: '3', 
            name: 'Town Center', 
            address: 'Main Road, Cherpulassery, Kerala',
            latitude: location.coords.latitude + 0.002,
            longitude: location.coords.longitude - 0.002
          },
        ]);
      } catch (err) {
        console.error("Location Picker Error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSendLiveLocation = async () => {
    if (!region) return;
    
    try {
      // Send a message of type 'live_location'
      // Standard live location expiry is usually 1 hour, but we can set it via body
      const oneHourLater = new Date();
      oneHourLater.setHours(oneHourLater.getHours() + 1);
      
      await (chatService as any).sendLocation(chatId as string, region.latitude, region.longitude, undefined, { 
        name: 'Live Location', 
        address: 'Sharing live...',
        isLive: true,
        liveExpiry: oneHourLater.toISOString()
      });
      router.back();
    } catch (error) {
      console.error('Failed to send live location:', error);
    }
  };

  const handleSendLocation = async (place?: Place) => {
    if (!region && !place) return;
    const lat = place ? place.latitude : region.latitude;
    const lng = place ? place.longitude : region.longitude;
    const name = place ? place.name : 'Current Location';
    const address = place ? place.address : 'Near your location';

    try {
      await (chatService as any).sendLocation(chatId as string, lat, lng, undefined, { name, address });
      router.back();
    } catch (error) {
      console.error('Failed to send location:', error);
    }
  };

  const mapStyle = [
    {
      "elementType": "geometry",
      "stylers": [{ "color": "#212121" }]
    },
    {
      "elementType": "labels.icon",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#757575" }]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#212121" }]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry",
      "stylers": [{ "color": "#757575" }]
    },
    {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [{ "color": "#18181b" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#2c2c2e" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{ "color": "#000000" }]
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/5">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-rubik-bold">Send location</Text>
        </View>
        <View className="flex-row items-center gap-5">
          <TouchableOpacity>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="search" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map View */}
      <View className="h-[240px] w-full bg-zinc-900 overflow-hidden">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#8b5cf6" />
          </View>
        ) : region ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={region}
            customMapStyle={mapStyle}
          >
            <Marker coordinate={region}>
              <View className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center">
                <View className="w-4 h-4 bg-primary rounded-full border-2 border-white" />
              </View>
            </Marker>
          </MapView>
        ) : null}
      </View>

      {/* Options List */}
      <FlatList
        data={nearbyPlaces}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <TouchableOpacity 
              className="flex-row items-center px-5 py-4 gap-4"
              onPress={() => handleSendLiveLocation()}
            >
              <View className="w-12 h-12 rounded-full border border-white/10 items-center justify-center bg-zinc-900">
                <MaterialCommunityIcons name="map-marker-radius" size={24} color="#A855F7" />
              </View>
              <Text className="text-white text-[16px] font-rubik-medium">Share live location</Text>
            </TouchableOpacity>

            <View className="h-[1px] bg-white/5 mx-5" />
            
            <View className="px-5 py-4">
              <Text className="text-zinc-500 text-sm font-rubik-bold mb-4 uppercase tracking-wider">Nearby places</Text>
              
              <TouchableOpacity 
                className="flex-row items-center gap-4 mb-2"
                onPress={() => handleSendLocation()}
              >
                <View className="w-12 h-12 rounded-full border border-white/10 items-center justify-center bg-zinc-900">
                   <MaterialCommunityIcons name="account-location" size={24} color="#A855F7" />
                </View>
                <View>
                  <Text className="text-white text-[16px] font-rubik-medium">Send your current location</Text>
                  <Text className="text-zinc-500 text-xs mt-0.5">Accurate to {region?.latitudeDelta ? (region.latitudeDelta * 111).toFixed(0) : '...'} meters</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            className="flex-row items-center px-5 py-3 gap-4"
            onPress={() => handleSendLocation(item)}
          >
            <View className="w-12 h-12 rounded-full border border-white/10 items-center justify-center bg-zinc-900">
              <Ionicons name="location" size={22} color="#A855F7" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-[16px] font-rubik-medium">{item.name}</Text>
              <Text className="text-zinc-500 text-xs mt-0.5" numberOfLines={1}>{item.address}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export default LocationPicker;
