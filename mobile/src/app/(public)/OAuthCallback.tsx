import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@/context/UserContext';

const OAuthCallback = () => {
  const router = useRouter();
  const { token, error } = useLocalSearchParams<{ token?: string, error?: string }>();
  const { fetchProfile } = useUser();

  useEffect(() => {
    const handleAuth = async () => {
      if (token) {
        await AsyncStorage.setItem('auth_token', token);
        
        try {
          await fetchProfile();
        } catch (fetchError) {
          console.error('Failed to fetch profile after OAuth:', fetchError);
        }

        router.replace('/(protected)/(tabs)');
      } else if (error) {
        router.replace({
          pathname: '/(public)/Login',
          params: { authError: error }
        });
      }
    };

    handleAuth();
  }, [token, error]);

  return (
    <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#8860D9" />
      <Text style={{ color: 'white', marginTop: 20, fontFamily: 'rubik-medium' }}>
        Completing authentication...
      </Text>
    </View>
  );
};

export default OAuthCallback;
