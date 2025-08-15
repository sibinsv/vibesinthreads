import axios from 'axios';
import { Product, Category, ApiResponse, ProductFilters, PaginationParams } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor to handle errors consistently
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data) {
      // If the backend returns an error response with data, preserve it
      const errorData = error.response.data;
      const enhancedError = new Error(errorData.error || errorData.message || 'An error occurred');
      (enhancedError as any).response = error.response;
      (enhancedError as any).backendError = errorData;
      throw enhancedError;
    }
    
    // For network errors or other issues, create a descriptive message
    const networkError = new Error(
      error.code === 'ECONNREFUSED' || error.message.includes('Network Error')
        ? 'Unable to connect to server. Please check if the backend is running.'
        : error.message || 'An unexpected error occurred'
    );
    (networkError as any).isNetworkError = true;
    throw networkError;
  }
);

// Products API
export const productsApi = {
  getAll: async (filters?: ProductFilters, pagination?: PaginationParams): Promise<ApiResponse<Product[]>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    if (pagination) {
      Object.entries(pagination).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await api.get(`/products?${params.toString()}`);
    return response.data;
  },

  getBySlug: async (slug: string): Promise<ApiResponse<Product>> => {
    const response = await api.get(`/products/slug/${slug}`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Product>> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getFeatured: async (limit?: number): Promise<ApiResponse<Product[]>> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get(`/products/featured${params}`);
    return response.data;
  },

  getByCategory: async (categorySlug: string, limit?: number): Promise<ApiResponse<Product[]>> => {
    const response = await api.get(`/products/category/${categorySlug}${limit ? `?limit=${limit}` : ''}`);
    return response.data;
  },

  create: async (data: any): Promise<ApiResponse<Product>> => {
    const response = await api.post('/products', data);
    return response.data;
  },

  update: async (id: number, data: any): Promise<ApiResponse<Product>> => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  deleteMultiple: async (ids: number[]): Promise<ApiResponse<{ deleted: number; failed: number[] }>> => {
    const response = await api.post('/products/bulk/delete', { ids });
    return response.data;
  }
};

// Categories API
export const categoriesApi = {
  getAll: async (includeChildren: boolean = true): Promise<ApiResponse<Category[]>> => {
    const response = await api.get(`/categories?includeChildren=${includeChildren}`);
    return response.data;
  },

  getBySlug: async (slug: string): Promise<ApiResponse<Category>> => {
    const response = await api.get(`/categories/slug/${slug}`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Category>> => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  getMain: async (): Promise<ApiResponse<Category[]>> => {
    const response = await api.get('/categories/main');
    return response.data;
  },

  create: async (data: any): Promise<ApiResponse<Category>> => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  update: async (id: number, data: any): Promise<ApiResponse<Category>> => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },

  deleteMultiple: async (ids: number[]): Promise<ApiResponse<{ deleted: number; failed: { id: number; reason: string }[]; warnings: string[] }>> => {
    const response = await api.post('/categories/bulk/delete', { ids });
    return response.data;
  }
};

// Auth API
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
    refreshToken: string;
  };
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  adminLogin: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/admin/login', credentials);
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};

// Upload API
export const uploadApi = {
  uploadImage: async (file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      // Use fetch for file uploads to avoid axios issues with FormData
      const response = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type header, let browser set it with boundary
          ...(typeof window !== 'undefined' && localStorage.getItem('authToken') && {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          })
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch {
          // If not JSON, use the raw text or status message
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Upload API Error:', error);
      
      // Return a properly formatted error response
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed - please check if the server is running',
        data: null
      };
    }
  },

  uploadImages: async (files: File[]): Promise<ApiResponse<any[]>> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/upload/images`, {
        method: 'POST',
        body: formData,
        headers: {
          ...(typeof window !== 'undefined' && localStorage.getItem('authToken') && {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          })
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Upload Images API Error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch upload failed - please check if the server is running',
        data: null
      };
    }
  }
};

// Utility function to extract meaningful error messages for admin users
export const getAdminErrorMessage = (errorOrResponse: any): string => {
  // Handle case where this is called with an API response object (not an error)
  if (errorOrResponse && typeof errorOrResponse === 'object' && 'success' in errorOrResponse) {
    // This is an API response object, extract error information
    return errorOrResponse.error || errorOrResponse.message || 'Operation failed';
  }
  
  // Check if it's a backend error with specific details
  if (errorOrResponse.backendError) {
    const backendError = errorOrResponse.backendError;
    
    // If there's an error field with details, use it
    if (backendError.error) {
      return backendError.error;
    }
    
    // If there's a message field, use it
    if (backendError.message) {
      return backendError.message;
    }
  }
  
  // Check if it's a network error
  if (errorOrResponse.isNetworkError) {
    return errorOrResponse.message;
  }
  
  // For axios errors, try to extract meaningful information
  if (errorOrResponse.response) {
    const status = errorOrResponse.response.status;
    const statusText = errorOrResponse.response.statusText;
    
    // Common HTTP error codes with admin-friendly messages
    switch (status) {
      case 400:
        return `Bad Request: ${errorOrResponse.message || 'Invalid data provided'}`;
      case 401:
        return 'Authentication required. Please login again.';
      case 403:
        return 'Access denied. Insufficient permissions.';
      case 404:
        return 'Resource not found. The item may have been deleted.';
      case 409:
        return `Conflict: ${errorOrResponse.message || 'Resource already exists or has conflicts'}`;
      case 422:
        return `Validation Error: ${errorOrResponse.message || 'Invalid data provided'}`;
      case 500:
        return `Server Error: ${errorOrResponse.message || 'Internal server error occurred'}`;
      default:
        return `HTTP ${status}: ${errorOrResponse.message || statusText || 'Unknown error'}`;
    }
  }
  
  // Fallback to the error message or a generic message
  return errorOrResponse.message || 'An unexpected error occurred. Please try again or contact support.';
};

export default api;