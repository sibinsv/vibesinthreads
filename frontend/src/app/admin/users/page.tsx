'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Users,
  UserPlus,
  Crown,
  Calendar,
  Mail,
  ShoppingBag,
  Ban,
  CheckCircle,
  Key
} from 'lucide-react';
import { User, userService, UserFilters } from '@/lib/api/users';
import { Button } from '@/components/ui/Button';
import { formatPriceSimple, cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ResetPasswordModal } from '@/components/ui/ResetPasswordModal';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    userId: number | null;
    userName: string;
  }>({ isOpen: false, userId: null, userName: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    isOpen: boolean;
    userId: number | null;
    userName: string;
  }>({ isOpen: false, userId: null, userName: '' });

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const currentFilters = {
          ...filters,
          search: searchTerm || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined
        };

        const response = await userService.getUsers(currentFilters);
        
        if (response.success && response.data) {
          setUsers(response.data.users);
          setTotalUsers(response.data.pagination.totalCount);
          setTotalPages(response.data.pagination.totalPages);
        } else {
          console.error('Failed to fetch users:', response.message);
          setUsers([]);
          setTotalUsers(0);
          setTotalPages(0);
          
          // Handle authentication errors
          if (response.message?.includes('Authentication') || response.message?.includes('Unauthorized')) {
            toast.error('Please login again to continue');
            window.location.href = '/admin/login';
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
        setTotalUsers(0);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [filters, roleFilter, statusFilter, searchTerm]);

  const handleToggleStatus = async (userId: number, newStatus: boolean) => {
    try {
      const response = await userService.toggleUserStatus(userId, newStatus);
      
      if (response.success) {
        setUsers(prev => 
          prev.map(user => 
            user.id === userId 
              ? { ...user, isActive: newStatus }
              : user
          )
        );
        toast.success(response.message || `User ${newStatus ? 'activated' : 'deactivated'} successfully`);
      } else {
        throw new Error(response.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user status');
    }
  };

  const handleDeleteUser = (userId: number) => {
    const user = users.find(u => u.id === userId);
    setDeleteModal({
      isOpen: true,
      userId,
      userName: user?.name || 'Unknown User'
    });
  };

  const handleResetPassword = (userId: number) => {
    const user = users.find(u => u.id === userId);
    setResetPasswordModal({
      isOpen: true,
      userId,
      userName: user?.name || 'Unknown User'
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.userId) return;
    
    setIsDeleting(true);
    try {
      const response = await userService.deleteUser(deleteModal.userId);
      
      if (response.success) {
        setUsers(prev => prev.filter(user => user.id !== deleteModal.userId));
        toast.success(response.message || 'User deleted successfully');
      } else {
        throw new Error(response.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, userId: null, userName: '' });
    }
  };

  const handleSelectUser = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  // Since filtering is now done on the server, we can use users directly
  const filteredUsers = users;

  const customerUsers = users.filter(u => u.role === 'user');
  const adminUsers = users.filter(u => u.role === 'admin');
  const activeUsers = users.filter(u => u.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">Manage customer accounts and administrators</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/users/new">
            <Button variant="outline" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-lg font-semibold text-foreground">{users.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ShoppingBag className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customers</p>
              <p className="text-lg font-semibold text-foreground">{customerUsers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Crown className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Admins</p>
              <p className="text-lg font-semibold text-foreground">{adminUsers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-lg font-semibold text-foreground">{activeUsers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
          >
            <option value="">All Roles</option>
            <option value="customer">Customers</option>
            <option value="admin">Admins</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Sort */}
          <select
            value={`${filters.sortBy}_${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('_');
              setFilters(prev => ({ ...prev, sortBy, sortOrder: sortOrder as 'asc' | 'desc', page: 1 }));
            }}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
          >
            <option value="createdAt_desc">Newest First</option>
            <option value="createdAt_asc">Oldest First</option>
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
            <option value="totalSpent_desc">Highest Spent</option>
            <option value="totalSpent_asc">Lowest Spent</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className="mt-4 p-4 bg-accent rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary">
                {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Activate Selected
                </Button>
                <Button variant="outline" size="sm">
                  Deactivate Selected
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
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
          Showing {filteredUsers.length} of {totalUsers} users
        </span>
        <span>
          Page {filters.page} of {totalPages}
        </span>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-secondary rounded"></div>
                  <div className="w-12 h-12 bg-secondary rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-secondary rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-secondary rounded w-1/2"></div>
                  </div>
                  <div className="h-4 bg-secondary rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-primary">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {user.name}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          {user.lastLogin && (
                            <p className="text-xs text-muted-foreground">
                              Last login: {new Date(user.lastLogin).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full",
                        user.role === 'admin'
                          ? "bg-purple-500/10 text-purple-500"
                          : "bg-blue-500/10 text-blue-500"
                      )}>
                        {user.role === 'admin' ? <Crown className="h-3 w-3" /> : <ShoppingBag className="h-3 w-3" />}
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full",
                        user.isActive
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      )}>
                        {user.isActive ? <CheckCircle className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {user.role === 'customer' ? (
                        <div className="flex items-center gap-1">
                          <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                          {user.orderCount || 0}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {user.role === 'customer' && user.totalSpent ? (
                        formatPriceSimple(user.totalSpent)
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/users/${user.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/users/${user.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(user.id, !user.isActive)}
                          className={user.isActive ? "text-destructive hover:text-destructive" : "text-success hover:text-success"}
                        >
                          {user.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                        {user.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(user.id)}
                            className="text-orange-600 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                        )}
                        {user.role !== 'admin' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
            <p className="text-muted-foreground">
              {searchTerm || roleFilter || statusFilter ? 'Try adjusting your search or filters' : 'Users will appear here as they register'}
            </p>
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
              onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
              disabled={filters.page === 1}
            >
              Previous
            </Button>
            
            <span className="text-sm text-muted-foreground px-4">
              Page {filters.page} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, page: Math.min(totalPages, (prev.page || 1) + 1) }))}
              disabled={filters.page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => !isDeleting && setDeleteModal({ isOpen: false, userId: null, userName: '' })}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteModal.userName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Reset Password Modal */}
      {resetPasswordModal.userId && (
        <ResetPasswordModal
          isOpen={resetPasswordModal.isOpen}
          onClose={() => setResetPasswordModal({ isOpen: false, userId: null, userName: '' })}
          onSuccess={() => {
            // Refresh users list after successful password reset
            const fetchUsers = async () => {
              setIsLoading(true);
              try {
                const currentFilters = {
                  ...filters,
                  search: searchTerm || undefined,
                  role: roleFilter || undefined,
                  status: statusFilter || undefined
                };
                const response = await userService.getUsers(currentFilters);
                if (response.success && response.data) {
                  setUsers(response.data.users || []);
                  setTotalUsers(response.data.pagination?.totalCount || 0);
                  setTotalPages(response.data.pagination?.totalPages || 0);
                }
              } catch (error) {
                console.error('Error fetching users:', error);
              } finally {
                setIsLoading(false);
              }
            };
            fetchUsers();
          }}
          userId={resetPasswordModal.userId}
          userName={resetPasswordModal.userName}
        />
      )}
    </div>
  );
}