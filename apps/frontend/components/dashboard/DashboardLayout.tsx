'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  LayoutDashboard, Users, FileText, BarChart3,
  LogOut, Menu, X, User, Award, Home,
  ClipboardList, Building2, TestTube, FileBarChart,
  Sun, Cloud, Sparkles, Code2, GraduationCap,
  ChevronRight, Zap, BookOpen, Target, Settings,
  Bell, HelpCircle, Search, Command,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Loading } from '@/components/ui/Loading';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
}

// Updated navigation with better naming
const studentNavigation = [
  { name: 'Overview',        href: '/dashboard',              icon: LayoutDashboard,     description: 'Your progress at a glance' },
  { name: 'Assessments',     href: '/dashboard/assessments',  icon: BookOpen,            description: 'Take and review assessments' },
  { name: 'Code Lab',        href: '/dashboard/playground',   icon: Code2,               description: 'Practice coding challenges' },
  { name: 'Performance',     href: '/dashboard/reports',      icon: BarChart3,           description: 'Track your growth' },
  { name: 'Profile',         href: '/dashboard/profile',      icon: User,                description: 'Manage your account' },
  { name: 'Achievements',    href: '/dashboard/tests', icon: Award,               description: 'Badges and milestones' },
];

const adminNavigation = [
  { name: 'Analytics',       href: '/admin',              icon: LayoutDashboard,     description: 'Platform overview' },
  { name: 'User Management', href: '/admin/users',        icon: Users,               description: 'Manage students & faculty' },
  { name: 'Institutions',    href: '/admin/colleges',     icon: Building2,           description: 'Colleges & branches' },
  { name: 'Test Library',    href: '/admin/assessments',  icon: BookOpen,            description: 'Create & edit assessments' },
  { name: 'Submissions',     href: '/admin/results',      icon: FileBarChart,        description: 'Review student work' },
  { name: 'Reports',         href: '/admin/reports',      icon: BarChart3,           description: 'Generate insights' },
  // { name: 'Settings',        href: '/admin/settings',     icon: Settings,            description: 'Configure platform' },
];

export function DashboardLayout({ children, hideSidebar = false }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { user, logout, isAdmin, isLoadingUser } = useAuth();
  const pathname = usePathname();

  if (isLoadingUser) return <Loading fullScreen message="Loading…" size="md" />;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-orange-500/20 flex items-center justify-center">
            <User className="h-8 w-8 text-indigo-400" />
          </div>
          <p className="text-zinc-400">Please log in to access this page.</p>
          <Link 
            href="/login"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
          >
            Go to Login
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const navigation = isAdmin ? adminNavigation : studentNavigation;
  const portalName = isAdmin ? 'Admin Console' : 'Student Hub';
  const portalIcon = isAdmin ? Settings : GraduationCap;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Background pattern */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(249,115,22,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.02) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}></div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {!hideSidebar && (
        <aside className={cn(
          "fixed top-0 left-0 z-50 h-full w-[280px] bg-[#0C0C12]/95 backdrop-blur-xl border-r border-white/5 transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          {/* Sidebar header */}
          <div className="h-20 px-5 flex items-center justify-between border-b border-white/5">
            <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-orange-500 rounded-xl blur opacity-60 group-hover:opacity-80 transition-opacity"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-indigo-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {isAdmin ? 'A' : 'S'}
                  </span>
                </div>
              </div>
              <div>
                <h2 className="text-white font-semibold tracking-tight">{portalName}</h2>
                {/* <p className="text-xs text-zinc-500"> {isAdmin ? 'admin' : 'student'}</p> */}
              </div>
            </Link>
            
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-5rem)]">
            {navigation.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "group flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    active 
                      ? "bg-gradient-to-r from-indigo-500/10 to-orange-500/10 border border-indigo-500/20" 
                      : "hover:bg-white/5"
                  )}
                >
                  <div className={cn(
                    "mt-0.5 p-2 rounded-lg transition-colors",
                    active ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-zinc-400 group-hover:text-zinc-300"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-medium",
                      active ? "text-white" : "text-zinc-400 group-hover:text-zinc-300"
                    )}>
                      {item.name}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                  {active && (
                    <div className="w-1 h-8 bg-gradient-to-b from-indigo-400 to-orange-400 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-[#0C0C12]/95 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-orange-500 flex items-center justify-center text-white font-semibold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0C0C12]"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/profile"
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs text-zinc-300 text-center"
              >
                Profile
              </Link>
              <button
                onClick={logout}
                className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors text-xs text-red-400 flex items-center gap-1"
              >
                <LogOut className="h-3.5 w-3.5" />
                Exit
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main content */}
      <div className={cn(
        "min-h-screen transition-all duration-300",
        !hideSidebar && "lg:pl-[280px]"
      )}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#0C0C12]/80 backdrop-blur-xl border-b border-white/5">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Left section */}
            <div className="flex items-center gap-4">
              {!hideSidebar && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
              
              {/* Breadcrumb / Page indicator */}
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className="text-zinc-500">
                  {isAdmin ? 'Admin' : 'Student'}
                </span>
                <ChevronRight className="h-3 w-3 text-zinc-600" />
                <span className="text-white font-medium">
                  {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
                </span>
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-3">
              {/* Search bar */}
              <div className={cn(
                "hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border transition-all duration-200",
                searchFocused ? "border-indigo-500/50 bg-white/10" : "border-white/10"
              )}>
                <Search className="h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-48 bg-transparent border-0 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                <div className="text-xs text-zinc-600 border border-white/10 rounded px-1.5 py-0.5">
                  ⌘K
                </div>
              </div>

              {/* Notifications */}
              <button className="relative w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
              </button>

              {/* Help */}
              <button className="hidden sm:flex w-9 h-9 rounded-lg bg-white/5 items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
                <HelpCircle className="h-4 w-4" />
              </button>

              {/* Quick actions */}
              <div className="h-8 w-px bg-white/5 mx-1"></div>

              {/* Compact user menu (mobile/tablet) */}
              <div className="lg:hidden">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats bar (optional) */}
          <div className="px-4 sm:px-6 lg:px-8 py-2 border-t border-white/5 bg-white/2.5">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-indigo-400" />
                <span className="text-zinc-400">Active session</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-orange-400" />
                <span className="text-zinc-400">{isAdmin ? '8 pending reviews' : '3 assessments due'}</span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                
                <span className="text-zinc-400">Last sync: just now</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}