import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const KEYS = {
  MODE: 'wambai.mode',
  TOKEN: 'wambai.jwt'
};

export const saveMode = (mode: string) => AsyncStorage.setItem(KEYS.MODE, mode);
export const readMode = () => AsyncStorage.getItem(KEYS.MODE);

export const saveToken = (token: string) => SecureStore.setItemAsync(KEYS.TOKEN, token);
export const readToken = () => SecureStore.getItemAsync(KEYS.TOKEN);
export const clearToken = () => SecureStore.deleteItemAsync(KEYS.TOKEN);
