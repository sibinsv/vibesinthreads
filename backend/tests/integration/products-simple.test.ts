import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import productRoutes from '../../src/routes/productRoutes';
import { errorHandler, notFound } from '../../src/middleware/errorHandler';
import { createTestCategory, createTestProduct, createTestUser, generateJWTToken, sampleProducts } from '../helpers/testData';

const app = express();
app.use(express.json());
app.use('/api/v1/products', productRoutes);
app.use(notFound);
app.use(errorHandler);

describe('Products API - Simple Tests', () => {
  let prisma: PrismaClient;
  let testCategory: any;
  let adminToken: string;

  beforeAll(() => {
    prisma = (global as any).__PRISMA__;
  });

  beforeEach(async () => {
    testCategory = await createTestCategory(prisma, { name: 'Test Category', slug: 'test-category' });
    
    // Create admin user for protected routes
    const adminUser = await createTestUser(prisma, { 
      email: 'admin@test.com', 
      role: 'admin' 
    });

    adminToken = generateJWTToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
  });

  describe('GET /api/v1/products', () => {
    it('should return products list', async () => {
      await createTestProduct(prisma, testCategory.id, sampleProducts[0]);

      const response = await request(app)
        .get('/api/v1/products')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('should handle empty products list', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('GET /api/v1/products/featured', () => {
    it('should return featured products', async () => {
      await createTestProduct(prisma, testCategory.id, { ...sampleProducts[0], isFeatured: true });

      const response = await request(app)
        .get('/api/v1/products/featured')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('GET /api/v1/products/slug/:slug', () => {
    it('should return product by slug', async () => {
      const product = await createTestProduct(prisma, testCategory.id, sampleProducts[0]);

      const response = await request(app)
        .get(`/api/v1/products/slug/${product.slug}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('slug', product.slug);
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/v1/products/slug/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should return product by id', async () => {
      const product = await createTestProduct(prisma, testCategory.id, sampleProducts[0]);

      const response = await request(app)
        .get(`/api/v1/products/${product.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', product.id);
    });

    it('should validate id parameter', async () => {
      const response = await request(app)
        .get('/api/v1/products/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/products', () => {
    const validProductData = {
      name: 'Test Product',
      description: 'Test product description',
      price: 99.99,
      categoryId: 1,
      fabric: 'Cotton',
      occasion: 'Casual',
    };

    beforeEach(() => {
      validProductData.categoryId = testCategory.id;
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .send(validProductData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should create product with valid data and admin token', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProductData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', validProductData.name);
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

      expect(response.body).toHaveProperty('success', false);
    });
  });
});