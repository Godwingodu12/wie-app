import { View, Text, TouchableOpacity, ScrollView, Keyboard, Image, RefreshControl, ActivityIndicator } from 'react-native'
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/theme'
import EventCategoryList from '@/components/EventCategoryList'
import { EVENT_CATEGORIES } from '@/constants/eventCategoryData'
import EventHorizontalList from '@/components/Events/HorizontalList'
import EventCard from '@/components/Events/Card'
import { SearchBar } from '@/components/Searchbar'
import { SelectionBottomSheet } from '@/components/BottomSheet'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { TabHeader } from '@/components/Header/TabHeader'
import { ticketUserService } from '@/services/ticketUserService'

// --- Small Card Component for Search Results ---
const SearchResultCard = ({ item }: { item: any }) => (
  <TouchableOpacity 
    activeOpacity={0.9} 
    className="flex-row bg-[#1C2024] rounded-2xl p-2 mb-3 items-center"
  >
    <Image 
      source={{ uri: item.image }} 
      className="w-20 h-20 rounded-xl" 
      resizeMode="cover" 
    />
    <View className="flex-1 ml-3 justify-center">
      <Text className="text-white font-rubik-bold text-base" numberOfLines={1}>
        {item.title}
      </Text>
      <View className="flex-row items-center mt-1">
        <Ionicons name="location-outline" size={14} color={COLORS.primary || '#007AFF'} />
        <Text className="text-gray-400 text-xs ml-1" numberOfLines={1}>
          {item.location}
        </Text>
      </View>
      <Text className="text-gray-500 text-xs mt-1">
        {item.date} • {item.time}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#71717a" className="mr-2" />
  </TouchableOpacity>
);

const CATEGORY_IMAGES: Record<string, string> = {
  'Dance': 'https://images.unsplash.com/photo-1508704019882-f9cf40e475b4',
  'Music': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d',
  'Art': 'https://images.unsplash.com/photo-1541963463532-d68292c34b19',
  'Sports': 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d',
  'Photography': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
  'Technology': 'https://images.unsplash.com/photo-1518770660439-4636190af475',
  'Food': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
  'Travel': 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
  'Education': 'https://images.unsplash.com/photo-152305085306e-88e4f6e082ee',
  'Business': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
  'Health': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528',
  'Fashion': 'https://images.unsplash.com/photo-1483985988355-763728e1935b',
};

const Events = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSortVisible, setIsSortVisible] = useState(false);
  const [sortBy, setSortBy] = useState('Default');
  const [isFocused, setIsFocused] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<any[]>(EVENT_CATEGORIES);
  const [featuredEvent, setFeaturedEvent] = useState<any>(null);
  const [allEvents, setAllEvents] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      // Fetch Categories & Initial Events
      const initialEvents = await ticketUserService.getInitialEvents();
      
      // If we still want categories, we should ideally fetch them from a specific endpoint
      // but for now, we use the static ones since initialEvents is a flat list.
      setCategories(EVENT_CATEGORIES);

      if (initialEvents && Array.isArray(initialEvents) && initialEvents.length > 0) {
        const mappedInitial = initialEvents.map((ev: any) => ({
          id: ev._id || ev.id,
          image: ev.event_banner || ev.event_portrait || 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1000',
          title: ev.event_name,
          date: ev.event_dates?.[0]?.start_date ? new Date(ev.event_dates[0].start_date).toLocaleDateString() : 'TBA',
          time: ev.event_dates?.[0]?.start_time || 'TBA',
          location: ev.location || ev.venue || 'Global',
          isFree: ev.isFree || false,
          stats: {
            likes: ev.like || 0,
            attendees: ev.totalBookings || 0,
            shares: 0
          }
        }));
        setAllEvents(mappedInitial);
        setFeaturedEvent(mappedInitial[0]);
      }

      // Fetch Popular Events
      const popular = await ticketUserService.getPopularEvents(10);
      if (popular && popular.length > 0) {
        const mappedEvents = popular.map((ev: any) => ({
          id: ev._id || ev.id,
          image: ev.event_banner || ev.event_portrait || 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1000',
          title: ev.event_name,
          date: ev.event_dates?.[0]?.start_date ? new Date(ev.event_dates[0].start_date).toLocaleDateString() : 'TBA',
          time: ev.event_dates?.[0]?.start_time || 'TBA',
          location: ev.location || ev.venue || 'Global',
          isFree: ev.isFree || false,
          stats: {
            likes: ev.like || 0,
            attendees: ev.totalBookings || 0,
            shares: 0
          }
        }));
        
        setAllEvents(mappedEvents);
        setFeaturedEvent(mappedEvents[0]); // Feature the first popular event
      } else {
        // Fallback mock
        const mockEv = {
          id: '1',
          image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1000",
          title: "Coldplay Concert",
          date: "2026-01-01",
          time: "10:00",
          location: "Perinthalmanna",
          isFree: true,
          stats: { likes: 100, attendees: 100, shares: 100 }
        };
        setAllEvents([mockEv]);
        setFeaturedEvent(mockEv);
      }
    } catch (error) {
      console.error("Failed to fetch events data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allEvents.filter(event => 
      event.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allEvents]);

  // Handle Cancel Action
  const handleCancelSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSearchQuery('');
    setIsFocused(false);
    Keyboard.dismiss();
  };

  if (loading) {
    return (
      <SafeAreaView className='flex-1 bg-black justify-center items-center'>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-black'>
      {/* Header */}
      <TabHeader />

      <View className='mt-2'>
        <SearchBar
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
          isFocused={isFocused}
          setIsFocused={setIsFocused}
          onCancel={handleCancelSearch}
          onPressOptions={() => setIsSortVisible(true)}
          placeholder='Search events...'
        />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 50 }}
        bounces={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
        }
      >
        {searchQuery.length > 0 ? (
          <View className="px-3 pt-4">
            <Text className="text-gray-400 font-rubik-medium mb-4">
              Found {filteredEvents.length} events
            </Text>
            {filteredEvents.map((item) => (
              <SearchResultCard key={item.id} item={item} />
            ))}
          </View>
        ) : (
          <>
            <View className="px-3">
              <View className="flex-row justify-between mt-6">
                <Text className="text-white font-rubik-bold text-xl">Event Categories</Text>
                <TouchableOpacity><Text className="text-primary text-sm font-semibold">See all</Text></TouchableOpacity>
              </View>
              <EventCategoryList data={categories} />
            </View>
            <View className='pt-5'><EventHorizontalList sectionTitle="Trending Events" /></View>
            
            {featuredEvent && (
              <View className='pt-5'>
                <EventCard 
                  image={featuredEvent.image} 
                  title={featuredEvent.title} 
                  date={featuredEvent.date} 
                  time={featuredEvent.time} 
                  location={featuredEvent.location} 
                  isFree={featuredEvent.isFree} 
                  stats={featuredEvent.stats} 
                  onPress={()=>router.push('/Events/MultiEvents')}
                />
              </View>
            )}
            
            <View className='pt-5'><EventHorizontalList sectionTitle="Nearby Events" /></View>
          </>
        )}
      </ScrollView>

      <SelectionBottomSheet
        isVisible={isSortVisible}
        onClose={() => setIsSortVisible(false)}
        title="Sort Events"
        options={['Default', 'Date: Soonest', 'Popularity']}
        selectedValue={sortBy}
        onSelect={setSortBy}
      />
    </SafeAreaView>
  )
}

export default Events
