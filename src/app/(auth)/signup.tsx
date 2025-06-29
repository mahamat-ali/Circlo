import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Platform,
    ScrollView,
    Image,
    TouchableWithoutFeedback,
    Keyboard,
    KeyboardAvoidingView,
    StyleSheet
} from "react-native";
import React, { useState, useCallback, useRef } from "react";
import { Link, useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

const EmailLoginScreen = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
    const router = useRouter();

    const handleSubmit = async () => {
        if (!email.trim()) {
            setMessage('Please enter your email');
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setMessage('Check your email for the magic link!');
            setMessageType('success');
            setEmail('');
            router.push('/otp-confirm');
        } catch (error) {
            setMessage('Failed to send magic link. Please try again.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailChange = useCallback((text: string) => {
        setEmail(text);
        if (message) setMessage('');
    }, [message]);

    const scrollViewRef = useRef<ScrollView>(null);

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    keyboardDismissMode="on-drag"
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                        <View className="flex-1">
                            {/* Welcome Illustration */}
                            <View className="items-center mb-8">
                                <View className="w-80 h-80 items-center justify-center">
                                    <Image
                                        source={require('../../../assets/images/welcome.png')}
                                        style={{ width: 300, height: 300 }}
                                        resizeMode="contain"
                                    />
                                </View>
                            </View>

                            <Text className="text-4xl font-bold text-gray-900 mb-3">
                                Welcome to Circlo
                            </Text>
                            <Text className="text-gray-600 text-lg mb-10">
                                Sign up or log in with your email
                            </Text>

                            <View className="mb-6">
                                <TextInput
                                    className="w-full bg-gray-50 text-gray-900 rounded-full px-5 border border-gray-200"
                                    placeholder="Enter your email"
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    autoCorrect={false}
                                    value={email}
                                    onChangeText={handleEmailChange}
                                    editable={!isLoading}
                                    returnKeyType="done"
                                    onSubmitEditing={handleSubmit}
                                    style={{
                                        fontSize: 16,
                                        color: '#1a1a1a',
                                        height: 56, // Fixed height
                                        textAlignVertical: 'center', // Center text vertically
                                        paddingVertical: 0, // Remove vertical padding to respect fixed height
                                        includeFontPadding: false // Remove extra padding for text
                                    }}
                                    onFocus={() => {
                                        // Scroll to the top when input is focused
                                        requestAnimationFrame(() => {
                                            scrollViewRef.current?.scrollTo({ y: 0, animated: false });
                                        });
                                    }}
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
                                <Text className="text-center text-white font-semibold text-lg">
                                    {isLoading ? 'Sending...' : 'Continue with Email'}
                                </Text>
                            </TouchableOpacity>

                            <View className="flex-row items-center my-6">
                                <View className="flex-1 h-px bg-gray-200" />
                                <Text className="text-gray-400 text-base px-3">Or continue with</Text>
                                <View className="flex-1 h-px bg-gray-200" />
                            </View>

                            <View className="flex-row justify-between w-full mb-6">
                                <TouchableOpacity
                                    className="bg-white border border-gray-200 rounded-full p-4 flex-1 mx-2 items-center"
                                    activeOpacity={0.7}
                                    disabled={isLoading}
                                >
                                    <Ionicons name="logo-google" size={28} color="#DB4437" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="bg-white border border-gray-200 rounded-full p-4 flex-1 mx-2 items-center"
                                    activeOpacity={0.7}
                                    disabled={isLoading}
                                >
                                    <Ionicons name="logo-facebook" size={28} color="#4267B2" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="bg-black rounded-full p-4 flex-1 mx-2 items-center"
                                    activeOpacity={0.7}
                                    disabled={isLoading}
                                >
                                    <Ionicons name="logo-apple" size={28} color="white" />
                                </TouchableOpacity>
                            </View>


                        </View>
                    </TouchableWithoutFeedback>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
        padding: 24,
        paddingTop: 32,
        paddingBottom: 40,
    },
});

export default EmailLoginScreen;