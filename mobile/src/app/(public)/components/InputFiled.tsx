import { COLORS } from '@/constants/theme'
import React from 'react'
import {
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

type InputFieldProps = {
  label?: string
  placeholder: string
  value: string
  onChangeText: (text: string) => void
  secureTextEntry?: boolean
  keyboardType?: KeyboardTypeOptions
  rightElement?: React.ReactNode
  containerStyle?: StyleProp<ViewStyle>
  error?: boolean
}

const InputFiled: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  rightElement,
  containerStyle,
  error = false,
}) => {
  return (
    <View style={containerStyle} className="w-full">
      {label && (
        <Text className="mb-2 text-xs font-rubik-medium text-[#A8A29E]">
          {label}
        </Text>
      )}

      <View
        className={`
          flex-row items-center rounded-2xl bg-[#0d0d0e]
          px-4 py-4 border-[0.6px]
          ${error ? 'border-red-500' : 'border-[#303030]'}
        `}
      >
        <TextInput
          className="flex-1 text-sm font-rubik-medium text-white"
          placeholder={placeholder}
          placeholderTextColor={COLORS.black_secondary_text}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
        />

        {rightElement && <View className="ml-3">{rightElement}</View>}
      </View>
    </View>
  )
}

export default InputFiled
