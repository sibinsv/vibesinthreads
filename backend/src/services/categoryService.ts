import { prisma } from '../config/database';
import { generateSlug } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';

export interface CreateCategoryData {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  parentId?: number;
}

export interface CategoryWithProducts {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: number | null;
  children?: CategoryWithProducts[];
  productCount?: number;
}

export class CategoryService {
  async getAllCategories(includeChildren: boolean = true): Promise<CategoryWithProducts[]> {
    const categories = await prisma.category.findMany({
      where: { parentId: null }, // Only root categories
      include: {
        children: includeChildren ? {
          include: {
            children: true,
            _count: {
              select: { products: true }
            }
          }
        } : false,
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return categories.map(category => ({
      ...category,
      productCount: category._count.products,
      children: category.children?.map((child: any) => ({
        ...child,
        productCount: (child as any)._count?.products || 0
      }))
    })) as CategoryWithProducts[];
  }

  async getCategoryBySlug(slug: string): Promise<CategoryWithProducts | null> {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          include: {
            _count: {
              select: { products: true }
            }
          }
        },
        parent: true,
        _count: {
          select: { products: true }
        }
      }
    });

    if (!category) return null;

    return {
      ...category,
      productCount: category._count.products,
      children: category.children?.map((child: any) => ({
        ...child,
        productCount: child._count.products
      }))
    } as CategoryWithProducts;
  }

  async getCategoryById(id: number): Promise<CategoryWithProducts | null> {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: {
          include: {
            _count: {
              select: { products: true }
            }
          }
        },
        parent: true,
        _count: {
          select: { products: true }
        }
      }
    });

    if (!category) return null;

    return {
      ...category,
      productCount: category._count.products,
      children: category.children?.map((child: any) => ({
        ...child,
        productCount: child._count.products
      }))
    } as CategoryWithProducts;
  }

  async createCategory(data: CreateCategoryData): Promise<CategoryWithProducts> {
    const slug = data.slug || generateSlug(data.name);
    
    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug }
    });

    if (existingCategory) {
      throw new AppError('Category with this slug already exists', 409);
    }

    // If parentId is provided, check if parent exists
    if (data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: data.parentId }
      });
      if (!parent) {
        throw new AppError('Parent category not found', 404);
      }
    }

    const category = await prisma.category.create({
      data: {
        ...data,
        slug
      },
      include: {
        children: true,
        parent: true,
        _count: {
          select: { products: true }
        }
      }
    });

    return {
      ...category,
      productCount: category._count.products
    } as CategoryWithProducts;
  }

  async updateCategory(id: number, data: Partial<CreateCategoryData>): Promise<CategoryWithProducts> {
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      throw new AppError('Category not found', 404);
    }

    // Generate new slug if name is being updated
    if (data.name && data.name !== existingCategory.name) {
      data.slug = generateSlug(data.name);
    }

    const category = await prisma.category.update({
      where: { id },
      data,
      include: {
        children: true,
        parent: true,
        _count: {
          select: { products: true }
        }
      }
    });

    return {
      ...category,
      productCount: category._count.products
    } as CategoryWithProducts;
  }

  async deleteCategory(id: number): Promise<void> {
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        _count: {
          select: { products: true }
        }
      }
    });

    if (!existingCategory) {
      throw new AppError('Category not found', 404);
    }

    if (existingCategory.children.length > 0) {
      throw new AppError('Cannot delete category with subcategories', 400);
    }

    if (existingCategory._count.products > 0) {
      throw new AppError('Cannot delete category with products', 400);
    }

    await prisma.category.delete({
      where: { id }
    });
  }

  async getMainCategories(): Promise<CategoryWithProducts[]> {
    // Get main Indian ethnic fashion categories
    const mainCategories = await prisma.category.findMany({
      where: {
        name: {
          in: ['Sarees', 'Lehengas', 'Kurtas', 'Anarkalis', 'Indo-Western', 'Accessories']
        }
      },
      include: {
        children: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return mainCategories.map(category => ({
      ...category,
      productCount: category._count.products,
      children: category.children?.map((child: any) => ({
        ...child,
        productCount: 0 // Child count would need separate query
      }))
    })) as CategoryWithProducts[];
  }
}