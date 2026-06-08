import { Image, Text, View, TouchableOpacity , Alert } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import images from '@/constants/images'
import InputFiled from './components/InputFiled'
import CountryDropdown from './components/CountryDropdown'
import GradientButton from '@/components/GradientButton'
import LoginOptions from './components/LoginOptions'
import icons from '@/constants/icons'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/theme'
import { useRouter } from 'expo-router'
import { useAuthValidation } from '@/hooks/useAuthValidation'
import { authService } from '@/services/authService'
import { useOAuth } from '@/hooks/auth/useOAuth'

const SignUp = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordHidden, setIsPasswordHidden] = useState(true)
  const [country, setCountry] = useState('IN')

  const router = useRouter();
  const { startOAuth } = useOAuth();
  const {
    inputError,
    passwordError,
    setInputError,
    setPasswordError,
    resetErrors,
    validateInput,
    validatePassword,
  } = useAuthValidation()

  const handleRegister = async () => {
    resetErrors()

    const input = emailOrPhone.trim()
    const pwd = password.trim()

    if (!validateInput(input)) return
    if (!validatePassword(pwd)) return

    try {
      const response = await authService.sendOtp(input, pwd, country)
      router.push({
        pathname: '/(public)/OTPVerification',
        params: { emailOrPhone: input, type: 'signup', tempUserId: response.tempUserId }
      })
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'An error occurred')
    }
  }

  return (
    <SafeAreaView className='h-full w-full bg-black'>
      <View className='flex-1 px-5'>
        <View className='items-center'>
          <Image
            source={images.loginimg}
            resizeMode='contain'
            className='mt-6 h-[220px] w-full'
          />
        </View>
        <View className='mt-6 items-center'>
          <Text className='text-center font-rubik-extrabold text-[32px] text-white'>
            Signup
          </Text>
          <Text className='mt-2 text-center font-rubik-medium text-sm text-[#A8A29E]'>
            Start a your new journey with wiehive{'\n'}by creating new account
          </Text>
        </View>
        <View className='mt-8 gap-4'>
          <InputFiled
            placeholder="Email or Phone number"
            value={emailOrPhone}
            error={!!inputError}
            onChangeText={(text) => {
              setEmailOrPhone(text)
              setInputError('')
            }}
            rightElement={<CountryDropdown selected={country} onSelect={setCountry} />}
          />
          {inputError ? (
            <Text className="mt-1 text-xs text-red-500 font-rubik">
              {inputError}
            </Text>
          ) : null}
          <InputFiled
            placeholder="Password"
            value={password}
            error={!!passwordError}
            secureTextEntry={isPasswordHidden}
            onChangeText={(text) => {
              setPassword(text)
              if (text.length >= 6) {
                setPasswordError('')
              }
            }}
            rightElement={
              <TouchableOpacity onPress={() => setIsPasswordHidden(!isPasswordHidden)}>
                <Ionicons
                  name={isPasswordHidden ? 'eye' : 'eye-off'}
                  size={22}
                  color={COLORS.white}
                />
              </TouchableOpacity>
            }
          />
          {passwordError ? (
            <Text className="mt-1 text-xs text-red-500 font-rubik">
              {passwordError}
            </Text>
          ) : null}
        </View>

        <View className='mt-4 flex-row justify-center'>
          <Text className='text-sm font-rubik-medium text-[#A8A29E]'>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity activeOpacity={0.6} onPress={() => { router.push('/(public)/Login') }}>
            <Text className='text-sm font-rubik-semibold text-[#A67CF8]'>
              Login
            </Text>
          </TouchableOpacity>
        </View>

        <GradientButton
          title='Register'
          height={56}
          width='100%'
          containerClassName='mt-6'
          colors={['#B3B8E2', '#8860D9', '#9575CD']}
          start={{ x: 0, y: -2 }}
          end={{ x: 0, y: 2 }}
          onPress={handleRegister}
        />

        <View className='mt-8 items-center'>
          <View className='mb-4 flex-row items-center w-full'>
            <View className='h-[.5px] flex-1 bg-[#6F7680] rounded-full' />
            <Text className='mx-3 text-xs font-rubik-medium text-[#A8A29E]'>
              or login with
            </Text>
            <View className='h-[.5px] flex-1 bg-[#6F7680] rounded-full' />
          </View>

          <View className='flex-row justify-center gap-6'>
            <LoginOptions label={icons.google} onPress={() => startOAuth('google')} />
            <LoginOptions label={icons.apple} onPress={() => startOAuth('apple')} />
            <LoginOptions label={icons.microsoft} onPress={() => startOAuth('microsoft')} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default SignUp
