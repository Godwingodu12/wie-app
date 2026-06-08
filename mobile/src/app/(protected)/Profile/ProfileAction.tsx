import BlueGrdBtn from '@/components/BlueGrdBtn';
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

interface Props {
  isFollowing: boolean;
  isRequested: boolean;
  canShowMessage: boolean;
  onFollowToggle: () => void;
  onMessagePress: () => void;
}

const ProfileActions = ({ isFollowing, isRequested, canShowMessage, onFollowToggle, onMessagePress }: Props) => {

  const getLabel = () => {
    if (isRequested) return 'Requested';
    if (isFollowing) return 'Following';
    return 'Follow';
  };

  const isHighlighted = isFollowing || isRequested;

  return (
    <View className="flex-row px-4 mt-4 w-full">
      <View className="flex-1">
        {!isHighlighted ? (
          <BlueGrdBtn title={getLabel()} height={42} borderRadius={10} onPress={onFollowToggle} />
        ) : (
          <TouchableOpacity
            onPress={onFollowToggle}
            className="h-[42px] bg-[#1C2024] rounded-xl items-center justify-center border border-zinc-800 w-full"
          >
            <Text className="text-base font-rubik-semibold text-white">{getLabel()}</Text>
          </TouchableOpacity>
        )}
      </View>
      {canShowMessage && (
        <View className="flex-1 ml-2">
          <TouchableOpacity
            onPress={onMessagePress}
            className="h-[42px] bg-[#1C2024] rounded-xl items-center justify-center border border-zinc-800 w-full"
          >
            <Text className="text-white font-rubik-semibold text-sm">Message</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ProfileActions;
