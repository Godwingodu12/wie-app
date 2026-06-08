import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import ProfileCard from './ProfileCard';

interface Profile {
  id: string;
  name: string;
  username: string;
  avatar: string;
  followers: string;
  following: string;
  mutualAvatars: string[];
  isNew: boolean;
}

interface ProfileHorizontalListProps {
  sectionTitle: string;
  data: Profile[];
  onDismissProfile?: (id: string) => void;
}

const ProfileHorizontalList = ({ sectionTitle, data, onDismissProfile }: ProfileHorizontalListProps) => {
  if (!data || data.length === 0) return null;

  return (
    <View className="py-1 px-3">
      <View className="flex-row justify-between items-center px-3 mb-5">
        <Text className="text-white text-xl font-bold">{sectionTitle}</Text>
        <TouchableOpacity>
          <Text className="text-primary text-sm font-semibold">see all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View className="mr-4">
            <ProfileCard {...item} onDismiss={onDismissProfile} />
          </View>
        )}
      />
    </View>
  );
};

export default ProfileHorizontalList;
