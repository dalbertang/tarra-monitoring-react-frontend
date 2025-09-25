import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useMsal } from '@azure/msal-react';
import { silentRequest, createApiTokenRequest } from '../config/authConfig';
import { AccountInfo } from '@azure/msal-browser';

// API Configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  retries: 3,
  retryDelay: 1000,
};

// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: string;
  timestamp?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  has_next: boolean;
  has_prev: boolean;
}

// Create axios instance
const createApiInstance = (token?: string): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  // Request interceptor for logging
  instance.interceptors.request.use(
    (config) => {
      if (import.meta.env.DEV) {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      }
      return config;
    },
    (error) => {
      console.error('API Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      if (import.meta.env.DEV) {
        console.log(`API Response: ${response.status} ${response.config.url}`);
      }
      return response;
    },
    async (error) => {
      const { response, config } = error;
      
      console.error('API Response Error:', {
        status: response?.status,
        url: config?.url,
        message: response?.data?.detail || error.message,
      });

      // Handle specific error cases
      if (response?.status === 401) {
        console.error('Unauthorized - token may be expired or invalid');
      } else if (response?.status === 403) {
        console.error('Forbidden - insufficient permissions');
      } else if (response?.status >= 500) {
        console.error('Server error - backend may be down');
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Custom hook for authenticated API calls
export const useAuthenticatedApi = () => {
  const { instance, accounts } = useMsal();
  
  const getApiClient = async (): Promise<AxiosInstance> => {
    try {
      // Get the active account
      const account: AccountInfo = accounts[0];
      
      if (!account) {
        console.warn('No authenticated account found, creating API client without token');
        return createApiInstance();
      }

      // Try to get access token silently with basic scopes
      const tokenRequest = createApiTokenRequest(account);

      try {
        const response = await instance.acquireTokenSilent(tokenRequest);
        console.log('Successfully acquired token silently');
        console.log('Token scopes:', response.scopes);
        console.log('Token audience:', response.account?.idTokenClaims?.aud);
        console.log('Token first 20 chars:', response.accessToken.substring(0, 20) + '...');
        return createApiInstance(response.accessToken);
      } catch (silentError) {
        console.warn('Silent token acquisition failed, trying interactive:', silentError);
        
        // Fallback: try to get token interactively
        try {
          const response = await instance.acquireTokenPopup(tokenRequest);
          console.log('Successfully acquired token interactively');
          return createApiInstance(response.accessToken);
        } catch (interactiveError) {
          console.error('Interactive token acquisition failed:', interactiveError);
          console.log('Creating API client without token for now');
          // For now, return client without token to test basic connectivity
          return createApiInstance();
        }
      }
    } catch (error) {
      console.error('Failed to get API client:', error);
      // Return client without token to test basic API connectivity
      return createApiInstance();
    }
  };

  return { getApiClient };
};

// Utility functions for common API operations
export const apiUtils = {
  // Handle API errors consistently
  handleApiError: (error: any): string => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return data?.detail || 'Invalid request parameters';
        case 401:
          return 'Authentication required. Please log in again.';
        case 403:
          return 'You do not have permission to access this resource';
        case 404:
          return 'The requested resource was not found';
        case 429:
          return 'Too many requests. Please wait and try again.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return data?.detail || `Server error (${status})`;
      }
    } else if (error.request) {
      // Network error
      return 'Network error. Please check your connection and try again.';
    } else {
      // Other error
      return error.message || 'An unexpected error occurred';
    }
  },

  // Create query string from parameters
  createQueryString: (params: Record<string, any>): string => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (value instanceof Date) {
          searchParams.append(key, value.toISOString());
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
    
    return searchParams.toString();
  },

  // Validate response data
  validateResponse: <T>(response: AxiosResponse, expectedFields?: (keyof T)[]): T => {
    if (!response.data) {
      throw new Error('No data received from server');
    }

    if (expectedFields) {
      const missing = expectedFields.filter(field => !(field in response.data));
      if (missing.length > 0) {
        console.warn('Missing expected fields in response:', missing);
      }
    }

    return response.data;
  },

  // Retry logic for failed requests
  retryRequest: async <T>(
    requestFn: () => Promise<T>,
    maxRetries: number = API_CONFIG.retries,
    delay: number = API_CONFIG.retryDelay
  ): Promise<T> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
          throw error;
        }

        if (attempt < maxRetries) {
          console.log(`Request failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      }
    }

    throw lastError!;
  },
};

// Default API client (unauthenticated)
export const defaultApiClient = createApiInstance();

// Function to upload vibration data
export const uploadVibrationData = async (
  apiClient: AxiosInstance,
  files: File[],
  projects: string[]
): Promise<AxiosResponse<any>> => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file);
  });

  projects.forEach((project) => {
    formData.append('projects', project);
  });

  const config: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };

  return apiClient.post('/api/v1/sensors/upload/vibration-data', formData, config);
};

export const generateVibrationReport = async (apiClient: AxiosInstance, reportParams: { start_date: string, end_date: string, device_ids: string[] }) => {
    const response = await apiClient.post('/api/v1/reports/vibration', reportParams, {
        responseType: 'blob', // Important for handling binary data like PDFs
    });

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'report.pdf';
    if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
        }
    }

    // Create a blob from the response data
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response;
};
