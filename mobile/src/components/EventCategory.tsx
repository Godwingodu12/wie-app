import React from 'react'
import { View, ImageBackground, Text, TouchableOpacity } from 'react-native'
import { BlurView } from 'expo-blur'

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
      className="w-[156px] h-[72px] rounded-2xl overflow-hidden"
    >
      {/* BACKGROUND IMAGE */}
      <ImageBackground
        source={image}
        resizeMode="cover"
        className="w-full h-full"
      >
        {/* BOTTOM BLUR OVERLAY */}
        <View className="absolute bottom-0 w-full h-10">
          <BlurView
            intensity={100}
            tint="dark"
            className="w-full h-full"
            
          />

          {/* TEXT */}
          <View className="absolute inset-0 items-center justify-center">
            <Text className="text-white text-[14px] font-semibold">
              {title}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  )
}

export default EventCategory
