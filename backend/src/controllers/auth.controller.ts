import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserModel } from '../models/user.model';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { AppError } from '../middleware/error';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.errors[0]?.message ?? 'Validation error',
        400,
        'VALIDATION_ERROR',
      );
    }

    const { email, password, name } = parsed.data;

    const existing = UserModel.findByEmail(email);
    if (existing) {
      throw new AppError('Email already in use', 409, 'EMAIL_CONFLICT');
    }

    const password_hash = await hashPassword(password);
    const user = UserModel.create({ email, password_hash, name });

    const token = signToken({ sub: user.id, email: user.email, name: user.name });

    res.status(201).json({
      token,
      user: UserModel.toPublic(user),
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.errors[0]?.message ?? 'Validation error',
        400,
        'VALIDATION_ERROR',
      );
    }

    const { email, password } = parsed.data;

    const user = UserModel.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const token = signToken({ sub: user.id, email: user.email, name: user.name });

    res.status(200).json({
      token,
      user: UserModel.toPublic(user),
    });
  } catch (err) {
    next(err);
  }
}

export function me(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const user = UserModel.findById(req.user.id);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    res.json({ user: UserModel.toPublic(user) });
  } catch (err) {
    next(err);
  }
}
