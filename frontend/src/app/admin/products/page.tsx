'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Package,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';
import { Product, ProductFilters, PaginationParams } from '@/lib/types';
import { productsApi, getAdminErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/hooks/useToast';
import { formatPriceSimple, cn } from '@/lib/utils';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ProductFilters>({});
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    productId: number | null;
    productName: string;
    isMultiple: boolean;
    count?: number;
  }>({ isOpen: false, productId: null, productName: '', isMultiple: false });
  const [isDeleting, setIsDeleting] = useState(false);
  
  const toast = useToast();

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const searchFilters = searchTerm ? { ...filters, search: searchTerm } : filters;
        const response = await productsApi.getAll(searchFilters, pagination);
        
        if (response.success && response.data) {
          setProducts(response.data);
          setTotalProducts(response.meta?.total || 0);
          setTotalPages(response.meta?.totalPages || 0);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error(`Failed to load products: ${getAdminErrorMessage(error)}`);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [filters, pagination, searchTerm]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleSelectProduct = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const handleDeleteProduct = (productId: number) => {
    const product = products.find(p => p.id === productId);
    setDeleteModal({
      isOpen: true,
      productId,
      productName: product?.name || 'Unknown',
      isMultiple: false,
    });
  };
  
  const confirmDelete = async () => {
    if (!deleteModal.productId && !deleteModal.isMultiple) return;
    
    setIsDeleting(true);
    
    try {
      if (deleteModal.isMultiple) {
        // Handle bulk delete
        const ids = Array.from(selectedProducts);
        const response = await productsApi.deleteMultiple(ids);
        if (response.success) {
          const { deleted, failed } = response.data;
          if (failed.length > 0) {
            toast.warning(`Successfully deleted ${deleted} product(s). Failed to delete ${failed.length} product(s).`);
          } else {
            toast.success(`Successfully deleted ${deleted} product(s)`);
          }
          setSelectedProducts(new Set());
          // Refresh the list
          window.location.reload();
        } else {
          toast.error(`Failed to delete products: ${getAdminErrorMessage(response)}`);
        }
      } else {
        // Handle single delete
        const response = await productsApi.delete(deleteModal.productId!);
        if (response.success) {
          toast.success('Product deleted successfully');
          // Refresh the list
          window.location.reload();
        } else {
          toast.error(`Failed to delete product: ${getAdminErrorMessage(response)}`);
        }
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(`Failed to delete product: ${getAdminErrorMessage(error)}`);
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, productId: null, productName: '', isMultiple: false });
    }
  };

  const handleDeleteSelected = () => {
    if (selectedProducts.size === 0) return;
    
    const productCount = selectedProducts.size;
    setDeleteModal({
      isOpen: true,
      productId: null,
      productName: '',
      isMultiple: true,
      count: productCount,
    });
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            
            <select
              value={`${pagination.sortBy}_${pagination.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('_');
                setPagination(prev => ({ ...prev, sortBy, sortOrder: sortOrder as 'asc' | 'desc', page: 1 }));
              }}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
            >
              <option value="createdAt_desc">Newest First</option>
              <option value="createdAt_asc">Oldest First</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="price_asc">Price Low to High</option>
              <option value="price_desc">Price High to Low</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.size > 0 && (
          <div className="mt-4 p-4 bg-accent rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary">
                {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Bulk Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive hover:text-destructive"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {products.length} of {totalProducts} products
        </span>
        <span>
          Page {pagination.page} of {totalPages}
        </span>
      </div>

      {/* Products Table */}
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden w-full">
        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-secondary rounded"></div>
                  <div className="w-16 h-16 bg-secondary rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-secondary rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-secondary rounded w-1/2"></div>
                  </div>
                  <div className="h-4 bg-secondary rounded w-20"></div>
                  <div className="h-4 bg-secondary rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: '1000px' }}>
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.size === products.length && products.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-secondary">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-accent rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {product.images.length > 0 ? (
                            <img
                              src={product.images.find(img => img.isMain)?.url || product.images[0].url}
                              alt={product.name}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://picsum.photos/64/64?random=${product.id}`;
                              }}
                            />
                          ) : (
                            <Package className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {product.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {product.designer && `by ${product.designer}`}
                          </p>
                          {product.fabric && (
                            <span className="inline-block mt-1 px-2 py-1 text-xs bg-secondary text-muted-foreground rounded-full">
                              {product.fabric}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {product.category.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">
                        {formatPriceSimple(product.price)}
                      </div>
                      {product.comparePrice && product.comparePrice > product.price && (
                        <div className="text-xs text-muted-foreground line-through">
                          {formatPriceSimple(product.comparePrice)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                        product.stock > 10
                          ? "bg-success/10 text-success"
                          : product.stock > 0
                          ? "bg-warning/10 text-warning"
                          : "bg-destructive/10 text-destructive"
                      )}>
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                          product.isActive
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {product.isFeatured && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/products/${product.slug}`} target="_blank">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first product</p>
            <Link href="/admin/products/new">
              <Button>Add Product</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page! - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={pagination.page === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page! + 1)}
              disabled={pagination.page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => !isDeleting && setDeleteModal({ isOpen: false, productId: null, productName: '', isMultiple: false })}
        onConfirm={confirmDelete}
        title={deleteModal.isMultiple ? 'Delete Products' : 'Delete Product'}
        message={
          deleteModal.isMultiple
            ? `Are you sure you want to delete ${deleteModal.count} selected product${deleteModal.count !== 1 ? 's' : ''}?\n\nThis action cannot be undone.`
            : `Are you sure you want to delete "${deleteModal.productName}"?\n\nThis action cannot be undone.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}