import { ApiResponse } from '../types';

export const createApiResponse = <T>(
  success: boolean,
  data?: T,
  message?: string,
  error?: string,
  meta?: any
): ApiResponse<T> => {
  return {
    success,
    data,
    message,
    error,
    meta,
  };
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const calculatePagination = (page: number = 1, limit: number = 10, total: number) => {
  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    offset,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

export const sanitizeProductFilter = (filter: any) => {
  const sanitized: any = {};
  
  if (filter.category) sanitized.category = { slug: filter.category };
  if (filter.minPrice || filter.maxPrice) {
    sanitized.price = {};
    if (filter.minPrice) sanitized.price.gte = parseFloat(filter.minPrice);
    if (filter.maxPrice) sanitized.price.lte = parseFloat(filter.maxPrice);
  }
  // SQLite doesn't support case insensitive search with mode, use direct contains
  if (filter.fabric) sanitized.fabric = { contains: filter.fabric };
  if (filter.occasion) sanitized.occasion = { contains: filter.occasion };
  if (filter.designer) sanitized.designer = { contains: filter.designer };
  if (filter.craftType) sanitized.craftType = { contains: filter.craftType };
  if (filter.region) sanitized.region = { contains: filter.region };
  if (filter.search) {
    sanitized.OR = [
      { name: { contains: filter.search } },
      { description: { contains: filter.search } },
      { shortDescription: { contains: filter.search } },
    ];
  }
  if (filter.isActive !== undefined) sanitized.isActive = filter.isActive === 'true';
  if (filter.isFeatured !== undefined) sanitized.isFeatured = filter.isFeatured === 'true';
  
  return sanitized;
};