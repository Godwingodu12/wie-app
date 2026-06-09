import React from 'react';
import { FlatList, View } from 'react-native';
import ProfileCard from './ProfileCard';

interface User {
  id?: string;
  _id?: string;
  name: string;
  username: string;
  avatar: string;
  followersCount?: string | number;
  followingCount?: string | number;
  followers?: string;
  following?: string;
  isNew?: boolean;
  mutualAvatars?: string[];
  isFollowing?: boolean;
  isRequested?: boolean;
}

interface HorizontalUserListProps {
  users: User[];
}

const HorizontalUserList = ({ users }: HorizontalUserListProps) => {
  if (!users || users.length === 0) return null;

  const suggestedUsers = users.filter(user => !user.isFollowing);

  if (suggestedUsers.length === 0) return null;

  return (
    <FlatList
      data={suggestedUsers}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      keyExtractor={(item) => String(item.id || item._id)}
      renderItem={({ item }) => (
        <View className="mr-4">
          <ProfileCard 
            id={String(item.id || item._id)}
            name={item.name || item.display_name}
            username={item.username}
            avatar={item.avatar || item.profile_picture}
            followers={String(item.followers_count || item.followersCount || item.followers || "0")}
            following={String(item.following_count || item.followingCount || item.following || "0")}
            mutualAvatars={item.mutualAvatars || []}
            isNew={item.isNew}
            isFollowing={item.isFollowing}
            isRequested={item.isRequested}
          />
        </View>
      )}
    />
  );
};

export default HorizontalUserList;
