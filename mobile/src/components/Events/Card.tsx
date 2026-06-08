import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface EventCardProps {
  image: any;
  title: string;
  date: string;
  time: string;
  location: string;
  isFree: boolean;
  stats: {
    likes: number;
    attendees: number;
    shares: number;
  };
  onPress?: () => void;
}

const EventCard = ({ image, title, date, time, location, isFree, stats = { likes: 0, attendees: 0, shares: 0 }, onPress }: EventCardProps) => {
  const { width } = useWindowDimensions();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(stats?.likes || 0);
  const isSmallScreen = width < 380;
  const imageSize = width * 0.6;

  const handleLike = () => {
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    setLiked(!liked);
  };

  const safeStats = stats || { likes: 0, attendees: 0, shares: 0 };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="bg-[#1A1A1A] rounded-[32px] overflow-hidden mb-6 mx-3 p-4"
    >
      <View className="relative">
        <Image
          source={typeof image === 'string' ? { uri: image } : image}
          style={{ height: imageSize }}
          className="w-full rounded-[24px]"
          resizeMode="cover"
        />
        <TouchableOpacity
          onPress={handleLike}
          className="absolute top-4 right-4 bg-black/40 p-2 rounded-full"
        >
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={isSmallScreen ? 20 : 24}
            color={liked ? "#2979FF" : "white"}
          />
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center justify-between mt-4 px-1">
        <View className="flex-row items-center flex-1 justify-between max-w-[75%]">
          <TouchableOpacity onPress={handleLike} className="flex-row items-center">
            <Ionicons name={liked ? "heart" : "heart-outline"} size={18} color={liked ? "#2979FF" : "white"} />
            <Text className="text-gray-300 font-rubik-medium ml-1 text-xs">{likeCount.toLocaleString()}</Text>
          </TouchableOpacity>

          <View className="flex-row items-center">
            <Ionicons name="people" size={18} color="white" />
            <Text className="text-gray-300 font-rubik-medium ml-1 text-xs">{(safeStats.attendees || 0).toLocaleString()}</Text>
          </View>

          <View className="flex-row items-center">
            <Ionicons name="paper-plane-outline" size={16} color="white" />
            <Text className="text-gray-300 font-rubik-medium ml-1 text-xs">{safeStats.shares || 0}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => setBookmarked(!bookmarked)}>
          <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={22} color="white" />
        </TouchableOpacity>
      </View>
      <Text
        className={`${isSmallScreen ? 'text-xl' : 'text-2xl'} text-white font-rubik-bold mt-4 px-1`}
        numberOfLines={2}
      >
        {title}
      </Text>
      <View className="flex-row flex-wrap justify-between items-end mt-3 px-1">
        <View className="flex-1 mr-2">
          <View className="flex-row flex-wrap items-center">
            <View className="flex-row items-center mr-3 mb-1">
              <Ionicons name="calendar" size={14} color="#2979FF" />
              <Text className="text-gray-400 font-rubik-medium text-[11px] ml-1">{date.toUpperCase()}</Text>
            </View>
            <View className="flex-row items-center mb-1">
              <Ionicons name="time-outline" size={14} color="#2979FF" />
              <Text className="text-gray-400 font-rubik-medium text-[11px] ml-1">{time}</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap items-center mt-1">
            <View className="flex-row items-center mr-3 mb-1">
              <MaterialCommunityIcons name="ticket-confirmation" size={15} color="#2979FF" />
              <Text className="text-gray-400 font-rubik text-[11px] ml-1">{isFree ? 'Free' : 'Paid'}</Text>
            </View>
            <View className="flex-row items-center mb-1 flex-1">
              <Ionicons name="location" size={14} color="#2979FF" />
              <Text className="text-gray-400 font-rubik text-[11px] ml-1" numberOfLines={1}>{location}</Text>
            </View>
          </View>
        </View>
        <View className="flex-row items-center mb-1">
          {/* Real attendee avatars would go here if provided by API */}
        </View>
      </View>
      {(safeStats.likes || 0) > 0 && (
        <View className="flex-row items-center mt-6 pt-4 border-t border-gray-800">
          <Text className="text-gray-400 text-[12px] font-normal flex-1" numberOfLines={1}>
            Liked by {safeStats.likes} {safeStats.likes === 1 ? 'person' : 'people'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default EventCard;
