import { Ionicons, Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState, useRef } from 'react';
import { 
  ScrollView, 
  StatusBar, 
  Text, 
  TouchableOpacity, 
  View, 
  TextInput,
  LayoutAnimation, 
  Platform, 
  UIManager,
  Keyboard,
  KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import Custom Buttons
import { GradientButton } from '@/components/Connection/UI/Buttons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FIELDS = [
  "Technology & Software",
  "E-commerce & Retail",
  "Healthcare & Wellness",
  "Finance & Fintech",
  "Education & Edu tech",
  "Marketing & Advertising",
  "Real Estate & Construction"
];

import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

const ProfessionalFieldScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // 🔥 MULTI-SELECT STATE
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [showSelectedList, setShowSelectedList] = useState(false); 

  // Filter logic
  const filteredFields = FIELDS.filter(field => 
    field.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedFields.includes(field)
  );

  // 1. ADD FIELD
  const handleSelect = (field: string) => {
    if (!selectedFields.includes(field)) {
        setSelectedFields([...selectedFields, field]);
        setShowSelectedList(true); // Auto-open list
    }
    setSearchQuery(''); 
    Keyboard.dismiss();
  };

  // 2. MANUAL ADD
  const handleManualSubmit = () => {
    if (searchQuery.trim().length > 0) {
      handleSelect(searchQuery.trim());
    }
  };

  // 3. REMOVE FIELD
  const handleRemoveField = (field: string) => {
    setSelectedFields(selectedFields.filter(f => f !== field));
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
    console.log("Selected Fields:", selectedFields);
    router.push('/(protected)/(connection)/BusinessStageScreen'); 
  };

  return (
    <View className="flex-1 bg-[#09090b]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* WRAP IN KEYBOARD AVOIDING VIEW */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={{ paddingTop: insets.top }} className="flex-1">
          
          {/* HEADER */}
          <View className="flex-row items-center h-[60px] px-5 mb-2.5">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <View className="flex-1 h-[2px] bg-[#1c1c1e] mx-[15px] rounded-full">
              <View className="h-full bg-white rounded-full w-[28%]" />
            </View>
            <Text className="text-[#a8a29e] text-[13px] font-semibold">02/07</Text>
          </View>

          <ScrollView 
            ref={scrollRef}
            showsVerticalScrollIndicator={false} 
            keyboardShouldPersistTaps="always"
            contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: 20 }}
          >
            
            <View className="mt-2.5 mb-8">
              <Text className="text-white text-[22px] font-semibold leading-tight">
                What is your field or niche?
              </Text>
            </View>

            {/* DROPDOWN CONTAINER CARD */}
            <View className="bg-[#161618] border border-[#27272a] rounded-[22px] overflow-hidden">
              
              {/* 🔥 HEADER / ACCORDION TOGGLE */}
              <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={toggleSelectedList}
                  className="flex-row items-center justify-between px-5 py-4 border-b border-[#27272a]/50"
              >
                  <Text className={`${selectedFields.length > 0 ? 'text-white font-medium' : 'text-[#71717a]'} text-[14px]`}>
                    {selectedFields.length > 0 
                      ? `${selectedFields.length} Field${selectedFields.length > 1 ? 's' : ''} Selected`
                      : "Select your field"
                    }
                  </Text>
                  <Feather 
                    name={showSelectedList ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#71717a" 
                  />
              </TouchableOpacity>

              {/* 🔥 SELECTED ITEMS LIST (Shown when toggled open) */}
              {showSelectedList && selectedFields.length > 0 && (
                  <Animated.View 
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    layout={Layout.springify()}
                    className="px-4 pt-3 pb-1 flex-row flex-wrap gap-2 bg-[#1c1c1e]"
                  >
                      {selectedFields.map((field, index) => (
                          <Animated.View 
                            key={field} 
                            layout={Layout.springify()}
                            className="flex-row items-center bg-[#27272a] rounded-lg px-3 py-2 mb-2"
                          >
                              <Text className="text-white text-[13px] mr-2 max-w-[200px]" numberOfLines={1}>
                                  {field}
                              </Text>
                              <TouchableOpacity onPress={() => handleRemoveField(field)}>
                                  <Ionicons name="close-circle" size={16} color="#71717a" />
                              </TouchableOpacity>
                          </Animated.View>
                      ))}
                  </Animated.View>
              )}

              {/* SEARCH AREA */}
              <View className="px-4 py-4">
                <View className="flex-row items-center bg-[#222224] rounded-xl px-4 py-3 border border-[#27272a]">
                  <Feather name="search" size={18} color="#52525b" />
                  <TextInput
                    placeholder="search or type here..."
                    placeholderTextColor="#52525b"
                    value={searchQuery}
                    onFocus={handleFocus} 
                    onChangeText={(text) => {
                      setSearchQuery(text);
                    }}
                    className="flex-1 ml-3 text-white text-[14px]"
                    selectionColor="#8b5cf6"
                    returnKeyType="done"
                    onSubmitEditing={handleManualSubmit}
                  />
                </View>
              </View>

              {/* 🔥 SUGGESTION LIST */}
              {searchQuery.length > 0 && (
                <Animated.View 
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                  className="px-2 pb-4"
                >
                  {filteredFields.map((field, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSelect(field)}
                      className="px-4 py-3 rounded-xl active:bg-[#27272a]"
                    >
                      <Text className="text-[#a1a1aa] text-[14px]">
                        {field}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* Fallback for new manual entry */}
                  {filteredFields.length === 0 && (
                    <TouchableOpacity onPress={handleManualSubmit} className="px-4 py-3">
                      <Text className="text-[#8b5cf6] text-[14px]">
                        Add &quot;{searchQuery}&quot; as new niche
                      </Text>
                    </TouchableOpacity>
                  )}
                </Animated.View>
              )}
            </View>

          </ScrollView>

          {/* FOOTER */}
          <View 
            className="px-5 bg-[#09090b] pt-2.5 pb-5 border-t border-[#1c1c1e]"
          >
            <GradientButton 
              title="Next" 
              onPress={handleNext} 
            />
          </View>

        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ProfessionalFieldScreen;
