import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Platform,
    ScrollView,
    KeyboardAvoidingView,
    StyleSheet,
    Alert
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSignIn, useSignUp } from '@clerk/clerk-expo';

const VerifyEmailScreen = () => {
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
    const router = useRouter();
    const { email } = useLocalSearchParams<{ email: string }>();
    const { signIn, setActive } = useSignIn();
    const { signUp } = useSignUp();

    // Debug session states on component mount
    useEffect(() => {
        console.log('VerifyEmailScreen mounted with states:', {
            email,
            signInStatus: signIn?.status,
            signUpStatus: signUp?.status,
            signInId: signIn?.id,
            signUpId: signUp?.id
        });
    }, [email, signIn?.status, signUp?.status, signIn?.id, signUp?.id]);

    const handleVerifyCode = async () => {
        if (!code.trim()) {
            setMessage('Please enter the verification code');
            setMessageType('error');
            return;
        }

        setIsLoading(true);
        setMessage('');
        setMessageType('');

        try {
            let verificationResult = null;

            // Check if we have a sign-in session that needs verification
            if (signIn && signIn.status === 'needs_first_factor') {
                console.log('Attempting sign-in verification');
                verificationResult = await signIn.attemptFirstFactor({
                    strategy: 'email_code',
                    code: code.trim(),
                });

                if (verificationResult.status === 'complete') {
                    await setActive?.({ session: verificationResult.createdSessionId });
                    router.replace('/test-upload');
                    return;
                }
            }
            // Check if we have a sign-up session that needs verification
            else if (signUp && signUp.status === 'missing_requirements') {
                console.log('Attempting sign-up verification');
                verificationResult = await signUp.attemptEmailAddressVerification({
                    code: code.trim(),
                });

                if (verificationResult.status === 'complete') {
                    await setActive?.({ session: verificationResult.createdSessionId });
                    router.replace('/(auth)/onboarding');
                    return;
                }
            }
            // Fallback: try both if status is unclear
            else {
                console.log('Status unclear, trying both verification methods');
                
                // Try sign-in first
                if (signIn) {
                    try {
                        verificationResult = await signIn.attemptFirstFactor({
                            strategy: 'email_code',
                            code: code.trim(),
                        });

                        if (verificationResult.status === 'complete') {
                            await setActive?.({ session: verificationResult.createdSessionId });
                            router.replace('/(auth)/onboarding');
                            return;
                        }
                    } catch (signInError) {
                        console.log('Sign-in verification failed:', signInError);
                    }
                }

                // Try sign-up if sign-in failed
                if (signUp) {
                    try {
                        verificationResult = await signUp.attemptEmailAddressVerification({
                            code: code.trim(),
                        });

                        if (verificationResult.status === 'complete') {
                            await setActive?.({ session: verificationResult.createdSessionId });
                            router.replace('/(auth)/onboarding');
                            return;
                        }
                    } catch (signUpError) {
                        console.log('Sign-up verification failed:', signUpError);
                        throw signUpError;
                    }
                }
            }

            // If we reach here, verification failed
            setMessage('Invalid verification code. Please try again.');
            setMessageType('error');
            
        } catch (error: any) {
            console.error('Verification error:', error);
            
            // Handle specific error codes
            if (error.code === 'form_code_incorrect') {
                setMessage('The verification code is incorrect. Please check and try again.');
            } else if (error.code === 'verification_expired') {
                setMessage('The verification code has expired. Please request a new one.');
            } else {
                const errorMessage = error.errors?.[0]?.message || error.message || 'Failed to verify code. Please try again.';
                setMessage(errorMessage);
            }
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setIsLoading(true);
        setMessage('');
        setMessageType('');

        try {
            let resendSuccess = false;

            // Check if we have a sign-in session
            if (signIn && signIn.status === 'needs_first_factor') {
                console.log('Resending code for sign-in');
                const emailFactor = signIn.supportedFirstFactors?.find(
                    (factor) => factor.strategy === 'email_code'
                );
                
                if (emailFactor && 'emailAddressId' in emailFactor) {
                    await signIn.prepareFirstFactor({
                        strategy: 'email_code',
                        emailAddressId: emailFactor.emailAddressId,
                    });
                    resendSuccess = true;
                }
            }
            // Check if we have a sign-up session
            else if (signUp && signUp.status === 'missing_requirements') {
                console.log('Resending code for sign-up');
                await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
                resendSuccess = true;
            }
            // Fallback: try both
            else {
                console.log('Status unclear, trying both resend methods');
                
                // Try sign-in first
                if (signIn) {
                    try {
                        const emailFactor = signIn.supportedFirstFactors?.find(
                            (factor) => factor.strategy === 'email_code'
                        );
                        
                        if (emailFactor && 'emailAddressId' in emailFactor) {
                            await signIn.prepareFirstFactor({
                                strategy: 'email_code',
                                emailAddressId: emailFactor.emailAddressId,
                            });
                            resendSuccess = true;
                        }
                    } catch (signInError) {
                        console.log('Sign-in resend failed:', signInError);
                    }
                }

                // Try sign-up if sign-in failed
                if (!resendSuccess && signUp) {
                    try {
                        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
                        resendSuccess = true;
                    } catch (signUpError) {
                        console.log('Sign-up resend failed:', signUpError);
                        throw signUpError;
                    }
                }
            }

            if (resendSuccess) {
                setMessage('Verification code sent!');
                setMessageType('success');
            } else {
                setMessage('Failed to resend code. Please try again.');
                setMessageType('error');
            }
            
        } catch (error: any) {
            console.error('Resend error:', error);
            const errorMessage = error.errors?.[0]?.message || error.message || 'Failed to resend code. Please try again.';
            setMessage(errorMessage);
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="flex-1 justify-center">
                        <Text className="text-3xl font-bold text-gray-900 mb-3 text-center">
                            Check your email
                        </Text>
                        <Text className="text-gray-600 text-lg mb-8 text-center">
                            We sent a verification code to{"\n"}
                            <Text className="font-semibold">{email}</Text>
                        </Text>

                        <View className="mb-6">
                            <TextInput
                                className="w-full bg-gray-50 text-gray-900 rounded-full px-5 border border-gray-200 text-center"
                                placeholder="Enter verification code"
                                placeholderTextColor="#9ca3af"
                                keyboardType="number-pad"
                                autoCapitalize="none"
                                autoComplete="one-time-code"
                                autoCorrect={false}
                                value={code}
                                onChangeText={(text) => {
                                    // Only allow numbers and limit to 6 digits
                                    const numericCode = text.replace(/[^0-9]/g, '').slice(0, 6);
                                    setCode(numericCode);
                                    
                                    // Clear any existing error messages when user types
                                    if (message && messageType === 'error') {
                                        setMessage('');
                                        setMessageType('');
                                    }
                                }}
                                editable={!isLoading}
                                returnKeyType="done"
                                onSubmitEditing={handleVerifyCode}
                                maxLength={6}
                                style={{
                                    fontSize: 18,
                                    color: '#1a1a1a',
                                    height: 56,
                                    textAlignVertical: 'center',
                                    paddingVertical: 0,
                                    includeFontPadding: false,
                                    letterSpacing: 2
                                }}
                            />
                        </View>

                        {message ? (
                            <Text className={`text-sm mb-4 text-center ${
                                messageType === 'success' ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {message}
                            </Text>
                        ) : null}

                        <TouchableOpacity
                            className={`w-full rounded-full py-4 mb-4 ${
                                isLoading ? 'bg-indigo-400' : 'bg-indigo-600'
                            }`}
                            activeOpacity={0.8}
                            onPress={handleVerifyCode}
                            disabled={isLoading}
                        >
                            <Text className="text-center text-white font-semibold text-lg">
                                {isLoading ? 'Verifying...' : 'Verify Code'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="w-full py-3"
                            activeOpacity={0.7}
                            onPress={handleResendCode}
                            disabled={isLoading}
                        >
                            <Text className="text-center text-indigo-600 font-medium text-base">
                                Didn't receive the code? Resend
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="w-full py-3 mt-4"
                            activeOpacity={0.7}
                            onPress={() => router.back()}
                            disabled={isLoading}
                        >
                            <Text className="text-center text-gray-500 font-medium text-base">
                                Back to sign up
                            </Text>
                        </TouchableOpacity>
                    </View>
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
        paddingTop: 60,
        paddingBottom: 40,
    },
});

export default VerifyEmailScreen;