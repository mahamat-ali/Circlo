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
    StyleSheet,
    Alert
} from "react-native";
import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { useSignIn, useSignUp, useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

const EmailLoginScreen = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
    const router = useRouter();
    const { signIn } = useSignIn();
    const { signUp } = useSignUp();
    const { startSSOFlow } = useSSO();

    React.useEffect(() => {
        WebBrowser.warmUpAsync();
        return () => {
            WebBrowser.coolDownAsync();
        };
    }, []);

    const handleEmailAuth = async () => {
        if (!email.trim()) {
            setMessage('Please enter your email');
            setMessageType('error');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setMessage('Please enter a valid email address');
            setMessageType('error');
            return;
        }

        setIsLoading(true);
        setMessage('');
        setMessageType('');

        try {
            // Try to sign in first
            const signInResult = await signIn?.create({
                identifier: email.trim(),
            });

            if (signInResult?.status === 'needs_first_factor') {
                // Send email code for existing user
                const emailFactor = signInResult.supportedFirstFactors?.find(
                    (factor) => factor.strategy === 'email_code'
                );

                if (emailFactor && 'emailAddressId' in emailFactor) {
                    await signInResult.prepareFirstFactor({
                        strategy: 'email_code',
                        emailAddressId: emailFactor.emailAddressId,
                    });

                    setMessage('Check your email for the verification code!');
                    setMessageType('success');
                    router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
                }
            }
        } catch (signInError: any) {
            // If sign in fails, try to sign up
            try {
                const signUpResult = await signUp?.create({
                    emailAddress: email.trim(),
                });

                if (signUpResult?.status === 'missing_requirements') {
                    // Send verification email for new user
                    await signUpResult.prepareEmailAddressVerification({ strategy: 'email_code' });

                    setMessage('Check your email for the verification code!');
                    setMessageType('success');
                    router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
                }
            } catch (signUpError: any) {
                console.error('Email auth error:', signUpError);
                setMessage(signUpError.errors?.[0]?.message || 'Failed to send verification email. Please try again.');
                setMessageType('error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialSignUp = async (provider: string) => {

        setIsLoading(true);
        try {
            const strategy = `oauth_${provider}` as 'oauth_google' | 'oauth_facebook' | 'oauth_apple' | 'enterprise_sso';
            const { createdSessionId, setActive, signIn, signUp } =
                await startSSOFlow({
                    strategy: strategy as 'oauth_google' | 'oauth_facebook' | 'oauth_apple',
                    redirectUrl: AuthSession.makeRedirectUri({
                        scheme: "lizza",
                        path: "/",
                    }),
                });
            if (createdSessionId) {
                console.log("Created session ID:", createdSessionId);
            }
            console.log(signIn);
            router.replace("/(auth)/onboarding");
        } catch (error) {
            console.error(`${provider} signup error:`, error);
            Alert.alert(
                "Error",
                `An error occurred during ${provider} sign up. Please try again.`
            );
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
                                    onSubmitEditing={handleEmailAuth}
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
                                <Text className={`text-sm mb-4 ${messageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                    {message}
                                </Text>
                            ) : null}

                            <TouchableOpacity
                                className={`w-full rounded-full py-4 mb-6 ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600'
                                    }`}
                                activeOpacity={0.8}
                                onPress={handleEmailAuth}
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
                                    className={`bg-white border border-gray-200 rounded-full p-4 flex-1 mx-2 items-center ${isLoading ? 'opacity-50' : ''
                                        }`}
                                    activeOpacity={0.7}
                                    disabled={isLoading}
                                    onPress={() => handleSocialSignUp('google')}
                                >
                                    <Ionicons name="logo-google" size={28} color="#DB4437" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className={`bg-white border border-gray-200 rounded-full p-4 flex-1 mx-2 items-center ${isLoading ? 'opacity-50' : ''
                                        }`}
                                    activeOpacity={0.7}
                                    disabled={isLoading}
                                    onPress={() => handleSocialSignUp('facebook')}
                                >
                                    <Ionicons name="logo-facebook" size={28} color="#4267B2" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className={`bg-black rounded-full p-4 flex-1 mx-2 items-center ${isLoading ? 'opacity-50' : ''
                                        }`}
                                    activeOpacity={0.7}
                                    disabled={isLoading}
                                    onPress={() => handleSocialSignUp('apple')}
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