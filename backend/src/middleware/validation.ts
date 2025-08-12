import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from './errorHandler';

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query
      }) as any;

      // Replace req with validated data
      if (result.body) req.body = result.body;
      if (result.params) req.params = result.params;
      if (result.query) req.query = result.query;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return next(new AppError(
          'Validation failed',
          400,
          errorMessages
        ));
      }
      next(error);
    }
  };
};

export const validateParamsId = validate(z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid ID format').transform(Number)
  })
}));

export const validateParamsSlug = validate(z.object({
  params: z.object({
    slug: z.string().min(1, 'Slug is required')
  })
}));