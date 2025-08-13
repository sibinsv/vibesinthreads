'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Package, 
  Users, 
  BarChart3, 
  Settings,
  Home,
  Grid3X3,
  Plus,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: BarChart3 },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: Grid3X3 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isLoading, router, isLoginPage]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role !== 'admin' && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [user, isAuthenticated, isLoading, router, isLoginPage]);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If it's the login page, render it without the admin layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // For other admin pages, check authentication
  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

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
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">{user?.email}</div>
                </div>
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <span className="text-accent-foreground font-medium text-sm">
                    {user?.firstName?.[0]?.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground p-1"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
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
        <div className="flex-1 min-w-0 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}