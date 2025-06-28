import { View, Text } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const HomeScreen = () => {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-xl font-bold text-blue-500">
        Welcome to Nativewind!
      </Text>

      <Link href="/signup">Sign up</Link>
    </View>
  )
}

export default HomeScreen