import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useRef } from 'react';
import { Dimensions, FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// Layout Constants
const CONTAINER_PADDING = 20;
const CALENDAR_WIDTH = width - 40 - (CONTAINER_PADDING * 2);
const DAY_SIZE = CALENDAR_WIDTH / 7;

// HEADER SCROLL CONSTANTS
const HEADER_HEIGHT = 50; // Height of the scroll area
const ITEM_HEIGHT = 50;   // Height of one text item (must match header height for single item view)

// Helper
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const CustomCalendar = ({ visible, selectedDate, onClose, onSelectDate, maxDate }: any) => {
  const [currentDate, setCurrentDate] = useState(new Date(selectedDate || new Date()));
  
  // Refs for the header scroll wheels
  const monthListRef = useRef<FlatList>(null);
  const yearListRef = useRef<FlatList>(null);

  // --- DATA SETUP ---
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate Years (100 years back)
  const currentYear = new Date().getFullYear();
  const maxYear = maxDate ? maxDate.getFullYear() : currentYear + 5;
  const years = Array.from({ length: 100 }, (_, i) => maxYear - i);

  // --- SCROLL HANDLERS (HEADER) ---
  const handleMonthScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (index >= 0 && index < 12) {
      // Update Month, keep same Year
      const newDate = new Date(currentDate.getFullYear(), index, 1);
      setCurrentDate(newDate);
    }
  };

  const handleYearScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (index >= 0 && index < years.length) {
      // Update Year, keep same Month
      const newYear = years[index];
      const newDate = new Date(newYear, currentDate.getMonth(), 1);
      setCurrentDate(newDate);
    }
  };

  // --- INITIALIZE HEADER POSITIONS ---
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        // Snap Month Wheel to current month
        monthListRef.current?.scrollToIndex({
            index: currentDate.getMonth(),
            animated: false
        });
        
        // Snap Year Wheel to current year
        const yearIndex = years.indexOf(currentDate.getFullYear());
        if (yearIndex !== -1) {
            yearListRef.current?.scrollToIndex({
                index: yearIndex,
                animated: false
            });
        }
      }, 50);
    }
  }, [visible]);


  // --- CALENDAR GRID LOGIC ---
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const maxDay = maxDate ? startOfDay(maxDate) : null;

  const renderDays = () => {
    const totalDays = daysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={{ width: DAY_SIZE, height: 40 }} />);
    }

    // Actual days
    for (let d = 1; d <= totalDays; d++) {
      const isSelected = selectedDate && 
        d === selectedDate.getDate() && 
        currentDate.getMonth() === selectedDate.getMonth() && 
        currentDate.getFullYear() === selectedDate.getFullYear();

      const candidate = startOfDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), d));
      const isDisabled = !!(maxDay && candidate.getTime() > maxDay.getTime());

      days.push(
        <TouchableOpacity 
          key={d} 
          disabled={isDisabled}
          onPress={() => {
            if (isDisabled) return;
            onSelectDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), d));
          }}
          className="justify-center items-center my-0.5"
          style={{ width: DAY_SIZE, height: 40 }}
        >
          <View
            className={`w-[34px] h-[34px] justify-center items-center rounded-[10px] ${
              isSelected ? 'bg-[#6366f1]' : 'bg-transparent'
            }`}
            style={isDisabled ? { opacity: 0.35 } : {}}
          >
            <Text className={`text-[15px] ${isSelected ? 'text-white font-bold' : 'text-[#d1d5db]'}`}>
              {d}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }
    return days;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/85 justify-center items-center">
        
        <View 
          className="bg-[#111114] rounded-[24px] p-5 border border-[#1c1c1e] overflow-hidden"
          style={{ width: width - 40, maxHeight: 550 }}
        >
          
          {/* --- SCROLLABLE HEADER --- */}
          <View className="flex-row justify-center items-center h-[60px] mb-4 border-b border-[#27272a] pb-2">
            
            {/* MONTH WHEEL */}
            <View style={{ height: HEADER_HEIGHT, width: 140, overflow: 'hidden' }}>
                <FlatList
                    ref={monthListRef}
                    data={monthNames}
                    keyExtractor={(item) => item}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    onMomentumScrollEnd={handleMonthScroll}
                    getItemLayout={(data, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                    renderItem={({ item }) => (
                        <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
                            <Text className="text-white text-xl font-bold">{item}</Text>
                        </View>
                    )}
                />
                {/* Visual Indicators (Arrows) */}
                <View className="absolute top-0 w-full items-center pointer-events-none opacity-30"><Ionicons name="caret-up" size={10} color="white" /></View>
                <View className="absolute bottom-0 w-full items-center pointer-events-none opacity-30"><Ionicons name="caret-down" size={10} color="white" /></View>
            </View>

            {/* SEPARATOR */}
            <View className="w-[1px] h-[30px] bg-[#27272a] mx-2" />

            {/* YEAR WHEEL */}
            <View style={{ height: HEADER_HEIGHT, width: 80, overflow: 'hidden' }}>
                <FlatList
                    ref={yearListRef}
                    data={years}
                    keyExtractor={(item) => item.toString()}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    onMomentumScrollEnd={handleYearScroll}
                    getItemLayout={(data, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                    renderItem={({ item }) => (
                        <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
                            <Text className="text-[#6366f1] text-xl font-bold">{item}</Text>
                        </View>
                    )}
                />
                {/* Visual Indicators (Arrows) */}
                <View className="absolute top-0 w-full items-center pointer-events-none opacity-30"><Ionicons name="caret-up" size={10} color="#6366f1" /></View>
                <View className="absolute bottom-0 w-full items-center pointer-events-none opacity-30"><Ionicons name="caret-down" size={10} color="#6366f1" /></View>
            </View>

          </View>

          {/* --- CALENDAR GRID BODY --- */}
          <View className="h-[310px] justify-center">
            
            {/* Weekdays Header */}
            <View className="flex-row mb-2.5 border-b border-[#1c1c1e] pb-2.5">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <Text 
                  key={i} 
                  className="text-[#4b5563] text-[13px] font-bold text-center"
                  style={{ width: DAY_SIZE }}
                >
                  {day}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View className="flex-row flex-wrap items-center">
              {renderDays()}
            </View>
          </View>

          {/* Footer Cancel Button */}
          <TouchableOpacity onPress={onClose} className="mt-5 self-center py-2.5">
            <Text className="text-[#ef4444] text-sm font-extrabold tracking-widest">CANCEL</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};
