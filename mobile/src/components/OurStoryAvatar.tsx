import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { getImageSource } from '@/utils/imageUtils'

type StoryAvatarProps = {
  image?: any
  username?: string
  hasStory?: boolean
  isSeen?: boolean
  showAddButton?: boolean
  onPress?: () => void
  onAddPress?: () => void
}

const StoryAvatar = ({
  image,
  username = 'Your story',
  hasStory = false,
  isSeen = false,
  showAddButton = true,
  onPress,
  onAddPress,
}: StoryAvatarProps) => {
  const ringStyle = !hasStory
    ? 'border-transparent'
    : isSeen
      ? 'border-[#3A3A3C]'
      : 'border-blue-500'

  const avatarSource = getImageSource(image);

  return (
    <View className="items-center">
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <View
          className={`items-center justify-center rounded-full border-2 ${ringStyle} w-20 h-20`}
        >
          <Image
            source={avatarSource}
            style={{ width: 72, height: 72, borderRadius: 36 }}
            className="bg-neutral-800"
            contentFit="cover"
            transition={200}
          />

          {showAddButton && (
            <TouchableOpacity
              onPress={onAddPress}
              activeOpacity={0.9}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border-2 border-black items-center justify-center"
            >
              <Ionicons name="add" size={18} color="#000" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      <Text className="font-rubik text-gray-400 text-xs mt-2">
        {username}
      </Text>
    </View>
  )
}

export default StoryAvatar
