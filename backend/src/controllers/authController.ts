import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Dummy login endpoint that always returns success
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // For this dummy implementation, we'll always return success
    // In a real implementation, you would validate credentials against a database
    
    // Generate a dummy JWT token
    const token = jwt.sign(
      { 
        id: 1,
        email: email || 'user@example.com',
        name: 'Dummy User'
      },
      process.env.JWT_SECRET || 'dummy-secret-key',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: 1,
          email: email || 'user@example.com',
          name: 'Dummy User'
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};