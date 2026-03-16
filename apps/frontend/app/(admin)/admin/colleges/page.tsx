import { CollegeManagement } from '@/components/admin/CollegeManagement';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Building2, Sun, Cloud, GraduationCap } from 'lucide-react';

export default function AdminCollegesPage() {
  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        {/* Sky and Sunset Gradient Background */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-sky-50 via-white to-orange-50" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Decorative Elements */}
          <div className="absolute top-20 right-10 opacity-20">
            <Sun className="h-32 w-32 text-orange-200" />
          </div>
          <div className="absolute bottom-20 left-10 opacity-10">
            <Cloud className="h-40 w-40 text-sky-200" />
          </div>

          {/* Header with Sky/Sunset Theme */}
          <div className="relative mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
              <div className="flex items-center gap-2 text-sky-600">
                <GraduationCap className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-sky-600 to-orange-600 bg-clip-text text-transparent">
                  Academic Administration
                </span>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-sky-700 via-sky-600 to-orange-600 bg-clip-text text-transparent">
                College Management
              </span>
            </h1>
            
            <p className="mt-3 text-lg text-gray-600 max-w-2xl">
              Manage all colleges in the system. Create new institutions, edit existing ones, 
              and perform bulk operations to keep your academic data organized.
            </p>

            {/* Quick Stats with Sky/Sunset Theme */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-sky-600 uppercase tracking-wider">Total Colleges</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-sky-100 to-sky-50 rounded-xl flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-sky-500" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-sky-50">
                  <span className="text-sm text-sky-600">+3 added this month</span>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-sky-600 uppercase tracking-wider">Total Branches</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">156</p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-orange-50">
                  <span className="text-sm text-orange-600">Across all colleges</span>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-sky-600 uppercase tracking-wider">Active Students</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">2,845</p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-sky-100 to-orange-50 rounded-xl flex items-center justify-center">
                    <Sun className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-sky-50">
                  <span className="text-sm text-sky-600">Currently enrolled</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card with Sky Theme */}
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl border border-sky-100 shadow-xl overflow-hidden">
            {/* Card Header with Sky/Sunset Gradient */}
            <div className="px-8 py-6 border-b border-sky-100 bg-gradient-to-r from-sky-50/50 via-white to-orange-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                    Institution Directory
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage and organize all educational institutions in the system
                  </p>
                </div>
                
                {/* Quick Action Buttons with Blue Theme */}
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 text-sm font-medium text-sky-600 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors">
                    Export Data
                  </button>
                  {/* <button className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-blue-500 rounded-lg hover:from-sky-600 hover:to-blue-600 transition-all shadow-sm">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Add College
                    </span>
                  </button> */}
                </div>
              </div>
            </div>
            
            {/* College Management Component */}
            <div className="p-0">
              <CollegeManagement />
            </div>
          </div>

          {/* Footer with Sky Theme */}
          <div className="mt-8 text-center">
            <p className="text-sm text-sky-600/60 flex items-center justify-center gap-2">
              <span className="h-1 w-1 rounded-full bg-sky-300"></span>
              Changes are reflected immediately across the system
              <span className="h-1 w-1 rounded-full bg-orange-300"></span>
            </p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}