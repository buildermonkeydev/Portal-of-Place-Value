'use client';

import React, { useState, useEffect } from 'react';
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
import {
  Search,
  Filter,
  Play,
  Clock,
  HardDrive,
  Code,
  TrendingUp,
  Users,
  Sun,
  Cloud,
  Sparkles,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';
import { testAPI } from '@/lib/api/tests';
import {
  TestListItem,
  TestDifficulty,
  TestQueryParams,
} from '@/lib/types/test';
import { PaginatedResponse } from '@/lib/types';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

interface TestListProps {
  searchQuery?: string;
}

export function TestList({ searchQuery }: TestListProps) {
  const { isAdmin } = useAuth();
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<TestQueryParams>({
    page: 1,
    limit: 12,
    search: searchQuery || '',
    difficulty: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  useEffect(() => {
    loadTests();
  }, [filters, isAdmin]);

  useEffect(() => {
    if (searchQuery !== undefined) {
      setFilters((prev) => ({ ...prev, search: searchQuery }));
    }
  }, [searchQuery]);

  const loadTests = async () => {
    try {
      setLoading(true);
      let response: PaginatedResponse<TestListItem>;

      if (isAdmin) {
        // Admins can see all published tests
        response = await testAPI.getPublishedTests(filters);
      } else {
        // Regular users only see tests assigned to them
        response = await testAPI.getAssignedTests(filters);
      }

      setTests(response.data);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      });
    } catch (error) {
      console.error('Error loading tests:', error);
      toast.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

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

  const getDifficultyIcon = (difficulty: TestDifficulty) => {
    switch (difficulty) {
      case TestDifficulty.EASY:
        return '🟢';
      case TestDifficulty.MEDIUM:
        return '🟡';
      case TestDifficulty.HARD:
        return '🔴';
      default:
        return '⚪';
    }
  };

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
        <div className="text-center space-y-3 mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-6 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
            <div className="flex items-center gap-2">
              <Code className="h-6 w-6 text-sky-500" />
              <span className="text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-sky-600 to-orange-600 bg-clip-text text-transparent">
                Practice Makes Perfect
              </span>
            </div>
            <div className="h-6 w-1 bg-gradient-to-b from-orange-400 to-sky-400 rounded-full"></div>
          </div>
          
          <h1 className="text-4xl font-bold">
            <span className="bg-gradient-to-r from-sky-700 via-sky-600 to-orange-600 bg-clip-text text-transparent">
              Coding Tests
            </span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Practice coding with our collection of programming challenges
          </p>
        </div>

        {/* Filters Card */}
        <Card className="border-sky-100 shadow-sm overflow-hidden mb-6">
          <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100 py-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-sky-500" />
              <CardTitle className="text-sm font-semibold text-gray-700">Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-400" />
                  <Input
                    placeholder="Search tests..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10 pr-8 py-2.5 border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm"
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

              {/* Difficulty Filter */}
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
                  <SelectTrigger className="border-sky-200 focus:border-sky-400 rounded-xl py-2.5 h-auto bg-white/80">
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

              {/* Sort By */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Sort By</label>
                <Select
                  value={filters.sortBy || 'createdAt'}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger className="border-sky-200 focus:border-sky-400 rounded-xl py-2.5 h-auto bg-white/80">
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

              {/* Order */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Order</label>
                <Select
                  value={filters.sortOrder || 'desc'}
                  onValueChange={(value) =>
                    handleFilterChange('sortOrder', value)
                  }
                >
                  <SelectTrigger className="border-sky-200 focus:border-sky-400 rounded-xl py-2.5 h-auto bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
  
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-700">{tests.length}</span> of{' '}
              <span className="font-medium text-gray-700">{pagination.total}</span> tests
            </p>
          </div>
          <Badge variant="outline" className="border-sky-200 bg-white/80 text-sky-700">
            Page {pagination.page} of {pagination.totalPages || 1}
          </Badge>
        </div>

        {/* Tests Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="border-sky-100 shadow-sm overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-sky-200 to-orange-200"></div>
                <CardHeader>
                  <div className="h-5 bg-gradient-to-r from-sky-100 to-sky-50 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gradient-to-r from-sky-50 to-orange-50 rounded w-1/2 animate-pulse mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gradient-to-r from-sky-50 to-orange-50 rounded animate-pulse"></div>
                    <div className="h-3 bg-gradient-to-r from-sky-50 to-orange-50 rounded w-5/6 animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tests.length === 0 ? (
          <Card className="border-sky-100 shadow-sm overflow-hidden">
            <CardContent className="text-center py-12">
              <div className="h-16 w-16 bg-gradient-to-br from-sky-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Code className="h-8 w-8 text-sky-400" />
              </div>
              <p className="text-gray-500 font-medium mb-2">No tests found</p>
              <p className="text-sm text-gray-400">
                Try adjusting your search criteria
              </p>
              {(filters.search || filters.difficulty) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleFilterChange('search', '');
                    handleFilterChange('difficulty', undefined);
                  }}
                  className="mt-4 border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl"
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <Card 
                key={test._id} 
                className="border-sky-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] overflow-hidden group"
              >
                {/* Colored top bar based on difficulty */}
                <div className={`h-1 w-full ${
                  test.difficulty === TestDifficulty.EASY ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                  test.difficulty === TestDifficulty.MEDIUM ? 'bg-gradient-to-r from-yellow-400 to-amber-400' :
                  'bg-gradient-to-r from-red-400 to-orange-400'
                }`}></div>
                
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-sky-700 transition-colors line-clamp-2">
                        {test.title}
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {test.description}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="outline"
                      className={`ml-2 ${getDifficultyColor(test.difficulty)}`}
                    >
                      <span className="mr-1">{getDifficultyIcon(test.difficulty)}</span>
                      {test.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Languages */}
                  <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-sky-50/30 to-orange-50/30 rounded-lg">
                    <Code className="w-4 h-4 text-sky-500" />
                    <span className="text-sm text-gray-600">
                      {test.allowedLanguages.length} language{test.allowedLanguages.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Tags */}
                  {test.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {test.tags.slice(0, 3).map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="bg-gradient-to-r from-sky-50 to-orange-50 text-sky-700 border-sky-200 text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {test.tags.length > 3 && (
                        <Badge 
                          variant="outline" 
                          className="bg-gray-50 text-gray-600 border-gray-200 text-xs"
                        >
                          +{test.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-sky-100">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(test.createdAt).toLocaleDateString()}
                    </span>
                    <Link href={`/dashboard/tests/${test._id}`}>
                      <Button 
                        size="sm"
                        className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-lg text-xs px-3 py-1.5"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start Test
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl border border-sky-100 p-1">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-[36px] rounded-lg ${
                        pagination.page === pageNum
                          ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white'
                          : 'border-sky-200 hover:bg-sky-50 text-sky-700'
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
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

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-sky-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-sky-300"></span>
            <span className="text-xs text-gray-400">Coding Tests</span>
            <span className="h-1 w-1 rounded-full bg-orange-300"></span>
          </div>
          <span className="text-xs text-gray-400">
            {tests.length} test{tests.length !== 1 ? 's' : ''} available
          </span>
        </div>
      </div>
    </div>
  );
}