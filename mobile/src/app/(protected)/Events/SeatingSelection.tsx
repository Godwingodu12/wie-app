import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  StatusBar, 
  Animated, 
  Easing, 
  StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReactNativeZoomableView } from '@dudigital/react-native-zoomable-view';
import * as Haptics from 'expo-haptics';

import { EVENT_DATA } from '@/constants/eventDetails';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SEAT_LAYOUT_DATA: Record<string, string[]> = {
  [`${EVENT_DATA.dates[0]}_${EVENT_DATA.times[0]}`]: ["A1", "A2", "B5", "B6"],
  [`${EVENT_DATA.dates[0]}_${EVENT_DATA.times[1]}`]: ["C10", "C11", "C12"],
  [`${EVENT_DATA.dates[0]}_11:30 AM`]: ["SOLD_OUT"], 
};

// --- LEGEND COMPONENT ---
const LegendItem = ({ dotColor, borderColor, label }: { dotColor: string, borderColor: string, label: string }) => (
  <View className="flex-row items-center gap-2">
    <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: dotColor, borderWidth: 1, borderColor: borderColor }} />
    <Text className="text-zinc-500 text-[10px] font-bold uppercase">{label}</Text>
  </View>
);

// --- PARTICLE COMPONENT ---
const Particle = () => {
  const moveAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(moveAnim, {
        toValue: 1,
        duration: 4000 + Math.random() * 3000,
        delay: Math.random() * 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [moveAnim]);

  const translateX = moveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Math.random() * SCREEN_WIDTH, Math.random() * SCREEN_WIDTH + (Math.random() * 40 - 20)],
  });
  const translateY = moveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, -50],
  });
  const opacity = moveAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.7, 0],
  });
  const scale = moveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.5],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#8B5CF6',
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    />
  );
};

const BackgroundParticles = () => {
  const particles = Array.from({ length: 15 });
  return (
    <View style={{ ...StyleSheet.absoluteFillObject, overflow: 'hidden' }}>
      {particles.map((_, i) => (
        <Particle key={i} />
      ))}
    </View>
  );
};

const BookingPage = () => {
  const insets = useSafeAreaInsets();
  const isMounted = useRef(true);
  const mainScrollViewRef = useRef<ScrollView>(null);
  
  const [selectedDate, setSelectedDate] = useState(EVENT_DATA.dates[0]);
  const [selectedTime, setSelectedTime] = useState(EVENT_DATA.times[0]);
  const [selectionsBySlot, setSelectionsBySlot] = useState<Record<string, string[]>>({});
  const [isZooming, setIsZooming] = useState(false);
  
  const slideUpAnim = useRef(new Animated.Value(200)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const selectionHighlightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    isMounted.current = true;
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -15, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    return () => { isMounted.current = false; };
  }, [floatAnim]);

  const currentKey = `${selectedDate}_${selectedTime}`;
  const soldSeatsForSlot = SEAT_LAYOUT_DATA[currentKey] || [];
  const currentSelectedSeats = selectionsBySlot[currentKey] || [];
  const isSoldOut = soldSeatsForSlot.includes("SOLD_OUT") || selectedTime === "11:30 AM";
  const allSelectedSeats = Object.values(selectionsBySlot).flat();

  useEffect(() => {
    Animated.spring(slideUpAnim, {
      toValue: allSelectedSeats.length > 0 ? 0 : 200,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [allSelectedSeats.length, slideUpAnim]);

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const seatPrice = 1499;

  const toggleSeat = (id: string) => {
    if (!isMounted.current) return;
    if (currentSelectedSeats.includes(id)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectionsBySlot(prev => ({ ...prev, [currentKey]: prev[currentKey].filter(s => s !== id) }));
    } else {
      if (allSelectedSeats.length >= 8) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectionsBySlot(prev => ({ ...prev, [currentKey]: [...(prev[currentKey] || []), id] }));
    }
  };

  const handleChangeDate = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    mainScrollViewRef.current?.scrollTo({ y: 0, animated: true });
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(selectionHighlightAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.timing(selectionHighlightAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
      ]).start();
    }, 400);
  };

  const highlightBackground = selectionHighlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', 'rgba(139, 92, 246, 0.2)']
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#000', paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" />

      {/* --- HEADER --- */}
      <View className="flex-row items-center justify-between px-6 py-2 z-50 bg-black">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-zinc-900 rounded-full">
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-white text-sm font-bold tracking-tight">{EVENT_DATA.title}</Text>
          <Text className="text-zinc-500 text-[10px] uppercase font-medium">{selectedDate} • {selectedTime}</Text>
        </View>
        <View className="w-10 items-end">
          {allSelectedSeats.length > 0 && (
            <TouchableOpacity onPress={() => setSelectionsBySlot({})}>
              <Text className="text-[#8B5CF6] text-[10px] font-bold uppercase tracking-tighter">Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView ref={mainScrollViewRef} scrollEnabled={!isZooming} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ backgroundColor: highlightBackground, paddingBottom: 10 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 mt-4">
            {EVENT_DATA.dates.map((date, i) => (
              <TouchableOpacity key={i} onPress={() => setSelectedDate(date)} className={`mr-3 px-5 py-3 rounded-2xl items-center border ${selectedDate === date ? 'bg-[#8B5CF6] border-[#8B5CF6]' : 'bg-transparent border-zinc-800'}`}>
                <Text className={`text-[10px] uppercase font-bold ${selectedDate === date ? 'text-white/60' : 'text-zinc-500'}`}>{date.split(' ')[1]}</Text>
                <Text className={`text-lg font-bold ${selectedDate === date ? 'text-white' : 'text-zinc-300'}`}>{date.split(' ')[0]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 mt-4 h-12">
            {EVENT_DATA.times.map((time, i) => (
              <TouchableOpacity key={i} onPress={() => setSelectedTime(time)} className={`mr-2 px-6 rounded-full items-center justify-center border ${selectedTime === time ? 'bg-white border-white' : 'bg-transparent border-zinc-800'}`}>
                <Text className={`text-xs font-bold ${selectedTime === time ? 'text-black' : 'text-zinc-300'}`}>{time}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {isSoldOut ? (
          <View style={{ height: 500 }} className="items-center justify-center px-6">
            <BackgroundParticles />
            <Text style={{ fontSize: 120, position: 'absolute', top: 120, opacity: 0.03 }} className="text-white font-black">SOLD</Text>
            <Animated.View style={{ width: '100%', transform: [{ translateY: floatAnim }] }}>
              <View className="bg-zinc-900 border-t border-x border-zinc-800 rounded-t-[40px] p-10 items-center">
                <View className="w-16 h-16 bg-red-500/10 rounded-2xl items-center justify-center mb-6">
                  <Ionicons name="flash-off" size={28} color="#ef4444" />
                </View>
                <Text className="text-white text-3xl font-black uppercase tracking-tighter">Fully Booked</Text>
                <Text className="text-zinc-500 text-center mt-2 text-xs font-bold uppercase tracking-widest">Showtime Locked</Text>
              </View>
              <View className="flex-row items-center bg-zinc-900">
                <View className="w-6 h-6 rounded-full bg-black -ml-3" /><View className="flex-1 border-b border-dashed border-zinc-800 mx-2" /><View className="w-6 h-6 rounded-full bg-black -mr-3" />
              </View>
              <View className="bg-zinc-900 border-b border-x border-zinc-800 rounded-b-[40px] p-8">
                <View className="flex-row justify-between mb-8">
                  <View><Text className="text-zinc-600 text-[10px] font-bold uppercase">Showtime</Text><Text className="text-zinc-300 font-bold">{selectedTime}</Text></View>
                  <View className="items-end"><Text className="text-zinc-600 text-[10px] font-bold uppercase">Status</Text><Text className="text-red-500 font-bold">100% Sold Out</Text></View>
                </View>
                <TouchableOpacity onPress={handleChangeDate} activeOpacity={0.8} className="bg-white h-14 rounded-2xl items-center justify-center">
                   <Text className="text-black font-black uppercase text-xs tracking-widest">Change Show Date</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        ) : (
          <>
            <View style={{ height: 400, width: SCREEN_WIDTH }} className="mt-8 overflow-hidden">
              <View className="items-center z-30 bg-black pb-8">
                <View className="w-48 h-1 bg-zinc-800 rounded-full" />
                <Text className="text-zinc-600 text-[9px] uppercase tracking-[8px] mt-2 font-bold">Stage Area</Text>
              </View>
              <ReactNativeZoomableView maxZoom={3} minZoom={0.8} initialZoom={1} bindToBorders={true} onZoomBefore={() => setIsZooming(true)} onZoomEnd={() => setIsZooming(false)} style={{ flex: 1 }}>
                <View style={{ padding: 60 }}>
                  {rows.map((row) => (
                    <View key={row} className="flex-row items-center justify-center mb-3">
                      <Text className="text-zinc-700 w-6 text-[10px] font-bold text-center">{row}</Text>
                      <View className="flex-row">
                        {cols.map((col) => {
                          const id = `${row}${col}`;
                          const isSelected = currentSelectedSeats.includes(id);
                          const isSold = soldSeatsForSlot.includes(id);
                          return (
                            <TouchableOpacity key={id} disabled={isSold} onPress={() => toggleSeat(id)} style={{ width: 24, height: 24, borderRadius: 6, margin: 3, borderWidth: 1.5, borderColor: isSelected ? '#8B5CF6' : isSold ? '#1a1a1a' : '#3f3f46', backgroundColor: isSelected ? '#8B5CF6' : isSold ? '#1a1a1a' : 'transparent' }} className="items-center justify-center">
                              <Text style={{ fontSize: 8, fontWeight: 'bold', color: isSelected ? 'white' : isSold ? '#333' : '#71717a' }}>{col}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              </ReactNativeZoomableView>
            </View>

            {/* --- RE-ADDED LEGEND --- */}
            <View className="flex-row justify-center space-x-6 mt-4 mb-48 gap-4">
              <LegendItem dotColor="transparent" borderColor="#3f3f46" label="Available" />
              <LegendItem dotColor="#8B5CF6" borderColor="#8B5CF6" label="Selected" />
              <LegendItem dotColor="#1a1a1a" borderColor="#1a1a1a" label="Sold" />
            </View>
          </>
        )}
      </ScrollView>

      {/* --- FOOTER SUMMARY --- */}
      <Animated.View style={{ transform: [{ translateY: slideUpAnim }], paddingBottom: insets.bottom + 10 }} className="absolute bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-900 rounded-t-[32px] px-6 pt-5">
        <View className="mb-2 h-10">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, alignItems: 'center' }} className="flex-row">
            {Object.entries(selectionsBySlot).map(([slotKey, seats]) => seats.map(id => (
              <TouchableOpacity key={`${slotKey}_${id}`} onPress={() => { const updated = selectionsBySlot[slotKey].filter(s => s !== id); setSelectionsBySlot(prev => ({ ...prev, [slotKey]: updated })); }} className="bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-full mr-2 flex-row items-center h-8">
                <Text className="text-white text-[10px] font-bold">{id}</Text><Text className="text-zinc-500 text-[8px] ml-1">({slotKey.split('_')[1]})</Text><Ionicons name="close-circle" size={12} color="#71717a" style={{marginLeft: 6}} />
              </TouchableOpacity>
            )))}
          </ScrollView>
        </View>
        <View className="flex-row justify-between items-center mb-4 px-6">
          <View><Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Total Amount</Text><Text className="text-white text-3xl font-bold">${(allSelectedSeats.length * seatPrice).toLocaleString()}</Text></View>
          <View className="bg-[#8B5CF6]/10 px-4 py-2 rounded-2xl border border-[#8B5CF6]/20"><Text className="text-[#8B5CF6] font-bold text-xs">{allSelectedSeats.length} Seats</Text></View>
        </View>
        <View className="px-6">
          <TouchableOpacity activeOpacity={0.8} className="w-full h-14 overflow-hidden rounded-full mb-2">
            <LinearGradient colors={['#8B5CF6', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="flex-1 flex-row items-center justify-center">
              <Ionicons name="ticket-outline" size={20} color="white" /><Text className="text-white font-bold text-lg ml-2">Confirm Booking</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

export default BookingPage;
