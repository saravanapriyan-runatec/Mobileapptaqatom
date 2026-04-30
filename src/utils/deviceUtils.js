// // src/utils/deviceUtils.js
// import * as Device from 'expo-device';
// import * as Application from 'expo-application';
// import { Platform } from 'react-native';

// /**
//  * Generates a permanent device ID that survives app uninstall/reinstall
//  * Uses hardware identifiers that remain constant for the device
//  */



// console.log("1111111111111111",Platform);
// console.log("22222222222222222",Device);
// console.log("33333333333333333",Application);

// export const getUniqueDeviceId = async () => {
//   try {
//     let deviceId = null;

//     if (Platform.OS === 'android') {
//       // Android: Use androidId (unique per device, survives reinstall)
//       deviceId = await Application.getAndroidId();
//       console.log("📱 Android Device ID:", deviceId);
//     } else if (Platform.OS === 'ios') {
//       // iOS: Use identifierForVendor (unique per device + vendor combination)
//       // Note: This changes only if all apps from same vendor are uninstalled
//       deviceId = await Application.getIosIdForVendorAsync();
//       console.log("📱 iOS Device ID:", deviceId);
//     }

//     // Fallback: Create composite ID from device info
//     if (!deviceId) {
//       const brand = Device.brand || 'unknown';
//       const model = Device.modelName || 'unknown';
//       const osVersion = Device.osVersion || 'unknown';
//       deviceId = `${brand}-${model}-${osVersion}`.replace(/\s/g, '-');
//       console.log("📱 Fallback Device ID:", deviceId);
//     }

//     return deviceId;
//   } catch (error) {
//     console.error("❌ Error getting device ID:", error);
//     // Last resort fallback
//     return `device-${Platform.OS}-${Date.now()}`;
//   }
// };

// /**
//  * Get detailed device information for debugging
//  */
// export const getDeviceInfo = async () => {
//   const deviceId = await getUniqueDeviceId();
  
//   return {
//     deviceId,
//     platform: Platform.OS,
//     brand: Device.brand,
//     modelName: Device.modelName,
//     osName: Device.osName,
//     osVersion: Device.osVersion,
//     manufacturer: Device.manufacturer,
//     deviceYearClass: Device.deviceYearClass,
//   };
// };






// src/utils/deviceUtils.js
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'UNIQUE_DEVICE_ID';

/**
 * Generates a UUID v4
 */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Generates a permanent device ID that survives app uninstall/reinstall
 * Uses SecureStore (Keychain on iOS) to persist ID across reinstalls
 */
export const getUniqueDeviceId = async () => {
  try {
    // STEP 1: Check if we already have a stored device ID
    let storedId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    
    if (storedId) {
      // console.log("✅ Retrieved stored Device ID:", storedId);
      return storedId;
    }

    // STEP 2: If no stored ID, try to get hardware-based ID
    let deviceId = null;

    if (Platform.OS === 'android') {
      // Android: Use androidId (unique per device, survives reinstall)
      deviceId = await Application.getAndroidId();
      // console.log("📱 Android Device ID (hardware):", deviceId);
    } else if (Platform.OS === 'ios') {
      // iOS: Use identifierForVendor as base
      deviceId = await Application.getIosIdForVendorAsync();
      // console.log("📱 iOS identifierForVendor:", deviceId);
      
      // If identifierForVendor is null or we want extra security,
      // generate a new UUID and store it in Keychain
      if (!deviceId) {
        deviceId = generateUUID();
        // console.log("🆕 Generated new UUID for iOS:", deviceId);
      }
    }

    // STEP 3: Fallback if still no ID
    if (!deviceId) {
      deviceId = generateUUID();
      // console.log("🆕 Generated fallback UUID:", deviceId);
    }

    // STEP 4: Store the device ID in SecureStore (survives uninstall on iOS via Keychain)
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    // console.log("💾 Stored Device ID in SecureStore");

    return deviceId;
  } catch (error) {
    // console.error("❌ Error getting device ID:", error);
    
    // Last resort: generate and try to store
    try {
      const fallbackId = generateUUID();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, fallbackId);
      return fallbackId;
    } catch (storeError) {
      // console.error("❌ Error storing fallback ID:", storeError);
      return `device-${Platform.OS}-${Date.now()}`;
    }
  }
};

/**
 * Get detailed device information for debugging
 */
export const getDeviceInfo = async () => {
  const deviceId = await getUniqueDeviceId();
  
  return {
    deviceId,
    platform: Platform.OS,
    brand: Device.brand,
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
    manufacturer: Device.manufacturer,
    deviceYearClass: Device.deviceYearClass,
  };
};

/**
 * Clear stored device ID (use only for testing/debugging)
 */
export const clearDeviceId = async () => {
  try {
    await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
    // console.log("🗑️ Cleared stored Device ID");
  } catch (error) {
    console.error("❌ Error clearing device ID:", error);
  }
};