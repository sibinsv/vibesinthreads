'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  Home,
  Grid3X3,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: BarChart3 },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: Grid3X3 },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">
                  <span className="text-foreground">Vibes</span>
                  <span className="text-primary"> Admin</span>
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle variant="dropdown" />
              <Link href="/" target="_blank">
                <button className="text-muted-foreground hover:text-foreground text-sm">
                  View Store
                </button>
              </Link>
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <span className="text-accent-foreground font-medium text-sm">A</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-72 min-w-72 bg-card shadow-sm h-[calc(100vh-4rem)] overflow-y-auto border-r border-border hidden lg:block">
          <nav className="p-6">
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link
                  href="/admin/products/new"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </Link>
                <Link
                  href="/admin/categories/new"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Category
                </Link>
              </div>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}