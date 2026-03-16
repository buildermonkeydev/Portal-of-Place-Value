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

  const onSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    registerUser(registerData);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-sky-50 via-white to-orange-50">
      {/* Decorative Elements - Subtle */}
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
                <div className="relative w-10 h-10">
                  <Image
                    src="/logo.png"
                    alt="Place Values"
                    fill
                    className="object-contain"
                  />
                </div>
                {/* <span className="text-lg font-medium text-gray-900">
                  Place Values
                </span> */}
              </div>

              {/* Main Content */}
              <div className="space-y-6">
                <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight">
                  <span className="bg-gradient-to-r from-sky-700 to-orange-600 bg-clip-text text-transparent">
                    Code Assessment Hub
                  </span>
                </h1>
                <p className="text-xl text-gray-500 max-w-md">
                  Join the community of developers
                </p>
              </div>

              {/* Quote */}
              <div className="max-w-md">
                <p className="text-lg text-gray-600 italic">
                  "{currentQuote}"
                </p>
              </div>

              {/* Simple Feature List */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"></div>
                  <span>Access coding challenges</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"></div>
                  <span>Track your progress</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"></div>
                  <span>Compete with peers</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"></div>
                  <span>Earn certificates</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-sm text-gray-400">
              © 2024 Place Values · precision in every line
            </div>
          </div>

          {/* Right Panel - Register Form */}
          <div className="w-full lg:w-1/2 bg-white/90 backdrop-blur-sm p-6 sm:p-8 lg:p-12 flex items-start justify-center overflow-y-auto">
            <div className="w-full max-w-md space-y-6">
              {/* Mobile Logo */}
              <div className="lg:hidden flex flex-col items-center space-y-3">
                <div className="relative w-14 h-14">
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
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
                  Create Account
                </h2>
                <p className="text-gray-500 text-sm">
                  Join thousands of developers testing their skills
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* First & Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs font-medium text-gray-600">
                      First Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-sky-400" />
                      <Input
                        id="firstName"
                        placeholder="Vishal"
                        {...register('firstName')}
                        className="pl-8 h-10 text-sm rounded-lg border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-white"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-xs text-red-500">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs font-medium text-gray-600">
                      Last Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-sky-400" />
                      <Input
                        id="lastName"
                        placeholder="Tiwari"
                        {...register('lastName')}
                        className="pl-8 h-10 text-sm rounded-lg border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-white"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="text-xs text-red-500">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-gray-600">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-sky-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      {...register('email')}
                      className="pl-8 h-10 text-sm rounded-lg border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-white"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="mobileNumber" className="text-xs font-medium text-gray-600">
                    Mobile Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-sky-400" />
                    <Input
                      id="mobileNumber"
                      placeholder="6399544706"
                      {...register('mobileNumber')}
                      className="pl-8 h-10 text-sm rounded-lg border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-white"
                    />
                  </div>
                  {errors.mobileNumber && (
                    <p className="text-xs text-red-500">{errors.mobileNumber.message}</p>
                  )}
                </div>

                {/* College and Branch */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="collegeName" className="text-xs font-medium text-gray-600">
                      College
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-sky-400 z-10" />
                      <Select
                        value={watchedCollegeName}
                        onValueChange={(value) => setValue('collegeName', value)}
                      >
                        <SelectTrigger className="pl-8 h-10 text-sm rounded-lg border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
                          <SelectValue placeholder="Select college" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingColleges ? (
                            <SelectItem value="loading" disabled>
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Loading...</span>
                              </div>
                            </SelectItem>
                          ) : (
                            colleges?.map((college) => (
                              <SelectItem key={college._id} value={college.name}>
                                {college.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.collegeName && (
                      <p className="text-xs text-red-500">{errors.collegeName.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="branchName" className="text-xs font-medium text-gray-600">
                      Branch
                    </Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-orange-400 z-10" />
                      <Select
                        value={watchedBranchName}
                        onValueChange={(value) => setValue('branchName', value)}
                        disabled={!selectedCollege}
                      >
                        <SelectTrigger className="pl-8 h-10 text-sm rounded-lg border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
                          <SelectValue
                            placeholder={selectedCollege ? 'Select branch' : 'Select college first'}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedCollege?.branches.map((branch) => (
                            <SelectItem key={branch._id} value={branch.name}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.branchName && (
                      <p className="text-xs text-red-500">{errors.branchName.message}</p>
                    )}
                  </div>
                </div>

                {/* College Year and Registration */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="collegeYear" className="text-xs font-medium text-gray-600">
                      Year
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-sky-400 z-10" />
                      <Select
                        value={watch('collegeYear')?.toString()}
                        onValueChange={(value) => setValue('collegeYear', parseInt(value))}
                      >
                        <SelectTrigger className="pl-8 h-10 text-sm rounded-lg border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st Year</SelectItem>
                          <SelectItem value="2">2nd Year</SelectItem>
                          <SelectItem value="3">3rd Year</SelectItem>
                          <SelectItem value="4">4th Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.collegeYear && (
                      <p className="text-xs text-red-500">{errors.collegeYear.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="registrationNo" className="text-xs font-medium text-gray-600">
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
                        className="pl-8 h-10 text-sm rounded-lg border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-white"
                      />
                    </div>
                    {errors.registrationNo && (
                      <p className="text-xs text-red-500">{errors.registrationNo.message}</p>
                    )}
                  </div>
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-medium text-gray-600">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-sky-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="password"
                        {...register('password')}
                        className="pl-8 pr-8 h-10 text-sm rounded-lg border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-500">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-xs font-medium text-gray-600">
                      Confirm
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-sky-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="password"
                        {...register('confirmPassword')}
                        className="pl-8 pr-8 h-10 text-sm rounded-lg border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                {/* Error Alert */}
                {registerError && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50 py-2">
                    <AlertDescription className="text-xs text-red-700">
                      Registration failed. Please try again.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Register Button */}
                <Button
                  type="submit"
                  className="w-full h-10 rounded-lg bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-600 hover:to-orange-600 text-white font-medium text-sm shadow-sm"
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
                  <span className="text-gray-500">Already have an account? </span>
                  <Link href="/login" className="text-sky-600 hover:text-sky-700 font-medium">
                    Sign in here
                  </Link>
                </div>

                {/* Tagline */}
                <div className="text-center text-xs text-gray-400 pt-2">
                  <span className="bg-gradient-to-r from-sky-500 to-orange-500 bg-clip-text text-transparent font-medium">
                    Place Values
                  </span>{' '}
                  · where developers grow
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}