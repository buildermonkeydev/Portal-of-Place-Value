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
  Clock,
  Award,
  Calendar,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { useState } from 'react';
import { AssessmentResult } from '@/lib/types';
import { Loading } from '@/components/ui/Loading';

export default function UserResultsPage() {
  const { data: myResults, isLoading } = useMyResults();
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all');

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <Loading
            message="Loading results... Behave Like Compiler"
            size="md"
          />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // console.log('myResults', myResults);

  // Filter results based on search and score
  const filteredResults =
    myResults?.filter((result) => {
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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
              <p className="text-gray-600">
                View your assessment performance and scores
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                // Show all results in a new tab
                window.open('/dashboard/results/all', '_blank');
              }}
              className="flex items-center gap-2"
            >
              <Award className="h-4 w-4" />
              View All Results
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* <Card>
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
            </Card> */}

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
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
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
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="pass">Passed (≥70%)</SelectItem>
                <SelectItem value="fail">Failed (&lt;70%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results List */}
          {filteredResults.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10">
                <p className="text-gray-500">
                  {searchTerm || scoreFilter !== 'all'
                    ? 'No results match your filters'
                    : 'No assessment results yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((result) => {
                const scoreBadge = getScoreBadge(result.percentage || 0);
                const scoreTrend = getScoreTrend(result.percentage || 0);

                return (
                  <Card
                    key={result._id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {result.assessmentId?.title || 'Assessment'}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {result.assessmentId?.description ||
                              'No description available'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {scoreTrend}
                          <Badge variant={scoreBadge.variant}>
                            {scoreBadge.label}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Score Information */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              Score:
                            </span>
                            <span className="text-lg font-bold text-blue-600">
                              {typeof result.percentage === 'number'
                                ? Number(result.percentage.toFixed(2))
                                : 0}
                              %{' '}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              Marks:
                            </span>
                            <span className="text-sm">
                              {result.totalMarksObtained || 0} /{' '}
                              {result.totalMarksPossible || 0}
                            </span>
                          </div>
                        </div>

                        {/* Time Information */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              Time Taken:
                            </span>
                            <span className="text-sm">
                              {result.duration
                                ? formatDuration(result.duration)
                                : 'Not available'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              Status:
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {result.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Date Information */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              Completed:
                            </span>
                            <span className="text-sm">
                              {result.endTime
                                ? new Date(result.endTime).toLocaleDateString()
                                : 'Unknown'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              Started:
                            </span>
                            <span className="text-sm">
                              {result.startTime
                                ? new Date(
                                    result.startTime
                                  ).toLocaleDateString()
                                : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(
                              `/dashboard/assessment-results/${result._id}`,
                              '_blank'
                            );
                          }}
                        >
                          View Details
                        </Button>
                        {/* <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Navigate to retake assessment
                            console.log(
                              'Retake assessment:',
                              result.assessmentId?._id
                            );
                          }}
                        >
                          Retake Assessment
                        </Button> */}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
