"use client"

import { BranchManagement } from '@/components/admin/BranchManagement';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { 
  GraduationCap, 
  Sun, 
  Cloud, 
  BookOpen, 
  Sparkles,
  Layers,
  Building2,
  Users,
  TrendingUp,
  CheckCircle,
  Zap,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminBranchesPage() {
  // These would come from actual data in a real implementation
  const stats = {
    totalBranches: 156,
    activeBranches: 142,
    totalColleges: 24,
    activePercentage: 91
  };

  return (
    <ProtectedRoute requireAdmin>
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
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              {/* Header */}
              <div className="mb-8 lg:mb-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-1 bg-gradient-to-b from-indigo-400 to-orange-400 rounded-full"></div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-indigo-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                          Academic Administration
                        </span>
                      </div>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                      Branch Management
                    </h1>
                    <p className="mt-2 text-zinc-400 text-sm lg:text-base max-w-2xl">
                      Manage all branches in the system. Create new branches, edit existing ones, 
                      and perform bulk operations to keep your academic data organized.
                    </p>
                  </div>
                  
                  {/* Quick Add Button - Optional */}
                  {/* <Button className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white rounded-xl px-5 py-2.5">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Branch
                  </Button> */}
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8">
                <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-indigo-400" />
                    </div>
                    <span className="text-xs text-zinc-500">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.totalBranches}</p>
                  <p className="text-xs text-zinc-500 mt-1">branches across all colleges</p>
                </div>

                <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    </div>
                    <span className="text-xs text-zinc-500">Active</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.activeBranches}</p>
                  <p className="text-xs text-zinc-500 mt-1">currently active</p>
                </div>

                <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-orange-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-orange-400" />
                    </div>
                    <span className="text-xs text-zinc-500">Colleges</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.totalColleges}</p>
                  <p className="text-xs text-zinc-500 mt-1">with active branches</p>
                </div>

                <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-purple-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-purple-400" />
                    </div>
                    <span className="text-xs text-zinc-500">Coverage</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.activePercentage}%</p>
                  <p className="text-xs text-zinc-500 mt-1">active branch rate</p>
                </div>
              </div>

              {/* Main Content Card */}
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                {/* Card Header */}
                <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-indigo-400" />
                        <h2 className="text-sm font-semibold text-white">Branch Directory</h2>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 ml-6">
                        Manage and organize all academic branches in the system
                      </p>
                    </div>
                    
                    {/* Optional Quick Actions */}
                    {/* <div className="flex items-center gap-3">
                      <button className="px-3 py-1.5 text-xs font-medium text-indigo-400 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20 transition-colors border border-indigo-500/20">
                        Export Data
                      </button>
                    </div> */}
                  </div>
                </div>
                
                {/* Branch Management Component */}
                <div className="p-0">
                  <BranchManagement />
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
                  <p className="text-xs text-zinc-500">
                    Changes to branches are reflected immediately across the system
                  </p>
                  <span className="h-1 w-1 rounded-full bg-orange-400"></span>
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
    </ProtectedRoute>
  );
}