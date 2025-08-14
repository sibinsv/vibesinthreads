'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, Grid3X3, Trash2 } from 'lucide-react';
import { Category } from '@/lib/types';
import { categoriesApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';

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

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    images: [],
    parentId: null
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize categoryId from params
  useEffect(() => {
    const initializeId = async () => {
      const resolvedParams = await params;
      setCategoryId(parseInt(resolvedParams.id));
    };
    initializeId();
  }, [params]);

  // Load category data and categories
  useEffect(() => {
    if (categoryId === null) return;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [categoryResponse, categoriesResponse] = await Promise.all([
          categoriesApi.getById(categoryId),
          categoriesApi.getAll(false)
        ]);

        if (categoryResponse.success && categoryResponse.data) {
          const category = categoryResponse.data;
          
          // Format image URL - ensure it's a complete URL
          const getFullImageUrl = (imagePath: string) => {
            if (!imagePath) return '';
            if (imagePath.startsWith('http')) return imagePath;
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            return imagePath.startsWith('/') ? `${baseUrl}${imagePath}` : `${baseUrl}/${imagePath}`;
          };
          
          setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            images: category.image ? [{
              id: `existing-${Date.now()}`,
              url: getFullImageUrl(category.image),
              filename: 'category-image',
              size: 0,
              isMain: true,
              sortOrder: 0
            }] : [],
            parentId: category.parentId
          });
        } else {
          alert('Category not found');
          router.push('/admin/categories');
        }

        if (categoriesResponse.success && categoriesResponse.data) {
          // Filter out the current category and its descendants from parent options
          const filteredCategories = categoriesResponse.data.filter(cat => cat.id !== categoryId);
          setCategories(filteredCategories);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load category data');
        router.push('/admin/categories');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [categoryId, router]);

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
      alert('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      // Prepare category data with first image URL if available
      const updateData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        image: formData.images.length > 0 ? formData.images[0].url : '',
        parentId: formData.parentId
      };

      const response = await categoriesApi.update(categoryId, updateData);
      
      if (response.success) {
        alert('Category updated successfully!');
        router.push('/admin/categories');
      } else {
        alert('Failed to update category: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        const response = await categoriesApi.delete(categoryId);
        if (response.success) {
          alert('Category deleted successfully');
          router.push('/admin/categories');
        } else {
          alert('Failed to delete category');
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category');
      }
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push('/admin/categories');
    }
  };

  if (isLoading || categoryId === null) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-lg p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-10 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-foreground">Edit Category</h1>
            <p className="text-muted-foreground mt-1">Update category information</p>
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
            {isSaving ? 'Updating...' : 'Update Category'}
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
          {/* Actions */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Danger Zone</h3>
            <div className="space-y-3">
              <Button 
                variant="outline"
                onClick={handleDelete}
                className="w-full gap-2 text-destructive hover:text-destructive border-destructive/20 hover:border-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete Category
              </Button>
              <p className="text-xs text-muted-foreground">
                This action cannot be undone. This will permanently delete the category and all its associated data.
              </p>
            </div>
          </div>

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
    </div>
  );
}