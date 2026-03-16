'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Logo } from '@/components/ui/logo';
import { Loader2, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword, isResetPasswordPending, resetPasswordError } =
    useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      toast.error('Invalid reset link');
      router.push('/login');
      return;
    }
    setToken(tokenParam);
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      await resetPassword({ token, newPassword: password });
      toast.success('Password reset successfully');
      router.push(
        '/login?message=Password reset successfully! You can now login with your new password.'
      );
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-sky-50 via-white to-orange-50">
      {/* Decorative Elements */}
      <div className="fixed top-20 right-10 opacity-5 pointer-events-none">
        <Sparkles className="h-40 w-40 text-sky-300" />
      </div>
      <div className="fixed bottom-20 left-10 opacity-5 pointer-events-none">
        <Lock className="h-40 w-40 text-orange-300" />
      </div>

      <div className="w-full max-w-md mx-auto my-8 px-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-sky-100">
          {/* Gradient Header Bar */}
          <div className="h-2 bg-gradient-to-r from-sky-400 to-orange-400"></div>
          
          <div className="p-8">
            {/* Logo */}
            <div className="flex flex-col items-center space-y-3 mb-6">
              <div className="relative w-16 h-16">
                <Image
                  src="/logo.png"
                  alt="Place Values"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-semibold bg-gradient-to-r from-sky-700 to-orange-600 bg-clip-text text-transparent">
                  Place Values
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Code Assessment Hub
                </p>
              </div>
            </div>

            {/* Header */}
            <div className="space-y-2 mb-6">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                <span className="bg-gradient-to-r from-sky-700 to-orange-600 bg-clip-text text-transparent">
                  Reset Password
                </span>
              </h2>
              <p className="text-gray-500 text-sm">
                Enter your new password below
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {resetPasswordError && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 py-2">
                  <AlertDescription className="text-xs text-red-700">
                    Failed to reset password. The link may be expired or invalid.
                  </AlertDescription>
                </Alert>
              )}

              {/* New Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-gray-600">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sky-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                    className="pl-9 pr-9 h-11 rounded-lg border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-gray-600">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                    className="pl-9 pr-9 h-11 rounded-lg border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements Hint */}
              <div className="bg-gradient-to-br from-sky-50 to-orange-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  <span className="font-medium text-gray-700">Password must:</span>
                </p>
                <ul className="mt-1 space-y-1">
                  <li className="text-xs text-gray-500 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"></div>
                    Be at least 6 characters long
                  </li>
                  <li className="text-xs text-gray-500 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"></div>
                    Match the confirmation field
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 rounded-lg bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-600 hover:to-orange-600 text-white font-medium text-sm shadow-sm"
                disabled={isResetPasswordPending}
              >
                {isResetPasswordPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>

              {/* Back to Login Link */}
              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs text-sky-600 hover:text-sky-700 flex items-center justify-center gap-1"
                >
                  ← Back to Login
                </Link>
              </div>

              {/* Footer */}
              <p className="text-center text-xs text-gray-400 pt-2">
                <span className="bg-gradient-to-r from-sky-500 to-orange-500 bg-clip-text text-transparent font-medium">
                  Place Values
                </span>{' '}
                · secure password reset
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex bg-gradient-to-br from-sky-50 via-white to-orange-50">
          <div className="w-full max-w-md mx-auto my-8 px-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-sky-100">
              <div className="h-2 bg-gradient-to-r from-sky-400 to-orange-400"></div>
              <div className="p-12 text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-400 to-orange-400 blur-lg opacity-20"></div>
                  <div className="relative w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-sky-100 to-orange-100 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-600">Loading reset page...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}