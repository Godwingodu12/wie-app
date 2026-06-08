import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider } from '../context/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ToastProvider } from '../context/ToastContext';
import "./global.css";

cssInterop(LinearGradient, {
  className: {
    target: 'style',
  },
});

export default function RootLayout() {
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
