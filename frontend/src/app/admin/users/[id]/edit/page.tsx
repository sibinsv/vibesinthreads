'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Save,
  Crown,
  User as UserIcon,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'user' | 'admin' | 'staff';
  dateOfBirth?: string;
  gender?: string;
  preferredOccasions?: string[];
  preferredFabrics?: string[];
  sizePreferences?: {
    top?: string;
    bottom?: string;
    dress?: string;
  };
}

const ROLE_OPTIONS = [
  { value: 'user', label: 'Customer', icon: UserIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { value: 'admin', label: 'Admin', icon: Crown, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { value: 'staff', label: 'Staff', icon: Shield, color: 'text-green-500', bg: 'bg-green-500/10' },
];

const GENDER_OPTIONS = ['male', 'female', 'other', 'prefer_not_to_say'];
const OCCASION_OPTIONS = ['wedding', 'festival', 'party', 'casual', 'office', 'traditional', 'modern', 'formal'];
const FABRIC_OPTIONS = ['silk', 'cotton', 'georgette', 'chiffon', 'velvet', 'net', 'crepe', 'satin', 'linen', 'wool'];
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<User>>({});

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
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
        throw new Error('Failed to fetch user');
      }

      const result = await response.json();
      setUser(result.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      alert('Failed to load user details');
      router.push('/admin/users');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!user) return false;
    
    const newErrors: Partial<User> = {};

    if (!user.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(user.email)) newErrors.email = 'Invalid email format';
    
    if (!user.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!user.lastName.trim()) newErrors.lastName = 'Last name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !validateForm()) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/admin/users/${userId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone || undefined,
            role: user.role,
            dateOfBirth: user.dateOfBirth || undefined,
            gender: user.gender || undefined,
            preferredOccasions: user.preferredOccasions?.length ? user.preferredOccasions : undefined,
            preferredFabrics: user.preferredFabrics?.length ? user.preferredFabrics : undefined,
            sizePreferences: user.sizePreferences && Object.keys(user.sizePreferences).length ? user.sizePreferences : undefined
          })
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to update user');
      }

      alert('User updated successfully!');
      router.push(`/admin/users/${userId}`);
    } catch (error) {
      console.error('Update user error:', error);
      alert(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof User, value: any) => {
    if (!user) return;
    
    setUser(prev => prev ? { ...prev, [field]: value } : null);
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleArrayToggle = (field: 'preferredOccasions' | 'preferredFabrics', value: string) => {
    if (!user) return;
    
    setUser(prev => {
      if (!prev) return null;
      
      const currentArray = prev[field] as string[] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return { ...prev, [field]: newArray };
    });
  };

  const handleSizeChange = (type: keyof NonNullable<User['sizePreferences']>, value: string) => {
    if (!user) return;
    
    setUser(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        sizePreferences: {
          ...prev.sizePreferences,
          [type]: value || undefined
        }
      };
    });
  };

  if (isLoading || !user) {
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-secondary rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit User</h1>
          <p className="text-muted-foreground">Update user information and settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={user.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground",
                  errors.email ? "border-destructive" : "border-border"
                )}
                required
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={user.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={user.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground",
                  errors.firstName ? "border-destructive" : "border-border"
                )}
                required
              />
              {errors.firstName && (
                <p className="text-sm text-destructive mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={user.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground",
                  errors.lastName ? "border-destructive" : "border-border"
                )}
                required
              />
              {errors.lastName && (
                <p className="text-sm text-destructive mt-1">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={user.dateOfBirth || ''}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Gender
              </label>
              <select
                value={user.gender || ''}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              >
                <option value="">Select Gender</option>
                {GENDER_OPTIONS.map(gender => (
                  <option key={gender} value={gender}>
                    {gender.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Role Assignment</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ROLE_OPTIONS.map((role) => {
              const Icon = role.icon;
              const isSelected = user.role === role.value;
              
              return (
                <div key={role.value} className="relative">
                  <input
                    type="radio"
                    id={`role-${role.value}`}
                    name="role"
                    value={role.value}
                    checked={isSelected}
                    onChange={(e) => handleInputChange('role', e.target.value as 'user' | 'admin' | 'staff')}
                    className="sr-only"
                  />
                  <label
                    htmlFor={`role-${role.value}`}
                    className={cn(
                      "block p-4 border-2 rounded-lg cursor-pointer transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:border-primary/50 hover:bg-accent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", role.bg)}>
                        <Icon className={cn("h-5 w-5", role.color)} />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{role.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {role.value === 'admin' && 'Full system access'}
                          {role.value === 'staff' && 'Limited admin access'}
                          {role.value === 'user' && 'Customer access'}
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Preferences (only for user role) */}
        {user.role === 'user' && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Customer Preferences</h2>
            
            <div className="space-y-6">
              {/* Preferred Occasions */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Preferred Occasions
                </label>
                <div className="flex flex-wrap gap-2">
                  {OCCASION_OPTIONS.map(occasion => (
                    <button
                      key={occasion}
                      type="button"
                      onClick={() => handleArrayToggle('preferredOccasions', occasion)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-full border transition-colors",
                        user.preferredOccasions?.includes(occasion)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:border-primary hover:bg-accent"
                      )}
                    >
                      {occasion.charAt(0).toUpperCase() + occasion.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Fabrics */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Preferred Fabrics
                </label>
                <div className="flex flex-wrap gap-2">
                  {FABRIC_OPTIONS.map(fabric => (
                    <button
                      key={fabric}
                      type="button"
                      onClick={() => handleArrayToggle('preferredFabrics', fabric)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-full border transition-colors",
                        user.preferredFabrics?.includes(fabric)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:border-primary hover:bg-accent"
                      )}
                    >
                      {fabric.charAt(0).toUpperCase() + fabric.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Preferences */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Size Preferences
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Top Size</label>
                    <select
                      value={user.sizePreferences?.top || ''}
                      onChange={(e) => handleSizeChange('top', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground text-sm"
                    >
                      <option value="">Select Size</option>
                      {SIZE_OPTIONS.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Bottom Size</label>
                    <select
                      value={user.sizePreferences?.bottom || ''}
                      onChange={(e) => handleSizeChange('bottom', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground text-sm"
                    >
                      <option value="">Select Size</option>
                      {SIZE_OPTIONS.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Dress Size</label>
                    <select
                      value={user.sizePreferences?.dress || ''}
                      onChange={(e) => handleSizeChange('dress', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground text-sm"
                    >
                      <option value="">Select Size</option>
                      {SIZE_OPTIONS.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Update User
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}