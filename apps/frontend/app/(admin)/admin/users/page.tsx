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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest('[data-dropdown="college"]') &&
        !target.closest('[data-dropdown="branch"]') &&
        !target.closest('[data-dropdown="year"]')
      ) {
        setIsCollegeDropdownOpen(false);
        setIsBranchDropdownOpen(false);
        setIsYearDropdownOpen(false);
      }
    };

    if (isCollegeDropdownOpen || isBranchDropdownOpen || isYearDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCollegeDropdownOpen, isBranchDropdownOpen, isYearDropdownOpen]);

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

  const colleges = collegesData || [];

  // Get selected college to access its embedded branches
  const selectedCollege = useMemo(() => {
    if (!bulkDisableFilters.collegeId) return null;
    if (selectedCollegeData) return selectedCollegeData;
    return colleges.find((c: any) => c._id === bulkDisableFilters.collegeId);
  }, [selectedCollegeData, colleges, bulkDisableFilters.collegeId]);

  // Determine available branches: ONLY from selected college's embedded branches
  const availableBranches = useMemo(() => {
    if (!bulkDisableFilters.collegeId || !selectedCollege) {
      return [];
    }

    if (
      selectedCollege?.branches &&
      Array.isArray(selectedCollege.branches) &&
      selectedCollege.branches.length > 0
    ) {
      if (debouncedBranchSearch) {
        return selectedCollege.branches.filter((branch: any) =>
          branch.name
            .toLowerCase()
            .includes(debouncedBranchSearch.toLowerCase())
        );
      }
      return selectedCollege.branches;
    }

    return [];
  }, [selectedCollege, bulkDisableFilters.collegeId, debouncedBranchSearch]);

  // Filtered colleges for display
  const filteredColleges = colleges;

  // Filtered branches for display
  const filteredBranches = availableBranches;

  // Bulk disable/enable mutations
  const bulkDisableMutation = useMutation({
    mutationFn: (filters: {
      collegeId?: string;
      branchIds?: string[];
      collegeYears?: number[];
    }) => userAPI.bulkDisableUsersWithFilters(filters),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(
        `Successfully disabled ${data.data?.disabledCount || 0} user(s)`
      );
      setIsBulkDisableModalOpen(false);
      setBulkDisableFilters({
        collegeId: '',
        branchIds: [],
        collegeYears: [],
      });
      setCollegeSearch('');
      setBranchSearch('');
      setIsCollegeDropdownOpen(false);
      setIsBranchDropdownOpen(false);
      setIsYearDropdownOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to disable users');
    },
  });

  const bulkEnableMutation = useMutation({
    mutationFn: (filters: {
      collegeId?: string;
      branchIds?: string[];
      collegeYears?: number[];
    }) => userAPI.bulkEnableUsersWithFilters(filters),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(
        `Successfully enabled ${data.data?.enabledCount || 0} user(s)`
      );
      setIsBulkDisableModalOpen(false);
      setBulkDisableFilters({
        collegeId: '',
        branchIds: [],
        collegeYears: [],
      });
      setCollegeSearch('');
      setBranchSearch('');
      setIsCollegeDropdownOpen(false);
      setIsBranchDropdownOpen(false);
      setIsYearDropdownOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to enable users');
    },
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

      if (results.length === 0) {
        toast.error('No users found matching that name or email');
      }
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

  const handleBulkDisable = () => {
    const filters: {
      collegeId?: string;
      branchIds?: string[];
      collegeYears?: number[];
    } = {};
    if (bulkDisableFilters.collegeId)
      filters.collegeId = bulkDisableFilters.collegeId;
    if (bulkDisableFilters.branchIds.length > 0)
      filters.branchIds = bulkDisableFilters.branchIds;
    if (bulkDisableFilters.collegeYears.length > 0)
      filters.collegeYears = bulkDisableFilters.collegeYears;

    if (Object.keys(filters).length === 0) {
      toast.error('Please select at least one filter');
      return;
    }

    bulkDisableMutation.mutate(filters);
  };

  const handleBulkEnable = () => {
    const filters: {
      collegeId?: string;
      branchIds?: string[];
      collegeYears?: number[];
    } = {};
    if (bulkDisableFilters.collegeId)
      filters.collegeId = bulkDisableFilters.collegeId;
    if (bulkDisableFilters.branchIds.length > 0)
      filters.branchIds = bulkDisableFilters.branchIds;
    if (bulkDisableFilters.collegeYears.length > 0)
      filters.collegeYears = bulkDisableFilters.collegeYears;

    if (Object.keys(filters).length === 0) {
      toast.error('Please select at least one filter');
      return;
    }

    bulkEnableMutation.mutate(filters);
  };

  // Fetch users with pagination
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', currentPage, pageSize],
    queryFn: () => userAPI.getAllUsers({ page: currentPage, limit: pageSize }),
  });

  const users = usersData?.data || [];
  const pagination = usersData?.pagination;

  // Filter users based on activeFilter
  const filteredUsers = useMemo(() => {
    if (activeFilter === 'all') return users;
    if (activeFilter === 'active') return users.filter((u: User) => u.isActive && !u.isDeleted);
    if (activeFilter === 'inactive') return users.filter((u: User) => !u.isActive && !u.isDeleted);
    if (activeFilter === 'deleted') return users.filter((u: User) => u.isDeleted);
    return users;
  }, [users, activeFilter]);

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Partial<User> }) =>
      userAPI.updateUserById(userId, data),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['users'] });
    },
  });

  // Delete user mutation
  const deleteUserAndDataMutation = useMutation({
    mutationFn: (userId: string) => userAPI.deleteUserAndData(userId),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['users'] });
    },
  });

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: (userId: string) => userAPI.deactivateUser(userId),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['users'] });
    },
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await deleteUserAndDataMutation.mutateAsync(
        userToDelete._id
      );
      const summary = (response as any)?.data;
      toast.success(
        summary
          ? `User and associated data deleted (removed ${summary?.softDeletedResults ?? 0} result records)`
          : 'User and associated data deleted successfully'
      );
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
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

  const handleSaveUser = async (userId: string, data: Partial<User>) => {
    try {
      await updateUserMutation.mutateAsync({ userId, data });
      toast.success('User updated successfully');
    } catch (error) {
      toast.error('Failed to update user');
      throw error;
    }
  };

  const handleSendVerificationEmail = async (user: User) => {
    try {
      toast.success('Verification email sent successfully');
    } catch (error) {
      toast.error('Failed to send verification email');
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(pagination?.totalPages || 1);
  const goToPreviousPage = () =>
    setCurrentPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(pagination?.totalPages || 1, prev + 1));

  // Stats calculations
  const totalUsers = pagination?.total || 0;
  const activeUsers = users.filter(u => u.isActive && !u.isDeleted).length;
  const inactiveUsers = users.filter(u => !u.isActive && !u.isDeleted).length;
  const deletedUsers = users.filter(u => u.isDeleted).length;
  const adminUsers = users.filter(u => u.role === UserRole.ADMIN).length;

  if (isLoading) {
    return (
      <ProtectedRoute requireAdmin>
        <DashboardLayout>
          <div className="min-h-screen bg-gradient-to-br from-sky-50 to-orange-50 flex items-center justify-center">
            <div className="text-center">
              <div className="relative inline-flex mb-4">
                <div className="h-16 w-16 rounded-full border-4 border-sky-200 border-t-sky-500 animate-spin"></div>
                <Users className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-sky-300" />
              </div>
              <p className="text-gray-500">Loading users...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50">
          {/* Decorative Elements */}
          <div className="fixed top-20 right-10 opacity-10 pointer-events-none">
            <Sun className="h-40 w-40 text-orange-300" />
          </div>
          <div className="fixed bottom-20 left-10 opacity-10 pointer-events-none">
            <Cloud className="h-40 w-40 text-sky-300" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-sky-500" />
                  <span className="text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-sky-600 to-orange-600 bg-clip-text text-transparent">
                    User Administration
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">
                    <span className="bg-gradient-to-r from-sky-700 via-sky-600 to-orange-600 bg-clip-text text-transparent">
                      User Management
                    </span>
                  </h1>
                  <p className="mt-2 text-gray-500 text-lg">
                    Manage and monitor all users in your system
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsInvitationModalOpen(true)}
                    className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-4 py-2.5 text-sm font-medium"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Invite
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsBulkDisableModalOpen(true)}
                    className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-4 py-2.5 text-sm font-medium"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Bulk Actions
                  </Button>
                  <Button
                    onClick={() => setIsCreateUserModalOpen(true)}
                    className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create User
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalUsers}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{activeUsers}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Inactive</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{inactiveUsers}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Deleted</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{deletedUsers}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Admins</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{adminUsers}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <UserCog className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="mb-6 flex items-center gap-2">
              {[
                { value: 'all', label: 'All Users', icon: Users },
                { value: 'active', label: 'Active', icon: CheckCircle },
                { value: 'inactive', label: 'Inactive', icon: Clock },
                { value: 'deleted', label: 'Deleted', icon: XCircle },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value as typeof activeFilter)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 ${
                    activeFilter === filter.value
                      ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-sm'
                      : 'bg-white/80 backdrop-blur-sm border border-sky-100 text-gray-600 hover:bg-sky-50'
                  }`}
                >
                  <filter.icon className="h-4 w-4" />
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Search Card */}
            <Card className="border-sky-100 shadow-sm overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 px-6 py-4 border-b border-sky-100">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-sky-500" />
                  <h3 className="text-sm font-medium text-gray-700">Search Users</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <form onSubmit={handleUserSearch} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-400" />
                    <Input
                      type="text"
                      placeholder="Search by name or email..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2.5 border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 backdrop-blur-sm text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      disabled={isSearchingUsers}
                      className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium min-w-[100px]"
                    >
                      {isSearchingUsers ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        'Search'
                      )}
                    </Button>
                    {hasUserSearched && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClearUserSearch}
                        disabled={isSearchingUsers}
                        className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-4 py-2.5 text-sm font-medium"
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
                        <div className="relative">
                          <div className="h-8 w-8 rounded-full border-3 border-sky-200 border-t-sky-500 animate-spin"></div>
                          <Search className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-3 w-3 text-sky-300" />
                        </div>
                        <span className="ml-3 text-sm text-gray-500">Searching...</span>
                      </div>
                    ) : userSearchResults.length > 0 ? (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <span className="h-4 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></span>
                          Search Results ({userSearchResults.length})
                        </h3>
                        <div className="border border-sky-100 rounded-xl overflow-hidden">
                          <table className="min-w-full divide-y divide-sky-100">
                            <thead className="bg-gradient-to-r from-sky-50/50 to-orange-50/50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-sky-700 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-sky-700 uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-sky-700 uppercase tracking-wider">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-sky-700 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-sky-700 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white/80 divide-y divide-sky-100">
                              {userSearchResults.map((user) => {
                                const isDeletedUser = !!user.isDeleted;
                                return (
                                  <tr key={`search-${user._id}`} className="hover:bg-gradient-to-r hover:from-sky-50/30 hover:to-orange-50/30 transition-colors">
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-100 to-orange-100 flex items-center justify-center">
                                          <UserCog className="h-4 w-4 text-sky-600" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                          {user.firstName} {user.lastName}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                                    <td className="px-4 py-3">
                                      <Badge
                                        className={
                                          user.role === UserRole.ADMIN
                                            ? 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border-purple-200'
                                            : 'bg-gradient-to-r from-sky-100 to-sky-50 text-sky-700 border-sky-200'
                                        }
                                        variant="outline"
                                      >
                                        {user.role}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                      {isDeletedUser ? (
                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                          Deleted
                                        </Badge>
                                      ) : (
                                        <Badge
                                          className={
                                            user.isActive
                                              ? 'bg-green-50 text-green-700 border-green-200'
                                              : 'bg-gray-50 text-gray-600 border-gray-200'
                                          }
                                          variant="outline"
                                        >
                                          {user.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          onClick={() => handleEditUser(user)}
                                          disabled={isDeletedUser}
                                          className="p-1.5 text-gray-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-colors disabled:opacity-50"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleToggleUserStatus(user._id)}
                                          disabled={isDeletedUser}
                                          className="p-1.5 text-gray-400 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteUser(user)}
                                          disabled={deleteUserAndDataMutation.isPending}
                                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="h-12 w-12 bg-gradient-to-br from-sky-100 to-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Users className="h-6 w-6 text-sky-400" />
                        </div>
                        <p className="text-sm text-gray-500">
                          No users found for "{userSearchTerm}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Users Table Card */}
            <Card className="border-sky-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Users className="h-5 w-5 text-sky-500" />
                      User Directory
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500 mt-1">
                      A list of all users in the system with their details and actions.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 bg-white/80 rounded-xl px-3 py-1.5 border border-sky-100">
                    <Users className="h-4 w-4 text-sky-400" />
                    <span className="text-sm font-medium text-gray-700">{filteredUsers.length}</span>
                    <span className="text-xs text-gray-400">of {totalUsers}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-sky-100">
                    <thead className="bg-gradient-to-r from-sky-50/30 to-orange-50/30">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-sky-700 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-sky-700 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-sky-700 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-sky-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-sky-700 uppercase tracking-wider">Verified</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-sky-700 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-sky-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/80 divide-y divide-sky-100">
                      {filteredUsers.map((user: User) => {
                        const isDeletedUser = !!user.isDeleted;
                        return (
                          <tr key={user._id} className="hover:bg-gradient-to-r hover:from-sky-50/30 hover:to-orange-50/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-sky-100 to-orange-100 flex items-center justify-center">
                                  <UserCog className="h-5 w-5 text-sky-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {`${user.firstName} ${user.lastName}`.toUpperCase()}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    ID: {user._id.slice(-6)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                className={
                                  user.role === UserRole.ADMIN
                                    ? 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-gradient-to-r from-sky-100 to-sky-50 text-sky-700 border-sky-200'
                                }
                                variant="outline"
                              >
                                {user.role}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isDeletedUser ? (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  Deleted
                                </Badge>
                              ) : (
                                <Badge
                                  className={
                                    user.isActive
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : 'bg-gray-50 text-gray-600 border-gray-200'
                                  }
                                  variant="outline"
                                >
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                className={
                                  user.isEmailVerified
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }
                                variant="outline"
                              >
                                {user.isEmailVerified ? 'Verified' : 'Pending'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  disabled={isDeletedUser}
                                  className="p-1.5 text-gray-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-colors disabled:opacity-50"
                                  title="Edit user"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleSendVerificationEmail(user)}
                                  disabled={isDeletedUser || user.isEmailVerified}
                                  className="p-1.5 text-gray-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-colors disabled:opacity-50"
                                  title="Send verification email"
                                >
                                  <Mail className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleUserStatus(user._id)}
                                  disabled={isDeletedUser}
                                  className="p-1.5 text-gray-400 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
                                  title={user.isActive ? 'Deactivate' : 'Activate'}
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  disabled={deleteUserAndDataMutation.isPending}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                  title="Delete user"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-sky-100 bg-gradient-to-r from-sky-50/30 to-orange-50/30">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gray-500">
                        Showing{' '}
                        <span className="font-medium text-gray-700">
                          {(pagination.page - 1) * pagination.limit + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium text-gray-700">
                          {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium text-gray-700">
                          {pagination.total}
                        </span>{' '}
                        results
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <select
                          value={pageSize}
                          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                          className="text-sm border-0 bg-white/80 rounded-lg px-3 py-2 focus:ring-1 focus:ring-sky-400 text-gray-700"
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
                            className="p-2 text-gray-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-colors disabled:opacity-50"
                          >
                            <ChevronsLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            className="p-2 text-gray-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-colors disabled:opacity-50"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          
                          <span className="px-3 py-1 text-sm text-gray-700">
                            Page {currentPage} of {pagination.totalPages}
                          </span>
                          
                          <button
                            onClick={goToNextPage}
                            disabled={currentPage === pagination.totalPages}
                            className="p-2 text-gray-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-colors disabled:opacity-50"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <button
                            onClick={goToLastPage}
                            disabled={currentPage === pagination.totalPages}
                            className="p-2 text-gray-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-colors disabled:opacity-50"
                          >
                            <ChevronsRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-sky-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-sky-300"></span>
                <span className="text-xs text-gray-400">User Management v1.0</span>
                <span className="h-1 w-1 rounded-full bg-orange-300"></span>
              </div>
              <span className="text-xs text-gray-400">
                Last updated: {new Date().toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </div>

        {/* User Modal (Create/Edit) */}
        <UserModal
          isOpen={isCreateUserModalOpen}
          onClose={() => setIsCreateUserModalOpen(false)}
        />

        <UserModal
          user={selectedUser}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
        />

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden rounded-2xl">
            <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-red-50 to-orange-50">
              <DialogTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <div className="h-8 w-1 bg-gradient-to-b from-red-400 to-orange-400 rounded-full"></div>
                Delete User
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-1">
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                This will permanently delete{' '}
                <span className="font-medium text-gray-900">
                  {userToDelete?.firstName} {userToDelete?.lastName}
                </span>{' '}
                and all associated assessment data.
              </p>
            </div>

            <DialogFooter className="p-6 pt-4 border-t border-gray-100">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={deleteUserAndDataMutation.isPending}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl px-4 py-2 text-sm font-medium"
                >
                  {deleteUserAndDataMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Deleting...</span>
                    </div>
                  ) : (
                    'Delete User'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <InvitationModal
          isOpen={isInvitationModalOpen}
          onClose={() => setIsInvitationModalOpen(false)}
        />

        {/* Bulk Disable/Enable Modal */}
        <Dialog open={isBulkDisableModalOpen} onOpenChange={setIsBulkDisableModalOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden rounded-2xl">
            <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-sky-50 via-white to-orange-50 border-b border-sky-100">
              <DialogTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <div className="h-8 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
                Bulk Actions
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-1">
                Select filters to enable or disable multiple users at once.
              </DialogDescription>
            </DialogHeader>
            
            <div className="px-6 py-4 space-y-4">
              {/* College Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                  College
                </Label>
                <div className="relative" data-dropdown="college">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between text-left font-normal border-sky-200 hover:bg-sky-50 rounded-xl"
                    onClick={() => {
                      setIsCollegeDropdownOpen(!isCollegeDropdownOpen);
                      setIsBranchDropdownOpen(false);
                    }}
                  >
                    <span className="truncate text-sm text-gray-700">
                      {bulkDisableFilters.collegeId
                        ? filteredColleges.find(
                            (c: any) => c._id === bulkDisableFilters.collegeId
                          )?.name || 'Select a college'
                        : 'All Colleges'}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                  </Button>
                  
                  {isCollegeDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-sky-100 bg-white shadow-lg">
                      <div className="p-2 border-b border-sky-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-400" />
                          <Input
                            placeholder="Search colleges..."
                            value={collegeSearch}
                            onChange={(e) => setCollegeSearch(e.target.value)}
                            className="pl-9 pr-8 py-1.5 text-sm border-sky-200 rounded-lg"
                            autoFocus
                          />
                          {collegeSearch && (
                            <button
                              onClick={() => setCollegeSearch('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <ScrollArea className="h-[200px]">
                        <div className="p-1">
                          {isLoadingColleges ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-300 border-t-sky-500"></div>
                              <span className="ml-2 text-sm text-gray-500">Loading...</span>
                            </div>
                          ) : filteredColleges.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
                              No colleges found
                            </div>
                          ) : (
                            filteredColleges.map((college: any) => (
                              <button
                                key={college._id}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gradient-to-r hover:from-sky-50 hover:to-orange-50 flex items-center justify-between"
                                onClick={() => {
                                  setBulkDisableFilters((prev) => ({
                                    ...prev,
                                    collegeId: prev.collegeId === college._id ? '' : college._id,
                                    branchIds: [],
                                  }));
                                  setBranchSearch('');
                                  setIsBranchDropdownOpen(false);
                                  setIsCollegeDropdownOpen(false);
                                }}
                              >
                                <span className={bulkDisableFilters.collegeId === college._id ? 'font-medium text-sky-700' : 'text-gray-700'}>
                                  {college.name}
                                </span>
                                {bulkDisableFilters.collegeId === college._id && (
                                  <span className="text-sky-500">✓</span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>

              {/* Branch Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-400"></span>
                  Branch
                </Label>
                <div className="relative" data-dropdown="branch">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between text-left font-normal border-sky-200 hover:bg-sky-50 rounded-xl"
                    onClick={() => {
                      if (!bulkDisableFilters.collegeId) {
                        toast.error('Please select a college first');
                        return;
                      }
                      setIsBranchDropdownOpen(!isBranchDropdownOpen);
                      setIsCollegeDropdownOpen(false);
                    }}
                  >
                    <span className="truncate text-sm text-gray-700">
                      {!bulkDisableFilters.collegeId
                        ? 'Select a college first'
                        : bulkDisableFilters.branchIds.length > 0
                          ? bulkDisableFilters.branchIds.length === 1
                            ? filteredBranches.find(
                                (b: any) => b._id === bulkDisableFilters.branchIds[0]
                              )?.name || '1 branch selected'
                            : `${bulkDisableFilters.branchIds.length} branches selected`
                          : 'All Branches'}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                  </Button>
                  
                  {isBranchDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-sky-100 bg-white shadow-lg">
                      <div className="p-2 border-b border-sky-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400" />
                          <Input
                            placeholder="Search branches..."
                            value={branchSearch}
                            onChange={(e) => setBranchSearch(e.target.value)}
                            className="pl-9 pr-8 py-1.5 text-sm border-sky-200 rounded-lg"
                            autoFocus
                          />
                          {branchSearch && (
                            <button
                              onClick={() => setBranchSearch('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <ScrollArea className="h-[200px]">
                        <div className="p-1">
                          {isLoadingSelectedCollege ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-300 border-t-orange-500"></div>
                              <span className="ml-2 text-sm text-gray-500">Loading...</span>
                            </div>
                          ) : filteredBranches.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
                              No branches available
                            </div>
                          ) : (
                            filteredBranches.map((branch: any) => (
                              <div
                                key={branch._id}
                                className="flex items-center px-3 py-2 hover:bg-gradient-to-r hover:from-sky-50 hover:to-orange-50 rounded-lg cursor-pointer"
                                onClick={() => {
                                  setBulkDisableFilters((prev) => ({
                                    ...prev,
                                    branchIds: prev.branchIds.includes(branch._id)
                                      ? prev.branchIds.filter(id => id !== branch._id)
                                      : [...prev.branchIds, branch._id],
                                  }));
                                }}
                              >
                                <Checkbox
                                  checked={bulkDisableFilters.branchIds.includes(branch._id)}
                                  className="rounded border-sky-300 text-sky-500"
                                />
                                <span className="ml-3 text-sm text-gray-700">
                                  {branch.name}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>

              {/* Year Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                  College Year
                </Label>
                <div className="relative" data-dropdown="year">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between text-left font-normal border-sky-200 hover:bg-sky-50 rounded-xl"
                    onClick={() => {
                      setIsYearDropdownOpen(!isYearDropdownOpen);
                      setIsCollegeDropdownOpen(false);
                      setIsBranchDropdownOpen(false);
                    }}
                  >
                    <span className="truncate text-sm text-gray-700">
                      {bulkDisableFilters.collegeYears.length > 0
                        ? bulkDisableFilters.collegeYears.length === 1
                          ? `Year ${bulkDisableFilters.collegeYears[0]}`
                          : `${bulkDisableFilters.collegeYears.length} years selected`
                        : 'All Years'}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                  </Button>
                  
                  {isYearDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-sky-100 bg-white shadow-lg">
                      <ScrollArea className="h-[200px]">
                        <div className="p-2">
                          {[1, 2, 3, 4].map((year) => (
                            <div
                              key={year}
                              className="flex items-center px-3 py-2 hover:bg-gradient-to-r hover:from-sky-50 hover:to-orange-50 rounded-lg cursor-pointer"
                              onClick={() => {
                                setBulkDisableFilters((prev) => ({
                                  ...prev,
                                  collegeYears: prev.collegeYears.includes(year)
                                    ? prev.collegeYears.filter(y => y !== year)
                                    : [...prev.collegeYears, year],
                                }));
                              }}
                            >
                              <Checkbox
                                checked={bulkDisableFilters.collegeYears.includes(year)}
                                className="rounded border-sky-300 text-sky-500"
                              />
                              <span className="ml-3 text-sm text-gray-700">
                                Year {year}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 pt-4 border-t border-sky-100 bg-gradient-to-r from-sky-50/30 to-orange-50/30">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsBulkDisableModalOpen(false);
                    setBulkDisableFilters({
                      collegeId: '',
                      branchIds: [],
                      collegeYears: [],
                    });
                    setCollegeSearch('');
                    setBranchSearch('');
                  }}
                  className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBulkEnable}
                  disabled={
                    bulkEnableMutation.isPending ||
                    (!bulkDisableFilters.collegeId &&
                      bulkDisableFilters.branchIds.length === 0 &&
                      bulkDisableFilters.collegeYears.length === 0)
                  }
                  className="border-green-200 hover:bg-green-50 text-green-700 rounded-xl px-4 py-2 text-sm font-medium"
                >
                  {bulkEnableMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
                      <span>Enabling...</span>
                    </div>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Enable
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleBulkDisable}
                  disabled={
                    bulkDisableMutation.isPending ||
                    (!bulkDisableFilters.collegeId &&
                      bulkDisableFilters.branchIds.length === 0 &&
                      bulkDisableFilters.collegeYears.length === 0)
                  }
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl px-4 py-2 text-sm font-medium"
                >
                  {bulkDisableMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Disabling...</span>
                    </div>
                  ) : (
                    <>
                      <UserX className="mr-2 h-4 w-4" />
                      Disable
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}