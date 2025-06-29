import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Link, useRouter } from 'expo-router'
import { useUser, useAuth } from '@clerk/clerk-expo'

const HomeScreen = () => {
  const { user, isLoaded } = useUser()
  const { signOut } = useAuth()
  const router = useRouter()

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

  const handleSignOut = async () => {
    try {
      await signOut()
      router.replace('/signup')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-3xl font-bold text-gray-900 mb-4 text-center">
        Welcome back!
      </Text>
      <Text className="text-gray-600 text-lg mb-2 text-center">
        Hello, {user.firstName || user.emailAddresses[0]?.emailAddress}
      </Text>
      <Text className="text-gray-500 text-base mb-8 text-center">
        You're successfully signed in to Circlo
      </Text>
      
      <TouchableOpacity 
        className="bg-red-600 rounded-full py-4 px-8"
        onPress={handleSignOut}
      >
        <Text className="text-white font-semibold text-lg">Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}

export default HomeScreen