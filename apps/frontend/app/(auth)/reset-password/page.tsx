'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, Eye, EyeOff, Sparkles, Zap, ChevronLeft, Shield, Key } from 'lucide-react';
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
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      toast.error('Invalid reset link');
      router.push('/login');
      return;
    }
    setToken(tokenParam);
  }, [searchParams, router]);

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(Math.min(strength, 4));
  }, [password]);

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

  const getStrengthColor = () => {
    switch(passwordStrength) {
      case 0: return 'bg-slate-600';
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-green-500';
      default: return 'bg-slate-600';
    }
  };

  const getStrengthText = () => {
    switch(passwordStrength) {
      case 0: return 'Too weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return 'Too weak';
    }
  };

  if (!token) {
    return null;
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
          {`const secure = () => {
  while(!safe) { encrypt(); }
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
            <div className="text-center space-y-4 mb-6">
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
                    Reset Password
                  </span>
                </h1>
                <p className="text-sm text-slate-400">
                  Enter your new password below
                </p>
              </div>
            </div>

            {/* Security Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600">
                <Shield className="h-3.5 w-3.5 text-sky-400" />
                <span className="text-xs text-slate-300">Secure password reset</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {resetPasswordError && (
                <Alert className="border-orange-500/50 bg-orange-500/10 py-2">
                  <AlertDescription className="text-xs text-orange-400">
                    Failed to reset password. The link may be expired or invalid.
                  </AlertDescription>
                </Alert>
              )}

              {/* New Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-slate-300">
                  New Password
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 lg:h-4 lg:w-4 text-sky-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                    className="pl-8 lg:pl-9 pr-8 lg:pr-9 h-10 lg:h-11 text-xs lg:text-sm rounded-lg bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] lg:text-xs text-slate-400">Password strength</span>
                    <span className="text-[10px] lg:text-xs font-medium text-slate-300">{getStrengthText()}</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 4) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-slate-300">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 lg:h-4 lg:w-4 text-orange-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                    className="pl-8 lg:pl-9 pr-8 lg:pr-9 h-10 lg:h-11 text-xs lg:text-sm rounded-lg bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Match Indicator */}
              {confirmPassword && (
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    password === confirmPassword 
                      ? 'bg-green-500' 
                      : 'bg-orange-500'
                  }`}></div>
                  <span className="text-[10px] lg:text-xs text-slate-400">
                    {password === confirmPassword 
                      ? 'Passwords match' 
                      : 'Passwords do not match'}
                  </span>
                </div>
              )}

              {/* Password Requirements Hint */}
              <div className="bg-slate-700/30 rounded-lg p-3 lg:p-4 border border-slate-600/50">
                <p className="text-[10px] lg:text-xs font-medium text-slate-300 mb-2">
                  Password requirements:
                </p>
                <ul className="space-y-1.5">
                  <li className="text-[10px] lg:text-xs text-slate-400 flex items-center gap-2">
                    <div className={`w-1 h-1 rounded-full ${password.length >= 6 ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                    At least 6 characters
                  </li>
                  <li className="text-[10px] lg:text-xs text-slate-400 flex items-center gap-2">
                    <div className={`w-1 h-1 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                    At least one uppercase letter
                  </li>
                  <li className="text-[10px] lg:text-xs text-slate-400 flex items-center gap-2">
                    <div className={`w-1 h-1 rounded-full ${/[0-9]/.test(password) ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                    At least one number
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-10 lg:h-11 rounded-lg bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-600 hover:to-orange-600 text-white font-medium text-xs lg:text-sm shadow-sm"
                disabled={isResetPasswordPending}
              >
                {isResetPasswordPending ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 lg:h-4 lg:w-4 animate-spin" />
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
                  className="text-xs lg:text-sm text-sky-400 hover:text-orange-400 transition-colors inline-flex items-center gap-1"
                >
                  <ChevronLeft className="h-3 w-3 lg:h-4 lg:w-4" />
                  Back to Login
                </Link>
              </div>

              {/* Trust Badge */}
              <div className="flex justify-center pt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600">
                  <Zap className="h-3 w-3 text-orange-400" />
                  <p className="text-[10px] lg:text-xs text-slate-300">
                    <span className="bg-gradient-to-r from-sky-400 to-orange-400 bg-clip-text text-transparent font-medium">
                      Place Values
                    </span>{' '}
                    · secure password reset
                  </p>
                </div>
              </div>
            </form>
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden flex items-center justify-center">
          {/* Animated Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          
          {/* Floating Orbs */}
          <div className="absolute top-0 -left-20 w-[40vw] h-[40vw] max-w-[800px] max-h-[800px] bg-sky-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 -right-20 w-[40vw] h-[40vw] max-w-[800px] max-h-[800px] bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

          {/* Main Container */}
          <div className="relative z-10 w-full max-w-md mx-auto px-4 sm:px-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-orange-400 rounded-2xl lg:rounded-3xl opacity-20 blur-xl"></div>
            
            <div className="relative bg-slate-800/90 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-slate-700/50 overflow-hidden">
              <div className="h-1.5 lg:h-2 bg-gradient-to-r from-sky-400 via-orange-400 to-sky-400 bg-[length:200%_100%] animate-gradient"></div>
              
              <div className="p-8 lg:p-10 text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-400 to-orange-400 blur-lg opacity-20"></div>
                  <div className="relative w-16 h-16 lg:w-20 lg:h-20 mx-auto rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600">
                    <Loader2 className="h-6 w-6 lg:h-8 lg:w-8 animate-spin text-sky-400" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-sm lg:text-base text-white font-medium">Loading reset page...</p>
                  <p className="text-xs lg:text-sm text-slate-400">Please wait a moment</p>
                </div>

                {/* Trust Badge */}
                <div className="mt-6 flex justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600">
                    <Zap className="h-3 w-3 text-orange-400" />
                    <p className="text-[10px] lg:text-xs text-slate-300">
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
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}