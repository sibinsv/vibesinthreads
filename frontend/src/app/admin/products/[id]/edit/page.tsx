'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, Upload, Package, Eye, Trash2, Plus } from 'lucide-react';
import { Product, Category } from '@/lib/types';
import { productsApi, categoriesApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { formatPriceSimple } from '@/lib/utils';

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  comparePrice: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  fabric: string;
  occasion: string;
  designer: string;
  craftType: string;
  region: string;
  careInstructions: string;
  metaTitle: string;
  metaDescription: string;
  categoryId: number;
  images: Array<{
    url: string;
    altText: string;
    isMain: boolean;
  }>;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [productId, setProductId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: 0,
    comparePrice: 0,
    stock: 0,
    isActive: true,
    isFeatured: false,
    fabric: '',
    occasion: '',
    designer: '',
    craftType: '',
    region: '',
    careInstructions: '',
    metaTitle: '',
    metaDescription: '',
    categoryId: 0,
    images: []
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Initialize productId from params
  useEffect(() => {
    const initializeId = async () => {
      const resolvedParams = await params;
      setProductId(parseInt(resolvedParams.id));
    };
    initializeId();
  }, [params]);

  // Load product data and categories
  useEffect(() => {
    if (productId === null) return;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [productResponse, categoriesResponse] = await Promise.all([
          productsApi.getById(productId),
          categoriesApi.getAll(false)
        ]);

        if (productResponse.success && productResponse.data) {
          const product = productResponse.data;
          setFormData({
            name: product.name,
            slug: product.slug,
            description: product.description,
            shortDescription: product.shortDescription || '',
            price: product.price,
            comparePrice: product.comparePrice || 0,
            stock: product.stock,
            isActive: product.isActive,
            isFeatured: product.isFeatured,
            fabric: product.fabric || '',
            occasion: product.occasion || '',
            designer: product.designer || '',
            craftType: product.craftType || '',
            region: product.region || '',
            careInstructions: product.careInstructions || '',
            metaTitle: product.metaTitle || '',
            metaDescription: product.metaDescription || '',
            categoryId: product.category.id,
            images: product.images.map(img => ({
              url: img.url,
              altText: img.altText || '',
              isMain: img.isMain
            }))
          });
        } else {
          alert('Product not found');
          router.push('/admin/products');
        }

        if (categoriesResponse.success && categoriesResponse.data) {
          setCategories(categoriesResponse.data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load product data');
        router.push('/admin/products');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [productId, router]);

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
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

  const handleImageAdd = () => {
    if (newImageUrl.trim()) {
      const newImage = {
        url: newImageUrl.trim(),
        altText: formData.name,
        isMain: formData.images.length === 0
      };
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImage]
      }));
      setNewImageUrl('');
    }
  };

  const handleImageRemove = (index: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      // If we removed the main image, make the first image main
      if (newImages.length > 0 && !newImages.some(img => img.isMain)) {
        newImages[0].isMain = true;
      }
      return {
        ...prev,
        images: newImages
      };
    });
  };

  const handleSetMainImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isMain: i === index
      }))
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.slug.trim() || formData.categoryId === 0) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const updateData = {
        ...formData,
        images: formData.images.map((img, index) => ({
          ...img,
          sortOrder: index
        }))
      };

      const response = await productsApi.update(productId, updateData);
      
      if (response.success) {
        alert('Product updated successfully!');
        router.push('/admin/products');
      } else {
        alert('Failed to update product: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        const response = await productsApi.delete(productId);
        if (response.success) {
          alert('Product deleted successfully');
          router.push('/admin/products');
        } else {
          alert('Failed to delete product');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      }
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push('/admin/products');
    }
  };

  if (isLoading || productId === null) {
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
          <Link href="/admin/products">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Product</h1>
            <p className="text-muted-foreground mt-1">Update product information</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href={`/products/${formData.slug}`} target="_blank">
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          </Link>
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
            {isSaving ? 'Updating...' : 'Update Product'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Basic Information</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Short Description
                  </label>
                  <textarea
                    value={formData.shortDescription}
                    onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="Brief product summary..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Full Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="Detailed product description..."
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Pricing & Inventory</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Compare Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.comparePrice}
                    onChange={(e) => handleInputChange('comparePrice', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Product Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Fabric
                  </label>
                  <input
                    type="text"
                    value={formData.fabric}
                    onChange={(e) => handleInputChange('fabric', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="e.g. Cotton, Silk, Chiffon"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Occasion
                  </label>
                  <input
                    type="text"
                    value={formData.occasion}
                    onChange={(e) => handleInputChange('occasion', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="e.g. Wedding, Party, Casual"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Designer
                  </label>
                  <input
                    type="text"
                    value={formData.designer}
                    onChange={(e) => handleInputChange('designer', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="Designer or brand name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Craft Type
                  </label>
                  <input
                    type="text"
                    value={formData.craftType}
                    onChange={(e) => handleInputChange('craftType', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="e.g. Handwoven, Embroidered"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Region
                  </label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => handleInputChange('region', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="e.g. Rajasthani, Bengali"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Care Instructions
                </label>
                <textarea
                  value={formData.careInstructions}
                  onChange={(e) => handleInputChange('careInstructions', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  placeholder="How to care for this product..."
                />
              </div>
            </div>

            {/* Product Images */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Product Images</h2>
              
              {/* Add New Image */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Enter image URL"
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  />
                  <Button
                    type="button"
                    onClick={handleImageAdd}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Image
                  </Button>
                </div>
              </div>

              {/* Image List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative bg-accent rounded-lg p-4">
                    <div className="aspect-square mb-3 bg-background rounded-lg overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.altText}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://picsum.photos/200/200?random=${index}`;
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={image.altText}
                        onChange={(e) => {
                          const newImages = [...formData.images];
                          newImages[index].altText = e.target.value;
                          setFormData(prev => ({ ...prev, images: newImages }));
                        }}
                        placeholder="Alt text"
                        className="w-full px-2 py-1 text-xs border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary bg-background text-foreground"
                      />
                      
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="mainImage"
                            checked={image.isMain}
                            onChange={() => handleSetMainImage(index)}
                            className="text-primary focus:ring-primary"
                          />
                          <span className="text-xs text-foreground">Main</span>
                        </label>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleImageRemove(index)}
                          className="text-destructive hover:text-destructive h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {formData.images.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No images added yet</p>
                  <p className="text-sm">Add some product images to showcase your product</p>
                </div>
              )}
            </div>

            {/* SEO */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">SEO</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="SEO title for search engines"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.metaDescription}
                    onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    placeholder="SEO description for search engines"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Status */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Publish Status</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-foreground">
                    Active (visible to customers)
                  </label>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="isFeatured" className="text-sm font-medium text-foreground">
                    Featured Product
                  </label>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Category</h3>
              <select
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                required
              >
                <option value={0}>Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Danger Zone */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Danger Zone</h3>
              <div className="space-y-3">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  className="w-full gap-2 text-destructive hover:text-destructive border-destructive/20 hover:border-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Product
                </Button>
                <p className="text-xs text-muted-foreground">
                  This action cannot be undone. This will permanently delete the product and all its associated data.
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            {formData.price > 0 && (
              <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Quick Stats</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-medium">{formatPriceSimple(formData.price)}</span>
                  </div>
                  {formData.comparePrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Compare Price:</span>
                      <span className="font-medium line-through">{formatPriceSimple(formData.comparePrice)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stock:</span>
                    <span className={`font-medium ${formData.stock > 0 ? 'text-success' : 'text-destructive'}`}>
                      {formData.stock > 0 ? `${formData.stock} units` : 'Out of stock'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`font-medium ${formData.isActive ? 'text-success' : 'text-muted-foreground'}`}>
                      {formData.isActive ? 'Active' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}