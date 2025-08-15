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
    await this.deleteCategoryRecursive(id);
  }

  private async deleteCategoryRecursive(id: number): Promise<void> {
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        children: {
          include: {
            children: true,
            _count: {
              select: { products: true }
            }
          }
        },
        _count: {
          select: { products: true }
        }
      }
    });

    if (!existingCategory) {
      throw new AppError('Category not found', 404);
    }

    // Check if this category or any of its descendants have products
    const categoriesWithProducts = await this.getCategoriesWithProducts(id);
    if (categoriesWithProducts.length > 0) {
      const productDetails = categoriesWithProducts
        .map(cat => `"${cat.name}" (ID: ${cat.id}, ${cat.productCount} products)`)
        .join(', ');
      throw new AppError(`Cannot delete category tree - the following categories contain products: ${productDetails}`, 400);
    }

    // Recursively delete all children first
    for (const child of existingCategory.children) {
      await this.deleteCategoryRecursive(child.id);
    }

    // Now delete the parent category
    await prisma.category.delete({
      where: { id }
    });
  }

  private async checkCategoryTreeHasProducts(categoryId: number): Promise<boolean> {
    const categoriesWithProducts = await this.getCategoriesWithProducts(categoryId);
    return categoriesWithProducts.length > 0;
  }

  private async getCategoriesWithProducts(categoryId: number): Promise<{ id: number; name: string; productCount: number }[]> {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        children: {
          select: { id: true, name: true }
        },
        _count: {
          select: { products: true }
        }
      }
    });

    if (!category) return [];

    const result: { id: number; name: string; productCount: number }[] = [];

    // Check if current category has products
    if (category._count.products > 0) {
      result.push({
        id: category.id,
        name: category.name,
        productCount: category._count.products
      });
    }

    // Recursively check all children
    for (const child of category.children) {
      const childResults = await this.getCategoriesWithProducts(child.id);
      result.push(...childResults);
    }

    return result;
  }

  async deleteCategories(ids: number[]): Promise<{ deleted: number; failed: { id: number; reason: string }[]; warnings: string[] }> {
    if (!ids || ids.length === 0) {
      throw new AppError('No category IDs provided', 400);
    }

    const existingCategories = await prisma.category.findMany({
      where: { id: { in: ids } },
      select: { id: true }
    });

    const existingIds = existingCategories.map(c => c.id);
    const nonExistentIds = ids.filter(id => !existingIds.includes(id));
    
    const failed: { id: number; reason: string }[] = [];
    const deletableIds: number[] = [];
    const warnings: string[] = [];

    // Check each category for deletion constraints
    for (const categoryId of existingIds) {
      try {
        // Check if category tree has products
        const categoriesWithProducts = await this.getCategoriesWithProducts(categoryId);
        if (categoriesWithProducts.length > 0) {
          const productDetails = categoriesWithProducts
            .map(cat => `"${cat.name}" (${cat.productCount} products)`)
            .join(', ');
          failed.push({ id: categoryId, reason: `Contains products in: ${productDetails}` });
          continue;
        }

        // Check if category has subcategories (for warning)
        const categoryWithChildren = await prisma.category.findUnique({
          where: { id: categoryId },
          include: {
            children: {
              include: {
                children: true // Get grandchildren too for better warning
              }
            }
          }
        });

        if (categoryWithChildren?.children && categoryWithChildren.children.length > 0) {
          const totalSubcategories = await this.countSubcategoriesRecursive(categoryId);
          warnings.push(`Category ID ${categoryId} will cascade delete ${totalSubcategories} subcategories`);
        }

        deletableIds.push(categoryId);
      } catch (error) {
        failed.push({ id: categoryId, reason: 'Error checking category' });
      }
    }

    // Add non-existent IDs to failed list
    nonExistentIds.forEach(id => {
      failed.push({ id, reason: 'Category not found' });
    });

    let deleted = 0;
    if (deletableIds.length > 0) {
      // Use individual deletions to ensure cascading works properly
      for (const categoryId of deletableIds) {
        try {
          await this.deleteCategoryRecursive(categoryId);
          deleted++;
        } catch (error) {
          failed.push({ id: categoryId, reason: 'Failed to delete' });
        }
      }
    }

    return { deleted, failed, warnings };
  }

  private async countSubcategoriesRecursive(categoryId: number): Promise<number> {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        children: {
          select: { id: true }
        }
      }
    });

    if (!category) return 0;

    let count = category.children.length;
    
    // Recursively count subcategories
    for (const child of category.children) {
      count += await this.countSubcategoriesRecursive(child.id);
    }

    return count;
  }

  async getCategoryDeletionPreview(id: number): Promise<{
    canDelete: boolean;
    subcategories: { id: number; name: string }[];
    categoriesWithProducts: { id: number; name: string; productCount: number }[];
    totalSubcategories: number;
  }> {
    const categoriesWithProducts = await this.getCategoriesWithProducts(id);
    const subcategories = await this.getAllSubcategories(id);
    const totalSubcategories = await this.countSubcategoriesRecursive(id);
    
    return {
      canDelete: categoriesWithProducts.length === 0,
      subcategories,
      categoriesWithProducts,
      totalSubcategories
    };
  }

  private async getAllSubcategories(categoryId: number): Promise<{ id: number; name: string }[]> {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        children: {
          select: { id: true, name: true }
        }
      }
    });

    if (!category) return [];

    const result: { id: number; name: string }[] = [];

    // Add direct children
    result.push(...category.children);

    // Recursively get all descendants
    for (const child of category.children) {
      const descendants = await this.getAllSubcategories(child.id);
      result.push(...descendants);
    }

    return result;
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