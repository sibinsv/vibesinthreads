import { PrismaClient } from '@prisma/client';
import { ProductService } from '../../../src/services/productService';
import { createTestCategory, createTestProduct, sampleProducts } from '../../helpers/testData';

describe('ProductService', () => {
  let prisma: PrismaClient;
  let productService: ProductService;
  let testCategory: any;

  beforeAll(() => {
    prisma = (global as any).__PRISMA__;
    productService = new ProductService();
  });

  beforeEach(async () => {
    testCategory = await createTestCategory(prisma, { name: 'Test Category', slug: 'test-category' });
  });

  describe('getProductBySlug', () => {
    it('should return product by slug', async () => {
      const product = await createTestProduct(prisma, testCategory.id, sampleProducts[0]);

      const result = await productService.getProductBySlug(product.slug);

      expect(result).not.toBeNull();
      expect(result?.slug).toBe(product.slug);
      expect(result?.name).toBe(product.name);
    });

    it('should return null for non-existent slug', async () => {
      const result = await productService.getProductBySlug('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getProductById', () => {
    it('should return product by id', async () => {
      const product = await createTestProduct(prisma, testCategory.id, sampleProducts[0]);

      const result = await productService.getProductById(product.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(product.id);
      expect(result?.name).toBe(product.name);
    });

    it('should return null for non-existent id', async () => {
      const result = await productService.getProductById(999);

      expect(result).toBeNull();
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Product',
        description: 'New product description',
        price: 149.99,
        stock: 10,
        categoryId: testCategory.id,
        fabric: 'Cotton',
        occasion: 'Casual',
      };

      const result = await productService.createProduct(productData);

      expect(result).toBeDefined();
      expect(result.name).toBe(productData.name);
      expect(result.price).toBe(productData.price);
      expect(result.fabric).toBe(productData.fabric);
      expect(result.category.id).toBe(testCategory.id);
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const product = await createTestProduct(prisma, testCategory.id, sampleProducts[0]);

      const updateData = {
        name: 'Updated Product',
        price: 199.99,
        fabric: 'Silk',
      };

      const result = await productService.updateProduct(product.id, updateData);

      expect(result).toBeDefined();
      expect(result.name).toBe(updateData.name);
      expect(result.price).toBe(updateData.price);
      expect(result.fabric).toBe(updateData.fabric);
    });

    it('should throw error for non-existent product', async () => {
      await expect(
        productService.updateProduct(999, { name: 'Updated' })
      ).rejects.toThrow();
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      const product = await createTestProduct(prisma, testCategory.id, sampleProducts[0]);

      await productService.deleteProduct(product.id);

      // Verify deletion
      const deletedProduct = await prisma.product.findUnique({ where: { id: product.id } });
      expect(deletedProduct).toBeNull();
    });

    it('should throw error for non-existent product', async () => {
      await expect(
        productService.deleteProduct(999)
      ).rejects.toThrow();
    });
  });

  describe('getFeaturedProducts', () => {
    it('should return featured products', async () => {
      await createTestProduct(prisma, testCategory.id, { ...sampleProducts[0], isFeatured: true });
      await createTestProduct(prisma, testCategory.id, { ...sampleProducts[1], isFeatured: false, slug: 'not-featured' });

      const result = await productService.getFeaturedProducts(10);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].isFeatured).toBe(true);
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products from specific category', async () => {
      await createTestProduct(prisma, testCategory.id, sampleProducts[0]);

      const result = await productService.getProductsByCategory(testCategory.slug, 10);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].category.id).toBe(testCategory.id);
    });
  });
});