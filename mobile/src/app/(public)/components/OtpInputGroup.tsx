import React, { useRef } from 'react'
import { View, TextInput } from 'react-native'
import OtpInputField from '../components/OtpInputFiled'

type Props = {
  length?: number
  value: string[]
  onChange: (otp: string[]) => void
  error?: boolean
}

const OtpInputGroup: React.FC<Props> = ({
  length = 6,
  value,
  onChange,
  error = false,
}) => {
  const inputsRef = useRef<(TextInput | null)[]>([])

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/\D/g, '')

    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, length).split('')
      onChange(chars)
      const lastIndex = Math.min(chars.length - 1, length - 1)
      inputsRef.current[lastIndex]?.focus()
      return
    }

    const newOtp = [...value]
    newOtp[index] = cleaned
    onChange(newOtp)

    if (cleaned && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  return (
    <View className="flex-row gap-3 items-center justify-center">
      {Array.from({ length }).map((_, index) => (
        <OtpInputField
          key={index}
          ref={(ref) => {
            inputsRef.current[index] = ref
          }}
          value={value[index] || ''}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          hasError={error}
        />
      ))}
    </View>
  )
}

export default OtpInputGroup
