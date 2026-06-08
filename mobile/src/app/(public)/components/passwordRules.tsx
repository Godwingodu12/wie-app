import React from 'react'
import { View, Text } from 'react-native'

type Props = {
  rules: {
    lengthRule: boolean
    specialCharsRule: boolean
    alphaNumericRule: boolean
  }
}

const PasswordRules = ({ rules }: Props) => {
  const ruleClass = (valid: boolean) =>
    `font-rubik-medium text-sm ${valid ? 'text-green-500' : 'text-red-500'}`

  return (
    <View className="mt-2 gap-1">
      <Text className={ruleClass(rules.lengthRule)}>
        • Must have at least 8 characters
      </Text>
      <Text className={ruleClass(rules.specialCharsRule)}>
        • Minimum 2 special characters
      </Text>
      <Text className={ruleClass(rules.alphaNumericRule)}>
        • Minimum 2 alphabets and 2 numbers
      </Text>
    </View>
  )
}

export default PasswordRules
