'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useMyResults } from '@/lib/hooks/useAssessmentResults';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Clock,
  Award,
  Calendar,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeft,
  ExternalLink,
  Download,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { AssessmentResult } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/ui/Loading';

export default function AllResultsPage() {
  const router = useRouter();
  const { data: myResults, isLoading } = useMyResults();
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    if (!myResults) return [];

    const filtered = myResults.filter((result) => {
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

      let matchesStatus = true;
      if (statusFilter !== 'all') {
        matchesStatus = result.status === statusFilter;
      }

      return matchesSearch && matchesScore && matchesStatus;
    });

    // Sort results
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.endTime || a.startTime || a.createdAt);
          bValue = new Date(b.endTime || b.startTime || b.createdAt);
          break;
        case 'score':
          aValue = a.percentage || 0;
          bValue = b.percentage || 0;
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        case 'title':
          aValue = a.assessmentId?.title || '';
          bValue = b.assessmentId?.title || '';
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [myResults, searchTerm, scoreFilter, statusFilter, sortBy, sortOrder]);

  // Calculate comprehensive statistics
  const totalResults = myResults?.length || 0;
  const passedResults =
    myResults?.filter((result) => (result.percentage || 0) >= 70).length || 0;
  const averageScore =
    myResults && myResults.length > 0
      ? myResults.reduce(
          (sum: number, result: AssessmentResult) =>
            sum + (result.percentage || 0),
          0
        ) / myResults.length
      : 0;
  const totalTimeSpent =
    myResults?.reduce(
      (sum: number, result: AssessmentResult) => sum + (result.duration || 0),
      0
    ) || 0;

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 90)
      return { variant: 'default' as const, label: 'Excellent' };
    if (percentage >= 80) return { variant: 'default' as const, label: 'Good' };
    if (percentage >= 70)
      return { variant: 'secondary' as const, label: 'Pass' };
    if (percentage >= 60)
      return { variant: 'secondary' as const, label: 'Below Average' };
    return { variant: 'destructive' as const, label: 'Fail' };
  };

  const getScoreTrend = (percentage: number) => {
    if (percentage >= 80)
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (percentage >= 70) return <Minus className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes < 60) {
      return remainingSeconds > 0
        ? `${minutes} minutes ${remainingSeconds} seconds`
        : `${minutes} minutes`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours} hours ${remainingMinutes} minutes`
      : `${hours} hours`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportToCSV = () => {
    if (!filteredAndSortedResults.length) return;

    const headers = [
      'Assessment Title',
      'Score (%)',
      'Marks',
      'Status',
      'Duration',
      'Started',
      'Completed',
      'Performance',
    ];

    const csvContent = [
      headers.join(','),
      ...filteredAndSortedResults.map((result) =>
        [
          `"${result.assessmentId?.title || 'N/A'}"`,
          result.percentage || 0,
          `${result.totalMarksObtained || 0}/${result.totalMarksPossible || 0}`,
          result.status,
          formatDuration(result.duration || 0),
          result.startTime ? formatDate(result.startTime) : 'N/A',
          result.endTime ? formatDate(result.endTime) : 'N/A',
          getScoreBadge(result.percentage || 0).label,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-results-${
      new Date().toISOString().split('T')[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <Loading
            message="Loading all results... Behave Like Compiler"
            size="md"
          />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Results
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                All Assessment Results
              </h1>
              <p className="text-gray-600">
                Comprehensive view of all your assessment performances
              </p>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Assessments
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalResults}</div>
                <p className="text-xs text-muted-foreground">
                  Completed assessments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Passed</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{passedResults}</div>
                <p className="text-xs text-muted-foreground">
                  {totalResults > 0
                    ? `${((passedResults / totalResults) * 100).toFixed(1)}%`
                    : '0%'}{' '}
                  pass rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Score
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {averageScore.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all assessments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Time
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(totalTimeSpent)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Time spent on assessments
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Filters and Export */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search assessments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Score filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="pass">Passed (≥70%)</SelectItem>
                  <SelectItem value="fail">Failed (&lt;70%)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="abandoned">Abandoned</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={exportToCSV}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}{' '}
              {sortBy === 'date'
                ? 'Date'
                : sortBy === 'score'
                  ? 'Score'
                  : sortBy === 'duration'
                    ? 'Duration'
                    : 'Title'}
            </Button>
          </div>

          {/* Results Table */}
          {filteredAndSortedResults.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10">
                <p className="text-gray-500">
                  {searchTerm || scoreFilter !== 'all' || statusFilter !== 'all'
                    ? 'No results match your filters'
                    : 'No assessment results yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Assessment Results</CardTitle>
                <CardDescription>
                  Showing {filteredAndSortedResults.length} of {totalResults}{' '}
                  results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assessment</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedResults.map((result) => {
                        const scoreBadge = getScoreBadge(
                          result.percentage || 0
                        );
                        const scoreTrend = getScoreTrend(
                          result.percentage || 0
                        );

                        return (
                          <TableRow key={result._id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {result.assessmentId?.title || 'Assessment'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {result.assessmentId?.description?.substring(
                                    0,
                                    50
                                  ) || 'No description'}
                                  ...
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {scoreTrend}
                                <div className="text-right">
                                  <div className="font-medium">
                                    {result.percentage || 0}%
                                  </div>
                                  <Badge
                                    variant={scoreBadge.variant}
                                    className="text-xs"
                                  >
                                    {scoreBadge.label}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {result.totalMarksObtained || 0} /{' '}
                                {result.totalMarksPossible || 0}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {result.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDuration(result.duration || 0)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {result.startTime
                                  ? formatDate(result.startTime)
                                  : 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {result.endTime
                                  ? formatDate(result.endTime)
                                  : 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  window.open(
                                    `/dashboard/results/${result._id}`,
                                    '_blank'
                                  );
                                }}
                                className="flex items-center gap-2"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
