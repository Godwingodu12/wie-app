import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export const MapSection = ({ address }: { address: string }) => {
  return (
    <View className="mt-4 rounded-[32px] overflow-hidden bg-[#121212] h-52 border border-gray-800">
      {/* Mock Map Image - Using a dark map placeholder */}
      <Image 
        source={{ uri: 'https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/pin-s+8B5CF6(-74.006,40.7128)/-74.006,40.7128,14/600x300?access_token=YOUR_TOKEN' }}
        className="w-full h-full opacity-60"
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Visual Marker & Tooltip Container */}
      <View className="flex-1 items-center justify-center">
        {/* Tooltip */}
        <View className="bg-[#2D2D30] px-5 py-3 rounded-2xl border border-white/10 mb-2 shadow-2xl">
          <Text className="text-white font-rubik-bold text-sm leading-5">
            {address.split(',').join(',\n')}
          </Text>
        </View>
        
        {/* Purple Pin Indicator */}
        <View className="items-center">
          <View className="w-8 h-8 rounded-full bg-[#8B5CF6] items-center justify-center border-2 border-white">
             <View className="w-2 h-2 rounded-full bg-white" />
          </View>
          <View 
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 6,
              borderRightWidth: 6,
              borderTopWidth: 8,
              borderStyle: 'solid',
              backgroundColor: 'transparent',
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: '#8B5CF6',
              marginTop: -2
            }} 
          />
        </View>
        <Text className="text-gray-300 font-rubik-bold text-xs mt-1 shadow-sm">New York</Text>
      </View>
    </View>
  );
};
