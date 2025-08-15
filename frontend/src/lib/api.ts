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

export default api;