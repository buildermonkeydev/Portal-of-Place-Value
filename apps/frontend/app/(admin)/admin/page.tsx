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
  Sun,
  Cloud,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Calendar
} from 'lucide-react';

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
          <div className="min-h-screen bg-gradient-to-br from-sky-50 to-orange-50 flex items-center justify-center">
            <div className="text-center">
              <div className="relative inline-flex mb-4">
                <div className="h-16 w-16 rounded-full border-4 border-sky-200 border-t-sky-500 animate-spin"></div>
                <Cloud className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-sky-300" />
              </div>
              <p className="text-gray-500 text-base">
                {!isAdmin ? "Access restricted." : isLoading ? "Loading dashboard..." : "Something went wrong."}
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const statCards = [
    { value: stats?.users.total ?? 0, label: 'Total Users', icon: Users, color: 'from-sky-500 to-blue-500' },
    { value: stats?.assessments.active ?? 0, label: 'Active Assessments', icon: FileText, color: 'from-orange-500 to-amber-500' },
    { value: stats?.questions.total ?? 0, label: 'Questions', icon: HelpCircle, color: 'from-sky-400 to-cyan-500' },
    { value: `${completionRate}%`, label: 'Completion Rate', icon: PieChart, color: 'from-orange-400 to-amber-500' },
  ];

  const userStats = [
    { label: 'Active Users', value: stats?.users.active ?? 0, icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Inactive Users', value: stats?.users.inactive ?? 0, icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
    { label: 'Verified', value: stats?.users.verified ?? 0, icon: CheckCircle, color: 'text-sky-600', bgColor: 'bg-sky-50' },
    { label: 'Unverified', value: stats?.users.unverified ?? 0, icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  ];

  const assessmentStats = [
    { label: 'Active', value: stats?.assessments.active ?? 0, icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Inactive', value: stats?.assessments.inactive ?? 0, icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
    { label: 'Completed', value: stats?.assessments.completed ?? 0, icon: CheckCircle, color: 'text-sky-600', bgColor: 'bg-sky-50' },
    { label: 'Upcoming', value: stats?.assessments.upcoming ?? 0, icon: Calendar, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  ];

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
            {/* Header with Gradient */}
            <div className="mb-8">
              
              <h1 className="text-4xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-sky-700 via-sky-600 to-orange-600 bg-clip-text text-transparent">
                  Dashboard Overview
                </span>
              </h1>
              
              <p className="mt-2 text-gray-500 text-lg">
                Welcome back, {stats?.users.active ? 'here\'s what\'s happening' : 'manage your platform'}.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map((stat, index) => (
                <div
                  key={stat.label}
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10 flex items-center justify-center`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-sky-100">
                    <span className="text-xs text-sky-600 flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-sky-400"></span>
                      Updated just now
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <span className="h-4 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></span>
                  Quick Actions
                </h2>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { href: '/admin/assessments', label: 'Assessments', icon: FileText, count: stats?.assessments.total, color: 'from-sky-500 to-blue-500' },
                  { href: '/admin/questions', label: 'Questions', icon: HelpCircle, count: stats?.questions.total, color: 'from-orange-500 to-amber-500' },
                  { href: '/admin/users', label: 'Users', icon: Users, count: stats?.users.total, color: 'from-sky-400 to-cyan-500' },
                  { href: '/admin/branches', label: 'Branches', icon: GraduationCap, color: 'from-orange-400 to-amber-500' },
                  { href: '/admin/colleges', label: 'Colleges', icon: Building2, color: 'from-sky-500 to-blue-500' },
                  { href: '/admin/reports', label: 'Reports', icon: PieChart, color: 'from-orange-500 to-amber-500' },
                ].map((item) => (
                  <Link key={item.href} href={item.href} className="no-underline group">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-sky-100 p-4 hover:shadow-md transition-all hover:scale-[1.02] text-center">
                      <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${item.color} mx-auto mb-2 flex items-center justify-center`}>
                        <item.icon className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{item.label}</p>
                      {item.count !== undefined && (
                        <p className="text-xs text-gray-400 mt-1">{item.count} total</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Users Breakdown */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-sky-100 bg-gradient-to-r from-sky-50 to-transparent">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4 text-sky-500" />
                    User Statistics
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {userStats.map((stat) => (
                      <div key={stat.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-6 w-6 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                            <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                          </div>
                          <span className="text-sm text-gray-600">{stat.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Assessments Breakdown */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-sky-100 bg-gradient-to-r from-orange-50 to-transparent">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-500" />
                    Assessment Statistics
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {assessmentStats.map((stat) => (
                      <div key={stat.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-6 w-6 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                            <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                          </div>
                          <span className="text-sm text-gray-600">{stat.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Assessments */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-sky-100 bg-gradient-to-r from-sky-50 to-transparent flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-sky-500" />
                    Recent Assessments
                  </h3>
                  <Link href="/admin/assessments" className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1">
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="divide-y divide-sky-100">
                  {recentAssessments.length > 0 ? (
                    recentAssessments.slice(0, 5).map((a: any, i: number) => (
                      <div key={a._id} className="px-6 py-4 hover:bg-gradient-to-r hover:from-sky-50/30 hover:to-orange-50/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Created by {a.createdBy?.firstName ?? 'Unknown'} {a.createdBy?.lastName ?? ''}
                            </p>
                          </div>
                          <span className={`ml-4 inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                            a.status === 'active' 
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : 'bg-gray-50 text-gray-600 border border-gray-200'
                          }`}>
                            {a.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-8 text-center">
                      <FileText className="h-8 w-8 text-sky-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No recent assessments</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Results */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-sky-100 bg-gradient-to-r from-orange-50 to-transparent flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-orange-500" />
                    Recent Results
                  </h3>
                  <Link href="/admin/reports" className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1">
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="divide-y divide-sky-100">
                  {recentResults.length > 0 ? (
                    recentResults.slice(0, 5).map((r: any, i: number) => (
                      <div key={r._id} className="px-6 py-4 hover:bg-gradient-to-r hover:from-sky-50/30 hover:to-orange-50/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {r.assessmentId?.title ?? 'Untitled Assessment'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {r.userId?.firstName ?? 'User'} {r.userId?.lastName ?? ''}
                            </p>
                          </div>
                          <div className="ml-4 flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {r.score}/{r.totalMarks}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-lg bg-gradient-to-r from-sky-50 to-orange-50 text-gray-600 border border-sky-100">
                              {Math.round((r.score / r.totalMarks) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-8 text-center">
                      <PieChart className="h-8 w-8 text-orange-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No recent results</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-sky-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-sky-300"></span>
                <span className="text-xs text-gray-400">Admin Console v1.0</span>
                <span className="h-1 w-1 rounded-full bg-orange-300"></span>
              </div>
              <span className="text-xs text-gray-400">
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
      </DashboardLayout>
    </ProtectedRoute>
  );
}