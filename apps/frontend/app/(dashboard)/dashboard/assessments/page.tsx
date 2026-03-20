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
  TrendingUp,
  BookOpen,
  Filter,
  X,
  Sword,
  Shield,
  Trophy,
  Skull,
  Flag,
  Target,
  Zap,
  Crown,
  Flame,
  Swords,
  Scroll,
  Map,
  Compass,
  Sparkles,
  Crosshair,
  Gem,
  Coins,
  Star,
  Hourglass,
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserAssessment } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function UserAssessmentsPage() {
  const router = useRouter();
  const { data: myAssessments, isLoading } = useMyAssessments();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="min-h-screen w-full bg-[#0C0C10] relative overflow-hidden flex items-center justify-center">
            {/* Background effects */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]"></div>
              <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipsis_at_bottom,rgba(249,115,22,0.1),transparent_50%)]"></div>
            </div>
            
            <div className="relative text-center">
              <div className="relative inline-flex mb-4">
                <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                <Sword className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-400" />
              </div>
              <p className="text-zinc-400">Loading your battle arena...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const canStartAssessment = (assessment: any) => {
    const status = getAssessmentStatus(assessment);
    return (
      status.status === 'available' &&
      !assessment.isTaken &&
      !canContinueAssessment(assessment)
    );
  };

  const canContinueAssessment = (assessment: any) => {
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

    if (!startDate || !endDate) {
      return {
        status: 'unknown',
        label: 'Unknown',
        variant: 'secondary' as const,
        icon: AlertCircle,
        color: 'text-zinc-400',
        bgColor: 'bg-zinc-500/10',
        borderColor: 'border-zinc-500/20',
      };
    }

    if (now < startDate) {
      return {
        status: 'upcoming',
        label: 'Upcoming',
        variant: 'secondary' as const,
        icon: Hourglass,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
      };
    } else if (now > endDate) {
      return {
        status: 'expired',
        label: 'Expired',
        variant: 'destructive' as const,
        icon: Skull,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
      };
    } else {
      return {
        status: 'available',
        label: 'Available',
        variant: 'default' as const,
        icon: Target,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
      };
    }
  };

  const getAssessmentActionInfo = (assessment: UserAssessment) => {
    if (assessment.isTaken) {
      if (assessment.assessmentState?.canContinue) {
        return {
          action: 'continue',
          label: 'Resume Battle',
          icon: RotateCcw,
          variant: 'default' as const,
          disabled: false,
          route: `/dashboard/assessments/take/${assessment.assessmentResultId}`,
          description: 'Continue your conquest',
          gradient: 'from-blue-500 to-indigo-500',
        };
      }
      return {
        action: 'completed',
        label: 'Victory',
        icon: Trophy,
        variant: 'secondary' as const,
        disabled: true,
        route: '#',
        description: 'Battle won',
        gradient: 'from-green-500 to-emerald-500',
      };
    }

    if (canStartAssessment(assessment)) {
      return {
        action: 'start',
        label: 'Start Battle',
        icon: Swords,
        variant: 'default' as const,
        disabled: false,
        route: `/dashboard/assessments/${assessment._id}`,
        description: 'Enter the arena',
        gradient: 'from-indigo-500 to-purple-500',
      };
    }

    const statusInfo = getAssessmentStatus(assessment);
    if (statusInfo.status === 'upcoming') {
      return {
        action: 'upcoming',
        label: 'Prepare',
        icon: Shield,
        variant: 'secondary' as const,
        disabled: true,
        route: '#',
        description: 'Battle approaching',
        gradient: 'from-orange-500 to-amber-500',
      };
    }

    if (statusInfo.status === 'expired') {
      return {
        action: 'expired',
        label: 'Fallen',
        icon: Skull,
        variant: 'destructive' as const,
        disabled: true,
        route: '#',
        description: 'Battle has ended',
        gradient: 'from-red-500 to-orange-500',
      };
    }

    return {
      action: 'unknown',
      label: 'Unknown',
      icon: AlertCircle,
      variant: 'secondary' as const,
      disabled: true,
      route: '#',
      description: 'Status unknown',
      gradient: 'from-gray-500 to-zinc-500',
    };
  };

  const getAssessmentCardStyle = (assessment: any) => {
    if (assessment.isTaken) {
      return 'border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent';
    }
    if (canContinueAssessment(assessment)) {
      return 'border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent';
    }
    if (canStartAssessment(assessment)) {
      return 'border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent';
    }
    return 'border-white/5';
  };

  // Summary stats
  const availableCount = filteredAssessments.filter(
    (a) => !a.isTaken && canStartAssessment(a)
  ).length;
  
  const inProgressCount = filteredAssessments.filter((a) => canContinueAssessment(a)).length;
  const completedCount = filteredAssessments.filter((a) => a.isTaken).length;
  const totalCount = filteredAssessments.length;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-screen w-full bg-[#0C0C10] relative overflow-x-hidden">
          {/* Complex layered background */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]"></div>
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom,rgba(249,115,22,0.1),transparent_50%)]"></div>
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="relative z-10 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
              
              {/* Header - War Room */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <Swords className="h-6 w-6 text-indigo-400" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Battle Arena
                  </h1>
                </div>
                <p className="text-zinc-400 text-sm sm:text-base">
                  Choose your challenge and prove your worth
                </p>
              </div>

              {/* War Council - Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
                <Card className="bg-white/5 border-white/10 hover:border-indigo-500/30 transition-all group">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider">Available</p>
                        <p className="text-xl sm:text-2xl font-bold text-white mt-1">{availableCount}</p>
                      </div>
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Target className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-zinc-500">Ready for battle</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 hover:border-orange-500/30 transition-all group">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider">In Progress</p>
                        <p className="text-xl sm:text-2xl font-bold text-white mt-1">{inProgressCount}</p>
                      </div>
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/10 border border-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Sword className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1">
                      <Flame className="h-3 w-3 text-orange-500" />
                      <span className="text-xs text-zinc-500">Battles raging</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 hover:border-yellow-500/30 transition-all group">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider">Victories</p>
                        <p className="text-xl sm:text-2xl font-bold text-white mt-1">{completedCount}</p>
                      </div>
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 border border-yellow-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1">
                      <Crown className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-zinc-500">Battles won</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 hover:border-purple-500/30 transition-all group">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider">Total</p>
                        <p className="text-xl sm:text-2xl font-bold text-white mt-1">{totalCount}</p>
                      </div>
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Scroll className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1">
                      <Gem className="h-3 w-3 text-purple-500" />
                      <span className="text-xs text-zinc-500">Total quests</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Scout & Filter - Reconnaissance */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400" />
                    <Input
                      placeholder="Scout battles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-10 py-2.5 bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl text-white placeholder:text-zinc-600"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400 pointer-events-none" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48 pl-10 bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl text-white">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                        <SelectItem value="all" className="hover:bg-white/5 focus:bg-white/5">All Battles</SelectItem>
                        <SelectItem value="available" className="hover:bg-white/5 focus:bg-white/5">Available</SelectItem>
                        <SelectItem value="in_progress" className="hover:bg-white/5 focus:bg-white/5">In Progress</SelectItem>
                        <SelectItem value="upcoming" className="hover:bg-white/5 focus:bg-white/5">Upcoming</SelectItem>
                        <SelectItem value="expired" className="hover:bg-white/5 focus:bg-white/5">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Battle Grid - Quests */}
              {filteredAssessments.length === 0 ? (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="text-center py-12">
                    <div className="h-16 w-16 bg-gradient-to-br from-indigo-500/10 to-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                      <Compass className="h-8 w-8 text-indigo-400" />
                    </div>
                    <p className="text-zinc-300 font-medium mb-2">
                      {searchTerm || statusFilter !== 'all'
                        ? 'No battles match your scout'
                        : 'No battles have been assigned to you yet'}
                    </p>
                    {(searchTerm || statusFilter !== 'all') && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                        }}
                        className="border-white/10 hover:bg-white/5 text-zinc-300 rounded-xl mt-2"
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
                    const StatusIcon = statusInfo.icon;

                    return (
                      <Card
                        key={assessment._id}
                        className={cn(
                          "bg-white/5 border-white/10 hover:border-white/20 transition-all hover:scale-[1.02] overflow-hidden group",
                          cardStyle
                        )}
                      >
                        {/* Battle Banner - Status Bar */}
                        <div className={cn(
                          "h-1 w-full bg-gradient-to-r",
                          assessment.isTaken ? "from-green-500 to-emerald-500" :
                          canContinueAssessment(assessment) ? "from-blue-500 to-indigo-500" :
                          canStartAssessment(assessment) ? "from-green-500 to-emerald-500" :
                          statusInfo.status === 'upcoming' ? "from-orange-500 to-amber-500" :
                          statusInfo.status === 'expired' ? "from-red-500 to-orange-500" :
                          "from-gray-500 to-zinc-500"
                        )} />

                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <CardTitle className="text-lg font-semibold text-white">
                                  {assessment.title}
                                </CardTitle>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "border text-xs",
                                    statusInfo.bgColor,
                                    statusInfo.borderColor,
                                    statusInfo.color
                                  )}
                                >
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusInfo.label}
                                </Badge>
                              </div>
                              <CardDescription className="mt-2 text-sm text-zinc-400 line-clamp-2">
                                {assessment.description || 'No description available'}
                              </CardDescription>
                              {assessment.instruction && (
                                <div className="mt-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300">
                                  <span className="font-medium flex items-center gap-1">
                                    <Scroll className="h-3 w-3" />
                                    Battle Instructions:
                                  </span>
                                  <span className="mt-1 block">{assessment.instruction}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Battle Stats */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                              <Award className="h-4 w-4 text-indigo-400" />
                              <span className="text-sm font-medium text-white">{assessment.totalMarks}</span>
                              <span className="text-xs text-zinc-500">points</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                              <Clock className="h-4 w-4 text-orange-400" />
                              <span className="text-sm font-medium text-white">{assessment.duration}</span>
                              <span className="text-xs text-zinc-500">min</span>
                            </div>
                          </div>

                          {/* Battle Intel */}
                          <div className="text-xs text-zinc-400 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                            <span className="flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-indigo-400" />
                              {actionInfo.description}
                            </span>
                          </div>

                          {/* Battle Timeline */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                              <Calendar className="h-4 w-4 text-indigo-400" />
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

                          {/* Battle Actions */}
                          <div className="space-y-2">
                            <Button
                              className={cn(
                                "w-full rounded-xl bg-gradient-to-r text-white border-0",
                                !actionInfo.disabled ? actionInfo.gradient : "from-zinc-500/50 to-zinc-600/50"
                              )}
                              variant={actionInfo.disabled ? "outline" : "default"}
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
                                className="w-full rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-indigo-400"
                                variant="outline"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/assessment-results/${assessment.assessmentResultId}`
                                  )
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Battle Report
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Battlefield Report - Footer */}
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-indigo-500"></span>
                  <span className="text-xs text-zinc-500">Battle Arena</span>
                  <span className="h-1 w-1 rounded-full bg-orange-500"></span>
                </div>
                <span className="text-xs text-zinc-500">
                  {filteredAssessments.length} battle{filteredAssessments.length !== 1 ? 's' : ''} found
                </span>
              </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
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