import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all users with pagination, search, and filtering (Admin only)
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause for filtering
    const whereClause: any = {};

    // Search by name or email
    if (search) {
      whereClause.OR = [
        {
          firstName: {
            contains: search as string,
            mode: 'insensitive'
          }
        },
        {
          lastName: {
            contains: search as string,
            mode: 'insensitive'
          }
        },
        {
          email: {
            contains: search as string,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Filter by role
    if (role && role !== '') {
      whereClause.role = role as string;
    }

    // Filter by status
    if (status && status !== '') {
      whereClause.isActive = status === 'active';
    }

    // Build order clause
    let orderBy: any = {};
    if (sortBy === 'name') {
      orderBy = { firstName: sortOrder };
    } else if (sortBy === 'totalSpent') {
      orderBy = { totalSpent: sortOrder };
    } else {
      orderBy = { [sortBy as string]: sortOrder };
    }

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          dateOfBirth: true,
          gender: true,
          preferredOccasions: true,
          preferredFabrics: true,
          sizePreferences: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              orders: true
            }
          }
        },
        orderBy,
        skip: offset,
        take: limitNum
      }),
      prisma.user.count({ where: whereClause })
    ]);

    // Calculate total spent for each user (this would be better as a database field in production)
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const orders = await prisma.order.findMany({
          where: { userId: user.id, status: 'delivered' },
          select: { total: true }
        });

        const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          preferredOccasions: user.preferredOccasions,
          preferredFabrics: user.preferredFabrics,
          sizePreferences: user.sizePreferences,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLogin: user.lastLoginAt,
          orderCount: user._count.orders,
          totalSpent
        };
      })
    );

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Get single user by ID (Admin only)
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        dateOfBirth: true,
        gender: true,
        preferredOccasions: true,
        preferredFabrics: true,
        sizePreferences: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            orders: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Get order statistics
    const orders = await prisma.order.findMany({
      where: { userId: user.id, status: 'delivered' },
      select: { total: true }
    });

    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

    const userWithStats = {
      ...user,
      name: `${user.firstName} ${user.lastName}`,
      lastLogin: user.lastLoginAt,
      orderCount: user._count.orders,
      totalSpent
    };

    res.status(200).json({
      success: true,
      data: { user: userWithStats }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Create new user (Admin only)
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      role = 'user',
      dateOfBirth,
      gender,
      preferredOccasions,
      preferredFabrics,
      sizePreferences
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required'
      });
      return;
    }

    // Validate role
    if (!['user', 'admin', 'staff'].includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role. Must be user, admin, or staff'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        preferredOccasions: preferredOccasions || null,
        preferredFabrics: preferredFabrics || null,
        sizePreferences: sizePreferences || null,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        dateOfBirth: true,
        gender: true,
        preferredOccasions: true,
        preferredFabrics: true,
        sizePreferences: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Update user (Admin only)
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
      return;
    }

    const {
      email,
      firstName,
      lastName,
      phone,
      role,
      dateOfBirth,
      gender,
      preferredOccasions,
      preferredFabrics,
      sizePreferences
    } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId }
        }
      });

      if (emailTaken) {
        res.status(409).json({
          success: false,
          message: 'Email is already taken by another user'
        });
        return;
      }
    }

    // Validate role if provided
    if (role && !['user', 'admin', 'staff'].includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role. Must be user, admin, or staff'
      });
      return;
    }

    // Build update data
    const updateData: any = {};
    if (email) updateData.email = email;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone || null;
    if (role) updateData.role = role;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined) updateData.gender = gender || null;
    if (preferredOccasions !== undefined) updateData.preferredOccasions = preferredOccasions || null;
    if (preferredFabrics !== undefined) updateData.preferredFabrics = preferredFabrics || null;
    if (sizePreferences !== undefined) updateData.sizePreferences = sizePreferences || null;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        dateOfBirth: true,
        gender: true,
        preferredOccasions: true,
        preferredFabrics: true,
        sizePreferences: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Toggle user status (Admin only)
 */
export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    const { isActive } = req.body;

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
      return;
    }

    if (typeof isActive !== 'boolean') {
      res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Prevent deactivating the last admin
    if (user.role === 'admin' && !isActive) {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'admin', isActive: true }
      });

      if (activeAdminCount <= 1) {
        res.status(400).json({
          success: false,
          message: 'Cannot deactivate the last active admin user'
        });
        return;
      }
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Delete user (Admin only) - Only customers can be deleted
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, firstName: true, lastName: true }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Only allow deletion of regular users, not admins or staff
    if (user.role === 'admin' || user.role === 'staff') {
      res.status(403).json({
        success: false,
        message: `Cannot delete ${user.role} users`
      });
      return;
    }

    // Check if user has orders
    const orderCount = await prisma.order.count({
      where: { userId: userId }
    });

    if (orderCount > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete user with existing orders. Deactivate the user instead.'
      });
      return;
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    });

    res.status(200).json({
      success: true,
      message: `User ${user.firstName} ${user.lastName} deleted successfully`
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};