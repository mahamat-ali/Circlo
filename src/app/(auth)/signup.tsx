import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback
} from "react-native";
import React, { useState } from "react";
import { Link, router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

const SignUpScreen = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!email) {
      setMessage('Please enter your email');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Check your email for the magic link!');
    } catch (error) {
      setMessage('Failed to send magic link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView 
        className="flex-1 px-6 py-8"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-bold text-gray-900 mb-2">
          Welcome
        </Text>
        <Text className="text-gray-600 text-base mb-8">
          Sign up or log in with your email
        </Text>

        <View className="mb-6">
          <TextInput
            className="w-full bg-gray-50 text-gray-900 rounded-full px-5 py-4 border border-gray-200 text-base"
            placeholder="Enter your email"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
          />
        </View>

        {message ? (
          <Text className={`text-sm mb-4 ${message.includes('Check your email') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </Text>
        ) : null}

        <TouchableOpacity 
          className="w-full bg-indigo-600 rounded-full py-4 mb-6"
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text className="text-center text-white font-semibold text-base">
            {isLoading ? 'Sending...' : 'Continue with Email'}
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="text-gray-400 text-sm px-3">Or continue with</Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        <View className="flex-row justify-between w-full mb-6">
          <TouchableOpacity 
            className="bg-white border border-gray-200 rounded-full p-4 flex-1 mx-2 items-center"
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Ionicons name="logo-google" size={20} color="#DB4437" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="bg-white border border-gray-200 rounded-full p-4 flex-1 mx-2 items-center"
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Ionicons name="logo-facebook" size={20} color="#4267B2" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="bg-black rounded-full p-4 flex-1 mx-2 items-center"
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Ionicons name="logo-apple" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-4">
          <Text className="text-gray-600 text-sm">
            Already have an account?{" "}
          </Text>
          <Link href="/signin" asChild>
            <TouchableOpacity>
              <Text className="text-indigo-600 font-semibold text-sm">Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUpScreen;