import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import categoryRoutes from '../../src/routes/categoryRoutes';
import { errorHandler } from '../../src/middleware/errorHandler';
import { createTestCategory, createTestUser, generateJWTToken, sampleCategories } from '../helpers/testData';

const app = express();
app.use(express.json());
app.use('/api/v1/categories', categoryRoutes);
app.use(errorHandler);

describe('Categories API', () => {
  let prisma: PrismaClient;
  let adminToken: string;
  let staffToken: string;

  beforeAll(() => {
    prisma = global.__PRISMA__;
  });

  beforeEach(async () => {
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

  describe('GET /api/v1/categories', () => {
    it('should return all categories', async () => {
      await createTestCategory(prisma, sampleCategories[0]);
      await createTestCategory(prisma, sampleCategories[1]);

      const response = await request(app)
        .get('/api/v1/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should return empty array when no categories exist', async () => {
      const response = await request(app)
        .get('/api/v1/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/v1/categories/main', () => {
    it('should return only top-level categories', async () => {
      const parentCategory = await createTestCategory(prisma, { name: 'Parent', slug: 'parent' });
      await createTestCategory(prisma, { name: 'Child', slug: 'child', parentId: parentCategory.id });

      const response = await request(app)
        .get('/api/v1/categories/main')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Parent');
      expect(response.body.data[0].parentId).toBeNull();
    });
  });

  describe('GET /api/v1/categories/slug/:slug', () => {
    it('should return category by slug', async () => {
      const category = await createTestCategory(prisma, sampleCategories[0]);

      const response = await request(app)
        .get(`/api/v1/categories/slug/${category.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe(category.slug);
      expect(response.body.data.name).toBe(category.name);
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/v1/categories/slug/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category not found');
    });

    it('should validate slug parameter', async () => {
      const response = await request(app)
        .get('/api/v1/categories/slug/')
        .expect(404); // Express handles this as route not found
    });
  });

  describe('GET /api/v1/categories/:id', () => {
    it('should return category by id', async () => {
      const category = await createTestCategory(prisma, sampleCategories[0]);

      const response = await request(app)
        .get(`/api/v1/categories/${category.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(category.id);
      expect(response.body.data.name).toBe(category.name);
    });

    it('should return 404 for non-existent id', async () => {
      const response = await request(app)
        .get('/api/v1/categories/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category not found');
    });

    it('should validate id parameter', async () => {
      const response = await request(app)
        .get('/api/v1/categories/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/categories', () => {
    const validCategoryData = {
      name: 'Test Category',
      description: 'Test category description',
    };

    it('should create category with admin token', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCategoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validCategoryData.name);
      expect(response.body.data.slug).toBe('test-category');
      expect(response.body.data.description).toBe(validCategoryData.description);
    });

    it('should create category with staff token', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(validCategoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validCategoryData.name);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .send(validCategoryData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token is required');
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

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should create category with parent', async () => {
      const parentCategory = await createTestCategory(prisma, { name: 'Parent', slug: 'parent' });
      
      const categoryData = {
        name: 'Child Category',
        parentId: parentCategory.id,
      };

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parentId).toBe(parentCategory.id);
    });
  });

  describe('PUT /api/v1/categories/:id', () => {
    let category: any;

    beforeEach(async () => {
      category = await createTestCategory(prisma, sampleCategories[0]);
    });

    it('should update category with admin token', async () => {
      const updateData = {
        name: 'Updated Category',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/v1/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('should update category with staff token', async () => {
      const updateData = {
        name: 'Staff Updated Category',
      };

      const response = await request(app)
        .put(`/api/v1/categories/${category.id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/categories/${category.id}`)
        .send({ name: 'Updated' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate id parameter', async () => {
      const response = await request(app)
        .put('/api/v1/categories/invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .put('/api/v1/categories/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category not found');
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    let category: any;

    beforeEach(async () => {
      category = await createTestCategory(prisma, sampleCategories[0]);
    });

    it('should delete category with admin token', async () => {
      const response = await request(app)
        .delete(`/api/v1/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category deleted successfully');
    });

    it('should not allow staff to delete categories', async () => {
      const response = await request(app)
        .delete(`/api/v1/categories/${category.id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/categories/${category.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should prevent deletion of category with children', async () => {
      const parentCategory = await createTestCategory(prisma, { name: 'Parent', slug: 'parent' });
      await createTestCategory(prisma, { name: 'Child', slug: 'child', parentId: parentCategory.id });

      const response = await request(app)
        .delete(`/api/v1/categories/${parentCategory.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot delete category with subcategories');
    });
  });
});