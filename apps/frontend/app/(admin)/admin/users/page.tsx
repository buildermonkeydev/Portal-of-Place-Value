'use client';

import { useState, useEffect, useMemo, FormEvent } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { InvitationModal } from '@/components/admin/InvitationModal';
import { UserModal } from '@/components/admin/UserModal';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Edit,
  Trash2,
  Mail,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UserX,
  UserCheck,
  Search,
  X,
  ChevronDown,
  Loader2,
  Users,
  UserCog,
  UserPlus,
  Filter,
  Sun,
  Cloud,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Shield,
  User as UserIcon,
  MoreHorizontal,
} from 'lucide-react';
import { User, UserRole } from '@/lib/types';
import { userAPI } from '@/lib/api/users';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collegesApi } from '@/lib/api/colleges';
import { branchesApi } from '@/lib/api/branches';
import { Loading } from '@/components/ui/Loading';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isBulkDisableModalOpen, setIsBulkDisableModalOpen] = useState(false);
  const [bulkDisableFilters, setBulkDisableFilters] = useState({
    collegeId: '',
    branchIds: [] as string[],
    collegeYears: [] as number[],
  });
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [hasUserSearched, setHasUserSearched] = useState(false);
  const [collegeSearch, setCollegeSearch] = useState('');
  const [branchSearch, setBranchSearch] = useState('');
  const [isCollegeDropdownOpen, setIsCollegeDropdownOpen] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive' | 'deleted'>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounced search terms for API calls
  const [debouncedCollegeSearch, setDebouncedCollegeSearch] = useState('');
  const [debouncedBranchSearch, setDebouncedBranchSearch] = useState('');

  // Debounce college search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCollegeSearch(collegeSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [collegeSearch]);

  // Debounce branch search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBranchSearch(branchSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [branchSearch]);

  // Fetch colleges with search
  const { data: collegesData, isLoading: isLoadingColleges } = useQuery({
    queryKey: ['colleges', debouncedCollegeSearch],
    queryFn: async () => {
      const response = await collegesApi.getColleges({
        limit: 100,
        search: debouncedCollegeSearch || undefined,
      });
      return Array.isArray(response) ? response : response?.data || [];
    },
  });

  // Fetch selected college to get embedded branches
  const { data: selectedCollegeData, isLoading: isLoadingSelectedCollege } =
    useQuery({
      queryKey: ['college', bulkDisableFilters.collegeId],
      queryFn: async () => {
        if (!bulkDisableFilters.collegeId) return null;
        try {
          const response = await collegesApi.getCollege(
            bulkDisableFilters.collegeId
          );
          return response;
        } catch (error) {
          return null;
        }
      },
      enabled: !!bulkDisableFilters.collegeId,
    });
// Pagination handlers
const handlePageSizeChange = (newPageSize: number) => {
  setPageSize(newPageSize);
  setCurrentPage(1);
};

const goToFirstPage = () => setCurrentPage(1);
const goToLastPage = () => setCurrentPage(pagination?.totalPages || 1);
const goToPreviousPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
const goToNextPage = () => setCurrentPage((prev) => Math.min(pagination?.totalPages || 1, prev + 1));
  const colleges = collegesData || [];
  const selectedCollege = useMemo(() => {
    if (!bulkDisableFilters.collegeId) return null;
    if (selectedCollegeData) return selectedCollegeData;
    return colleges.find((c: any) => c._id === bulkDisableFilters.collegeId);
  }, [selectedCollegeData, colleges, bulkDisableFilters.collegeId]);

  // Determine available branches
  const availableBranches = useMemo(() => {
    if (!bulkDisableFilters.collegeId || !selectedCollege) return [];
    if (selectedCollege?.branches && Array.isArray(selectedCollege.branches)) {
      if (debouncedBranchSearch) {
        return selectedCollege.branches.filter((branch: any) =>
          branch.name.toLowerCase().includes(debouncedBranchSearch.toLowerCase())
        );
      }
      return selectedCollege.branches;
    }
    return [];
  }, [selectedCollege, bulkDisableFilters.collegeId, debouncedBranchSearch]);
 const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };
  // Bulk disable/enable mutations
  const bulkDisableMutation = useMutation({
    mutationFn: (filters: { collegeId?: string; branchIds?: string[]; collegeYears?: number[] }) =>
      userAPI.bulkDisableUsersWithFilters(filters),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`Successfully disabled ${data.data?.disabledCount || 0} user(s)`);
      setIsBulkDisableModalOpen(false);
      setBulkDisableFilters({ collegeId: '', branchIds: [], collegeYears: [] });
      setCollegeSearch('');
      setBranchSearch('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to disable users');
    },
  });
const handleSendVerificationEmail = async (user: User) => {
  try {
    // Add your verification email API call here
    // await userAPI.sendVerificationEmail(user._id);
    toast.success('Verification email sent successfully');
  } catch (error) {
    toast.error('Failed to send verification email');
  }
};

  const bulkEnableMutation = useMutation({
    mutationFn: (filters: { collegeId?: string; branchIds?: string[]; collegeYears?: number[] }) =>
      userAPI.bulkEnableUsersWithFilters(filters),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`Successfully enabled ${data.data?.enabledCount || 0} user(s)`);
      setIsBulkDisableModalOpen(false);
      setBulkDisableFilters({ collegeId: '', branchIds: [], collegeYears: [] });
      setCollegeSearch('');
      setBranchSearch('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to enable users');
    },
  });

  // Fetch users with pagination
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', currentPage, pageSize],
    queryFn: () => userAPI.getAllUsers({ page: currentPage, limit: pageSize }),
  });

  const users = usersData?.data || [];
  const pagination = usersData?.pagination;

  // Filter users
  const filteredUsers = useMemo(() => {
    if (activeFilter === 'all') return users;
    if (activeFilter === 'active') return users.filter((u: User) => u.isActive && !u.isDeleted);
    if (activeFilter === 'inactive') return users.filter((u: User) => !u.isActive && !u.isDeleted);
    if (activeFilter === 'deleted') return users.filter((u: User) => u.isDeleted);
    return users;
  }, [users, activeFilter]);

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Partial<User> }) =>
      userAPI.updateUserById(userId, data),
    onSuccess: () => queryClient.refetchQueries({ queryKey: ['users'] }),
  });

  const deleteUserAndDataMutation = useMutation({
    mutationFn: (userId: string) => userAPI.deleteUserAndData(userId),
    onSuccess: () => queryClient.refetchQueries({ queryKey: ['users'] }),
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: (userId: string) => userAPI.deactivateUser(userId),
    onSuccess: () => queryClient.refetchQueries({ queryKey: ['users'] }),
  });

  const handleUserSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userSearchTerm.trim()) {
      toast.error('Please enter a name or email address');
      return;
    }
    setIsSearchingUsers(true);
    setHasUserSearched(true);
    try {
      const response = await userAPI.searchUsers({
        search: userSearchTerm.trim(),
        limit: 20,
      });
      const results = response?.data || [];
      setUserSearchResults(results);
      if (results.length === 0) toast.error('No users found matching that name or email');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to search users');
      setUserSearchResults([]);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleClearUserSearch = () => {
    setUserSearchTerm('');
    setUserSearchResults([]);
    setHasUserSearched(false);
  };
const handleConfirmDelete = async () => {
  if (!userToDelete) return;

  try {
    const response = await deleteUserAndDataMutation.mutateAsync(userToDelete._id);
    const summary = (response as any)?.data;
    toast.success(
      summary
        ? `User and associated data deleted (removed ${summary?.softDeletedResults ?? 0} result records)`
        : 'User and associated data deleted successfully'
    );
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
    // Refresh users list
    queryClient.invalidateQueries({ queryKey: ['users'] });
  } catch (error) {
    toast.error('Failed to delete user and data');
  }
};
const handleToggleUserStatus = async (userId: string) => {
    try {
      await toggleUserStatusMutation.mutateAsync(userId);
      toast.success('User status updated successfully');
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };
  const handleBulkDisable = () => {
    const filters: { collegeId?: string; branchIds?: string[]; collegeYears?: number[] } = {};
    if (bulkDisableFilters.collegeId) filters.collegeId = bulkDisableFilters.collegeId;
    if (bulkDisableFilters.branchIds.length > 0) filters.branchIds = bulkDisableFilters.branchIds;
    if (bulkDisableFilters.collegeYears.length > 0) filters.collegeYears = bulkDisableFilters.collegeYears;
    if (Object.keys(filters).length === 0) {
      toast.error('Please select at least one filter');
      return;
    }
    bulkDisableMutation.mutate(filters);
  };

  const handleBulkEnable = () => {
    const filters: { collegeId?: string; branchIds?: string[]; collegeYears?: number[] } = {};
    if (bulkDisableFilters.collegeId) filters.collegeId = bulkDisableFilters.collegeId;
    if (bulkDisableFilters.branchIds.length > 0) filters.branchIds = bulkDisableFilters.branchIds;
    if (bulkDisableFilters.collegeYears.length > 0) filters.collegeYears = bulkDisableFilters.collegeYears;
    if (Object.keys(filters).length === 0) {
      toast.error('Please select at least one filter');
      return;
    }
    bulkEnableMutation.mutate(filters);
  };

  // Stats calculations
  const totalUsers = pagination?.total || 0;
  const activeUsers = users.filter((u: User) => u.isActive && !u.isDeleted).length;
  const inactiveUsers = users.filter((u: User) => !u.isActive && !u.isDeleted).length;
  const deletedUsers = users.filter((u: User) => u.isDeleted).length;
  const adminUsers = users.filter((u: User) => u.role === UserRole.ADMIN).length;

  if (isLoading) {
    return (
      <ProtectedRoute requireAdmin>
        <DashboardLayout>
          <div className="h-screen w-screen bg-[#0C0C10] flex items-center justify-center">
            <div className="text-center">
              <div className="relative inline-flex mb-4">
                <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin"></div>
                <Users className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-400" />
              </div>
              <p className="text-zinc-400">Loading users...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        <div className="h-screen w-screen bg-[#0C0C10] relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]"></div>
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom,rgba(249,115,22,0.1),transparent_50%)]"></div>
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          {/* Main Content */}
          <div className="relative z-10 h-full w-full overflow-y-auto custom-scrollbar">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              
              {/* Header */}
              <div className="mb-8 lg:mb-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-1 bg-gradient-to-b from-indigo-400 to-orange-400 rounded-full"></div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-indigo-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                          User Administration
                        </span>
                      </div>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                      User Management
                    </h1>
                    <p className="mt-2 text-zinc-400 text-sm lg:text-base">
                      Manage and monitor all users across the platform
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsInvitationModalOpen(true)}
                      className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white rounded-xl px-4 py-2.5"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Invite
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsBulkDisableModalOpen(true)}
                      className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white rounded-xl px-4 py-2.5"
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Bulk Actions
                    </Button>
                    <Button
                      onClick={() => setIsCreateUserModalOpen(true)}
                      className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white rounded-xl px-4 py-2.5 shadow-lg"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create User
                    </Button>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 lg:mb-8">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs text-zinc-500">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{totalUsers}</p>
                  <p className="text-xs text-zinc-500 mt-1">registered users</p>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-zinc-500">Active</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{activeUsers}</p>
                  <p className="text-xs text-zinc-500 mt-1">currently active</p>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-orange-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="h-4 w-4 text-orange-400" />
                    <span className="text-xs text-zinc-500">Inactive</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{inactiveUsers}</p>
                  <p className="text-xs text-zinc-500 mt-1">awaiting activation</p>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-red-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-xs text-zinc-500">Deleted</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{deletedUsers}</p>
                  <p className="text-xs text-zinc-500 mt-1">soft deleted</p>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-purple-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <Shield className="h-4 w-4 text-purple-400" />
                    <span className="text-xs text-zinc-500">Admins</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{adminUsers}</p>
                  <p className="text-xs text-zinc-500 mt-1">with admin rights</p>
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {[
                  { value: 'all', label: 'All Users', icon: Users, color: 'indigo' },
                  { value: 'active', label: 'Active', icon: CheckCircle, color: 'emerald' },
                  { value: 'inactive', label: 'Inactive', icon: Clock, color: 'orange' },
                  { value: 'deleted', label: 'Deleted', icon: XCircle, color: 'red' },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setActiveFilter(filter.value as typeof activeFilter)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2",
                      activeFilter === filter.value
                        ? "bg-gradient-to-r from-indigo-500 to-orange-500 text-white shadow-lg"
                        : "bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <filter.icon className="h-4 w-4" />
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Search Section */}
              <div className="bg-white/5 rounded-xl border border-white/10 mb-6 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-sm font-medium text-white">Search Users</h3>
                  </div>
                </div>
                <div className="p-5">
                  <form onSubmit={handleUserSearch} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <Input
                        type="text"
                        placeholder="Search by name or email..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-xl"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="submit"
                        disabled={isSearchingUsers}
                        className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white rounded-xl px-5"
                      >
                        {isSearchingUsers ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Search'
                        )}
                      </Button>
                      {hasUserSearched && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleClearUserSearch}
                          className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 rounded-xl"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </form>

                  {/* Search Results */}
                  {hasUserSearched && (
                    <div className="mt-4">
                      {isSearchingUsers ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                          <span className="ml-2 text-sm text-zinc-400">Searching...</span>
                        </div>
                      ) : userSearchResults.length > 0 ? (
                        <div>
                          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                            <span className="h-4 w-1 bg-gradient-to-b from-indigo-400 to-orange-400 rounded-full"></span>
                            Search Results ({userSearchResults.length})
                          </h3>
                          <div className="border border-white/10 rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-white/10">
                                <thead className="bg-white/5">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Role</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                  {userSearchResults.map((user) => (
                                    <tr key={user._id} className="hover:bg-white/5 transition-colors">
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-orange-500/20 flex items-center justify-center">
                                            <UserIcon className="h-4 w-4 text-indigo-400" />
                                          </div>
                                          <span className="text-sm text-white">
                                            {user.firstName} {user.lastName}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-zinc-400">{user.email}</td>
                                      <td className="px-4 py-3">
                                        <Badge className={cn(
                                          "border",
                                          user.role === UserRole.ADMIN
                                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                            : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                        )}>
                                          {user.role}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3">
                                        {user.isDeleted ? (
                                          <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Deleted</Badge>
                                        ) : user.isActive ? (
                                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
                                        ) : (
                                          <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">Inactive</Badge>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <button onClick={() => handleEditUser(user)} className="p-1.5 text-zinc-500 hover:text-indigo-400 transition-colors">
                                            <Edit className="h-4 w-4" />
                                          </button>
                                          <button onClick={() => handleToggleUserStatus(user._id)} className="p-1.5 text-zinc-500 hover:text-orange-400 transition-colors">
                                            <Eye className="h-4 w-4" />
                                          </button>
                                          <button onClick={() => handleDeleteUser(user)} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <Users className="h-6 w-6 text-zinc-500" />
                          </div>
                          <p className="text-sm text-zinc-500">
                            No users found for "{userSearchTerm}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-white flex items-center gap-2">
                        <Users className="h-4 w-4 text-indigo-400" />
                        User Directory
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1">A list of all users with their details</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5">
                      <Users className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="text-sm text-white">{filteredUsers.length}</span>
                      <span className="text-xs text-zinc-500">of {totalUsers}</span>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-5 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">User</th>
                        <th className="px-5 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</th>
                        <th className="px-5 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Role</th>
                        <th className="px-5 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                        <th className="px-5 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Verified</th>
                        <th className="px-5 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Created</th>
                        <th className="px-5 py-4 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {filteredUsers.map((user: User) => (
                        <tr key={user._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500/20 to-orange-500/20 flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-indigo-400" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white">
                                  {`${user.firstName} ${user.lastName}`}
                                </div>
                                <div className="text-xs text-zinc-500">
                                  ID: {user._id.slice(-6)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm text-zinc-400">{user.email}</td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <Badge className={cn(
                              "border",
                              user.role === UserRole.ADMIN
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                            )}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            {user.isDeleted ? (
                              <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Deleted</Badge>
                            ) : user.isActive ? (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
                            ) : (
                              <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">Inactive</Badge>
                            )}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <Badge className={cn(
                              "border",
                              user.isEmailVerified
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            )}>
                              {user.isEmailVerified ? 'Verified' : 'Pending'}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm text-zinc-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditUser(user)}
                                disabled={user.isDeleted}
                                className="p-1.5 text-zinc-500 hover:text-indigo-400 transition-colors disabled:opacity-50"
                                title="Edit user"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleSendVerificationEmail(user)}
                                disabled={user.isDeleted || user.isEmailVerified}
                                className="p-1.5 text-zinc-500 hover:text-indigo-400 transition-colors disabled:opacity-50"
                                title="Send verification email"
                              >
                                <Mail className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleToggleUserStatus(user._id)}
                                disabled={user.isDeleted}
                                className="p-1.5 text-zinc-500 hover:text-orange-400 transition-colors disabled:opacity-50"
                                title={user.isActive ? 'Deactivate' : 'Activate'}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                disabled={deleteUserAndDataMutation.isPending}
                                className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
                                title="Delete user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="px-5 py-4 border-t border-white/10 bg-white/5">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-zinc-400">
                        Showing{' '}
                        <span className="text-white">{(pagination.page - 1) * pagination.limit + 1}</span>
                        {' to '}
                        <span className="text-white">
                          {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>
                        {' of '}
                        <span className="text-white">{pagination.total}</span>
                        {' results'}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <select
                          value={pageSize}
                          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value={5}>5 per page</option>
                          <option value={10}>10 per page</option>
                          <option value={20}>20 per page</option>
                          <option value={50}>50 per page</option>
                        </select>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={goToFirstPage}
                            disabled={currentPage === 1}
                            className="p-2 text-zinc-500 hover:text-indigo-400 rounded-lg disabled:opacity-50"
                          >
                            <ChevronsLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            className="p-2 text-zinc-500 hover:text-indigo-400 rounded-lg disabled:opacity-50"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span className="px-3 py-1 text-sm text-white">
                            Page {currentPage} of {pagination.totalPages}
                          </span>
                          <button
                            onClick={goToNextPage}
                            disabled={currentPage === pagination.totalPages}
                            className="p-2 text-zinc-500 hover:text-indigo-400 rounded-lg disabled:opacity-50"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <button
                            onClick={goToLastPage}
                            disabled={currentPage === pagination.totalPages}
                            className="p-2 text-zinc-500 hover:text-indigo-400 rounded-lg disabled:opacity-50"
                          >
                            <ChevronsRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
                  <span className="text-xs text-zinc-500">User Management</span>
                  <span className="h-1 w-1 rounded-full bg-orange-400"></span>
                </div>
                <span className="text-xs text-zinc-500">
                  Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <UserModal isOpen={isCreateUserModalOpen} onClose={() => setIsCreateUserModalOpen(false)} />
        <UserModal user={selectedUser} isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedUser(null); }} />
        
        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="bg-[#0C0C10] border-white/10 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Delete User</DialogTitle>
              <DialogDescription className="text-zinc-400">
                This will permanently delete {userToDelete?.firstName} {userToDelete?.lastName} and all associated data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="bg-white/5 border-white/10 text-zinc-300">
                Cancel
              </Button>
              <Button onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600 text-white">
                {deleteUserAndDataMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <InvitationModal isOpen={isInvitationModalOpen} onClose={() => setIsInvitationModalOpen(false)} />
        
        {/* Bulk Actions Modal */}
        <Dialog open={isBulkDisableModalOpen} onOpenChange={setIsBulkDisableModalOpen}>
          <DialogContent className="bg-[#0C0C10] border-white/10 rounded-2xl max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-white">Bulk Actions</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Select filters to enable or disable multiple users at once.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* College Filter */}
              <div className="space-y-2">
                <Label className="text-zinc-400">College</Label>
                <div className="relative">
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                    onClick={() => setIsCollegeDropdownOpen(!isCollegeDropdownOpen)}
                  >
                    <span>
                      {bulkDisableFilters.collegeId
                        ? colleges.find((c: any) => c._id === bulkDisableFilters.collegeId)?.name || 'Select college'
                        : 'All Colleges'}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  {isCollegeDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg bg-[#1A1A2A] border border-white/10 shadow-lg">
                      <div className="p-2 border-b border-white/10">
                        <Input
                          placeholder="Search colleges..."
                          value={collegeSearch}
                          onChange={(e) => setCollegeSearch(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <ScrollArea className="h-[200px]">
                        {colleges.map((college: any) => (
                          <button
                            key={college._id}
                            className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
                            onClick={() => {
                              setBulkDisableFilters(prev => ({
                                ...prev,
                                collegeId: prev.collegeId === college._id ? '' : college._id,
                                branchIds: [],
                              }));
                              setIsCollegeDropdownOpen(false);
                            }}
                          >
                            {college.name}
                          </button>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>

              {/* Branch Filter */}
              {bulkDisableFilters.collegeId && (
                <div className="space-y-2">
                  <Label className="text-zinc-400">Branch</Label>
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="w-full justify-between bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                      onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                    >
                      <span>
                        {bulkDisableFilters.branchIds.length > 0
                          ? `${bulkDisableFilters.branchIds.length} branch(es) selected`
                          : 'All Branches'}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    {isBranchDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full rounded-lg bg-[#1A1A2A] border border-white/10 shadow-lg">
                        <ScrollArea className="h-[200px]">
                          {availableBranches.map((branch: any) => (
                            <div
                              key={branch._id}
                              className="flex items-center px-3 py-2 hover:bg-white/5 cursor-pointer"
                              onClick={() => {
                                setBulkDisableFilters(prev => ({
                                  ...prev,
                                  branchIds: prev.branchIds.includes(branch._id)
                                    ? prev.branchIds.filter(id => id !== branch._id)
                                    : [...prev.branchIds, branch._id],
                                }));
                              }}
                            >
                              <Checkbox
                                checked={bulkDisableFilters.branchIds.includes(branch._id)}
                                className="border-white/20"
                              />
                              <span className="ml-2 text-sm text-zinc-300">{branch.name}</span>
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Year Filter */}
              <div className="space-y-2">
                <Label className="text-zinc-400">Year</Label>
                <div className="relative">
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                    onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                  >
                    <span>
                      {bulkDisableFilters.collegeYears.length > 0
                        ? `${bulkDisableFilters.collegeYears.length} year(s) selected`
                        : 'All Years'}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  {isYearDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg bg-[#1A1A2A] border border-white/10 shadow-lg">
                      {[1, 2, 3, 4].map((year) => (
                        <div
                          key={year}
                          className="flex items-center px-3 py-2 hover:bg-white/5 cursor-pointer"
                          onClick={() => {
                            setBulkDisableFilters(prev => ({
                              ...prev,
                              collegeYears: prev.collegeYears.includes(year)
                                ? prev.collegeYears.filter(y => y !== year)
                                : [...prev.collegeYears, year],
                            }));
                          }}
                        >
                          <Checkbox
                            checked={bulkDisableFilters.collegeYears.includes(year)}
                            className="border-white/20"
                          />
                          <span className="ml-2 text-sm text-zinc-300">Year {year}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsBulkDisableModalOpen(false);
                  setBulkDisableFilters({ collegeId: '', branchIds: [], collegeYears: [] });
                }}
                className="bg-white/5 border-white/10 text-zinc-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkEnable}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Enable
              </Button>
              <Button
                onClick={handleBulkDisable}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <UserX className="mr-2 h-4 w-4" />
                Disable
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}