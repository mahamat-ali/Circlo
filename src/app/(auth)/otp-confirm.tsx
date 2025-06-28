import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import HappySvg from '@/assets/images/happy.svg';

const OTPConfirmScreen = () => {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const inputRefs = useRef<Array<TextInput | null>>(Array(6).fill(null));
  const [activeInputIndex, setActiveInputIndex] = useState(0);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setIsResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (text: string, index: number) => {
    // Only allow numbers and limit to 1 character
    if (text.length <= 1 && /^\d*$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);
      setError('');
      setActiveInputIndex(index);

      // Auto focus next input if there's a value
      if (text && index < 5) {
        inputRefs.current[index + 1]?.focus();
        setActiveInputIndex(index + 1);
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Handle backspace to move to previous input
    if (key === 'Backspace' && index > 0 && !otp[index]) {
      inputRefs.current[index - 1]?.focus();
      setActiveInputIndex(index - 1);
    }
  };

  const handleResendOtp = async () => {
    // Reset countdown and disable resend button
    setCountdown(30);
    setIsResendDisabled(true);
    setError('');
    
    try {
      // TODO: Implement actual resend OTP logic
      console.log('Resending OTP to:', email);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      setError('Failed to resend code. Please try again.');
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // TODO: Replace with actual verification logic
      if (otpCode === '123456') {
        // Navigate to success screen or next step
        router.replace('/(tabs)');
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== '');

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.select({ ios: 30, android: 20 })}
        extraHeight={Platform.select({ android: 100, ios: 0 })}
        keyboardDismissMode="interactive"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View className="flex-1">
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center -ml-2 mb-6"
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>

            {/* Header Section */}
            <View className="mb-8">
              <Text className="text-4xl font-bold text-gray-900 mb-3">
                Verify Your Email
              </Text>
              <Text className="text-gray-600 text-base leading-6">
                We've sent a 6-digit code to {email || 'your email address'}. Please enter
                it below to continue.
              </Text>
            </View>

            {/* OTP Input Fields */}
            <View className="flex-row justify-between mb-8 px-2">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <View
                  key={index}
                  className={`w-14 h-16 rounded-xl border-2 ${
                    activeInputIndex === index 
                      ? "border-indigo-500" 
                      : otp[index] 
                        ? "border-indigo-300" 
                        : "border-gray-200"
                  } items-center justify-center`}
                >
                  <TextInput
                    ref={(ref) => {
                      if (ref) {
                        inputRefs.current[index] = ref;
                      }
                    }}
                    className="w-full h-full text-center text-2xl font-bold text-gray-900"
                    keyboardType="number-pad"
                    maxLength={1}
                    value={otp[index]}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={({ nativeEvent: { key } }) =>
                      handleKeyPress(key, index)
                    }
                    selectTextOnFocus
                    selection={{ start: 0, end: 1 }}
                    autoFocus={index === 0}
                  />
                </View>
              ))}
            </View>

            {/* Error Message */}
            {error ? (
              <View className="flex-row items-center mb-6 bg-red-50 p-3 rounded-lg">
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color="#EF4444"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-red-600 text-sm">{error}</Text>
              </View>
            ) : null}

            {/* Verify Button */}
            <TouchableOpacity
              className={`w-full py-5 rounded-full items-center justify-center flex-row ${
                isOtpComplete ? "bg-indigo-600" : "bg-indigo-300"
              }`}
              onPress={handleVerify}
              disabled={!isOtpComplete || isVerifying}
              activeOpacity={0.8}
            >
              <Text className="text-white text-base font-semibold">
                {isVerifying ? "Verifying..." : "Verify Code"}
              </Text>
              {!isVerifying && (
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="white"
                  style={{ marginLeft: 10 }}
                />
              )}
            </TouchableOpacity>

            {/* Resend Code */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-600">
                Didn't receive a code?{" "}
              </Text>
              <TouchableOpacity
                onPress={handleResendOtp}
                disabled={isResendDisabled}
              >
                <Text
                  className={`${
                    isResendDisabled ? "text-gray-400" : "text-indigo-600"
                  } font-semibold`}
                >
                  {isResendDisabled
                    ? `Resend in ${countdown}s`
                    : "Resend Code"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>
      <View className="absolute bottom-0 left-0 right-0">
        <View className="items-center justify-end -mx-6">
          <View className="w-full max-w-md">
            <HappySvg width="100%" height="100%" />
          </View>
        </View>
      </View>
    </View>
  );
};

export default OTPConfirmScreen;
