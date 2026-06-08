import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StatusBar, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';

// Components
import { EVENT_DATA } from '@/constants/eventDetails';
import { TabSection } from '@/components/Events/TabSection';
import { ExpandableText } from '@/components/Events/ExpandableText';
import { HashtagItem } from '@/components/Events/HashtagItem';
import AdditionalInfoContent from '@/components/Events/AdditionalInfo';
import { VideoModuleCard } from '@/components/Events/VideoModuleCard';
import { EventFooterButtons } from '@/components/Events/EventButton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const RecordedEventPage = () => {
  const insets = useSafeAreaInsets();
  const tabs = ["Videos", "About", "Hashtags", "Additional info"];
  const [activeTab, setActiveTab] = useState("Videos");
  const horizontalScrollRef = useRef<ScrollView>(null);

  // 1. DATA: Lessons list
  const [lessons] = useState([
    { id: 1, title: '01. Introduction to the Course', duration: '05:20', status: 'completed', url: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' },
    { id: 2, title: '02. Setting up your Workspace', duration: '12:45', status: 'completed', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 3, title: '03. Fundamentals of Design', duration: '18:10', status: 'completed', url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
    { id: 4, title: '04. Advanced Logic & Flow', duration: '22:05', status: 'locked', url: '' },
  ]);

  // 2. STATE: Track current lesson
  const [currentLessonId, setCurrentLessonId] = useState(2); 

  // 3. PLAYER
  const activeLesson = lessons.find(l => l.id === currentLessonId) || lessons[0];
  const player = useVideoPlayer(activeLesson.url, (player) => {
    player.loop = false;
  });

  // 4. LOGIC
  const handleSelectLesson = (lesson: typeof lessons[0]) => {
    if (lesson.status !== 'locked') {
      setCurrentLessonId(lesson.id);
      player.replace(lesson.url);
      player.play();
    }
  };

  const handleTabPress = (tab: string) => {
    const index = tabs.indexOf(tab);
    horizontalScrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setActiveTab(tab);
  };

  return (
    <View className="flex-1 bg-[#050505]">
      <StatusBar barStyle="light-content" translucent />

      {/* --- VIDEO PLAYER --- */}
      <View 
        style={{ height: SCREEN_HEIGHT * 0.28, marginTop: insets.top }} 
        className="w-full bg-black z-10 overflow-hidden shadow-2xl"
      >
        <VideoView
          player={player}
          style={{ width: '100%', height: '100%' }}
          allowsFullscreen
          allowsPictureInPicture
          contentFit="contain"
        />
        
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 items-center justify-center border border-white/10"
        >
          <Ionicons name="arrow-back" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* --- INFO HEADER --- */}
      <View className="px-5 py-4 bg-[#050505]">
        <View className="flex-row items-center justify-between mb-1">
          {/* Changed text color to match the button gradient theme (Purple-600) */}
          <Text className="text-[#A855F7] font-rubik-medium text-[10px] uppercase tracking-widest">
            {currentLessonId === 1 ? 'Start Learning' : 'Continue Watching'}
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="stats-chart" size={12} color="#6B7280" />
            <Text className="text-gray-500 text-[10px] ml-1">Lesson {currentLessonId} of {lessons.length}</Text>
          </View>
        </View>

        <Text className="text-white font-rubik-bold text-xl leading-8">
          {activeLesson.title}
        </Text>
      </View>

      {/* --- TABS --- */}
      <View className="bg-[#050505] border-b border-gray-900">
        <TabSection tabs={tabs} activeTab={activeTab} onTabPress={handleTabPress} />
      </View>

      {/* --- CONTENT --- */}
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveTab(tabs[index]);
        }}
        className="flex-1"
      >
        {tabs.map((tab) => (
          <View key={tab} style={{ width: SCREEN_WIDTH }}>
            <ScrollView 
              className="px-5" 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 150 }}
            >
              {tab === "Videos" && (
                <View className="mt-4">
                  {lessons.map((lesson) => (
                    <VideoModuleCard 
                      key={lesson.id}
                      title={lesson.title}
                      duration={lesson.duration}
                      // Selected highlight matches the button's gradient start color (#A855F7)
                      status={currentLessonId === lesson.id ? 'playing' : (lesson.status as any)}
                      onPress={() => handleSelectLesson(lesson)}
                    />
                  ))}
                </View>
              )}

              {tab === "About" && (
                <View className="mt-4">
                  <ExpandableText title="About this course" text={EVENT_DATA.about.description} />
                  <View className="mt-6 flex-row items-center p-4 bg-gray-900/40 rounded-2xl">
                    <Image source={{ uri: EVENT_DATA.brandImage }} className="w-10 h-10 rounded-full" />
                    <View className="ml-3">
                      <Text className="text-white font-rubik-medium">{EVENT_DATA.brand}</Text>
                      <Text className="text-gray-500 text-xs">Course Instructor</Text>
                    </View>
                  </View>
                </View>
              )}

              {tab === "Hashtags" && (
                <View className="flex-row flex-wrap mt-4 gap-2">
                  {EVENT_DATA.hashtags.map((h, i) => <HashtagItem key={i} label={h} />)}
                </View>
              )}

              {tab === "Additional info" && <AdditionalInfoContent />}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {/* --- FOOTER (Matches Video Highlight Color) --- */}
      <View 
        style={{ paddingBottom: insets.bottom || 20, backgroundColor: '#121212' }}
        className="absolute bottom-0 left-0 right-0 px-4 pt-4 border-t border-gray-900"
      >
        <EventFooterButtons 
          rightText={`Resume Lesson ${currentLessonId}`}
          rightIcon="play-circle"
          onRightPress={() => player.play()}
          // Theme color consistent throughout the page
          rightColors={['#A855F7', '#6366F1']} 
        />
      </View>
    </View>
  );
};

export default RecordedEventPage;
