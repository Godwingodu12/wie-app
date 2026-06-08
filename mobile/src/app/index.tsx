import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, Text } from 'react-native';

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    console.log('[Index] Initializing...');
    const prepareApp = async () => {
      try {
        console.log('[Index] Fetching auth_token...');
        const token = await AsyncStorage.getItem('auth_token');
        console.log('[Index] Token retrieved:', token ? 'Found' : 'Not found');
        setHasToken(!!token && token.length > 10);
      } catch (e) {
        console.error('[Index] Error during initialization:', e);
      } finally {
        console.log('[Index] Initialization complete');
        setIsReady(true);
      }
    };
    prepareApp();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: 'white', marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  console.log('[Index] Redirecting, hasToken:', hasToken);

  if (hasToken) {
    return <Redirect href="/(protected)/(tabs)" />;
  } else {
    return <Redirect href="/(public)/Login" />;
  }
}
