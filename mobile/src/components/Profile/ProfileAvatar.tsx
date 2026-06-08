import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { getImageSource } from '@/utils/imageUtils'

type ProfileAvatarProps = {
  image?: any
  hasStory?: boolean
  isSeen?: boolean
  showAddButton?: boolean
  onPress?: () => void
  onAddPress?: () => void
}

const ProfileAvatar = ({
  image,
  hasStory = false,
  isSeen = false,
  showAddButton = true,
  onPress,
  onAddPress,
}: ProfileAvatarProps) => {
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
          className={`items-center justify-center rounded-full border-4 ${ringStyle} w-28 h-28`}
        >
          <Image
            source={avatarSource}
            style={{ width: 96, height: 96, borderRadius: 48 }}
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
    </View>
  )
}

export default ProfileAvatar
