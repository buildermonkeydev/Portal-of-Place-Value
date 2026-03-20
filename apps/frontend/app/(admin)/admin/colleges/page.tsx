"use client"


import { CollegeManagement } from '@/components/admin/CollegeManagement';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useColleges } from '@/lib/hooks/useColleges';
import { useBranches } from '@/lib/hooks/useBranches';
import { useUsers } from '@/lib/hooks/useUsers';
import { Building2, GraduationCap, Users, LayoutDashboard, TrendingUp, Database, Activity, Folder, Award, Plus, Download, Upload, Settings, Shield, AlertCircle, School, Library, BookOpen, Globe, MapPin, Link2, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminCollegesPage() {
  const { data: collegesData, isLoading: isLoadingColleges } = useColleges();
  const { data: branchesData, isLoading: isLoadingBranches } = useBranches();
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({ role: 'student' });

  const [stats, setStats] = useState({
    totalColleges: 0,
    totalBranches: 0,
    totalStudents: 0,
    newColleges: 0,
    activeStudents: 0,
  });

  useEffect(() => {
    // Calculate stats from real data
    const totalColleges = collegesData?.data?.length || 0;
    const totalBranches = branchesData?.data?.length || 0;
    const totalStudents = usersData?.data?.length || 0;
    
    // Calculate new colleges this month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const newCollegesThisMonth = collegesData?.data?.filter(college => {
      const createdDate = new Date(college.createdAt);
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
    }).length || 0;
    
    // Calculate active students (simplified - you can adjust based on your user status)
    const activeStudents = usersData?.data?.filter(user => user.isActive).length || 0;

    setStats({
      totalColleges,
      totalBranches,
      totalStudents,
      newColleges: newCollegesThisMonth,
      activeStudents,
    });
  }, [collegesData, branchesData, usersData]);

  const isLoading = isLoadingColleges || isLoadingBranches || isLoadingUsers;

  return (
    <ProtectedRoute requireAdmin>
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
                
                
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">
                  College Management
                </h1>
                
                <p className="mt-3 text-zinc-400 text-base max-w-2xl">
                  Manage all colleges in the system. Create new institutions, edit existing ones, 
                  and perform bulk operations to keep your academic data organized.
                </p>

                {/* Quick Stats with Dark Theme */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-10 blur-xl transition-opacity"></div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider">Total Colleges</p>
                        <p className="text-3xl font-bold text-white mt-2">
                          {isLoading ? (
                            <span className="inline-block h-8 w-16 bg-white/10 rounded animate-pulse"></span>
                          ) : (
                            stats.totalColleges
                          )}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-xl border border-indigo-500/30 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-indigo-400" />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <span className="text-sm text-indigo-400 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {stats.newColleges} added this month
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-orange-500/30 transition-all group relative overflow-hidden">
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-10 blur-xl transition-opacity"></div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-orange-400 uppercase tracking-wider">Total Branches</p>
                        <p className="text-3xl font-bold text-white mt-2">
                          {isLoading ? (
                            <span className="inline-block h-8 w-16 bg-white/10 rounded animate-pulse"></span>
                          ) : (
                            stats.totalBranches
                          )}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl border border-orange-500/30 flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-orange-400" />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <span className="text-sm text-orange-400 flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        Across all colleges
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-10 blur-xl transition-opacity"></div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider">Total Students</p>
                        <p className="text-3xl font-bold text-white mt-2">
                          {isLoading ? (
                            <span className="inline-block h-8 w-16 bg-white/10 rounded animate-pulse"></span>
                          ) : (
                            stats.totalStudents
                          )}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-xl border border-indigo-500/30 flex items-center justify-center">
                        <Users className="h-6 w-6 text-indigo-400" />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <span className="text-sm text-indigo-400 flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {stats.activeStudents} currently active
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Card with Dark Theme */}
              <div className="relative bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-xl overflow-hidden">
                {/* Card Header */}
                <div className="px-8 py-6 border-b border-white/10 bg-gradient-to-r from-indigo-500/5 via-transparent to-orange-500/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
                        Institution Directory
                      </h2>
                      <p className="text-sm text-zinc-400 mt-1">
                        Manage and organize all educational institutions in the system
                      </p>
                    </div>
                    
                 
                  </div>
                </div>
                
                {/* College Management Component */}
                <div className="p-0">
                  <CollegeManagement />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
                  <span className="text-xs text-zinc-500">Academic Administration</span>
                  <span className="h-1 w-1 rounded-full bg-orange-400"></span>
                </div>
                <span className="text-xs text-zinc-500 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
                  Changes are reflected immediately
                  <span className="h-1 w-1 rounded-full bg-orange-400"></span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}