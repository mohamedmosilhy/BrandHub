import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoSecureStore from 'expo-secure-store';

import type { KeyValueStore, SecureStore } from './ports';

export class ExpoSecureStoreAdapter implements SecureStore {
  get(key: string): Promise<string | null> {
    return ExpoSecureStore.getItemAsync(key);
  }

  async set(key: string, value: string): Promise<void> {
    await ExpoSecureStore.setItemAsync(key, value, {
      keychainAccessible: ExpoSecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }

  delete(key: string): Promise<void> {
    return ExpoSecureStore.deleteItemAsync(key);
  }
}

export class AsyncStorageAdapter implements KeyValueStore {
  get(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  set(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }

  delete(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }
}
