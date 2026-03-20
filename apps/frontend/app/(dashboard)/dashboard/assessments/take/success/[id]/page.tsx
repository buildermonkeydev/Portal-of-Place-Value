'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  ExternalLink, 
  Clock, 
  Loader2, 
  Sparkles, 
  Award, 
  ArrowLeft,
  Star,
  Zap,
  Shield
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { apiClient } from '@/lib/api/client';
import { Loading } from '@/components/ui/Loading';
import { cn } from '@/lib/utils';

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

  const getScorePercentage = () => {
    if (!assessmentData?.score || !assessmentData?.totalMarks) return null;
    return ((assessmentData.score / assessmentData.totalMarks) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-screen w-screen bg-[#0C0C10] flex items-center justify-center">
            <div className="text-center">
              <div className="relative inline-flex mb-4">
                <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin"></div>
                <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-400" />
              </div>
              <p className="text-zinc-400">Loading assessment results...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error || !assessmentData) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-screen w-screen bg-[#0C0C10] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <div className="text-3xl">😕</div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
              <p className="text-zinc-400 mb-4">
                {error || 'Assessment data not found'}
              </p>
              <Button 
                onClick={handleBackToDashboard} 
                variant="outline"
                className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const scorePercentage = getScorePercentage();
  const isPassing = scorePercentage ? parseFloat(scorePercentage) >= 60 : false;

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

          <div className="relative z-10 h-full w-full overflow-y-auto custom-scrollbar">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
              {/* Success Card */}
              <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                {/* Decorative Header Gradient */}
                <div className="h-2 bg-gradient-to-r from-emerald-500 via-indigo-500 to-orange-500"></div>
                
                <CardHeader className="p-8 pb-4 text-center">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                      <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="h-10 w-10 text-white" />
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-2xl lg:text-3xl font-bold text-white">
                    Assessment Completed!
                  </CardTitle>
                  <p className="text-zinc-400 mt-2">
                    Great job on completing the assessment
                  </p>
                </CardHeader>

                <CardContent className="p-8 pt-4 space-y-6">
                  {/* Assessment Info */}
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-white mb-2">
                      {assessmentData.title}
                    </h2>
                    <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
                      <Clock className="h-4 w-4" />
                      <span>Completed on {new Date(assessmentData.completedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Score Card (if available) */}
                  {scorePercentage && (
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-orange-400" />
                          <span className="text-sm font-medium text-zinc-400">Your Score</span>
                        </div>
                        <Badge className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium",
                          isPassing 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        )}>
                          {isPassing ? 'Passed' : 'Needs Improvement'}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <div className="relative inline-flex items-center justify-center">
                          <svg className="w-32 h-32 transform -rotate-90">
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              className="text-white/10"
                            />
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              strokeLinecap="round"
                              className="text-emerald-400"
                              strokeDasharray={`${2 * Math.PI * 56}`}
                              strokeDashoffset={`${2 * Math.PI * 56 * (1 - parseFloat(scorePercentage) / 100)}`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-white">{scorePercentage}%</span>
                            <span className="text-xs text-zinc-500">Score</span>
                          </div>
                        </div>
                        <div className="mt-4 text-sm text-zinc-400">
                          {assessmentData.score} out of {assessmentData.totalMarks} marks
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feedback Form Section */}
                  {assessmentData.googleForm ? (
                    <div className="space-y-4 bg-indigo-500/5 rounded-xl p-6 border border-indigo-500/20">
                      <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-indigo-400" />
                        <h3 className="text-sm font-semibold text-white">We Value Your Feedback</h3>
                      </div>
                      <p className="text-sm text-zinc-400">
                        Please take a moment to share your experience with this assessment.
                      </p>

                      {countdown > 0 && !isRedirecting ? (
                        <div className="flex items-center justify-center space-x-2 text-indigo-400 bg-indigo-500/10 rounded-lg py-2">
                          <Clock className="w-4 h-4 animate-pulse" />
                          <span className="text-sm">
                            Redirecting to feedback form in {countdown} second{countdown !== 1 ? 's' : ''}...
                          </span>
                        </div>
                      ) : isRedirecting ? (
                        <div className="flex items-center justify-center space-x-2 text-emerald-400 bg-emerald-500/10 rounded-lg py-2">
                          <ExternalLink className="w-4 h-4 animate-pulse" />
                          <span className="text-sm">Opening feedback form...</span>
                        </div>
                      ) : null}

                      <Button
                        onClick={handleManualRedirect}
                        disabled={isRedirecting}
                        className="w-full bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white rounded-xl py-3"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {isRedirecting ? 'Opening Feedback Form...' : 'Provide Feedback'}
                      </Button>

                      <p className="text-xs text-center text-zinc-500">
                        The feedback form will open in a new tab
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-white/5 rounded-xl border border-white/10">
                      <Sparkles className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                      <p className="text-sm text-zinc-400">
                        Thank you for completing the assessment!
                      </p>
                    </div>
                  )}

                  {/* Back to Dashboard Button */}
                  <div className="pt-4">
                    <Button
                      onClick={handleBackToDashboard}
                      variant="outline"
                      className="w-full bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white rounded-xl py-3"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Dashboard
                    </Button>
                  </div>

                  {/* Footer Note */}
                  <div className="text-center pt-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                      <Shield className="h-3 w-3 text-indigo-400" />
                      <p className="text-xs text-zinc-500">
                        Results have been recorded
                      </p>
                    </div>
                  </div>
                </CardContent>
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

// Add Badge component if not imported
function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center", className)}>{children}</span>;
}