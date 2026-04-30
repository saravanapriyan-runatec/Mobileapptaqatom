// locationUtils.ts
import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';

/**
 * Checks if location permission is already granted.
 */
export async function checkLocationPermission() {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  }
  return true; // fallback for web or non-mobile
}

/**
 * Requests location permission and checks if device location services are enabled.
 */
export async function checkEnableLocation() {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return true;
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Location access is needed.');
      return false;
    }

    const providerStatus = await Location.getProviderStatusAsync();
    if (!providerStatus.locationServicesEnabled) {
      Alert.alert(
        'Location Disabled',
        'Please enable Location in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => Location.openSettings() },
        ]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Location check failed:', error);
    return false;
  }
}