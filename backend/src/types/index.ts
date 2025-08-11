export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  fabric?: string;
  occasion?: string;
  designer?: string;
  craftType?: string;
  region?: string;
  search?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductWithImages {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  fabric?: string;
  occasion?: string;
  designer?: string;
  craftType?: string;
  region?: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  images: Array<{
    id: number;
    url: string;
    altText?: string;
    isMain: boolean;
    sortOrder: number;
  }>;
  variants?: Array<{
    id: number;
    name: string;
    value: string;
    type: string;
    price?: number;
    stock: number;
  }>;
  attributes?: Array<{
    id: number;
    name: string;
    value: string;
  }>;
}

export interface CreateProductData {
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  stock: number;
  categoryId: number;
  fabric?: string;
  occasion?: string;
  designer?: string;
  craftType?: string;
  region?: string;
  careInstructions?: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}