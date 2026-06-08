import { View, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'

type LoginProps = {
    label?: any,
    onPress?: () => void,
}

const LoginOptions: React.FC<LoginProps> = ({label,onPress}) => {
  return (
    <TouchableOpacity onPress={onPress} className='h-[56px] w-[56px] items-center justify-center rounded-full bg-[#1B1B1D]'>
      <Image source={label} className='size-8' resizeMode='contain'/>
    </TouchableOpacity>
  )
}

export default LoginOptions
