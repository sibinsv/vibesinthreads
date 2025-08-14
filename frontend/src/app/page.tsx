'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShoppingBag, Sparkles, Heart, Star } from 'lucide-react';
import { Product, Category } from '@/lib/types';
import { productsApi, categoriesApi } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/Button';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure client-side hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const fetchData = async () => {
      try {
        console.log('Starting to fetch data...');
        const [productsResponse, categoriesResponse] = await Promise.all([
          productsApi.getFeatured(8),
          categoriesApi.getAll()
        ]);

        console.log('Products response:', productsResponse);
        console.log('Categories response:', categoriesResponse);

        if (productsResponse.success && productsResponse.data) {
          console.log('Setting featured products:', productsResponse.data.length);
          setFeaturedProducts(productsResponse.data);
        }

        if (categoriesResponse.success && categoriesResponse.data) {
          console.log('Setting categories:', categoriesResponse.data.length);
          setCategories(categoriesResponse.data.slice(0, 6)); // Show first 6 categories
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        console.log('Setting loading to false');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isMounted]);

  // Don't render until mounted on client side
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-white">
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-rose-50 to-pink-50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-600/20 to-pink-600/20" />
        <div className="relative container mx-auto px-4 py-8 lg:py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center mb-6">
              <Image
                src="/images/logo.png"
                alt="Vibes in Threads"
                width={200}
                height={200}
                className="w-48 h-48 object-contain"
              />
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Vibes in{' '}
              <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                Threads
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Discover the finest collection of Indian ethnic wear, where tradition meets contemporary elegance. 
              From exquisite sarees to stunning lehengas, find your perfect style.
            </p>
            
            <div className="flex justify-center">
              <Link href="/products">
                <Button variant="outline" size="lg" className="cursor-pointer">
                  Explore Collections
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">500+</div>
                <div className="text-sm text-gray-600">Designer Pieces</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">50K+</div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">25+</div>
                <div className="text-sm text-gray-600">Designer Brands</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Browse Categories</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our diverse range of traditional and contemporary ethnic wear
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Debug info - remove in production */}
            <div className="col-span-full text-center py-4">
              <p className="text-sm text-gray-500">
                Categories: {categories.length} | Loading: {isLoading.toString()}
              </p>
            </div>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-rose-100 to-pink-100">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = `https://picsum.photos/400/300?random=${category.id}`;
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ShoppingBag className="h-16 w-16 text-rose-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{category.name}</h3>
                    <p className="text-rose-100 text-sm mb-3 line-clamp-2">
                      {category.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-rose-200 text-sm">
                        {category.productCount} products
                      </span>
                      <ArrowRight className="h-5 w-5 text-white group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Collection</h2>
            <p className="text-gray-600">Handpicked pieces that blend tradition with modern elegance</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm border border-rose-100">
                  <div className="aspect-[3/4] bg-gray-200 animate-pulse" />
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-6 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Debug info - remove in production */}
              <div className="col-span-full text-center py-4">
                <p className="text-sm text-gray-500">
                  Featured Products: {featuredProducts.length} | Loading: {isLoading.toString()}
                </p>
              </div>
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Vibes in Threads</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Experience the perfect blend of traditional craftsmanship and modern convenience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Heart className="h-8 w-8 text-rose-600" />,
                title: 'Handcrafted Quality',
                description: 'Each piece is carefully crafted by skilled artisans using traditional techniques'
              },
              {
                icon: <Star className="h-8 w-8 text-rose-600" />,
                title: 'Premium Fabrics',
                description: 'We use only the finest silk, cotton, and other premium materials'
              },
              {
                icon: <ShoppingBag className="h-8 w-8 text-rose-600" />,
                title: 'Curated Collection',
                description: 'Every item is carefully selected to ensure exceptional quality and style'
              },
              {
                icon: <Sparkles className="h-8 w-8 text-rose-600" />,
                title: 'Personal Styling',
                description: 'Get expert styling advice to find the perfect outfit for any occasion'
              }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-full mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-gradient-to-r from-rose-600 to-pink-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Stay in Style</h2>
          <p className="text-rose-100 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and be the first to know about new collections, exclusive offers, and styling tips
          </p>
          
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white focus:outline-none"
            />
            <Button className="bg-white text-rose-600 hover:bg-gray-100">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
