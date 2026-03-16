'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

export default function HomePage() {
  const { user, isLoadingUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingUser) {
      // Check if we're already on an auth page to prevent redirect loops
      const currentPath = window.location.pathname;
      const isAuthPage =
        currentPath === '/login' ||
        currentPath === '/register' ||
        currentPath === '/verify-email';

      if (user && !isAuthPage) {
        router.push('/dashboard');
      } else if (!user && !isAuthPage) {
        router.push('/login');
      }
    }
  }, [user, isLoadingUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <div>
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    </div>
  );
}
