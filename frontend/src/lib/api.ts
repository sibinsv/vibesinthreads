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
    const response = await api.get(`/products/featured${limit ? `?limit=${limit}` : ''}`);
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
  }
};

export default api;