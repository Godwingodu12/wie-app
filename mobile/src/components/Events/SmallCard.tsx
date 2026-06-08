import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface SmallArtistCardProps {
  image: string;
  title: string;
  date: string;
  location: string;
  attendees?: string[];
  onPress?: () => void;
}

const SmallArtistCard = ({ image, title, date, location, attendees = [], onPress }: SmallArtistCardProps) => {
  const [liked, setLiked] = useState(false);

  const safeAttendees = Array.isArray(attendees) ? attendees : [];

  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={onPress}
      className="w-64 bg-[#1A1A1A] rounded-[32px] p-3 shadow-xl"
    >
      <View className="relative">
        <Image
          source={{ uri: image }}
          className="w-full h-56 rounded-[24px]"
          resizeMode="cover"
        />
        <TouchableOpacity 
          onPress={() => setLiked(!liked)}
          className="absolute top-3 right-3 bg-black/40 p-2 rounded-full"
        >
          <Ionicons name={liked ? "heart" : "heart-outline"} size={18} color={liked ? "#2979FF" : "white"} />
        </TouchableOpacity>
      </View>

      <View className="mt-3 px-1">
        <Text className="text-white text-lg font-bold mb-3" numberOfLines={1}>{title}</Text>
        
        <View className="flex-row items-center mb-2">
          <View className="bg-[#2A2D35] p-1.5 rounded-lg mr-2">
            <MaterialCommunityIcons name="calendar" size={14} color="#2979FF" />
          </View>
          <Text className="text-gray-400 text-xs font-medium">{date}</Text>
        </View>

        <View className="flex-row items-start mb-4">
          <View className="bg-[#2A2D35] p-1.5 rounded-lg mr-2">
            <Ionicons name="location" size={14} color="#2979FF" />
          </View>
          <Text className="text-gray-400 text-xs font-medium flex-1 pt-0.5" numberOfLines={2}>{location}</Text>
        </View>

        {safeAttendees.length > 0 && (
          <View className="flex-row items-center ml-2">
            {safeAttendees.map((url, index) => (
              <View 
                key={index} 
                className="w-8 h-8 rounded-full border-2 border-[#121417] -ml-2 overflow-hidden"
                style={{ zIndex: safeAttendees.length - index }}
              >
                <Image source={{ uri: url }} className="w-full h-full" />
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default SmallArtistCard;
