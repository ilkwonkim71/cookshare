import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { AppError } from '../middleware/error';

export async function uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    if (!req.file) {
      throw new AppError('No image file provided', 400, 'NO_FILE');
    }

    const { url } = await storage.save(req.file.buffer, req.file.originalname, req.file.mimetype);

    res.status(201).json({ url });
  } catch (err) {
    next(err);
  }
}
