import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TabHeader } from '@/components/Header/TabHeader'

/**
 * NOTE: This screen is normally bypassed by the tabPress listener in (tabs)/_layout.tsx
 * which navigates directly to the connection flow.
 */
const Connection = () => {
  return (
    <SafeAreaView className="flex-1 bg-black">
      <TabHeader />
      <View className="flex-1 items-center justify-center">
        <Text className="text-white">Connection Flow Loading...</Text>
      </View>
    </SafeAreaView>
  )
}

export default Connection

const styles = StyleSheet.create({})
