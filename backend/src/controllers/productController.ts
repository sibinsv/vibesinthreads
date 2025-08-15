import { Request, Response } from 'express';
import { ProductService } from '../services/productService';
import { createApiResponse } from '../utils/helpers';
import { asyncHandler } from '../middleware/errorHandler';
import { ProductFilter, PaginationParams } from '../types';

const productService = new ProductService();

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const filters: ProductFilter = {
    category: req.query.category as string,
    minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
    maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
    fabric: req.query.fabric as string,
    occasion: req.query.occasion as string,
    designer: req.query.designer as string,
    craftType: req.query.craftType as string,
    region: req.query.region as string,
    search: req.query.search as string,
    isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
    isFeatured: req.query.isFeatured ? req.query.isFeatured === 'true' : undefined,
  };

  const pagination: PaginationParams = {
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 12,
    sortBy: req.query.sortBy as string || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
  };

  const result = await productService.getAllProducts(filters, pagination);

  res.json(createApiResponse(
    true,
    result.products,
    'Products retrieved successfully',
    undefined,
    {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    }
  ));
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const product = await productService.getProductBySlug(slug);

  if (!product) {
    return res.status(404).json(createApiResponse(
      false,
      null,
      undefined,
      'Product not found'
    ));
  }

  res.json(createApiResponse(
    true,
    product,
    'Product retrieved successfully'
  ));
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const product = await productService.getProductById(id);

  if (!product) {
    return res.status(404).json(createApiResponse(
      false,
      null,
      undefined,
      'Product not found'
    ));
  }

  res.json(createApiResponse(
    true,
    product,
    'Product retrieved successfully'
  ));
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  // Parse numeric fields from request body to ensure correct data types
  const productData = {
    ...req.body,
    price: parseFloat(req.body.price),
    categoryId: parseInt(req.body.categoryId),
    comparePrice: req.body.comparePrice ? parseFloat(req.body.comparePrice) : undefined,
    stock: req.body.stock ? parseInt(req.body.stock) : 0,
    isActive: req.body.isActive !== undefined ? req.body.isActive : true,
    isFeatured: req.body.isFeatured !== undefined ? req.body.isFeatured : false
  };

  const product = await productService.createProduct(productData);

  res.status(201).json(createApiResponse(
    true,
    product,
    'Product created successfully'
  ));
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  
  // Parse numeric fields from request body
  const productData: any = { ...req.body };
  if (productData.price !== undefined) productData.price = parseFloat(productData.price);
  if (productData.categoryId !== undefined) productData.categoryId = parseInt(productData.categoryId);
  if (productData.comparePrice !== undefined) productData.comparePrice = parseFloat(productData.comparePrice);
  if (productData.stock !== undefined) productData.stock = parseInt(productData.stock);

  const product = await productService.updateProduct(id, productData);

  res.json(createApiResponse(
    true,
    product,
    'Product updated successfully'
  ));
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await productService.deleteProduct(id);

  res.json(createApiResponse(
    true,
    null,
    'Product deleted successfully'
  ));
});

export const deleteProducts = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json(createApiResponse(
      false,
      null,
      'Product IDs array is required'
    ));
    return;
  }

  const result = await productService.deleteProducts(ids);

  res.json(createApiResponse(
    true,
    result,
    `Successfully deleted ${result.deleted} product(s)${result.failed.length > 0 ? `. Failed to delete ${result.failed.length} product(s).` : ''}`
  ));
});

export const getFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
  const products = await productService.getFeaturedProducts(limit);

  res.json(createApiResponse(
    true,
    products,
    'Featured products retrieved successfully'
  ));
});

export const getProductsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { categorySlug } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;
  const products = await productService.getProductsByCategory(categorySlug, limit);

  res.json(createApiResponse(
    true,
    products,
    'Products by category retrieved successfully'
  ));
});

export const addProductImage = asyncHandler(async (req: Request, res: Response) => {
  const productId = parseInt(req.params.id);
  const { url, altText, isMain, sortOrder } = req.body;

  await productService.addProductImage(productId, {
    url,
    altText,
    isMain,
    sortOrder
  });

  res.json(createApiResponse(
    true,
    null,
    'Product image added successfully'
  ));
});

export const removeProductImage = asyncHandler(async (req: Request, res: Response) => {
  const productId = parseInt(req.params.id);
  const imageId = parseInt(req.params.imageId);

  await productService.removeProductImage(productId, imageId);

  res.json(createApiResponse(
    true,
    null,
    'Product image removed successfully'
  ));
});

export const updateProductImages = asyncHandler(async (req: Request, res: Response) => {
  const productId = parseInt(req.params.id);
  const { images } = req.body;

  await productService.updateProductImages(productId, images);

  res.json(createApiResponse(
    true,
    null,
    'Product images updated successfully'
  ));
});