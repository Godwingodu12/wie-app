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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'

import OtpInputGroup from '../../(public)/components/OtpInputGroup'
import GradientButton from '@/components/GradientButton'
import icons from '@/constants/icons'

const RESEND_TIME = 60

const VerifyOtp = () => {
  const [otp, setOtp] = useState<string[]>([])
  const [error, setError] = useState(false)
  const [timer, setTimer] = useState(RESEND_TIME)

  const [verifying, setVerifying] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)


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

    if (otp.join('').length !== 6) {
      setError(true)
      return
    }

    setError(false)
    setVerifying(true)

    try {
      //  CALL YOUR BACKEND API HERE
      await fakeVerifyOtpApi(otp.join(''))

      router.replace('/(public)/ForgotPassword/NewPassword')
    } catch (err) {
      console.log('OTP verification failed')
      setError(true)
    } finally {
      setVerifying(false)
    }
  }

  const handleResendOtp = () => {
    if (verifying) return
    setOtp([])
    setTimer(RESEND_TIME)
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
            your email or phone number.
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
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          className="mt-6 items-center"
        >
          <Text className="text-[#A67CF8] font-rubik-medium">
            Go back
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  )
}

export default VerifyOtp


const fakeVerifyOtpApi = (otp: string) =>
  new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      otp === '123456' ? resolve() : reject()
    }, 1500)
  })
