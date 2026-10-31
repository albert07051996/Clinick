import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { ApiResponse } from '../../types';

// Fallback must match launchSettings.json's Kestrel port (5255).
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5255/api';

export class ApiClient {
  private static instance: AxiosInstance | null = null;

  static getInstance(): AxiosInstance {
    if (!this.instance) {
      this.instance = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      this.instance.interceptors.request.use((config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });

      this.instance.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
          if (error.response?.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      );
    }
    return this.instance;
  }

  static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.getInstance().get<ApiResponse<T>>(endpoint);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.getInstance().post<ApiResponse<T>>(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.getInstance().put<ApiResponse<T>>(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.getInstance().patch<ApiResponse<T>>(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.getInstance().delete<ApiResponse<T>>(endpoint);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private static handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || error.message;
      return new Error(message);
    }
    return error;
  }
}
