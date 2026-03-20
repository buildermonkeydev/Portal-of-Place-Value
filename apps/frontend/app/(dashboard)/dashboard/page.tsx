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
import { Badge } from '@/components/ui/badge';
import {
  Award,
  Clock,
  CheckCircle,
  BarChart3,
  Code,
  ClipboardList,
  TrendingUp,
  Target,
  Zap,
  BookOpen,
  ChevronRight,
  Activity,
  Flame,
  Crown,
  Rocket,
  Brain,
  ArrowUpRight,
  Layers,
  PlayCircle,
  Trophy,
  Medal,
  Star,
  AlertCircle,
  Hourglass,
  PieChart,
  Sparkles,
  GitBranch,
  Users,
  Calendar,
  Shield,
  Lightbulb,
  Cpu,
  Gauge,
  Network,
  Wallet,
  Briefcase,
  GraduationCap,
  LineChart,
  Compass,
  Puzzle,
  Sword,
  ShieldCheck,
  ZapIcon,
} from 'lucide-react';
import { AssessmentResult, UserAssessment } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useState, useEffect, ReactNode } from 'react';

// Define stat item type
interface StatItem {
  icon: React.ElementType;
  iconColor: string;
  value: string | number;
  label: string;
  secondaryIcon?: React.ElementType;
  secondaryColor?: string;
}

export default function UserDashboardPage() {
  const { user } = useAuth();
  const { data: myAssessments, isLoading: myAssessmentsLoading } = useMyAssessments();
  const { data: availableAssessments = [], isLoading: availableLoading } = useAvailableAssessments({ limit: 3 });
  const { data: myResults, isLoading: resultsLoading } = useMyResults();

  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const hour = currentTime.getHours();
    if (hour < 12) setGreeting('morning');
    else if (hour < 18) setGreeting('afternoon');
    else setGreeting('evening');

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [currentTime]);

  if (!user) return null;

  const allAssessments = myAssessments || [];
  const completedAssessmentsList = allAssessments.filter(
    (a: UserAssessment) => a.isTaken || Boolean(a.assessmentResultId)
  );
  const completedAssessments = completedAssessmentsList.length;
  
  const averageScore = myResults && myResults.length > 0
    ? myResults.reduce((sum: number, r: AssessmentResult) => sum + (r.percentage || 0), 0) / myResults.length
    : 0;

  const pendingAssessments = allAssessments.filter(
    (a: UserAssessment) => !a.isTaken && !a.assessmentResultId
  ).length;

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`;

  // Calculate level based on completed assessments
  const level = Math.floor(completedAssessments / 3) + 1;
  const nextLevelProgress = (completedAssessments % 3) * 33.33;

  // Get top performance
  const topScore = myResults && myResults.length > 0
    ? Math.max(...myResults.map((r: AssessmentResult) => r.percentage || 0))
    : 0;

  // Get latest result
  const latestResult = myResults && myResults.length > 0 
    ? myResults.sort((a, b) => new Date(b.endTime || '').getTime() - new Date(a.endTime || '').getTime())[0]
    : null;

  // Recent activity from actual data
  const recentActivities = [
    ...(myResults?.slice(0, 2).map((r: AssessmentResult) => ({
      id: r._id,
      type: 'completed' as const,
      name: r.assessmentId?.title || 'Assessment',
      time: r.endTime ? new Date(r.endTime).toLocaleDateString() : 'Recently',
      score: r.percentage
    })) || []),
    ...(allAssessments?.filter((a: UserAssessment) => !a.isTaken).slice(0, 1).map((a: UserAssessment) => ({
      id: a._id,
      type: 'pending' as const,
      name: a.title,
      time: 'Not started'
    })) || [])
  ].slice(0, 3);

  // Define main stats with meaningful names
  const mainStats: StatItem[] = [
    { 
      icon: Trophy, 
      iconColor: 'text-yellow-400', 
      value: completedAssessments, 
      label: 'Completed Assessments',
      secondaryIcon: TrendingUp,
      secondaryColor: 'text-emerald-400'
    },
    { 
      icon: Compass, 
      iconColor: 'text-indigo-400', 
      value: availableAssessments.length, 
      label: 'Available Challenges',
      secondaryIcon: Sparkles,
      secondaryColor: 'text-indigo-400'
    },
    { 
      icon: Brain, 
      iconColor: 'text-purple-400', 
      value: averageScore.toFixed(1) + '%', 
      label: 'Average Performance',
      secondaryIcon: Star,
      secondaryColor: 'text-yellow-400'
    },
    { 
      icon: Hourglass, 
      iconColor: 'text-orange-400', 
      value: pendingAssessments, 
      label: 'Pending Tasks',
      secondaryIcon: AlertCircle,
      secondaryColor: 'text-orange-400'
    }
  ];

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

          {/* Main content */}
          <div className="relative z-10 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
              
              {/* Header Section - Welcome Zone */}
              <div className="mb-8 lg:mb-12">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6">
                  <div className="space-y-4 w-full lg:w-auto">
                    <div className="flex items-center gap-4">
                      <div className="relative group flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-orange-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0C0C10] border border-white/10 flex items-center justify-center">
                          <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-400 to-orange-400 bg-clip-text text-transparent">
                            {initials}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 border-[#0C0C10]"></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight break-words">
                          Good {greeting}
                        </h1>
                        {/* <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-base sm:text-lg text-zinc-300 truncate max-w-[200px] sm:max-w-none">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-zinc-600 flex-shrink-0"></span>
                          <span className="text-xs sm:text-sm text-zinc-500 truncate max-w-[150px] sm:max-w-none">
                            {user.email}
                          </span>
                        </div> */}
                      </div>
                    </div>

                    {/* Live stats strip - Performance Metrics */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2">
                      <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 sm:px-4 py-2 border border-white/10 hover:border-indigo-500/30 transition-all">
                        <Flame className="h-4 w-4 text-orange-400 flex-shrink-0" />
                        <span className="text-white text-sm font-medium whitespace-nowrap">Level {level} Warrior</span>
                        <div className="w-12 sm:w-16 h-1.5 bg-white/10 rounded-full overflow-hidden ml-1">
                          <div className="h-full bg-gradient-to-r from-indigo-400 to-orange-400 rounded-full" style={{ width: `${nextLevelProgress}%` }}></div>
                        </div>
                      </div>
                      {topScore > 0 && (
                        <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 sm:px-4 py-2 border border-white/10 hover:border-yellow-500/30 transition-all">
                          <Crown className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                          <span className="text-white text-sm font-medium whitespace-nowrap">Top {topScore.toFixed(0)}% Performer</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 sm:px-4 py-2 border border-white/10 hover:border-indigo-500/30 transition-all">
                        <Calendar className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                        <span className="text-white text-sm font-medium whitespace-nowrap">
                          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick action button - Featured Challenge */}
                  {availableAssessments.length > 0 && (
                    <Link 
                      href={`/dashboard/assessments/${availableAssessments[0]._id}`}
                      className="group relative w-full lg:w-auto"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-orange-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
                      <div className="relative bg-[#0C0C10] border border-white/10 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 hover:border-white/20 transition-all">
                        <Rocket className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-white font-medium text-sm sm:text-base truncate max-w-[200px]">Continue Learning</p>
                          <p className="text-xs text-zinc-500 truncate max-w-[200px]">{availableAssessments[0].title}</p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors flex-shrink-0" />
                      </div>
                    </Link>
                  )}
                </div>
              </div>

              {/* Main grid - Asymmetrical layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                
                {/* Left column - Main content (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Stats grid - Performance Dashboard */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {mainStats.map((stat, index) => (
                      <div key={index} className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-indigo-500/30 transition-all group">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", stat.iconColor, "group-hover:scale-110 transition-transform")} />
                          {stat.secondaryIcon && (
                            <stat.secondaryIcon className={cn("h-3 w-3 sm:h-4 sm:w-4", stat.secondaryColor)} />
                          )}
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-white break-words">{stat.value}</p>
                        <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Featured Challenge - Battle Arena */}
                  {availableAssessments.length > 0 && (
                    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1A1A2A] to-[#0C0C10] border border-white/10 group">
                      <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
                      <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-orange-500 rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
                      <div className="relative p-5 sm:p-8">
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                          <Sword className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                          <span className="text-xs sm:text-sm font-medium text-zinc-300">Battle Arena · Featured Challenge</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3 break-words">
                          {availableAssessments[0].title}
                        </h2>
                        <p className="text-sm sm:text-base text-zinc-400 mb-4 sm:mb-6 max-w-xl line-clamp-2 sm:line-clamp-none">
                          {availableAssessments[0].description}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                          <Link 
                            href={`/dashboard/assessments/${availableAssessments[0]._id}`}
                            className="bg-white text-[#0C0C10] px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium hover:bg-zinc-200 transition-colors inline-flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto group"
                          >
                            <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
                            Enter Battle
                          </Link>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-zinc-500 flex-shrink-0" />
                              <span className="text-zinc-400 whitespace-nowrap">{availableAssessments[0].duration} min</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <Award className="h-3 w-3 sm:h-4 sm:w-4 text-zinc-500 flex-shrink-0" />
                              <span className="text-zinc-400 whitespace-nowrap">{availableAssessments[0].totalMarks} points</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Navigation - Mission Control */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Link href="/dashboard/assessments" className="group">
                      <div className="bg-white/5 rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-white/10 hover:border-indigo-500/50 transition-all hover:-translate-y-1">
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                          <ClipboardList className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-400 group-hover:scale-110 transition-transform" />
                          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <h3 className="text-white font-semibold mb-1 text-sm sm:text-base">Assessment Hub</h3>
                        <p className="text-xs sm:text-sm text-zinc-500">{allAssessments.length} total · {completedAssessments} completed</p>
                      </div>
                    </Link>
                    
                    <Link href="/dashboard/tests" className="group">
                      <div className="bg-white/5 rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-white/10 hover:border-orange-500/50 transition-all hover:-translate-y-1">
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                          <Code className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400 group-hover:scale-110 transition-transform" />
                          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-600 group-hover:text-orange-400 transition-colors" />
                        </div>
                        <h3 className="text-white font-semibold mb-1 text-sm sm:text-base">Coding Dojo</h3>
                        <p className="text-xs sm:text-sm text-zinc-500">Practice problems · Compete</p>
                      </div>
                    </Link>
                  </div>

                  {/* Activity timeline - Battle Log */}
                  {recentActivities.length > 0 && (
                    <div className="bg-white/5 rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-4 sm:mb-5">
                        <h3 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
                          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400" />
                          Battle Log · Recent Activity
                        </h3>
                        <Link href="/dashboard/assessments" className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
                          View all <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        {recentActivities.map((activity) => (
                          <div key={activity.id} className="flex items-center gap-3 sm:gap-4 group">
                            <div className={cn(
                              "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0",
                              activity.type === 'completed' 
                                ? "bg-emerald-500/10 group-hover:bg-emerald-500/20" 
                                : "bg-indigo-500/10 group-hover:bg-indigo-500/20"
                            )}>
                              {activity.type === 'completed' ? (
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                              ) : (
                                <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs sm:text-sm font-medium truncate">{activity.name}</p>
                              <p className="text-xs text-zinc-500">{activity.time}</p>
                            </div>
                            {'score' in activity && activity.score && (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs whitespace-nowrap flex-shrink-0">
                                {activity.score.toFixed(1)}% Score
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right column - Sidebar (4 cols) - Player Stats */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Progress ring - Level Progression */}
                  <div className="bg-white/5 rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-white/10">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm sm:text-base">
                      <Target className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
                      Level Progression
                    </h3>
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 mx-auto mb-4">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className="text-white/10"
                        />
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          strokeLinecap="round"
                          className="text-indigo-400"
                          strokeDasharray={`${2 * Math.PI * 45}`}
                          strokeDashoffset={`${2 * Math.PI * 45 * (1 - nextLevelProgress / 100)}`}
                          style={{ transformOrigin: 'center' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl sm:text-2xl font-bold text-white">Lvl {level}</span>
                        <span className="text-xs text-zinc-500">{3 - (completedAssessments % 3)} to next</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs sm:text-sm text-zinc-300">{completedAssessments} battles won</p>
                      <p className="text-xs text-zinc-500 mt-1">Next level in {3 - (completedAssessments % 3)} victories</p>
                    </div>
                  </div>

                  {/* Skills - Arsenal */}
                  <div className="bg-white/5 rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-white/10">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <ZapIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                      Skill Arsenal
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {availableAssessments.slice(0, 6).map((assessment) => (
                        <Badge 
                          key={assessment._id} 
                          variant="outline" 
                          className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:border-indigo-500/30 cursor-default transition-all text-xs"
                        >
                          {assessment.title.split(' ')[0]}
                        </Badge>
                      ))}
                      {availableAssessments.length === 0 && completedAssessments === 0 && (
                        <p className="text-xs text-zinc-500">Complete battles to unlock skills</p>
                      )}
                    </div>
                  </div>

                  {/* Quick stats - Combat Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-indigo-500/30 transition-all group">
                      <ShieldCheck className="h-4 w-4 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-white font-bold text-base sm:text-lg">#{level}</p>
                      <p className="text-xs text-zinc-500">Warrior Rank</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-orange-500/30 transition-all group">
                      <Gauge className="h-4 w-4 text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-white font-bold text-base sm:text-lg">{myResults?.length || 0}</p>
                      <p className="text-xs text-zinc-500">Battles Fought</p>
                    </div>
                  </div>

                  {/* Latest Achievement */}
                  {latestResult && (
                    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-white/10">
                      <div className="flex items-center gap-3">
                        <Medal className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-zinc-400">Latest Victory</p>
                          <p className="text-lg sm:text-xl font-bold text-white break-words">{latestResult.percentage?.toFixed(1)}% Score</p>
                          <p className="text-xs text-zinc-500 mt-1">{latestResult.assessmentId?.title || 'Assessment'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Current streak - Victory Streak */}
                  <div className="bg-gradient-to-br from-indigo-500/10 to-orange-500/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-white/10">
                    <div className="flex items-center gap-3">
                      <Flame className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400 flex-shrink-0 animate-pulse" />
                      <div className="min-w-0">
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white break-words">{completedAssessments} Day Streak</p>
                        <p className="text-xs text-zinc-400">Keep the momentum going!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom section - Learning Path */}
              {availableAssessments.length > 0 && (
                <div className="mt-8 lg:mt-12">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-white text-lg sm:text-xl font-semibold flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400" />
                      Learning Path · Next Challenges
                    </h3>
                    <Link href="/dashboard/assessments" className="text-xs sm:text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
                      View all <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {availableAssessments.slice(0, 3).map((assessment, index) => (
                      <div key={assessment._id} className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-orange-500/20 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-white/20 transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs">
                              {index === 0 ? '🔥 Hot' : index === 1 ? '⚡ New' : '🎯 Target'}
                            </Badge>
                            <Clock className="h-3 w-3 text-zinc-500" />
                          </div>
                          <h4 className="text-white font-semibold mb-1 text-sm sm:text-base truncate">{assessment.title}</h4>
                          <p className="text-xs text-zinc-400 mb-4 line-clamp-2">{assessment.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-500">{assessment.totalMarks} points</span>
                            <Link 
                              href={`/dashboard/assessments/${assessment._id}`}
                              className="text-xs sm:text-sm text-indigo-400 group-hover:gap-2 transition-all flex items-center"
                            >
                              Start <ChevronRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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