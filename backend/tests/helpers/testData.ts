import { PrismaClient } from '@prisma/client';

export const createTestCategory = async (prisma: PrismaClient, data: any = {}) => {
  return await prisma.category.create({
    data: {
      name: data.name || 'Test Category',
      slug: data.slug || 'test-category',
      description: data.description || 'Test category description',
      parentId: data.parentId,
      ...data,
    },
  });
};

export const createTestProduct = async (prisma: PrismaClient, categoryId: number, data: any = {}) => {
  return await prisma.product.create({
    data: {
      name: data.name || 'Test Product',
      slug: data.slug || 'test-product',
      description: data.description || 'Test product description',
      price: data.price || 99.99,
      stock: data.stock || 10,
      categoryId,
      isActive: data.isActive !== undefined ? data.isActive : true,
      isFeatured: data.isFeatured !== undefined ? data.isFeatured : false,
      ...data,
    },
  });
};

export const createTestUser = async (prisma: PrismaClient, data: any = {}) => {
  return await prisma.user.create({
    data: {
      email: data.email || 'test@example.com',
      firstName: data.firstName || 'Test',
      lastName: data.lastName || 'User',
      password: data.password || 'hashedpassword',
      role: data.role || 'customer',
      ...data,
    },
  });
};

export const sampleProducts = [
  {
    name: 'Elegant Saree',
    slug: 'elegant-saree',
    description: 'Beautiful silk saree perfect for weddings',
    price: 299.99,
    fabric: 'Silk',
    occasion: 'Wedding',
    region: 'Bengal',
    isFeatured: true,
  },
  {
    name: 'Casual Kurta',
    slug: 'casual-kurta',
    description: 'Comfortable cotton kurta for daily wear',
    price: 79.99,
    fabric: 'Cotton',
    occasion: 'Casual',
    region: 'Gujarat',
  },
  {
    name: 'Designer Lehenga',
    slug: 'designer-lehenga',
    description: 'Stunning lehenga with intricate embroidery',
    price: 899.99,
    fabric: 'Silk',
    occasion: 'Festival',
    designer: 'Ritu Kumar',
    craftType: 'Zardozi',
  },
];

export const sampleCategories = [
  {
    name: 'Sarees',
    slug: 'sarees',
    description: 'Traditional Indian sarees',
  },
  {
    name: 'Kurtas',
    slug: 'kurtas',
    description: 'Comfortable kurtas for men and women',
  },
  {
    name: 'Lehengas',
    slug: 'lehengas',
    description: 'Elegant lehengas for special occasions',
  },
];

export const generateJWTToken = (payload: any) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
};