import React, { useState, useRef, useMemo } from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, Image, StatusBar, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; 
import { router } from 'expo-router';
import { EVENT_DATA } from '@/constants/eventDetails';
import { Tag } from '@/components/Events/Tag';
import { StatItem } from '@/components/Events/StatItem';
import { TabSection } from '@/components/Events/TabSection';
import { InfoRow } from '@/components/Events/InfoRow';
import { ExpandableText } from '@/components/Events/ExpandableText';
import { MapSection } from '@/components/Events/MapSection';
import { GuestCard } from '@/components/Events/GuestCard';
import { PhotoCard } from '@/components/Events/PhotoCard';
import { HashtagItem } from '@/components/Events/HashtagItem';
import AdditionalInfoContent from '@/components/Events/AdditionalInfo';
import { EventFooterButtons } from '@/components/Events/EventButton';

import SingleFree from './SingleFree'; 
import SinglePaid from './SinglePaid';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 380;

const SUB_EVENTS = [
    { id: '1', title: "UI/UX Design Masterclass", image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd", category: "Workshop", time: "10:00 AM", location: "Hall A", price: 49 },
    { id: '2', title: "AI & Neural Networks", image: "https://images.unsplash.com/photo-1677442136019-21780ecad995", category: "Keynote", time: "01:00 PM", location: "Main Stage", price: 0 }, // Free Example
    { id: '3', title: "Startup Pitch Deck", image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd", category: "Competition", time: "04:30 PM", location: "Room 102", price: 50 },
];

const MultiEvents = () => {
  const [activeTab, setActiveTab] = useState("Lineup");
  const [isLiked, setIsLiked] = useState(false); 
  const [selectedSubEvent, setSelectedSubEvent] = useState<any>(null);
  const insets = useSafeAreaInsets();
  
  const totalPrice = useMemo(() => {
    return SUB_EVENTS.reduce((sum, item) => {
      const val = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      return sum + (Number(val) || 0);
    }, 0);
  }, []);

  const tabs = ["Lineup", "About", "Location", "Guests", "Photos", "Hashtags", "Additional info"];
  const horizontalScrollRef = useRef<ScrollView>(null);

  const handleTabPress = (tab: string) => {
    const index = tabs.indexOf(tab);
    horizontalScrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setActiveTab(tab);
  };

  const handleMomentumScrollEnd = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / SCREEN_WIDTH);
    setActiveTab(tabs[index]);
  };

  // --- CONDITIONAL RENDERING FOR SUB-EVENTS ---
  if (selectedSubEvent) {
    // Logic to determine if sub-event is free
    const isFree = !selectedSubEvent.price || selectedSubEvent.price === 0 || selectedSubEvent.price === "Free";

    return (
      <View className="flex-1 bg-black">
        <StatusBar barStyle="light-content" />
        
        {/* Persistent Sub-Event Header */}
        <View 
          style={{ top: insets.top + 10 }} 
          className="absolute left-0 right-0 flex-row justify-between px-4 z-[100]"
        >
          <TouchableOpacity 
            onPress={() => setSelectedSubEvent(null)}
            className="w-10 h-10 rounded-full bg-black/60 items-center justify-center border border-white/10"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View className="flex-row gap-3">
            <TouchableOpacity 
              onPress={() => setIsLiked(!isLiked)}
              className="w-10 h-10 rounded-full bg-black/60 items-center justify-center border border-white/10"
            >
              <Ionicons name={isLiked ? "heart" : "heart-outline"} size={22} color={isLiked ? "#8B5CF6" : "white"} />
            </TouchableOpacity>
            <TouchableOpacity className="w-10 h-10 rounded-full bg-black/60 items-center justify-center border border-white/10">
              <Ionicons name="share-social-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Component Choice */}
        {isFree ? (
          <SingleFree hideHeader={true} />
        ) : (
          <SinglePaid hideHeader={true} />
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Main Header */}
      <View>
        <ImageBackground source={{ uri: EVENT_DATA.headerImage }} style={{ height: SCREEN_HEIGHT * 0.42 }} className="w-full">
          <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.9)', 'black']} className="flex-1 px-4 justify-end pb-4">
            
            <View style={{ top: insets.top > 0 ? insets.top : 20 }} className="absolute left-0 right-0 flex-row justify-between px-4 z-50">
              <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-black/50 items-center justify-center">
                <Ionicons name="chevron-back" size={24} color="white" />
              </TouchableOpacity>
              
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={() => setIsLiked(!isLiked)} className="w-10 h-10 rounded-full bg-black/50 items-center justify-center">
                  <Ionicons name={isLiked ? "heart" : "heart-outline"} size={22} color={isLiked ? "#8B5CF6" : "white"} />
                </TouchableOpacity>
                <TouchableOpacity className="w-10 h-10 rounded-full bg-black/50 items-center justify-center">
                  <Ionicons name="share-social-outline" size={22} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row mb-2">
              {EVENT_DATA.tags.map((tag, idx) => <Tag key={idx} label={tag.label} />)}
            </View>

            <View className="flex-row items-center mb-1 flex-wrap">
              <Text style={{ fontSize: isSmallDevice ? 26 : 32 }} className="text-white font-rubik-bold mr-2">{EVENT_DATA.title}</Text>
              <Ionicons name="flash" size={24} color="#8B5CF6" />
            </View>
            
            <TouchableOpacity className="flex-row items-center mb-4">
              <Image source={{ uri: EVENT_DATA.brandImage }} className="w-6 h-6 rounded-full mr-2 bg-gray-700" />
              <Text className="text-gray-400 font-rubik-medium text-sm">{EVENT_DATA.brand}</Text>
            </TouchableOpacity>

            <View className="flex-row">
              <StatItem icon="calendar-outline" count={`${SUB_EVENTS.length} Events`} />
              <StatItem icon="people-outline" count={EVENT_DATA.stats.people} />
              <StatItem icon="paper-plane-outline" count={EVENT_DATA.stats.shares} />
            </View>
          </LinearGradient>
        </ImageBackground>

        <View className="bg-black border-b border-zinc-900">
          <TabSection tabs={tabs} activeTab={activeTab} onTabPress={handleTabPress} />
        </View>
      </View>

      <ScrollView ref={horizontalScrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={handleMomentumScrollEnd} className="flex-1">
        {tabs.map((tab) => (
          <View key={tab} style={{ width: SCREEN_WIDTH }}>
            <ScrollView className="px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
              {tab === "Lineup" && (
                <View className="mt-4">
                  {SUB_EVENTS.map((item) => (
                    <TouchableOpacity key={item.id} onPress={() => setSelectedSubEvent(item)} className="mb-5 bg-zinc-900/50 rounded-3xl overflow-hidden border border-zinc-800">
                      <Image source={{ uri: item.image }} className="w-full h-44" />
                      <View className="p-4 flex-row justify-between items-center">
                        <View className="flex-1">
                          <Text className="text-purple-500 font-rubik-bold text-[10px] uppercase">{item.category}</Text>
                          <Text className="text-white text-xl font-rubik-bold mt-1">{item.title}</Text>
                          <View className="flex-row items-center mt-2">
                             <Ionicons name="location-outline" size={14} color="#8B5CF6" />
                             <Text className="text-zinc-400 text-xs ml-1 mr-4">{item.location}</Text>
                             <Ionicons name="time-outline" size={14} color="#8B5CF6" />
                             <Text className="text-zinc-400 text-xs ml-1">{item.time}</Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {/* Other tabs remain the same... */}
              {tab === "About" && <View className="mt-4"><InfoRow icon="calendar" label={EVENT_DATA.about.dateTime} color="#8B5CF6" /><InfoRow icon="location" label={EVENT_DATA.about.address} color="#8B5CF6" /><ExpandableText title="Description" text={EVENT_DATA.about.description} /></View>}
              {tab === "Location" && <View className="mt-4"><MapSection address={EVENT_DATA.about.address} /></View>}
              {tab === "Guests" && <View className="flex-row flex-wrap justify-between mt-4">{EVENT_DATA.guests.map((g) => (<View key={g.id} style={{ width: (SCREEN_WIDTH - 48) / 2 }}><GuestCard name={g.name} lastName={g.lastName} image={g.image} /></View>))}</View>}
              {tab === "Photos" && <View className="flex-row flex-wrap gap-[10px] mt-4">{EVENT_DATA.photos.map((p) => <PhotoCard key={p.id} uri={p.uri} isVideo={p.isVideo} />)}</View>}
              {tab === "Hashtags" && <View className="flex-row flex-wrap mt-6">{EVENT_DATA.hashtags.map((h, i) => <HashtagItem key={i} label={h} />)}</View>}
              {tab === "Additional info" && <AdditionalInfoContent />}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom || 20, backgroundColor: '#121212' }} className="absolute bottom-0 left-0 right-0 px-4 pt-4 border-t border-gray-900">
        <EventFooterButtons rightText={`All-Access Pass • $${totalPrice}`} rightIcon="flash" onRightPress={() => router.push('/Events/BooingPage')} />
      </View>
    </View>
  );
};

export default MultiEvents;
