import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { getImageSource } from '@/utils/imageUtils'

type AvatarProps = {
    image?: any 
    hasStory?: boolean
    isSeen?: boolean
    onPress?: () => void
}

const Avatar = ({
    image,
    hasStory = false,
    isSeen = false,
    onPress,
}: AvatarProps) => {
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
                    className={`items-center justify-center rounded-full border-[2px] ${ringStyle} w-12 h-12`}
                >
                    <Image
                        source={avatarSource}
                        style={{ width: '100%', height: '100%' }}
                        className="bg-neutral-800"
                        contentFit="cover"
                        transition={200}
                    />
                </View>
            </TouchableOpacity>
        </View>
    )
}
export default Avatar
