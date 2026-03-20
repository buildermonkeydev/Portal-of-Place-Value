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
  Code,
  TrendingUp,
  Users,
  Sparkles,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  LayoutGrid,
  List,
  Star,
  Zap,
  Target,
  Layers,
  BarChart,
  CheckCircle,
  Award,
  Globe,
  Calendar,
  Folder,
  Tag,
  Hash,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Settings,
  SlidersHorizontal,
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
import { cn } from '@/lib/utils';

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
        response = await testAPI.getPublishedTests(filters);
      } else {
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
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const getDifficultyColor = (difficulty: TestDifficulty) => {
    switch (difficulty) {
      case TestDifficulty.EASY:
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case TestDifficulty.MEDIUM:
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case TestDifficulty.HARD:
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getDifficultyIcon = (difficulty: TestDifficulty) => {
    switch (difficulty) {
      case TestDifficulty.EASY:
        return <Zap className="h-3 w-3 text-green-400" />;
      case TestDifficulty.MEDIUM:
        return <Target className="h-3 w-3 text-yellow-400" />;
      case TestDifficulty.HARD:
        return <Award className="h-3 w-3 text-red-400" />;
      default:
        return <Hash className="h-3 w-3 text-zinc-400" />;
    }
  };

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
          <div className="text-left space-y-3 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 bg-gradient-to-b from-indigo-500 to-orange-500 rounded-full"></div>
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-indigo-400" />
                <span className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  Practice Hub · Coding Challenges
                </span>
              </div>
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">
              Coding Tests
            </h1>
            <p className="text-zinc-400 text-base max-w-2xl">
              Sharpen your skills with our collection of programming challenges
            </p>
          </div>

          {/* Filters Card */}
          <Card className="bg-white/5 border-white/10 overflow-hidden mb-6">
            <CardHeader className="bg-white/5 border-b border-white/10 py-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
                <CardTitle className="text-sm font-semibold text-zinc-300">Filter Options</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                    <Input
                      placeholder="Search tests..."
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-10 pr-8 py-2.5 bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl text-white placeholder:text-zinc-600 text-sm"
                    />
                    {filters.search && (
                      <button
                        onClick={() => handleFilterChange('search', '')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Difficulty Filter */}
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">Difficulty</label>
                  <Select
                    value={filters.difficulty || 'all'}
                    onValueChange={(value) =>
                      handleFilterChange(
                        'difficulty',
                        value === 'all' ? undefined : value
                      )
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl py-2.5 h-auto text-white">
                      <SelectValue placeholder="All difficulties" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                      <SelectItem value="all">All difficulties</SelectItem>
                      <SelectItem value={TestDifficulty.EASY}>
                        <div className="flex items-center gap-2">
                          <Zap className="h-3 w-3 text-green-400" />
                          <span>Easy</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={TestDifficulty.MEDIUM}>
                        <div className="flex items-center gap-2">
                          <Target className="h-3 w-3 text-yellow-400" />
                          <span>Medium</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={TestDifficulty.HARD}>
                        <div className="flex items-center gap-2">
                          <Award className="h-3 w-3 text-red-400" />
                          <span>Hard</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">Sort By</label>
                  <Select
                    value={filters.sortBy || 'createdAt'}
                    onValueChange={(value) => handleFilterChange('sortBy', value)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl py-2.5 h-auto text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="difficulty">Difficulty</SelectItem>
                      <SelectItem value="createdAt">Created Date</SelectItem>
                      <SelectItem value="updatedAt">Updated Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Order */}
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">Order</label>
                  <Select
                    value={filters.sortOrder || 'desc'}
                    onValueChange={(value) =>
                      handleFilterChange('sortOrder', value)
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl py-2.5 h-auto text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
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
              <Layers className="h-4 w-4 text-indigo-400" />
              <p className="text-sm text-zinc-400">
                Showing <span className="font-medium text-white">{tests.length}</span> of{' '}
                <span className="font-medium text-white">{pagination.total}</span> challenges
              </p>
            </div>
            <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-300">
              Page {pagination.page} of {pagination.totalPages || 1}
            </Badge>
          </div>

          {/* Tests Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="bg-white/5 border-white/10 overflow-hidden">
                  <div className="h-1 w-full bg-gradient-to-r from-indigo-500/20 to-orange-500/20"></div>
                  <CardHeader>
                    <div className="h-5 bg-white/10 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-white/5 rounded w-1/2 animate-pulse mt-2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-white/5 rounded animate-pulse"></div>
                      <div className="h-3 bg-white/5 rounded w-5/6 animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : tests.length === 0 ? (
            <Card className="bg-white/5 border-white/10 overflow-hidden">
              <CardContent className="text-center py-12">
                <div className="h-16 w-16 bg-gradient-to-br from-indigo-500/10 to-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <Code className="h-8 w-8 text-indigo-400" />
                </div>
                <p className="text-zinc-300 font-medium mb-2">No challenges found</p>
                <p className="text-sm text-zinc-500">
                  Try adjusting your search criteria
                </p>
                {(filters.search || filters.difficulty) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleFilterChange('search', '');
                      handleFilterChange('difficulty', undefined);
                    }}
                    className="mt-4 border-white/10 hover:bg-white/5 text-zinc-300 rounded-xl"
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
                  className="bg-white/5 border-white/10 hover:border-indigo-500/30 transition-all hover:scale-[1.02] overflow-hidden group"
                >
                  {/* Colored top bar based on difficulty */}
                  <div className={cn(
                    "h-1 w-full bg-gradient-to-r",
                    test.difficulty === TestDifficulty.EASY ? "from-green-500 to-emerald-500" :
                    test.difficulty === TestDifficulty.MEDIUM ? "from-yellow-500 to-amber-500" :
                    "from-red-500 to-orange-500"
                  )}></div>
                  
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
                          {test.title}
                        </CardTitle>
                        <CardDescription className="mt-1 text-sm text-zinc-400 line-clamp-2">
                          {test.description}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant="outline"
                        className={cn("ml-2 border", getDifficultyColor(test.difficulty))}
                      >
                        <span className="mr-1">{getDifficultyIcon(test.difficulty)}</span>
                        {test.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Languages */}
                    <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
                      <Code className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm text-zinc-300">
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
                            className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        {test.tags.length > 3 && (
                          <Badge 
                            variant="outline" 
                            className="bg-white/5 text-zinc-400 border-white/10 text-xs"
                          >
                            +{test.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(test.createdAt).toLocaleDateString()}
                      </span>
                      <Link href={`/dashboard/tests/${test._id}`}>
                        <Button 
                          size="sm"
                          className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-lg text-xs px-3 py-1.5 shadow-lg shadow-indigo-500/25"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Start
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
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-1">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="border-white/10 hover:bg-white/5 text-zinc-300 rounded-lg"
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
                        className={cn(
                          "min-w-[36px] rounded-lg",
                          pagination.page === pageNum
                            ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white'
                            : 'border-white/10 hover:bg-white/5 text-zinc-300'
                        )}
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
                  className="border-white/10 hover:bg-white/5 text-zinc-300 rounded-lg"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
              <span className="text-xs text-zinc-500">Practice Hub</span>
              <span className="h-1 w-1 rounded-full bg-orange-400"></span>
            </div>
            <span className="text-xs text-zinc-500">
              {tests.length} challenge{tests.length !== 1 ? 's' : ''} available
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}