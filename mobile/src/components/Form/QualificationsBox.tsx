import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Helper to remove web focus ring
const noOutline = Platform.OS === 'web' ? { outlineStyle: 'none' } : {};

const QUALIFICATION_LIST = [
  '10th', '12th', 'Diploma', 'ITI', 'BA', 'BBA', 'BCA', 'BCom', 'BEd', 'BE', 'BFA', 'BHM', 'BPharm', 'BSc', 'BTech',
  'CA', 'CFA', 'CMA', 'CS', 'GNM', 'LLB', 'LLM', 'MA', 'MBA', 'MCA', 'MCom', 'MEd', 'ME', 'MFA', 'MPharm', 'MSc', 'MSW', 'MTech',
  'MBBS', 'MD', 'MS', 'PhD', 'Architect', 'Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'Software Engineer',
  'Developer', 'Graphic Designer', 'UI/UX Designer', 'Product Manager', 'Project Manager', 'Data Analyst', 'Data Scientist',
  'Teacher', 'Nurse', 'Physiotherapist',
];

export const QualificationsBox = ({ data, setData }: any) => {
  const [manual, setManual] = useState('');
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter suggestions
  const normalizedQuery = manual.trim().toLowerCase();
  const filteredSuggestions = QUALIFICATION_LIST
    .filter((item) => item.toLowerCase().includes(normalizedQuery))
    .filter((item) => !data.some((q: string) => q.toLowerCase() === item.toLowerCase()))
    .slice(0, 8);
  const shouldShowSuggestions = focused && normalizedQuery.length > 0 && filteredSuggestions.length > 0;

  const addQualification = (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;
    const exists = data.some((q: string) => q.toLowerCase() === trimmedValue.toLowerCase());
    if (exists) return;
    setData([...data, trimmedValue]);
    setManual('');
    setFocused(false);
  };

  return (
    <View className="mb-5 z-10">
      <Text className="text-[#a8a29e] text-sm mb-2">Add qualifications</Text>
      
      {/* Box Container */}
      <View className="bg-[#0c0a09] rounded-[20px] p-4 border border-[#1c1917]">
        
        {/* TAGS DISPLAY */}
        <View className="flex-row flex-wrap mb-5">
          {data.map((q: string, i: number) => (
            <View key={i} className="flex-row items-center bg-black rounded-lg px-3 py-2 mr-2 mb-2">
              <Text className="text-[#d6d3d1] mr-1.5">{q}</Text>
              <TouchableOpacity onPress={() => setData(data.filter((_: any, idx: number) => idx !== i))}>
                <Ionicons name="close" size={16} color="#4b5563" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Input Wrapper */}
        <View className="relative z-50">
          <View className="flex-row items-center bg-[#171717] rounded-xl px-3 h-12">
            <Ionicons name="school-outline" size={20} color="#4b5563" />
            <TextInput
              className="flex-1 text-white ml-2.5 outline-none"
              placeholder="Add qualification (type to see suggestions)"
              placeholderTextColor="#4b5563"
              value={manual}
              onChangeText={setManual}
              onFocus={() => {
                if (blurTimer.current) clearTimeout(blurTimer.current);
                setFocused(true);
              }}
              onBlur={() => {
                blurTimer.current = setTimeout(() => setFocused(false), 150);
              }}
              onSubmitEditing={() => addQualification(manual)}
              returnKeyType="done"
              autoCorrect={false}
              style={noOutline as any} // Web Fix
            />
          </View>

          {/* Dropdown Suggestions */}
          {shouldShowSuggestions && (
            <View className="absolute top-[54px] left-0 right-0 bg-[#171717] rounded-xl border border-[#1c1917] z-[2000] overflow-hidden shadow-lg">
              {filteredSuggestions.map((item) => (
                <TouchableOpacity 
                  key={item} 
                  className="flex-row justify-between p-3 border-b border-[#0c0a09]"
                  onPress={() => addQualification(item)} 
                  activeOpacity={0.7}
                >
                  <Text className="text-white text-sm">{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};
