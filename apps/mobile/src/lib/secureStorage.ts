import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

/** Secure storage on native; localStorage on web (SecureStore is unavailable there). */
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key)
      } catch {
        return null
      }
    }
    return SecureStore.getItemAsync(key)
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value)
      } catch {
        // ignore quota / private mode
      }
      return
    }
    await SecureStore.setItemAsync(key, value)
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key)
      } catch {
        // ignore
      }
      return
    }
    await SecureStore.deleteItemAsync(key)
  },
}
