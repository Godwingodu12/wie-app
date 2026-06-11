import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { chatService } from '@/services/chatService';

const CreatePoll = () => {
  const params = useLocalSearchParams();
  const chatId = Array.isArray(params.chatId) ? params.chatId[0] : params.chatId || '';
  
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddOption = () => {
    if (options.length < 12) {
      setOptions([...options, '']);
    }
  };

  const handleOptionChange = (text: string, index: number) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleCreate = async () => {
    const validOptions = options.filter(opt => opt.trim() !== '');
    if (!question.trim() || validOptions.length < 2) return;

    setIsSubmitting(true);
    try {
      // Note: we need to add sendPoll to chatService
      await (chatService as any).sendPoll(chatId, question, validOptions, allowMultiple);
      router.back();
    } catch (error) {
      console.error('Failed to create poll:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center px-4 py-4 gap-4">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 bg-[#1F1F23] rounded-full items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white font-rubik-bold text-xl">Create poll</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          <View className="mt-4 mb-8">
            <Text className="text-[#A0A0A0] text-[13px] font-rubik-medium mb-2 ml-1">Question</Text>
            <TextInput
              placeholder="Ask a question"
              placeholderTextColor="#52525B"
              value={question}
              onChangeText={setQuestion}
              className="bg-[#1F1F23] border border-white/5 rounded-2xl px-4 h-[56px] text-white text-base"
            />
          </View>

          <View className="mb-8">
            <Text className="text-[#A0A0A0] text-[13px] font-rubik-medium mb-3 ml-1">Options</Text>
            {options.map((opt, index) => (
              <View key={index} className="flex-row items-center mb-3">
                <View className="flex-1 flex-row items-center bg-[#1F1F23] border border-white/5 rounded-2xl px-4 h-[56px]">
                  <Ionicons name="menu-outline" size={20} color="#52525B" className="mr-3" />
                  <TextInput
                    placeholder={`Option ${index + 1}`}
                    placeholderTextColor="#52525B"
                    value={opt}
                    onChangeText={(text) => handleOptionChange(text, index)}
                    className="flex-1 text-white text-base"
                  />
                  {options.length > 2 && (
                    <TouchableOpacity onPress={() => handleRemoveOption(index)}>
                      <Ionicons name="close-circle" size={20} color="#52525B" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {options.length < 12 && (
              <TouchableOpacity 
                onPress={handleAddOption}
                className="flex-row items-center mt-2 ml-1"
              >
                <Ionicons name="add-circle" size={24} color="#7C4DFF" />
                <Text className="text-[#7C4DFF] font-rubik-medium ml-2 text-base">Add option</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row items-center justify-between mb-10 p-4 bg-[#1F1F23] rounded-2xl border border-white/5">
            <View>
              <Text className="text-white font-rubik-medium text-[15px]">Allow multiple answers</Text>
              <Text className="text-zinc-500 text-[12px]">Users can select more than one option</Text>
            </View>
            <Switch
              value={allowMultiple}
              onValueChange={setAllowMultiple}
              trackColor={{ false: '#3F3F46', true: '#7C4DFF' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="p-6 pb-8">
        <TouchableOpacity 
          onPress={handleCreate}
          disabled={!question.trim() || options.filter(o => o.trim() !== '').length < 2 || isSubmitting}
          className={`h-[56px] rounded-full items-center justify-center ${(!question.trim() || options.filter(o => o.trim() !== '').length < 2) ? 'bg-[#1F1F23]' : 'bg-[#7C4DFF]'}`}
        >
          <Text className={`font-rubik-bold text-lg ${(!question.trim() || options.filter(o => o.trim() !== '').length < 2) ? 'text-zinc-500' : 'text-white'}`}>
            Create poll
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CreatePoll;
