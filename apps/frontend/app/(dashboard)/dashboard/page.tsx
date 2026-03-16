'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import {
  useMyAssessments,
  useAvailableAssessments,
} from '@/lib/hooks/useAssessments';
import { useMyResults } from '@/lib/hooks/useAssessmentResults';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/logo';
import {
  Award,
  Clock,
  CheckCircle,
  BarChart3,
  Calendar,
  Code,
  ClipboardList,
  Sparkles,
  Sun,
  Cloud,
  TrendingUp,
  Target,
  Zap,
  BookOpen,
} from 'lucide-react';
import { AssessmentResult } from '@/lib/types';

export default function UserDashboardPage() {
  const { user } = useAuth();
  const { data: myAssessments, isLoading: myAssessmentsLoading } =
    useMyAssessments();
  const { data: availableAssessments = [], isLoading: availableLoading } =
    useAvailableAssessments({ limit: 5 });
  const { data: myResults, isLoading: resultsLoading } = useMyResults();
  const assessmentsLoading = myAssessmentsLoading || availableLoading;
  const allAssessments = myAssessments || [];
  const completedAssessmentsList = allAssessments.filter(
    (assessment) => assessment.isTaken || Boolean(assessment.assessmentResultId)
  );

  if (!user) {
    return null;
  }

  // Calculate user statistics
  const availableAssessmentsCount = availableAssessments.length;
  const totalAssessments = availableAssessmentsCount;
  const completedAssessments = completedAssessmentsList.length;
  const visibleCompletedCount = completedAssessmentsList.filter(
    (assessment) => assessment.showResultsToUsers
  ).length;
  const averageScore =
    myResults && myResults.length > 0
      ? myResults.reduce(
          (sum: number, result: AssessmentResult) =>
            sum + (result.percentage || 0),
          0
        ) / myResults.length
      : 0;

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50">
          {/* Decorative Elements */}
          <div className="fixed top-20 right-10 opacity-10 pointer-events-none">
            <Sun className="h-40 w-40 text-orange-300" />
          </div>
          <div className="fixed bottom-20 left-10 opacity-10 pointer-events-none">
            <Cloud className="h-40 w-40 text-sky-300" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
            {/* Header with Greeting */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
                <div className="flex items-center gap-2">
                
                  <span className="text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-sky-600 to-orange-600 bg-clip-text text-transparent">
                    Student Dashboard
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
              
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    <span className="bg-gradient-to-r from-sky-700 via-sky-600 to-orange-600 bg-clip-text text-transparent">
                      {getGreeting()}, {user.firstName}!
                    </span>
                  </h1>
                  <p className="mt-1 text-gray-500">
                    Here's an overview of your assessment progress
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Link href="/dashboard/assessments" className="group">
                <Card className="border-sky-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] overflow-hidden">
                  <div className="h-1 w-full bg-gradient-to-r from-sky-400 to-blue-500"></div>
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <p className="text-base font-semibold text-gray-800 group-hover:text-sky-700 transition-colors">
                        My Assessments
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        View, start, or review your assigned assessments
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ClipboardList className="h-5 w-5 text-sky-600" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/dashboard/tests" className="group">
                <Card className="border-sky-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] overflow-hidden">
                  <div className="h-1 w-full bg-gradient-to-r from-orange-400 to-amber-500"></div>
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <p className="text-base font-semibold text-gray-800 group-hover:text-orange-700 transition-colors">
                        Coding Tests
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Access coding challenges and view submissions
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Code className="h-5 w-5 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <Card className="border-sky-100 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Assessments
                  </CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-sky-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{totalAssessments}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <p className="text-xs text-gray-500">Available to take</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-sky-100 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{completedAssessments}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Target className="h-3 w-3 text-sky-500" />
                    <p className="text-xs text-gray-500">Assessments finished</p>
                  </div>
                </CardContent>
              </Card>

              {myResults &&
              myResults.length > 0 &&
              visibleCompletedCount > 0 &&
              myResults.length === visibleCompletedCount ? (
                <Card className="border-sky-100 shadow-sm hover:shadow-md transition-all">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average Score
                    </CardTitle>
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                      <Award className="h-4 w-4 text-orange-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      {averageScore.toFixed(1)}%
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Zap className="h-3 w-3 text-orange-500" />
                      <p className="text-xs text-gray-500">Across all assessments</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-sky-100 bg-gray-50/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average Score
                    </CardTitle>
                    <div className="h-8 w-8 rounded-lg bg-gray-200 flex items-center justify-center">
                      <Award className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-400 italic">
                      Average score will appear once results are released.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recent Assessments Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available Assessments */}
              <Card className="border-sky-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100 py-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-sky-500" />
                    <CardTitle className="text-sm font-semibold text-gray-700">
                      Available Assessments
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-gray-500 mt-1 ml-6">
                    Assessments you can take
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  {assessmentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="relative">
                        <div className="h-8 w-8 rounded-full border-3 border-sky-200 border-t-sky-500 animate-spin"></div>
                        <BookOpen className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-3 w-3 text-sky-300" />
                      </div>
                    </div>
                  ) : availableAssessments.length > 0 ? (
                    <div className="space-y-3">
                      {availableAssessments.slice(0, 5).map((assessment) => (
                        <div
                          key={assessment._id}
                          className="flex items-start justify-between p-4 border border-sky-100 rounded-xl hover:bg-gradient-to-r hover:from-sky-50/30 hover:to-orange-50/30 transition-all"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{assessment.title}</h4>
                              <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-xs">
                                Available
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {assessment.description}
                            </p>
                            {assessment.instruction && (
                              <div className="mt-2 p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                                <p className="text-xs text-amber-700">
                                  <span className="font-medium">Instructions:</span>{' '}
                                  {assessment.instruction}
                                </p>
                              </div>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-xs">
                              <span className="flex items-center gap-1 text-gray-500">
                                <Award className="h-3.5 w-3.5 text-sky-500" />
                                {assessment.totalMarks} marks
                              </span>
                              <span className="flex items-center gap-1 text-gray-500">
                                <Clock className="h-3.5 w-3.5 text-orange-500" />
                                {assessment.duration} min
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="h-12 w-12 bg-gradient-to-br from-sky-100 to-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <BookOpen className="h-6 w-6 text-sky-400" />
                      </div>
                      <p className="text-sm text-gray-500">No assessments available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Results */}
              <Card className="border-sky-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100 py-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-orange-500" />
                    <CardTitle className="text-sm font-semibold text-gray-700">
                      Recent Results
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-gray-500 mt-1 ml-6">
                    Your latest assessment scores
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  {resultsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="relative">
                        <div className="h-8 w-8 rounded-full border-3 border-sky-200 border-t-sky-500 animate-spin"></div>
                        <Award className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-3 w-3 text-sky-300" />
                      </div>
                    </div>
                  ) : myResults && myResults.length > 0 ? (
                    <div className="space-y-3">
                      {myResults.slice(0, 5).map((result) => (
                        <div
                          key={result._id}
                          className="flex items-start justify-between p-4 border border-sky-100 rounded-xl hover:bg-gradient-to-r hover:from-sky-50/30 hover:to-orange-50/30 transition-all"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {result.assessmentId?.title || 'Assessment'}
                            </h4>
                            <div className="flex items-center gap-2 mt-2 text-xs">
                              <span className="flex items-center gap-1 text-gray-500">
                                <Calendar className="h-3.5 w-3.5 text-sky-500" />
                                {result.endTime
                                  ? new Date(result.endTime).toLocaleDateString()
                                  : 'Not completed'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-xl font-bold bg-gradient-to-r from-sky-700 to-orange-600 bg-clip-text text-transparent">
                              {typeof result.percentage === 'number'
                                ? Number(result.percentage.toFixed(2))
                                : 0}%
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                (result.percentage || 0) >= 70
                                  ? 'mt-1 bg-green-50 text-green-700 border-green-200'
                                  : 'mt-1 bg-red-50 text-red-700 border-red-200'
                              }
                            >
                              {(result.percentage || 0) >= 70 ? 'Pass' : 'Fail'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="h-12 w-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Award className="h-6 w-6 text-orange-400" />
                      </div>
                      <p className="text-sm text-gray-500">No results yet</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Complete assessments to see your scores here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-sky-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-sky-300"></span>
                <span className="text-xs text-gray-400">Student Dashboard</span>
                <span className="h-1 w-1 rounded-full bg-orange-300"></span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}