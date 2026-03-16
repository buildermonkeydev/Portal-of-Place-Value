'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  FileText,
  ClipboardList,
  BarChart3,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { DashboardStats as DashboardStatsType } from '@/lib/types/common';

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call when backend endpoint is available
    // For now, using mock data
    const mockStats: DashboardStatsType = {
      totalUsers: 1250,
      totalQuestions: 450,
      totalAssessments: 25,
      totalResults: 3200,
      activeAssessments: 8,
      recentResults: [
        {
          id: '1',
          user: 'John Doe',
          assessment: 'JavaScript Basics',
          score: 85,
          completedAt: '2024-01-15',
        },
        {
          id: '2',
          user: 'Jane Smith',
          assessment: 'Python Fundamentals',
          score: 92,
          completedAt: '2024-01-14',
        },
        {
          id: '3',
          user: 'Mike Johnson',
          assessment: 'React Development',
          score: 78,
          completedAt: '2024-01-13',
        },
      ],
      userGrowth: [
        { date: '2024-01-10', count: 1200 },
        { date: '2024-01-11', count: 1210 },
        { date: '2024-01-12', count: 1220 },
        { date: '2024-01-13', count: 1230 },
        { date: '2024-01-14', count: 1240 },
        { date: '2024-01-15', count: 1250 },
      ],
      assessmentCompletion: [
        { assessment: 'JavaScript Basics', completionRate: 85 },
        { assessment: 'Python Fundamentals', completionRate: 78 },
        { assessment: 'React Development', completionRate: 92 },
        { assessment: 'Node.js Backend', completionRate: 65 },
      ],
    };

    setStats(mockStats);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">
            Failed to load dashboard statistics
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +
              {stats.userGrowth[stats.userGrowth.length - 1]?.count -
                stats.userGrowth[0]?.count || 0}{' '}
              from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Questions
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalQuestions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {stats.totalAssessments} assessments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Assessments
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAssessments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAssessments} total assessments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Results</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalResults.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Assessment completions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Results and Completion Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Results</span>
            </CardTitle>
            <CardDescription>Latest assessment completions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentResults.map(
                (result: {
                  id: string;
                  user: string;
                  assessment: string;
                  score: number;
                  completedAt: string;
                }) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{result.user}</p>
                      <p className="text-xs text-gray-600">
                        {result.assessment}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          result.score >= 80
                            ? 'default'
                            : result.score >= 60
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {result.score}%
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {result.completedAt}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assessment Completion Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Completion Rates</span>
            </CardTitle>
            <CardDescription>Assessment completion percentages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.assessmentCompletion.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.assessment}</span>
                    <span className="text-gray-600">
                      {item.completionRate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
