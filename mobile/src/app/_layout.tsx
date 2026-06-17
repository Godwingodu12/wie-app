import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider } from '../context/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ToastProvider } from '../context/ToastContext';
import { useFonts } from 'expo-font';
import { 
  Ionicons, 
  MaterialCommunityIcons,
  MaterialIcons,
  Feather,
  FontAwesome,
  FontAwesome5
} from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import "./global.css";

SplashScreen.preventAutoHideAsync();

cssInterop(LinearGradient, {
  className: {
    target: 'style',
  },
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
    ...MaterialIcons.font,
    ...Feather.font,
    ...FontAwesome.font,
    ...FontAwesome5.font,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  console.log('[RootLayout] Rendering');
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <UserProvider>
          <ToastProvider>
            <Stack 
              screenOptions={{ 
                headerShown: false,
                contentStyle: { backgroundColor: 'black' },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(protected)/(tabs)" />
              <Stack.Screen name="(public)/Login" />
            </Stack>
          </ToastProvider>
        </UserProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
