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
  EyeOff,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  BarChart,
  LayoutDashboard,
  Folder,
  Layers,
  Tag,
  Hash,
  Copy,
  Download,
  Upload,
  Settings,
  Shield,
  AlertCircle,
  TrendingUp,
  Activity,
  Database,
  Server,
  HardDrive,
  PieChart,
  Target,
  Zap,
  BookOpen,
  HelpCircle,
  Globe,
  Link2,
  ExternalLink,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Loading } from '@/components/ui/Loading';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
      setCurrentPage(1);
    }, 500);

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
      `Are you sure you want to delete "${assessmentTitle}"? This action cannot be undone.`
    );

    if (!isConfirmed) {
      return;
    }

    try {
      await deleteAssessmentMutation.mutateAsync(assessmentId);
    } catch (error) {
      console.error('Error deleting assessment:', error);
    }
  };

  const cloneAssessment = async (
    assessmentId: string,
    assessmentTitle: string
  ) => {
    const isConfirmed = confirm(
      `Create a copy of "${assessmentTitle}"?`
    );

    if (!isConfirmed) {
      return;
    }

    try {
      await cloneAssessmentMutation.mutateAsync(assessmentId);
    } catch (error) {
      console.error('Error cloning assessment:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0C0C10] flex items-center justify-center">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-red-500/20 p-8 text-center max-w-md">
          <div className="h-16 w-16 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <Shield className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-red-400 mb-2">Access Restricted</h1>
          <p className="text-zinc-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

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

  const assessmentsList = assessments?.data || [];
  const pagination = assessments?.pagination;
  const { mutateAsync: updateAssessment } = updateAssessmentMutation;

  // Stats calculations
  const totalAssessments = pagination?.totalItems || 0;
  const activeAssessments = assessmentsList.filter(a => a.status === 'active').length;
  const draftAssessments = assessmentsList.filter(a => a.status === 'draft').length;
  const completedAssessments = assessmentsList.filter(a => a.status === 'completed').length;

  if (isLoading && isInitialLoad) {
    return (
      <div className="min-h-screen bg-[#0C0C10] flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-flex mb-4">
            <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
            <FileText className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-400" />
          </div>
          <p className="text-zinc-400">Loading assessments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0C0C10] flex items-center justify-center">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-red-500/20 p-8 text-center max-w-md">
          <div className="h-16 w-16 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-red-400 mb-2">
            Error Loading Assessments
          </h2>
          <p className="text-zinc-400 text-center">
            {error instanceof Error
              ? error.message
              : 'Failed to load assessments. Please try again.'}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0C0C10] relative overflow-x-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom,rgba(249,115,22,0.1),transparent_50%)]"></div>
      </div>

      <div className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          
          {/* Header */}
          <div className="mb-8">
            
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">
                  Assessment Management
                </h1>
                <p className="mt-2 text-zinc-400 text-base">
                  Create and manage assessments for your users
                </p>
                <p className="text-xs text-indigo-400 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Sorted by latest created
                </p>
              </div>
              <Link href="/admin/assessments/create">
                <Button className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-lg shadow-indigo-500/25">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Assessment
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-10 blur-xl transition-opacity"></div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-400 mb-1">Total Assessments</p>
                  <p className="text-3xl font-bold text-white">{totalAssessments}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className="text-xs text-indigo-400 flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  In the system
                </span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-green-500/30 transition-all group relative overflow-hidden">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-10 blur-xl transition-opacity"></div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-400 mb-1">Active</p>
                  <p className="text-3xl font-bold text-white">{activeAssessments}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <Play className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Currently running
                </span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-orange-500/30 transition-all group relative overflow-hidden">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-10 blur-xl transition-opacity"></div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-400 mb-1">Draft</p>
                  <p className="text-3xl font-bold text-white">{draftAssessments}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                  <Eye className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className="text-xs text-orange-400 flex items-center gap-1">
                  <Folder className="h-3 w-3" />
                  In preparation
                </span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-purple-500/30 transition-all group relative overflow-hidden">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 blur-xl transition-opacity"></div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-400 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-white">{completedAssessments}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className="text-xs text-purple-400 flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  Finished
                </span>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="bg-white/5 border-white/10 overflow-hidden mb-8">
            <div className="bg-white/5 px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-medium text-zinc-300">Search & Filters</h3>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 h-4 w-4" />
                  <Input
                    placeholder="Search assessments by title..."
                    className="pl-10 pr-4 py-2.5 bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl text-white placeholder:text-zinc-600 text-sm"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-3">
                  <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                    <SelectTrigger className="w-40 bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl text-white">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
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
                    <SelectTrigger className="w-32 bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl text-white">
                      <SelectValue placeholder="Per page" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
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
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12 text-center">
              <div className="h-20 w-20 bg-gradient-to-br from-indigo-500/10 to-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                <FileText className="h-10 w-10 text-indigo-400" />
              </div>
              <p className="text-zinc-300 font-medium mb-2">No assessments found</p>
              <p className="text-sm text-zinc-500 mb-4">
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
                  className="border-white/10 hover:bg-white/5 text-zinc-300 rounded-xl"
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
                  className="bg-white/5 border-white/10 hover:border-indigo-500/30 transition-all hover:scale-[1.02] flex flex-col h-full overflow-hidden group relative"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-10 blur-xl transition-opacity"></div>
                  
                  {/* Status Bar */}
                  <div className={cn(
                    "h-1 w-full bg-gradient-to-r",
                    assessment.status === 'active' ? 'from-green-500 to-emerald-500' :
                    assessment.status === 'draft' ? 'from-orange-500 to-amber-500' :
                    'from-purple-500 to-pink-500'
                  )} />
                  
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">
                          {assessment.title}
                        </CardTitle>
                        <CardDescription className="mt-1 line-clamp-2 min-h-[2.5rem] text-zinc-400">
                          {assessment.description}
                        </CardDescription>
                        {assessment.instruction && (
                          <div className="mt-2 p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-zinc-300 line-clamp-2 min-h-[2.5rem]">
                            <span className="font-medium text-indigo-400">Instructions:</span>{' '}
                            {assessment.instruction}
                          </div>
                        )}
                      </div>
                      <Badge
                        className={cn(
                          "ml-2 border",
                          assessment.status === 'active' 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : assessment.status === 'draft'
                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        )}
                        variant="outline"
                      >
                        {assessment.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex flex-col flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                        <Award className="h-4 w-4 text-indigo-400" />
                        <span className="font-medium text-white">{assessment.totalMarks}</span>
                        <span className="text-xs text-zinc-500">marks</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <Clock className="h-4 w-4 text-orange-400" />
                        <span className="font-medium text-white">{assessment.duration}</span>
                        <span className="text-xs text-zinc-500">min</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                        <Users className="h-4 w-4 text-indigo-400" />
                        <span className="font-medium text-white">
                          {assessment.assignedUsersCount || assessment.assignedUsers?.length || 0}
                        </span>
                        <span className="text-xs text-zinc-500">assigned</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <Calendar className="h-4 w-4 text-orange-400" />
                        <span className="text-xs text-zinc-300 truncate">
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
                            className="w-full border-white/10 hover:bg-white/5 text-zinc-300 rounded-lg"
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
                                className={cn(
                                  "border-white/10 rounded-lg",
                                  assessment.showResultsToUsers === true
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                    : 'hover:bg-white/5 text-zinc-300'
                                )}
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
                            <TooltipContent className="bg-[#1A1A2A] border-white/10 text-white">
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
                            className="w-full border-white/10 hover:bg-white/5 text-zinc-300 rounded-lg"
                          >
                            <BarChart className="h-4 w-4 mr-2" />
                            Results
                          </Button>
                        </Link>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-blue-500/20 hover:bg-blue-500/10 text-blue-400 rounded-lg"
                          onClick={() => cloneAssessment(assessment._id, assessment.title)}
                          disabled={cloneAssessmentMutation.isPending}
                        >
                          {cloneAssessmentMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Copy className="h-4 w-4 mr-2" />
                          )}
                          Clone
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-red-500/20 hover:bg-red-500/10 text-red-400 rounded-lg"
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
            <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-zinc-400">
                  Showing{' '}
                  <span className="font-medium text-white">
                    {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium text-white">
                    {Math.min(
                      pagination.currentPage * pagination.itemsPerPage,
                      pagination.totalItems
                    )}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium text-white">
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
                    className="border-white/10 hover:bg-white/5 text-zinc-300 rounded-lg"
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
                            className={cn(
                              "w-8 h-8 p-0 rounded-lg",
                              isActive 
                                ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white'
                                : 'border-white/10 hover:bg-white/5 text-zinc-300'
                            )}
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                    )}

                    {pagination.totalPages > 5 && (
                      <>
                        <span className="text-zinc-600">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(pagination.totalPages)}
                          disabled={isLoading}
                          className="w-8 h-8 p-0 rounded-lg border-white/10 hover:bg-white/5 text-zinc-300"
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
                    className="border-white/10 hover:bg-white/5 text-zinc-300 rounded-lg"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
              <span className="text-xs text-zinc-500">Assessment Center v1.0</span>
              <span className="h-1 w-1 rounded-full bg-orange-400"></span>
            </div>
            <span className="text-xs text-zinc-500">
              {new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}