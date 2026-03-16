'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, isLoggingIn, loginError } = useAuth();
  const [currentQuote, setCurrentQuote] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  const quotes = [
    "Code is poetry in motion.",
    "Think twice, code once.",
    "Clean code, clean mind.",
    "Debugging is like being the detective in a crime movie.",
  ];

  useEffect(() => {
    setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-sky-50 via-white to-orange-50">
      {/* Decorative Elements */}
      <div className="fixed top-20 right-10 opacity-5 pointer-events-none">
        <Sparkles className="h-40 w-40 text-sky-300" />
      </div>
      <div className="fixed bottom-20 left-10 opacity-5 pointer-events-none">
        <Lock className="h-40 w-40 text-orange-300" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto my-4 sm:my-6 md:my-8 px-4 sm:px-6 lg:px-8 relative">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row min-h-[calc(100vh-2rem)] border border-sky-100">
          {/* Left Panel - Brand Section */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sky-50/50 via-white to-orange-50/50 p-12 flex-col justify-between">
            <div className="space-y-12">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12">
                  <Image
                    src="/logo.png"
                    alt="Place Values"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Main Content */}
              <div className="space-y-6">
                <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight">
                  <span className="bg-gradient-to-r from-sky-700 to-orange-600 bg-clip-text text-transparent">
                    Code Assessment Hub
                  </span>
                </h1>
                <p className="text-xl text-gray-600 max-w-md">
                  Measure. Improve. Master.
                </p>
              </div>

              {/* Quote */}
              <div className="max-w-md">
                <p className="text-lg text-gray-700 italic">
                  "{currentQuote || quotes[0]}"
                </p>
                <p className="text-sm text-gray-400 mt-2">— Place Values</p>
              </div>

              {/* Feature List */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"></div>
                  <span>Build custom tests</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"></div>
                  <span>Multiple skill domains</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"></div>
                  <span>Coding challenges</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"></div>
                  <span>Timed assessments</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-sm text-gray-400">
              © 2024 Place Values · precision in every line
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
            <div className="w-full max-w-md">
              {/* Card Container */}
              <div className="bg-white rounded-xl shadow-lg border border-sky-100 overflow-hidden">
                {/* Card Header with Gradient */}
                <div className="h-2 bg-gradient-to-r from-sky-400 to-orange-400"></div>
                
                <div className="p-6 sm:p-8">
                  {/* Mobile Logo */}
                  <div className="lg:hidden flex flex-col items-center space-y-3 mb-6">
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

                  {/* Welcome Text */}
                  <div className="space-y-2 mb-6">
                    <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
                      Welcome Back
                    </h2>
                    <p className="text-gray-500 text-sm">
                      Ready to test your skills?
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Email Field */}
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-medium text-gray-600">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sky-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          {...register('email')}
                          className="pl-9 h-11 rounded-lg border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-white text-sm"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-red-500">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-xs font-medium text-gray-600">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sky-400" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          {...register('password')}
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
                      {errors.password && (
                        <p className="text-xs text-red-500">
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="rememberMe"
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                          className="rounded border-sky-300 text-sky-500"
                        />
                        <Label
                          htmlFor="rememberMe"
                          className="text-xs font-normal text-gray-600 cursor-pointer"
                        >
                          Remember me
                        </Label>
                      </div>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-sky-600 hover:text-sky-700"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    {/* Error Alert */}
                    {loginError && (
                      <Alert variant="destructive" className="border-red-200 bg-red-50 py-2">
                        <AlertDescription className="text-xs text-red-700">
                          {(loginError as any)?.response?.data?.message ||
                            'Login failed. Please try again.'}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Login Button */}
                    <Button
                      type="submit"
                      className="w-full h-11 rounded-lg bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-600 hover:to-orange-600 text-white font-medium text-sm shadow-sm"
                      disabled={isLoggingIn}
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>

                    {/* Register Link */}
                    <div className="text-center text-xs">
                      <span className="text-gray-500">Don't have an account? </span>
                      <Link
                        href="/register"
                        className="text-sky-600 hover:text-sky-700 font-medium"
                      >
                        Create account
                      </Link>
                    </div>

                    {/* Tagline */}
                    <div className="text-center text-xs text-gray-400 pt-2">
                      <span className="bg-gradient-to-r from-sky-500 to-orange-500 bg-clip-text text-transparent font-medium">
                        Place Values
                      </span>{' '}
                      · where code meets precision
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}