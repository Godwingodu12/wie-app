import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VideoModuleProps {
  title: string;
  duration: string;
  status: 'completed' | 'playing' | 'locked';
  onPress?: () => void;
}

export const VideoModuleCard = ({ title, duration, status, onPress }: VideoModuleProps) => {
  // Logic for dynamic styling based on status
  const isLocked = status === 'locked';
  const isPlaying = status === 'playing';
  const isCompleted = status === 'completed';

  return (
    <TouchableOpacity 
      onPress={isLocked ? undefined : onPress}
      activeOpacity={0.7}
      className={`flex-row items-center p-4 mb-3 rounded-2xl border ${
        isPlaying ? 'bg-purple-900/20 border-purple-500/50' : 'bg-gray-900/40 border-gray-800'
      }`}
    >
      {/* --- LEFT: Status Icon --- */}
      <View className={`w-12 h-12 rounded-xl items-center justify-center ${
        isPlaying ? 'bg-purple-600' : isCompleted ? 'bg-green-500/20' : 'bg-gray-800'
      }`}>
        <Ionicons 
          name={
            isLocked ? "lock-closed" : 
            isCompleted ? "checkmark-circle" : 
            "play"
          } 
          size={22} 
          color={isCompleted ? "#10B981" : "white"} 
        />
      </View>

      {/* --- CENTER: Text Info --- */}
      <View className="flex-1 ml-4">
        <Text 
          numberOfLines={1}
          className={`font-rubik-medium text-base ${
            isLocked ? 'text-gray-600' : 'text-white'
          }`}
        >
          {title}
        </Text>
        
        <View className="flex-row items-center mt-1">
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text className="text-gray-500 text-xs ml-1 font-rubik-regular">
            {duration}
          </Text>
          {isCompleted && (
            <Text className="text-green-500 text-xs ml-2 font-rubik-medium">• Watched</Text>
          )}
        </View>
      </View>

      {/* --- RIGHT: Progress/Action indicator --- */}
      <View className="items-end">
        {isPlaying ? (
           <View className="flex-row gap-[2px] items-end h-3">
             {/* Simple animated-style bars */}
             <View className="w-1 bg-purple-500 h-3 rounded-full" />
             <View className="w-1 bg-purple-500 h-2 rounded-full" />
             <View className="w-1 bg-purple-500 h-4 rounded-full" />
           </View>
        ) : (
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={isLocked ? "#374151" : "#4B5563"} 
          />
        )}
      </View>
    </TouchableOpacity>
  );
};
