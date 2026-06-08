import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

interface ChatProfileProps {
  name: string;
  avatar: any;
}

export const ChatProfileSection = ({ name, avatar }: ChatProfileProps) => {
  return (
    <View className="items-center justify-center py-10 px-10">
      <Image 
        source={typeof avatar === 'string' ? { uri: avatar } : avatar} 
        className="w-28 h-28 rounded-full mb-4 bg-zinc-800" 
      />
      
      <Text className="text-white font-rubik-bold text-2xl mb-1">{name}</Text>
      <Text className="text-zinc-400 text-center font-rubik-regular text-sm">
        1K followers • 1K following
      </Text>
      <Text className="text-zinc-500 text-center font-rubik-regular text-sm mt-1 px-4">
        You might know each other. Start a conversation
      </Text>
      
      {/* Mutual Friends / Followers Overlap UI */}
      <View className="flex-row items-center mt-5">
         <View className="flex-row -space-x-2.5">
            {[1,2,3].map((i) => (
              <Image 
                key={i} 
                source={{ uri: `https://i.pravatar.cc/100?u=${i + 10}` }} 
                className="w-6 h-6 rounded-full border-2 border-black" 
              />
            ))}
         </View>
         <Text className="text-zinc-500 text-xs ml-2">+2 more you follow</Text>
      </View>

      <TouchableOpacity className="bg-zinc-800 px-5 py-2 rounded-lg mt-6" activeOpacity={0.7}>
        <Text className="text-white font-rubik-medium text-sm">View profile</Text>
      </TouchableOpacity>
    </View>
  );
};
