'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { uploadApi } from '@/lib/api';

interface UploadedImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  size: number;
  isMain?: boolean;
  altText?: string;
  sortOrder?: number;
}

interface ImageUploadProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
}

interface UploadProgress {
  [key: string]: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images = [],
  onImagesChange,
  maxImages = 10,
  maxSize = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  className = ''
}) => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [errors, setErrors] = useState<string[]>([]);

  const uploadImage = async (file: File): Promise<UploadedImage | null> => {
    const fileId = `${file.name}-${Date.now()}`;
    
    try {
      console.log('Starting upload for:', file.name, 'Size:', file.size, 'Type:', file.type);
      console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1');
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      const result = await uploadApi.uploadImage(file);
      console.log('Upload result:', result);

      setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Validate that we have the required data
      if (!result.data?.url) {
        throw new Error('Invalid response: missing image URL');
      }
      
      return {
        id: fileId,
        url: result.data.url,
        thumbnailUrl: result.data.thumbnailUrl || null,
        filename: result.data.filename || file.name,
        size: result.data.size || file.size,
        isMain: images.length === 0, // First image is main
        sortOrder: images.length
      };
    } catch (error) {
      console.error('Upload failed for', file.name, ':', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors(prev => [...prev, `Failed to upload ${file.name}: ${errorMessage}`]);
      return null;
    } finally {
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    setErrors([]);

    // Handle rejected files
    const newErrors: string[] = [];
    rejectedFiles.forEach(({ file, errors: fileErrors }) => {
      fileErrors.forEach((error: any) => {
        if (error.code === 'file-too-large') {
          newErrors.push(`${file.name} is too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
        } else if (error.code === 'file-invalid-type') {
          newErrors.push(`${file.name} has an invalid file type. Only images are allowed.`);
        } else {
          newErrors.push(`${file.name}: ${error.message}`);
        }
      });
    });

    // Check if adding files would exceed maxImages
    if (images.length + acceptedFiles.length > maxImages) {
      newErrors.push(`Cannot upload more than ${maxImages} images. Currently have ${images.length}, trying to add ${acceptedFiles.length}.`);
      setErrors(newErrors);
      return;
    }

    setErrors(newErrors);

    // Upload accepted files
    const uploadPromises = acceptedFiles.map(file => uploadImage(file));
    const uploadedImages = await Promise.all(uploadPromises);
    
    const validImages = uploadedImages.filter((img): img is UploadedImage => img !== null);
    
    if (validImages.length > 0) {
      onImagesChange([...images, ...validImages]);
    }
  }, [images, maxImages, maxSize, onImagesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({
      ...acc,
      [type]: []
    }), {}),
    maxSize,
    maxFiles: maxImages - images.length,
    disabled: images.length >= maxImages
  });

  const removeImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    
    // If we removed the main image, make the first remaining image main
    if (updatedImages.length > 0) {
      const hadMainImage = images.some(img => img.id === imageId && img.isMain);
      if (hadMainImage && !updatedImages.some(img => img.isMain)) {
        updatedImages[0].isMain = true;
      }
    }
    
    onImagesChange(updatedImages);
  };

  const setMainImage = (imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      isMain: img.id === imageId
    }));
    onImagesChange(updatedImages);
  };

  const updateAltText = (imageId: string, altText: string) => {
    const updatedImages = images.map(img => 
      img.id === imageId ? { ...img, altText } : img
    );
    onImagesChange(updatedImages);
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    
    // Update sort orders
    updatedImages.forEach((img, index) => {
      img.sortOrder = index;
    });
    
    onImagesChange(updatedImages);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-accent/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-foreground">Drop the images here...</p>
            ) : (
              <div className="space-y-2">
                <p className="text-foreground font-medium">
                  Drag & drop images here, or click to select
                </p>
                <p className="text-sm text-muted-foreground">
                  Upload up to {maxImages - images.length} more images 
                  (max {(maxSize / 1024 / 1024).toFixed(1)}MB each)
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports: JPG, PNG, GIF, WebP
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">Uploading...</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <div className="w-full bg-accent rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-destructive font-medium">
            <AlertTriangle className="h-4 w-4" />
            Upload Errors
          </div>
          <ul className="list-disc pl-6 space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-destructive">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Uploaded Images */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Uploaded Images ({images.length}/{maxImages})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={image.id} className="relative bg-card border border-border rounded-lg overflow-hidden">
                {/* Image */}
                <div className="relative w-full h-64 bg-gray-100">
                  <Image
                    src={image.thumbnailUrl || image.url}
                    alt={image.altText || image.filename}
                    fill
                    className="object-cover rounded"
                    onLoad={() => {
                      console.log('Image loaded successfully:', image.url);
                    }}
                    onError={() => {
                      console.error('Image failed to load:', image.url);
                    }}
                  />
                  
                  {/* Main image badge */}
                  {image.isMain && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                      Main
                    </div>
                  )}
                  
                  {/* Remove button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeImage(image.id)}
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Image info */}
                <div className="p-3 space-y-2">
                  <div className="text-sm text-foreground font-medium truncate">
                    {image.filename}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(image.size / 1024).toFixed(1)}KB
                  </div>
                  
                  {/* Alt text input */}
                  <input
                    type="text"
                    placeholder="Alt text (optional)"
                    value={image.altText || ''}
                    onChange={(e) => updateAltText(image.id, e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary bg-background text-foreground"
                  />
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    {!image.isMain && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMainImage(image.id)}
                        className="text-xs"
                      >
                        Set Main
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};