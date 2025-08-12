import { AppError } from '../src/middleware/errorHandler';

describe('AppError Class', () => {
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
});