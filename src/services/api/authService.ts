import { ApiClient } from './apiClient';
import type { LoginRequest, LoginResponse, User, RegisterRequest } from '../../types';

export const authService = {
  login: async (request: LoginRequest): Promise<LoginResponse> => {
    const response = await ApiClient.post<LoginResponse>('/v1/auth/login', request);
    if (response.data) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data!;
  },

  register: async (request: RegisterRequest): Promise<User> => {
    const response = await ApiClient.post<User>('/v1/auth/register', request);
    return response.data!;
  },

  logout: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('accessToken');
  },

  refreshToken: async (): Promise<string> => {
    const response = await ApiClient.post<LoginResponse>('/v1/auth/refresh-token', {
      refreshToken: localStorage.getItem('refreshToken'),
    });
    if (response.data) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }
    return response.data?.accessToken || '';
  },

  /** Signs in or signs up via a verified Google ID token.
      The token comes from Google's Identity Services SDK callback. */
  googleLogin: async (idToken: string): Promise<LoginResponse> => {
    const response = await ApiClient.post<LoginResponse>('/v1/auth/google', { idToken });
    if (response.data) {
      localStorage.setItem('accessToken',  response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data!;
  },

  /** Starts the password-reset flow. The backend always answers OK (silent)
      to avoid exposing which emails are registered. */
  forgotPassword: async (email: string): Promise<void> => {
    await ApiClient.post<boolean>('/v1/auth/forgot-password', { email });
  },

  /** Completes the password-reset using the 4-digit code the user received. */
  resetPassword: async (email: string, code: string, newPassword: string): Promise<void> => {
    await ApiClient.post<boolean>('/v1/auth/reset-password', { email, code, newPassword });
  },
};
