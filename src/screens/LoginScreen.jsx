import React, { useState, useEffect } from 'react';
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
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthServices from '../../Services/API/AuthServices';
import AuthService from '../../Services/AuthService';
import MainLogo from '../../assets/main logo.png';
import { getUniqueDeviceId } from '../utils/deviceUtils';
import { jwtDecode } from '../utils/auth/jwt/utils';
import { ROLE } from '../utils/auth/jwt/role';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';
import BiometricService from '../../Services/BiometricService';

export default function LoginScreen({ domain, onLoginSuccess, onSwitchOrg, onForgotPassword }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [hasBiometricCredentials, setHasBiometricCredentials] = useState(false);

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    const support = await BiometricService.checkBiometricSupport();
    setIsBiometricSupported(support.supported);

    if (support.supported) {
      const creds = await BiometricService.getCredentials();
      if (creds) {
        setHasBiometricCredentials(true);
        // Auto-prompt on mount
        handleBiometricLogin(creds);
      }
    }
  };

  const handleBiometricLogin = async (credsParam = null) => {
    try {
      const creds = credsParam || await BiometricService.getCredentials();
      if (!creds) return;

      const auth = await BiometricService.authenticate('Log in with Biometrics');
      if (auth.success) {
        // Populate fields for visual feedback
        setEmail(creds.email);
        setPassword(creds.password);
        
        // Directly perform login logic bypassing state batching delays
        performLogin(creds.email, creds.password);
      }
    } catch (error) {
      console.error('Biometric auto-login failed:', error);
    }
  };

  const handleLogin = async () => {
    performLogin(email, password);
  };

  const performLogin = async (userEmail, userPassword) => {
    const trimmedEmail = userEmail.trim();
    const trimmedPassword = userPassword.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Toast.show({
        type: 'error',
        text1: t(tokens.common.required),
        text2: t(tokens.common.enterBothEmailPassword),
        position: 'top'
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Get Device ID and OS
      const deviceId = await getUniqueDeviceId();
      const deviceType = Platform.OS.toUpperCase();

      // 2. Perform Login with updated payload
      const response = await AuthServices.sendSignIn({
        username: trimmedEmail, // Payload uses username as per snippet
        password: trimmedPassword,
        mobile_id: deviceId,
        client_category: deviceType
      });

      // console.log('Login Response:', response);

      // 3. Handle tokens (access and session_token as per snippet)
      const token = response.access || response.access_token;
      const sessionToken = response.session_token;

      if (token) {
        // 4. Decode and Verify Role
        const tokenPayload = jwtDecode(token);
        if (tokenPayload?.role !== ROLE.EMPLOYEE) {
          throw new Error('You do not have permission to access the employee portal.');
        }

        // 5. Persist Authentication
        await AuthService.setAuthToken(token);
        if (sessionToken) {
          await AuthService.setSessionToken(sessionToken);
        }
        await AuthService.setAuth(response);

        // Also set in AsyncStorage for redundancy/compat
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("email", trimmedEmail);

        Toast.show({
          type: 'success',
          text1: t(tokens.common.loginSuccessful),
          text2: t(tokens.common.welcomeBack),
          position: 'top',
          visibilityTime: 2000,
        });

        if (onLoginSuccess) {
          setTimeout(() => {
            Toast.hide();
            onLoginSuccess();
          }, 1000);
        }
      } else {
        Toast.show({
          type: 'error',
          text1: t(tokens.common.loginFailed),
          text2: t(tokens.common.invalidCredentials),
          position: 'top'
        });
      }
    } catch (error) {
      console.error('Login error full details:', JSON.stringify(error, null, 2));

      let errorMessage = 'An error occurred during login';

      // Better error message extraction for nested objects
      const errorMsgObj = error?.errors?.[0]?.message;
      if (errorMsgObj) {
        if (typeof errorMsgObj === 'string') {
          errorMessage = errorMsgObj;
        } else if (errorMsgObj.non_field_errors?.[0]) {
          errorMessage = errorMsgObj.non_field_errors[0];
        } else {
          // Flatten first error key if available (e.g., "username": ["Required"])
          const firstKey = Object.keys(errorMsgObj)[0];
          if (firstKey && Array.isArray(errorMsgObj[firstKey])) {
            errorMessage = `${firstKey}: ${errorMsgObj[firstKey][0]}`;
          } else {
            errorMessage = JSON.stringify(errorMsgObj);
          }
        }
      } else if (error?.detail) {
        errorMessage = error.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Toast.show({
        type: 'error',
        text1: t(tokens.common.error),
        text2: errorMessage,
        position: 'top'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {isBiometricSupported && hasBiometricCredentials && (
        <TouchableOpacity
          style={styles.topRightBiometric}
          onPress={() => handleBiometricLogin()}
          disabled={loading}
        >
          <Ionicons name="finger-print" size={28} color="#3B5998" />
        </TouchableOpacity>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image
              source={MainLogo}
              style={styles.mainLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>{t(tokens.common.welcome)}</Text>
            {domain && (
              <View style={styles.domainIndicator}>
                <Ionicons name="business" size={16} color="#3B5998" />
                <Text style={styles.domainText}>{domain.toUpperCase()}</Text>
              </View>
            )}
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

            <View style={[styles.inputWrapper, styles.passwordWrapper]}>
              <TextInput
                style={styles.input}
                placeholder={t(tokens.common.passwordPlaceholder)}
                placeholderTextColor="#A0A0A0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={isPasswordVisible ? "eye-off" : "eye"}
                  size={20}
                  color="#A0A0A0"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity onPress={onForgotPassword}>
                <Text style={styles.linkText}>{t(tokens.common.forgotPassword)}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onSwitchOrg}>
                <Text style={styles.linkText}>{t(tokens.common.switchOrganization)}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.loginRow}>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>{t(tokens.common.logIn)}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  mainLogo: {
    width: 150,
    height: 150,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 10,
  },
  domainIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  domainText: {
    marginLeft: 8,
    color: '#3B5998',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    height: 55,
    marginBottom: 15,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  eyeIcon: {
    padding: 5,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 5,
  },
  linkText: {
    color: '#3B5998',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    flex: 1,
    backgroundColor: '#3B5998',
    height: 55,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B5998',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  topRightBiometric: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 40, // Responsive top spacing accounting for status bar
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B5998',
    zIndex: 10,
    shadowColor: '#3B5998',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
