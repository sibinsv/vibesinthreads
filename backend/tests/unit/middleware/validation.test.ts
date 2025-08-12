import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, validateParamsId, validateParamsSlug } from '../../../src/middleware/validation';
import { AppError } from '../../../src/middleware/errorHandler';

describe('Validation Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
    };
    res = {};
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    const testSchema = z.object({
      body: z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email'),
        age: z.number().min(0, 'Age must be positive'),
      }),
      params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number),
      }),
      query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
      }).partial(),
    });

    it('should pass validation with valid data', () => {
      req.body = { name: 'John Doe', email: 'john@example.com', age: 25 };
      req.params = { id: '123' };
      req.query = { page: '1' };

      const middleware = validate(testSchema);
      middleware(req as Request, res as Response, next);

      expect(req.body.name).toBe('John Doe');
      expect(req.params.id).toBe(123); // Transformed to number
      expect(req.query.page).toBe(1); // Transformed to number
      expect(next).toHaveBeenCalledWith();
    });

    it('should handle validation errors', () => {
      req.body = { name: '', email: 'invalid-email', age: -5 };
      req.params = { id: 'invalid' };

      const middleware = validate(testSchema);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
          statusCode: 400,
          details: expect.arrayContaining([
            expect.objectContaining({
              field: expect.stringContaining('name'),
              message: 'Name is required',
            }),
            expect.objectContaining({
              field: expect.stringContaining('email'),
              message: 'Invalid email',
            }),
            expect.objectContaining({
              field: expect.stringContaining('age'),
              message: 'Age must be positive',
            }),
          ]),
        })
      );
    });

    it('should handle partial validation (optional fields)', () => {
      req.body = { name: 'John Doe', email: 'john@example.com', age: 25 };
      req.params = { id: '123' };
      // No query params - should still pass

      const middleware = validate(testSchema);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should handle non-Zod errors', () => {
      const faultySchema = {
        parse: () => {
          throw new Error('Non-Zod error');
        },
      } as any;

      req.body = { name: 'John' };

      const middleware = validate(faultySchema);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Non-Zod error',
        })
      );
    });

    it('should transform data correctly', () => {
      const transformSchema = z.object({
        body: z.object({
          price: z.string().transform(val => parseFloat(val)),
          isActive: z.string().transform(val => val === 'true'),
        }),
      });

      req.body = { price: '99.99', isActive: 'true' };

      const middleware = validate(transformSchema);
      middleware(req as Request, res as Response, next);

      expect(req.body.price).toBe(99.99);
      expect(req.body.isActive).toBe(true);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('validateParamsId', () => {
    it('should validate numeric id parameter', () => {
      req.params = { id: '123' };

      validateParamsId(req as Request, res as Response, next);

      expect(req.params.id).toBe(123);
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject non-numeric id parameter', () => {
      req.params = { id: 'abc' };

      validateParamsId(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
          statusCode: 400,
        })
      );
    });

    it('should reject empty id parameter', () => {
      req.params = { id: '' };

      validateParamsId(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
          statusCode: 400,
        })
      );
    });

    it('should reject negative id parameter', () => {
      req.params = { id: '-1' };

      validateParamsId(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
          statusCode: 400,
        })
      );
    });
  });

  describe('validateParamsSlug', () => {
    it('should validate slug parameter', () => {
      req.params = { slug: 'valid-slug-123' };

      validateParamsSlug(req as Request, res as Response, next);

      expect(req.params.slug).toBe('valid-slug-123');
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject empty slug parameter', () => {
      req.params = { slug: '' };

      validateParamsSlug(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
          statusCode: 400,
        })
      );
    });

    it('should accept slug with special characters', () => {
      req.params = { slug: 'slug-with-dashes_and_underscores' };

      validateParamsSlug(req as Request, res as Response, next);

      expect(req.params.slug).toBe('slug-with-dashes_and_underscores');
      expect(next).toHaveBeenCalledWith();
    });
  });
});