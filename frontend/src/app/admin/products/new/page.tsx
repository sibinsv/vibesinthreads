'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, X, Plus, Upload } from 'lucide-react';
import { Category, CreateProductData } from '@/lib/types';
import { categoriesApi, productsApi, getAdminErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useToast } from '@/hooks/useToast';
import { generateSlug } from '@/lib/utils';

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

interface ProductFormData extends CreateProductData {
  images: UploadedImage[];
  variants: Array<{
    type: string;
    value: string;
    stock: number;
  }>;
  attributes: Array<{
    name: string;
    value: string;
  }>;
}

export default function NewProductPage() {
  const router = useRouter();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: 0,
    comparePrice: undefined,
    stock: 0,
    categoryId: 0,
    fabric: '',
    occasion: '',
    designer: '',
    craftType: '',
    region: '',
    careInstructions: '',
    metaTitle: '',
    metaDescription: '',
    isActive: true,
    isFeatured: false,
    images: [],
    variants: [],
    attributes: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getAll();
        if (response.success && response.data) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name
    if (field === 'name') {
      const slug = generateSlug(value);
      setFormData(prev => ({ ...prev, slug }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { type: '', value: '', stock: 0 }]
    }));
  };

  const updateVariant = (index: number, field: keyof typeof formData.variants[0], value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const addAttribute = () => {
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, { name: '', value: '' }]
    }));
  };

  const updateAttribute = (index: number, field: 'name' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      )
    }));
  };

  const removeAttribute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (formData.categoryId === 0) newErrors.categoryId = 'Please select a category';
    if (formData.stock < 0) newErrors.stock = 'Stock cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const productData: CreateProductData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        shortDescription: formData.shortDescription,
        price: formData.price,
        comparePrice: formData.comparePrice,
        stock: formData.stock,
        categoryId: formData.categoryId,
        fabric: formData.fabric,
        occasion: formData.occasion,
        designer: formData.designer,
        craftType: formData.craftType,
        region: formData.region,
        careInstructions: formData.careInstructions,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        images: formData.images.map((img, index) => ({
          url: img.url,
          altText: img.altText || '',
          isMain: img.isMain || index === 0,
          sortOrder: img.sortOrder ?? index
        }))
      };

      const response = await productsApi.create(productData);
      
      if (response.success) {
        router.push('/admin/products');
      } else {
        toast.error(`Failed to create product: ${getAdminErrorMessage(response)}`);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error(`Failed to create product: ${getAdminErrorMessage(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add New Product</h1>
            <p className="text-muted-foreground mt-1">Create a new product for your catalog</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            isLoading={isSaving}
            loadingText="Saving Product..."
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save Product
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="Enter product name"
                  />
                  {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="product-slug"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Auto-generated from product name</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={formData.shortDescription}
                    onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="Brief product description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="Detailed product description"
                  />
                  {errors.description && <p className="text-destructive text-sm mt-1">{errors.description}</p>}
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Product Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Fabric</label>
                  <input
                    type="text"
                    value={formData.fabric}
                    onChange={(e) => handleInputChange('fabric', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="e.g., Cotton, Silk, Georgette"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Occasion</label>
                  <input
                    type="text"
                    value={formData.occasion}
                    onChange={(e) => handleInputChange('occasion', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="e.g., Wedding, Festival, Casual"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Designer</label>
                  <input
                    type="text"
                    value={formData.designer}
                    onChange={(e) => handleInputChange('designer', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="Designer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Craft Type</label>
                  <input
                    type="text"
                    value={formData.craftType}
                    onChange={(e) => handleInputChange('craftType', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="e.g., Chikankari, Zari Work"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Region</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => handleInputChange('region', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="e.g., Gujarat, Rajasthan"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground mb-1">Care Instructions</label>
                <textarea
                  value={formData.careInstructions}
                  onChange={(e) => handleInputChange('careInstructions', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  placeholder="Care and maintenance instructions"
                />
              </div>
            </div>

            {/* Product Images */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Product Images</h2>
              
              <ImageUpload
                images={formData.images}
                onImagesChange={(images) => handleInputChange('images', images)}
                maxImages={10}
                className="w-full"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Status</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-foreground">
                    Active (visible to customers)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="isFeatured" className="ml-2 text-sm text-foreground">
                    Featured product
                  </label>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Category</h2>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Category *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                >
                  <option value={0}>Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-destructive text-sm mt-1">{errors.categoryId}</p>}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Pricing</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {errors.price && <p className="text-destructive text-sm mt-1">{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Compare Price
                  </label>
                  <input
                    type="number"
                    value={formData.comparePrice || ''}
                    onChange={(e) => handleInputChange('comparePrice', parseFloat(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Original price for discount display</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="0"
                    min="0"
                  />
                  {errors.stock && <p className="text-destructive text-sm mt-1">{errors.stock}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}