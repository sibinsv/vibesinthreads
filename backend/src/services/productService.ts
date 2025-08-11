import { prisma } from '../config/database';
import { ProductFilter, PaginationParams, CreateProductData, ProductWithImages } from '../types';
import { sanitizeProductFilter, generateSlug } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';

export class ProductService {
  async getAllProducts(filters: ProductFilter, pagination: PaginationParams) {
    const { page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    const where = sanitizeProductFilter(filters);
    
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true }
          },
          images: {
            orderBy: { sortOrder: 'asc' }
          },
          variants: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' }
          },
          attributes: true
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    return {
      products: products as ProductWithImages[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getProductBySlug(slug: string): Promise<ProductWithImages | null> {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' }
        },
        attributes: true
      }
    });

    return product as ProductWithImages | null;
  }

  async getProductById(id: number): Promise<ProductWithImages | null> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' }
        },
        attributes: true
      }
    });

    return product as ProductWithImages | null;
  }

  async createProduct(data: CreateProductData): Promise<ProductWithImages> {
    const slug = data.slug || generateSlug(data.name);
    
    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug }
    });

    if (existingProduct) {
      throw new AppError('Product with this slug already exists', 409);
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId }
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        slug
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' }
        },
        attributes: true
      }
    });

    return product as ProductWithImages;
  }

  async updateProduct(id: number, data: Partial<CreateProductData>): Promise<ProductWithImages> {
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      throw new AppError('Product not found', 404);
    }

    // Generate new slug if name is being updated
    if (data.name && data.name !== existingProduct.name) {
      data.slug = generateSlug(data.name);
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' }
        },
        attributes: true
      }
    });

    return product as ProductWithImages;
  }

  async deleteProduct(id: number): Promise<void> {
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      throw new AppError('Product not found', 404);
    }

    await prisma.product.delete({
      where: { id }
    });
  }

  async getFeaturedProducts(limit: number = 8): Promise<ProductWithImages[]> {
    const products = await prisma.product.findMany({
      where: {
        isFeatured: true,
        isActive: true
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return products as ProductWithImages[];
  }

  async getProductsByCategory(categorySlug: string, limit: number = 12): Promise<ProductWithImages[]> {
    const products = await prisma.product.findMany({
      where: {
        category: { slug: categorySlug },
        isActive: true
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return products as ProductWithImages[];
  }
}