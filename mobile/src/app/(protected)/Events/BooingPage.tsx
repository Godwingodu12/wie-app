import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { EventFooterButtons } from '@/components/Events/EventButton';

// Import your data constant
import { EVENT_DATA } from '@/constants/eventDetails'; 

// Helper to convert "$1,499" string to number 1499
const parsePrice = (priceString: string) => {
  return Number(priceString.replace(/[^0-9.-]+/g, ""));
};

const STICKER_AVATARS = [
  require('@/assets/images/man2.png'), 
  require('@/assets/images/man.png'),
];

const BookingPage = () => {
  const insets = useSafeAreaInsets();
  const [count, setCount] = useState(1);

  // Get dynamic data from Code 2
  const unitPrice = parsePrice(EVENT_DATA.about.price);
  const totalPrice = count * unitPrice;

  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => (prev > 1 ? prev - 1 : 1));

  const renderCharacters = () => {
    const maxVisible = 5;
    const displayCount = Math.min(count, maxVisible);
    const extraCount = count - maxVisible;

    return (
      <View className="flex-row flex-wrap justify-center items-end px-10 min-h-[160px]">
        {[...Array(displayCount)].map((_, i) => (
          <Image
            key={i}
            source={STICKER_AVATARS[i % 2]} 
            className="w-32 h-40"
            style={{ 
                marginLeft: i === 0 ? 0 : -45, 
                zIndex: i,
                transform: [{ rotate: i % 2 === 0 ? '-3deg' : '3deg' }]
            }} 
            resizeMode="contain"
          />
        ))}

        {extraCount > 0 && (
          <View 
            className="bg-gray-800 rounded-full items-center justify-center border border-gray-600 mb-6 ml-2"
            style={{ width: 52, height: 52, zIndex: 100, elevation: 5 }}
          >
            <Text className="text-white font-rubik-bold text-sm">+{extraCount}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-black px-4" style={{ paddingTop: insets.top }}>
      {/* --- HEADER --- */}
      <View className="flex-row items-center mb-6">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-full bg-gray-900 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-rubik-bold ml-4">Who&apos;s going</Text>
      </View>

      {/* --- DYNAMIC EVENT INFO CARD --- */}
      <View className="flex-row mb-6">
        <Image 
          source={{ uri: EVENT_DATA.headerImage }} 
          className="w-24 h-24 rounded-2xl" 
        />
        <View className="ml-4 justify-center flex-1">
          <Text className="text-white text-lg font-rubik-bold mb-1" numberOfLines={1}>
            {EVENT_DATA.title}
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={14} color="#8B5CF6" />
            <Text className="text-gray-400 text-xs ml-2">{EVENT_DATA.about.dateTime}</Text>
          </View>
          <View className="flex-row items-center mt-1">
            <Ionicons name="location-outline" size={14} color="#8B5CF6" />
            <Text className="text-gray-400 text-xs ml-2" numberOfLines={1}>
               {EVENT_DATA.about.address}
            </Text>
          </View>
        </View>
      </View>

      {/* --- DYNAMIC PRICE BANNER --- */}
      <View className="bg-gray-900/40 py-4 rounded-2xl items-center mb-8 border border-gray-800">
        <Text className="text-gray-400">
          <Text className="text-green-400 font-rubik-bold text-lg">
            {EVENT_DATA.about.price}{' '} 
          </Text>
          Per tickets
        </Text>
      </View>

      {/* --- STICKER VISUALIZATION --- */}
      <View className="flex-1 justify-center items-center">
        {renderCharacters()}
      </View>

      {/* --- COUNTER --- */}
      <View className="flex-row justify-center items-center gap-12 mt-4">
        <TouchableOpacity 
          onPress={decrement}
          className="w-14 h-14 bg-gray-800 rounded-2xl items-center justify-center"
        >
          <Ionicons name="remove" size={32} color="white" />
        </TouchableOpacity>

        <Text className="text-white text-5xl font-rubik-bold">{count}</Text>

        <TouchableOpacity 
          onPress={increment}
          className="w-14 h-14 bg-gray-800 rounded-2xl items-center justify-center"
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      </View>

      {/* --- TOTAL SUMMARY --- */}
      <View className="mt-10 mb-8 items-center">
        <Text className="text-gray-400 text-lg">Total amount</Text>
        <Text className="text-white text-5xl font-rubik-bold mt-1">
            ${totalPrice.toLocaleString()}
        </Text>
      </View>

      {/* --- FOOTER --- */}
      <View style={{ paddingBottom: insets.bottom + 10 }}>
        <EventFooterButtons
          leftText="Cancel"
          onLeftPress={() => router.back()}
          rightText={`Pay $${totalPrice.toLocaleString()}`}
          rightIcon="ticket"
          rightColors={['#8B5CF6', '#6366F1']}
          onRightPress={() => console.log("Booking", count, "tickets for", EVENT_DATA.title)}
        />
      </View>
    </View>
  );
};

export default BookingPage;
