import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

export default function PostInsightsScreen() {
  const { postId } = useLocalSearchParams();

  const insights = [
    { label: 'Views', value: '1,234', icon: 'eye-outline' },
    { label: 'Likes', value: '567', icon: 'heart-outline' },
    { label: 'Comments', value: '89', icon: 'chatbubble-outline' },
    { label: 'Shares', value: '45', icon: 'paper-plane-outline' },
    { label: 'Saves', value: '12', icon: 'bookmark-outline' },
    { label: 'Reach', value: '2,500', icon: 'people-outline' },
    { label: 'Engagement', value: '701', icon: 'flash-outline' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={15}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Insights</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.subTitle}>Engagement details for post {postId}</Text>
        
        <View style={styles.grid}>
          {insights.map((item, index) => (
            <View key={index} style={styles.card}>
              <Ionicons name={item.icon as any} size={24} color="#3897f0" />
              <Text style={styles.cardValue}>{item.value}</Text>
              <Text style={styles.cardLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'black' 
  },
  header: { 
    height: 50, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#1A1A1A' 
  },
  headerTitle: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  content: { 
    padding: 16 
  },
  subTitle: { 
    color: '#A3A3A3', 
    marginBottom: 20, 
    fontSize: 14 
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  card: { 
    width: '48%', 
    backgroundColor: '#1A1A1A', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 16, 
    alignItems: 'center' 
  },
  cardValue: { 
    color: 'white', 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginTop: 8 
  },
  cardLabel: { 
    color: '#A3A3A3', 
    fontSize: 12, 
    marginTop: 4 
  },
});
