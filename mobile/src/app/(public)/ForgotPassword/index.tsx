import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Platform,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import icons from '@/constants/icons'
import InputFiled from '../components/InputFiled'
import GradientButton from '@/components/GradientButton'
import { useAuthValidation } from '@/hooks/useAuthValidation'
import { authService } from '@/services/authService'

const ForgotPassword = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  const router = useRouter();
  const { validateInput } = useAuthValidation()

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

  const handleSendOTP = async () => {
    const input = emailOrPhone.trim()
    if (!validateInput(input)) return

    setLoading(true)
    try {
      const response = await authService.forgotPasswordSendOtp(input)
      router.push({
        pathname: '/(public)/ForgotPassword/VerifyOtp',
        params: { emailOrPhone: input, userId: response.data.userId }
      })
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
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
            <Image source={icons.forgotpassword} className="w-12 h-12" />
          </View>

          <Text className="text-white font-rubik-extrabold text-3xl mt-4">
            Forgot password
          </Text>

          <Text className="text-center font-rubik-medium text-sm text-[#A8A29E] mt-1">
            Please enter your registered email or phone number.{'\n'}
            A verification code will be sent to verify your account.
          </Text>

          <View className="w-full mt-10">
            <InputFiled
              placeholder="Email or Phone number"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              keyboardType="email-address"
            />
          </View>
        </View>
      </ScrollView>

      <View
        className="px-5 pb-6 bg-black"
        style={{
          paddingBottom: keyboardHeight ? keyboardHeight + 12 : 24,
        }}
      >
        <GradientButton
          title={loading ? "Sending..." : "Send OTP"}
          height={56}
          width="100%"
          onPress={handleSendOTP}
          colors={['#B3B8E2', '#8860D9', '#9575CD']}
          start={{ x: 0, y: -2 }}
          end={{ x: 0, y: 2 }}
        />

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
export default ForgotPassword
