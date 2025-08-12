import { PrismaClient } from '@prisma/client';
import * as productService from '../../../src/services/productService';
import { createTestCategory, createTestProduct, sampleProducts } from '../../helpers/testData';

describe('ProductService', () => {
  let prisma: PrismaClient;
  let testCategory: any;

  beforeAll(() => {
    prisma = global.__PRISMA__;
  });

  beforeEach(async () => {
    testCategory = await createTestCategory(prisma, { name: 'Test Category', slug: 'test-category' });
  });

  describe('getAllProducts', () => {
    it('should return paginated products', async () => {
      // Create test products
      await createTestProduct(prisma, testCategory.id, sampleProducts[0]);
      await createTestProduct(prisma, testCategory.id, sampleProducts[1]);

      const result = await productService.getAllProducts({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data?.products).toHaveLength(2);
      expect(result.data?.pagination.total).toBe(2);
      expect(result.data?.pagination.page).toBe(1);
      expect(result.data?.pagination.pages).toBe(1);
    });

    it('should filter by search term', async () => {
      await createTestProduct(prisma, testCategory.id, sampleProducts[0]); // Elegant Saree
      await createTestProduct(prisma, testCategory.id, sampleProducts[1]); // Casual Kurta

      const result = await productService.getAllProducts({ page: 1, limit: 10, search: 'Elegant' });

      expect(result.success).toBe(true);
      expect(result.data?.products).toHaveLength(1);
      expect(result.data?.products[0].name).toBe('Elegant Saree');
    });

    it('should filter by category', async () => {
      const category2 = await createTestCategory(prisma, { name: 'Category 2', slug: 'category-2' });
      
      await createTestProduct(prisma, testCategory.id, sampleProducts[0]);
      await createTestProduct(prisma, category2.id, sampleProducts[1]);

      const result = await productService.getAllProducts({ page: 1, limit: 10, categoryId: testCategory.id });

      expect(result.success).toBe(true);
      expect(result.data?.products).toHaveLength(1);
      expect(result.data?.products[0].categoryId).toBe(testCategory.id);
    });

    it('should filter by active status', async () => {
      await createTestProduct(prisma, testCategory.id, { ...sampleProducts[0], isActive: true });
      await createTestProduct(prisma, testCategory.id, { ...sampleProducts[1], isActive: false, slug: 'inactive-product' });

      const result = await productService.getAllProducts({ page: 1, limit: 10, isActive: true });

      expect(result.success).toBe(true);
      expect(result.data?.products).toHaveLength(1);
      expect(result.data?.products[0].isActive).toBe(true);
    });

    it('should sort products correctly', async () => {
      await createTestProduct(prisma, testCategory.id, { ...sampleProducts[0], price: 100 });
      await createTestProduct(prisma, testCategory.id, { ...sampleProducts[1], price: 200, slug: 'expensive-product' });

      const result = await productService.getAllProducts({ 
        page: 1, 
        limit: 10, 
        sortBy: 'price', 
        sortOrder: 'asc' 
      });

      expect(result.success).toBe(true);
      expect(result.data?.products).toHaveLength(2);
      expect(result.data?.products[0].price).toBe(100);
      expect(result.data?.products[1].price).toBe(200);
    });
  });

  describe('getProductBySlug', () => {
    it('should return product by slug with related data', async () => {
      const product = await createTestProduct(prisma, testCategory.id, sampleProducts[0]);

      const result = await productService.getProductBySlug(product.slug);

      expect(result.success).toBe(true);
      expect(result.data?.slug).toBe(product.slug);
      expect(result.data?.category).toBeDefined();
      expect(result.data?.images).toBeDefined();
      expect(result.data?.variants).toBeDefined();
      expect(result.data?.attributes).toBeDefined();
    });

    it('should return error for non-existent slug', async () => {
      const result = await productService.getProductBySlug('non-existent');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Product not found');
    });
  });

  describe('getProductById', () => {
    it('should return product by id', async () => {
      const product = await createTestProduct(prisma, testCategory.id, sampleProducts[0]);

      const result = await productService.getProductById(product.id);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(product.id);
      expect(result.data?.category).toBeDefined();
    });

    it('should return error for non-existent id', async () => {
      const result = await productService.getProductById(999);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Product not found');
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Product',
        description: 'New product description',
        price: 149.99,
        categoryId: testCategory.id,
        fabric: 'Cotton',
        occasion: 'Casual',
      };

      const result = await productService.createProduct(productData);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(productData.name);
      expect(result.data?.slug).toBe('new-product');
      expect(result.data?.price).toBe(productData.price);
      expect(result.data?.fabric).toBe(productData.fabric);
    });

    it('should create product with images and variants', async () => {
      const productData = {
        name: 'Product with Variants',
        description: 'Product description',
        price: 199.99,
        categoryId: testCategory.id,
        images: [
          { url: 'https://example.com/image1.jpg', altText: 'Image 1', isMain: true },
          { url: 'https://example.com/image2.jpg', altText: 'Image 2' },
        ],
        variants: [
          { name: 'Size', value: 'M', type: 'size', stock: 5 },
          { name: 'Color', value: 'Red', type: 'color', stock: 3 },
        ],
        attributes: [
          { name: 'Material', value: 'Cotton' },
          { name: 'Care', value: 'Machine Wash' },
        ],
      };

      const result = await productService.createProduct(productData);

      expect(result.success).toBe(true);
      expect(result.data?.images).toHaveLength(2);
      expect(result.data?.variants).toHaveLength(2);
      expect(result.data?.attributes).toHaveLength(2);
    });

    it('should handle duplicate slug by appending number', async () => {
      await createTestProduct(prisma, testCategory.id, { name: 'Test', slug: 'test' });

      const productData = {
        name: 'Test',
        description: 'Test description',
        price: 99.99,
        categoryId: testCategory.id,
      };

      const result = await productService.createProduct(productData);

      expect(result.success).toBe(true);
      expect(result.data?.slug).toMatch(/^test-\d+$/);
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

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(updateData.name);
      expect(result.data?.price).toBe(updateData.price);
      expect(result.data?.fabric).toBe(updateData.fabric);
    });

    it('should return error for non-existent product', async () => {
      const result = await productService.updateProduct(999, { name: 'Updated' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Product not found');
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      const product = await createTestProduct(prisma, testCategory.id, sampleProducts[0]);

      const result = await productService.deleteProduct(product.id);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Product deleted successfully');

      // Verify deletion
      const deletedProduct = await prisma.product.findUnique({ where: { id: product.id } });
      expect(deletedProduct).toBeNull();
    });

    it('should return error for non-existent product', async () => {
      const result = await productService.deleteProduct(999);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Product not found');
    });
  });

  describe('getFeaturedProducts', () => {
    it('should return only featured products', async () => {
      await createTestProduct(prisma, testCategory.id, { ...sampleProducts[0], isFeatured: true });
      await createTestProduct(prisma, testCategory.id, { ...sampleProducts[1], isFeatured: false, slug: 'not-featured' });

      const result = await productService.getFeaturedProducts({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data?.products).toHaveLength(1);
      expect(result.data?.products[0].isFeatured).toBe(true);
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products from specific category', async () => {
      const category2 = await createTestCategory(prisma, { name: 'Category 2', slug: 'category-2' });
      
      await createTestProduct(prisma, testCategory.id, sampleProducts[0]);
      await createTestProduct(prisma, category2.id, sampleProducts[1]);

      const result = await productService.getProductsByCategory(testCategory.slug, { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data?.products).toHaveLength(1);
      expect(result.data?.products[0].categoryId).toBe(testCategory.id);
    });

    it('should return error for non-existent category', async () => {
      const result = await productService.getProductsByCategory('non-existent', { page: 1, limit: 10 });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Category not found');
    });
  });
});