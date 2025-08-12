import { Request, Response, NextFunction } from 'express';
import { AppError, errorHandler, notFound, asyncHandler } from '../../../src/middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    req = {
      url: '/test',
      method: 'GET',
      originalUrl: '/api/v1/test',
    };
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
      json: jsonMock,
    };
    next = jest.fn();
    
    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation();
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('AppError', () => {
    it('should create error with message and status code', () => {
      const error = new AppError('Test error', 400);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('should create error with details', () => {
      const details = [{ field: 'name', message: 'Required' }];
      const error = new AppError('Validation failed', 400, details);

      expect(error.details).toEqual(details);
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error', 400);

      expect(error.stack).toBeDefined();
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError correctly', () => {
      const error = new AppError('Custom error message', 422);

      errorHandler(error, req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Custom error message',
      });
    });

    it('should handle AppError with details in development', () => {
      process.env.NODE_ENV = 'development';
      const details = [{ field: 'email', message: 'Invalid format' }];
      const error = new AppError('Validation failed', 400, details);

      errorHandler(error, req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Validation failed',
        details: details,
      });
    });

    it('should handle ValidationError', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';

      errorHandler(error, req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Validation Error',
      });
    });

    it('should handle CastError', () => {
      const error = new Error('Cast failed');
      error.name = 'CastError';

      errorHandler(error, req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Invalid data format',
      });
    });

    it('should handle Prisma unique constraint error (P2002)', () => {
      const error = new Error('P2002: Unique constraint failed');

      errorHandler(error, req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Unique constraint violation',
      });
    });

    it('should handle Prisma record not found error (P2025)', () => {
      const error = new Error('P2025: Record not found');

      errorHandler(error, req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Record not found',
      });
    });

    it('should handle Prisma foreign key constraint error (P2003)', () => {
      const error = new Error('P2003: Foreign key constraint failed');

      errorHandler(error, req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Foreign key constraint failed',
      });
    });

    it('should handle generic unique constraint error', () => {
      const error = new Error('unique constraint violation');

      errorHandler(error, req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Resource already exists',
      });
    });

    it('should handle generic errors with 500 status', () => {
      const error = new Error('Unexpected error');

      errorHandler(error, req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Internal Server Error',
      });
    });

    it('should log error details in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');
      const consoleSpy = jest.spyOn(console, 'error');

      errorHandler(error, req as Request, res as Response, next);

      expect(consoleSpy).toHaveBeenCalledWith('Error details:', {
        message: 'Test error',
        stack: error.stack,
        url: '/test',
        method: 'GET',
        timestamp: expect.any(String),
      });
    });

    it('should not log error details in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');
      const consoleSpy = jest.spyOn(console, 'error');

      errorHandler(error, req as Request, res as Response, next);

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('notFound', () => {
    it('should return 404 with route not found message', () => {
      notFound(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Route /api/v1/test not found',
      });
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async function', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(req as Request, res as Response, next);

      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    it('should catch and pass async errors to next', async () => {
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(req as Request, res as Response, next);

      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle sync functions that return promises', async () => {
      const syncFn = jest.fn().mockReturnValue(Promise.resolve('success'));
      const wrappedFn = asyncHandler(syncFn);

      await wrappedFn(req as Request, res as Response, next);

      expect(syncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });
  });
});