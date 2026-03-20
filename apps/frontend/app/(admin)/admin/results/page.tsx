'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAssessmentResults } from '@/lib/hooks/useAssessmentResults';
import { useAuth } from '@/lib/hooks/useAuth';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Download,
  Filter,
  BarChart3,
  Award,
  Clock,
  User,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Calendar,
  PieChart,
  Activity,
  Sparkles,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { AssessmentResult } from '@/lib/types';
import { Select, SelectContent, SelectItem } from '@/components/ui/select';
import { SelectTrigger } from '@/components/ui/select';
import { SelectValue } from '@/components/ui/select';
import { Loading } from '@/components/ui/Loading';
import { cn } from '@/lib/utils';

export default function AdminResultsPage() {
  const { isAdmin } = useAuth();
  const { data: results, isLoading, error } = useAssessmentResults();
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all');

  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-screen w-screen bg-[#0C0C10] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <Award className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Access Denied</h1>
              <p className="text-zinc-400 mt-2">
                You don't have permission to access this page.
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Filter results
  const filteredResults =
    results?.data.filter((result) => {
      const matchesSearch =
        result.assessmentId?.title
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        result.assessmentId?.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      let matchesScore = true;
      if (scoreFilter === 'pass') {
        matchesScore = (result.percentage || 0) >= 70;
      } else if (scoreFilter === 'fail') {
        matchesScore = (result.percentage || 0) < 70;
      }

      return matchesSearch && matchesScore;
    }) || [];

  // Calculate statistics
  const totalResults = results?.data?.length || 0;
  const passedResults =
    results?.data?.filter((result) => (result.percentage || 0) >= 70).length ||
    0;
  const averageScore =
    results?.data && results?.data.length > 0
      ? results?.data.reduce(
          (sum: number, result: AssessmentResult) =>
            sum + (result.percentage || 0),
          0
        ) / results.data.length
      : 0;

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 90)
      return { color: 'emerald', label: 'Excellent', icon: TrendingUp };
    if (percentage >= 80) return { color: 'blue', label: 'Good', icon: TrendingUp };
    if (percentage >= 70) return { color: 'yellow', label: 'Pass', icon: Minus };
    if (percentage >= 60) return { color: 'orange', label: 'Below Average', icon: TrendingDown };
    return { color: 'red', label: 'Fail', icon: TrendingDown };
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-screen w-screen bg-[#0C0C10] flex items-center justify-center">
            <div className="text-center">
              <div className="relative inline-flex mb-4">
                <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin"></div>
                <BarChart3 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-400" />
              </div>
              <p className="text-zinc-400">Loading results...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-screen w-screen bg-[#0C0C10] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Error Loading Results</h1>
              <p className="text-zinc-400 mt-2">Failed to load assessment results.</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
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
                        <BarChart3 className="h-4 w-4 text-indigo-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                          Assessment Analytics
                        </span>
                      </div>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                      Results Dashboard
                    </h1>
                    <p className="mt-2 text-zinc-400 text-sm lg:text-base">
                      Track and analyze student performance across all assessments
                    </p>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => window.open('/dashboard/results/all', '_blank')}
                    className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white rounded-xl px-5 py-2.5"
                  >
                    <Award className="mr-2 h-4 w-4" />
                    View All Results
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 lg:mb-8">
                <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-indigo-400" />
                      </div>
                      <span className="text-xs text-zinc-500">Total Assessments</span>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">{totalResults}</p>
                  <p className="text-xs text-zinc-500 mt-1">completed assessments</p>
                </div>

                <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                      </div>
                      <span className="text-xs text-zinc-500">Pass Rate</span>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {totalResults > 0 ? ((passedResults / totalResults) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">{passedResults} passed assessments</p>
                </div>

                <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-orange-500/30 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Award className="h-4 w-4 text-orange-400" />
                      </div>
                      <span className="text-xs text-zinc-500">Average Score</span>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">{averageScore.toFixed(1)}%</p>
                  <p className="text-xs text-zinc-500 mt-1">across all assessments</p>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="bg-white/5 rounded-xl border border-white/10 mb-6 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-sm font-medium text-white">Filter Results</h3>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                          placeholder="Search by assessment title or description..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-xl"
                        />
                      </div>
                    </div>
                    <Select value={scoreFilter} onValueChange={setScoreFilter}>
                      <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white rounded-xl">
                        <SelectValue placeholder="Filter by score" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                        <SelectItem value="all">All Scores</SelectItem>
                        <SelectItem value="pass">Passed (≥70%)</SelectItem>
                        <SelectItem value="fail">Failed (&lt;70%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Results List */}
              {filteredResults.length === 0 ? (
                <div className="bg-white/5 rounded-xl border border-white/10 text-center py-12">
                  <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="h-6 w-6 text-zinc-500" />
                  </div>
                  <p className="text-zinc-400">
                    {searchTerm || scoreFilter !== 'all'
                      ? 'No results match your filters'
                      : 'No assessment results yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredResults.map((result) => {
                    const scoreBadge = getScoreBadge(result.percentage || 0);
                    const ScoreIcon = scoreBadge.icon;
                    
                    return (
                      <div
                        key={result._id}
                        className="bg-white/5 rounded-xl border border-white/10 hover:border-indigo-500/30 transition-all overflow-hidden group"
                      >
                        <div className="p-5 lg:p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            {/* Left Section - Assessment Info */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="text-lg font-semibold text-white mb-1">
                                    {result.assessmentId?.title || 'Assessment'}
                                  </h3>
                                  <p className="text-sm text-zinc-400 line-clamp-2">
                                    {result.assessmentId?.description || 'No description available'}
                                  </p>
                                </div>
                                <div className="lg:hidden flex items-center gap-2">
                                  <ScoreIcon className={cn(
                                    "h-4 w-4",
                                    scoreBadge.color === 'emerald' && "text-emerald-400",
                                    scoreBadge.color === 'blue' && "text-blue-400",
                                    scoreBadge.color === 'yellow' && "text-yellow-400",
                                    scoreBadge.color === 'orange' && "text-orange-400",
                                    scoreBadge.color === 'red' && "text-red-400"
                                  )} />
                                  <Badge className={cn(
                                    "border",
                                    scoreBadge.color === 'emerald' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                    scoreBadge.color === 'blue' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                    scoreBadge.color === 'yellow' && "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                                    scoreBadge.color === 'orange' && "bg-orange-500/10 text-orange-400 border-orange-500/20",
                                    scoreBadge.color === 'red' && "bg-red-500/10 text-red-400 border-red-500/20"
                                  )}>
                                    {scoreBadge.label}
                                  </Badge>
                                </div>
                              </div>

                              {/* Metrics Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                                <div>
                                  <p className="text-xs text-zinc-500 mb-1">Score</p>
                                  <p className="text-xl font-bold text-white">
                                    {typeof result.percentage === 'number'
                                      ? Number(result.percentage.toFixed(1))
                                      : 0}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-zinc-500 mb-1">Marks</p>
                                  <p className="text-lg font-medium text-white">
                                    {result.totalMarksObtained || 0} / {result.totalMarksPossible || 0}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-zinc-500 mb-1">Time Taken</p>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 text-zinc-500" />
                                    <p className="text-sm text-white">
                                      {result.duration ? formatDuration(result.duration) : 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs text-zinc-500 mb-1">Completed</p>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                                    <p className="text-sm text-white">
                                      {result.endTime
                                        ? new Date(result.endTime).toLocaleDateString()
                                        : 'Unknown'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right Section - Actions & Badge */}
                            <div className="hidden lg:flex flex-col items-end gap-3">
                              <div className="flex items-center gap-2">
                                <ScoreIcon className={cn(
                                  "h-5 w-5",
                                  scoreBadge.color === 'emerald' && "text-emerald-400",
                                  scoreBadge.color === 'blue' && "text-blue-400",
                                  scoreBadge.color === 'yellow' && "text-yellow-400",
                                  scoreBadge.color === 'orange' && "text-orange-400",
                                  scoreBadge.color === 'red' && "text-red-400"
                                )} />
                                <Badge className={cn(
                                  "border px-3 py-1",
                                  scoreBadge.color === 'emerald' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                  scoreBadge.color === 'blue' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                  scoreBadge.color === 'yellow' && "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                                  scoreBadge.color === 'orange' && "bg-orange-500/10 text-orange-400 border-orange-500/20",
                                  scoreBadge.color === 'red' && "bg-red-500/10 text-red-400 border-red-500/20"
                                )}>
                                  {scoreBadge.label}
                                </Badge>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/admin/results/${result._id}`, '_blank')}
                                className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white rounded-lg"
                              >
                                <Eye className="mr-2 h-3.5 w-3.5" />
                                View Details
                                <ChevronRight className="ml-2 h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Mobile Actions */}
                          <div className="lg:hidden mt-4 pt-4 border-t border-white/10">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/admin/results/${result._id}`, '_blank')}
                              className="w-full bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white rounded-lg"
                            >
                              <Eye className="mr-2 h-3.5 w-3.5" />
                              View Details
                              <ChevronRight className="ml-2 h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
                  <span className="text-xs text-zinc-500">Results Dashboard</span>
                  <span className="h-1 w-1 rounded-full bg-orange-400"></span>
                </div>
                <span className="text-xs text-zinc-500">
                  {filteredResults.length} of {totalResults} results shown
                </span>
              </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.03);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.1);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.2);
          }
        `}</style>
      </DashboardLayout>
    </ProtectedRoute>
  );
}