import { z } from 'zod';

// Product schemas
export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required').max(255, 'Product name too long'),
    description: z.string().min(1, 'Description is required'),
    shortDescription: z.string().optional(),
    price: z.number().positive('Price must be positive'),
    comparePrice: z.number().positive().optional(),
    costPrice: z.number().positive().optional(),
    sku: z.string().optional(),
    stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    weight: z.number().positive().optional(),
    fabric: z.string().optional(),
    occasion: z.string().optional(),
    designer: z.string().optional(),
    craftType: z.string().optional(),
    region: z.string().optional(),
    careInstructions: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    categoryId: z.number().int().positive('Valid category ID is required'),
    images: z.array(z.object({
      url: z.string().url('Invalid image URL'),
      altText: z.string().optional(),
      isMain: z.boolean().default(false),
      sortOrder: z.number().int().min(0).default(0)
    })).optional(),
    variants: z.array(z.object({
      name: z.string().min(1, 'Variant name is required'),
      value: z.string().min(1, 'Variant value is required'),
      type: z.string().min(1, 'Variant type is required'),
      price: z.number().positive().optional(),
      stock: z.number().int().min(0).default(0),
      sku: z.string().optional(),
      isActive: z.boolean().default(true)
    })).optional(),
    attributes: z.array(z.object({
      name: z.string().min(1, 'Attribute name is required'),
      value: z.string().min(1, 'Attribute value is required')
    })).optional()
  })
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().min(1).optional(),
    shortDescription: z.string().optional(),
    price: z.number().positive().optional(),
    comparePrice: z.number().positive().optional(),
    costPrice: z.number().positive().optional(),
    sku: z.string().optional(),
    stock: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    weight: z.number().positive().optional(),
    fabric: z.string().optional(),
    occasion: z.string().optional(),
    designer: z.string().optional(),
    craftType: z.string().optional(),
    region: z.string().optional(),
    careInstructions: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    categoryId: z.number().int().positive().optional()
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid product ID').transform(Number)
  })
});

// Category schemas
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required').max(255, 'Category name too long'),
    description: z.string().optional(),
    image: z.string().url('Invalid image URL').optional(),
    parentId: z.number().int().positive().optional()
  })
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    image: z.string().url().optional(),
    parentId: z.number().int().positive().optional()
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid category ID').transform(Number)
  })
});

// Query schemas
export const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).catch(1),
    limit: z.string().regex(/^\d+$/).transform(Number).catch(10),
    search: z.string().optional(),
    categoryId: z.string().regex(/^\d+$/).transform(Number).optional(),
    sortBy: z.enum(['name', 'price', 'createdAt']).catch('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).catch('desc'),
    isActive: z.string().transform(val => val === 'true').optional(),
    isFeatured: z.string().transform(val => val === 'true').optional()
  }).partial()
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid ID format').transform(Number)
  })
});

export const slugParamSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'Slug is required')
  })
});

// User authentication schemas (for future implementation)
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    phone: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    dateOfBirth: z.string().datetime().optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
  })
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
export type PaginationQuery = z.infer<typeof paginationSchema>['query'];