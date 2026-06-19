import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as ImagePicker from 'expo-image-picker';
import { mediaService } from '@/services/mediaService';
import { broadcastPostUpdate } from '@/hooks/usePostSync';
import Avatar from '@/components/Post/Avatar';
import { getMediaSource } from '@/utils/imageUtils';

const { width } = Dimensions.get('window');

const RATIOS: Record<string, number> = { 
  '1:1': 1, 
  '4:5': 0.8, 
  '9:16': 9/16, 
  '16:9': 363/196, 
  '4:3': 4/3 
};

const VideoPlayerItem = React.memo(({ url }: { url: string }) => {
    const player = useVideoPlayer(url, (p) => {
        p.loop = true;
        p.muted = true;
        p.play();
    });
    return <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="contain" nativeControls={false} />;
});

export default function EditPostScreen() {
  const params = useLocalSearchParams();
  const postId = params.postId as string;
  const initialCaption = params.caption as string || '';
  const initialLocation = params.locationLabel as string || '';
  const username = params.username as string || 'user';
  const profileImage = params.profileImage as string || '';
  const timestamp = params.timestamp as string || '';
  const ratio = (params.ratio as string) || '4:5';

  const [caption, setCaption] = useState(initialCaption);
  const [location, setLocation] = useState(initialLocation);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const currentRatio = RATIOS[ratio] || RATIOS['4:5'];
  const mediaHeight = width / currentRatio;

  useEffect(() => {
    let loadedMedia: any[] = [];
    if (params.mediaStr) {
      try {
        const parsed = JSON.parse(params.mediaStr as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedMedia = parsed;
          setMediaItems(parsed);
          setLoadingData(false);
        }
      } catch (e) {
        console.error("Failed to parse initial media items", e);
      }
    }
    
    // If not loaded from params, or if parsing failed, fetch from backend
    if (postId && loadedMedia.length === 0) {
      mediaService.getPost(postId).then(post => {
        if (post) {
          const fetchedMedia = post.mediaItems || post.media || (post.mediaUrl ? [{ url: post.mediaUrl, type: post.mediaType || 'image' }] : []);
          setMediaItems(fetchedMedia);
        }
        setLoadingData(false);
      }).catch(err => {
        console.error("Failed to fetch post", err);
        setLoadingData(false);
      });
    } else {
      setLoadingData(false);
    }
  }, [postId, params.mediaStr]);

  const handleSave = async () => {
    if (!postId) return;
    setIsLoading(true);
    try {
      await mediaService.updatePost(postId, {
        caption,
        locationLabel: location || undefined,
        mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
      });

      broadcastPostUpdate(postId, {
        caption,
        locationLabel: location || '',
        media: mediaItems,
      });

      router.back();
    } catch (error: any) {
      console.error('Error updating post:', error);
      Alert.alert('Error', error.message || 'Failed to update post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to add media.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newItems = result.assets.map(a => ({ 
        url: a.uri, 
        type: a.type === 'video' ? 'video' : 'image', 
        isNew: true 
      }));
      setMediaItems(prev => [...prev, ...newItems]);
    }
  };

  const handleRemoveMedia = (index: number) => {
    if (mediaItems.length <= 1) {
      Alert.alert("Cannot Remove", "A post must have at least one media item.");
      return;
    }
    Alert.alert(
      "Remove Media?",
      "Are you sure you want to remove this item?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => {
            setMediaItems(prev => prev.filter((_, i) => i !== index));
          }
        }
      ]
    );
  };

  const handleMoveLeft = (index: number) => {
    if (index === 0) return;
    setMediaItems(prev => {
      const arr = [...prev];
      const temp = arr[index];
      arr[index] = arr[index - 1];
      arr[index - 1] = temp;
      return arr;
    });
  };

  const handleMoveRight = (index: number) => {
    if (index === mediaItems.length - 1) return;
    setMediaItems(prev => {
      const arr = [...prev];
      const temp = arr[index];
      arr[index] = arr[index + 1];
      arr[index + 1] = temp;
      return arr;
    });
  };

  const handleAddCollaborators = () => Alert.alert('Collaborators', 'Feature coming soon');
  const handleAddAILabel = () => Alert.alert('AI Label', 'Feature coming soon');
  const handleTagPeople = () => Alert.alert('Tag People', 'Feature coming soon');
  const handleEditAltText = () => Alert.alert('Alt Text', 'Feature coming soon');

  if (loadingData) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
         <ActivityIndicator color="#3897f0" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={15}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit info</Text>
          <TouchableOpacity onPress={handleSave} disabled={isLoading} hitSlop={15}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#3897f0" />
            ) : (
              <Ionicons name="checkmark" size={28} color="#3897f0" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          {/* User Info Header */}
          <View style={styles.userInfo}>
            <Avatar image={profileImage} size={40} />
            <View style={styles.userTextContainer}>
              <View className="flex-row items-center">
                <Text style={styles.username}>{username}</Text>
                <Text style={styles.dot}> • </Text>
                <TouchableOpacity onPress={handleAddCollaborators}>
                  <Text style={styles.blueLink}>Add collaborators</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center mt-0.5">
                <TouchableOpacity onPress={() => {}} className="flex-row items-center">
                   <Text style={styles.blueLink}>{location || 'Add location'}</Text>
                </TouchableOpacity>
                <Text style={styles.pipe}> | </Text>
                <TouchableOpacity onPress={handleAddAILabel}>
                  <Text style={styles.blueLink}>Add AI label</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.timeText}>{timestamp}</Text>
          </View>

          {/* Media Preview Carousel */}
          <View style={{ height: mediaHeight, width, backgroundColor: '#111' }}>
            {mediaItems.length === 0 ? (
               <View className="flex-1 justify-center items-center">
                  <Ionicons name="image-outline" size={48} color="#444" />
                  <Text style={{ color: '#666', marginTop: 8 }}>No media available</Text>
               </View>
            ) : (
              <FlatList
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                data={mediaItems}
                keyExtractor={(item, index) => `${index}-${item.url || ''}`}
                renderItem={({ item, index }) => {
                  const mediaUrl = item.url || item.mediaUrl || item.uri;
                  const source = getMediaSource(mediaUrl);
                  const isVideo = item.type === 'video' || item.mediaType === 'video';

                  return (
                    <View style={{ width, height: mediaHeight }}>
                      {isVideo ? (
                        <VideoPlayerItem url={typeof source === 'object' ? source.uri : source} />
                      ) : (
                        <Image 
                          source={source} 
                          style={{ width: '100%', height: '100%' }}
                          contentFit="contain"
                        />
                      )}
                      
                      {/* Media Overlay Controls */}
                      <View style={styles.topControls}>
                        {index > 0 && (
                          <TouchableOpacity onPress={() => handleMoveLeft(index)} style={styles.iconBtn}>
                            <Ionicons name="arrow-back" size={20} color="white" />
                          </TouchableOpacity>
                        )}
                        {index < mediaItems.length - 1 && (
                          <TouchableOpacity onPress={() => handleMoveRight(index)} style={styles.iconBtn}>
                            <Ionicons name="arrow-forward" size={20} color="white" />
                          </TouchableOpacity>
                        )}
                        {mediaItems.length > 1 && (
                           <TouchableOpacity onPress={() => handleRemoveMedia(index)} style={[styles.iconBtn, { backgroundColor: 'rgba(239, 68, 68, 0.8)' }]}>
                             <Ionicons name="trash" size={20} color="white" />
                           </TouchableOpacity>
                        )}
                      </View>

                      {/* Instagram overlays */}
                      <View style={styles.mediaOverlay}>
                        <TouchableOpacity onPress={handleTagPeople} style={styles.overlayButton}>
                          <Ionicons name="person-circle-outline" size={18} color="white" />
                          <Text style={styles.overlayButtonText}>Tag people</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={handleEditAltText} style={styles.overlayButton}>
                          <Text style={styles.overlayButtonText}>Aa</Text>
                          <Text style={styles.overlayButtonText}>Edit alt text</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </View>

          <TouchableOpacity onPress={handleAddMedia} style={styles.addMediaBtn}>
            <Ionicons name="add-circle-outline" size={20} color="#3897f0" />
            <Text style={{ color: '#3897f0', fontWeight: 'bold', marginLeft: 6 }}>Add more media</Text>
          </TouchableOpacity>

          {/* Caption Input */}
          <View style={styles.captionContainer}>
            <TextInput
              style={styles.captionInput}
              value={caption}
              onChangeText={setCaption}
              placeholder="Write a caption..."
              placeholderTextColor="#A3A3A3"
              multiline
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  userTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  username: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dot: {
    color: 'white',
  },
  blueLink: {
    color: '#3897f0',
    fontSize: 13,
  },
  pipe: {
    color: '#333',
    marginHorizontal: 4,
  },
  timeText: {
    color: '#A3A3A3',
    fontSize: 12,
  },
  topControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  overlayButtonText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  addMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1A1A1A',
  },
  captionContainer: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1A1A1A',
  },
  captionInput: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
