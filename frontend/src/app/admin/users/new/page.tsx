'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserPlus, 
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  Crown,
  User as UserIcon,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

interface CreateUserForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'user' | 'admin' | 'staff';
  dateOfBirth: string;
  gender: string;
  preferredOccasions: string[];
  preferredFabrics: string[];
  sizePreferences: {
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

const OCCASION_OPTIONS = [
  'wedding', 'festival', 'party', 'casual', 'office', 'traditional', 'modern', 'formal'
];

const FABRIC_OPTIONS = [
  'silk', 'cotton', 'georgette', 'chiffon', 'velvet', 'net', 'crepe', 'satin', 'linen', 'wool'
];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function NewUserPage() {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateUserForm>>({});
  
  const [formData, setFormData] = useState<CreateUserForm>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'user',
    dateOfBirth: '',
    gender: '',
    preferredOccasions: [],
    preferredFabrics: [],
    sizePreferences: {}
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateUserForm> = {};

    // Required fields
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password';
    else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required. Please login again.');
        router.push('/admin/login');
        return;
      }

      const submitData = {
        ...formData,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        phone: formData.phone || undefined,
        preferredOccasions: formData.preferredOccasions.length > 0 ? formData.preferredOccasions : undefined,
        preferredFabrics: formData.preferredFabrics.length > 0 ? formData.preferredFabrics : undefined,
        sizePreferences: Object.keys(formData.sizePreferences).length > 0 ? formData.sizePreferences : undefined
      };

      // Remove confirmPassword from submit data
      const { confirmPassword, ...dataToSubmit } = submitData;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSubmit)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create user');
      }

      toast.success('User created successfully!');
      router.push('/admin/users');
    } catch (error) {
      console.error('Create user error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleArrayToggle = (field: 'preferredOccasions' | 'preferredFabrics', value: string) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return { ...prev, [field]: newArray };
    });
  };

  const handleSizeChange = (type: keyof typeof formData.sizePreferences, value: string) => {
    setFormData(prev => ({
      ...prev,
      sizePreferences: {
        ...prev.sizePreferences,
        [type]: value || undefined
      }
    }));
  };

  const selectedRole = ROLE_OPTIONS.find(role => role.value === formData.role);

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
          <h1 className="text-2xl font-bold text-foreground">Add New User</h1>
          <p className="text-muted-foreground">Create a new user account with role assignment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground",
                  errors.email ? "border-destructive" : "border-border"
                )}
                placeholder="user@example.com"
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
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                placeholder="+91 9876543210"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground",
                  errors.firstName ? "border-destructive" : "border-border"
                )}
                placeholder="John"
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
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground",
                  errors.lastName ? "border-destructive" : "border-border"
                )}
                placeholder="Doe"
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
                value={formData.dateOfBirth}
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
                value={formData.gender}
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

        {/* Password */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Password
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground",
                    errors.password ? "border-destructive" : "border-border"
                  )}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground",
                    errors.confirmPassword ? "border-destructive" : "border-border"
                  )}
                  placeholder="Confirm password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Role Assignment
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ROLE_OPTIONS.map((role) => {
              const Icon = role.icon;
              const isSelected = formData.role === role.value;
              
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
        {formData.role === 'user' && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Customer Preferences
            </h2>
            
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
                        formData.preferredOccasions.includes(occasion)
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
                        formData.preferredFabrics.includes(fabric)
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
                      value={formData.sizePreferences.top || ''}
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
                      value={formData.sizePreferences.bottom || ''}
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
                      value={formData.sizePreferences.dress || ''}
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
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create User
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}