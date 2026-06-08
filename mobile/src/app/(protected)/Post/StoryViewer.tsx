import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Animated,
  Alert,
  Share,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { wieUserService } from '@/services/wieUserService';
import { mediaService } from '@/services/mediaService';
import { useToast } from '@/context/ToastContext';

const { width } = Dimensions.get('window');

const StoryViewer = () => {
  const { userId, username, avatar, stories: storiesParam, initialIndex } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'none' | 'share' | 'views' | 'mention' | 'more'>('none');
  
  // Parse stories from params
  const [stories, setStories] = useState<any[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  
  useEffect(() => {
    if (storiesParam) {
      try {
        const parsed = JSON.parse(storiesParam as string);
        setStories(parsed);
        if (initialIndex) {
          setCurrentStoryIndex(parseInt(initialIndex as string));
        }
      } catch (e) {
        console.error("Error parsing stories:", e);
      }
    }
  }, [storiesParam, initialIndex]);

  const [progress] = useState(new Animated.Value(0));
  const [isPaused, setIsPaused] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isCommentingEnabled, setIsCommentingEnabled] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const { showToast } = useToast();

  const totalStories = stories.length || 1;
  const currentStory = stories[currentStoryIndex] || {};
  const storyDuration = 5000;

  useEffect(() => {
    fetchCurrentUserProfile();
  }, []);

  const handleMoreAction = (action: string) => {
    if (action !== 'Add Mention') {
      setActiveTab('none');
    }
    
    switch (action) {
      case 'Delete Story':
        Alert.alert('Delete Story', 'Are you sure you want to delete this story?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              const storyId = currentStory.id;
              if (storyId) {
                await mediaService.deletePost(storyId);
                showToast({ message: 'Story deleted successfully', type: 'success' });
                
                // Remove from local state
                const updated = stories.filter((_, i) => i !== currentStoryIndex);
                if (updated.length === 0) {
                  router.back();
                } else {
                  setStories(updated);
                  setCurrentStoryIndex(Math.max(0, currentStoryIndex - 1));
                }
              } else {
                router.back();
              }
            } catch (error: any) {
              showToast({ message: error.message || 'Failed to delete story', type: 'error' });
            }
          } }
        ]);
        break;
      case 'Archive':
        showToast({ message: 'Story moved to archive', type: 'info' });
        // Logic to remove or move
        break;
      case 'Saved Photo':
        showToast({ message: 'Photo saved to gallery', type: 'success' });
        break;
      case 'Highlight':
        showToast({ message: 'Added to highlights', type: 'success' });
        break;
      case 'Copy link':
        showToast({ message: 'Story link copied to clipboard', type: 'info' });
        break;
      case 'Share':
        Share.share({
          message: `Check out this story from ${username}!`,
        });
        break;
      case 'Add Mention':
        setActiveTab('mention');
        break;
      case 'Go to Story settings':
        router.push('/(protected)/SetOptions/SettingsMain');
        break;
      case 'Turn off Commenting':
      case 'Turn on Commenting':
        const nextState = !isCommentingEnabled;
        setIsCommentingEnabled(nextState);
        showToast({ message: nextState ? 'Commenting turned on' : 'Commenting turned off', type: 'info' });
        break;
    }
  };

  const fetchCurrentUserProfile = async () => {
    try {
      const profile = await wieUserService.getProfile();
      setCurrentUserProfile(profile);
    } catch (error) {
      console.error('Error fetching current user profile:', error);
    }
  };

  const [shareTargets, setShareTargets] = useState<any[]>([]); // Future API integration

  useEffect(() => {
    if (!isPaused && activeTab === 'none' && stories.length > 0) {
      startProgress();
    } else {
      progress.stopAnimation();
    }
  }, [currentStoryIndex, isPaused, activeTab, stories.length]);

  const startProgress = () => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: storyDuration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        nextStory();
      }
    });
  };

  const nextStory = () => {
    if (currentStoryIndex < totalStories - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      router.back();
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const renderProgressBar = () => (
    <View className="flex-row px-2 mt-4 space-x-1.5">
      {Array.from({ length: totalStories }).map((_, index) => (
        <View key={index} className="flex-1 h-[2.5px] bg-white/30 rounded-full overflow-hidden">
          {index === currentStoryIndex ? (
            <Animated.View 
              style={{
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }}
              className="h-full bg-white"
            />
          ) : index < currentStoryIndex ? (
            <View className="w-full h-full bg-white" />
          ) : null}
        </View>
      ))}
    </View>
  );

  const renderSheetHeader = (title: string, onClose: () => void) => (
    <View className="flex-row justify-between items-center mb-6">
      <View className="w-8" />
      <Text className="text-white text-xl font-bold">{title}</Text>
      <TouchableOpacity onPress={onClose}>
        <Ionicons name="close" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );

  const Backdrop = ({ onClose }: { onClose: () => void }) => (
    <TouchableOpacity 
      activeOpacity={1} 
      onPress={onClose} 
      style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
    >
      <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
    </TouchableOpacity>
  );

  const SheetContainer = ({ children, minHeight = '50%' }: { children: React.ReactNode, minHeight?: any }) => (
    <View style={StyleSheet.absoluteFill} className="z-50">
      <Backdrop onClose={() => setActiveTab('none')} />
      <View className="flex-1 justify-end">
        <View 
          className="bg-[#1C2024]/90 rounded-t-[40px] border-t border-gray-800 overflow-hidden"
          style={{ minHeight }}
        >
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
          <View className="p-6 flex-1">
            <View className="w-12 h-1 bg-gray-600 self-center rounded-full mb-6" />
            {children}
          </View>
        </View>
      </View>
    </View>
  );

  const renderShareSheet = () => (
    <SheetContainer minHeight="65%">
      {renderSheetHeader('Share', () => setActiveTab('none'))}
      <View className="flex-row items-center bg-zinc-800/60 rounded-2xl px-4 py-3.5 mb-6">
        <Ionicons name="search" size={20} color="#888" />
        <TextInput placeholder="Search" placeholderTextColor="#888" className="flex-1 text-white ml-2 text-base" />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap justify-between px-1">
          {shareTargets.length === 0 ? (
            <Text className="text-gray-500 text-center w-full py-4">Search users to share with...</Text>
          ) : (
            shareTargets.map((user) => (
              <View key={user.id} className="w-[30%] items-center mb-6">
                <Image source={{ uri: user.avatar }} className="w-16 h-16 rounded-full border border-white/10" />
                <Text className="text-white text-[11px] mt-2 text-center" numberOfLines={1}>{user.name}</Text>
              </View>
            ))
          )}
        </View>
        <View className="flex-row justify-between items-center mt-4 border-t border-white/5 pt-6 pb-4">
          {[
            { label: 'Share link', icon: 'link-outline' },
            { label: 'Share', icon: 'share-outline' },
            { label: 'Facebook', icon: 'logo-facebook' },
            { label: 'Whatsapp', icon: 'logo-whatsapp' },
          ].map((item, i) => (
            <TouchableOpacity 
              key={i} 
              className="items-center w-[22%]"
              onPress={() => showToast({ message: `Sharing via ${item.label}...`, type: 'info' })}
            >
              <View className="w-12 h-12 bg-white/5 rounded-full items-center justify-center mb-2">
                <Ionicons name={item.icon as any} size={22} color="white" />
              </View>
              <Text className="text-white text-[10px]">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <View className="mt-4">
         <TextInput placeholder="Write message here..." placeholderTextColor="#888" className="bg-white/5 rounded-2xl px-5 py-4 text-white text-base mb-4" />
         <TouchableOpacity 
           className="bg-[#8B5CF6] py-4 rounded-2xl shadow-lg"
           onPress={() => {
             showToast({ message: 'Message sent successfully!', type: 'success' });
             setActiveTab('none');
           }}
         >
            <Text className="text-white text-center font-bold text-lg">Send</Text>
         </TouchableOpacity>
      </View>
    </SheetContainer>
  );

  const renderViewsSheet = () => (
    <SheetContainer minHeight="60%">
      <View className="flex-row justify-between items-center mb-6">
        <View className="flex-row items-center">
          <Ionicons name="eye-outline" size={20} color="white" />
          <Text className="text-white ml-2 text-base font-bold">21 views</Text>
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity 
            className="mr-6"
            onPress={() => {
              Alert.alert('Delete All', 'Delete all views?', [
                { text: 'Cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => showToast({ message: 'All views deleted', type: 'success' }) }
              ]);
            }}
          >
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('none')}><Ionicons name="close" size={28} color="white" /></TouchableOpacity>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {['Joyal', 'Sangeeth', 'Ammu', 'Ajeesh', 'Chanchal', 'Vipin Raj', 'Anudev', 'Kalidas'].map((name, i) => (
          <View key={i} className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <Image source={{ uri: `https://i.pravatar.cc/150?u=${i+30}` }} className="w-12 h-12 rounded-full" />
              <Text className="text-white font-bold text-lg ml-4">{name}</Text>
            </View>
            <View className="flex-row items-center">
               <TouchableOpacity 
                 className="p-2 mr-2"
                 onPress={() => showToast({ message: `Filtering for ${name}`, type: 'info' })}
               >
                 <MaterialCommunityIcons name="filter-variant" size={20} color="white" />
               </TouchableOpacity>
               <TouchableOpacity 
                 className="p-2"
                 onPress={() => showToast({ message: `Removed ${name} from viewers`, type: 'success' })}
               >
                 <Ionicons name="trash-outline" size={20} color="white" />
               </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SheetContainer>
  );

  const [selectedMentions, setSelectedMentions] = useState<number[]>([0, 1, 2]);

  const toggleMention = (index: number) => {
    if (selectedMentions.includes(index)) {
      setSelectedMentions(selectedMentions.filter(i => i !== index));
    } else {
      setSelectedMentions([...selectedMentions, index]);
    }
  };

  const renderMentionSheet = () => (
    <SheetContainer minHeight="75%">
      {renderSheetHeader('Mention', () => setActiveTab('none'))}
      <View className="flex-row items-center bg-zinc-800/60 rounded-2xl px-4 py-3.5 mb-4">
        <Ionicons name="search" size={20} color="#888" />
        <TextInput placeholder="Search" placeholderTextColor="#888" className="flex-1 text-white ml-2 text-base" />
      </View>
      <Text className="text-gray-400 text-center text-xs mb-6 px-10">
        People added here will be mentioned in your story but their username won't be visible
      </Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {[1, 2, 3, 4, 5, 6].map((_, i) => (
          <TouchableOpacity 
            key={i} 
            className="flex-row items-center justify-between py-3.5 mb-2"
            onPress={() => toggleMention(i)}
          >
            <View className="flex-row items-center">
              <Image source={{ uri: `https://i.pravatar.cc/150?u=${i+40}` }} className="w-14 h-14 rounded-full" />
              <View className="ml-4">
                <Text className="text-white font-bold text-lg">san_geeth__palliyal</Text>
                <Text className="text-gray-400 text-sm">SangeethPalliyal</Text>
              </View>
            </View>
            <View className={`w-8 h-8 rounded-full items-center justify-center border-2 ${selectedMentions.includes(i) ? 'bg-[#8B5CF6] border-[#8B5CF6]' : 'border-gray-600'}`}>
              {selectedMentions.includes(i) && <Ionicons name="checkmark" size={20} color="white" />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity 
        className="bg-[#8B5CF6] py-4 rounded-2xl mt-4 shadow-lg"
        onPress={() => {
          showToast({ message: `${selectedMentions.length} people mentioned in your story`, type: 'success' });
          setActiveTab('none');
        }}
      >
         <Text className="text-white text-center font-bold text-lg">Add</Text>
      </TouchableOpacity>
    </SheetContainer>
  );

  const renderMoreSheet = () => {
    const isOwner = userId === 'me';
    const menuItems = isOwner 
      ? [
          { label: 'Delete Story', color: '#EF4444' },
          { label: 'Archive', color: 'white' },
          { label: 'Saved Photo', color: 'white' },
          { label: 'Highlight', color: 'white' },
          { label: 'Copy link', color: 'white' },
          { label: 'Share', color: 'white' },
          { label: 'Add Mention', color: 'white' },
          { label: 'Go to Story settings', color: 'white' },
          { label: isCommentingEnabled ? 'Turn off Commenting' : 'Turn on Commenting', color: 'white' },
        ]
      : [
          { label: 'Report', color: '#EF4444' },
          { label: 'About this account', color: 'white' },
          { label: 'Copy link', color: 'white' },
          { label: 'Share', color: 'white' },
        ];

    return (
      <SheetContainer minHeight="50%">
        {renderSheetHeader('More', () => setActiveTab('none'))}
        <ScrollView showsVerticalScrollIndicator={false}>
          {menuItems.map((item, i) => (
            <TouchableOpacity 
              key={i} 
              className="py-5 border-b border-white/5"
              onPress={() => handleMoreAction(item.label)}
            >
              <Text style={{ color: item.color }} className="text-lg font-bold">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SheetContainer>
    );
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Background Image */}
      <View className="absolute inset-0">
        {currentStory.image ? (
          <Image 
            key={currentStory.image}
            source={{ uri: currentStory.image }} 
            className="w-full h-full" 
            resizeMode="cover" 
          />
        ) : (
          <View className="flex-1 bg-zinc-900" />
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <SafeAreaView className="flex-1">
        {/* Top Section - Always visible */}
        <View className="px-4">
          {renderProgressBar()}
          
          <View className="flex-row justify-between items-center mt-6">
            <View className="flex-row items-center">
              <Image source={{ uri: (avatar as string) || 'https://i.pravatar.cc/150?u=myavatar' }} className="w-10 h-10 rounded-full border border-white/20" />
              <View className="ml-3">
                <Text className="text-white font-bold text-base">{(username as string) || 'User'}</Text>
                <View className="flex-row items-center mt-0.5">
                   <Ionicons name="musical-notes" size={12} color="white" />
                   <Text className="text-white text-[10px] ml-1 opacity-80" numberOfLines={1}>
                     {currentStory.title || 'Story'}
                   </Text>
                </View>
              </View>
            </View>
            <View className="flex-row items-center">
               <Text className="text-white text-xs opacity-70 mr-4">1 hr</Text>
               <TouchableOpacity onPress={() => router.back()}>
                 <Ionicons name="close" size={32} color="white" />
               </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Story Navigation & Interactions - Only visible when no sheet is open */}
        {activeTab === 'none' && (
          <>
            <View style={styles.navContainer}>
              <TouchableOpacity 
                className="flex-1" 
                onPress={prevStory}
                onLongPress={() => setIsPaused(true)}
                onPressOut={() => setIsPaused(false)}
              />
              <TouchableOpacity 
                className="flex-1" 
                onPress={nextStory}
                onLongPress={() => setIsPaused(true)}
                onPressOut={() => setIsPaused(false)}
              />
            </View>

            <View className="absolute bottom-10 w-full px-4 z-20">
              <View className="flex-row justify-between items-center mb-6">
                <View className="flex-row items-center">
                  <TouchableOpacity onPress={() => setActiveTab('views')} className="mr-3">
                     <View className="flex-row items-center bg-black/40 px-3 py-2 rounded-full border border-white/10">
                        <Image source={{ uri: 'https://i.pravatar.cc/150?u=v1' }} className="w-6 h-6 rounded-full" />
                        <Image source={{ uri: 'https://i.pravatar.cc/150?u=v2' }} className="w-6 h-6 rounded-full -ml-2" />
                     </View>
                  </TouchableOpacity>
                </View>
                <View className="flex-row items-center space-x-4">
                  <TouchableOpacity onPress={() => setActiveTab('share')}><Ionicons name="paper-plane-outline" size={28} color="white" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => setActiveTab('mention')}><MaterialCommunityIcons name="at" size={28} color="white" /></TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setActiveTab('more')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="ellipsis-horizontal" size={28} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row items-center space-x-3">
                {isCommentingEnabled ? (
                  <View className="flex-1 flex-row items-center bg-black/40 rounded-full px-5 h-14 border border-white/10">
                    <TextInput 
                      placeholder="Comment here.." 
                      placeholderTextColor="rgba(255,255,255,0.6)" 
                      className="flex-1 text-white text-base"
                      onFocus={() => setIsPaused(true)}
                      onBlur={() => setIsPaused(false)}
                    />
                    <Image source={{ uri: currentUserProfile?.profile_picture || 'https://i.pravatar.cc/150?u=me' }} className="w-8 h-8 rounded-full border border-white/20" />
                    <Text className="ml-2 text-xl">🧸</Text>
                  </View>
                ) : (
                  <View className="flex-1 h-14 justify-center items-center bg-black/20 rounded-full border border-white/5">
                    <Text className="text-white/40 font-medium">Commenting disabled</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => setIsLiked(!isLiked)} className="w-14 h-14 items-center justify-center bg-black/40 rounded-full border border-white/10">
                  <Ionicons name={isLiked ? "heart" : "heart-outline"} size={28} color={isLiked ? "#EF4444" : "white"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('share')} className="w-14 h-14 items-center justify-center bg-black/40 rounded-full border border-white/10">
                  <Ionicons name="paper-plane-outline" size={26} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Sheets */}
        {activeTab === 'share' && renderShareSheet()}
        {activeTab === 'views' && renderViewsSheet()}
        {activeTab === 'mention' && renderMentionSheet()}
        {activeTab === 'more' && renderMoreSheet()}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 10,
    marginTop: 100,
    marginBottom: 150,
  },
});

export default StoryViewer;
