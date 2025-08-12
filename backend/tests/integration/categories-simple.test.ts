import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import categoryRoutes from '../../src/routes/categoryRoutes';
import { errorHandler, notFound } from '../../src/middleware/errorHandler';
import { createTestCategory, createTestUser, generateJWTToken, sampleCategories } from '../helpers/testData';

const app = express();
app.use(express.json());
app.use('/api/v1/categories', categoryRoutes);
app.use(notFound);
app.use(errorHandler);

describe('Categories API - Simple Tests', () => {
  let prisma: PrismaClient;
  let adminToken: string;

  beforeAll(() => {
    prisma = (global as any).__PRISMA__;
  });

  beforeEach(async () => {
    // Create admin user for protected routes
    const adminUser = await createTestUser(prisma, { 
      email: 'admin@test.com', 
      role: 'admin' 
    });

    adminToken = generateJWTToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
  });

  describe('GET /api/v1/categories', () => {
    it('should return categories list', async () => {
      await createTestCategory(prisma, sampleCategories[0]);

      const response = await request(app)
        .get('/api/v1/categories')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should handle empty categories list', async () => {
      const response = await request(app)
        .get('/api/v1/categories')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/categories/main', () => {
    it('should return main categories', async () => {
      await createTestCategory(prisma, { name: 'Main Category', slug: 'main-category' });

      const response = await request(app)
        .get('/api/v1/categories/main')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/categories/slug/:slug', () => {
    it('should return category by slug', async () => {
      const category = await createTestCategory(prisma, sampleCategories[0]);

      const response = await request(app)
        .get(`/api/v1/categories/slug/${category.slug}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('slug', category.slug);
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/v1/categories/slug/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/categories/:id', () => {
    it('should return category by id', async () => {
      const category = await createTestCategory(prisma, sampleCategories[0]);

      const response = await request(app)
        .get(`/api/v1/categories/${category.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', category.id);
    });

    it('should validate id parameter', async () => {
      const response = await request(app)
        .get('/api/v1/categories/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/categories', () => {
    const validCategoryData = {
      name: 'Test Category',
      description: 'Test category description',
    };

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .send(validCategoryData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should create category with valid data and admin token', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCategoryData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', validCategoryData.name);
    });

    it('should validate request body', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        image: 'invalid-url', // Invalid: not a URL
      };

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});