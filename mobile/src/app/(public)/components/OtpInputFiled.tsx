import React, { forwardRef } from 'react'
import { TextInput, View, type KeyboardTypeOptions } from 'react-native'

type OtpInputFieldProps = {
  value: string
  onChangeText: (text: string) => void
  onKeyPress?: (e: any) => void
  hasError?: boolean
  keyboardType?: KeyboardTypeOptions
}

const OtpInputField = forwardRef<TextInput, OtpInputFieldProps>(
  (
    {
      value,
      onChangeText,
      onKeyPress,
      hasError = false,
      keyboardType = 'number-pad',
    },
    ref
  ) => {
    return (
      <View
        className={`w-[48px] h-[56px] rounded-2xl items-center justify-center border ${
          hasError ? 'border-red-500' : 'border-[#303030]'
        } bg-[#0d0d0e]`}
      >
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          onKeyPress={onKeyPress}
          keyboardType={keyboardType}
          maxLength={1}
          textAlign="center"
          className="text-xl font-rubik-semibold text-white w-full h-full"
        />
      </View>
    )
  }
)

OtpInputField.displayName = 'OtpInputField'

export default OtpInputField
