import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, Image, StatusBar, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; 
import { router } from 'expo-router';

// Data Import
import { EVENT_DATA } from '@/constants/eventDetails';

// Internal Components
import { Tag } from '@/components/Events/Tag';
import { StatItem } from '@/components/Events/StatItem';
import { TabSection } from '@/components/Events/TabSection';
import { InfoRow } from '@/components/Events/InfoRow';
import { ExpandableText } from '@/components/Events/ExpandableText';
import { DateCard } from '@/components/Events/DateCard';
import { MapSection } from '@/components/Events/MapSection';
import { GuestCard } from '@/components/Events/GuestCard';
import { PhotoCard } from '@/components/Events/PhotoCard';
import { HashtagItem } from '@/components/Events/HashtagItem';
import AdditionalInfoContent from '@/components/Events/AdditionalInfo';
import { EventFooterButtons } from '@/components/Events/EventButton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 380;

interface SinglePaidProps {
  hideHeader?: boolean;
}

const SinglePaid = ({ hideHeader = false }: SinglePaidProps) => {
  const [activeTab, setActiveTab] = useState("About");
  const [isLiked, setIsLiked] = useState(false); 

  const insets = useSafeAreaInsets();
  const tabs = ["About", "Dates", "Location", "Guests", "Photos", "Hashtags", "Additional info"];
  
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

  const handleBookingPress = () => {
    router.push('/Events/BooingPage'); 
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* --- HEADER SECTION --- */}
      <View>
        <ImageBackground 
          source={{ uri: EVENT_DATA.headerImage }} 
          style={{ height: SCREEN_HEIGHT * 0.45 }}
          className="w-full"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.9)', 'black']}
            className="flex-1 px-4 justify-end pb-4"
          >
            {/* Action Bar: Back, Like, Share (Persistent) */}
            {!hideHeader && (
              <View 
                style={{ top: insets.top > 0 ? insets.top : 20 }} 
                className="absolute left-0 right-0 flex-row justify-between px-4 z-50"
              >
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-black/50 items-center justify-center">
                  <Ionicons name="chevron-back" size={24} color="white" />
                </TouchableOpacity>
                
                <View className="flex-row gap-3">
                  <TouchableOpacity 
                    onPress={() => setIsLiked(!isLiked)}
                    className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
                  >
                    <Ionicons 
                      name={isLiked ? "heart" : "heart-outline"} 
                      size={22} 
                      color={isLiked ? "#8B5CF6" : "white"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity className="w-10 h-10 rounded-full bg-black/50 items-center justify-center">
                    <Ionicons name="share-social-outline" size={22} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View className="flex-row mb-2">
              {EVENT_DATA.tags.map((tag, idx) => (
                <Tag key={idx} label={tag.label} />
              ))}
            </View>

            <View className="flex-row items-center mb-1 flex-wrap">
              <Text 
                style={{ fontSize: isSmallDevice ? 24 : 32 }}
                className="text-white font-rubik-bold mr-2"
              >
                {EVENT_DATA.title}
              </Text>
              <Ionicons name="trending-up-outline" size={isSmallDevice ? 20 : 24} color="white" />
            </View>
            
            <TouchableOpacity className="flex-row items-center mb-4">
              <Image source={{ uri: EVENT_DATA.brandImage }} className="w-6 h-6 rounded-full mr-2 bg-gray-700" />
              <Text className="text-gray-400 font-rubik-medium text-sm">{EVENT_DATA.brand}</Text>
            </TouchableOpacity>

            <View className="flex-row">
              <StatItem icon="people-outline" count={EVENT_DATA.stats.people} />
              <StatItem icon="ticket-outline" count={EVENT_DATA.stats.tickets} />
              <StatItem icon="paper-plane-outline" count={EVENT_DATA.stats.shares} />
            </View>
          </LinearGradient>
        </ImageBackground>

        <View className="bg-black">
          <TabSection 
            tabs={tabs} 
            activeTab={activeTab} 
            onTabPress={handleTabPress} 
          />
        </View>
      </View>

      {/* --- SWIPEABLE CONTENT PAGES --- */}
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        className="flex-1"
      >
        {tabs.map((tab) => (
          <View key={tab} style={{ width: SCREEN_WIDTH }}>
            <ScrollView 
              className="px-4"
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
            >
              {tab === "About" && (
                <View className="mt-2">
                  <InfoRow icon="calendar" label={EVENT_DATA.about.dateTime} color="#8B5CF6" />
                  <InfoRow icon="location" label={EVENT_DATA.about.address} color="#8B5CF6" />
                  <InfoRow icon="ticket" label={EVENT_DATA.about.price} color="#8B5CF6" />
                  <ExpandableText title="Description" text={EVENT_DATA.about.description} />
                  <ExpandableText title="Event guidelines" text={EVENT_DATA.about.guidelines} />
                </View>
              )}

              {tab === "Dates" && (
                <View className="flex-row flex-wrap justify-between mt-2">
                  {EVENT_DATA.dates.map((date, i) => (
                    <View key={i} style={{ width: (SCREEN_WIDTH - 48) / 3 }}>
                       <DateCard date={date} />
                    </View>
                  ))}
                </View>
              )}

              {tab === "Location" && (
                <View className="mt-2">
                  <InfoRow icon="location" label={EVENT_DATA.about.address} color="#8B5CF6" />
                  <MapSection address={EVENT_DATA.about.address} />
                </View>
              )}

              {tab === "Guests" && (
                <View className="flex-row flex-wrap justify-between mt-4">
                  {EVENT_DATA.guests.map((g) => (
                    <View key={g.id} style={{ width: (SCREEN_WIDTH - 48) / 2 }}>
                       <GuestCard name={g.name} lastName={g.lastName} image={g.image} />
                    </View>
                  ))}
                </View>
              )}

              {tab === "Photos" && (
                <View className="flex-row flex-wrap gap-[10px] mt-2">
                  {EVENT_DATA.photos.map((p) => (
                    <PhotoCard key={p.id} uri={p.uri} isVideo={p.isVideo} />
                  ))}
                </View>
              )}

              {tab === "Hashtags" && (
                <View className="flex-row flex-wrap mt-4">
                  {EVENT_DATA.hashtags.map((h, i) => <HashtagItem key={i} label={h} />)}
                </View>
              )}

              {tab === "Additional info" && <AdditionalInfoContent />}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {/* --- SINGLE BUTTON FOOTER --- */}
      <View 
        style={{ paddingBottom: insets.bottom || 20, backgroundColor: '#121212' }}
        className="absolute bottom-0 left-0 right-0 px-4 pt-4 border-t border-gray-900"
      >
        <EventFooterButtons 
          // Note: By not passing 'leftText', the component should only render the right button
          rightText={`Book Tickets • ${EVENT_DATA.about.price}`}
          rightIcon="ticket"
          onRightPress={handleBookingPress}
          rightColors={['#A855F7', '#6366F1']} 
        />
      </View>
    </View>
  );
};

export default SinglePaid;
