import { Request, Response, NextFunction } from 'express';
import { createApiResponse } from '../utils/helpers';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data format';
  } else if (err.message.includes('unique constraint')) {
    statusCode = 409;
    message = 'Resource already exists';
  } else if (err.message.includes('P2002')) {
    statusCode = 409;
    message = 'Unique constraint violation';
  } else if (err.message.includes('P2025')) {
    statusCode = 404;
    message = 'Record not found';
  } else if (err.message.includes('P2003')) {
    statusCode = 400;
    message = 'Foreign key constraint failed';
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  const responsePayload: any = createApiResponse(
    false,
    null,
    undefined,
    message
  );

  if (details && process.env.NODE_ENV === 'development') {
    responsePayload.details = details;
  }

  res.status(statusCode).json(responsePayload);
};

export const notFound = (req: Request, res: Response) => {
  res.status(404).json(createApiResponse(
    false,
    null,
    undefined,
    `Route ${req.originalUrl} not found`
  ));
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};