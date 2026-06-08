import React, { useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity, StyleSheet, Modal, Pressable, FlatList, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Play, Layers, Image as ImageIcon, Clapperboard, Layout, UserSquare2, X } from 'lucide-react-native';
import { getImageSource } from '@/utils/imageUtils';

const { width, height } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

interface MediaGridProps {
  data: any[];
  activeTab: 'Post' | 'Reels' | 'Feeds' | 'Tags';
  isReels?: boolean;
  onItemDelete?: (id: string) => void;
}

export const MediaGrid = ({ data, activeTab, isReels, onItemDelete }: MediaGridProps) => {
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  // 1. EMPTY STATE CONFIG
  const emptyConfigs = {
    Post: { icon: ImageIcon, title: "No Posts Yet", description: "Photos you share will appear here.", buttonText: "Create Post" },
    Reels: { icon: Clapperboard, title: "Share a Reel", description: "Videos are a great way to tell your story.", buttonText: "Create Reel" },
    Feeds: { icon: Layout, title: "Your Feed is Empty", description: "Curated collections will show up here.", buttonText: "Browse Feeds" },
    Tags: { icon: UserSquare2, title: "Photos of You", description: "Tagged photos will appear here.", buttonText: "Tags Settings" }
  };

  if (!data || data.length === 0) {
    const config = emptyConfigs[activeTab];
    const IconComponent = config.icon;
    return (
      <View className="flex-1 items-center justify-center py-20 px-10">
        <View className="w-24 h-24 bg-[#121212] rounded-full items-center justify-center mb-6 border border-zinc-800">
          <IconComponent color="#71717a" size={42} />
        </View>
        <Text className="text-white text-2xl font-bold text-center">{config.title}</Text>
        <Text className="text-zinc-500 text-center mt-3 mb-10">{config.description}</Text>
        <TouchableOpacity className="bg-white px-10 py-4 rounded-full flex-row items-center gap-2" activeOpacity={0.9}>
          <Text className="text-black font-bold text-base">{config.buttonText}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleDelete = () => {
    if (selectedMedia && onItemDelete) {
      Alert.alert(
        "Delete Post",
        "Are you sure you want to permanently delete this post?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Delete", 
            style: "destructive", 
            onPress: () => {
              onItemDelete(selectedMedia.id);
              setSelectedMedia(null);
            }
          }
        ]
      );
    }
  };

  // 2. GRID RENDERING
  return (
    <View className="flex-row flex-wrap pb-20">
      {data.map((item) => {
        const itemHeight = COLUMN_WIDTH * 1.5;
        const imageUrl = item.image || (item.source && (typeof item.source === 'string' ? item.source : item.source.uri));
        
        return (
          <TouchableOpacity 
            key={item.id} 
            style={{ width: COLUMN_WIDTH, height: itemHeight }} 
            className="p-[1px]"
            activeOpacity={0.9}
            onPress={() => setSelectedMedia(item)}
          >
            <View className="flex-1 bg-zinc-900 overflow-hidden rounded-md">
              <Image 
                source={getImageSource(imageUrl)} 
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={200}
              />

              {/* ALBUM ICON (Layers) - Positioned on Top */}
              {item.type === 'album' && (
                <View style={styles.iconShadow} className="absolute top-2 right-2">
                  <Layers color="white" size={18} strokeWidth={2.5} />
                </View>
              )}

              {/* REEL INDICATOR - Positioned at Bottom */}
              {item.type === 'reel' && (
                <View className="absolute bottom-2 left-2 flex-row items-center bg-black/40 px-1.5 py-0.5 rounded-md">
                  <Play color="white" size={12} fill="white" />
                  <Text className="text-white text-[10px] font-bold ml-1">{item.stats || '0'}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {/* FULL SCREEN MEDIA VIEWER */}
      <Modal
        visible={!!selectedMedia}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedMedia(null)}
      >
        <View className="flex-1 bg-black">
          {/* Header Bar */}
          <View className="absolute top-0 left-0 right-0 z-50 pt-12 pb-4 px-4 flex-row justify-between bg-black/40">
            {onItemDelete ? (
              <TouchableOpacity 
                className="p-2 rounded-full bg-red-500/50"
                onPress={handleDelete}
              >
                <X color="white" size={24} />
              </TouchableOpacity>
            ) : <View />}
            <TouchableOpacity 
              className="p-2 rounded-full bg-black/50"
              onPress={() => setSelectedMedia(null)}
            >
              <X color="white" size={24} />
            </TouchableOpacity>
          </View>
          
          <Pressable 
            className="flex-1 justify-center items-center"
            onPress={() => setSelectedMedia(null)}
          >
            {selectedMedia && selectedMedia.type === 'reel' ? (
               <Video
                  source={getImageSource(selectedMedia.source?.uri || selectedMedia.image)}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                  isLooping
                  useNativeControls
               />
            ) : selectedMedia && selectedMedia.type === 'album' && selectedMedia.mediaItems ? (
              <FlatList
                data={selectedMedia.mediaItems}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={{ width, height }}>
                    {item.mediaType === 'video' ? (
                      <Video
                        source={getImageSource(item.url)}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode={ResizeMode.CONTAIN}
                        shouldPlay
                        isLooping
                        useNativeControls
                      />
                    ) : (
                      <Image 
                        source={getImageSource(item.url)} 
                        style={{ width: '100%', height: '100%' }}
                        contentFit="contain"
                      />
                    )}
                  </View>
                )}
              />
            ) : selectedMedia ? (
              <Image 
                source={getImageSource(selectedMedia.source?.uri || selectedMedia.image)} 
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
                transition={300}
              />
            ) : null}
          </Pressable>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  iconShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 5,
  }
});

