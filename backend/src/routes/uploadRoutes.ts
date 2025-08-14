import { Router, Request, Response } from 'express';
import { upload, processImage, generateImageUrl, cleanupFiles } from '../middleware/uploadMiddleware';
import { createApiResponse } from '../utils/helpers';
import { asyncHandler } from '../middleware/errorHandler';
import path from 'path';

const router = Router();

// Single image upload
router.post('/image', upload.single('image'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json(createApiResponse(
      false,
      null,
      undefined,
      'No image file provided'
    ));
  }

  try {
    // Process the uploaded image
    const processed = await processImage(req.file.path, {
      width: 1200,
      height: 1200,
      quality: 85,
      createThumbnail: true,
      thumbnailSize: 300
    });

    // Generate URLs
    const originalFilename = path.basename(req.file.path);
    const processedFilename = processed.processedPath ? path.basename(processed.processedPath) : originalFilename;
    const thumbnailFilename = processed.thumbnailPath ? path.basename(processed.thumbnailPath) : undefined;

    const imageData = {
      id: Date.now(), // Temporary ID, will be replaced by database ID
      filename: originalFilename,
      originalUrl: generateImageUrl(originalFilename),
      url: generateImageUrl(processedFilename),
      thumbnailUrl: thumbnailFilename ? generateImageUrl(thumbnailFilename, 'thumbnail') : null,
      size: req.file.size,
      mimetype: req.file.mimetype,
      width: processed.metadata.width,
      height: processed.metadata.height
    };

    res.json(createApiResponse(
      true,
      imageData,
      'Image uploaded and processed successfully'
    ));
  } catch (error) {
    // Clean up uploaded file on error
    cleanupFiles([req.file.path]);
    console.error('Error processing uploaded image:', error);
    
    res.status(500).json(createApiResponse(
      false,
      null,
      undefined,
      'Error processing uploaded image'
    ));
  }
}));

// Multiple images upload
router.post('/images', upload.array('images', 10), asyncHandler(async (req: Request, res: Response) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json(createApiResponse(
      false,
      null,
      undefined,
      'No image files provided'
    ));
  }

  const files = req.files as Express.Multer.File[];
  const processedImages = [];
  const failedFiles = [];

  for (const file of files) {
    try {
      // Process each uploaded image
      const processed = await processImage(file.path, {
        width: 1200,
        height: 1200,
        quality: 85,
        createThumbnail: true,
        thumbnailSize: 300
      });

      // Generate URLs
      const originalFilename = path.basename(file.path);
      const processedFilename = processed.processedPath ? path.basename(processed.processedPath) : originalFilename;
      const thumbnailFilename = processed.thumbnailPath ? path.basename(processed.thumbnailPath) : undefined;

      const imageData = {
        id: Date.now() + Math.random(), // Temporary ID
        filename: originalFilename,
        originalUrl: generateImageUrl(originalFilename),
        url: generateImageUrl(processedFilename),
        thumbnailUrl: thumbnailFilename ? generateImageUrl(thumbnailFilename, 'thumbnail') : null,
        size: file.size,
        mimetype: file.mimetype,
        width: processed.metadata.width,
        height: processed.metadata.height
      };

      processedImages.push(imageData);
    } catch (error) {
      console.error(`Error processing file ${file.originalname}:`, error);
      failedFiles.push(file.originalname);
      // Clean up failed file
      cleanupFiles([file.path]);
    }
  }

  if (processedImages.length === 0) {
    return res.status(500).json(createApiResponse(
      false,
      null,
      undefined,
      'Failed to process any images'
    ));
  }

  const message = failedFiles.length > 0 
    ? `${processedImages.length} images processed successfully. Failed: ${failedFiles.join(', ')}`
    : `${processedImages.length} images uploaded and processed successfully`;

  res.json(createApiResponse(
    true,
    processedImages,
    message
  ));
}));

export default router;