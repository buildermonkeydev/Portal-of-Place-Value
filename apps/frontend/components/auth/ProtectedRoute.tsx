'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { user, isLoadingUser, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Use Next.js hook instead of window.location
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only run redirect logic after component is mounted on client
    if (!isMounted || isLoadingUser) return;

    const isAuthPage =
      pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/verify-email';

    if (!user && !isAuthPage) {
      router.push('/login');
    }

    if (user && requireAdmin && !isAdmin && !isAuthPage) {
      router.push('/dashboard');
    }
  }, [user, isLoadingUser, isAdmin, requireAdmin, router, pathname, isMounted]);

  // Show loading state during SSR and initial client render
  // This ensures server and client render the same thing initially
  if (!isMounted || isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // After mounting, we can check auth and potentially return null
  if (!user) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  return <>{children}</>;
}