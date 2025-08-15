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

  async deleteProducts(ids: number[]): Promise<{ deleted: number; failed: number[] }> {
    if (!ids || ids.length === 0) {
      throw new AppError('No product IDs provided', 400);
    }

    const existingProducts = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true }
    });

    const existingIds = existingProducts.map(p => p.id);
    const nonExistentIds = ids.filter(id => !existingIds.includes(id));

    if (existingIds.length === 0) {
      throw new AppError('No valid products found to delete', 404);
    }

    const result = await prisma.product.deleteMany({
      where: { id: { in: existingIds } }
    });

    return {
      deleted: result.count,
      failed: nonExistentIds
    };
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

  async addProductImage(productId: number, imageData: {
    url: string;
    altText?: string;
    isMain?: boolean;
    sortOrder?: number;
  }): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true }
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // If this is the main image, set all others to not main
    if (imageData.isMain) {
      await prisma.productImage.updateMany({
        where: { productId },
        data: { isMain: false }
      });
    }

    // Set sort order if not provided
    const sortOrder = imageData.sortOrder ?? product.images.length;

    await prisma.productImage.create({
      data: {
        productId,
        url: imageData.url,
        altText: imageData.altText,
        isMain: imageData.isMain ?? product.images.length === 0, // First image is main by default
        sortOrder
      }
    });
  }

  async removeProductImage(productId: number, imageId: number): Promise<void> {
    const image = await prisma.productImage.findFirst({
      where: { id: imageId, productId }
    });

    if (!image) {
      throw new AppError('Image not found', 404);
    }

    await prisma.productImage.delete({
      where: { id: imageId }
    });

    // If this was the main image, make the first remaining image the main one
    if (image.isMain) {
      const firstImage = await prisma.productImage.findFirst({
        where: { productId },
        orderBy: { sortOrder: 'asc' }
      });

      if (firstImage) {
        await prisma.productImage.update({
          where: { id: firstImage.id },
          data: { isMain: true }
        });
      }
    }
  }

  async updateProductImages(productId: number, images: Array<{
    id?: number;
    url: string;
    altText?: string;
    isMain?: boolean;
    sortOrder: number;
  }>): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true }
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Use transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Delete existing images that are not in the new list
      const newImageIds = images.filter(img => img.id).map(img => img.id!);
      await tx.productImage.deleteMany({
        where: {
          productId,
          id: { notIn: newImageIds }
        }
      });

      // Ensure only one main image
      const mainImages = images.filter(img => img.isMain);
      if (mainImages.length > 1) {
        // Set only the first one as main
        images.forEach((img, index) => {
          img.isMain = index === 0 && mainImages.includes(img);
        });
      } else if (mainImages.length === 0 && images.length > 0) {
        // If no main image specified, make the first one main
        images[0].isMain = true;
      }

      // Update or create images
      for (const imageData of images) {
        if (imageData.id) {
          // Update existing image
          await tx.productImage.update({
            where: { id: imageData.id },
            data: {
              url: imageData.url,
              altText: imageData.altText,
              isMain: imageData.isMain,
              sortOrder: imageData.sortOrder
            }
          });
        } else {
          // Create new image
          await tx.productImage.create({
            data: {
              productId,
              url: imageData.url,
              altText: imageData.altText,
              isMain: imageData.isMain ?? false,
              sortOrder: imageData.sortOrder
            }
          });
        }
      }
    });
  }
}