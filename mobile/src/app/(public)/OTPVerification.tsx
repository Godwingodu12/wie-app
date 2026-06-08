import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GradientButton from '@/components/GradientButton';
import { authService } from '@/services/authService';
import OtpInputGroup from './components/OtpInputGroup';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';

const OTPVerification = () => {
  const router = useRouter();
  const { fetchProfile } = useUser();
  const { emailOrPhone, type, tempUserId: initialTempUserId, userId: initialUserId } = useLocalSearchParams<{ emailOrPhone: string, type: string, tempUserId: string, userId: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [tempUserId, setTempUserId] = useState(initialTempUserId);
  const [userId, setUserId] = useState(initialUserId);
  const { showToast } = useToast();

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length < 6) {
      showToast({ message: 'Please enter a valid 6-digit OTP', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      if (type === 'signup' && tempUserId) {
        await authService.verifyOtp(tempUserId, otpString);
      } else {
        await authService.verifyOtp(tempUserId || userId || emailOrPhone, otpString);
      }
      
      showToast({ message: 'Account verified successfully', type: 'success' });
      
      // Fetch profile to update context before navigating
      try {
        await fetchProfile();
      } catch (fetchError) {
        console.error('Failed to fetch profile after verification:', fetchError);
      }

      // Minor delay to let the toast be seen
      setTimeout(() => {
        router.replace('/(protected)/(tabs)');
      }, 1000);
    } catch (error: any) {
      showToast({ message: error.message || 'Invalid OTP', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    
    setResending(true);
    try {
      const idToUse = tempUserId || userId || emailOrPhone;
      await authService.resendOtp(idToUse);
      
      setTimer(60);
      showToast({ message: 'A new verification code has been sent.', type: 'info' });
    } catch (error: any) {
      showToast({ message: error.message || 'Failed to resend OTP', type: 'error' });
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black px-5">
      <TouchableOpacity onPress={() => router.back()} className="mt-4">
        <Ionicons name="chevron-back" size={28} color="white" />
      </TouchableOpacity>

      <View className="mt-10 items-center">
        <View className="w-16 h-16 rounded-2xl bg-[#1C1C1E] items-center justify-center mb-6">
          <Ionicons name="lock-closed" size={32} color="white" />
        </View>
        
        <Text className="text-white text-3xl font-rubik-extrabold text-center">
          Verification Code
        </Text>
        <Text className="text-[#A8A29E] text-center mt-4 font-rubik-medium">
          Please enter the code we sent to{'\n'}
          <Text className="text-white">{emailOrPhone}</Text> to verify your account.
        </Text>
      </View>

      <View className="mt-12 px-2">
        <OtpInputGroup 
          value={otp}
          onChange={setOtp}
        />
      </View>

      <View className="mt-10">
        <GradientButton
          title={loading ? 'Verifying...' : 'Verify'}
          onPress={handleVerify}
          height={56}
          colors={['#B3B8E2', '#8860D9', '#9575CD']}
        />
      </View>

      <View className="mt-8 flex-row justify-center">
        <Text className="text-[#A8A29E] font-rubik-medium">
          Didn&apos;t receive code?{' '}
        </Text>
        <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
          <Text className={`font-rubik-semibold ${timer > 0 ? 'text-gray-600' : 'text-[#A67CF8]'}`}>
            {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
          </Text>
        </TouchableOpacity>
      </View>
      {resending && <ActivityIndicator size="small" color="#A67CF8" className="mt-2" />}
    </SafeAreaView>
  );
};

export default OTPVerification;
