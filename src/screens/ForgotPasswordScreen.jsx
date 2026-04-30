import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthServices from '../../Services/API/AuthServices';
import Toast from 'react-native-toast-message';
import MainLogo from '../../assets/main logo.png';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';

export default function ForgotPasswordScreen({ onBack }) {
    const { t } = useTranslation();
    const [step, setStep] = useState('email'); // 'email' or 'verify'
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const isValidEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const getErrorMessage = (error) => {
        // 1. Check top-level errors array with message object (common in this API)
        const errorFromList = error?.errors?.[0]?.message;
        if (errorFromList) {
            if (typeof errorFromList === 'string') return errorFromList;
            if (typeof errorFromList === 'object') {
                if (errorFromList.non_field_errors?.[0]) return errorFromList.non_field_errors[0];
                const firstKey = Object.keys(errorFromList)[0];
                if (firstKey && Array.isArray(errorFromList[firstKey])) return errorFromList[firstKey][0];
                if (firstKey) return String(errorFromList[firstKey]);
            }
        }

        // 2. Check errorResponse structure
        if (error?.errorResponse?.errors?.[0]?.message) {
            const nestedError = error.errorResponse.errors[0].message;
            return typeof nestedError === 'string' ? nestedError : JSON.stringify(nestedError);
        }

        // 3. Standard fallbacks
        return error?.detail || error?.message || t(tokens.nav.somethingWentWrong);
    };

    const handleSubmitEmail = async () => {
        if (!email.trim()) {
            Toast.show({
                type: 'error',
                text1: t(tokens.nav.enterEmail),
                text2: t(tokens.nav.emailEmpty),
                position: 'top',
            });
            return;
        }

        if (!isValidEmail(email)) {
            Toast.show({
                type: 'error',
                text1: t(tokens.nav.invalidEmail),
                text2: t(tokens.nav.enterValidEmail),
                position: 'top',
            });
            return;
        }

        setLoading(true);
        try {
            const response = await AuthServices.sendForgotOtp({
                email: email,
            });

            // Handle both structure variations
            if (response.message === 'OTP sent to email' || response.status === 'success') {
                Toast.show({
                    type: 'success',
                    text1: t(tokens.nav.otpSent),
                    text2: t(tokens.nav.checkEmailOtp),
                    position: 'top',
                });
                await AsyncStorage.setItem("email", email);
                setStep('verify');
            } else {
                Toast.show({
                    type: 'error',
                    text1: t(tokens.nav.failed),
                    text2: response.message || t(tokens.nav.couldNotSendOtp),
                    position: 'top',
                });
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            Toast.show({
                type: 'error',
                text1: t(tokens.common.error),
                text2: getErrorMessage(error),
                position: 'top',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndReset = async () => {
        if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
            Toast.show({
                type: 'error',
                text1: t(tokens.common.error),
                text2: t(tokens.nav.fillAllFields),
                position: 'top',
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.show({
                type: 'error',
                text1: t(tokens.common.error),
                text2: t(tokens.nav.passwordsNotMatch),
                position: 'top',
            });
            return;
        }

        if (otp.length < 4) {
            Toast.show({
                type: 'error',
                text1: t(tokens.common.error),
                text2: t(tokens.nav.invalidOtp),
                position: 'top',
            });
            return;
        }

        setLoading(true);
        try {
            // Using sendOtp as the primary reset password endpoint for forgot password flow
            const payload = {
                email: email,
                otp: otp,
                password: newPassword
            };

            const response = await AuthServices.sendOtp(payload);

            if (response.status === 'success' || response.message?.toLowerCase().includes('success')) {
                Toast.show({
                    type: 'success',
                    text1: t(tokens.nav.success),
                    text2: t(tokens.nav.passwordChanged),
                    position: 'top',
                });
                // Delay to allow user to see success toast
                setTimeout(() => {
                    onBack(); // Go back to login
                }, 2000);
            } else {
                Toast.show({
                    type: 'error',
                    text1: t(tokens.nav.failed),
                    text2: response.message || t(tokens.nav.invalidOtp),
                    position: 'top',
                });
            }
        } catch (error) {
            console.error('Reset password error:', error);
            Toast.show({
                type: 'error',
                text1: t(tokens.common.error),
                text2: getErrorMessage(error),
                position: 'top',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        try {
            await AuthServices.sendForgotOtp({ email });
            Toast.show({
                type: 'success',
                text1: t(tokens.nav.otpSent),
                text2: t(tokens.nav.checkEmailOtp),
                position: 'top',
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: t(tokens.common.error),
                text2: t(tokens.nav.failedToResend),
                position: 'top',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    <TouchableOpacity 
                        style={styles.backArrow} 
                        onPress={step === 'verify' ? () => setStep('email') : onBack}
                    >
                        <Ionicons name="chevron-back" size={28} color="#000" />
                    </TouchableOpacity>

                    {step === 'email' ? (
                        <>
                            <View style={styles.logoContainer}>
                                <Image
                                    source={MainLogo}
                                    style={styles.mainLogo}
                                    resizeMode="contain"
                                />
                            </View>

                            <View style={styles.headerContainer}>
                                <Text style={styles.title}>{t(tokens.nav.forgotPasswordTitle)}</Text>
                                <Text style={styles.subtitle}>{t(tokens.nav.enterEmailReset)}</Text>
                            </View>

                            <View style={styles.form}>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t(tokens.common.emailPlaceholder)}
                                        placeholderTextColor="#A0A0A0"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        autoCorrect={false}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.button, loading && styles.buttonDisabled]}
                                    onPress={handleSubmitEmail}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.buttonText}>{t(tokens.nav.sendOtp)}</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                                    <Text style={styles.backText}>{t(tokens.nav.backToLogin)}</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={[styles.headerContainer, { marginTop: 20 }]}>
                                <Text style={styles.title}>{t(tokens.nav.forgotPasswordTitle)}</Text>
                            </View>

                            <View style={styles.verifySection}>
                                <Text style={styles.verifyTitle}>{t(tokens.common.verify)}</Text>
                                <Text style={styles.verifySubtitle}>{t(tokens.nav.checkEmailOtp)}</Text>
                            </View>

                            <View style={styles.form}>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t(tokens.common.otpPlaceholder) || "Enter OTP"}
                                        placeholderTextColor="#A0A0A0"
                                        value={otp}
                                        onChangeText={setOtp}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                    />
                                </View>

                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t(tokens.common.newPassword) || "New Password"}
                                        placeholderTextColor="#A0A0A0"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry={!showNewPassword}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity 
                                        onPress={() => setShowNewPassword(!showNewPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        <Ionicons 
                                            name={showNewPassword ? "eye-outline" : "eye-off-outline"} 
                                            size={20} 
                                            color="#8E8E93" 
                                        />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t(tokens.nav.confirmNewPassword) || "Confirm New Password"}
                                        placeholderTextColor="#A0A0A0"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showConfirmPassword}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity 
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        <Ionicons 
                                            name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                                            size={20} 
                                            color="#8E8E93" 
                                        />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.resendContainer}>
                                    <Text style={styles.resendText}>{t(tokens.nav.didNotReceiveCode) || "Didn't Receive a Code ?"}</Text>
                                    <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                                        <Text style={styles.resendLink}>{t(tokens.nav.resendCode) || "Resend Code"}</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={[styles.button, (loading || otp.length < 4) && styles.buttonDisabled]}
                                    onPress={handleVerifyAndReset}
                                    disabled={loading || otp.length < 4}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.buttonText}>{t(tokens.nav.changePassword) || "Change Password"}</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    backArrow: {
        marginTop: Platform.OS === 'ios' ? 10 : 20,
        marginBottom: 20,
        marginLeft: -8,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    mainLogo: {
        width: 120,
        height: 120,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1C1C1E',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        marginTop: 8,
    },
    verifySection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    verifyTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#000',
        marginBottom: 8,
    },
    verifySubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    inputWrapper: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#8EA3E355',
        height: 60,
        marginBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1C1C1E',
        height: '100%',
    },
    eyeIcon: {
        padding: 5,
    },
    resendContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    resendText: {
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '600',
    },
    resendLink: {
        fontSize: 16,
        color: '#2551f0ff',
        fontWeight: '700',
        marginTop: 8,
    },
    button: {
        backgroundColor: '#6C7EE1',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#6C7EE1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: '#A0AEC0',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    backButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    backText: {
        fontSize: 15,
        color: '#8E8E93',
        fontWeight: '600',
    },
});
