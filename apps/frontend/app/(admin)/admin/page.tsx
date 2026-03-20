'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useDashboardStats } from '@/lib/hooks/useDashboard';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { 
  Users, 
  FileText, 
  HelpCircle, 
  PieChart, 
  Building2, 
  GraduationCap,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Activity,
  Settings,
  Shield,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  BookOpen,
  Award,
  Target,
  Zap,
  Layers,
  Folder,
  Database,
  Server,
  HardDrive,
  Mail,
  Phone,
  MapPin,
  Globe,
  Link2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { isAdmin } = useAuth();
  const { data: stats, isLoading, error } = useDashboardStats();

  const completionRate =
    stats?.assessments.total && stats?.assessments.completed
      ? Math.round((stats.assessments.completed / stats.assessments.total) * 100)
      : 0;

  // Safe access helpers
  const recentAssessments = stats?.recentActivity?.assessments ?? [];
  const recentResults = stats?.recentActivity?.results ?? [];

  if (!isAdmin || isLoading || error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="min-h-screen bg-[#0C0C10] flex items-center justify-center">
            <div className="text-center">
              <div className="relative inline-flex mb-4">
                <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                <Shield className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-400" />
              </div>
              <p className="text-zinc-400 text-base">
                {!isAdmin ? "Access restricted. Admin only." : isLoading ? "Loading dashboard..." : "Something went wrong."}
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const statCards = [
    { 
      value: stats?.users.total ?? 0, 
      label: 'Total Users', 
      icon: Users, 
      gradient: 'from-indigo-500 to-blue-500',
      bgGlow: 'indigo'
    },
    { 
      value: stats?.assessments.active ?? 0, 
      label: 'Active Assessments', 
      icon: FileText, 
      gradient: 'from-orange-500 to-amber-500',
      bgGlow: 'orange'
    },
    { 
      value: stats?.questions.total ?? 0, 
      label: 'Questions', 
      icon: HelpCircle, 
      gradient: 'from-indigo-400 to-cyan-500',
      bgGlow: 'cyan'
    },
    { 
      value: `${completionRate}%`, 
      label: 'Completion Rate', 
      icon: Target, 
      gradient: 'from-orange-400 to-amber-500',
      bgGlow: 'amber'
    },
  ];

  const userStats = [
    { 
      label: 'Active Users', 
      value: stats?.users.active ?? 0, 
      icon: UserCheck, 
      color: 'text-green-400', 
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    { 
      label: 'Inactive Users', 
      value: stats?.users.inactive ?? 0, 
      icon: UserX, 
      color: 'text-red-400', 
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
    { 
      label: 'Verified', 
      value: stats?.users.verified ?? 0, 
      icon: CheckCircle, 
      color: 'text-indigo-400', 
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20'
    },
    { 
      label: 'Unverified', 
      value: stats?.users.unverified ?? 0, 
      icon: Clock, 
      color: 'text-orange-400', 
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    },
  ];

  const assessmentStats = [
    { 
      label: 'Active', 
      value: stats?.assessments.active ?? 0, 
      icon: Eye, 
      color: 'text-green-400', 
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    { 
      label: 'Inactive', 
      value: stats?.assessments.inactive ?? 0, 
      icon: EyeOff, 
      color: 'text-red-400', 
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
    { 
      label: 'Completed', 
      value: stats?.assessments.completed ?? 0, 
      icon: Award, 
      color: 'text-indigo-400', 
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20'
    },
    { 
      label: 'Upcoming', 
      value: stats?.assessments.upcoming ?? 0, 
      icon: Calendar, 
      color: 'text-orange-400', 
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-screen bg-[#0C0C10] relative overflow-x-hidden">
          {/* Background effects */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]"></div>
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom,rgba(249,115,22,0.1),transparent_50%)]"></div>
          </div>

          <div className="relative z-10 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
              
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-1 bg-gradient-to-b from-indigo-500 to-orange-500 rounded-full"></div>
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-indigo-400" />
           
                  </div>
                </div>
                
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">
                  Dashboard Overview
                </h1>
                
                <p className="mt-2 text-zinc-400 text-base">
                  Welcome back, here's what's happening across your platform.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((stat, index) => (
                  <div
                    key={stat.label}
                    className="group bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-indigo-500/30 transition-all hover:scale-[1.02] relative overflow-hidden"
                  >
                    {/* Glow effect on hover */}
                    <div className={`absolute -inset-1 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-10 blur-xl transition-opacity`}></div>
                    
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-400 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                      </div>
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <span className="text-xs text-indigo-400 flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        Live update
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="h-4 w-1 bg-gradient-to-b from-indigo-400 to-orange-400 rounded-full"></span>
                    Quick Actions
                  </h2>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { href: '/admin/assessments', label: 'Assessments', icon: FileText, count: stats?.assessments.total, gradient: 'from-indigo-500 to-blue-500' },
                    { href: '/admin/questions', label: 'Questions', icon: HelpCircle, count: stats?.questions.total, gradient: 'from-orange-500 to-amber-500' },
                    { href: '/admin/users', label: 'Users', icon: Users, count: stats?.users.total, gradient: 'from-indigo-400 to-cyan-500' },
                    { href: '/admin/branches', label: 'Branches', icon: GraduationCap, gradient: 'from-orange-400 to-amber-500' },
                    { href: '/admin/colleges', label: 'Colleges', icon: Building2, gradient: 'from-indigo-500 to-blue-500' },
                    { href: '/admin/reports', label: 'Reports', icon: BarChart3, gradient: 'from-orange-500 to-amber-500' },
                  ].map((item) => (
                    <Link key={item.href} href={item.href} className="no-underline group">
                      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:border-indigo-500/30 transition-all hover:scale-[1.02] text-center relative overflow-hidden">
                        <div className={`absolute -inset-1 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 blur-xl transition-opacity`}></div>
                        
                        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${item.gradient} mx-auto mb-2 flex items-center justify-center shadow-lg`}>
                          <item.icon className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">{item.label}</p>
                        {item.count !== undefined && (
                          <p className="text-xs text-zinc-500 mt-1">{item.count} total</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Users Breakdown */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-indigo-500/5 to-transparent">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-400" />
                      User Analytics
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {userStats.map((stat) => (
                        <div key={stat.label} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className={`h-6 w-6 rounded-lg ${stat.bgColor} border ${stat.borderColor} flex items-center justify-center`}>
                              <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                            </div>
                            <span className="text-sm text-zinc-300">{stat.label}</span>
                          </div>
                          <span className="text-sm font-semibold text-white">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Assessments Breakdown */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-orange-500/5 to-transparent">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-400" />
                      Assessment Analytics
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {assessmentStats.map((stat) => (
                        <div key={stat.label} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className={`h-6 w-6 rounded-lg ${stat.bgColor} border ${stat.borderColor} flex items-center justify-center`}>
                              <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                            </div>
                            <span className="text-sm text-zinc-300">{stat.label}</span>
                          </div>
                          <span className="text-sm font-semibold text-white">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Assessments */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-indigo-500/5 to-transparent flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <FileText className="h-4 w-4 text-indigo-400" />
                      Recent Assessments
                    </h3>
                    <Link href="/admin/assessments" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                      View all <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="divide-y divide-white/10">
                    {recentAssessments.length > 0 ? (
                      recentAssessments.slice(0, 5).map((a: any, i: number) => (
                        <div key={a._id} className="px-6 py-4 hover:bg-white/5 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{a.title}</p>
                              <p className="text-xs text-zinc-500 mt-1">
                                Created by {a.createdBy?.firstName ?? 'Unknown'} {a.createdBy?.lastName ?? ''}
                              </p>
                            </div>
                            <span className={cn(
                              "ml-4 inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border",
                              a.status === 'active' 
                                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                            )}>
                              {a.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-8 text-center">
                        <FileText className="h-8 w-8 text-indigo-400/30 mx-auto mb-2" />
                        <p className="text-sm text-zinc-500">No recent assessments</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Results */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-orange-500/5 to-transparent flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-orange-400" />
                      Recent Results
                    </h3>
                    <Link href="/admin/reports" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                      View all <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="divide-y divide-white/10">
                    {recentResults.length > 0 ? (
                      recentResults.slice(0, 5).map((r: any, i: number) => (
                        <div key={r._id} className="px-6 py-4 hover:bg-white/5 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {r.assessmentId?.title ?? 'Untitled Assessment'}
                              </p>
                              <p className="text-xs text-zinc-500 mt-1">
                                {r.userId?.firstName ?? 'User'} {r.userId?.lastName ?? ''}
                              </p>
                            </div>
                            <div className="ml-4 flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">
                                {r.score}/{r.totalMarks}
                              </span>
                              <span className="text-xs px-2 py-1 rounded-lg bg-gradient-to-r from-indigo-500/10 to-orange-500/10 text-indigo-400 border border-white/10">
                                {Math.round((r.score / r.totalMarks) * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-8 text-center">
                        <BarChart3 className="h-8 w-8 text-orange-400/30 mx-auto mb-2" />
                        <p className="text-sm text-zinc-500">No recent results</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
                  <span className="text-xs text-zinc-500">Admin Console v1.0</span>
                  <span className="h-1 w-1 rounded-full bg-orange-400"></span>
                </div>
                <span className="text-xs text-zinc-500">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}