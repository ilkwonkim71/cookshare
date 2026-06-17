import { Router } from 'express';
import multer from 'multer';
import { ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_BYTES } from '@cookshare/shared';
import { uploadImage } from '../controllers/upload.controller';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/error';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
  },
  fileFilter(_req, file, cb) {
    if ((ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          'Only image files are allowed (jpeg, png, gif, webp)',
          400,
          'INVALID_FILE_TYPE',
        ),
      );
    }
  },
});

const router = Router();

router.post('/', requireAuth, upload.single('image'), uploadImage);

export default router;
