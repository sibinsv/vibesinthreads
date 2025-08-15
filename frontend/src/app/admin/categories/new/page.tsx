'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, Upload, Grid3X3 } from 'lucide-react';
import { Category } from '@/lib/types';
import { categoriesApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useToast } from '@/hooks/useToast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

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

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  images: UploadedImage[];
  parentId: number | null;
}

export default function NewCategoryPage() {
  const router = useRouter();
  const toast = useToast();
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    images: [],
    parentId: null
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);

  // Fetch categories for parent selection
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getAll(false);
        if (response.success && response.data) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleInputChange = (field: keyof CategoryFormData, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate slug from name
    if (field === 'name' && typeof value === 'string') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({
        ...prev,
        slug
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      // Prepare category data with first image URL if available
      const categoryData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        image: formData.images.length > 0 ? formData.images[0].url : '',
        parentId: formData.parentId
      };
      
      console.log('Creating category:', categoryData);
      
      // Call the real API to create the category
      const response = await categoriesApi.create(categoryData);
      
      if (response.success) {
        toast.success('Category created successfully!');
        router.push('/admin/categories');
      } else {
        throw new Error(response.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create category. Please try again.';
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        toast.error('Authentication required. Please log in as admin first.');
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        toast.error('Admin access required. Please log in with admin credentials.');
      } else {
        toast.error(`Failed to create category: ${errorMessage}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCancelModal(true);
  };

  const confirmCancel = () => {
    router.push('/admin/categories');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/categories">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Categories
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add New Category</h1>
            <p className="text-muted-foreground mt-1">Create a new product category</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isSaving}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Creating...' : 'Create Category'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Category Information</h2>
            
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter category name"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  URL Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="category-url-slug"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be used in the URL: /products/category/{formData.slug || 'category-url-slug'}
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter category description"
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                />
              </div>

              {/* Parent Category */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Parent Category
                </label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) => handleInputChange('parentId', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                >
                  <option value="">None (Main Category)</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a parent category to create a subcategory
                </p>
              </div>
            </div>
          </div>

          {/* Category Image */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Category Image</h2>
            
            <ImageUpload
              images={formData.images}
              onImagesChange={(images) => handleInputChange('images', images)}
              maxImages={1}
              className="w-full"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Help Text */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Category Guidelines</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>• Use clear, descriptive names for your categories</p>
              <p>• Keep category names under 50 characters</p>
              <p>• Use subcategories to organize related products</p>
              <p>• Add images to make categories more visually appealing</p>
              <p>• Write helpful descriptions to guide customers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={cancelModal}
        onClose={() => setCancelModal(false)}
        onConfirm={confirmCancel}
        title="Cancel Changes"
        message="Are you sure you want to cancel? Any unsaved changes will be lost."
        confirmText="Yes, Cancel"
        cancelText="Continue Editing"
        variant="warning"
      />
    </div>
  );
}