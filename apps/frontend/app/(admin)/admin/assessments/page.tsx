'use client';

import {
  useAssessments,
  useDeleteAssessment,
  useCloneAssessment,
  useUpdateAssessment,
} from '@/lib/hooks/useAssessments';
import { AssessmentStatus } from '@/lib/types';
import { useUsers } from '@/lib/hooks/useUsers';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Clock,
  Award,
  Users,
  Calendar,
  Play,
  Eye,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Send,
  EyeOff,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sun,
  Cloud,
  FileText,
  BarChart,
  HelpCircle,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Loading } from '@/components/ui/Loading';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function AdminAssessmentsPage() {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Create query parameters for pagination
  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: itemsPerPage,
      search: debouncedSearchTerm || undefined,
      status:
        statusFilter !== 'all' ? (statusFilter as AssessmentStatus) : undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
    }),
    [currentPage, itemsPerPage, debouncedSearchTerm, statusFilter]
  );

  const { data: assessments, isLoading, error } = useAssessments(queryParams);

  // Track initial load
  useEffect(() => {
    if (assessments && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [assessments, isInitialLoad]);
  
  const deleteAssessmentMutation = useDeleteAssessment();
  const cloneAssessmentMutation = useCloneAssessment();
  const updateAssessmentMutation = useUpdateAssessment();
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState<
    string | null
  >(null);

  const deleteAssessment = async (
    assessmentId: string,
    assessmentTitle: string
  ) => {
    const isConfirmed = confirm(
      `Are you sure you want to delete the assessment "${assessmentTitle}"? This action cannot be undone.`
    );

    if (!isConfirmed) {
      return;
    }

    try {
      await deleteAssessmentMutation.mutateAsync(assessmentId);
    } catch (error) {
      // Error handling is already done in the hook
      console.error('Error deleting assessment:', error);
    }
  };

  const cloneAssessment = async (
    assessmentId: string,
    assessmentTitle: string
  ) => {
    const isConfirmed = confirm(
      `Are you sure you want to clone the assessment "${assessmentTitle}"?`
    );

    if (!isConfirmed) {
      return;
    }

    try {
      await cloneAssessmentMutation.mutateAsync(assessmentId);
    } catch (error) {
      // Error handling is already done in the hook
      console.error('Error cloning assessment:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-red-100 p-8 text-center max-w-md">
          <div className="h-16 w-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Handle search change (no need to reset page here, debounce handles it)
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  // Get assessments from API response
  const assessmentsList = assessments?.data || [];
  const pagination = assessments?.pagination;
  const { mutateAsync: updateAssessment } = updateAssessmentMutation;

  // Stats calculations
  const totalAssessments = pagination?.totalItems || 0;
  const activeAssessments = assessmentsList.filter(a => a.status === 'active').length;
  const draftAssessments = assessmentsList.filter(a => a.status === 'draft').length;
  const completedAssessments = assessmentsList.filter(a => a.status === 'completed').length;

  // Show loading state only on initial load, not during search
  if (isLoading && isInitialLoad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-flex mb-4">
            <div className="h-16 w-16 rounded-full border-4 border-sky-200 border-t-sky-500 animate-spin"></div>
            <FileText className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-sky-300" />
          </div>
          <p className="text-gray-500">Loading assessments...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-red-100 p-8 text-center max-w-md">
          <div className="h-16 w-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Error Loading Assessments
          </h2>
          <p className="text-gray-600 text-center">
            {error instanceof Error
              ? error.message
              : 'Failed to load assessments. Please try again.'}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
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
              <FileText className="h-5 w-5 text-sky-500" />
              <span className="text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-sky-600 to-orange-600 bg-clip-text text-transparent">
                Assessment Center
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-sky-700 via-sky-600 to-orange-600 bg-clip-text text-transparent">
                  Assessment Management
                </span>
              </h1>
              <p className="mt-2 text-gray-500 text-lg">
                Create and manage assessments for your users
              </p>
              <p className="text-xs text-sky-500 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Sorted by latest created
              </p>
            </div>
            <Link href="/admin/assessments/create">
              <Button className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Assessment
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Assessments</p>
                <p className="text-3xl font-bold text-gray-900">{totalAssessments}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-sky-100">
              <span className="text-xs text-sky-600 flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-sky-400"></span>
                In the system
              </span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Active</p>
                <p className="text-3xl font-bold text-gray-900">{activeAssessments}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Play className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-sky-100">
              <span className="text-xs text-green-600 flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-green-400"></span>
                Currently running
              </span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Draft</p>
                <p className="text-3xl font-bold text-gray-900">{draftAssessments}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Eye className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-sky-100">
              <span className="text-xs text-orange-600 flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-orange-400"></span>
                In preparation
              </span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{completedAssessments}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-sky-100">
              <span className="text-xs text-purple-600 flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-purple-400"></span>
                Finished
              </span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="border-sky-100 shadow-sm overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 px-6 py-4 border-b border-sky-100">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-sky-500" />
              <h3 className="text-sm font-medium text-gray-700">Search & Filters</h3>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-400 h-4 w-4" />
                <Input
                  placeholder="Search assessments by title..."
                  className="pl-10 pr-4 py-2.5 border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 backdrop-blur-sm text-sm"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-40 border-sky-200 focus:border-sky-400 rounded-xl">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={handleItemsPerPageChange}
                >
                  <SelectTrigger className="w-32 border-sky-200 focus:border-sky-400 rounded-xl">
                    <SelectValue placeholder="Per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 per page</SelectItem>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Grid */}
        {assessmentsList.length === 0 && !isLoading ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-12 text-center">
            <div className="h-20 w-20 bg-gradient-to-br from-sky-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="h-10 w-10 text-sky-400" />
            </div>
            <p className="text-gray-500 font-medium mb-2">No assessments found</p>
            <p className="text-sm text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first assessment'}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {assessmentsList.map((assessment) => (
              <Card
                key={assessment._id}
                className="border-sky-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] flex flex-col h-full overflow-hidden group"
              >
                {/* Status Bar */}
                <div className={`h-1 w-full ${
                  assessment.status === 'active' ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                  assessment.status === 'draft' ? 'bg-gradient-to-r from-orange-400 to-amber-400' :
                  'bg-gradient-to-r from-purple-400 to-pink-400'
                }`} />
                
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-sky-700 transition-colors">
                        {assessment.title}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2 min-h-[2.5rem] text-gray-500">
                        {assessment.description}
                      </CardDescription>
                      {assessment.instruction && (
                        <div className="mt-2 p-2 bg-gradient-to-r from-sky-50 to-orange-50 border border-sky-100 rounded-lg text-xs text-gray-600 line-clamp-2 min-h-[2.5rem]">
                          <span className="font-medium text-sky-700">Instructions:</span>{' '}
                          {assessment.instruction}
                        </div>
                      )}
                    </div>
                    <Badge
                      className={`ml-2 ${
                        assessment.status === 'active' 
                          ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-green-200'
                          : assessment.status === 'draft'
                          ? 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border-orange-200'
                          : 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border-purple-200'
                      }`}
                      variant="outline"
                    >
                      {assessment.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="flex flex-col flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 p-2 bg-sky-50/30 rounded-lg">
                      <Award className="h-4 w-4 text-sky-500" />
                      <span className="font-medium text-gray-700">{assessment.totalMarks}</span>
                      <span className="text-xs text-gray-400">marks</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-orange-50/30 rounded-lg">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="font-medium text-gray-700">{assessment.duration}</span>
                      <span className="text-xs text-gray-400">min</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-sky-50/30 rounded-lg">
                      <Users className="h-4 w-4 text-sky-500" />
                      <span className="font-medium text-gray-700">
                        {assessment.assignedUsersCount || assessment.assignedUsers?.length || 0}
                      </span>
                      <span className="text-xs text-gray-400">assigned</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-orange-50/30 rounded-lg">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      <span className="text-xs text-gray-600 truncate">
                        {assessment.startDate
                          ? new Date(assessment.startDate).toLocaleDateString()
                          : 'Not set'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-auto w-full">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/assessments/edit/${assessment._id}`}
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-sky-200 hover:bg-sky-50 text-sky-700 rounded-lg"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className={`border-sky-200 rounded-lg ${
                                assessment.showResultsToUsers === true
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                  : 'hover:bg-sky-50 text-sky-700'
                              }`}
                              onClick={async () => {
                                const nextVisibility = assessment.showResultsToUsers !== true;
                                try {
                                  setUpdatingVisibilityId(assessment._id);
                                  await updateAssessment({
                                    id: assessment._id,
                                    data: { showResultsToUsers: nextVisibility },
                                  });
                                } catch (error) {
                                  console.error('Failed to toggle result visibility', error);
                                } finally {
                                  setUpdatingVisibilityId(null);
                                }
                              }}
                            >
                              {updatingVisibilityId === assessment._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : assessment.showResultsToUsers === true ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs bg-white border-sky-100">
                            {assessment.showResultsToUsers === true
                              ? 'Hide results from users'
                              : 'Show results to users'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/admin/assessments/results/${assessment._id}`}
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-sky-200 hover:bg-sky-50 text-sky-700 rounded-lg"
                        >
                          <BarChart className="h-4 w-4 mr-2" />
                          Results
                        </Button>
                      </Link>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-blue-200 hover:bg-blue-50 text-blue-600 rounded-lg"
                        onClick={() => cloneAssessment(assessment._id, assessment.title)}
                        disabled={cloneAssessmentMutation.isPending}
                      >
                        {cloneAssessmentMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Clone
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-200 hover:bg-red-50 text-red-600 rounded-lg"
                        onClick={() => deleteAssessment(assessment._id, assessment.title)}
                        disabled={deleteAssessmentMutation.isPending}
                      >
                        {deleteAssessmentMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl border border-sky-100 p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Showing{' '}
                <span className="font-medium text-gray-700">
                  {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium text-gray-700">
                  {Math.min(
                    pagination.currentPage * pagination.itemsPerPage,
                    pagination.totalItems
                  )}
                </span>{' '}
                of{' '}
                <span className="font-medium text-gray-700">
                  {pagination.totalItems}
                </span>{' '}
                results
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={!pagination.hasPrevPage || isLoading}
                  className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      const pageNum = i + 1;
                      const isActive = pageNum === pagination.currentPage;

                      return (
                        <Button
                          key={pageNum}
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={isLoading}
                          className={`w-8 h-8 p-0 rounded-lg ${
                            isActive 
                              ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white'
                              : 'border-sky-200 hover:bg-sky-50 text-sky-700'
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}

                  {pagination.totalPages > 5 && (
                    <>
                      <span className="text-gray-400">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(pagination.totalPages)}
                        disabled={isLoading}
                        className="w-8 h-8 p-0 rounded-lg border-sky-200 hover:bg-sky-50 text-sky-700"
                      >
                        {pagination.totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))
                  }
                  disabled={!pagination.hasNextPage || isLoading}
                  className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-lg"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-sky-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-sky-300"></span>
            <span className="text-xs text-gray-400">Assessment Center v1.0</span>
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
  );
}