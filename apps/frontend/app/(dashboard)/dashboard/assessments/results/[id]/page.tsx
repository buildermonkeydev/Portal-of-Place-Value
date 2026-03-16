'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAssessment } from '@/lib/hooks/useAssessments';
import { useMyAssessmentResult } from '@/lib/hooks/useAssessmentResults';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  BarChart3,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { processQuestionText } from '@/lib/utils/textProcessing';

export default function AssessmentResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [assessmentId, setAssessmentId] = useState<string>('');

  const {
    data: assessment,
    isLoading: isLoadingAssessment,
    error: assessmentError,
  } = useAssessment(assessmentId);
  const {
    data: result,
    isLoading: isLoadingResult,
    error: resultError,
  } = useMyAssessmentResult(assessmentId);

  // Extract the ID from the params promise
  useEffect(() => {
    params.then((resolvedParams) => {
      setAssessmentId(resolvedParams.id);
    });
  }, [params]);

  // console.log('assessment', assessment);
  // console.log('result', result);

  if (!assessmentId || isLoadingAssessment || isLoadingResult) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading results...</span>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const axiosError = resultError as AxiosError<any> | undefined;
  if (axiosError?.response?.status === 403) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-10">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">
              Results Currently Hidden
            </h1>
            <p className="text-gray-600 max-w-lg mx-auto mt-2">
              The administrator has chosen to keep the results for this
              assessment hidden. Please check back later or contact your
              instructor if you believe this is a mistake.
            </p>
            <Button
              onClick={() => router.push('/dashboard/assessments')}
              className="mt-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assessments
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (resultError || assessmentError) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-10">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600">
              Unable to load results
            </h1>
            <p className="text-gray-600">
              Something went wrong while fetching the assessment details.
            </p>
            <Button
              onClick={() => router.push('/dashboard/assessments')}
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assessments
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!assessment || !result) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-10">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600">
              Results Not Found
            </h1>
            <p className="text-gray-600">
              The assessment results you're looking for don't exist.
            </p>
            <Button
              onClick={() => router.push('/dashboard/assessments')}
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assessments
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // console.log('assessment', assessment);
  // console.log('result', result);

  const percentage = result.percentage || 0;
  const isPassed = percentage >= 50;
  const totalQuestions = assessment.questions?.length || 0;
  const answeredQuestions = result.responses?.length || 0;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/assessments')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Assessment Results
              </h1>
              <p className="text-gray-600">
                Your performance for: {assessment.title}
              </p>
            </div>
          </div>

          {/* Result Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                Result Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score */}
                <div className="text-center">
                  <div
                    className={`text-4xl font-bold mb-2 ${
                      isPassed ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {result.totalMarksObtained}/{result.totalMarksPossible}
                  </div>
                  <p className="text-gray-600">Total Score</p>
                  <Badge
                    variant={isPassed ? 'default' : 'destructive'}
                    className="mt-2"
                  >
                    {isPassed ? 'PASSED' : 'FAILED'}
                  </Badge>
                </div>

                {/* Percentage */}
                <div className="text-center">
                  <div
                    className={`text-4xl font-bold mb-2 ${
                      isPassed ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {percentage.toFixed(1)}%
                  </div>
                  <p className="text-gray-600">Percentage</p>
                  <div className="mt-2">
                    {isPassed ? (
                      <Award className="h-6 w-6 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600 mx-auto" />
                    )}
                  </div>
                </div>

                {/* Time Taken */}
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2 text-blue-600">
                    {Math.floor((result.duration || 0) / 60)}m{' '}
                    {(result.duration || 0) % 60}s
                  </div>
                  <p className="text-gray-600">Time Taken</p>
                  <Clock className="h-5 w-5 text-blue-600 mx-auto mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assessment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Title:</span>
                    <span>{assessment.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Description:</span>
                    <span>{assessment.description || 'No description'}</span>
                  </div>
                  {assessment.instruction && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Instructions:</span>
                      <span>{assessment.instruction}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Total Questions:</span>
                    <span>{totalQuestions}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Duration:</span>
                    <span>{assessment.duration} minutes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Questions Answered:</span>
                    <span>
                      {answeredQuestions}/{totalQuestions}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Completed On:</span>
                    <span>
                      {new Date(
                        result.endTime || result.createdAt
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Analysis */}
          {result.responses && result.responses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Question Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.responses.map((response: any, index: number) => {
                    const question = assessment.questions?.find(
                      (q) => q._id === response.questionId
                    );
                    if (!question) return null;

                    return (
                      <div
                        key={index}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Question {index + 1}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={
                                response.isCorrect ? 'default' : 'destructive'
                              }
                            >
                              {response.isCorrect ? 'Correct' : 'Incorrect'}
                            </Badge>
                            <Badge variant="outline">
                              {response.marksObtained}/{question.marks} marks
                            </Badge>
                          </div>
                        </div>

                        <div className="text-gray-700 whitespace-pre-wrap">
                          {processQuestionText(question.text)}
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-600">
                            Your Answer:
                          </p>
                          <div className="space-y-1">
                            {response.selectedOptions.map(
                              (option: string, optIndex: number) => (
                                <div
                                  key={optIndex}
                                  className="flex items-center space-x-2"
                                >
                                  {response.isCorrect ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                  <span
                                    className={
                                      response.isCorrect
                                        ? 'text-green-700'
                                        : 'text-red-700'
                                    }
                                  >
                                    {option}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        {question.explanation && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-blue-800 mb-1">
                              Explanation:
                            </p>
                            <p className="text-sm text-blue-700">
                              {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/assessments')}
            >
              Back to Assessments
            </Button>
            <Button onClick={() => router.push('/dashboard/results')}>
              View All Results
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
