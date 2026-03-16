'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Logo } from '@/components/ui/logo';
import { Loader2, Mail, ArrowLeft, Sparkles, Lock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword, isForgotPasswordPending, forgotPasswordError } =
    useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      await forgotPassword({ email });
      setIsSubmitted(true);
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      toast.error('Failed to send reset instructions');
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-sky-50 via-white to-orange-50">
        {/* Decorative Elements - Subtle */}
        <div className="fixed top-20 right-10 opacity-5 pointer-events-none">
          <Sparkles className="h-40 w-40 text-sky-300" />
        </div>
        <div className="fixed bottom-20 left-10 opacity-5 pointer-events-none">
          <Lock className="h-40 w-40 text-orange-300" />
        </div>

        <div className="w-full max-w-md mx-auto my-8 px-4 sm:px-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-sky-100">
            {/* Header with gradient */}
            <div className="h-2 bg-gradient-to-r from-sky-400 to-orange-400"></div>
            
            <div className="p-8 sm:p-10">
              <div className="text-center space-y-6">
                {/* Logo */}
                <div className="flex justify-center">
                  <div className="relative w-16 h-16">
                    <Image
                      src="/logo.png"
                      alt="Place Values"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>

                {/* Success Icon */}
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 to-orange-100 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-orange-500" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold tracking-tight">
                    <span className="bg-gradient-to-r from-sky-700 to-orange-600 bg-clip-text text-transparent">
                      Check Your Email
                    </span>
                  </h2>
                  <p className="text-gray-500">
                    We've sent instructions to
                  </p>
                  <p className="text-lg font-medium text-gray-900 bg-sky-50 px-4 py-2 rounded-lg inline-block">
                    {email}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-sky-50 to-orange-50 rounded-xl p-6 text-left space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      The reset link will expire in <span className="font-medium text-gray-900">1 hour</span>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      If you don't see the email, check your <span className="font-medium text-gray-900">spam folder</span>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Still having trouble? <button className="text-sky-600 hover:text-sky-700 font-medium">Resend email</button>
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <Button
                    onClick={() => router.push('/login')}
                    className="w-full h-11 rounded-lg bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-600 hover:to-orange-600 text-white font-medium text-sm shadow-sm"
                  >
                    Back to Login
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail('');
                    }}
                    className="w-full h-11 rounded-lg border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-300 font-medium text-sm"
                  >
                    Use a different email
                  </Button>
                </div>

                <p className="text-xs text-gray-400 pt-4">
                  <span className="bg-gradient-to-r from-sky-500 to-orange-500 bg-clip-text text-transparent font-medium">
                    Place Values
                  </span>{' '}
                  · secure password reset
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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

      <div className="w-full max-w-md mx-auto my-8 px-4 sm:px-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-sky-100">
          {/* Header with gradient */}
          <div className="h-2 bg-gradient-to-r from-sky-400 to-orange-400"></div>
          
          <div className="p-8 sm:p-10">
            {/* Logo and Title */}
            <div className="text-center space-y-4 mb-8">
              <div className="flex justify-center">
                <div className="relative w-16 h-16">
                  <Image
                    src="/logo.png"
                    alt="Place Values"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                  <span className="bg-gradient-to-r from-sky-700 to-orange-600 bg-clip-text text-transparent">
                    Forgot Password?
                  </span>
                </h1>
                <p className="text-gray-500 text-sm">
                  No worries! Enter your email and we'll send you reset instructions.
                </p>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-gradient-to-br from-sky-50/30 to-orange-50/30 rounded-xl p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {forgotPasswordError && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertDescription className="text-sm text-red-700">
                      Failed to send reset instructions. Please try again.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sky-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      autoComplete="email"
                      className="pl-9 h-11 rounded-lg border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-white text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 rounded-lg bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-600 hover:to-orange-600 text-white font-medium text-sm shadow-sm"
                  disabled={isForgotPasswordPending}
                >
                  {isForgotPasswordPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Instructions'
                  )}
                </Button>

                {/* Back to Login Link */}
                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="text-sm text-sky-600 hover:text-sky-700 flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back to Login
                  </Link>
                </div>
              </form>
            </div>

            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                Remember your password?{' '}
                <Link
                  href="/login"
                  className="text-sky-600 hover:text-sky-700 font-medium"
                >
                  Sign in here
                </Link>
              </p>
              
              <div className="mt-4 text-xs text-gray-400">
                <span className="bg-gradient-to-r from-sky-500 to-orange-500 bg-clip-text text-transparent font-medium">
                  Place Values
                </span>{' '}
                · secure password reset
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-4">
          © 2024 Place Values · precision in every line
        </p>
      </div>
    </div>
  );
}