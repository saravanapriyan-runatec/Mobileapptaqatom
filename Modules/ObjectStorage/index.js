import AsyncStorage from '@react-native-async-storage/async-storage';

const _serialize = value => {
  return JSON.stringify(value);
};

const _deSerialize = value => {
  try {
    return JSON.parse(value);
  } catch (e) {
    console.error('Error in Parsing information in Object Store');
    return {};
  }
};

export default {
  async setItem(key, value) {
    if (typeof value !== 'object') {
      return new Error('Error in storing Object: Value should be of JSON');
    }
    return await AsyncStorage.setItem(key, _serialize(value));
  },

  async getItem(key) {
    return _deSerialize((await AsyncStorage.getItem(key)) || '{}');
  },
};
