import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import OtpInputGroup from '../components/OtpInputGroup'
import GradientButton from '@/components/GradientButton'
import icons from '@/constants/icons'
import { authService } from '@/services/authService'

const RESEND_TIME = 60

const VerifyOtp = () => {
  const { emailOrPhone, userId: initialUserId } = useLocalSearchParams<{ emailOrPhone: string, userId: string }>();
  const [otp, setOtp] = useState<string[]>([])
  const [error, setError] = useState(false)
  const [timer, setTimer] = useState(RESEND_TIME)
  const [userId, setUserId] = useState(initialUserId);

  const [verifying, setVerifying] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  const router = useRouter();

  useEffect(() => {
    if (timer === 0) return
    const interval = setInterval(() => setTimer(t => t - 1), 1000)
    return () => clearInterval(interval)
  }, [timer])

  useEffect(() => {
    const showEvent =
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow'
    const hideEvent =
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide'

    const showSub = Keyboard.addListener(showEvent, e => {
      setKeyboardHeight(e.endCoordinates.height)
    })

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0)
    })

    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  const handleVerify = async () => {
    if (verifying) return 

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError(true)
      return
    }

    if (!userId) {
        Alert.alert('Error', 'User ID is missing. Please try again.')
        return;
    }

    setError(false)
    setVerifying(true)

    try {
      await authService.forgotPasswordVerifyOtp(userId, otpString);
      router.replace({
        pathname: '/(public)/ForgotPassword/NewPassword',
        params: { userId }
      })
    } catch (err: any) {
      console.log('OTP verification failed', err)
      Alert.alert('Verification Failed', err.message || 'Invalid or expired OTP')
      setError(true)
    } finally {
      setVerifying(false)
    }
  }

  const handleResendOtp = async () => {
    if (verifying) return
    try {
        const response = await authService.forgotPasswordSendOtp(emailOrPhone);
        if (response.data?.userId) {
            setUserId(response.data.userId);
        }
        setOtp([])
        setTimer(RESEND_TIME)
        Alert.alert('OTP Sent', 'A new verification code has been sent.')
    } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to resend OTP')
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 64,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center">
          <View className="w-[72px] h-[72px] bg-[#2F2F2F] rounded-xl items-center justify-center">
            <Image source={icons.verificationcode} className="w-12 h-12" />
          </View>

          <Text className="text-white font-rubik-extrabold text-3xl mt-4">
            Verification Code
          </Text>

          <Text className="text-center font-rubik-medium text-sm text-[#A8A29E] mt-1">
            Please enter the code sent to{'\n'}
            <Text className="text-white">{emailOrPhone}</Text>
          </Text>

          <View className="w-full mt-10">
            <OtpInputGroup
              value={otp}
              onChange={setOtp}
              error={error}
            />
            {error && (
              <Text className="text-red-500 mt-3 text-sm text-center">
                Invalid or expired OTP
              </Text>
            )}
          </View>

          <View className="mt-6">
            {timer > 0 ? (
              <Text className="text-gray-400 text-sm">
                Resend OTP in {timer}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendOtp}>
                <Text className="text-[#A67CF8] text-sm font-rubik-semibold">
                  Resend OTP
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
      
      <View
        className="px-5 bg-black"
        style={{
          paddingBottom: keyboardHeight ? keyboardHeight + 12 : 24,
        }}
      >
        <View className="flex-row justify-center mb-4">
          <Text className="text-sm font-rubik-medium text-[#A8A29E]">
            Click here to{' '}
          </Text>
          <TouchableOpacity
            disabled={verifying}
            onPress={() => router.push({
                pathname: '/(public)/ForgotPassword/ChangeContact',
                params: { emailOrPhone }
            })}
          >
            <Text className="text-sm font-rubik-semibold text-[#A67CF8]">
              Change contact details
            </Text>
          </TouchableOpacity>
        </View>

        <GradientButton
          title={verifying ? 'Verifying...' : 'Verify'}
          height={56}
          width="100%"
          onPress={handleVerify}
          colors={['#B3B8E2', '#8860D9', '#9575CD']}
          start={{ x: 0, y: -2 }}
          end={{ x: 0, y: 2 }}
        />

        {verifying && (
          <View className="mt-3">
            <ActivityIndicator />
          </View>
        )}

        <View className="flex-row justify-center mt-4">
          <Text className="text-sm font-rubik-medium text-[#A8A29E]">
            Already have an account?{' '}
          </Text>
          <TouchableOpacity
            disabled={verifying}
            onPress={() => router.push('/(public)/Login')}
          >
            <Text className="text-sm font-rubik-semibold text-[#A67CF8]">
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default VerifyOtp
