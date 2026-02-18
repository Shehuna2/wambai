import axios from 'axios';
import { readToken } from '../storage/local';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api'
});

api.interceptors.request.use(async config => {
  const token = await readToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
