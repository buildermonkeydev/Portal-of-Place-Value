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
  Code2,
  Terminal,
  Cpu,
  GitBranch,
  Zap,
  ChevronRight,
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
  const [activeFeature, setActiveFeature] = useState(0);
  const { login, isLoggingIn, loginError } = useAuth();

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

  const features = [
    {
      icon: <Code2 className="h-5 w-5 lg:h-6 lg:w-6" />,
      title: "Smart Assessments",
      description: "AI-powered code evaluation with instant feedback",
      gradient: "from-sky-400 to-sky-500"
    },
    {
      icon: <Terminal className="h-5 w-5 lg:h-6 lg:w-6" />,
      title: "Real-time Execution",
      description: "Run and test your code in multiple languages",
      gradient: "from-sky-500 to-orange-400"
    },
    {
      icon: <GitBranch className="h-5 w-5 lg:h-6 lg:w-6" />,
      title: "Version Control",
      description: "Track your progress and improvements over time",
      gradient: "from-orange-400 to-orange-500"
    },
    {
      icon: <Cpu className="h-5 w-5 lg:h-6 lg:w-6" />,
      title: "Performance Metrics",
      description: "Detailed insights into your coding efficiency",
      gradient: "from-orange-500 to-sky-400"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated Background Grid - Full Coverage */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      
      {/* Floating Orbs - Repositioned for full screen */}
      <div className="absolute top-0 -left-20 w-[40vw] h-[40vw] max-w-[800px] max-h-[800px] bg-sky-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 -right-20 w-[40vw] h-[40vw] max-w-[800px] max-h-[800px] bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      {/* Code Snippet Decorations - Better positioned */}
      <div className="absolute top-[15%] right-[5%] opacity-10 hidden xl:block">
        <pre className="text-sky-400 text-xs lg:text-sm">
          {`function innovate() {
  return 'elegant';
}`}
        </pre>
      </div>
      <div className="absolute bottom-[15%] left-[5%] opacity-10 hidden xl:block">
        <pre className="text-orange-400 text-xs lg:text-sm transform rotate-6">
          {`while(learning) {
  create();
  improve();
}`}
        </pre>
      </div>

      {/* Main Container - Full height flex */}
      <div className="relative z-10 h-full w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-12 items-center h-full">
            {/* Left Side - Brand Story - Full height content */}
            <div className="space-y-6 lg:space-y-8 text-white">
              {/* Animated Logo Section */}
              <div className="flex items-center gap-3 lg:gap-4 group">
                <div className="relative w-14 h-14 lg:w-20 lg:h-20 transform group-hover:scale-110 transition-transform duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-orange-400 rounded-xl lg:rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
                  <div className="absolute inset-0 bg-slate-900 rounded-xl lg:rounded-2xl -rotate-3 flex items-center justify-center">
                    <Image
                      src="/logo.png"
                      alt="Place Values"
                      width={60}
                      height={60}
                      className="object-contain w-8 h-8 lg:w-14 lg:h-14"
                    />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-sky-400 to-orange-400 bg-clip-text text-transparent">
                    Place Values
                  </h1>
                  <p className="text-xs lg:text-sm text-slate-400 mt-0.5 lg:mt-1">
                    where code meets precision
                  </p>
                </div>
              </div>

              {/* Main Headline - Scaled for full screen */}
              <div className="space-y-2 lg:space-y-4">
                <h2 className="text-4xl lg:text-5xl xl:text-7xl font-bold leading-tight">
                  <span className="text-white">Write.</span>
                  <br />
                  <span className="bg-gradient-to-r from-sky-400 to-orange-400 bg-clip-text text-transparent">
                    Test. Improve.
                  </span>
                </h2>
                <p className="text-base lg:text-lg xl:text-xl text-slate-300 max-w-md lg:max-w-lg">
                  The ultimate platform for developers to validate skills and track growth through intelligent code assessments.
                </p>
              </div>

              {/* Feature Carousel - Optimized size */}
              <div className="relative h-28 lg:h-32 overflow-hidden bg-white/5 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-slate-700/50 p-3 lg:p-4">
                <div 
                  className="absolute inset-0 flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${activeFeature * 100}%)` }}
                >
                  {features.map((feature, index) => (
                    <div key={index} className="min-w-full h-full flex items-center gap-3 lg:gap-4 px-2">
                      <div className={`p-2 lg:p-3 rounded-lg lg:rounded-xl bg-gradient-to-br ${feature.gradient} bg-opacity-20`}>
                        <div className="text-white">{feature.icon}</div>
                      </div>
                      <div>
                        <h3 className="text-sm lg:text-base font-semibold text-white">{feature.title}</h3>
                        <p className="text-xs lg:text-sm text-slate-300 line-clamp-2">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Carousel Indicators */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveFeature(index)}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        activeFeature === index 
                          ? 'w-4 lg:w-6 bg-gradient-to-r from-sky-400 to-orange-400' 
                          : 'w-1 bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Stats - Responsive grid */}
              <div className="grid grid-cols-3 gap-2 lg:gap-4">
                {[
                  ['10k+', 'Active Users'],
                  ['50k+', 'Assessments'],
                  ['95%', 'Satisfaction'],
                ].map(([stat, label]) => (
                  <div key={label} className="text-center">
                    <div className="text-lg lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-sky-400 to-orange-400 bg-clip-text text-transparent">
                      {stat}
                    </div>
                    <div className="text-[10px] lg:text-xs text-slate-400">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Login Card - Centered vertically */}
            <div className="relative flex items-center justify-center">
              {/* Decorative Elements */}
              <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-orange-400 rounded-2xl lg:rounded-3xl opacity-20 blur-xl"></div>
              
              <div className="relative w-full max-w-md bg-slate-800/90 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-slate-700/50 overflow-hidden">
                {/* Card Header with Animated Gradient */}
                <div className="h-1.5 lg:h-2 bg-gradient-to-r from-sky-400 via-orange-400 to-sky-400 bg-[length:200%_100%] animate-gradient"></div>
                
                <div className="p-5 lg:p-8">
                  {/* Welcome Badge */}
                  <div className="inline-flex items-center gap-2 px-2 lg:px-3 py-0.5 lg:py-1 rounded-full bg-slate-700/50 border border-slate-600 mb-4 lg:mb-6">
                    <Zap className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-orange-400" />
                    <span className="text-[10px] lg:text-xs text-slate-300">Welcome back, developer!</span>
                  </div>

                  {/* Form Title */}
                  <div className="mb-4 lg:mb-6">
                    <h2 className="text-xl lg:text-2xl font-bold text-white">Sign In</h2>
                    <p className="text-xs lg:text-sm text-slate-400 mt-0.5 lg:mt-1">
                      Ready to continue your coding journey?
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 lg:space-y-5">
                    {/* Email Field */}
                    <div className="space-y-1.5 lg:space-y-2">
                      <Label htmlFor="email" className="text-xs lg:text-sm text-slate-300">
                        Email address
                      </Label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 lg:h-4 lg:w-4 text-slate-400 group-focus-within:text-sky-400 transition-colors" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="m@example.com"
                          {...register('email')}
                          className="pl-8 lg:pl-9 h-10 lg:h-12 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 rounded-lg lg:rounded-xl text-sm"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-[10px] lg:text-xs text-orange-400 flex items-center gap-1">
                          <span>•</span> {errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1.5 lg:space-y-2">
                      <Label htmlFor="password" className="text-xs lg:text-sm text-slate-300">
                        Password
                      </Label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 lg:h-4 lg:w-4 text-slate-400 group-focus-within:text-sky-400 transition-colors" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          {...register('password')}
                          className="pl-8 lg:pl-9 pr-8 lg:pr-9 h-10 lg:h-12 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 rounded-lg lg:rounded-xl text-sm"
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
                      {errors.password && (
                        <p className="text-[10px] lg:text-xs text-orange-400 flex items-center gap-1">
                          <span>•</span> {errors.password.message}
                        </p>
                      )}
                    </div>

                    {/* Options */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="rememberMe"
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                          className="border-slate-600 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-sky-400 data-[state=checked]:to-orange-400 h-3.5 w-3.5 lg:h-4 lg:w-4"
                        />
                        <Label
                          htmlFor="rememberMe"
                          className="text-xs lg:text-sm text-slate-300 cursor-pointer"
                        >
                          Keep me signed in
                        </Label>
                      </div>
                      <Link
                        href="/forgot-password"
                        className="text-xs lg:text-sm text-sky-400 hover:text-orange-400 transition-colors flex items-center gap-1"
                      >
                        Forgot?
                        <ChevronRight className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                      </Link>
                    </div>

                    {/* Error Alert */}
                    {loginError && (
                      <Alert className="border-orange-500/50 bg-orange-500/10 py-2 lg:py-3">
                        <AlertDescription className="text-[10px] lg:text-xs text-orange-400">
                          {(loginError as any)?.response?.data?.message ||
                            'Login failed. Please check your credentials.'}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Login Button */}
                    <Button
                      type="submit"
                      className="w-full h-10 lg:h-12 bg-gradient-to-r from-sky-400 to-orange-400 hover:from-sky-500 hover:to-orange-500 text-white font-medium rounded-lg lg:rounded-xl transition-all duration-300 transform hover:scale-[1.02] text-sm"
                      disabled={isLoggingIn}
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 lg:h-4 lg:w-4 animate-spin" />
                          Authenticating...
                        </>
                      ) : (
                        'Continue to Dashboard'
                      )}
                    </Button>

                    {/* Sign Up Link */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-700"></div>
                      </div>
                      <div className="relative flex justify-center text-[10px] lg:text-xs">
                        <span className="px-2 bg-slate-800 text-slate-400">
                          New to Place Values?
                        </span>
                      </div>
                    </div>

                    <Link
                      href="/register"
                      className="block w-full text-center py-2 lg:py-3 px-4 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg lg:rounded-xl transition-all duration-300 font-medium text-xs lg:text-sm border border-slate-600"
                    >
                      Create an account
                    </Link>
                  </form>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <div className="bg-slate-800 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full border border-slate-700 shadow-xl">
                  <p className="text-[10px] lg:text-xs text-slate-300">
                    🔒 Secured by enterprise-grade encryption
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