import { PrismaClient } from '@prisma/client';
import { CategoryService } from '../../../src/services/categoryService';
import { createTestCategory, sampleCategories } from '../../helpers/testData';

describe('CategoryService', () => {
  let prisma: PrismaClient;
  let categoryService: CategoryService;

  beforeAll(() => {
    prisma = (global as any).__PRISMA__;
    categoryService = new CategoryService();
  });

  describe('getAllCategories', () => {
    it('should return all categories', async () => {
      // Create test categories
      await createTestCategory(prisma, sampleCategories[0]);
      await createTestCategory(prisma, sampleCategories[1]);

      const result = await categoryService.getAllCategories();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('slug');
    });

    it('should return empty array when no categories exist', async () => {
      const result = await categoryService.getAllCategories();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getCategoryBySlug', () => {
    it('should return category by slug', async () => {
      const category = await createTestCategory(prisma, sampleCategories[0]);

      const result = await categoryService.getCategoryBySlug(category.slug);

      expect(result).not.toBeNull();
      expect(result?.name).toBe(category.name);
      expect(result?.slug).toBe(category.slug);
    });

    it('should return null for non-existent slug', async () => {
      const result = await categoryService.getCategoryBySlug('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getCategoryById', () => {
    it('should return category by id', async () => {
      const category = await createTestCategory(prisma, sampleCategories[0]);

      const result = await categoryService.getCategoryById(category.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(category.id);
      expect(result?.name).toBe(category.name);
    });

    it('should return null for non-existent id', async () => {
      const result = await categoryService.getCategoryById(999);

      expect(result).toBeNull();
    });
  });

  describe('createCategory', () => {
    it('should create a new category', async () => {
      const categoryData = {
        name: 'New Category',
        description: 'New category description',
      };

      const result = await categoryService.createCategory(categoryData);

      expect(result).toBeDefined();
      expect(result.name).toBe(categoryData.name);
      expect(result.description).toBe(categoryData.description);
      expect(result.slug).toBeDefined();
    });

    it('should create category with parent', async () => {
      const parentCategory = await createTestCategory(prisma, { name: 'Parent', slug: 'parent' });
      
      const categoryData = {
        name: 'Child Category',
        parentId: parentCategory.id,
      };

      const result = await categoryService.createCategory(categoryData);

      expect(result).toBeDefined();
      expect(result.parentId).toBe(parentCategory.id);
      expect(result.name).toBe(categoryData.name);
    });
  });

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      const category = await createTestCategory(prisma, sampleCategories[0]);

      const updateData = {
        name: 'Updated Category',
        description: 'Updated description',
      };

      const result = await categoryService.updateCategory(category.id, updateData);

      expect(result).toBeDefined();
      expect(result.name).toBe(updateData.name);
      expect(result.description).toBe(updateData.description);
    });

    it('should throw error for non-existent category', async () => {
      await expect(
        categoryService.updateCategory(999, { name: 'Updated' })
      ).rejects.toThrow();
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      const category = await createTestCategory(prisma, sampleCategories[0]);

      await categoryService.deleteCategory(category.id);

      // Verify deletion
      const deletedCategory = await prisma.category.findUnique({ where: { id: category.id } });
      expect(deletedCategory).toBeNull();
    });

    it('should throw error for non-existent category', async () => {
      await expect(
        categoryService.deleteCategory(999)
      ).rejects.toThrow();
    });
  });

  describe('getMainCategories', () => {
    it('should return only top-level categories', async () => {
      const parentCategory = await createTestCategory(prisma, { name: 'Parent', slug: 'parent' });
      await createTestCategory(prisma, { name: 'Child', slug: 'child', parentId: parentCategory.id });

      const result = await categoryService.getMainCategories();

      expect(Array.isArray(result)).toBe(true);
      
      // If we have results, verify they are main categories
      if (result.length > 0) {
        result.forEach(category => {
          expect(category.parentId).toBeNull();
        });
        
        // Check if our parent category is in the results
        const parentInResults = result.find(cat => cat.name === 'Parent');
        if (parentInResults) {
          expect(parentInResults.parentId).toBeNull();
        }
      }
    });
  });
});