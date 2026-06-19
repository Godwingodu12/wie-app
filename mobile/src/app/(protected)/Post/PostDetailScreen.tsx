import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import CompletePost from '@/components/Post/CompletePost';
import { mediaService } from '@/services/mediaService';
import { useUser } from '@/context/UserContext';

const { width } = Dimensions.get('window');

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams();
  const { user: currentUser } = useUser();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPost = async () => {
    try {
      // Assuming we can get a single post by ID. 
      // If there's no dedicated endpoint, we might have to fetch user posts and find it,
      // but let's assume mediaService.getPost(postId) exists or we can use a generic one.
      // Since it's not in mediaService yet, I'll add it there.
      const response = await (mediaService as any).getPost(postId);
      if (response) {
        setPost(processPostItem(response));
      }
    } catch (error) {
      console.error('Error fetching post detail:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processPostItem = (f: any) => {
    const owner = f.owner || f.user || {};
    const userId = String(owner.id || owner._id || f.userId || "");
    const isSelf = userId === String(currentUser?.id || "");

    return {
      type: 'post',
      userId: userId,
      isFollowing: f.isFollowing,
      isSelf: isSelf,
      id: f._id || f.id,
      username: owner.username || f.username || (isSelf ? currentUser?.username : 'User'),
      name: owner.name || owner.display_name || f.name || (isSelf ? currentUser?.name : ''),
      isVerified: owner.is_verified || owner.isVerified || f.is_verified || f.isVerified || false,
      avatar: owner.profile_picture || owner.profilePicture || owner.avatar || f.avatar || f.profile_picture || (isSelf ? currentUser?.profile_picture : null),
      location: f.locationLabel || f.location || '',
      rawDate: f.createdAt,
      timestamp: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'Just now',
      musicTitle: f.musicTitle || null,
      musicArtist: f.musicArtist || null,
      musicPreviewUrl: f.musicPreviewUrl || null,
      ratio: f.ratio || '4:5',
      media: (f.mediaItems && f.mediaItems.length > 0)
        ? f.mediaItems.map((m: any) => ({ 
            url: typeof m === 'string' ? m : (m.url || m.mediaUrl), 
            type: typeof m === 'string' ? 'image' : (m.mediaType || 'image') 
          }))
        : [{ 
            url: f.mediaUrl || f.url, 
            type: f.mediaType || 'image' 
          }],
      initialLikes: f.likeCount || 0,
      hasLiked: f.hasLiked || false,
      likedBy: f.likedBy || null,
      comments: (f.commentCount || 0).toString(),
      shares: (f.shareCount || 0).toString(),
      caption: f.caption || "",
      commentsDisabled: f.commentsDisabled || false,
    };
  };

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPost();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator color="#8b5cf6" size="large" />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <Text className="text-white">Post not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={15}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Posts</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
        }
      >
        <CompletePost postData={post} isActive={true} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1A1A1A',
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
