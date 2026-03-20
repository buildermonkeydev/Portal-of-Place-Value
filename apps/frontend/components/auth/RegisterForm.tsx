'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  Phone,
  GraduationCap,
  Hash,
  Building2,
  Calendar,
  Sparkles,
  Code2,
  Terminal,
  Zap,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { collegesApi } from '@/lib/api/colleges';
import { College } from '@/lib/types/college';
import Image from 'next/image';

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    mobileNumber: z
      .string()
      .regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
    collegeName: z.string().min(1, 'Please select a college'),
    branchName: z.string().min(1, 'Please select a branch'),
    collegeYear: z
      .number()
      .min(1, 'College year must be at least 1')
      .max(4, 'College year cannot exceed 4'),
    registrationNo: z
      .string()
      .min(1, 'Registration number is required')
      .regex(
        /^[A-Za-z0-9]+$/,
        'Registration number must contain only letters and numbers'
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [isLoadingColleges, setIsLoadingColleges] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const { register: registerUser, isRegistering, registerError } = useAuth();
  const [currentQuote, setCurrentQuote] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const watchedCollegeName = watch('collegeName');
  const watchedBranchName = watch('branchName');

  const quotes = [
    "Code is poetry in motion.",
    "Think twice, code once.",
    "Clean code, clean mind.",
    "Debugging is like being the detective in a crime movie.",
    "Every expert was once a beginner.",
    "Code is like humor. When you have to explain it, it's bad.",
  ];

  useEffect(() => {
    setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  // Fetch colleges on component mount
  useEffect(() => {
    const fetchColleges = async () => {
      setIsLoadingColleges(true);
      try {
        const collegesData = await collegesApi.getCollegesWithBranches();
        setColleges(collegesData);
      } catch (error) {
        console.error('Failed to fetch colleges:', error);
      } finally {
        setIsLoadingColleges(false);
      }
    };

    fetchColleges();
  }, []);

  // Update selected college and reset branch when college name changes
  useEffect(() => {
    if (watchedCollegeName) {
      const college = colleges.find((c) => c.name === watchedCollegeName);
      setSelectedCollege(college || null);
      setValue('branchName', '');
    } else {
      setSelectedCollege(null);
    }
  }, [watchedCollegeName, colleges, setValue]);

  const features = [
    {
      icon: <Code2 className="h-5 w-5 lg:h-6 lg:w-6" />,
      title: "Smart Assessments",
      description: "AI-powered code evaluation",
      gradient: "from-sky-400 to-sky-500"
    },
    {
      icon: <Terminal className="h-5 w-5 lg:h-6 lg:w-6" />,
      title: "Real-time Execution",
      description: "Run code in multiple languages",
      gradient: "from-sky-500 to-orange-400"
    },
    {
      icon: <Zap className="h-5 w-5 lg:h-6 lg:w-6" />,
      title: "Performance Metrics",
      description: "Detailed coding insights",
      gradient: "from-orange-400 to-orange-500"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  const onSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    registerUser(registerData);
  };

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
          {`function create() {
  return 'innovate';
}`}
        </pre>
      </div>
      <div className="absolute bottom-[15%] left-[5%] opacity-10 hidden xl:block">
        <pre className="text-orange-400 text-xs lg:text-sm transform rotate-6">
          {`const build = () => {
  while(learn) { code(); }
}`}
        </pre>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[90vh]">
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-slate-700/50 overflow-hidden flex flex-col lg:flex-row h-full">
          {/* Header with Animated Gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 lg:hidden bg-gradient-to-r from-sky-400 via-orange-400 to-sky-400 bg-[length:200%_100%] animate-gradient"></div>
          
          {/* Left Panel - Brand Section */}
          <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-slate-900/50 via-slate-800/50 to-slate-900/50 p-8 xl:p-10 flex-col justify-between border-r border-slate-700/50 relative overflow-hidden">
            {/* Inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-orange-500/5 pointer-events-none"></div>
            
            <div className="space-y-6 relative z-10">
              {/* Logo */}
              <div className="flex items-center gap-3 group">
                <div className="relative w-12 h-12 transform group-hover:scale-110 transition-transform duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-orange-400 rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
                  <div className="absolute inset-0 bg-slate-900 rounded-xl -rotate-3 flex items-center justify-center">
                    <Image
                      src="/logo.png"
                      alt="Place Values"
                      width={60}
                      height={60}
                      className="object-contain w-8 h-8"
                    />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-orange-400 bg-clip-text text-transparent">
                    Place Values
                  </h1>
                  <p className="text-xs text-slate-400">where code meets precision</p>
                </div>
              </div>

              {/* Main Content */}
              <div className="space-y-4">
                <h2 className="text-3xl xl:text-4xl font-bold leading-tight">
                  <span className="text-white">Start Your</span>
                  <br />
                  <span className="bg-gradient-to-r from-sky-400 to-orange-400 bg-clip-text text-transparent">
                    Coding Journey
                  </span>
                </h2>
                <p className="text-sm text-slate-300 max-w-sm">
                  Join thousands of developers who are validating their skills and tracking growth through intelligent code assessments.
                </p>
              </div>

              {/* Feature Carousel */}
              <div className="relative h-24 overflow-hidden bg-white/5 backdrop-blur-sm rounded-xl border border-slate-700/50 p-3">
                <div 
                  className="absolute inset-0 flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${activeFeature * 100}%)` }}
                >
                  {features.map((feature, index) => (
                    <div key={index} className="min-w-full h-full flex items-center gap-3 px-2">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${feature.gradient} bg-opacity-20`}>
                        <div className="text-white">{feature.icon}</div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                        <p className="text-xs text-slate-300">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Carousel Indicators */}
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveFeature(index)}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        activeFeature === index 
                          ? 'w-4 bg-gradient-to-r from-sky-400 to-orange-400' 
                          : 'w-1 bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Quote */}
              <div className="max-w-sm bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  "{currentQuote}"
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['10k+', 'Active Users'],
                  ['50k+', 'Assessments'],
                  ['95%', 'Satisfaction'],
                ].map(([stat, label]) => (
                  <div key={label} className="text-center">
                    <div className="text-lg xl:text-xl font-bold bg-gradient-to-r from-sky-400 to-orange-400 bg-clip-text text-transparent">
                      {stat}
                    </div>
                    <div className="text-[10px] text-slate-400">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 text-xs text-slate-400 flex items-center gap-2">
              <span>© 2024 Place Values</span>
              <span className="w-1 h-1 rounded-full bg-slate-600"></span>
              <span>precision in every line</span>
            </div>
          </div>

          {/* Right Panel - Register Form */}
          <div className="w-full lg:w-3/5 bg-slate-800/90 backdrop-blur-sm p-4 sm:p-6 lg:p-8 xl:p-10 flex items-start justify-center overflow-y-auto">
            <div className="w-full max-w-2xl space-y-4 lg:space-y-5">
              {/* Mobile Logo */}
              <div className="lg:hidden flex flex-col items-center space-y-2 pb-2">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-orange-400 rounded-xl rotate-6"></div>
                  <div className="absolute inset-0 bg-slate-900 rounded-xl -rotate-3 flex items-center justify-center">
                    <Image
                      src="/logo.png"
                      alt="Place Values"
                      width={60}
                      height={60}
                      className="object-contain w-8 h-8"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-sky-400 to-orange-400 bg-clip-text text-transparent">
                    Place Values
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">Join the developer community</p>
                </div>
              </div>

              {/* Header */}
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  Create Account
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Join thousands of developers testing their skills
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
                {/* First & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs font-medium text-slate-300">
                      First Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-sky-400" />
                      <Input
                        id="firstName"
                        placeholder="Vishal"
                        {...register('firstName')}
                        className="pl-8 h-9 sm:h-10 text-xs sm:text-sm rounded-lg bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-[10px] sm:text-xs text-orange-400">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs font-medium text-slate-300">
                      Last Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-sky-400" />
                      <Input
                        id="lastName"
                        placeholder="Tiwari"
                        {...register('lastName')}
                        className="pl-8 h-9 sm:h-10 text-xs sm:text-sm rounded-lg bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="text-[10px] sm:text-xs text-orange-400">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-slate-300">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-sky-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      {...register('email')}
                      className="pl-8 h-9 sm:h-10 text-xs sm:text-sm rounded-lg bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[10px] sm:text-xs text-orange-400">{errors.email.message}</p>
                  )}
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="mobileNumber" className="text-xs font-medium text-slate-300">
                    Mobile Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-sky-400" />
                    <Input
                      id="mobileNumber"
                      placeholder="6399544706"
                      {...register('mobileNumber')}
                      className="pl-8 h-9 sm:h-10 text-xs sm:text-sm rounded-lg bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                    />
                  </div>
                  {errors.mobileNumber && (
                    <p className="text-[10px] sm:text-xs text-orange-400">{errors.mobileNumber.message}</p>
                  )}
                </div>

                {/* College and Branch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="collegeName" className="text-xs font-medium text-slate-300">
                      College
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-sky-400 z-10" />
                      <Select
                        value={watchedCollegeName}
                        onValueChange={(value) => setValue('collegeName', value)}
                      >
                        <SelectTrigger className="pl-8 h-9 sm:h-10 text-xs sm:text-sm rounded-lg bg-slate-700/50 border-slate-600 text-white focus:border-sky-400 focus:ring-1 focus:ring-sky-400">
                          <SelectValue placeholder="Select college" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                          {isLoadingColleges ? (
                            <SelectItem value="loading" disabled className="text-slate-400">
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Loading...</span>
                              </div>
                            </SelectItem>
                          ) : (
                            colleges?.map((college) => (
                              <SelectItem key={college._id} value={college.name} className="text-white hover:bg-slate-700">
                                {college.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.collegeName && (
                      <p className="text-[10px] sm:text-xs text-orange-400">{errors.collegeName.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="branchName" className="text-xs font-medium text-slate-300">
                      Branch
                    </Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-orange-400 z-10" />
                      <Select
                        value={watchedBranchName}
                        onValueChange={(value) => setValue('branchName', value)}
                        disabled={!selectedCollege}
                      >
                        <SelectTrigger className="pl-8 h-9 sm:h-10 text-xs sm:text-sm rounded-lg bg-slate-700/50 border-slate-600 text-white focus:border-sky-400 focus:ring-1 focus:ring-sky-400 disabled:opacity-50">
                          <SelectValue
                            placeholder={selectedCollege ? 'Select branch' : 'Select college first'}
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                          {selectedCollege?.branches.map((branch) => (
                            <SelectItem key={branch._id} value={branch.name} className="text-white hover:bg-slate-700">
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.branchName && (
                      <p className="text-[10px] sm:text-xs text-orange-400">{errors.branchName.message}</p>
                    )}
                  </div>
                </div>

                {/* College Year and Registration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="collegeYear" className="text-xs font-medium text-slate-300">
                      Year
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-sky-400 z-10" />
                      <Select
                        value={watch('collegeYear')?.toString()}
                        onValueChange={(value) => setValue('collegeYear', parseInt(value))}
                      >
                        <SelectTrigger className="pl-8 h-9 sm:h-10 text-xs sm:text-sm rounded-lg bg-slate-700/50 border-slate-600 text-white focus:border-sky-400 focus:ring-1 focus:ring-sky-400">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                          <SelectItem value="1" className="text-white hover:bg-slate-700">1st Year</SelectItem>
                          <SelectItem value="2" className="text-white hover:bg-slate-700">2nd Year</SelectItem>
                          <SelectItem value="3" className="text-white hover:bg-slate-700">3rd Year</SelectItem>
                          <SelectItem value="4" className="text-white hover:bg-slate-700">4th Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.collegeYear && (
                      <p className="text-[10px] sm:text-xs text-orange-400">{errors.collegeYear.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="registrationNo" className="text-xs font-medium text-slate-300">
                      Reg. No.
                    </Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-orange-400" />
                      <Input
                        id="registrationNo"
                        placeholder="ABC123"
                        {...register('registrationNo', {
                          onChange: (e) =>
                            setValue(
                              'registrationNo',
                              e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
                            ),
                        })}
                        className="pl-8 h-9 sm:h-10 text-xs sm:text-sm rounded-lg bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                      />
                    </div>
                    {errors.registrationNo && (
                      <p className="text-[10px] sm:text-xs text-orange-400">{errors.registrationNo.message}</p>
                    )}
                  </div>
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-medium text-slate-300">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-sky-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="password"
                        {...register('password')}
                        className="pl-8 pr-8 h-9 sm:h-10 text-xs sm:text-sm rounded-lg bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-[10px] sm:text-xs text-orange-400">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-xs font-medium text-slate-300">
                      Confirm
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-sky-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="password"
                        {...register('confirmPassword')}
                        className="pl-8 pr-8 h-9 sm:h-10 text-xs sm:text-sm rounded-lg bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[10px] sm:text-xs text-orange-400">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                {/* Error Alert */}
                {registerError && (
                  <Alert className="border-orange-500/50 bg-orange-500/10 py-2">
                    <AlertDescription className="text-xs text-orange-400">
                      Registration failed. Please try again.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Register Button */}
                <Button
                  type="submit"
                  className="w-full h-9 sm:h-10 rounded-lg bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-600 hover:to-orange-600 text-white font-medium text-xs sm:text-sm shadow-sm"
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>

                {/* Login Link */}
                <div className="text-center text-xs">
                  <span className="text-slate-400">Already have an account? </span>
                  <Link href="/login" className="text-sky-400 hover:text-orange-400 transition-colors font-medium inline-flex items-center gap-0.5">
                    Sign in here
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>

                {/* Trust Badge */}
                <div className="flex justify-center pt-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600">
                    <Zap className="h-3 w-3 text-orange-400" />
                    <p className="text-[10px] sm:text-xs text-slate-300">
                      <span className="bg-gradient-to-r from-sky-400 to-orange-400 bg-clip-text text-transparent font-medium">
                        Place Values
                      </span>{' '}
                      · where developers grow
                    </p>
                  </div>
                </div>
              </form>
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