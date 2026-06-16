import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 4;
const IMAGE_SIZE = width / COLUMN_COUNT;

type TabType = 'Media' | 'Docs' | 'Links';

const MediaLinksDocs = () => {
  const params = useLocalSearchParams();
  const name = Array.isArray(params.name) ? params.name[0] : params.name || 'User';
  const [activeTab, setActiveTab] = useState<TabType>('Media');

  const mediaData = [
    { id: '1', type: 'image', uri: 'https://picsum.photos/400?random=1', section: 'Recent' },
    { id: '2', type: 'video', uri: 'https://picsum.photos/400?random=2', section: 'Recent' },
    { id: '3', type: 'image', uri: 'https://picsum.photos/400?random=3', section: 'Recent' },
    { id: '4', type: 'image', uri: 'https://picsum.photos/400?random=4', section: 'Recent' },
    { id: '5', type: 'image', uri: 'https://picsum.photos/400?random=5', section: 'Recent' },
    { id: '6', type: 'video', uri: 'https://picsum.photos/400?random=6', section: 'Recent' },
    { id: '7', type: 'image', uri: 'https://picsum.photos/400?random=7', section: 'Recent' },
    { id: '8', type: 'image', uri: 'https://picsum.photos/400?random=8', section: 'Last week' },
    { id: '9', type: 'image', uri: 'https://picsum.photos/400?random=9', section: 'Last week' },
    { id: '10', type: 'image', uri: 'https://picsum.photos/400?random=10', section: 'Last week' },
    { id: '11', type: 'image', uri: 'https://picsum.photos/400?random=11', section: 'Last week' },
    { id: '12', type: 'image', uri: 'https://picsum.photos/400?random=12', section: 'Last week' },
    { id: '13', type: 'image', uri: 'https://picsum.photos/400?random=13', section: 'Last week' },
    { id: '14', type: 'video', uri: 'https://picsum.photos/400?random=14', section: 'Last week' },
    { id: '15', type: 'image', uri: 'https://picsum.photos/400?random=15', section: 'Last week' },
    { id: '16', type: 'image', uri: 'https://picsum.photos/400?random=16', section: 'Last week' },
    { id: '17', type: 'video', uri: 'https://picsum.photos/400?random=17', section: 'Last week' },
    { id: '18', type: 'image', uri: 'https://picsum.photos/400?random=18', section: 'Last month' },
    { id: '19', type: 'image', uri: 'https://picsum.photos/400?random=19', section: 'Last month' },
    { id: '20', type: 'image', uri: 'https://picsum.photos/400?random=20', section: 'Last month' },
    { id: '21', type: 'image', uri: 'https://picsum.photos/400?random=21', section: 'Last month' },
  ];

  const docsData = [
    { id: '1', name: 'Resume_SamAlex.pdf', details: '1 page • 65kB • PDF', date: '26/08/25', type: 'pdf', icon: 'file-pdf', color: '#EF4444', section: 'Recent' },
    { id: '2', name: 'Azrael.mp3', details: '2MB • MP3', date: '26/08/25', type: 'audio', icon: 'music', color: '#8B5CF6', section: 'Recent' },
    { id: '3', name: 'Attendance.xlsx', details: '1 page • 65kB • Excel', date: '26/08/25', type: 'excel', icon: 'file-excel', color: '#10B981', section: 'Recent' },
    { id: '4', name: 'Project_slides.ppt', details: '25 slides • 165kB • PDF', date: '26/08/25', type: 'ppt', icon: 'file-powerpoint', color: '#FBBF24', section: 'Last week' },
    { id: '5', name: 'Onam2.mp4', details: '2.1 MB • Video', date: '26/08/25', type: 'video', icon: 'file-video', color: '#EF4444', section: 'Last week' },
    { id: '6', name: 'Onam(1).mp4', details: '5 MB • Video', date: '26/08/25', type: 'video', icon: 'file-video', color: '#EF4444', section: 'Last week' },
    { id: '7', name: 'Resume.docx', details: '25kB • Word', date: '26/08/25', type: 'word', icon: 'file-word', color: '#3B82F6', section: 'Last week' },
    { id: '8', name: 'Logo.svg', details: '1 MB • SVG', date: '26/08/25', type: 'svg', icon: 'file-code', color: '#64748B', section: 'Last week' },
    { id: '9', name: 'Onam.mp4', details: '5 MB • Video', date: '26/08/25', type: 'video', icon: 'file-video', color: '#EF4444', section: 'Last month' },
  ];

  const renderTabButton = (type: TabType, icon: string) => {
    const isActive = activeTab === type;
    return (
      <TouchableOpacity 
        onPress={() => setActiveTab(type)}
        className={`flex-1 flex-row items-center justify-center py-2.5 mx-1 rounded-full ${isActive ? '' : 'bg-transparent'}`}
      >
        {isActive ? (
          <LinearGradient
            colors={['#C084FC', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="absolute inset-0 rounded-full"
          />
        ) : null}
        <MaterialCommunityIcons name={icon as any} size={20} color="white" />
        <Text className="text-white ml-2 font-rubik-bold text-[15px]">{type}</Text>
      </TouchableOpacity>
    );
  };

  const renderMediaItem = (item: any) => (
    <View style={{ width: IMAGE_SIZE - 2, height: IMAGE_SIZE - 2 }} className="m-[1px] bg-zinc-900 overflow-hidden relative">
      <Image source={{ uri: item.uri }} className="w-full h-full" />
      {item.type === 'video' && (
        <View className="absolute top-2 right-2">
          <Ionicons name="play-circle-outline" size={20} color="white" />
        </View>
      )}
    </View>
  );

  const renderDocItem = (item: any) => (
    <TouchableOpacity className="flex-row items-center px-5 py-4 active:bg-white/5">
      <View className="w-12 h-12 items-center justify-center mr-4">
        <FontAwesome5 name={item.icon} size={28} color={item.color} />
      </View>
      <View className="flex-1">
        <Text className="text-white text-[15px] font-rubik-medium" numberOfLines={1}>{item.name}</Text>
        <Text className="text-zinc-500 text-[12px] font-rubik-regular mt-0.5">{item.details}</Text>
      </View>
      <Text className="text-zinc-500 text-[12px] font-rubik-regular">{item.date}</Text>
    </TouchableOpacity>
  );

  const renderSectionHeader = (title: string) => (
    <View className="px-5 pt-6 pb-4">
      <Text className="text-white text-[17px] font-rubik-bold">{title}</Text>
    </View>
  );

  const groupedMedia = mediaData.reduce((acc: any, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const groupedDocs = docsData.reduce((acc: any, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="mr-3 w-10 h-10 items-center justify-center rounded-full bg-[#1C1C1E]"
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-rubik-bold">{name}</Text>
      </View>

      {/* Tab Bar */}
      <View className="flex-row px-4 py-2 mt-2">
        <View className="flex-row flex-1 bg-[#1C1C1E] rounded-full p-1">
          {renderTabButton('Media', 'image-multiple')}
          {renderTabButton('Docs', 'file-document-outline')}
          {renderTabButton('Links', 'link-variant')}
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {activeTab === 'Media' && (
          <View className="pb-10">
            {Object.keys(groupedMedia).map((section) => (
              <View key={section}>
                {renderSectionHeader(section)}
                <View className="flex-row flex-wrap">
                  {groupedMedia[section].map((item: any) => (
                    <View key={item.id}>{renderMediaItem(item)}</View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'Docs' && (
          <View className="pb-10">
            {Object.keys(groupedDocs).map((section) => (
              <View key={section}>
                {renderSectionHeader(section)}
                {groupedDocs[section].map((item: any) => (
                  <View key={item.id}>{renderDocItem(item)}</View>
                ))}
              </View>
            ))}
          </View>
        )}

        {activeTab === 'Links' && (
          <View className="flex-1 items-center justify-center pt-20">
             <Text className="text-zinc-500 font-rubik-medium">No links shared yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MediaLinksDocs;
