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
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import icons from '@/constants/icons'
import InputFiled from '../components/InputFiled'
import GradientButton from '@/components/GradientButton'
import PasswordRules from '../components/passwordRules'
import { usePasswordValidation } from '@/hooks/usePasswordValidation'
import { COLORS } from '@/constants/theme'
import { authService } from '@/services/authService'

const NewPassword = () => {
    const router = useRouter()
    const { userId } = useLocalSearchParams<{ userId: string }>();
    const [isPasswordHidden, setIsPasswordHidden] = useState(true)
    const [isRePasswordHidden, setIsRePasswordHidden] = useState(true)
    const [loading, setLoading] = useState(false)
    
    const {
        password,
        confirmPassword,
        setPassword,
        setConfirmPassword,
        matchError,
        rules,
        validate,
    } = usePasswordValidation()

    const handleSave = async () => {
        if (!validate()) return
        
        if (!userId) {
            Alert.alert('Error', 'User ID is missing. Please try again.')
            return;
        }

        setLoading(true)
        try {
            await authService.resetPassword(userId, password);
            Alert.alert('Success', 'Password reset successfully', [
                { text: 'OK', onPress: () => router.replace('/(public)/Login') }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to reset password');
        } finally {
            setLoading(false)
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-black">
            <ScrollView contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 64,
                paddingBottom: 40,
            }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                <View className="items-center">
                    <View className="w-[72px] h-[72px] bg-[#2F2F2F] rounded-xl items-center justify-center">
                        <Image source={icons.forgotpassword} className="w-12 h-12" />
                    </View>
                    <Text className="text-white font-rubik-extrabold text-3xl mt-4">
                        Reset password
                    </Text>

                    <Text className="text-center font-rubik-medium text-sm text-[#A8A29E] mt-1">
                        Enter your new password
                    </Text>

                    <View className='w-full mt-10 gap-4'>
                        <InputFiled
                            placeholder="New password"
                            value={password}
                            secureTextEntry={isPasswordHidden}
                            onChangeText={setPassword}
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

                        <InputFiled
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            secureTextEntry={isRePasswordHidden}
                            onChangeText={setConfirmPassword}
                            rightElement={
                                <TouchableOpacity onPress={() => setIsRePasswordHidden(!isRePasswordHidden)}>
                                    <Ionicons
                                        name={isRePasswordHidden ? 'eye' : 'eye-off'}
                                        size={22}
                                        color={COLORS.white}
                                    />
                                </TouchableOpacity>
                            }
                        />

                        {matchError ? (
                            <Text className="text-red-500 text-sm mt-1">{matchError}</Text>
                        ) : null}
                    </View>
                    <View className='w-full justify-start'>
                        <PasswordRules rules={rules} />
                    </View>
                </View>
            </ScrollView>
            <View className="px-5 pb-6 bg-black">
                <GradientButton
                    title={loading ? "Saving..." : "Save"}
                    height={56}
                    width="100%"
                    onPress={handleSave}
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

export default NewPassword
