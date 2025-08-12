import { PrismaClient } from '@prisma/client';
import { CategoryService } from '../../../src/services/categoryService';
import { createTestCategory, sampleCategories } from '../../helpers/testData';

describe('CategoryService', () => {
  let prisma: PrismaClient;
  let categoryService: CategoryService;

  beforeAll(() => {
    prisma = global.__PRISMA__;
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
    });

    it('should return empty array when no categories exist', async () => {
      const result = await categoryService.getAllCategories();

      expect(Array.isArray(result)).toBe(true);
    });
  });
});