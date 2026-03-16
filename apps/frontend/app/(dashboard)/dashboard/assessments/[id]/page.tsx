'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  FileText,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Play,
  Eye,
} from 'lucide-react';
import { assessmentAPI } from '@/lib/api/assessments';
import {
  AssessmentWithDetails,
  AssessmentWithDetailsForUser,
  UserAssessment,
} from '@/lib/types/assessment';
import { AssessmentResult } from '@/lib/types/assessmentResult';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useStartAssessment } from '@/lib/hooks/useAssessmentResults';
import { useAuth } from '@/lib/hooks';
import { toast } from 'sonner';
import { Loading } from '@/components/ui/Loading';

const AssessmentDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;
  const { user } = useAuth();

  const [assessment, setAssessment] =
    useState<AssessmentWithDetailsForUser | null>(null);
  const startAssessmentMutation = useStartAssessment();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const fetchAssessmentData = async () => {
      try {
        setLoading(true);

        // Get assessment details
        const assessmentData =
          await assessmentAPI.getAssessmentById(assessmentId);
        setAssessment(assessmentData);
      } catch (err) {
        console.error('Error fetching assessment data:', err);
        setError('Failed to load assessment details');
      } finally {
        setLoading(false);
      }
    };

    if (assessmentId) {
      fetchAssessmentData();
    }
  }, [assessmentId]);

  const redirectToTakeAssessment = (assessmentId) => {
    router.push(`/dashboard/assessments/take/${assessmentId}`);
  };

  const isExpired = () => {
    if (!assessment) return false;
    if (assessment.endDate) {
      return new Date(assessment.endDate) < new Date();
    }
    return false;
  };

  const canTakeAssessment = () => {
    if (!assessment) return false;

    // Check if expired
    if (isExpired()) return false;

    // Check if assessment is active
    if (assessment.status !== 'active' || !assessment.isActive) return false;

    // Check if user is assigned (userAssessment exists)
    if (!assessment) return false;

    // Check if not already taken
    if (assessment.isTaken) return false;

    return true;
  };

  const getStatusBadge = () => {
    if (isExpired()) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Expired
        </Badge>
      );
    }

    if (!assessment) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Not Assigned
        </Badge>
      );
    }

    if (assessment.isTaken) {
      if (assessment.assessmentState?.status === 'in_progress') {
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            In Progress
          </Badge>
        );
      }
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Completed
        </Badge>
      );
    }

    if (assessment?.status === 'active' && assessment?.isActive) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <Play className="w-3 h-3" />
          Available
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        Not Available
      </Badge>
    );
  };

  const handleViewResults = () => {
    if (assessment?.assessmentResultId) {
      router.push(`/dashboard/results/${assessment.assessmentResultId}`);
    }
  };

  const handleStartAssessment = async () => {
    if (isStarting) return; // Prevent multiple clicks
    
    try {
      setIsStarting(true);
      if (!user?._id) {
        toast.error('User not authenticated');
        return;
      }

      const result = await startAssessmentMutation.mutateAsync({
        assessmentId,
        userId: user._id,
      });

      // Load any previously saved responses from current state

      // console.log('Result', result);
      // if (result.data._id) {
      //   await redirectToTakeAssessment(result.data._id);
      //   return;
      // }

      toast.success('Assessment started! Good luck!');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to start assessment'
      );
    } finally {
      setIsStarting(false);
    }
  };

  const getActionButton = () => {
    if (isExpired()) {
      return (
        <Button disabled variant="outline" className="w-full">
          Assessment Expired
        </Button>
      );
    }

    if (assessment?.isTaken) {
      if (assessment.assessmentState?.status === 'in_progress') {
        return (
          <Button 
            onClick={handleStartAssessment} 
            className="w-full"
            disabled={isStarting}
          >
            {isStarting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Continue Assessment'
            )}
          </Button>
        );
      }
      return (
        <Button
          onClick={handleViewResults}
          variant="outline"
          className="w-full"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Results
        </Button>
      );
    }

    if (canTakeAssessment()) {
      return (
        <Button 
          onClick={handleStartAssessment} 
          className="w-full"
          disabled={isStarting}
        >
          {isStarting ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Start Assessment
            </>
          )}
        </Button>
      );
    }

    return (
      <Button disabled variant="outline" className="w-full">
        Assessment Not Available
      </Button>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Loading
          message="Loading assessment details... Behave Like Compiler"
          size="md"
        />
      </DashboardLayout>
    );
  }

  if (error || !assessment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              Error Loading Assessment
            </h2>
            <p className="text-muted-foreground mb-4">
              {error || 'Assessment not found'}
            </p>
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {assessment.title}
            </h1>
            {getStatusBadge()}
          </div>
          {assessment.description && (
            <p className="text-lg text-gray-600 mb-4">
              {assessment.description}
            </p>
          )}
          {assessment.instruction && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">
                Instructions:
              </p>
              <p className="text-blue-700">{assessment.instruction}</p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="">
          {/* Assessment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Assessment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Questions
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assessment.numberOfQuestions || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Marks
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assessment.totalMarks}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Duration</p>
                  <p className="text-lg font-semibold text-gray-900 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {assessment.duration} minutes
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {assessment.status}
                  </p>
                </div>
              </div>

              {assessment.startDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Start Date
                  </p>
                  <p className="text-lg font-semibold text-gray-900 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(assessment.startDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {assessment.endDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">End Date</p>
                  <p className="text-lg font-semibold text-gray-900 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(assessment.endDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* 
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userAssessment ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {userAssessment.isTaken ? 'Taken' : 'Not Taken'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Attempts
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {userAssessment.isTaken ? '1' : '0'}
                    </p>
                  </div>
                </div>

                {userAssessment.assessmentState && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Current Status
                      </p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {userAssessment.assessmentState.status.replace(
                          '_',
                          ' '
                        )}
                      </p>
                    </div>

                    {userAssessment.assessmentState.status ===
                      'in_progress' && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Time Remaining
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {Math.floor(
                              userAssessment.assessmentState.timeRemaining / 60
                            )}
                            m{' '}
                            {userAssessment.assessmentState.timeRemaining % 60}s
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Questions Answered
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {userAssessment.assessmentState.responsesCount} /{' '}
                            {assessment.questions.length}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  You are not assigned to this assessment
                </p>
              </div>
            )}
          </CardContent>
        </Card> */}
        </div>

        {/* Action Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              {isExpired()
                ? 'This assessment has expired and cannot be taken'
                : !assessment
                  ? 'You are not assigned to this assessment'
                  : assessment.isTaken
                    ? 'You have already taken this assessment'
                    : 'You can start this assessment when ready'}
            </CardDescription>
          </CardHeader>
          <CardContent>{getActionButton()}</CardContent>
        </Card>

        {/* {assessment.createdBy && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Created By</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-gray-900">
              {assessment.createdBy.fullName ||
                `${assessment.createdBy.firstName} ${assessment.createdBy.lastName}`}
            </p>
            <p className="text-sm text-gray-500">
              {assessment.createdBy.email}
            </p>
          </CardContent>
        </Card>
      )} */}
      </div>
    </DashboardLayout>
  );
};

export default AssessmentDetailsPage;
