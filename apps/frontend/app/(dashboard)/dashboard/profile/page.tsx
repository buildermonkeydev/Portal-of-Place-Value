'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCollegesWithBranches, useColleges } from '@/lib/hooks/useColleges';
import { useBranches } from '@/lib/hooks/useBranches';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loading } from '@/components/ui/Loading';
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Hash,
  Shield,
  Clock,
  Sparkles,
  Edit,
  Save,
  X,
  User,
  Building,
  BookOpen,
  GraduationCap,
  Fingerprint,
  Key,
  FileText,
  Briefcase,
  MapPin,
  Link,
  Globe,
  Award,
  Star,
  Heart,
  Compass,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Settings,
  HelpCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const {
    user,
    isLoadingUser,
    forgotPassword,
    isForgotPasswordPending,
    forgotPasswordError,
    updateProfile,
    isUpdatingProfile,
    updateProfileError,
  } = useAuth();

  const {
    data: collegesWithBranches,
    isLoading: isLoadingColleges,
    error: collegesError,
  } = useCollegesWithBranches();

  const {
    data: allColleges,
    isLoading: isLoadingAllColleges,
    error: allCollegesError,
  } = useColleges();

  const {
    data: allBranches,
    isLoading: isLoadingBranches,
    error: branchesError,
  } = useBranches();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobileNumber: '',
    collegeYear: 1,
    collegeId: '',
    branchId: '',
    registrationNo: '',
  });

  // Fix hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        mobileNumber: user.mobileNumber || '',
        collegeYear: user.collegeYear || 1,
        collegeId: user.college?._id || '',
        branchId: user.branch?._id || '',
        registrationNo: user.registrationNo?.toString() || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'collegeId') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else if (name === 'collegeYear') {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.collegeId) {
        toast.error('Error', {
          description: 'Please select your institution.',
        });
        return;
      }

      if (!formData.branchId) {
        toast.error('Error', {
          description: 'Please select your department.',
        });
        return;
      }

      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        mobileNumber: formData.mobileNumber,
        collegeYear: formData.collegeYear,
        collegeId: formData.collegeId,
        branchId: formData.branchId,
        registrationNo: formData.registrationNo,
      };

      await updateProfile(updateData);
      toast.success('Profile Updated', {
        description: 'Your profile has been updated successfully.',
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Error', {
        description: 'Failed to update profile. Please try again.',
      });
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) {
      toast.error('Error', {
        description: 'Email not found. Please contact support.',
      });
      return;
    }

    try {
      await forgotPassword({ email: user.email });
      toast.success('Reset Link Sent', {
        description: 'Check your email for password reset instructions.',
      });
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to send reset link. Please try again.',
      });
    }
  };

  // Get available branches for selected college
  const getAvailableBranches = () => {
    if (!formData.collegeId || !collegesWithBranches) return [];
    const college = collegesWithBranches.find(
      (c) => c._id === formData.collegeId
    );
    return college?.branches || [];
  };

  // Get all available colleges
  const getAllAvailableColleges = () => {
    const collegesWithBranchesData = collegesWithBranches || [];
    const allCollegesData = allColleges?.data || [];

    const combinedColleges = [...collegesWithBranchesData];

    allCollegesData.forEach((college) => {
      if (!combinedColleges.find((ec) => ec._id === college._id)) {
        combinedColleges.push(college);
      }
    });

    return combinedColleges;
  };

  // Get all available branches
  const getAllAvailableBranches = () => {
    const embeddedBranches = getAvailableBranches();
    const separateBranches = allBranches?.data || [];

    const combinedBranches = [...embeddedBranches];

    separateBranches.forEach((branch) => {
      if (!combinedBranches.find((eb) => eb._id === branch._id)) {
        combinedBranches.push(branch);
      }
    });

    if (combinedBranches.length === 0) {
      return separateBranches;
    }

    return combinedBranches;
  };

  // Show loading state
  if (
    isLoadingUser ||
    isLoadingColleges ||
    isLoadingAllColleges ||
    isLoadingBranches
  ) {
    return (
      <DashboardLayout>
        <Loading fullScreen message="Loading profile..." />
      </DashboardLayout>
    );
  }

  // Show error state
  if (collegesError || allCollegesError || branchesError) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#0C0C10] flex items-center justify-center p-4">
          <Card className="bg-white/5 border-white/10 max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Something went wrong
              </h2>
              <p className="text-zinc-400">
                Unable to load profile data. Please try again.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state if no user data
  if (!user) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#0C0C10] flex items-center justify-center p-4">
          <Card className="bg-white/5 border-white/10 max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <User className="h-8 w-8 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Profile Not Found
              </h2>
              <p className="text-zinc-400">
                Unable to locate your profile information.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0C0C10] relative overflow-x-hidden">
        {/* Simple background effect */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom,rgba(249,115,22,0.1),transparent_50%)]"></div>
        </div>

        <div className="relative z-10 w-full">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
            
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-1 bg-gradient-to-b from-indigo-500 to-orange-500 rounded-full"></div>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-indigo-400" />
                  <span className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                    My Space · Profile
                  </span>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Personal Dashboard
              </h1>
              <p className="mt-2 text-zinc-400">
                Manage your personal information and account settings
              </p>
            </div>

            {/* Main Profile Card */}
            <Card className="bg-white/5 border-white/10 overflow-hidden mb-6">
              <CardHeader className="bg-white/5 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-400" />
                      Profile Details
                    </CardTitle>
                    <CardDescription className="text-sm text-zinc-400 mt-1">
                      Your basic information and contact details
                    </CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button 
                      onClick={() => setIsEditing(true)}
                      className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            firstName: user.firstName || '',
                            lastName: user.lastName || '',
                            mobileNumber: user.mobileNumber || '',
                            collegeYear: user.collegeYear || 1,
                            collegeId: user.college?._id || '',
                            branchId: user.branch?._id || '',
                            registrationNo: user.registrationNo?.toString() || '',
                          });
                        }}
                        className="border-white/10 hover:bg-white/5 text-zinc-300 rounded-xl px-4 py-2 text-sm font-medium"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSave} 
                        disabled={isUpdatingProfile}
                        className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                      >
                        {isUpdatingProfile ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {updateProfileError && (
                  <Alert variant="destructive" className="border-red-500/20 bg-red-500/10">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">
                      Failed to update profile. Please try again.
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Name Fields */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-indigo-400" />
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl text-white placeholder:text-zinc-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-blue-400" />
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl text-white placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-indigo-400" />
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400" />
                    <Input 
                      id="email" 
                      type="email" 
                      value={user.email} 
                      disabled 
                      className="pl-10 bg-white/5 border-white/10 rounded-xl text-zinc-400"
                    />
                  </div>
                  <p className="text-xs text-zinc-500">Email cannot be changed</p>
                </div>

                {/* Mobile Number */}
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber" className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-blue-400" />
                    Mobile Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                    <Input
                      id="mobileNumber"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="pl-10 bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl text-white placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                {/* Academic Information */}
                <Separator className="bg-white/10" />
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-orange-400" />
                    Academic Details
                  </h3>

                  {/* Data availability info - only show if mounted */}
                  {isEditing && mounted && (
                    <div className="text-xs text-zinc-400 bg-white/5 p-3 rounded-xl border border-white/10">
                      <p className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-indigo-400" />
                        Available options: {getAllAvailableColleges().length} institutions, {getAllAvailableBranches().length} departments
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* College */}
                    <div className="space-y-2">
                      <Label htmlFor="college" className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                        <Building className="h-3.5 w-3.5 text-indigo-400" />
                        Institution
                      </Label>
                      {isEditing ? (
                        <Select
                          value={formData.collegeId}
                          onValueChange={(value) =>
                            handleSelectChange('collegeId', value)
                          }
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl text-white">
                            <SelectValue placeholder="Select institution" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                            {getAllAvailableColleges().map((college) => (
                              <SelectItem key={college._id} value={college._id} className="hover:bg-white/5">
                                {college.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/10">
                          <Building className="h-4 w-4 text-indigo-400" />
                          <span className="text-sm text-zinc-300">{user.college?.name || 'Not specified'}</span>
                        </div>
                      )}
                    </div>

                    {/* Branch */}
                    <div className="space-y-2">
                      <Label htmlFor="branch" className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-orange-400" />
                        Department
                      </Label>
                      {isEditing ? (
                        <Select
                          value={formData.branchId}
                          onValueChange={(value) =>
                            handleSelectChange('branchId', value)
                          }
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl text-white">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                            {getAllAvailableBranches().map((branch) => (
                              <SelectItem key={branch._id} value={branch._id} className="hover:bg-white/5">
                                {branch.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/10">
                          <BookOpen className="h-4 w-4 text-orange-400" />
                          <span className="text-sm text-zinc-300">{user.branch?.name || 'Not specified'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* College Year */}
                    <div className="space-y-2">
                      <Label htmlFor="collegeYear" className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                        Current Year
                      </Label>
                      {isEditing ? (
                        <Select
                          value={formData.collegeYear.toString()}
                          onValueChange={(value) =>
                            handleSelectChange('collegeYear', value)
                          }
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl text-white">
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                            <SelectItem value="1">1st Year</SelectItem>
                            <SelectItem value="2">2nd Year</SelectItem>
                            <SelectItem value="3">3rd Year</SelectItem>
                            <SelectItem value="4">4th Year</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/10">
                          <Calendar className="h-4 w-4 text-indigo-400" />
                          <span className="text-sm text-zinc-300">
                            {user.collegeYear
                              ? `${user.collegeYear}${getOrdinalSuffix(user.collegeYear)} Year`
                              : 'Not specified'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Registration Number */}
                    <div className="space-y-2">
                      <Label htmlFor="registrationNo" className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                        <Fingerprint className="h-3.5 w-3.5 text-orange-400" />
                        Student ID
                      </Label>
                      {isEditing ? (
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-400" />
                          <Input
                            id="registrationNo"
                            name="registrationNo"
                            value={formData.registrationNo}
                            onChange={handleInputChange}
                            placeholder="Enter your student ID"
                            className="pl-10 bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl text-white placeholder:text-zinc-600"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/10">
                          <Fingerprint className="h-4 w-4 text-orange-400" />
                          <span className="text-sm text-zinc-300">{user.registrationNo || 'Not specified'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Card */}
            <Card className="bg-white/5 border-white/10 overflow-hidden mb-6">
              <CardHeader className="bg-white/5 border-b border-white/10">
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <Lock className="h-5 w-5 text-indigo-400" />
                  Security Settings
                </CardTitle>
                <CardDescription className="text-sm text-zinc-400 mt-1">
                  Manage your password and account security
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <p className="font-medium text-white">Password</p>
                    <p className="text-sm text-zinc-400">
                      Request a password reset link via email
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleForgotPassword}
                    disabled={isForgotPasswordPending}
                    className="border-white/10 hover:bg-white/5 text-zinc-300 rounded-xl px-4 py-2 text-sm font-medium"
                  >
                    {isForgotPasswordPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </div>

                {forgotPasswordError && (
                  <Alert variant="destructive" className="border-red-500/20 bg-red-500/10">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">
                      Failed to send reset link. Please try again.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Account Status Card */}
            <Card className="bg-white/5 border-white/10 overflow-hidden">
              <CardHeader className="bg-white/5 border-b border-white/10">
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <Info className="h-5 w-5 text-indigo-400" />
                  Account Overview
                </CardTitle>
                <CardDescription className="text-sm text-zinc-400 mt-1">
                  Your account status and activity
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Email Verification */}
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div>
                      <p className="font-medium text-white">Email Verification</p>
                      <p className="text-xs text-zinc-400">
                        Verify your email for full access
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.isEmailVerified ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          <span className="text-sm font-medium text-green-400">Verified</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-yellow-400" />
                          <span className="text-sm font-medium text-yellow-400">Pending</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-white/10" />

                  {/* Account Status */}
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div>
                      <p className="font-medium text-white">Account Status</p>
                      <p className="text-xs text-zinc-400">
                        Current account state
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.isActive ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          <span className="text-sm font-medium text-green-400">Active</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-400" />
                          <span className="text-sm font-medium text-red-400">Inactive</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-white/10" />

                  {/* Member Since */}
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div>
                      <p className="font-medium text-white">Member Since</p>
                      <p className="text-xs text-zinc-400">
                        When you joined
                      </p>
                    </div>
                    <div className="text-sm font-medium bg-white/5 text-zinc-300 px-3 py-1 rounded-lg border border-white/10">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <Separator className="bg-white/10" />

                  {/* Role */}
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div>
                      <p className="font-medium text-white">Account Type</p>
                      <p className="text-xs text-zinc-400">
                        Your role in the system
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.role === 'admin' ? (
                        <Star className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <User className="h-4 w-4 text-blue-400" />
                      )}
                      <span className="text-sm font-medium text-white">
                        {user.role === 'admin' ? 'Administrator' : 'Student'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
                <span className="text-xs text-zinc-500">Profile Hub</span>
                <span className="h-1 w-1 rounded-full bg-orange-400"></span>
              </div>
              <span className="text-xs text-zinc-500">
                Last updated: {new Date(user.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Helper function to get ordinal suffix
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}