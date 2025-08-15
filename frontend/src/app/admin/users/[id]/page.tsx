'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Edit,
  Ban,
  CheckCircle,
  Mail,
  Phone,
  Calendar,
  Crown,
  User as UserIcon,
  Shield,
  ShoppingBag,
  MapPin,
  Heart,
  Shirt,
  Package,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatPriceSimple, cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

interface User {
  id: number;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'user' | 'admin' | 'staff';
  isActive: boolean;
  dateOfBirth?: string;
  gender?: string;
  preferredOccasions?: string[];
  preferredFabrics?: string[];
  sizePreferences?: {
    top?: string;
    bottom?: string;
    dress?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  orderCount: number;
  totalSpent: number;
}

const getRoleInfo = (role: string) => {
  switch (role) {
    case 'admin':
      return { label: 'Admin', icon: Crown, color: 'text-purple-500', bg: 'bg-purple-500/10' };
    case 'staff':
      return { label: 'Staff', icon: Shield, color: 'text-green-500', bg: 'bg-green-500/10' };
    default:
      return { label: 'Customer', icon: UserIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' };
  }
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const toast = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/admin/users/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error('Failed to fetch user');
      }

      const result = await response.json();
      setUser(result.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Failed to load user details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;

    try {
      setIsUpdatingStatus(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/admin/users/${userId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            isActive: !user.isActive
          })
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to update user status');
      }

      const result = await response.json();
      setUser(prev => prev ? { ...prev, isActive: result.data.user.isActive } : null);
      
      toast.success(`User ${result.data.user.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-secondary rounded animate-pulse"></div>
          <div>
            <div className="h-8 bg-secondary rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-secondary rounded w-32 animate-pulse"></div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-secondary rounded w-40"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-secondary rounded"></div>
                ))}
              </div>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 bg-secondary rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Not Found</h1>
          </div>
        </div>
        
        <div className="text-center py-12">
          <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">User Not Found</h3>
          <p className="text-muted-foreground mb-4">
            {error || 'The user you are looking for does not exist or has been removed.'}
          </p>
          <Button onClick={() => router.push('/admin/users')}>
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  const roleInfo = getRoleInfo(user.role);
  const RoleIcon = roleInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
              <span className="text-lg font-medium text-primary">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href={`/admin/users/${user.id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit User
            </Button>
          </Link>
          
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            disabled={isUpdatingStatus}
            className={cn(
              "gap-2",
              user.isActive 
                ? "text-destructive hover:text-destructive hover:bg-destructive/10" 
                : "text-success hover:text-success hover:bg-success/10"
            )}
          >
            {isUpdatingStatus ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : user.isActive ? (
              <Ban className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {user.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      {/* Status and Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Role */}
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", roleInfo.bg)}>
              <RoleIcon className={cn("h-5 w-5", roleInfo.color)} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-semibold text-foreground">{roleInfo.label}</p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              user.isActive ? "bg-success/10" : "bg-destructive/10"
            )}>
              {user.isActive ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <Ban className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-semibold text-foreground">
                {user.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>

        {/* Orders (for customers) */}
        {user.role === 'user' && (
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ShoppingBag className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Orders</p>
                <p className="font-semibold text-foreground">{user.orderCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* Total Spent (for customers) */}
        {user.role === 'user' && user.totalSpent > 0 && (
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Package className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="font-semibold text-foreground">{formatPriceSimple(user.totalSpent)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Details */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">User Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-primary" />
              Personal Information
            </h3>
            
            <div className="space-y-3 pl-6">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-24">Name:</span>
                <span className="text-sm text-foreground">{user.name}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground w-20">Email:</span>
                <span className="text-sm text-foreground">{user.email}</span>
              </div>
              
              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground w-20">Phone:</span>
                  <span className="text-sm text-foreground">{user.phone}</span>
                </div>
              )}
              
              {user.dateOfBirth && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground w-20">Birthday:</span>
                  <span className="text-sm text-foreground">
                    {new Date(user.dateOfBirth).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {user.gender && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-24">Gender:</span>
                  <span className="text-sm text-foreground">
                    {user.gender.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Account Information
            </h3>
            
            <div className="space-y-3 pl-6">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-24">Created:</span>
                <span className="text-sm text-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-24">Updated:</span>
                <span className="text-sm text-foreground">
                  {new Date(user.updatedAt).toLocaleDateString()}
                </span>
              </div>
              
              {user.lastLogin && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-24">Last Login:</span>
                  <span className="text-sm text-foreground">
                    {new Date(user.lastLogin).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Preferences (only for customers) */}
      {user.role === 'user' && (user.preferredOccasions?.length || user.preferredFabrics?.length || Object.keys(user.sizePreferences || {}).length) && (
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">Customer Preferences</h2>
          
          <div className="space-y-6">
            {/* Preferred Occasions */}
            {user.preferredOccasions?.length && (
              <div>
                <h3 className="font-medium text-foreground flex items-center gap-2 mb-3">
                  <Heart className="h-4 w-4 text-primary" />
                  Preferred Occasions
                </h3>
                <div className="flex flex-wrap gap-2 pl-6">
                  {user.preferredOccasions.map(occasion => (
                    <span
                      key={occasion}
                      className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                    >
                      {occasion.charAt(0).toUpperCase() + occasion.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preferred Fabrics */}
            {user.preferredFabrics?.length && (
              <div>
                <h3 className="font-medium text-foreground flex items-center gap-2 mb-3">
                  <Shirt className="h-4 w-4 text-primary" />
                  Preferred Fabrics
                </h3>
                <div className="flex flex-wrap gap-2 pl-6">
                  {user.preferredFabrics.map(fabric => (
                    <span
                      key={fabric}
                      className="px-3 py-1 bg-blue-500/10 text-blue-500 text-sm rounded-full"
                    >
                      {fabric.charAt(0).toUpperCase() + fabric.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Size Preferences */}
            {user.sizePreferences && Object.keys(user.sizePreferences).length > 0 && (
              <div>
                <h3 className="font-medium text-foreground flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  Size Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                  {user.sizePreferences.top && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Top:</span>
                      <span className="text-sm font-medium text-foreground">{user.sizePreferences.top}</span>
                    </div>
                  )}
                  {user.sizePreferences.bottom && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Bottom:</span>
                      <span className="text-sm font-medium text-foreground">{user.sizePreferences.bottom}</span>
                    </div>
                  )}
                  {user.sizePreferences.dress && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Dress:</span>
                      <span className="text-sm font-medium text-foreground">{user.sizePreferences.dress}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}