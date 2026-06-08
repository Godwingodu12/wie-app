import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar, 
  TextInput,
  ScrollView,
  Keyboard,
  Image,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Enable Layout Animation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- MOCK DATA ---
const EVENT_LIST = [
  'Coldplay concert, Sreekrishnapuram',
  'Bellie Eillish concert, Kunnamkulam',
  'Invento 2025, Palakkad',
  'UI/UX meetup, Malappuram',
  'Welcome to illuminati, Bavaria',
  'Tech Summit 2026, Kochi',
  'Auto Expo, Delhi'
];

// --- YES/NO CARD COMPONENT ---
const YesNoCard = ({ label, imageSource, isSelected, onSelect }: any) => (
  <TouchableOpacity 
    onPress={onSelect}
    activeOpacity={0.8}
    className={`flex-1 h-[120px] rounded-3xl items-center justify-center border mx-2 ${
      isSelected 
        ? 'bg-[#e4e4e7] border-white' 
        : 'bg-[#161618] border-[#27272a]'
    }`}
  >
    <Image source={imageSource} className="w-10 h-10 mb-3" resizeMode="contain" />
    <Text className={`font-bold text-[18px] ${isSelected ? 'text-black' : 'text-[#71717a]'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);

import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

export default function UpcomingEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  
  // --- STATE ---
  const [attending, setAttending] = useState<'yes' | 'no' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 🔥 MULTI-SELECT STATE
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [showSelectedList, setShowSelectedList] = useState(false); // To toggle visibility
  
  // --- FILTER LOGIC ---
  const filteredEvents = EVENT_LIST.filter(event => 
    event.toLowerCase().includes(searchQuery.toLowerCase()) && 
    !selectedEvents.includes(event) // Don't show already selected ones
  );

  // 1. ADD EVENT
  const handleSelectEvent = (eventName: string) => {
    if (!selectedEvents.includes(eventName)) {
        setSelectedEvents([...selectedEvents, eventName]);
        setShowSelectedList(true); // Auto-open list to show it was added
    }
    setSearchQuery(''); 
    Keyboard.dismiss();
  };

  // 2. MANUAL ADD
  const handleManualSubmit = () => {
    if (searchQuery.trim().length > 0) {
      handleSelectEvent(searchQuery.trim());
    }
  };

  // 3. REMOVE EVENT
  const handleRemoveEvent = (eventName: string) => {
    setSelectedEvents(selectedEvents.filter(e => e !== eventName));
  };

  // 4. TOGGLE LIST VISIBILITY
  const toggleSelectedList = () => {
    setShowSelectedList(!showSelectedList);
  };

  const handleFocus = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  const handleNext = () => {
    console.log("Attending:", attending, "Selected Events:", selectedEvents);
    router.push('/(protected)/(tabs)');
  };

  const handleSkip = () => {
    router.push('/(protected)/(tabs)');
  };
  return (
    <View className="flex-1 bg-[#09090b]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View className="flex-1" style={{ paddingTop: insets.top }}>
          
          {/* HEADER */}
          <View className="flex-row items-center h-[60px] px-5 mb-2 shrink-0">
            <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <View className="flex-1 h-1 bg-[#27272a] mx-4 rounded-full overflow-hidden">
              <View className="h-full bg-white w-[28%] rounded-full" />
            </View>
            <Text className="text-[#78716c] text-[13px] font-semibold">02/07</Text>
          </View>

          {/* SCROLLABLE CONTENT */}
          <ScrollView 
            ref={scrollRef}
            className="flex-1 px-5" 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 150 }} 
          >
            
            <Text className="text-white text-[28px] font-bold mt-2 mb-8 leading-tight">
               Are you attending any upcoming event?
            </Text>

            {/* YES / NO CARDS */}
            <View className="flex-row justify-between -mx-2 mb-8">
              <YesNoCard 
                  label="Yes" 
                  imageSource={require('@/assets/images/connection/yes_option.png')}
                  isSelected={attending === 'yes'} 
                  onSelect={() => setAttending('yes')}
              />
              <YesNoCard 
                  label="No" 
                  imageSource={require('@/assets/images/connection/no_option.png')}
                  isSelected={attending === 'no'} 
                  onSelect={() => {
                    setAttending('no');
                    setSelectedEvents([]);
                    setSearchQuery(''); 
                  }} 
              />
            </View>

            {/* SEARCH & SELECTION SECTION */}
            {attending === 'yes' && (
              <Animated.View 
                entering={FadeIn}
                exiting={FadeOut}
                className="bg-[#161618] border border-[#27272a] rounded-[22px] overflow-hidden mb-5"
              >
                
                {/* 🔥 HEADER / ACCORDION TOGGLE */}
                <TouchableOpacity 
                    activeOpacity={0.7}
                    onPress={toggleSelectedList}
                    className="flex-row items-center justify-between px-5 py-4 border-b border-[#27272a]/50"
                >
                   <Text className={`${selectedEvents.length > 0 ? 'text-white font-medium' : 'text-[#71717a]'} text-[14px]`}>
                      {selectedEvents.length > 0 
                        ? `${selectedEvents.length} Event${selectedEvents.length > 1 ? 's' : ''} Selected`
                        : "Select your events"
                      }
                   </Text>
                   <Feather 
                      name={showSelectedList ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#71717a" 
                   />
                </TouchableOpacity>

                {/* 🔥 SELECTED ITEMS LIST (Shown when toggled open) */}
                {showSelectedList && selectedEvents.length > 0 && (
                    <Animated.View 
                      entering={FadeIn.duration(200)}
                      exiting={FadeOut.duration(200)}
                      layout={Layout.springify()}
                      className="px-4 pt-3 pb-1 flex-row flex-wrap gap-2 bg-[#1c1c1e]"
                    >
                        {selectedEvents.map((event, index) => (
                            <Animated.View 
                              key={event} 
                              layout={Layout.springify()}
                              className="flex-row items-center bg-[#27272a] rounded-lg px-3 py-2 mb-2"
                            >
                                <Text className="text-white text-[13px] mr-2 max-w-[200px]" numberOfLines={1}>
                                    {event}
                                </Text>
                                <TouchableOpacity onPress={() => handleRemoveEvent(event)}>
                                    <Ionicons name="close-circle" size={16} color="#71717a" />
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </Animated.View>
                )}

                {/* SEARCH INPUT AREA */}
                <View className="px-4 py-4">
                    <View className="flex-row items-center bg-[#222224] rounded-xl px-4 py-3 border border-[#27272a]">
                      <Feather name="search" size={18} color="#52525b" />
                      <TextInput
                        placeholder="Search or add manual..."
                        placeholderTextColor="#52525b"
                        value={searchQuery}
                        onFocus={handleFocus}
                        onChangeText={(text) => {
                            setSearchQuery(text);
                        }}
                        onSubmitEditing={handleManualSubmit}
                        returnKeyType="done"
                        className="flex-1 ml-3 text-white text-[15px]"
                      />
                    </View>
                </View>

                {/* SUGGESTION LIST */}
                {searchQuery.length > 0 && (
                  <Animated.View 
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    className="px-2 pb-4"
                  >
                    {filteredEvents.map((item, index) => (
                        <TouchableOpacity 
                          key={index} 
                          onPress={() => handleSelectEvent(item)}
                          className="px-4 py-3 rounded-xl active:bg-[#27272a]"
                        >
                          <Text className="text-[#a1a1aa] text-[15px]">{item}</Text>
                        </TouchableOpacity>
                    ))}

                    {/* Manual Entry Option */}
                    {filteredEvents.length === 0 && (
                       <TouchableOpacity 
                         onPress={handleManualSubmit} 
                         className="px-4 py-3"
                       >
                         <Text className="text-[#8b5cf6] text-[15px]">
                            Add &quot;{searchQuery}&quot;
                         </Text>
                       </TouchableOpacity>
                    )}
                  </Animated.View>
                )}
              </Animated.View>
            )}
          </ScrollView>

          {/* FOOTER */}
          <View className="bg-[#09090b] pt-2 pb-5 px-5 border-t border-[#1c1c1e]">
            <View className="flex-row justify-between items-center gap-3">
              <TouchableOpacity 
                onPress={handleSkip}
                className="flex-1 h-[54px] justify-center items-center rounded-full border border-[#333] bg-[#18181b]"
              >
                <Text className="text-white text-[16px] font-semibold">Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                  onPress={handleNext}
                  className="flex-1 h-[54px] rounded-full overflow-hidden"
              >
                   <LinearGradient
                      colors={['#A855F7', '#7C3AED']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                   >
                      <Text className="text-white font-bold text-[16px]">Next</Text>
                   </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
