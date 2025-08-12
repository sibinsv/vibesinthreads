import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, authorize, optionalAuth } from '../../../src/middleware/auth';
import { AppError } from '../../../src/middleware/errorHandler';

// Mock jwt
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {};
    next = jest.fn();
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', () => {
      const mockPayload = { id: 1, email: 'test@example.com', role: 'admin' };
      req.headers = { authorization: 'Bearer valid-token' };
      mockedJwt.verify.mockReturnValue(mockPayload as any);

      authenticateToken(req as Request, res as Response, next);

      expect(req.user).toEqual(mockPayload);
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject request without token', () => {
      authenticateToken(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access token is required',
          statusCode: 401,
        })
      );
    });

    it('should reject request with invalid authorization header', () => {
      req.headers = { authorization: 'InvalidFormat' };

      authenticateToken(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access token is required',
          statusCode: 401,
        })
      );
    });

    it('should handle expired token', () => {
      req.headers = { authorization: 'Bearer expired-token' };
      mockedJwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      authenticateToken(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token has expired',
          statusCode: 401,
        })
      );
    });

    it('should handle invalid token', () => {
      req.headers = { authorization: 'Bearer invalid-token' };
      mockedJwt.verify.mockImplementation(() => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      authenticateToken(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid token',
          statusCode: 401,
        })
      );
    });

    it('should handle missing JWT secret', () => {
      delete process.env.JWT_SECRET;
      req.headers = { authorization: 'Bearer valid-token' };

      authenticateToken(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'JWT secret not configured',
          statusCode: 500,
        })
      );
    });

    it('should handle general token verification errors', () => {
      req.headers = { authorization: 'Bearer malformed-token' };
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('General error');
      });

      authenticateToken(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token verification failed',
          statusCode: 401,
        })
      );
    });
  });

  describe('authorize', () => {
    it('should allow access for authorized role', () => {
      req.user = { id: 1, email: 'test@example.com', role: 'admin' };
      const middleware = authorize('admin', 'staff');

      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow access for multiple authorized roles', () => {
      req.user = { id: 1, email: 'test@example.com', role: 'staff' };
      const middleware = authorize('admin', 'staff');

      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access for unauthorized role', () => {
      req.user = { id: 1, email: 'test@example.com', role: 'customer' };
      const middleware = authorize('admin', 'staff');

      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Insufficient permissions',
          statusCode: 403,
        })
      );
    });

    it('should require authentication', () => {
      // No user in req
      const middleware = authorize('admin');

      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
          statusCode: 401,
        })
      );
    });
  });

  describe('optionalAuth', () => {
    it('should set user when valid token provided', () => {
      const mockPayload = { id: 1, email: 'test@example.com', role: 'customer' };
      req.headers = { authorization: 'Bearer valid-token' };
      mockedJwt.verify.mockReturnValue(mockPayload as any);

      optionalAuth(req as Request, res as Response, next);

      expect(req.user).toEqual(mockPayload);
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without user when no token provided', () => {
      optionalAuth(req as Request, res as Response, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without user when invalid token provided', () => {
      req.headers = { authorization: 'Bearer invalid-token' };
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      optionalAuth(req as Request, res as Response, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without user when no JWT secret', () => {
      delete process.env.JWT_SECRET;
      req.headers = { authorization: 'Bearer valid-token' };

      optionalAuth(req as Request, res as Response, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });
  });
});