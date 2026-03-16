'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  LayoutDashboard, Users, FileText, BarChart3,
  LogOut, Menu, X, User, Award, Home,
  ClipboardList, Building2, TestTube, FileBarChart,
  Sun, Cloud,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { Loading } from '@/components/ui/Loading';

interface DashboardLayoutProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
}

const userNavigation = [
  { name: 'Dashboard',      href: '/dashboard',              icon: Home },
  { name: 'My Assessments', href: '/dashboard/assessments',  icon: ClipboardList },
  { name: 'Reports',        href: '/dashboard/reports',      icon: FileBarChart },
  { name: 'Playground',     href: '/dashboard/playground',   icon: FileText },
  { name: 'Profile',        href: '/dashboard/profile',      icon: User },
  { name: 'Test',           href: '/dashboard/tests',        icon: TestTube },
];

const adminNavigation = [
  { name: 'Dashboard',   href: '/admin',              icon: LayoutDashboard },
  { name: 'Users',       href: '/admin/users',        icon: Users },
  { name: 'Colleges',    href: '/admin/colleges',     icon: Building2 },
  { name: 'Assessments', href: '/admin/assessments',  icon: BarChart3 },
  { name: 'Branches',    href: '/admin/branches',     icon: Building2 },
  { name: 'Reports',     href: '/admin/reports',      icon: FileBarChart },
  { name: 'Test',        href: '/admin/tests',        icon: TestTube },
];

export function DashboardLayout({ children, hideSidebar = false }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isAdmin, isLoadingUser } = useAuth();
  const pathname = usePathname();

  if (isLoadingUser) return <Loading fullScreen message="Loading…" size="md" />;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-orange-50 flex items-center justify-center">
        <p className="text-gray-500 text-[15px]">Please log in to access this page.</p>
      </div>
    );
  }

  const nav = isAdmin ? adminNavigation : userNavigation;

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0f9ff 0%, #fff7ed 100%)',
      fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif" 
    }}>

      {/* ── Sidebar ── */}
      {!hideSidebar && (
        <>
          {/* Mobile overlay */}
          {mobileOpen && (
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileOpen(false)}
            />
          )}

          {/* Sidebar panel */}
          <aside style={{
            position: 'fixed', top: 0, left: 0, bottom: 0,
            width: 260,
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(12px)',
            borderRight: '1px solid rgba(186, 230, 253, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 60,
            transform: mobileOpen ? 'translateX(0)' : undefined,
            boxShadow: '4px 0 20px rgba(0,0,0,0.02)',
          }}
            className="hidden lg:flex"
          >
            {/* Logo Area with Gradient */}
            <div style={{ 
              height: 80, 
              display: 'flex', 
              alignItems: 'center', 
              padding: '0 20px',
              borderBottom: '1px solid rgba(186, 230, 253, 0.5)',
              background: 'linear-gradient(90deg, rgba(186,230,253,0.1) 0%, rgba(255,237,213,0.1) 100%)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  height: 40, 
                  width: 40, 
                  background: 'linear-gradient(135deg, #38bdf8, #fb923c)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ color: 'white', fontWeight: 600, fontSize: 18 }}>A</span>
                </div>
                <div>
                  <span style={{ fontSize: 16, fontWeight: 600, background: 'linear-gradient(135deg, #0284c7, #ea580c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {isAdmin ? 'Admin Portal' : 'Student Portal'}
                  </span>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Assessment System</div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div style={{ position: 'absolute', top: 100, right: 10, opacity: 0.1 }}>
              <Cloud size={60} color="#38bdf8" />
            </div>
            <div style={{ position: 'absolute', bottom: 100, left: 10, opacity: 0.1 }}>
              <Sun size={60} color="#fb923c" />
            </div>

            {/* Nav links */}
            <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {nav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.name} href={item.href} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 16px',
                      borderRadius: 10,
                      background: active ? 'linear-gradient(90deg, rgba(56,189,248,0.1), rgba(251,146,60,0.1))' : 'transparent',
                      borderLeft: active ? '3px solid #fb923c' : '3px solid transparent',
                      color: active ? '#0c4a6e' : '#64748b',
                      fontSize: 14,
                      fontWeight: active ? 500 : 400,
                      transition: 'all 0.2s ease',
                    }}>
                      <item.icon size={18} strokeWidth={1.8} color={active ? '#ea580c' : '#94a3b8'} />
                      {item.name}
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* User + logout */}
            <div style={{ 
              padding: '16px 16px', 
              borderTop: '1px solid rgba(186, 230, 253, 0.5)',
              background: 'linear-gradient(90deg, rgba(186,230,253,0.05) 0%, rgba(255,237,213,0.05) 100%)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link href="/dashboard/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ 
                    width: 36, 
                    height: 36, 
                    borderRadius: 10, 
                    background: 'linear-gradient(135deg, #38bdf8, #fb923c)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'white',
                  }}>
                    <User size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', lineHeight: 1.3 }}>
                      {user.firstName} {user.lastName}
                    </div>
                    <div style={{ fontSize: 11, color: isAdmin ? '#ea580c' : '#0284c7' }}>
                      {isAdmin ? 'Administrator' : 'Student'}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={logout}
                  style={{ 
                    background: 'rgba(239,68,68,0.1)', 
                    border: 'none', 
                    borderRadius: 8,
                    cursor: 'pointer', 
                    padding: '6px 10px',
                    color: '#ef4444',
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                >
                  <LogOut size={14} />
                  Exit
                </button>
              </div>
            </div>
          </aside>

          {/* Mobile sidebar */}
          <aside style={{
            position: 'fixed', top: 0, left: 0, bottom: 0,
            width: 280,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            borderRight: '1px solid rgba(186, 230, 253, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 60,
            transition: 'transform 0.3s ease',
            transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          }}
            className="lg:hidden"
          >
            <div style={{ 
              height: 70, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '0 20px', 
              borderBottom: '1px solid rgba(186, 230, 253, 0.5)',
              background: 'linear-gradient(90deg, rgba(56,189,248,0.05), rgba(251,146,60,0.05))',
            }}>
              <span style={{ fontSize: 16, fontWeight: 600, background: 'linear-gradient(135deg, #0284c7, #ea580c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {isAdmin ? 'Admin' : 'Dashboard'}
              </span>
              <button 
                onClick={() => setMobileOpen(false)} 
                style={{ 
                  background: 'rgba(0,0,0,0.05)', 
                  border: 'none', 
                  borderRadius: 8,
                  cursor: 'pointer', 
                  padding: 6,
                  color: '#64748b',
                }}
              >
                <X size={18} />
              </button>
            </div>
            <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {nav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.name} href={item.href} style={{ textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderRadius: 10,
                      background: active ? 'linear-gradient(90deg, rgba(56,189,248,0.1), rgba(251,146,60,0.1))' : 'transparent',
                      borderLeft: active ? '3px solid #fb923c' : '3px solid transparent',
                      color: active ? '#0c4a6e' : '#64748b',
                      fontSize: 14, fontWeight: active ? 500 : 400,
                    }}>
                      <item.icon size={18} color={active ? '#ea580c' : '#94a3b8'} />
                      {item.name}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      {/* ── Main area ── */}
      <div style={{
        flex: 1,
        marginLeft: hideSidebar ? 0 : undefined,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #fff7ed 100%)',
      }}
        className={hideSidebar ? '' : 'lg:ml-[260px]'}
      >
        {/* Top bar */}
        <header style={{
          height: 70,
          borderBottom: '1px solid rgba(186, 230, 253, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}>
          {/* Mobile hamburger */}
         
          
          {/* Page Title Indicator (could be dynamic) */}
          <div className="hidden lg:flex items-center gap-2">
            <div style={{ height: 24, width: 4, background: 'linear-gradient(to bottom, #38bdf8, #fb923c)', borderRadius: 2 }}></div>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#475569' }}></span>
          </div>

          {/* Right: user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>
                  {user.firstName} {user.lastName}
                </div>
                <div style={{ fontSize: 11, color: isAdmin ? '#ea580c' : '#0284c7' }}>
                  {isAdmin ? 'Administrator' : 'Student'}
                </div>
              </div>
              <div style={{ 
                width: 38, 
                height: 38, 
                borderRadius: 10, 
                background: 'linear-gradient(135deg, #38bdf8, #fb923c)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white',
              }}>
                <User size={16} />
              </div>
            </div>
            <button
              onClick={logout}
              style={{ 
                background: 'rgba(239,68,68,0.1)', 
                border: 'none', 
                borderRadius: 8,
                cursor: 'pointer', 
                padding: '8px 14px',
                color: '#ef4444',
                display: 'flex', 
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}