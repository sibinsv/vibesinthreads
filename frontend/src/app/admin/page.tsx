'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Users, ShoppingCart, TrendingUp, Plus, Eye } from 'lucide-react';
import { Product, Category } from '@/lib/types';
import { productsApi, categoriesApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { formatPriceSimple } from '@/lib/utils';

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure client-side hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const fetchDashboardData = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          productsApi.getAll({}, { limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
          categoriesApi.getAll()
        ]);

        if (productsResponse.success) {
          setStats(prev => ({
            ...prev,
            totalProducts: productsResponse.meta?.total || 0
          }));
          setRecentProducts(productsResponse.data || []);
        }

        if (categoriesResponse.success) {
          setStats(prev => ({
            ...prev,
            totalCategories: categoriesResponse.data?.length || 0
          }));
        }

        // Mock data for orders and revenue
        setStats(prev => ({
          ...prev,
          totalOrders: 156,
          totalRevenue: 2450000
        }));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isMounted]);

  // Don't render until mounted on client side
  if (!isMounted) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-500',
      href: '/admin/products'
    },
    {
      title: 'Categories',
      value: stats.totalCategories,
      icon: Package,
      color: 'bg-green-500',
      href: '/admin/categories'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'bg-yellow-500',
      href: '/admin/orders'
    },
    {
      title: 'Revenue',
      value: formatPriceSimple(stats.totalRevenue),
      icon: TrendingUp,
      color: 'bg-rose-500',
      href: '/admin/analytics'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to Vibes in Threads Admin Panel</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/products/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </Link>
          <Link href="/" target="_blank">
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              View Store
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Link key={index} href={stat.href}>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {typeof stat.value === 'number' && stat.title !== 'Revenue' 
                      ? stat.value.toLocaleString() 
                      : stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Products</h2>
              <Link href="/admin/products">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentProducts.length > 0 ? (
              <div className="space-y-4">
                {recentProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-50 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-rose-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.category.name} • {formatPriceSimple(product.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        product.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No products found</p>
                <Link href="/admin/products/new">
                  <Button className="mt-4">Add Your First Product</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Stats</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Products</span>
                <span className="text-sm font-medium text-green-600">
                  {recentProducts.filter(p => p.isActive).length} / {recentProducts.length}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Featured Products</span>
                <span className="text-sm font-medium text-blue-600">
                  {recentProducts.filter(p => p.isFeatured).length}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Out of Stock</span>
                <span className="text-sm font-medium text-red-600">
                  {recentProducts.filter(p => p.stock === 0).length}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Low Stock (&lt; 5)</span>
                <span className="text-sm font-medium text-yellow-600">
                  {recentProducts.filter(p => p.stock < 5 && p.stock > 0).length}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link href="/admin/products">
                <Button variant="outline" className="w-full">
                  Manage All Products
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}