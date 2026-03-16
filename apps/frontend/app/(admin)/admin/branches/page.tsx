import { BranchManagement } from '@/components/admin/BranchManagement';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { GraduationCap, Sun, Cloud, BookOpen } from 'lucide-react';

export default function AdminBranchesPage() {
  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        {/* Sky and Sunset Gradient Background */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-sky-50 via-white to-orange-50" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Decorative Elements */}
          <div className="absolute top-20 right-10 opacity-10 pointer-events-none">
            <Sun className="h-40 w-40 text-orange-300" />
          </div>
          <div className="absolute bottom-20 left-10 opacity-10 pointer-events-none">
            <Cloud className="h-40 w-40 text-sky-300" />
          </div>

          {/* Header with Sky/Sunset Theme */}
          <div className="relative mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-sky-500" />
                <span className="text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-sky-600 to-orange-600 bg-clip-text text-transparent">
                  Academic Administration
                </span>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-sky-700 via-sky-600 to-orange-600 bg-clip-text text-transparent">
                Branch Management
              </span>
            </h1>
            
            <p className="mt-3 text-lg text-gray-500 max-w-2xl">
              Manage all branches in the system. Create new branches, edit existing ones, 
              and perform bulk operations to keep your academic data organized.
            </p>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-sky-600 uppercase tracking-wider">Total Branches</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">156</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-sky-600">
                  <span className="h-1 w-1 rounded-full bg-sky-400"></span>
                  Across all colleges
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-orange-600 uppercase tracking-wider">Active Branches</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">142</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                  <span className="h-1 w-1 rounded-full bg-green-400"></span>
                  Currently active
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-sky-600 uppercase tracking-wider">Colleges</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">24</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                    <Sun className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-orange-600">
                  <span className="h-1 w-1 rounded-full bg-orange-400"></span>
                  With active branches
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl border border-sky-100 shadow-xl overflow-hidden">
            {/* Card Header with Sky/Sunset Gradient */}
            <div className="px-8 py-5 border-b border-sky-100 bg-gradient-to-r from-sky-50/50 via-white to-orange-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                    Branch Directory
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage and organize all academic branches in the system
                  </p>
                </div>
                
                {/* Quick Action Buttons */}
                {/* <div className="flex items-center gap-3">
                  <button className="px-4 py-2 text-sm font-medium text-sky-600 bg-sky-50 rounded-xl hover:bg-sky-100 transition-colors border border-sky-200">
                    Export Data
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-blue-500 rounded-xl hover:from-sky-600 hover:to-blue-600 transition-all shadow-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Add Branch
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
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
              <span className="h-1 w-1 rounded-full bg-sky-300"></span>
              Changes to branches are reflected immediately across the system
              <span className="h-1 w-1 rounded-full bg-orange-300"></span>
            </p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}