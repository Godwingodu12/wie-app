import React from 'react'
import {
  Text,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  type DimensionValue,
  type ColorValue,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

type GradientButtonProps = {
  title: string
  onPress?: () => void
  height?: number
  width?: DimensionValue
  borderRadius?: number
  colors?: readonly [ColorValue, ColorValue, ...ColorValue[]]
  start?: { x: number; y: number }
  end?: { x: number; y: number }
  textClassName?: string
  containerClassName?: string
  style?: StyleProp<ViewStyle>
}

const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  height = 56,
  width = '100%',
  borderRadius = 999,
  colors = ['#B3B8E2', '#8860D9', '#9575CD'] as const,
  start = { x: 0, y: -2 },
  end = { x: 0, y: 2 },
  textClassName = 'text-base font-rubik-semibold text-white',
  containerClassName = '',
  style,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[{ width: width ?? '100%' as DimensionValue }, style]}
      className={containerClassName}
    >
      <LinearGradient
        colors={colors}
        start={start}
        end={end}
        style={{ height, borderRadius }}
        className='items-center justify-center'
      >
        <Text className={textClassName}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  )
}

export default GradientButton


