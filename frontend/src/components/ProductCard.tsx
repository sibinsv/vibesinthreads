'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPriceSimple, calculateDiscountPercentage, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const mainImage = product.images.find(img => img.isMain) || product.images[0];
  const hoverImage = product.images.find(img => !img.isMain) || mainImage;

  const discountPercentage = product.comparePrice 
    ? calculateDiscountPercentage(product.comparePrice, product.price)
    : null;

  return (
    <div
      className={cn(
        "group relative bg-white rounded-lg overflow-hidden shadow-sm border border-rose-100 hover:shadow-lg transition-all duration-300",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-rose-50">
        <Link href={`/products/${product.slug}`}>
          <Image
            src={isHovered && hoverImage ? hoverImage.url : mainImage?.url || `https://picsum.photos/400/600?random=${product.id}`}
            alt={mainImage?.altText || product.name}
            fill
            className={cn(
              "object-cover transition-all duration-500",
              imageLoaded ? "opacity-100" : "opacity-0",
              isHovered ? "scale-105" : "scale-100"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />
        </Link>

        {/* Discount Badge */}
        {discountPercentage && discountPercentage > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            {discountPercentage}% OFF
          </div>
        )}

        {/* Quick Actions */}
        <div className={cn(
          "absolute top-3 right-3 flex flex-col gap-2 transition-all duration-300",
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
        )}>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-sm"
            onClick={() => setIsWishlisted(!isWishlisted)}
          >
            <Heart 
              className={cn(
                "h-4 w-4 transition-colors", 
                isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"
              )} 
            />
          </Button>
          
          <Link href={`/products/${product.slug}`}>
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-sm"
            >
              <Eye className="h-4 w-4 text-gray-600" />
            </Button>
          </Link>
        </div>

        {/* Add to Cart - Bottom Overlay */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent transition-all duration-300",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"
        )}>
          <Button
            className="w-full bg-white text-gray-900 hover:bg-gray-100 font-medium"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>

        {/* Stock Indicator */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white px-3 py-1 rounded text-sm font-medium text-gray-900">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4">
        {/* Category & Designer */}
        <div className="flex items-center justify-between mb-2">
          <Link
            href={`/categories/${product.category.slug}`}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium uppercase tracking-wide"
          >
            {product.category.name}
          </Link>
          {product.designer && (
            <span className="text-xs text-gray-500">
              {product.designer}
            </span>
          )}
        </div>

        {/* Product Name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-rose-700 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Fabric & Occasion */}
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-600">
          {product.fabric && (
            <span className="px-2 py-1 bg-rose-50 rounded-full">
              {product.fabric}
            </span>
          )}
          {product.occasion && (
            <span className="px-2 py-1 bg-gray-100 rounded-full">
              {product.occasion.split(',')[0].trim()}
            </span>
          )}
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              {formatPriceSimple(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-sm text-gray-500 line-through">
                {formatPriceSimple(product.comparePrice)}
              </span>
            )}
          </div>
          
          {/* Rating placeholder */}
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400 text-xs">★</span>
            ))}
            <span className="text-xs text-gray-500 ml-1">(24)</span>
          </div>
        </div>

        {/* Additional Info */}
        {product.craftType && (
          <div className="mt-2 text-xs text-gray-600 italic">
            {product.craftType}
          </div>
        )}
      </div>
    </div>
  );
}