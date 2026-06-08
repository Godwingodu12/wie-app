import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar, 
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Modal
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Custom Components
import { CustomCalendar } from '@/components/Connection/Form/CustomCalendar';

// --- TIME PICKER MODAL ---
const TimePickerModal = ({ visible, onClose, onSelect }: any) => {
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('PM');

  const handleConfirm = () => {
    const h = hour.padStart(2, '0');
    const m = minute.padStart(2, '0');
    onSelect(`${h}:${m} ${period}`);
    onClose();
  };

  const handleHour = (t: string) => { if(!t || (parseInt(t) <= 12)) setHour(t); }
  const handleMin = (t: string) => { if(!t || (parseInt(t) <= 59)) setMinute(t); }

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/80 justify-center items-center px-6">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="w-full bg-[#18181b] border border-[#27272a] rounded-3xl p-6 items-center shadow-2xl">
              <Text className="text-white text-lg font-bold mb-6">Select Time</Text>
              <View className="flex-row items-center gap-2 mb-8">
                <View className="items-center">
                    <TextInput value={hour} onChangeText={handleHour} keyboardType="number-pad" maxLength={2} placeholder="12" placeholderTextColor="#52525b" className="w-[80px] h-[80px] bg-[#27272a] rounded-2xl text-center text-white text-4xl font-bold border border-[#3f3f46]" />
                    <Text className="text-[#a1a1aa] text-xs mt-2 font-medium">Hour</Text>
                </View>
                <Text className="text-white text-4xl font-bold -mt-6">:</Text>
                <View className="items-center">
                    <TextInput value={minute} onChangeText={handleMin} keyboardType="number-pad" maxLength={2} placeholder="00" placeholderTextColor="#52525b" className="w-[80px] h-[80px] bg-[#27272a] rounded-2xl text-center text-white text-4xl font-bold border border-[#3f3f46]" />
                    <Text className="text-[#a1a1aa] text-xs mt-2 font-medium">Minute</Text>
                </View>
                <View className="h-[80px] justify-between ml-2">
                    <TouchableOpacity onPress={() => setPeriod('AM')} className={`px-3 py-2 rounded-lg border ${period === 'AM' ? 'bg-[#3f3f46] border-[#52525b]' : 'border-transparent'}`}><Text className={`text-sm font-bold ${period === 'AM' ? 'text-white' : 'text-[#71717a]'}`}>AM</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setPeriod('PM')} className={`px-3 py-2 rounded-lg border ${period === 'PM' ? 'bg-[#3f3f46] border-[#52525b]' : 'border-transparent'}`}><Text className={`text-sm font-bold ${period === 'PM' ? 'text-white' : 'text-[#71717a]'}`}>PM</Text></TouchableOpacity>
                </View>
              </View>
              <View className="flex-row gap-4 w-full">
                <TouchableOpacity onPress={onClose} className="flex-1 py-4 rounded-full border border-[#3f3f46] items-center"><Text className="text-white font-semibold">Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleConfirm} className="flex-1 rounded-full overflow-hidden h-[54px]">
                     <LinearGradient colors={['#A855F7', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text className="text-white font-bold text-[16px]">Set Time</Text></LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// --- MAIN SCREEN ---
export default function WhenPlanningForOutingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // STATES
  const [dobString, setDobString] = useState('');     
  const [timeString, setTimeString] = useState('');
  
  // Errors State
  const [errors, setErrors] = useState({ date: '', time: '' });

  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);

  // --- LOGIC: DATE MASKING (DD/MM/YYYY) ---
  const handleManualDateChange = (text: string) => {
    let cleaned = text.replace(/\D/g, '');
    let masked = cleaned;
    
    // Auto-slash logic
    if (cleaned.length > 2) masked = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length > 4) masked = masked.slice(0, 5) + '/' + cleaned.slice(4, 8);
    
    setDobString(masked);
    
    if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
  };

  // --- LOGIC: TIME MASKING (HH:MM AM/PM) ---
  const handleManualTimeChange = (text: string) => {
    // 1. Allow numbers, space, colon, and A/P/M characters (case insensitive)
    let cleaned = text.replace(/[^0-9: aApPmM]/g, '');

    // 2. Auto-insert Colon if typing numbers
    if (cleaned.length === 2 && !cleaned.includes(':')) {
       if (!isNaN(Number(cleaned))) {
           cleaned += ':';
       }
    }

    setTimeString(cleaned);

    if (errors.time) setErrors(prev => ({ ...prev, time: '' }));
  };

  // --- SELECTION HANDLERS ---
  const onDateSelectedFromCalendar = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    setDobString(`${day}/${month}/${year}`);
    setCalendarVisible(false);
    setErrors(prev => ({ ...prev, date: '' }));
  };

  const onTimeSelected = (val: string) => {
    setTimeString(val);
    setErrors(prev => ({ ...prev, time: '' }));
  };

  // --- VALIDATION & NEXT ---
  const handleNext = () => {
    Keyboard.dismiss();
    let newErrors = { date: '', time: '' };
    let hasError = false;

    // Strict Date Validation
    if (!dobString || dobString.length < 10) {
      newErrors.date = 'Date is required (DD/MM/YYYY)';
      hasError = true;
    }

    // Time Validation
    if (!timeString || timeString.length < 5) {
      newErrors.time = 'Time is required (e.g. 12:00 PM)';
      hasError = true;
    }

    setErrors(newErrors);

    if (!hasError) {
      console.log("Success:", dobString, timeString);
      // 🔥 Rerouted to OutingGroupSingleScreen
      router.push('/(protected)/(connection)/OutingGroupSingleScreen');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-[#09090b]">
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />

        <View className="flex-1" style={{ paddingTop: insets.top }}>
          
          {/* HEADER */}
          <View className="flex-row items-center h-[60px] px-5 mb-2">
            <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <View className="flex-1 h-1 bg-[#27272a] mx-4 rounded-full overflow-hidden">
              <View className="h-full bg-white w-[28%] rounded-full" />
            </View>
            <Text className="text-[#78716c] text-[13px] font-semibold">02/07</Text>
          </View>

          {/* TITLE */}
          <View className="px-5 mt-2 mb-8">
              <Text className="text-white text-[28px] font-bold leading-tight">
                When are you planning this{"\n"}outing?
              </Text>
          </View>

          {/* FORM FIELDS */}
          <View className="px-5 gap-6">
              
              {/* DATE FIELD */}
              <View>
                  <Text className="text-[#a1a1aa] text-[14px] font-medium mb-2 ml-1">Date of visit</Text>
                  
                  <View className={`h-[56px] w-full bg-[#18181b] border rounded-2xl flex-row items-center px-4 relative ${errors.date ? 'border-red-500' : 'border-[#27272a]'}`}>
                      <TextInput
                          value={dobString}
                          onChangeText={handleManualDateChange}
                          placeholder="DD/MM/YYYY"
                          placeholderTextColor="#52525b"
                          keyboardType="number-pad"
                          maxLength={10}
                          className="flex-1 text-[16px] text-white font-medium h-full"
                      />
                      <TouchableOpacity 
                          onPress={() => { Keyboard.dismiss(); setCalendarVisible(true); }}
                          className="absolute right-0 h-full w-[50px] justify-center items-center"
                      >
                          <Ionicons name="calendar-outline" size={20} color={errors.date ? "#ef4444" : "#71717a"} />
                      </TouchableOpacity>
                  </View>
                  {/* RED ERROR TEXT */}
                  {errors.date ? <Text className="text-red-500 text-xs mt-1.5 ml-1">{errors.date}</Text> : null}
              </View>

              {/* TIME FIELD */}
              <View>
                  <Text className="text-[#a1a1aa] text-[14px] font-medium mb-2 ml-1">Time of visit</Text>
                  
                  <View className={`h-[56px] w-full bg-[#18181b] border rounded-2xl flex-row items-center px-4 relative ${errors.time ? 'border-red-500' : 'border-[#27272a]'}`}>
                      <TextInput
                          value={timeString}
                          onChangeText={handleManualTimeChange}
                          placeholder="HH:MM AM/PM"
                          placeholderTextColor="#52525b"
                          keyboardType="default" 
                          maxLength={8} 
                          className="flex-1 text-[16px] text-white font-medium h-full"
                      />
                      <TouchableOpacity 
                          onPress={() => { Keyboard.dismiss(); setTimePickerVisible(true); }}
                          className="absolute right-0 h-full w-[50px] justify-center items-center"
                      >
                          <Ionicons name="time-outline" size={22} color={errors.time ? "#ef4444" : "#71717a"} />
                      </TouchableOpacity>
                  </View>
                  {/* RED ERROR TEXT */}
                  {errors.time ? <Text className="text-red-500 text-xs mt-1.5 ml-1">{errors.time}</Text> : null}
              </View>

          </View>

          {/* FOOTER */}
          <View 
              className="absolute bottom-0 w-full px-5 pt-4 pb-8 flex-row justify-between items-center gap-4 bg-[#09090b]"
              style={{ paddingBottom: insets.bottom > 20 ? insets.bottom : 20 }}
          >
              <TouchableOpacity 
                  onPress={() => router.push('/(protected)/(connection)/OutingGroupSingleScreen')} 
                  className="flex-1 h-[54px] justify-center items-center rounded-full border border-[#3f3f46] bg-[#18181b]"
              >
                  <Text className="text-white font-semibold text-[16px]">Skip</Text>
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

          {/* --- MODALS --- */}
          <CustomCalendar
              visible={isCalendarVisible}
              onClose={() => setCalendarVisible(false)}
              onSelectDate={onDateSelectedFromCalendar}
              selectedDate={null}
              minDate={new Date()} 
          />

          <TimePickerModal 
              visible={isTimePickerVisible}
              onClose={() => setTimePickerVisible(false)}
              onSelect={onTimeSelected}
          />

        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
