'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ExternalLink, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { apiClient } from '@/lib/api/client';
import { Loading } from '@/components/ui/Loading';

interface AssessmentSuccessData {
  assessmentId: string;
  title: string;
  googleForm?: string;
  completedAt: string;
  score?: number;
  totalMarks?: number;
}

export default function AssessmentSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [assessmentData, setAssessmentData] =
    useState<AssessmentSuccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const fetchAssessmentData = async () => {
      try {
        const assessmentId = params.id as string;
        if (!assessmentId) {
          setError('Assessment ID not found');
          setLoading(false);
          return;
        }

        const response = await apiClient.get(
          `/api/v1/assessments/${assessmentId}/success`
        );
        const data = response.data;
        setAssessmentData(data.data);
      } catch (err) {
        console.error('Error fetching assessment data:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load assessment data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAssessmentData();
  }, [params.id]);

  useEffect(() => {
    if (!assessmentData?.googleForm) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsRedirecting(true);
          window.open(assessmentData.googleForm, '_blank');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [assessmentData?.googleForm]);

  const handleManualRedirect = () => {
    if (assessmentData?.googleForm) {
      setIsRedirecting(true);
      window.open(assessmentData.googleForm, '_blank');
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard/assessments');
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <Loading
            message="Loading assessment results... Behave Like Compiler"
            size="md"
          />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error || !assessmentData) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
              <p className="text-gray-600 mb-4">
                {error || 'Assessment data not found'}
              </p>
              <Button onClick={handleBackToDashboard} variant="outline">
                Back to Dashboard
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-8">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-600">
                Assessment Completed Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">
                  {assessmentData.title}
                </h2>
                <p className="text-gray-600">Completed</p>
              </div>

              {assessmentData.googleForm ? (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Please take a moment to provide your feedback:
                  </p>

                  {countdown > 0 && !isRedirecting ? (
                    <div className="flex items-center justify-center space-x-2 text-blue-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        Redirecting to feedback form in {countdown} second
                        {countdown !== 1 ? 's' : ''}...
                      </span>
                    </div>
                  ) : isRedirecting ? (
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm">Opening feedback form...</span>
                    </div>
                  ) : null}

                  <Button
                    onClick={handleManualRedirect}
                    disabled={isRedirecting}
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {isRedirecting
                      ? 'Opening Feedback Form...'
                      : 'Open Feedback Form'}
                  </Button>

                  <p className="text-xs text-gray-400">
                    The feedback form will open in a new tab
                  </p>
                </div>
              ) : (
                <div className="text-gray-600">
                  <p>Thank you for completing the assessment!</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  onClick={handleBackToDashboard}
                  variant="outline"
                  className="w-full"
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
