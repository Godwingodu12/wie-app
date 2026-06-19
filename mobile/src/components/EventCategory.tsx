import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { BlurView } from 'expo-blur'
import { ImageBackground } from 'expo-image'

type EventCategoryProps = {
  image: any
  title: string
  onPress?: () => void
}

const EventCategory = ({
  image,
  title,
  onPress,
}: EventCategoryProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="w-[156px] h-[72px] rounded-2xl overflow-hidden bg-[#222]"
    >
      {/* BACKGROUND IMAGE */}
      <ImageBackground
        source={image}
        contentFit="cover"
        style={{ width: '100%', height: '100%' }}
      >
        {/* BOTTOM BLUR OVERLAY */}
        <View className="absolute bottom-0 w-full h-12">
          <BlurView
            intensity={100}
            tint="dark"
            className="w-full h-full"
          />

          {/* TEXT */}
          <View className="absolute inset-0 items-center justify-center px-2">
            <Text 
              className="text-white text-[13px] font-semibold text-center"
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {title}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  )
}

export default EventCategory
