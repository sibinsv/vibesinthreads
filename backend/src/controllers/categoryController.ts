import { Request, Response } from 'express';
import { CategoryService } from '../services/categoryService';
import { createApiResponse } from '../utils/helpers';
import { asyncHandler } from '../middleware/errorHandler';

const categoryService = new CategoryService();

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const includeChildren = req.query.includeChildren !== 'false';
  const categories = await categoryService.getAllCategories(includeChildren);

  res.json(createApiResponse(
    true,
    categories,
    'Categories retrieved successfully'
  ));
});

export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const category = await categoryService.getCategoryBySlug(slug);

  if (!category) {
    return res.status(404).json(createApiResponse(
      false,
      null,
      undefined,
      'Category not found'
    ));
  }

  res.json(createApiResponse(
    true,
    category,
    'Category retrieved successfully'
  ));
});

export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const category = await categoryService.getCategoryById(id);

  if (!category) {
    return res.status(404).json(createApiResponse(
      false,
      null,
      undefined,
      'Category not found'
    ));
  }

  res.json(createApiResponse(
    true,
    category,
    'Category retrieved successfully'
  ));
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body);

  res.status(201).json(createApiResponse(
    true,
    category,
    'Category created successfully'
  ));
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const category = await categoryService.updateCategory(id, req.body);

  res.json(createApiResponse(
    true,
    category,
    'Category updated successfully'
  ));
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await categoryService.deleteCategory(id);

  res.json(createApiResponse(
    true,
    null,
    'Category deleted successfully'
  ));
});

export const getMainCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await categoryService.getMainCategories();

  res.json(createApiResponse(
    true,
    categories,
    'Main categories retrieved successfully'
  ));
});