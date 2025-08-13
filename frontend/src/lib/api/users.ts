interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: any;
}

interface User {
  id: number;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'user' | 'admin' | 'staff';
  isActive: boolean;
  dateOfBirth?: string;
  gender?: string;
  preferredOccasions?: string[];
  preferredFabrics?: string[];
  sizePreferences?: {
    top?: string;
    bottom?: string;
    dress?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  orderCount: number;
  totalSpent: number;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'user' | 'admin' | 'staff';
  dateOfBirth?: string;
  gender?: string;
  preferredOccasions?: string[];
  preferredFabrics?: string[];
  sizePreferences?: {
    top?: string;
    bottom?: string;
    dress?: string;
  };
}

interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'user' | 'admin' | 'staff';
  dateOfBirth?: string;
  gender?: string;
  preferredOccasions?: string[];
  preferredFabrics?: string[];
  sizePreferences?: {
    top?: string;
    bottom?: string;
    dress?: string;
  };
}

interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const userService = {
  /**
   * Get all users with filtering and pagination
   */
  async getUsers(filters: UserFilters = {}): Promise<ApiResponse<UsersResponse>> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(
        `${API_BASE_URL}/api/v1/admin/users?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch users');
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch users',
        error
      };
    }
  },

  /**
   * Get a single user by ID
   */
  async getUserById(id: number): Promise<ApiResponse<{ user: User }>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/admin/users/${id}`,
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch user');
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch user',
        error
      };
    }
  },

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserData): Promise<ApiResponse<{ user: User }>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/admin/users`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(userData)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create user');
      }

      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create user',
        error
      };
    }
  },

  /**
   * Update a user
   */
  async updateUser(id: number, userData: UpdateUserData): Promise<ApiResponse<{ user: User }>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/admin/users/${id}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(userData)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update user');
      }

      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update user',
        error
      };
    }
  },

  /**
   * Toggle user status (activate/deactivate)
   */
  async toggleUserStatus(id: number, isActive: boolean): Promise<ApiResponse<{ user: Partial<User> }>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/admin/users/${id}/status`,
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ isActive })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update user status');
      }

      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update user status',
        error
      };
    }
  },

  /**
   * Delete a user (customers only)
   */
  async deleteUser(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/admin/users/${id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete user');
      }

      return {
        success: true,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete user',
        error
      };
    }
  }
};

export type { User, CreateUserData, UpdateUserData, UserFilters, UsersResponse };