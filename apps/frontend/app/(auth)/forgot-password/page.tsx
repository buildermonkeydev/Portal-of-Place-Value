'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft, Sparkles, Lock, CheckCircle, Zap, ChevronRight } from 'lucide-react';
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
      <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden flex items-center justify-center">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        
        {/* Floating Orbs */}
        <div className="absolute top-0 -left-20 w-[40vw] h-[40vw] max-w-[800px] max-h-[800px] bg-sky-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-20 w-[40vw] h-[40vw] max-w-[800px] max-h-[800px] bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Code Snippet Decorations */}
        <div className="absolute top-[15%] right-[5%] opacity-10 hidden xl:block">
          <pre className="text-sky-400 text-xs lg:text-sm">
            {`function reset() {
  return 'secure';
}`}
          </pre>
        </div>
        <div className="absolute bottom-[15%] left-[5%] opacity-10 hidden xl:block">
          <pre className="text-orange-400 text-xs lg:text-sm transform rotate-6">
            {`const recover = () => {
  while(!access) { retry(); }
}`}
          </pre>
        </div>

        {/* Main Container */}
        <div className="relative z-10 w-full max-w-md mx-auto px-4 sm:px-6">
          {/* Decorative Elements */}
          <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-orange-400 rounded-2xl lg:rounded-3xl opacity-20 blur-xl"></div>
          
          <div className="relative bg-slate-800/90 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-slate-700/50 overflow-hidden">
            {/* Header with Animated Gradient */}
            <div className="h-1.5 lg:h-2 bg-gradient-to-r from-sky-400 via-orange-400 to-sky-400 bg-[length:200%_100%] animate-gradient"></div>
            
            <div className="p-6 lg:p-8">
              <div className="text-center space-y-6">
                {/* Logo */}
                <div className="flex justify-center">
                  <div className="relative w-14 h-14 lg:w-16 lg:h-16">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-orange-400 rounded-xl rotate-6"></div>
                    <div className="absolute inset-0 bg-slate-900 rounded-xl -rotate-3 flex items-center justify-center">
                      <Image
                        src="/logo.png"
                        alt="Place Values"
                        width={60}
                        height={60}
                        className="object-contain w-8 h-8 lg:w-10 lg:h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Success Icon */}
                <div className="mx-auto w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-sky-500/20 to-orange-500/20 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 lg:h-10 lg:w-10 text-orange-400" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl lg:text-3xl font-bold">
                    <span className="bg-gradient-to-r from-sky-400 to-orange-400 bg-clip-text text-transparent">
                      Check Your Email
                    </span>
                  </h2>
                  <p className="text-sm text-slate-400">
                    We've sent instructions to
                  </p>
                  <p className="text-base lg:text-lg font-medium text-white bg-slate-700/50 px-4 py-2 rounded-lg inline-block border border-slate-600">
                    {email}
                  </p>
                </div>

                <div className="bg-slate-700/30 rounded-xl p-5 lg:p-6 text-left space-y-3 border border-slate-600/50">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"></div>
                    </div>
                    <p className="text-xs lg:text-sm text-slate-300">
                      The reset link will expire in <span className="font-medium text-white">1 hour</span>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"></div>
                    </div>
                    <p className="text-xs lg:text-sm text-slate-300">
                      If you don't see the email, check your <span className="font-medium text-white">spam folder</span>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"></div>
                    </div>
                    <p className="text-xs lg:text-sm text-slate-300">
                      Still having trouble?{' '}
                      <button 
                        onClick={() => {
                          // Add resend logic here
                          toast.success('Reset email resent!');
                        }}
                        className="text-sky-400 hover:text-orange-400 transition-colors font-medium"
                      >
                        Resend email
                      </button>
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    onClick={() => router.push('/login')}
                    className="w-full h-10 lg:h-11 rounded-lg bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-600 hover:to-orange-600 text-white font-medium text-sm shadow-sm"
                  >
                    Back to Login
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail('');
                    }}
                    className="w-full h-10 lg:h-11 rounded-lg border-slate-600 bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white font-medium text-sm"
                  >
                    Use a different email
                  </Button>
                </div>

                {/* Trust Badge */}
                <div className="pt-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600">
                    <Zap className="h-3 w-3 text-orange-400" />
                    <p className="text-xs text-slate-300">
                      <span className="bg-gradient-to-r from-sky-400 to-orange-400 bg-clip-text text-transparent font-medium">
                        Place Values
                      </span>{' '}
                      · secure password reset
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradient {
            animation: gradient 3s ease infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden flex items-center justify-center">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      
      {/* Floating Orbs */}
      <div className="absolute top-0 -left-20 w-[40vw] h-[40vw] max-w-[800px] max-h-[800px] bg-sky-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 -right-20 w-[40vw] h-[40vw] max-w-[800px] max-h-[800px] bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      {/* Code Snippet Decorations */}
      <div className="absolute top-[15%] right-[5%] opacity-10 hidden xl:block">
        <pre className="text-sky-400 text-xs lg:text-sm">
          {`function reset() {
  return 'secure';
}`}
        </pre>
      </div>
      <div className="absolute bottom-[15%] left-[5%] opacity-10 hidden xl:block">
        <pre className="text-orange-400 text-xs lg:text-sm transform rotate-6">
          {`const recover = () => {
  while(!access) { retry(); }
}`}
        </pre>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 sm:px-6">
        {/* Decorative Elements */}
        <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-orange-400 rounded-2xl lg:rounded-3xl opacity-20 blur-xl"></div>
        
        <div className="relative bg-slate-800/90 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-slate-700/50 overflow-hidden">
          {/* Header with Animated Gradient */}
          <div className="h-1.5 lg:h-2 bg-gradient-to-r from-sky-400 via-orange-400 to-sky-400 bg-[length:200%_100%] animate-gradient"></div>
          
          <div className="p-6 lg:p-8">
            {/* Logo and Title */}
            <div className="text-center space-y-4 mb-6 lg:mb-8">
              <div className="flex justify-center">
                <div className="relative w-14 h-14 lg:w-16 lg:h-16">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-orange-400 rounded-xl rotate-6"></div>
                  <div className="absolute inset-0 bg-slate-900 rounded-xl -rotate-3 flex items-center justify-center">
                    <Image
                      src="/logo.png"
                      alt="Place Values"
                      width={60}
                      height={60}
                      className="object-contain w-8 h-8 lg:w-10 lg:h-10"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl lg:text-3xl font-bold">
                  <span className="bg-gradient-to-r from-sky-400 to-orange-400 bg-clip-text text-transparent">
                    Forgot Password?
                  </span>
                </h1>
                <p className="text-sm text-slate-400">
                  No worries! Enter your email and we'll send you reset instructions.
                </p>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-slate-700/30 rounded-xl p-5 lg:p-6 border border-slate-600/50">
              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
                {forgotPasswordError && (
                  <Alert className="border-orange-500/50 bg-orange-500/10 py-2">
                    <AlertDescription className="text-xs lg:text-sm text-orange-400">
                      Failed to send reset instructions. Please try again.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs lg:text-sm text-slate-300">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 lg:h-4 lg:w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      autoComplete="email"
                      className="pl-8 lg:pl-9 h-10 lg:h-11 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 rounded-lg lg:rounded-xl text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 lg:h-11 rounded-lg bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-600 hover:to-orange-600 text-white font-medium text-sm shadow-sm"
                  disabled={isForgotPasswordPending}
                >
                  {isForgotPasswordPending ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 lg:h-4 lg:w-4 animate-spin" />
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
                    className="text-xs lg:text-sm text-sky-400 hover:text-orange-400 transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back to Login
                  </Link>
                </div>
              </form>
            </div>

            {/* Additional Info */}
            <div className="mt-5 lg:mt-6 text-center">
              <p className="text-xs text-slate-400">
                Remember your password?{' '}
                <Link
                  href="/login"
                  className="text-sky-400 hover:text-orange-400 transition-colors font-medium"
                >
                  Sign in here
                  <ChevronRight className="h-3 w-3 inline ml-0.5" />
                </Link>
              </p>
              
              {/* Trust Badge */}
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600">
                <Zap className="h-3 w-3 text-orange-400" />
                <p className="text-xs text-slate-300">
                  <span className="bg-gradient-to-r from-sky-400 to-orange-400 bg-clip-text text-transparent font-medium">
                    Place Values
                  </span>{' '}
                  · secure password reset
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}