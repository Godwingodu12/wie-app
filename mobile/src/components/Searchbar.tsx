import React, { useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import Reanimated, { FadeInRight, FadeOutRight } from 'react-native-reanimated';

// @/components/Searchbar.tsx

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;
  onCancel: () => void;
  onPressOptions?: () => void; // 1. Add this to the interface
  placeholder?: string;
}

export const SearchBar = ({ 
  value, 
  onChangeText, 
  isFocused, 
  setIsFocused, 
  onCancel,
  onPressOptions,
  placeholder = "Search people, events..."
}: SearchBarProps) => {
  const inputRef = React.useRef<any>(null);

  return (
    // Wrap in a View with flex-row and overflow hidden to contain the spring bounce
    <View className="flex-row items-center w-full overflow-hidden">
      <MotiView
        animate={{ 
          // Use flex: 1 when focused to stay within bounds, or fixed 100% when not
          width: isFocused ? '80%' : '100%',
        }}
        transition={{ 
          type: 'spring', 
          damping: 20,    // Increased damping to reduce excessive bounce
          stiffness: 150, 
          mass: 1 
        }}
        className="h-12 bg-zinc-900 rounded-2xl flex-row items-center px-4 border border-zinc-800"
      >
        <Ionicons name="search" size={20} color={isFocused ? "#818CF8" : "#71717a"} />
        
        <TextInput
          ref={inputRef}
          className="flex-1 ml-3 text-white font-rubik-regular text-base h-full"
          style={{ paddingVertical: 0, textAlignVertical: 'center' }}
          placeholder={placeholder}
          placeholderTextColor="#52525b"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
        />

        {!isFocused ? (
          <TouchableOpacity onPress={onPressOptions} activeOpacity={0.7}>
            <Ionicons name="options-outline" size={20} color="#71717a" />
          </TouchableOpacity>
        ) : (
          value.length > 0 && (
            <TouchableOpacity onPress={() => onChangeText('')}>
              <Ionicons name="close-circle" size={18} color="#71717a" />
            </TouchableOpacity>
          )
        )}
      </MotiView>

      {isFocused && (
        <Reanimated.View 
          entering={FadeInRight.springify()} 
          exiting={FadeOutRight}
          className="absolute right-0" // Position absolute to prevent layout jump
        >
          <TouchableOpacity 
            onPress={() => { onCancel(); inputRef.current?.blur(); }} 
            className="pr-2 pl-3"
          >
            <Text className="text-white font-rubik-medium text-base">Cancel</Text>
          </TouchableOpacity>
        </Reanimated.View>
      )}
    </View>
  );
};
