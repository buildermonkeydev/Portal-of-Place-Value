'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAssessmentResult } from '@/lib/hooks/useAssessmentResults';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Award,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AssessmentResult } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Loading } from '@/components/ui/Loading';

export default function ResultDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [assessmentId, setAssessmentId] = useState<string>('');
  const { data: result, isLoading } = useAssessmentResult(assessmentId);

  useEffect(() => {
    params.then((resolvedParams) => {
      setAssessmentId(resolvedParams.id);
    });
  }, [params]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <Loading message="Loading result details... Behave Like Compiler" size="md" />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!result) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-10">
            <p className="text-gray-500">Result not found</p>
            <Button
              onClick={() => router.back()}
              className="mt-4"
              variant="outline"
            >
              Go Back
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 90)
      return {
        variant: 'default' as const,
        label: 'Excellent',
        color: 'text-green-600',
      };
    if (percentage >= 80)
      return {
        variant: 'default' as const,
        label: 'Good',
        color: 'text-blue-600',
      };
    if (percentage >= 70)
      return {
        variant: 'secondary' as const,
        label: 'Pass',
        color: 'text-yellow-600',
      };
    if (percentage >= 60)
      return {
        variant: 'secondary' as const,
        label: 'Below Average',
        color: 'text-orange-600',
      };
    return {
      variant: 'destructive' as const,
      label: 'Fail',
      color: 'text-red-600',
    };
  };

  const getScoreTrend = (percentage: number) => {
    if (percentage >= 80)
      return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (percentage >= 70) return <Minus className="h-5 w-5 text-yellow-600" />;
    return <TrendingDown className="h-5 w-5 text-red-600" />;
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const scoreBadge = getScoreBadge(result.percentage || 0);
  const scoreTrend = getScoreTrend(result.percentage || 0);

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
                Result Details
              </h1>
              <p className="text-gray-600">
                Detailed view of your assessment performance
              </p>
            </div>
          </div>

          {/* Assessment Overview Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">
                    {result.assessmentId?.title || 'Assessment'}
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {result.assessmentId?.description ||
                      'No description available'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {scoreTrend}
                  <Badge
                    variant={scoreBadge.variant}
                    className="text-sm px-3 py-1"
                  >
                    {scoreBadge.label}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Prominent Score Display */}
          <div className="text-center py-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Your Assessment Result
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div
                    className={`text-4xl font-bold ${scoreBadge.color} mb-2`}
                  >
                    {typeof result.percentage === 'number'
                      ? Number(result.percentage.toFixed(2))
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-gray-600">Overall Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {result.totalMarksObtained || 0}/
                    {result.totalMarksPossible || 0}
                  </div>
                  <div className="text-sm text-gray-600">Marks Obtained</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {formatDuration(result.duration || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Time Taken</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4">
                <Badge variant="outline" className="text-sm px-4 py-2">
                  Status: {result.status}
                </Badge>
                <Badge variant="outline" className="text-sm px-4 py-2">
                  Completed:{' '}
                  {result.endTime ? formatDateTime(result.endTime) : 'N/A'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Score and Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Score */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Overall Score
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${scoreBadge.color}`}>
                  {typeof result.percentage === 'number'
                    ? Number(result.percentage.toFixed(2))
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  {result.totalMarksObtained || 0} out of{' '}
                  {result.totalMarksPossible || 0} marks
                </p>
              </CardContent>
            </Card>

            {/* Time Performance */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Time Taken
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(result.duration || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total time taken to complete the assessment
                </p>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold capitalize">
                  {result.status}
                </div>
                <p className="text-xs text-muted-foreground">
                  Assessment completion status
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timing Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Started
                    </label>
                    <p className="text-sm mt-1">
                      {result.startTime
                        ? formatDateTime(result.startTime)
                        : 'Not available'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Completed
                    </label>
                    <p className="text-sm mt-1">
                      {result.endTime
                        ? formatDateTime(result.endTime)
                        : 'Not available'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Total Duration
                  </label>
                  <p className="text-sm mt-1">
                    {formatDuration(result.duration || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Assessment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Assessment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Title
                  </label>
                  <p className="text-sm mt-1">
                    {result.assessmentId?.title || 'Not available'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Description
                  </label>
                  <p className="text-sm mt-1">
                    {result.assessmentId?.description ||
                      'No description available'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Assessment ID
                  </label>
                  <p className="text-sm mt-1 font-mono">
                    {result.assessmentId?._id || 'Not available'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Candidate Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Candidate Name
                  </label>
                  <p className="text-lg font-medium text-gray-800 mt-1">
                    {result.userId?.fullName ||
                      `${result.userId?.firstName || ''} ${
                        result.userId?.lastName || ''
                      }`.trim() ||
                      'Not available'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Email Address
                  </label>
                  <p className="text-lg font-medium text-gray-800 mt-1">
                    {result.userId?.email || 'Not available'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Assessment ID
                  </label>
                  <p className="text-sm mt-1 font-mono text-gray-600">
                    {result._id || 'Not available'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Result ID
                  </label>
                  <p className="text-sm mt-1 font-mono text-gray-600">
                    {result._id || 'Not available'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Marks Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Marks Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.totalMarksObtained || 0}
                    </div>
                    <div className="text-sm text-blue-600">Marks Obtained</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">
                      {result.totalMarksPossible || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Marks</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {typeof result.percentage === 'number'
                        ? Number(result.percentage.toFixed(2))
                        : 0}
                      %
                    </div>
                    <div className="text-sm text-green-600">Percentage</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>
                      {typeof result.percentage === 'number'
                        ? Number(result.percentage.toFixed(2))
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        (result.percentage || 0) >= 70
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${result.percentage || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question-by-Question Breakdown */}
          {result.responses && result.responses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Question Analysis
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of your answers and performance on each
                  question
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {result.responses.map((response, index) => (
                    <div
                      key={response._id || index}
                      className={`p-6 rounded-lg border ${
                        response.isCorrect
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold text-gray-800">
                            Question {index + 1}
                          </span>
                          <Badge
                            variant={
                              response.isCorrect ? 'default' : 'destructive'
                            }
                            className="text-sm px-3 py-1"
                          >
                            {response.isCorrect ? 'Correct' : 'Incorrect'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {response.questionId?.type === 'single_choice'
                              ? 'Single Choice'
                              : 'Multiple Choice'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-800">
                            {response.marksObtained}/
                            {response.questionId?.marks || 0} marks
                          </div>
                          <div className="text-sm text-gray-500">
                            {response.timeSpent}s
                          </div>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="mb-4">
                        <h4 className="text-base font-medium text-gray-800 mb-2">
                          {response.questionId?.text ||
                            'Question text not available'}
                        </h4>
                        {response.questionId?.explanation && (
                          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              <strong>Explanation:</strong>{' '}
                              {response.questionId.explanation}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Options */}
                      {response.questionId?.options && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-3">
                            Options:
                          </h5>
                          <div className="space-y-2">
                            {response.questionId.options.map(
                              (option, optionIndex) => {
                                const isSelected =
                                  response.selectedOptions?.includes(
                                    option.text
                                  );
                                const isCorrect = option.isCorrect;

                                return (
                                  <div
                                    key={option._id || optionIndex}
                                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                                      isSelected && isCorrect
                                        ? 'bg-green-100 border-green-300'
                                        : isSelected && !isCorrect
                                        ? 'bg-red-100 border-red-300'
                                        : isCorrect && !isSelected
                                        ? 'bg-green-100 border-green-300'
                                        : 'bg-gray-50 border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {isSelected && isCorrect && (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      )}
                                      {isSelected && !isCorrect && (
                                        <XCircle className="h-4 w-4 text-red-600" />
                                      )}
                                      {isCorrect && !isSelected && (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      )}
                                      {!isSelected && !isCorrect && (
                                        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                                      )}
                                    </div>
                                    <span
                                      className={`text-sm ${
                                        isSelected && isCorrect
                                          ? 'text-green-800 font-medium'
                                          : isSelected && !isCorrect
                                          ? 'text-red-800 font-medium'
                                          : isCorrect && !isSelected
                                          ? 'text-green-800 font-medium'
                                          : 'text-gray-700'
                                      }`}
                                    >
                                      {option.text}
                                    </span>
                                    {isCorrect && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs ml-auto"
                                      >
                                        Correct Answer
                                      </Badge>
                                    )}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}

                      {/* User's Answer */}
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          Your Answer:
                        </h5>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <span className="text-sm text-blue-800">
                            {response.selectedOptions?.join(', ') ||
                              'No answer selected'}
                          </span>
                        </div>
                      </div>

                      {/* Performance Summary */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            <strong>Marks:</strong> {response.marksObtained}/
                            {response.questionId?.marks || 0}
                          </span>
                          <span>
                            <strong>Time:</strong> {response.timeSpent} seconds
                          </span>
                        </div>
                        <div className="text-right">
                          {response.isCorrect ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="font-medium">Correct</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span className="font-medium">Incorrect</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Performance Summary */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">
                    Performance Summary
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600 font-medium">
                        Total Questions:
                      </span>
                      <span className="ml-2 text-blue-800">
                        {result.responses?.length || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-green-600 font-medium">
                        Correct:
                      </span>
                      <span className="ml-2 text-green-800">
                        {result.responses?.filter((r) => r.isCorrect).length ||
                          0}
                      </span>
                    </div>
                    <div>
                      <span className="text-red-600 font-medium">
                        Incorrect:
                      </span>
                      <span className="ml-2 text-red-800">
                        {result.responses?.filter((r) => !r.isCorrect).length ||
                          0}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">
                        Accuracy:
                      </span>
                      <span className="ml-2 text-blue-800">
                        {result.responses && result.responses.length > 0
                          ? Math.round(
                              (result.responses.filter((r) => r.isCorrect)
                                .length /
                                result.responses.length) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* Time Analysis */}
                {result.responses && result.responses.length > 0 && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-3">
                      Time Analysis
                    </h4>

                    {/* Time Summary */}
                    <div className="mb-4 p-3 bg-white rounded-lg border border-green-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-green-600 font-medium">
                            Total Time Spent:
                          </span>
                          <span className="ml-2 text-green-800">
                            {result.responses.reduce(
                              (total, r) => total + (r.timeSpent || 0),
                              0
                            )}
                            s
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-600 font-medium">
                            Stored Duration:
                          </span>
                          <span className="ml-2 text-blue-800">
                            {formatDuration(result.duration || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-purple-600 font-medium">
                            Duration:
                          </span>
                          <span className="ml-2 text-purple-800">
                            {formatDuration(result.duration || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-orange-600 font-medium">
                            Average per Q:
                          </span>
                          <span className="ml-2 text-orange-800">
                            {result.responses.length > 0
                              ? formatDuration(
                                  Math.round(
                                    result.responses.reduce(
                                      (total, r) => total + (r.timeSpent || 0),
                                      0
                                    ) / result.responses.length
                                  )
                                )
                              : '0 seconds'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {result.responses.map((response, index) => (
                        <div
                          key={response._id || index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-green-700">
                            Q{index + 1}:{' '}
                            {response.questionId?.text?.substring(0, 50)}...
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium ${
                                response.timeSpent <= 10
                                  ? 'text-green-600'
                                  : response.timeSpent <= 30
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {response.timeSpent < 60
                                ? `${response.timeSpent}s`
                                : `${Math.floor(response.timeSpent / 60)}m ${
                                    response.timeSpent % 60
                                  }s`}
                            </span>
                            {response.timeSpent <= 10 && (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            )}
                            {response.timeSpent > 10 &&
                              response.timeSpent <= 30 && (
                                <AlertCircle className="h-3 w-3 text-yellow-600" />
                              )}
                            {response.timeSpent > 30 && (
                              <XCircle className="h-3 w-3 text-red-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-200 text-xs text-green-700">
                      <strong>Time Legend:</strong> 🟢 Fast (≤10s) | 🟡 Moderate
                      (11-30s) | 🔴 Slow (31s+)
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Results
            </Button>
            {/* <Button
              onClick={() => {
                // TODO: Navigate to retake assessment
                console.log('Retake assessment:', result.assessmentId?._id);
              }}
              className="flex items-center gap-2"
            >
              <Award className="h-4 w-4" />
              Retake Assessment
            </Button> */}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
