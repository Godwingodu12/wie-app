import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar, 
  TextInput,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Enable Layout Animation
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- DATA ---
const SKILL_DATA: Record<string, string[]> = {
  "Programming & Tech": ["Python", "JavaScript", "Web Dev", "Data Science", "Figma", "Framer", "Webflow"],
  "Creative Arts": ["Drawing", "Painting", "Digital Art", "Photography", "Videography"],
  "Music": ["Guitar", "Piano", "Vocals", "Music Production", "DJing"],
  "Languages": ["Spanish", "French", "German", "Mandarin", "Japanese"],
  "Business Skills": ["Marketing", "Finance", "Leadership", "Sales", "Project Management"],
  "Writing": ["Copywriting", "Creative Writing", "Technical Writing", "Journalism"],
  "Fitness": ["Yoga", "Calisthenics", "Weightlifting", "Running", "Martial Arts"]
};

const ALL_CATEGORIES = Object.keys(SKILL_DATA);

// --- REUSABLE SEARCH CARD COMPONENT ---
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

const SearchableCard = ({ 
  label, 
  placeholder, 
  data, 
  selectedItems, 
  onSelect, 
  onRemove, 
  searchQuery, 
  setSearchQuery,
  onFocus,
  disabled = false
}: any) => {
  
  const [showSelectedList, setShowSelectedList] = useState(false);

  const filteredData = data.filter((item: string) => 
    item.toLowerCase().includes(searchQuery.toLowerCase()) && 
    !selectedItems.includes(item)
  );

  const handleManualSubmit = () => {
    if (searchQuery.trim().length > 0) {
      onSelect(searchQuery.trim());
      setSearchQuery('');
      if (!showSelectedList) setShowSelectedList(true); 
    }
  };

  const toggleSelectedList = () => {
    setShowSelectedList(!showSelectedList);
  };

  return (
    <View className={`bg-[#161618] border border-[#27272a] rounded-[22px] overflow-hidden mb-5 ${disabled ? 'opacity-50' : 'opacity-100'}`}>
      
      {/* HEADER */}
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={toggleSelectedList}
        disabled={selectedItems.length === 0}
        className="flex-row items-center justify-between px-5 py-4 border-b border-[#27272a]/50 bg-[#1c1c1e]"
      >
        <Text className={`${selectedItems.length > 0 ? 'text-white font-medium' : 'text-[#71717a]'} text-[14px]`}>
           {selectedItems.length > 0 
             ? `${selectedItems.length} ${label} Selected`
             : placeholder
           }
        </Text>
        <Feather 
          name={showSelectedList ? "chevron-down" : "chevron-up"} 
          size={20} 
          color={selectedItems.length > 0 ? "#fff" : "#71717a"} 
        />
      </TouchableOpacity>

      <View className="pt-0">
        {/* SELECTED ITEMS LIST */}
        {showSelectedList && selectedItems.length > 0 && (
          <Animated.View 
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            layout={Layout.springify()}
            className="px-4 py-3 flex-row flex-wrap gap-2 bg-[#1c1c1e] border-b border-[#27272a]/30"
          >
            {selectedItems.map((item: string, index: number) => (
              <Animated.View 
                key={item} 
                layout={Layout.springify()}
                className="flex-row items-center bg-[#27272a] rounded-lg px-3 py-2 mb-1"
              >
                <Text className="text-white text-[13px] mr-2 max-w-[200px]" numberOfLines={1}>
                  {item}
                </Text>
                <TouchableOpacity onPress={() => onRemove(item)}>
                  <Ionicons name="close-circle" size={16} color="#71717a" />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* SEARCH INPUT */}
        <View className="px-4 py-4">
          <View className="flex-row items-center bg-[#222224] rounded-xl px-4 py-3 border border-[#27272a]">
            <Feather name="search" size={18} color="#52525b" />
            <TextInput
              editable={!disabled}
              placeholder={disabled ? "Select category above..." : "Search to add..."}
              placeholderTextColor="#52525b"
              value={searchQuery}
              onFocus={onFocus} 
              onChangeText={(text) => {
                setSearchQuery(text);
              }}
              onSubmitEditing={handleManualSubmit}
              returnKeyType="done"
              className="flex-1 ml-3 text-white text-[14px]"
            />
          </View>
        </View>

        {/* SUGGESTION LIST */}
        {!disabled && searchQuery.length > 0 && (
          <Animated.View 
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="px-2 pb-4"
          >
            {filteredData.map((item: string, index: number) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => {
                  onSelect(item);
                  setSearchQuery(''); 
                  if (!showSelectedList) setShowSelectedList(true); 
                }}
                className="px-4 py-3 rounded-xl active:bg-[#27272a]"
              >
                <Text className="text-[#d4d4d8] text-[14px]">{item}</Text>
              </TouchableOpacity>
            ))}

            {filteredData.length === 0 && (
              <TouchableOpacity onPress={handleManualSubmit} className="px-4 py-3">
                <Text className="text-[#8b5cf6] text-[14px]">
                  Add &quot;{searchQuery}&quot;
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </View>
    </View>
  );
};

import { connectionService } from '@/services/connectionService';
import { ActivityIndicator } from 'react-native';

export default function DevelopSkillScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [catSearch, setCatSearch] = useState('');
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [subSearch, setSubSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const activeSubList = selectedCategories.reduce((acc: string[], cat) => {
    return [...acc, ...(SKILL_DATA[cat] || [])];
  }, []);
  const uniqueSubList = [...new Set(activeSubList)];

  const handleFocus = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  const handleRemoveCategory = (item: string) => {
    const newCats = selectedCategories.filter(c => c !== item);
    setSelectedCategories(newCats);
    if (newCats.length === 0) setSelectedSubCategories([]);
  };

  const handleNext = async () => {
    if (selectedCategories.length === 0) return;
    
    setIsLoading(true);
    try {
        await connectionService.createSkillPurpose({
            categories: selectedCategories,
            skills: selectedSubCategories,
            status: 'draft'
        });
        router.push('/(protected)/(connection)/DevelopStageScreen'); 
    } catch (e) {
        console.error("Error saving skills", e);
        router.push('/(protected)/(connection)/DevelopStageScreen'); 
    } finally {
        setIsLoading(false);
    }
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
        <View style={{ paddingTop: insets.top }} className="flex-1">
          
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

          {/* SCROLL CONTENT */}
          <ScrollView 
            ref={scrollRef}
            className="flex-1 px-5" 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 150 }}
          >
            
            <View className="mt-2 mb-8">
                <Text className="text-white text-[28px] font-bold leading-tight">
                  What skill do you want to develop?
                </Text>
            </View>

            {/* --- 1. CATEGORY CARD --- */}
            <SearchableCard 
              label="Category"
              placeholder="Select a category"
              data={ALL_CATEGORIES}
              selectedItems={selectedCategories}
              onSelect={(item: string) => setSelectedCategories([...selectedCategories, item])}
              onRemove={handleRemoveCategory}
              searchQuery={catSearch}
              setSearchQuery={setCatSearch}
              onFocus={handleFocus}
            />

            {/* --- 2. SUB-CATEGORY CARD --- */}
            <SearchableCard 
              label="Sub-category"
              placeholder="Select a sub category"
              data={uniqueSubList} 
              selectedItems={selectedSubCategories}
              onSelect={(item: string) => setSelectedSubCategories([...selectedSubCategories, item])}
              onRemove={(item: string) => setSelectedSubCategories(selectedSubCategories.filter(s => s !== item))}
              searchQuery={subSearch}
              setSearchQuery={setSubSearch}
              onFocus={handleFocus}
              disabled={selectedCategories.length === 0} 
            />

          </ScrollView>

          {/* FOOTER (Border removed) */}
          <View className="bg-[#09090b] pt-2 pb-5 px-5">
             <TouchableOpacity 
                  onPress={handleNext}
                  className="h-[54px] rounded-full overflow-hidden"
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
      </KeyboardAvoidingView>
    </View>
  );
}
