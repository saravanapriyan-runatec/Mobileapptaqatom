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
    Dimensions,
} from 'react-native';
import { fetchDomain } from "../../Services/domainService";
import AuthService from '../../Services/AuthService';
import MainLogo from '../../assets/main logo.png';
import { API_URL } from '../utils/config';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';

const { width } = Dimensions.get('window');

export default function OrganizationScreen({ onDomainSelected }) {
    const { t } = useTranslation();
    const [organizationName, setOrganizationName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getBaseDomain = (url) => {
        try {
            const urlArray = url?.split('//');
            let baseHost = urlArray[1] || '';
            if (baseHost.endsWith('/')) {
                baseHost = baseHost.slice(0, -1);
            }
            return baseHost;
        } catch (e) {
            // console.log("Invalid URL:", url);
            return "";
        }
    };

    const handleSubmit = async () => {
        const trimmedOrgName = organizationName.trim();
        if (!trimmedOrgName) {
            setError(t(tokens.organization.pleaseEnterOrganizationName));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const baseDomain = getBaseDomain(API_URL);

            if (!baseDomain) {
                setError(t(tokens.organization.invalidApiConfiguration));
                setLoading(false);
                return;
            }

            // Combine with org name as per user snippet
            const domainname = `${trimmedOrgName}.${baseDomain}`;
            // console.log("Final Domain Construction:", domainname);

            // API Call with FULL domain string
            const res = await fetchDomain({
                domain: domainname,
            });

            // console.log("Domain API Success:", res);

            // Save the short organization name to AsyncStorage
            await AuthService.setDomainName(trimmedOrgName);

            Toast.show({
                type: 'success',
                text1: t(tokens.organization.organizationVerified),
                text2: `${t(tokens.organization.switchedTo)} ${organizationName}`,
                position: 'top',
                visibilityTime: 2000,
            });

            // Notify parent to transition with a 1 second delay so toast is visible
            if (onDomainSelected) {
                setTimeout(() => {
                    Toast.hide();
                    onDomainSelected(trimmedOrgName);
                }, 1000);
            }

        } catch (err) {
            // console.log("Domain API Error:", err);
            const msg = err?.detail || err?.message || "Organization not found";
            Toast.show({
                type: 'error',
                text1: t(tokens.organization.verificationFailed),
                text2: msg,
                position: 'top',
                visibilityTime: 3000,
            });
            setError(msg);
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
                    <View style={styles.logoContainer}>
                        <Image
                            source={MainLogo}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>{t(tokens.organization.switchOrganization)}</Text>
                    </View>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder={t(tokens.organization.organizationPlaceholder)}
                            placeholderTextColor="#A0A0A0"
                            value={organizationName}
                            onChangeText={setOrganizationName}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    {error && <Text style={styles.errorText}>{error}</Text>}

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>{t(tokens.organization.submit)}</Text>
                        )}
                    </TouchableOpacity>
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
        paddingHorizontal: 30,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: width * 0.6,
        height: width * 0.4,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333333',
    },
    inputWrapper: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 5,
        height: 50,
        justifyContent: 'center',
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    input: {
        fontSize: 16,
        color: '#333333',
    },
    errorText: {
        color: '#FF0000',
        marginBottom: 10,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#3B5998',
        height: 50,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
