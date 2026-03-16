'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Play,
  Archive,
  Clock,
  Code,
  Sun,
  Cloud,
  Filter,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { testAPI } from '@/lib/api/tests';
import {
  TestListItem,
  TestDifficulty,
  TestStatus,
  TestQueryParams,
  TestStats,
} from '@/lib/types/test';
import { PaginatedResponse } from '@/lib/types';
import { toast } from 'sonner';
import Link from 'next/link';

interface TestManagementProps {
  searchQuery?: string;
}

export function TestManagement({ searchQuery }: TestManagementProps) {
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<TestQueryParams>({
    page: 1,
    limit: 10,
    search: searchQuery || '',
    difficulty: undefined,
    status: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [stats, setStats] = useState<TestStats | null>(null);

  const loadTests = useCallback(async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<TestListItem> =
        await testAPI.getAllTests(filters);

      // console.log('API Response:', response); // Debug log

      if (response && response.data && response.pagination) {
        setTests(response.data);
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
        });
      } else {
        console.error('Invalid response structure:', response);
        toast.error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error loading tests:', error);
      toast.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadStats = useCallback(async () => {
    try {
      const statsData = await testAPI.getTestStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  const handleFilterChange = (key: keyof TestQueryParams, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleTestAction = async (
    testId: string,
    action: 'publish' | 'archive' | 'delete'
  ) => {
    try {
      switch (action) {
        case 'publish':
          await testAPI.publishTest(testId);
          toast.success('Test published successfully');
          break;
        case 'archive':
          await testAPI.archiveTest(testId);
          toast.success('Test archived successfully');
          break;
        case 'delete':
          if (confirm('Are you sure you want to delete this test?')) {
            await testAPI.deleteTest(testId);
            toast.success('Test deleted successfully');
          }
          break;
      }
      loadTests();
      loadStats();
    } catch (error) {
      console.error(`Error ${action}ing test:`, error);
      toast.error(`Failed to ${action} test`);
    }
  };

  useEffect(() => {
    loadTests();
    loadStats();
  }, [loadTests, loadStats]);

  useEffect(() => {
    if (searchQuery !== undefined) {
      setFilters((prev) => ({ ...prev, search: searchQuery }));
    }
  }, [searchQuery]);

  const getDifficultyColor = (difficulty: TestDifficulty) => {
    switch (difficulty) {
      case TestDifficulty.EASY:
        return 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-green-200';
      case TestDifficulty.MEDIUM:
        return 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border-yellow-200';
      case TestDifficulty.HARD:
        return 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: TestStatus) => {
    switch (status) {
      case TestStatus.PUBLISHED:
        return 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-green-200';
      case TestStatus.DRAFT:
        return 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border-blue-200';
      case TestStatus.ARCHIVED:
        return 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Decorative Elements */}
      <div className="fixed top-20 right-10 opacity-5 pointer-events-none">
        <Sun className="h-40 w-40 text-orange-300" />
      </div>
      <div className="fixed bottom-20 left-10 opacity-5 pointer-events-none">
        <Cloud className="h-40 w-40 text-sky-300" />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-6 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-700 via-sky-600 to-orange-600 bg-clip-text text-transparent">
              Test Management
            </h1>
          </div>
          <p className="text-gray-500 ml-4">
            Create and manage coding tests with test cases
          </p>
        </div>
        <Link href="/admin/tests/create">
          <Button className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Create Test
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-sky-100 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Tests</CardTitle>
              <Code className="h-4 w-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-sky-300"></span>
                All time
              </div>
            </CardContent>
          </Card>
          <Card className="border-sky-100 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Published</CardTitle>
              <Play className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.published}</div>
              <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-green-300"></span>
                Active tests
              </div>
            </CardContent>
          </Card>
          <Card className="border-sky-100 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Draft</CardTitle>
              <Edit className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.draft}</div>
              <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-blue-300"></span>
                In progress
              </div>
            </CardContent>
          </Card>
          <Card className="border-sky-100 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Archived</CardTitle>
              <Archive className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.archived}</div>
              <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-orange-300"></span>
                Archived
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border-sky-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100 py-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-sky-500" />
            <CardTitle className="text-sm font-semibold text-gray-700">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-400" />
                <Input
                  placeholder="Search tests..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 pr-4 py-2.5 border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm"
                />
                {filters.search && (
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Difficulty</label>
              <Select
                value={filters.difficulty || 'all'}
                onValueChange={(value) =>
                  handleFilterChange(
                    'difficulty',
                    value === 'all' ? undefined : value
                  )
                }
              >
                <SelectTrigger className="border-sky-200 focus:border-sky-400 rounded-xl py-2.5 h-auto">
                  <SelectValue placeholder="All difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All difficulties</SelectItem>
                  <SelectItem value={TestDifficulty.EASY}>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      Easy
                    </div>
                  </SelectItem>
                  <SelectItem value={TestDifficulty.MEDIUM}>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value={TestDifficulty.HARD}>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500"></span>
                      Hard
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Status</label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) =>
                  handleFilterChange(
                    'status',
                    value === 'all' ? undefined : value
                  )
                }
              >
                <SelectTrigger className="border-sky-200 focus:border-sky-400 rounded-xl py-2.5 h-auto">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value={TestStatus.DRAFT}>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                      Draft
                    </div>
                  </SelectItem>
                  <SelectItem value={TestStatus.PUBLISHED}>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      Published
                    </div>
                  </SelectItem>
                  <SelectItem value={TestStatus.ARCHIVED}>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-gray-500"></span>
                      Archived
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Sort By</label>
              <Select
                value={filters.sortBy || 'createdAt'}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger className="border-sky-200 focus:border-sky-400 rounded-xl py-2.5 h-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="updatedAt">Updated Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tests List */}
      <Card className="border-sky-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-sky-500" />
              <CardTitle className="text-sm font-semibold text-gray-700">
                Tests ({pagination.total})
              </CardTitle>
            </div>
            <Badge variant="outline" className="border-sky-200 bg-white/80 text-sky-700">
              Page {pagination.page} of {pagination.totalPages || 1}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-sky-100 border-t-sky-500 animate-spin"></div>
                <Code className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-sky-300" />
              </div>
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-gradient-to-br from-sky-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Code className="h-8 w-8 text-sky-400" />
              </div>
              <p className="text-gray-500 font-medium mb-2">No tests found</p>
              <p className="text-sm text-gray-400">
                {filters.search || filters.difficulty || filters.status
                  ? 'Try adjusting your filters'
                  : 'Create your first test to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tests.map((test) => (
                <div
                  key={test._id}
                  className="flex items-start justify-between p-4 border border-sky-100 rounded-xl hover:bg-gradient-to-r hover:from-sky-50/30 hover:to-orange-50/30 transition-all hover:shadow-sm"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{test.title}</h3>
                      <Badge className={`${getDifficultyColor(test.difficulty)} border`} variant="outline">
                        {test.difficulty}
                      </Badge>
                      <Badge className={`${getStatusColor(test.status)} border`} variant="outline">
                        {test.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                      {test.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(test.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        By:{' '}
                        {typeof test.createdBy === 'string'
                          ? test.createdBy
                          : test.createdBy?.email?.split('@')[0] || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <Link href={`/admin/tests/${test._id}`}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/tests/${test._id}/edit`}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    {test.status === TestStatus.DRAFT && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestAction(test._id, 'publish')}
                        className="border-green-200 hover:bg-green-50 text-green-700 rounded-lg"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    {test.status === TestStatus.PUBLISHED && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestAction(test._id, 'archive')}
                        className="border-orange-200 hover:bg-orange-50 text-orange-700 rounded-lg"
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestAction(test._id, 'delete')}
                      className="border-red-200 hover:bg-red-50 text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl border border-sky-100 p-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-gray-600 px-2">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-lg"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}