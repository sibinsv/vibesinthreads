export interface Product {
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
  careInstructions?: string;
  metaTitle?: string;
  metaDescription?: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  images: ProductImage[];
  variants?: ProductVariant[];
  attributes?: ProductAttribute[];
}

export interface ProductImage {
  id: number;
  url: string;
  altText?: string;
  isMain: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: number;
  name: string;
  value: string;
  type: string;
  price?: number;
  stock: number;
  isActive: boolean;
}

export interface ProductAttribute {
  id: number;
  name: string;
  value: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number;
  children?: Category[];
  productCount?: number;
}

export interface ApiResponse<T> {
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

export interface ProductFilters {
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