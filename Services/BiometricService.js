import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BIOMETRIC_CREDENTIALS_KEY = 'taqadom_biometric_credentials';

class BiometricService {
  /**
   * Check if device has biometric hardware and records
   */
  static async checkBiometricSupport() {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) return { supported: false, error: 'Biometric hardware not available' };

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) return { supported: false, error: 'No biometrics enrolled on this device' };

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      let typeName = 'Biometrics';
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        typeName = Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        typeName = Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
      }

      return { supported: true, typeName };
    } catch (error) {
      console.error('Biometric support check error:', error);
      return { supported: false, error: 'Failed to check biometric support' };
    }
  }

  /**
   * Prompt the user for biometric authentication
   */
  static async authenticate(promptMessage = 'Log in with biometrics') {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel',
        disableDeviceFallback: true,
      });

      return result; // { success: boolean, error?: string }
    } catch (error) {
      console.error('Biometric auth error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Save credentials securely to SecureStore
   */
  static async saveCredentials(email, password) {
    try {
      const credentials = JSON.stringify({ email, password });
      await SecureStore.setItemAsync(BIOMETRIC_CREDENTIALS_KEY, credentials);
      return true;
    } catch (error) {
      console.error('SecureStore save error:', error);
      return false;
    }
  }

  /**
   * Retrieve credentials securely from SecureStore
   */
  static async getCredentials() {
    try {
      const credentialsString = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      if (credentialsString) {
        return JSON.parse(credentialsString);
      }
      return null;
    } catch (error) {
      console.error('SecureStore get error:', error);
      return null;
    }
  }

  /**
   * Remove stored credentials (used when user disables biometrics)
   */
  static async clearCredentials() {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      return true;
    } catch (error) {
      console.error('SecureStore delete error:', error);
      return false;
    }
  }
}

export default BiometricService;
