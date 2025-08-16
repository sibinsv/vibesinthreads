import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// Ensure upload directories exist
const uploadDir = process.env.NODE_ENV === 'production' 
  ? '/opt/uploads'
  : path.join(process.cwd(), 'uploads');
const imagesDir = path.join(uploadDir, 'images');
const thumbnailsDir = path.join(uploadDir, 'thumbnails');

[uploadDir, imagesDir, thumbnailsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File filter for images only
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, jpeg, png, gif, webp)'));
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `${uniqueSuffix}-${name}${ext}`);
  }
});

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files per upload
  }
});

// Image processing utility
export interface ProcessImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  createThumbnail?: boolean;
  thumbnailSize?: number;
}

export const processImage = async (
  filePath: string, 
  options: ProcessImageOptions = {}
): Promise<{
  originalPath: string;
  processedPath?: string;
  thumbnailPath?: string;
  metadata: any;
}> => {
  const {
    width = 1200,
    height = 1200,
    quality = 85,
    format = 'jpeg',
    createThumbnail = true,
    thumbnailSize = 300
  } = options;

  const inputPath = filePath;
  const filename = path.basename(filePath, path.extname(filePath));
  const outputPath = path.join(imagesDir, `${filename}-processed.${format}`);
  const thumbnailPath = createThumbnail 
    ? path.join(thumbnailsDir, `${filename}-thumb.${format}`)
    : undefined;

  try {
    // Get image metadata
    const metadata = await sharp(inputPath).metadata();

    // Process main image
    let processedPath: string | undefined;
    if (metadata.width && metadata.width > width || metadata.height && metadata.height > height) {
      await sharp(inputPath)
        .resize(width, height, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ quality, progressive: true })
        .toFile(outputPath);
      processedPath = outputPath;
    }

    // Create thumbnail
    if (createThumbnail && thumbnailPath) {
      await sharp(inputPath)
        .resize(thumbnailSize, thumbnailSize, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80, progressive: true })
        .toFile(thumbnailPath);
    }

    return {
      originalPath: inputPath,
      processedPath,
      thumbnailPath,
      metadata
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

// Clean up temporary files
export const cleanupFiles = (filePaths: string[]) => {
  filePaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};

// Generate image URL
export const generateImageUrl = (filename: string, type: 'original' | 'processed' | 'thumbnail' = 'original') => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const folder = type === 'thumbnail' ? 'thumbnails' : 'images';
  return `${baseUrl}/uploads/${folder}/${filename}`;
};