'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
 
  Star, 
  Truck, 
  Shield, 
  RefreshCw,
  Info,
  Ruler,
  Palette
} from 'lucide-react';
import { Product } from '@/lib/types';
import { productsApi } from '@/lib/api';
import ProductImageGallery from '@/components/ProductImageGallery';
import { Button } from '@/components/ui/Button';
import { formatPriceSimple, calculateDiscountPercentage, cn } from '@/lib/utils';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'care' | 'reviews'>('description');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productsApi.getBySlug(slug);
        if (response.success && response.data) {
          setProduct(response.data);
        } else {
          notFound();
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const handleVariantChange = (type: string, value: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const discountPercentage = product?.comparePrice 
    ? calculateDiscountPercentage(product.comparePrice, product.price)
    : null;

  const groupedVariants = product?.variants?.reduce((acc, variant) => {
    if (!acc[variant.type]) {
      acc[variant.type] = [];
    }
    acc[variant.type].push(variant);
    return acc;
  }, {} as Record<string, typeof product.variants>) || {};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="aspect-[3/4] bg-gray-200 rounded-lg"></div>
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-12 bg-gray-200 rounded w-1/3"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-8 text-sm">
          <Link href="/" className="text-gray-500 hover:text-rose-600">Home</Link>
          <span className="text-gray-400">/</span>
          <Link href="/products" className="text-gray-500 hover:text-rose-600">Products</Link>
          <span className="text-gray-400">/</span>
          <Link 
            href={`/products?category=${product.category.slug}`} 
            className="text-gray-500 hover:text-rose-600"
          >
            {product.category.name}
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        {/* Back Button */}
        <Link href="/products">
          <Button variant="outline" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <ProductImageGallery 
              images={product.images} 
              productName={product.name}
            />
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Product Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Link 
                  href={`/products?category=${product.category.slug}`}
                  className="text-sm text-rose-600 hover:text-rose-700 font-medium uppercase tracking-wide"
                >
                  {product.category.name}
                </Link>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsWishlisted(!isWishlisted)}
                  >
                    <Heart className={cn("h-5 w-5", isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600")} />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Share2 className="h-5 w-5 text-gray-600" />
                  </Button>
                </div>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
              
              {product.designer && (
                <p className="text-gray-600 mb-4">by {product.designer}</p>
              )}

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(24 reviews)</span>
              </div>
            </div>

            {/* Pricing */}
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-gray-900">
                {formatPriceSimple(product.price)}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    {formatPriceSimple(product.comparePrice)}
                  </span>
                  {discountPercentage && (
                    <span className="bg-red-100 text-red-800 text-sm px-2 py-1 rounded-full font-medium">
                      {discountPercentage}% OFF
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-gray-600 leading-relaxed">{product.shortDescription}</p>
            )}

            {/* Product Tags */}
            <div className="flex flex-wrap gap-2">
              {product.fabric && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-800 text-sm rounded-full">
                  <Palette className="h-3 w-3" />
                  {product.fabric}
                </span>
              )}
              {product.occasion && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {product.occasion.split(',')[0].trim()}
                </span>
              )}
              {product.craftType && (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full">
                  {product.craftType}
                </span>
              )}
              {product.region && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  {product.region}
                </span>
              )}
            </div>

            {/* Variants */}
            {Object.keys(groupedVariants).length > 0 && (
              <div className="space-y-4">
                {Object.entries(groupedVariants).map(([type, variants]) => (
                  <div key={type}>
                    <label className="block text-sm font-medium text-gray-900 mb-2 capitalize">
                      {type}: {selectedVariants[type] && (
                        <span className="font-normal text-gray-600">{selectedVariants[type]}</span>
                      )}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((variant) => (
                        <button
                          key={variant.id}
                          className={cn(
                            "px-4 py-2 border rounded-lg text-sm font-medium transition-colors",
                            selectedVariants[type] === variant.value
                              ? "border-rose-500 bg-rose-50 text-rose-700"
                              : "border-gray-300 bg-white text-gray-700 hover:border-rose-300 hover:bg-rose-50"
                          )}
                          onClick={() => handleVariantChange(type, variant.value)}
                        >
                          {variant.value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}



            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Truck className="h-5 w-5 text-rose-600" />
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Shield className="h-5 w-5 text-rose-600" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <RefreshCw className="h-5 w-5 text-rose-600" />
                <span>Easy Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs */}
        <div className="mt-16 bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'description', label: 'Description', icon: Info },
                { id: 'details', label: 'Details', icon: Ruler },
                { id: 'care', label: 'Care Instructions', icon: Shield },
                { id: 'reviews', label: 'Reviews (24)', icon: Star }
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={cn(
                    "flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors",
                    activeTab === tab.id
                      ? "border-rose-500 text-rose-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Product Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.fabric && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fabric:</span>
                      <span className="font-medium">{product.fabric}</span>
                    </div>
                  )}
                  {product.occasion && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Occasion:</span>
                      <span className="font-medium">{product.occasion}</span>
                    </div>
                  )}
                  {product.craftType && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Craft:</span>
                      <span className="font-medium">{product.craftType}</span>
                    </div>
                  )}
                  {product.region && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Region:</span>
                      <span className="font-medium">{product.region}</span>
                    </div>
                  )}
                  {product.designer && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Designer:</span>
                      <span className="font-medium">{product.designer}</span>
                    </div>
                  )}
                </div>

                {product.attributes && product.attributes.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Additional Information</h4>
                    <div className="space-y-2">
                      {product.attributes.map((attr) => (
                        <div key={attr.id} className="flex justify-between">
                          <span className="text-gray-600">{attr.name}:</span>
                          <span className="font-medium">{attr.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'care' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Care Instructions</h3>
                {product.careInstructions ? (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {product.careInstructions}
                  </p>
                ) : (
                  <ul className="space-y-2 text-gray-700">
                    <li>• Dry clean only for best results</li>
                    <li>• Store in a cool, dry place</li>
                    <li>• Avoid direct sunlight when storing</li>
                    <li>• Handle embellishments with care</li>
                    <li>• Steam iron on low heat if needed</li>
                  </ul>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Customer Reviews</h3>
                <div className="space-y-6">
                  {/* Placeholder reviews */}
                  {[1, 2, 3].map((review) => (
                    <div key={review} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                          <span className="text-rose-600 font-medium">A</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Anonymous Customer</h4>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">2 days ago</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700">
                        Beautiful product with excellent quality. The fabric is exactly as described and the craftsmanship is outstanding.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}