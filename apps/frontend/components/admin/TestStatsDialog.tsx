'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
} from 'lucide-react';
import { testAPI } from '@/lib/api/tests';
import { TestSubmissionStats, TestSubmissionResult } from '@/lib/types/test';
import { PaginatedResponse } from '@/lib/types';

interface TestStatsDialogProps {
  testId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TestStatsDialog({
  testId,
  open,
  onOpenChange,
}: TestStatsDialogProps) {
  const [stats, setStats] = useState<TestSubmissionStats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<
    TestSubmissionResult[]
  >([]);
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const statsData = await testAPI.getTestSubmissionStats(testId);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading test stats:', error);
    } finally {
      setLoading(false);
    }
  }, [testId]);

  const loadRecentSubmissions = useCallback(async () => {
    try {
      const response: PaginatedResponse<TestSubmissionResult> =
        await testAPI.getTestSubmissionsById(testId, {
          page: 1,
          limit: 10,
          sortBy: 'submittedAt',
          sortOrder: 'desc',
        });
      setRecentSubmissions(response.data);
    } catch (error) {
      console.error('Error loading recent submissions:', error);
    }
  }, [testId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  useEffect(() => {
    if (open && testId) {
      loadStats();
      loadRecentSubmissions();
    }
  }, [open, testId, loadStats, loadRecentSubmissions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Test Statistics
          </DialogTitle>
          <DialogDescription>
            View detailed statistics and recent submissions for this test
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : stats ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="submissions">Recent Submissions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Submissions
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.totalSubmissions}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Unique Users
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.uniqueUsers}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Average Score
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${getScoreColor(
                        stats.averageScore
                      )}`}
                    >
                      {stats.averageScore.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Pass Rate
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${getScoreColor(
                        stats.passRate
                      )}`}
                    >
                      {stats.passRate.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Submission Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Submissions</span>
                      <span className="font-medium">
                        {stats.totalSubmissions}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Unique Users</span>
                      <span className="font-medium">{stats.uniqueUsers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        Average Submissions per User
                      </span>
                      <span className="font-medium">
                        {stats.uniqueUsers > 0
                          ? (
                              stats.totalSubmissions / stats.uniqueUsers
                            ).toFixed(1)
                          : '0'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Score</span>
                      <Badge className={getScoreBadgeColor(stats.averageScore)}>
                        {stats.averageScore.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pass Rate</span>
                      <Badge className={getScoreBadgeColor(stats.passRate)}>
                        {stats.passRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Success Rate</span>
                      <Badge className={getScoreBadgeColor(stats.passRate)}>
                        {stats.passRate >= 50
                          ? 'Good'
                          : stats.passRate >= 25
                          ? 'Fair'
                          : 'Poor'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="submissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Recent Submissions
                  </CardTitle>
                  <CardDescription>
                    Latest {recentSubmissions.length} submissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentSubmissions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No submissions yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentSubmissions.map((submission) => (
                        <div
                          key={submission._id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">
                                {typeof submission.userId === 'string'
                                  ? submission.userId
                                  : (submission.userId as any)?.email ||
                                    'Unknown User'}
                              </span>
                              <Badge
                                className={getScoreBadgeColor(submission.score)}
                              >
                                {submission.score.toFixed(1)}%
                              </Badge>
                              <Badge
                                variant={
                                  submission.passedTestCases ===
                                  submission.totalTestCases
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {submission.passedTestCases}/
                                {submission.totalTestCases} passed
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {submission.executionTime}ms
                              </span>
                              <span>
                                Submitted:{' '}
                                {new Date(
                                  submission.submittedAt
                                ).toLocaleString()}
                              </span>
                              <span>Language ID: {submission.languageId}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {submission.passedTestCases ===
                            submission.totalTestCases ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : null}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
