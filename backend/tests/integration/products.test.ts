import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import productRoutes from '../../src/routes/productRoutes';
import { errorHandler } from '../../src/middleware/errorHandler';
import { createTestCategory, createTestProduct, createTestUser, generateJWTToken, sampleProducts } from '../helpers/testData';

const app = express();
app.use(express.json());
app.use('/api/v1/products', productRoutes);
app.use(errorHandler);

describe('Products API', () => {
  let prisma: PrismaClient;
  let testCategory: any;
  let adminToken: string;
  let staffToken: string;

  beforeAll(() => {
    prisma = global.__PRISMA__;
  });

  beforeEach(async () => {
    testCategory = await createTestCategory(prisma, { name: 'Test Category', slug: 'test-category' });
    
    // Create admin and staff users for protected routes
    const adminUser = await createTestUser(prisma, { 
      email: 'admin@test.com', 
      role: 'admin' 
    });
    const staffUser = await createTestUser(prisma, { 
      email: 'staff@test.com', 
      role: 'staff' 
    });

    adminToken = generateJWTToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
    staffToken = generateJWTToken({ id: staffUser.id, email: staffUser.email, role: staffUser.role });
  });

  describe('GET /api/v1/products', () => {
    it('should return paginated products', async () => {
      await createTestProduct(prisma, testCategory.id, sampleProducts[0]);
      await createTestProduct(prisma, testCategory.id, sampleProducts[1]);

      const response = await request(app)
        .get('/api/v1/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter products by search term', async () => {
      await createTestProduct(prisma, testCategory.id, sampleProducts[0]); // Elegant Saree
      await createTestProduct(prisma, testCategory.id, sampleProducts[1]); // Casual Kurta

      const response = await request(app)
        .get('/api/v1/products?search=Elegant')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('Elegant Saree');
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/products?page=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/v1/products/featured', () => {
    it('should return only featured products', async () => {
      await createTestProduct(prisma, testCategory.id, { ...sampleProducts[0], isFeatured: true });
      await createTestProduct(prisma, testCategory.id, { ...sampleProducts[1], isFeatured: false, slug: 'not-featured' });

      const response = await request(app)
        .get('/api/v1/products/featured')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].isFeatured).toBe(true);
    });
  });

  describe('GET /api/v1/products/category/:categorySlug', () => {
    it('should return products from specific category', async () => {
      await createTestProduct(prisma, testCategory.id, sampleProducts[0]);

      const response = await request(app)
        .get(`/api/v1/products/category/${testCategory.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].categoryId).toBe(testCategory.id);
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .get('/api/v1/products/category/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/products/slug/:slug', () => {
    it('should return product by slug', async () => {
      const product = await createTestProduct(prisma, testCategory.id, sampleProducts[0]);

      const response = await request(app)
        .get(`/api/v1/products/slug/${product.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe(product.slug);
      expect(response.body.data.category).toBeDefined();
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/v1/products/slug/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should return product by id', async () => {
      const product = await createTestProduct(prisma, testCategory.id, sampleProducts[0]);

      const response = await request(app)
        .get(`/api/v1/products/${product.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(product.id);
    });

    it('should validate id parameter', async () => {
      const response = await request(app)
        .get('/api/v1/products/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/products', () => {
    const validProductData = {
      name: 'Test Product',
      description: 'Test product description',
      price: 99.99,
      categoryId: 1, // Will be updated in beforeEach
      fabric: 'Cotton',
      occasion: 'Casual',
    };

    beforeEach(() => {
      validProductData.categoryId = testCategory.id;
    });

    it('should create product with admin token', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProductData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validProductData.name);
      expect(response.body.data.slug).toBe('test-product');
    });

    it('should create product with staff token', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(validProductData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validProductData.name);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .send(validProductData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token is required');
    });

    it('should validate request body', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        price: -10, // Invalid: negative price
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should create product with images and variants', async () => {
      const productWithExtras = {
        ...validProductData,
        images: [
          { url: 'https://example.com/image1.jpg', altText: 'Image 1', isMain: true },
        ],
        variants: [
          { name: 'Size', value: 'M', type: 'size', stock: 5 },
        ],
        attributes: [
          { name: 'Material', value: 'Cotton' },
        ],
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productWithExtras)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.images).toHaveLength(1);
      expect(response.body.data.variants).toHaveLength(1);
      expect(response.body.data.attributes).toHaveLength(1);
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    let product: any;

    beforeEach(async () => {
      product = await createTestProduct(prisma, testCategory.id, sampleProducts[0]);
    });

    it('should update product with admin token', async () => {
      const updateData = {
        name: 'Updated Product',
        price: 199.99,
      };

      const response = await request(app)
        .put(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.price).toBe(updateData.price);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/products/${product.id}`)
        .send({ name: 'Updated' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate id parameter', async () => {
      const response = await request(app)
        .put('/api/v1/products/invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    let product: any;

    beforeEach(async () => {
      product = await createTestProduct(prisma, testCategory.id, sampleProducts[0]);
    });

    it('should delete product with admin token', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product deleted successfully');
    });

    it('should not allow staff to delete products', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/${product.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});