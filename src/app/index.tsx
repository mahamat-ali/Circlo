import { View, Text, TouchableOpacity } from 'react-native'
import React, { useEffect } from 'react'
import { Link, useRouter } from 'expo-router'
import { useUser, useAuth } from '@clerk/clerk-expo'

const HomeScreen = () => {
  const { user, isLoaded } = useUser()
  const { signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && user) {
      router.replace('/(tabs)')
    }
  }, [isLoaded, user, router])

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg">Loading...</Text>
      </View>
    )
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl font-bold text-gray-900 mb-4 text-center">
          Welcome to Circlo
        </Text>
        <Text className="text-gray-600 text-lg mb-8 text-center">
          Please sign up or log in to continue
        </Text>
        <Link href="/signup" asChild>
          <TouchableOpacity className="bg-indigo-600 rounded-full py-4 px-8">
            <Text className="text-white font-semibold text-lg">Get Started</Text>
          </TouchableOpacity>
        </Link>
      </View>
    )
  }

  // This will be briefly shown before redirect
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg">Redirecting...</Text>
    </View>
  )
}

export default HomeScreen