import React from 'react'
import {
  Text,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  type ColorValue,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

type BlueGrdBtnProps = {
  title: string
  onPress?: () => void
  height?: number
  width?: number | string 
  borderRadius?: number
  colors?: readonly [ColorValue, ColorValue, ...ColorValue[]]
  start?: { x: number; y: number }
  end?: { x: number; y: number }
  textClassName?: string
  containerClassName?: string
  style?: StyleProp<ViewStyle>
  paddingHorizontal?: number 
}

const BlueGrdBtn: React.FC<BlueGrdBtnProps> = ({
  title,
  onPress,
  height = 56,
  width, 
  borderRadius = 999,
  colors = ['#2979FF', '#6B9CF0', '#9DC1FF'] as const,
  start = { x: 0, y: -2 },
  end = { x: 0, y: 2 },
  textClassName = 'text-white font-rubik-medium text-center font-[12px]',
  containerClassName = '',
  style,
  paddingHorizontal = 10,
}) => {

  // SOLUTION: Explicitly cast the array to StyleProp<ViewStyle> 
  // to prevent the "overload match" error.
  const containerStyle = [style, width ? { width } : {}] as StyleProp<ViewStyle>;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress} 
      style={containerStyle}
      className={containerClassName}
    >
      <LinearGradient
        colors={colors}
        start={start}
        end={end}
        style={{ 
            height, 
            width: '100%', 
            borderRadius, 
            paddingHorizontal, 
            justifyContent: 'center', 
            alignItems: 'center',
        }}
      >
        <Text numberOfLines={1} className={textClassName}>
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  )
}

export default BlueGrdBtn
