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
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  BookOpen,
  Calendar,
  Hash,
  Shield,
  Clock,
  Sparkles,
  Sun,
  Cloud,
  Edit,
  Save,
  X,
} from 'lucide-react';

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
      // Don't reset branch when college changes - let user keep their selection
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
      // Validate that both college and branch are selected
      if (!formData.collegeId) {
        toast.error('Error', {
          description: 'Please select a college.',
        });
        return;
      }

      if (!formData.branchId) {
        toast.error('Error', {
          description: 'Please select a branch.',
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
        registrationNo: formData.registrationNo, // Keep as string, not parseInt
      };

      // console.log('Sending update data:', updateData);
      // console.log('Form data:', formData);

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
      toast.success('Password Reset Email Sent', {
        description: 'Check your email for password reset instructions.',
      });
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to send password reset email. Please try again.',
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

  // Get all available colleges (from both sources)
  const getAllAvailableColleges = () => {
    const collegesWithBranchesData = collegesWithBranches || [];
    const allCollegesData = allColleges?.data || [];

    // Combine both sources and remove duplicates
    const combinedColleges = [...collegesWithBranchesData];

    allCollegesData.forEach((college) => {
      if (!combinedColleges.find((ec) => ec._id === college._id)) {
        combinedColleges.push(college);
      }
    });

    return combinedColleges;
  };

  // Get all available branches (from both embedded and separate collections)
  const getAllAvailableBranches = () => {
    const embeddedBranches = getAvailableBranches();
    const separateBranches = allBranches?.data || [];

    // Combine both sources and remove duplicates
    const combinedBranches = [...embeddedBranches];

    separateBranches.forEach((branch) => {
      if (!combinedBranches.find((eb) => eb._id === branch._id)) {
        combinedBranches.push(branch);
      }
    });

    // If no embedded branches from selected college, return all separate branches
    if (combinedBranches.length === 0) {
      return separateBranches;
    }

    return combinedBranches;
  };

  // Show loading state while user data is being fetched
  if (
    isLoadingUser ||
    isLoadingColleges ||
    isLoadingAllColleges ||
    isLoadingBranches
  ) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-sky-50 to-orange-50 flex items-center justify-center">
          <div className="text-center">
            <div className="relative inline-flex mb-4">
              <div className="h-16 w-16 rounded-full border-4 border-sky-200 border-t-sky-500 animate-spin"></div>
              <User className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-sky-300" />
            </div>
            <p className="text-gray-500">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state if there are issues loading data
  if (collegesError || allCollegesError || branchesError) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-sky-50 to-orange-50 flex items-center justify-center">
          <Card className="border-red-100 shadow-sm max-w-md">
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Error Loading Data
              </h2>
              <p className="text-gray-600">
                {collegesError && `Colleges error: ${collegesError.message}`}
                {allCollegesError &&
                  `All colleges error: ${allCollegesError.message}`}
                {branchesError && `Branches error: ${branchesError.message}`}
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
        <div className="min-h-screen bg-gradient-to-br from-sky-50 to-orange-50 flex items-center justify-center">
          <Card className="border-red-100 shadow-sm max-w-md">
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Profile Not Found
              </h2>
              <p className="text-gray-600">
                Unable to load your profile information.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // console.log('USER', user);
  // console.log('Colleges with branches:', collegesWithBranches);
  // console.log('All colleges:', allColleges);
  // console.log('All branches:', allBranches);
  // console.log('Combined colleges:', getAllAvailableColleges());
  // console.log('Combined branches:', getAllAvailableBranches());

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50">
        {/* Decorative Elements */}
        <div className="fixed top-20 right-10 opacity-10 pointer-events-none">
          <Sun className="h-40 w-40 text-orange-300" />
        </div>
        <div className="fixed bottom-20 left-10 opacity-10 pointer-events-none">
          <Cloud className="h-40 w-40 text-sky-300" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-sky-500" />
                <span className="text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-sky-600 to-orange-600 bg-clip-text text-transparent">
                  My Profile
                </span>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-sky-700 via-sky-600 to-orange-600 bg-clip-text text-transparent">
                Profile Settings
              </span>
            </h1>
            <p className="mt-2 text-gray-500">
              Manage your personal information and account settings
            </p>
          </div>

          {/* Profile Information Card */}
          <Card className="border-sky-100 shadow-sm overflow-hidden mb-6">
            <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <User className="h-5 w-5 text-sky-500" />
                    Profile Information
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500 mt-1">
                    Update your personal information and contact details
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-sm flex items-center gap-2"
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
                      className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-4 py-2 text-sm font-medium"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={isUpdatingProfile}
                      className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-sm flex items-center gap-2"
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
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-700">
                    Failed to update profile. Please try again.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Name Fields */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-sky-400" />
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-sky-400" />
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-sky-400" />
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sky-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    value={user.email} 
                    disabled 
                    className="pl-10 border-sky-200 rounded-xl bg-gray-50 text-sm"
                  />
                </div>
                <p className="text-xs text-gray-400">Email cannot be changed</p>
              </div>

              {/* Mobile Number */}
              <div className="space-y-2">
                <Label htmlFor="mobileNumber" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-sky-400" />
                  Mobile Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sky-400" />
                  <Input
                    id="mobileNumber"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="pl-10 border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm"
                  />
                </div>
              </div>

              {/* Academic Information */}
              <Separator className="bg-sky-100" />
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-orange-500" />
                  Academic Information
                </h3>

                {/* Data availability info */}
                {isEditing && (
                  <div className="text-xs text-gray-500 bg-gradient-to-r from-sky-50 to-orange-50 p-3 rounded-xl border border-sky-100">
                    <p className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-sky-400" />
                      Available options: {getAllAvailableColleges().length} colleges, {getAllAvailableBranches().length} branches
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* College */}
                  <div className="space-y-2">
                    <Label htmlFor="college" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-sky-400" />
                      College
                    </Label>
                    {isEditing ? (
                      <Select
                        value={formData.collegeId}
                        onValueChange={(value) =>
                          handleSelectChange('collegeId', value)
                        }
                      >
                        <SelectTrigger className="border-sky-200 focus:border-sky-400 rounded-xl bg-white/80">
                          <SelectValue placeholder="Select college" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAllAvailableColleges().map((college) => (
                            <SelectItem key={college._id} value={college._id}>
                              {college.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-sky-50 to-orange-50 rounded-xl border border-sky-100">
                        <Building2 className="h-4 w-4 text-sky-500" />
                        <span className="text-sm text-gray-700">{user.college?.name || 'Not specified'}</span>
                      </div>
                    )}
                  </div>

                  {/* Branch */}
                  <div className="space-y-2">
                    <Label htmlFor="branch" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5 text-orange-400" />
                      Branch
                    </Label>
                    {isEditing ? (
                      <Select
                        value={formData.branchId}
                        onValueChange={(value) =>
                          handleSelectChange('branchId', value)
                        }
                      >
                        <SelectTrigger className="border-sky-200 focus:border-sky-400 rounded-xl bg-white/80">
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAllAvailableBranches().map((branch) => (
                            <SelectItem key={branch._id} value={branch._id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                        <BookOpen className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-gray-700">{user.branch?.name || 'Not specified'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* College Year */}
                  <div className="space-y-2">
                    <Label htmlFor="collegeYear" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-sky-400" />
                      College Year
                    </Label>
                    {isEditing ? (
                      <Select
                        value={formData.collegeYear.toString()}
                        onValueChange={(value) =>
                          handleSelectChange('collegeYear', value)
                        }
                      >
                        <SelectTrigger className="border-sky-200 focus:border-sky-400 rounded-xl bg-white/80">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st Year</SelectItem>
                          <SelectItem value="2">2nd Year</SelectItem>
                          <SelectItem value="3">3rd Year</SelectItem>
                          <SelectItem value="4">4th Year</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-100">
                        <Calendar className="h-4 w-4 text-sky-500" />
                        <span className="text-sm text-gray-700">
                          {user.collegeYear
                            ? `${user.collegeYear}${getOrdinalSuffix(user.collegeYear)} Year`
                            : 'Not specified'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Registration Number */}
                  <div className="space-y-2">
                    <Label htmlFor="registrationNo" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5 text-orange-400" />
                      Registration Number
                    </Label>
                    {isEditing ? (
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-400" />
                        <Input
                          id="registrationNo"
                          name="registrationNo"
                          value={formData.registrationNo}
                          onChange={handleInputChange}
                          placeholder="Enter registration number"
                          className="pl-10 border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                        <Hash className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-gray-700">{user.registrationNo || 'Not specified'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings Card */}
          <Card className="border-sky-100 shadow-sm overflow-hidden mb-6">
            <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Shield className="h-5 w-5 text-sky-500" />
                Security
              </CardTitle>
              <CardDescription className="text-sm text-gray-500 mt-1">
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-sky-50/30 to-orange-50/30 rounded-xl border border-sky-100">
                <div>
                  <p className="font-medium text-gray-700">Password</p>
                  <p className="text-sm text-gray-500">
                    Click the button below to reset your password
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleForgotPassword}
                  disabled={isForgotPasswordPending}
                  className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-4 py-2 text-sm font-medium"
                >
                  {isForgotPasswordPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Forgot Password'
                  )}
                </Button>
              </div>

              {forgotPasswordError && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-700">
                    Failed to send password reset email. Please try again.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Account Status Card */}
          <Card className="border-sky-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="h-5 w-5 text-sky-500" />
                Account Status
              </CardTitle>
              <CardDescription className="text-sm text-gray-500 mt-1">
                Your account information and verification status
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Email Verification */}
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gradient-to-r hover:from-sky-50/30 hover:to-orange-50/30 transition-colors">
                  <div>
                    <p className="font-medium text-gray-700">Email Verification</p>
                    <p className="text-xs text-gray-500">
                      Verify your email address to access all features
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {user.isEmailVerified ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium text-green-600">Verified</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm font-medium text-yellow-600">Pending</span>
                      </>
                    )}
                  </div>
                </div>

                <Separator className="bg-sky-100" />

                {/* Account Status */}
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gradient-to-r hover:from-sky-50/30 hover:to-orange-50/30 transition-colors">
                  <div>
                    <p className="font-medium text-gray-700">Account Status</p>
                    <p className="text-xs text-gray-500">
                      Your account is currently active
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {user.isActive ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium text-green-600">Active</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-medium text-red-600">Inactive</span>
                      </>
                    )}
                  </div>
                </div>

                <Separator className="bg-sky-100" />

                {/* Member Since */}
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gradient-to-r hover:from-sky-50/30 hover:to-orange-50/30 transition-colors">
                  <div>
                    <p className="font-medium text-gray-700">Member Since</p>
                    <p className="text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm font-medium bg-gradient-to-r from-sky-100 to-orange-100 text-gray-700 px-3 py-1 rounded-lg">
                    {user.role === 'admin' ? 'Administrator' : 'Student'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-sky-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-sky-300"></span>
              <span className="text-xs text-gray-400">Profile Settings</span>
              <span className="h-1 w-1 rounded-full bg-orange-300"></span>
            </div>
            <span className="text-xs text-gray-400">
              Last updated: {new Date(user.updatedAt).toLocaleDateString()}
            </span>
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
  if (j === 1 && k !== 11) {
    return 'st';
  }
  if (j === 2 && k !== 12) {
    return 'nd';
  }
  if (j === 3 && k !== 13) {
    return 'rd';
  }
  return 'th';
}