import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileServices from '../../Services/API/ProfileServices';
import AuthService from '../../Services/AuthService';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';

const { width, height } = Dimensions.get('window');

export default function ChangePasswordScreen({ onBack }) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [getmail, setGetmail] = useState('');
    const [currentPwdStatus, setCurrentPwdStatus] = useState(null); // 'success', 'wrong', or null

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        const fetchEmail = async () => {
            try {
                const authUserId = await AuthService.getUserId();
                if (authUserId) {
                    const userDetailsData = await ProfileServices.getUserDetailsData(authUserId);
                    const username = userDetailsData?.username;
                    if (username) {
                        const employee = await ProfileServices.getEmployeeDetailsData(username);
                        const empID = employee?.id;
                        if (empID) {
                            const fullDetails = await ProfileServices.getEmployeeFullDetails(empID);
                            if (fullDetails?.email) {
                                setGetmail(fullDetails.email);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching email for password reset:', error);
            }
        };
        fetchEmail();
    }, []);

    const handleCurrentPwdChange = (text) => {
        setPasswords({ ...passwords, current: text });
        if (currentPwdStatus) setCurrentPwdStatus(null);
    };

    const handleUpdatePassword = async () => {
        if (!passwords.current || !passwords.new || !passwords.confirm) {
            Toast.show({ type: 'error', text1: t(tokens.common.error), text2: t(tokens.nav.fillAllFields) });
            return;
        }

        if (passwords.new !== passwords.confirm) {
            Toast.show({ type: 'error', text1: t(tokens.common.error), text2: t(tokens.nav.passwordsNotMatch) });
            return;
        }

        try {
            setLoading(true);
            setCurrentPwdStatus(null);
            const payload = {
                email: getmail,
                old_password: passwords.current,
                new_password: passwords.new,
                confirm_password: passwords.confirm
            };

            await ProfileServices.resetPassword(payload);

            setCurrentPwdStatus('success');
            Toast.show({
                type: 'success',
                text1: t(tokens.nav.success),
                text2: t(tokens.nav.passwordChanged),
                position: 'top',
                visibilityTime: 1000,
                autoHide: true,
            });

            setPasswords({ current: '', new: '', confirm: '' });
            setTimeout(() => {
                Toast.hide();
                if (onBack) onBack();
            }, 1000);


        } catch (error) {
            console.error('Password Reset Error:', JSON.stringify(error, null, 2));

            let errorMessage = 'An error occurred during password reset';
            
            // Extract error message from nested structure
            // 1. Check top-level errors array (found in user's log)
            const errorFromList = error?.errors?.[0]?.message;
            
            if (errorFromList) {
                if (typeof errorFromList === 'string') {
                    errorMessage = errorFromList;
                } else if (typeof errorFromList === 'object') {
                    // It's an object, check for non_field_errors or extract first key
                    if (errorFromList.non_field_errors?.[0]) {
                        errorMessage = errorFromList.non_field_errors[0];
                    } else {
                        const firstKey = Object.keys(errorFromList)[0];
                        if (firstKey && Array.isArray(errorFromList[firstKey])) {
                            errorMessage = `${errorFromList[firstKey][0]}`;
                        } else if (firstKey) {
                            errorMessage = `${errorFromList[firstKey]}`;
                        }
                    }
                }
            } 
            // 2. Check errorResponse (found in user's log)
            else if (error?.errorResponse?.errors?.[0]?.message) {
                const nestedError = error.errorResponse.errors[0].message;
                errorMessage = typeof nestedError === 'string' ? nestedError : JSON.stringify(nestedError);
            }
            // 3. Check common detail field
            else if (error?.detail) {
                errorMessage = error.detail;
            } 
            // 4. Check standard message field
            else if (error?.message) {
                errorMessage = error.message;
            }

            // If the error is about the current/old password, show "Wrong" in the UI
            const lowerError = errorMessage.toLowerCase();
            const isOldPwdError = lowerError.includes('old') || lowerError.includes('current') || lowerError.includes('incorrect');

            if (isOldPwdError) {
                setCurrentPwdStatus('wrong');
                Toast.show({
                    type: 'error',
                    text1: t(tokens.nav.verificationFailed),
                    text2: errorMessage
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: t(tokens.nav.failed),
                    text2: errorMessage
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = passwords.current.length >= 1 &&
        passwords.new.length >= 1 &&
        passwords.new === passwords.confirm;

    return (
        <View style={styles.container}>
             <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
            <LinearGradient
                colors={['#8EA3E3', '#FFFFFF']}
                locations={[0, 0.3]}
                style={styles.background}
            />
<View style={{minHeight:Dimensions.get('window').height}}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={15}>
                    <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t(tokens.nav.updatePassword)}</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Unified Password Settings Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{t(tokens.nav.passwordSettings)}</Text>

                    {/* Current Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t(tokens.nav.currentPassword)}</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                secureTextEntry={!showCurrent}
                                // placeholder={t(tokens.nav.enterEmail)}
                                placeholderTextColor="#C7C7CC"
                                value={passwords.current}
                                onChangeText={handleCurrentPwdChange}
                            />
                            <TouchableOpacity 
                                onPress={() => setShowCurrent(!showCurrent)} 
                                style={styles.eyeIcon}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons 
                                    name={showCurrent ? "eye-off" : "eye"} 
                                    size={20} 
                                    color="#8E8E93" 
                                />
                            </TouchableOpacity>
                        </View>
                        {currentPwdStatus === 'success' && <Text style={styles.successFieldText}>Success</Text>}
                        {currentPwdStatus === 'wrong' && <Text style={styles.errorFieldText}>Wrong</Text>}
                    </View>

                    {/* New Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t(tokens.common.newPassword)}</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                secureTextEntry={!showNew}
                                placeholder=""
                                placeholderTextColor="#C7C7CC"
                                value={passwords.new}
                                onChangeText={(text) => setPasswords({ ...passwords, new: text })}
                            />
                            <TouchableOpacity 
                                onPress={() => setShowNew(!showNew)} 
                                style={styles.eyeIcon}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons 
                                    name={showNew ? "eye-off" : "eye"} 
                                    size={20} 
                                    color="#8E8E93" 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Confirm Password */}
                    <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                        <Text style={styles.inputLabel}>{t(tokens.nav.confirmNewPassword)}</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                secureTextEntry={!showConfirm}
                                placeholder=""
                                placeholderTextColor="#C7C7CC"
                                value={passwords.confirm}
                                onChangeText={(text) => setPasswords({ ...passwords, confirm: text })}
                            />
                            <TouchableOpacity 
                                onPress={() => setShowConfirm(!showConfirm)} 
                                style={styles.eyeIcon}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons 
                                    name={showConfirm ? "eye-off" : "eye"} 
                                    size={20} 
                                    color="#8E8E93" 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Button */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity
                    style={[
                        styles.updateButton,
                        (loading || !isFormValid) && styles.disabledButton
                    ]}
                    onPress={handleUpdatePassword}
                    disabled={loading || !isFormValid}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <Text style={styles.updateButtonText}>{t(tokens.nav.updatePassword)}</Text>
                    )}
                </TouchableOpacity>
            </View>
            </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    background: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: height,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    backButton: {
        padding: 4,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#Eff0f3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        color: '#8E8E93',
        marginBottom: 8,
        fontWeight: '500',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 10,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#1C1C1E',
        backgroundColor: '#F9F9F9',
    },
    eyeIcon: {
        position: 'absolute',
        right: 12,
        height: '100%',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    successFieldText: {
        color: '#34C759',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 6,
        marginLeft: 4,
    },
    errorFieldText: {
        color: '#FF3B30',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 6,
        marginLeft: 4,
    },
    footer: {
        paddingHorizontal: 16,
        paddingTop: 10,
        backgroundColor: 'transparent',
    },
    updateButton: {
        backgroundColor: '#2551f0ff',
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2551f0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        opacity: 0.5,
        backgroundColor: '#A0AEC0',
    },
    updateButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
