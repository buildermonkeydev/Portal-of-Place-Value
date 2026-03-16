'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useMyAssessments } from '@/lib/hooks/useAssessments';
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
  Play,
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  AlertCircle,
  Sun,
  Cloud,
  Sparkles,
  TrendingUp,
  BookOpen,
  Filter,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserAssessment } from '@/lib/types';
import { Loading } from '@/components/ui/Loading';

export default function UserAssessmentsPage() {
  const router = useRouter();
  const { data: myAssessments, isLoading } = useMyAssessments();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="min-h-screen bg-gradient-to-br from-sky-50 to-orange-50 flex items-center justify-center">
            <div className="text-center">
              <div className="relative inline-flex mb-4">
                <div className="h-16 w-16 rounded-full border-4 border-sky-200 border-t-sky-500 animate-spin"></div>
                <BookOpen className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-sky-300" />
              </div>
              <p className="text-gray-500">Loading your assessments...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const canStartAssessment = (assessment: any) => {
    // console.log('assessment', assessment);
    const status = getAssessmentStatus(assessment);
    // console.log('status', status);

    // Only allow starting if status is 'available' (not expired, not upcoming)
    return (
      status.status === 'available' &&
      !assessment.isTaken &&
      !canContinueAssessment(assessment)
    );
  };

  const canContinueAssessment = (assessment: any) => {
    // Check if assessment has state and can continue
    return (
      assessment.assessmentState &&
      assessment.assessmentState.canContinue &&
      !assessment.assessmentState.isExpired
    );
  };

  const canViewResults = (assessment: UserAssessment) => {
    const visibilityEnabled = assessment.showResultsToUsers === true;
    return (
      visibilityEnabled &&
      assessment.isTaken &&
      !canContinueAssessment(assessment) &&
      !!assessment.assessmentResultId
    );
  };
  // Filter assessments based on search and status
  const filteredAssessments =
    myAssessments?.filter((assessment) => {
      const matchesSearch =
        assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === 'available') {
        const now = new Date();
        const startDate = assessment.startDate
          ? new Date(assessment.startDate)
          : null;
        const endDate = assessment.endDate
          ? new Date(assessment.endDate)
          : null;
        const isExpired = endDate ? now > endDate : false;
        const isExpiredByState = assessment.assessmentState?.isExpired === true;

        matchesStatus =
          assessment.status === 'active' &&
          !!startDate &&
          now >= startDate &&
          !isExpired &&
          !isExpiredByState &&
          !assessment.isTaken &&
          !canContinueAssessment(assessment);
      } else if (statusFilter === 'in_progress') {
        matchesStatus = canContinueAssessment(assessment);
      } else if (statusFilter === 'upcoming') {
        matchesStatus =
          !!assessment.assessmentState &&
          assessment.assessmentState.status === 'in_progress';
      } else if (statusFilter === 'expired') {
        matchesStatus =
          !!assessment.endDate && new Date() > new Date(assessment.endDate);
      }

      return matchesSearch && matchesStatus;
    }) || [];

  const getAssessmentStatus = (assessment: any) => {
    const now = new Date();
    const startDate = assessment.startDate
      ? new Date(assessment.startDate)
      : null;
    const endDate = assessment.endDate ? new Date(assessment.endDate) : null;

    // console.log('startDategetAssessmentStatus', startDate);
    // console.log('endDategetAssessmentStatus', endDate);
    // console.log('nowgetAssessmentStatus', now);
    // console.log('assessmentgetAssessmentStatus', assessment);
    if (!startDate || !endDate) {
      return {
        status: 'unknown',
        label: 'Unknown',
        variant: 'secondary' as const,
      };
    }

    if (now < startDate) {
      return {
        status: 'upcoming',
        label: 'Upcoming',
        variant: 'secondary' as const,
      };
    } else if (now > endDate) {
      return {
        status: 'expired',
        label: 'Expired',
        variant: 'destructive' as const,
      };
    } else {
      return {
        status: 'available',
        label: 'Available',
        variant: 'default' as const,
      };
    }
  };

  const getAssessmentActionInfo = (assessment: UserAssessment) => {
    if (assessment.isTaken) {
      if (assessment.assessmentState?.canContinue) {
        return {
          action: 'continue',
          label: 'Continue Assessment',
          icon: RotateCcw,
          variant: 'default' as const,
          disabled: false,
          route: `/dashboard/assessments/take/${assessment.assessmentResultId}`,
          description: 'Continue from where you left off',
        };
      }
      return {
        action: 'completed',
        label: 'Completed',
        icon: CheckCircle,
        variant: 'secondary' as const,
        disabled: true,
        route: '#',
        description: 'Assessment completed',
      };
    }

    if (canStartAssessment(assessment)) {
      return {
        action: 'start',
        label: 'Start Assessment',
        icon: Play,
        variant: 'default' as const,
        disabled: false,
        route: `/dashboard/assessments/${assessment._id}`,
        description: 'Begin your assessment',
      };
    }

    const statusInfo = getAssessmentStatus(assessment);
    // console.log('statusInfo', statusInfo);
    if (statusInfo.status === 'upcoming') {
      return {
        action: 'upcoming',
        label: 'Not Available Yet',
        icon: Clock,
        variant: 'secondary' as const,
        disabled: true,
        route: '#',
        description: 'Assessment will be available soon',
      };
    }

    if (statusInfo.status === 'expired') {
      return {
        action: 'expired',
        label: 'Expired',
        icon: XCircle,
        variant: 'destructive' as const,
        disabled: true,
        route: '#',
        description: 'Assessment period has ended',
      };
    }

    return {
      action: 'unknown',
      label: 'Not Available',
      icon: AlertCircle,
      variant: 'secondary' as const,
      disabled: true,
      route: '#',
      description: 'Assessment status unknown',
    };
  };

  const getAssessmentCardStyle = (assessment: any) => {
    if (assessment.isTaken) {
      return 'border-green-200 bg-gradient-to-br from-green-50/30 to-green-50/10';
    }
    if (canContinueAssessment(assessment)) {
      return 'border-blue-200 bg-gradient-to-br from-blue-50/30 to-blue-50/10';
    }
    if (canStartAssessment(assessment)) {
      return 'border-green-200 bg-gradient-to-br from-green-50/30 to-green-50/10';
    }
    return '';
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
            {/* Header */}
            <div className="mb-8">
           
              
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-sky-700 via-sky-600 to-orange-600 bg-clip-text text-transparent">
                  My Assessments
                </span>
              </h1>
              <p className="mt-2 text-gray-500">
                View and take assessments assigned to you
              </p>
            </div>

            {/* Assessment Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="border-sky-100 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Available</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {filteredAssessments.filter(
                          (a) => !a.isTaken && canStartAssessment(a)
                        ).length}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
                      <Play className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-gray-400">Ready to start</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-sky-100 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">In Progress</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {filteredAssessments.filter((a) => canContinueAssessment(a)).length}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                      <RotateCcw className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-orange-500" />
                    <span className="text-xs text-gray-400">Continue where you left off</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-sky-100 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Completed</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {filteredAssessments.filter((a) => a.isTaken).length}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                    <Award className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-gray-400">Finished assessments</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-sky-100 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {filteredAssessments.length}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-purple-500" />
                    <span className="text-xs text-gray-400">All assessments</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sky-400" />
                  <Input
                    placeholder="Search assessments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10 py-2.5 border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sky-400 pointer-events-none" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48 pl-10 border-sky-200 focus:border-sky-400 rounded-xl bg-white/80">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assessments</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Assessment Grid */}
            {filteredAssessments.length === 0 ? (
              <Card className="border-sky-100 shadow-sm">
                <CardContent className="text-center py-12">
                  <div className="h-16 w-16 bg-gradient-to-br from-sky-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-sky-400" />
                  </div>
                  <p className="text-gray-500 font-medium mb-2">
                    {searchTerm || statusFilter !== 'all'
                      ? 'No assessments match your filters'
                      : 'No assessments have been assigned to you yet'}
                  </p>
                  {(searchTerm || statusFilter !== 'all') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                      className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl mt-2"
                    >
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {filteredAssessments.map((assessment) => {
                  const statusInfo = getAssessmentStatus(assessment);
                  const actionInfo = getAssessmentActionInfo(assessment);
                  const ActionIcon = actionInfo.icon;
                  const cardStyle = getAssessmentCardStyle(assessment);

                  return (
                    <Card
                      key={assessment._id}
                      className={`border-sky-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] overflow-hidden ${cardStyle}`}
                    >
                      {/* Status Bar */}
                      <div className={`h-1 w-full ${
                        assessment.isTaken ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                        canContinueAssessment(assessment) ? 'bg-gradient-to-r from-blue-400 to-sky-400' :
                        canStartAssessment(assessment) ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                        statusInfo.status === 'upcoming' ? 'bg-gradient-to-r from-orange-400 to-amber-400' :
                        statusInfo.status === 'expired' ? 'bg-gradient-to-r from-red-400 to-orange-400' :
                        'bg-gradient-to-r from-gray-400 to-gray-300'
                      }`} />

                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-lg font-semibold text-gray-800">
                                {assessment.title}
                              </CardTitle>
                              {assessment.isTaken && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                              {canContinueAssessment(assessment) && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  In Progress
                                </Badge>
                              )}
                              {canStartAssessment(assessment) && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                  <Play className="h-3 w-3 mr-1" />
                                  Ready to Start
                                </Badge>
                              )}
                            </div>
                            <CardDescription className="mt-2 text-sm text-gray-600 line-clamp-2">
                              {assessment.description || 'No description available'}
                            </CardDescription>
                            {assessment.instruction && (
                              <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                                <span className="font-medium">📋 Instructions:</span>{' '}
                                {assessment.instruction}
                              </div>
                            )}
                          </div>
                          <Badge 
                            variant="outline"
                            className={`ml-2 ${
                              statusInfo.variant === 'default' 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : statusInfo.variant === 'destructive'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-gray-50 text-gray-600 border-gray-200'
                            }`}
                          >
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Assessment Details */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 p-2 bg-sky-50/30 rounded-lg">
                            <Award className="h-4 w-4 text-sky-500" />
                            <span className="text-sm font-medium text-gray-700">{assessment.totalMarks}</span>
                            <span className="text-xs text-gray-400">marks</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-orange-50/30 rounded-lg">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-medium text-gray-700">{assessment.duration}</span>
                            <span className="text-xs text-gray-400">min</span>
                          </div>
                        </div>

                        {/* Action Description */}
                        <div className="text-xs text-gray-500 bg-gradient-to-r from-sky-50/30 to-orange-50/30 px-3 py-2 rounded-lg border border-sky-100">
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-sky-400" />
                            {actionInfo.description}
                          </span>
                        </div>

                        {/* Date Range */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4 text-sky-400" />
                            <span>
                              {assessment.startDate
                                ? new Date(assessment.startDate).toLocaleDateString()
                                : 'Not set'}{' '}
                              -{' '}
                              {assessment.endDate
                                ? new Date(assessment.endDate).toLocaleDateString()
                                : 'Not set'}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <Button
                            className="w-full rounded-xl"
                            variant={actionInfo.variant === 'default' ? 'default' : 'outline'}
                            disabled={actionInfo.disabled}
                            onClick={() => {
                              if (!actionInfo.disabled && actionInfo.route !== '#') {
                                router.push(actionInfo.route);
                              }
                            }}
                          >
                            <ActionIcon className="h-4 w-4 mr-2" />
                            {actionInfo.label}
                          </Button>
                          
                          {canViewResults(assessment) && assessment.assessmentResultId && (
                            <Button
                              className="w-full rounded-xl border-sky-200 hover:bg-sky-50 text-sky-700"
                              variant="outline"
                              onClick={() =>
                                router.push(
                                  `/dashboard/assessment-results/${assessment.assessmentResultId}`
                                )
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Results
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-sky-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-sky-300"></span>
                <span className="text-xs text-gray-400">My Assessments</span>
                <span className="h-1 w-1 rounded-full bg-orange-300"></span>
              </div>
              <span className="text-xs text-gray-400">
                {filteredAssessments.length} assessment{filteredAssessments.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}