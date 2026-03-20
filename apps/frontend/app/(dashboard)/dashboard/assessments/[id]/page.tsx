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
  Sparkles,
  BookOpen,
  Award,
  Zap,
  Shield,
  ArrowLeft,
  Info,
  TrendingUp,
  Timer,
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
import { cn } from '@/lib/utils';

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

  const isExpired = () => {
    if (!assessment) return false;
    if (assessment.endDate) {
      return new Date(assessment.endDate) < new Date();
    }
    return false;
  };

  const canTakeAssessment = () => {
    if (!assessment) return false;
    if (isExpired()) return false;
    if (assessment.status !== 'active' || !assessment.isActive) return false;
    if (!assessment) return false;
    if (assessment.isTaken) return false;
    return true;
  };

  const getStatusBadge = () => {
    if (isExpired()) {
      return (
        <Badge className="bg-red-500/10 text-red-400 border-red-500/20 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Expired
        </Badge>
      );
    }

    if (!assessment) {
      return (
        <Badge className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Not Assigned
        </Badge>
      );
    }

    if (assessment.isTaken) {
      if (assessment.assessmentState?.status === 'in_progress') {
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            In Progress
          </Badge>
        );
      }
      return (
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Completed
        </Badge>
      );
    }

    if (assessment?.status === 'active' && assessment?.isActive) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
          <Play className="w-3 h-3" />
          Available
        </Badge>
      );
    }

    return (
      <Badge className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20 flex items-center gap-1">
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
    if (isStarting) return;
    
    try {
      setIsStarting(true);
      if (!user?._id) {
        toast.error('User not authenticated');
        return;
      }

      await startAssessmentMutation.mutateAsync({
        assessmentId,
        userId: user._id,
      });

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
        <Button disabled variant="outline" className="w-full bg-white/5 border-white/10 text-zinc-400">
          Assessment Expired
        </Button>
      );
    }

    if (assessment?.isTaken) {
      if (assessment.assessmentState?.status === 'in_progress') {
        return (
          <Button 
            onClick={handleStartAssessment} 
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
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
          className="w-full bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
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
          className="w-full bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white"
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
      <Button disabled variant="outline" className="w-full bg-white/5 border-white/10 text-zinc-400">
        Assessment Not Available
      </Button>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-screen w-screen bg-[#0C0C10] flex items-center justify-center">
          <div className="text-center">
            <div className="relative inline-flex mb-4">
              <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin"></div>
              <BookOpen className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-400" />
            </div>
            <p className="text-zinc-400">Loading assessment details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !assessment) {
    return (
      <DashboardLayout>
        <div className="h-screen w-screen bg-[#0C0C10] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Error Loading Assessment
            </h2>
            <p className="text-zinc-400 mb-4">
              {error || 'Assessment not found'}
            </p>
            <Button 
              onClick={() => router.back()} 
              variant="outline"
              className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="mb-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Assessments</span>
            </button>

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-gradient-to-b from-indigo-400 to-orange-400 rounded-full"></div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">
                    {assessment.title}
                  </h1>
                </div>
                {getStatusBadge()}
              </div>
              
              {assessment.description && (
                <p className="text-zinc-400 text-sm lg:text-base mb-4">
                  {assessment.description}
                </p>
              )}
              
              {assessment.instruction && (
                <div className="mb-4 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-indigo-400" />
                    <p className="text-sm font-medium text-indigo-400">
                      Instructions:
                    </p>
                  </div>
                  <p className="text-sm text-zinc-300">{assessment.instruction}</p>
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assessment Details Card */}
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-400" />
                    <h2 className="text-sm font-semibold text-white">Assessment Details</h2>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-zinc-500 mb-1">Total Questions</p>
                      <p className="text-2xl font-bold text-white">
                        {assessment.numberOfQuestions || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500 mb-1">Total Marks</p>
                      <p className="text-2xl font-bold text-white">
                        {assessment.totalMarks}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-zinc-500 mb-1">Duration</p>
                      <p className="text-lg font-semibold text-white flex items-center gap-1">
                        <Timer className="h-4 w-4 text-indigo-400" />
                        {assessment.duration} minutes
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500 mb-1">Status</p>
                      <p className="text-lg font-semibold text-white capitalize">
                        {assessment.status}
                      </p>
                    </div>
                  </div>

                  {assessment.startDate && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 mb-1">Start Date</p>
                      <p className="text-sm text-white flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                        {new Date(assessment.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {assessment.endDate && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 mb-1">End Date</p>
                      <p className="text-sm text-white flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-orange-400" />
                        {new Date(assessment.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Your Progress Card */}
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-400" />
                    <h2 className="text-sm font-semibold text-white">Your Progress</h2>
                  </div>
                </div>
               // Update the Progress Card section to use the correct properties
<div className="p-5 space-y-4">
  {assessment.isTaken !== undefined ?(
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-1">Status</p>
          <p className="text-lg font-semibold text-white capitalize">
            {assessment.isTaken ? 'Taken' : 'Not Taken'}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-1">Attempts</p>
          <p className="text-lg font-semibold text-white">
            {assessment.isTaken ? '1' : '0'}
          </p>
        </div>
      </div>

      {assessment.assessmentState && (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">
              Current Status
            </p>
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
              {assessment.assessmentState.status.replace('_', ' ')}
            </Badge>
          </div>

          {assessment.assessmentState.status === 'in_progress' && (
            <>
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-1">
                  Time Remaining
                </p>
                <p className="text-lg font-semibold text-white">
                  {Math.floor(assessment.assessmentState.timeRemaining / 60)}
                  m{' '}
                  {assessment.assessmentState.timeRemaining % 60}s
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-1">
                  Questions Answered
                </p>
                <p className="text-lg font-semibold text-white">
                  {assessment.assessmentState.responsesCount} /{' '}
                  {assessment.numberOfQuestions || 0}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  ) : (
    <div className="text-center py-8">
      <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
        <Users className="h-6 w-6 text-zinc-500" />
      </div>
      <p className="text-sm text-zinc-400">
        You are not assigned to this assessment
      </p>
    </div>
  )}
</div>
              </div>
            </div>

            {/* Action Section */}
            <div className="mt-6 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-indigo-400" />
                  <h2 className="text-sm font-semibold text-white">Actions</h2>
                </div>
                <p className="text-xs text-zinc-500 mt-1 ml-6">
                  {isExpired()
                    ? 'This assessment has expired and cannot be taken'
                    : !assessment
                      ? 'You are not assigned to this assessment'
                      : assessment.isTaken
                        ? 'You have already taken this assessment'
                        : 'You can start this assessment when ready'}
                </p>
              </div>
              <div className="p-5">
                {getActionButton()}
              </div>
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
  );
};

export default AssessmentDetailsPage;