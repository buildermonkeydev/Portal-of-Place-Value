'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  X, 
  UserPlus, 
  Plus, 
  Building2, 
  Save, 
  Loader2,
  Mail,
  Phone,
  Hash,
  Calendar,
  User,
  Shield,
  CheckCircle,
  XCircle,
  Sun,
  Cloud,
  GraduationCap,
  AlertCircle
} from 'lucide-react';
import { useCreateUser, useUpdateUser } from '@/lib/hooks/useUsers';
import {
  useCreateCollege,
  useCollegesWithBranches,
} from '@/lib/hooks/useColleges';
import { toast } from 'sonner';
import { User as UserType, UserRole } from '@/lib/types';
import { College } from '@/lib/types/college';
import { Checkbox } from '@/components/ui/checkbox';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserType | null;
}

export function UserModal({ isOpen, onClose, user }: UserModalProps) {
  const isEditing = !!user;
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    mobileNumber: '',
    collegeId: '',
    branchName: '',
    collegeYear: 0,
    registrationNo: '',
    role: UserRole.STUDENT,
    isActive: true,
    isEmailVerified: false,
  });

  const [newCollegeName, setNewCollegeName] = useState('');
  const [isCreateCollegeModalOpen, setIsCreateCollegeModalOpen] =
    useState(false);

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const createCollegeMutation = useCreateCollege();

  // Populate form when editing
  useMemo(() => {
    if (user && isOpen) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        password: '',
        mobileNumber: user.mobileNumber || '',
        collegeId: user.college?._id || '',
        branchName: user.branch?.name || '',
        collegeYear: user.collegeYear || 0,
        registrationNo: user.registrationNo || '',
        role: user.role || UserRole.STUDENT,
        isActive: user.isActive ?? true,
        isEmailVerified: user.isEmailVerified ?? false,
      });
    } else if (!user && isOpen) {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        mobileNumber: '',
        collegeId: '',
        branchName: '',
        collegeYear: 0,
        registrationNo: '',
        role: UserRole.STUDENT,
        isActive: true,
        isEmailVerified: false,
      });
    }
  }, [user, isOpen]);

  // Fetch colleges with branch metadata
  const { data: collegesData, isLoading: isLoadingColleges } =
    useCollegesWithBranches();

  const colleges = collegesData || [];

  const selectedCollege: College | null = useMemo(() => {
    if (!formData.collegeId) return null;
    return colleges.find((college) => college._id === formData.collegeId) || null;
  }, [colleges, formData.collegeId]);

  const selectedBranch = useMemo(() => {
    if (!selectedCollege || !formData.branchName) return null;
    return selectedCollege.branches.find(b => b.name === formData.branchName) || null;
  }, [selectedCollege, formData.branchName]);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCollegeChange = (collegeId: string) => {
    handleInputChange('collegeId', collegeId);
    handleInputChange('branchName', '');
  };

  const handleRegistrationChange = (value: string) => {
    const sanitizedValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    handleInputChange('registrationNo', sanitizedValue);
  };

  const handleCreateCollege = async () => {
    if (!newCollegeName.trim()) {
      toast.error('Please enter a college name');
      return;
    }

    try {
      const newCollege = await createCollegeMutation.mutateAsync({
        name: newCollegeName.trim(),
        branches: [],
      });

      handleInputChange('collegeId', newCollege._id);
      setNewCollegeName('');
      setIsCreateCollegeModalOpen(false);
      toast.success('College created successfully');
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isAdmin = formData.role === UserRole.ADMIN;

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      (!isEditing && !formData.password) ||
      !formData.mobileNumber
    ) {
      toast.error('Please fill in all required personal information fields');
      return;
    }

    if (!isAdmin) {
      if (!formData.collegeId || !formData.branchName) {
        toast.error('Please fill in all required college fields');
        return;
      }

      if (formData.collegeYear < 1 || formData.collegeYear > 4) {
        toast.error('Please select a valid college year');
        return;
      }

      if (!/^[A-Za-z0-9]+$/.test(formData.registrationNo)) {
        toast.error('Registration number must contain only letters and numbers');
        return;
      }
    }

    try {
      const activeCollege = isAdmin ? null : selectedCollege;

      if (!isAdmin && !activeCollege) {
        toast.error('Please select a valid college');
        return;
      }

      if (isEditing && user) {
        const updateData: any = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          mobileNumber: formData.mobileNumber,
          role: formData.role,
          isActive: formData.isActive,
          isEmailVerified: formData.isEmailVerified,
        };

        if (formData.collegeId) {
          updateData.collegeId = formData.collegeId;
          updateData.branchId = selectedBranch?._id;
          updateData.branchName = formData.branchName;
          updateData.collegeYear = formData.collegeYear;
          updateData.registrationNo = formData.registrationNo;
        }

        await updateUserMutation.mutateAsync({
          id: user._id,
          data: updateData,
        });
        toast.success('User updated successfully');
      } else {
        await createUserMutation.mutateAsync({
          ...formData,
          collegeName: selectedCollege?.name || '',
          branchId: selectedBranch?._id,
          branchName: formData.branchName || '',
          registrationNo: formData.registrationNo || '',
        });
        toast.success('User created successfully');
      }
      handleClose();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      mobileNumber: '',
      collegeId: '',
      branchName: '',
      collegeYear: 0,
      registrationNo: '',
      role: UserRole.STUDENT,
      isActive: true,
      isEmailVerified: false,
    });
    setNewCollegeName('');
    onClose();
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          onClick={handleClose}
        />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden">
          {/* Decorative Elements */}
          <div className="fixed top-10 right-10 opacity-5 pointer-events-none">
            <Sun className="h-20 w-20 text-orange-300" />
          </div>
          <div className="fixed bottom-10 left-10 opacity-5 pointer-events-none">
            <Cloud className="h-20 w-20 text-sky-300" />
          </div>

          {/* Header */}
          <div className="px-8 py-6 border-b border-sky-100 bg-gradient-to-r from-sky-50 via-white to-orange-50">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
                <div>
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-sky-700 to-orange-600 bg-clip-text text-transparent">
                    {isEditing ? 'Edit User' : 'Create New User'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {isEditing 
                      ? `Editing ${user?.firstName} ${user?.lastName}`
                      : 'Add a new user to the system'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information Card */}
              <Card className="border-sky-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-sky-50/30 to-orange-50/30 border-b border-sky-100 py-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-sky-500" />
                    <CardTitle className="text-sm font-semibold text-gray-700">
                      Personal Information
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-gray-500 ml-6">
                    Basic user details and account information
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        First Name <span className="text-sky-400">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="John"
                        className="border-sky-200 focus:border-sky-400 rounded-xl px-4 py-2.5 text-sm bg-white/80"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        Last Name <span className="text-sky-400">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Doe"
                        className="border-sky-200 focus:border-sky-400 rounded-xl px-4 py-2.5 text-sm bg-white/80"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-sky-400" />
                      Email Address <span className="text-sky-400">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="john.doe@example.com"
                      className="border-sky-200 focus:border-sky-400 rounded-xl px-4 py-2.5 text-sm bg-white/80"
                      required
                      disabled={isEditing}
                    />
                    {isEditing && (
                      <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5 text-orange-400" />
                        Password <span className="text-sky-400">*</span>
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="••••••••"
                        className="border-sky-200 focus:border-sky-400 rounded-xl px-4 py-2.5 text-sm bg-white/80"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="mobileNumber" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-sky-400" />
                      Mobile Number <span className="text-sky-400">*</span>
                    </Label>
                    <Input
                      id="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="border-sky-200 focus:border-sky-400 rounded-xl px-4 py-2.5 text-sm bg-white/80"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="role" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-orange-400" />
                      User Role <span className="text-sky-400">*</span>
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => handleInputChange('role', value as UserRole)}
                    >
                      <SelectTrigger className="border-sky-200 focus:border-sky-400 rounded-xl py-2.5 h-auto bg-white/80">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.STUDENT}>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-sky-500" />
                            <span>Student</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={UserRole.ADMIN}>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-purple-500" />
                            <span>Admin</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isEditing && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => handleInputChange('isActive', !!checked)}
                          className="rounded border-sky-300 text-sky-500"
                        />
                        <Label htmlFor="isActive" className="text-sm text-gray-600 flex items-center gap-1">
                          {formData.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          Active Account
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isEmailVerified"
                          checked={formData.isEmailVerified}
                          onCheckedChange={(checked) => handleInputChange('isEmailVerified', !!checked)}
                          className="rounded border-sky-300 text-sky-500"
                        />
                        <Label htmlFor="isEmailVerified" className="text-sm text-gray-600 flex items-center gap-1">
                          {formData.isEmailVerified ? (
                            <Mail className="h-4 w-4 text-green-500" />
                          ) : (
                            <Mail className="h-4 w-4 text-orange-500" />
                          )}
                          Email Verified
                        </Label>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* College Information Card */}
              {formData.role !== UserRole.ADMIN && (
                <Card className="border-sky-100 shadow-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-orange-50/30 to-sky-50/30 border-b border-sky-100 py-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-orange-500" />
                      <CardTitle className="text-sm font-semibold text-gray-700">
                        Academic Information
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs text-gray-500 ml-6">
                      College and academic details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="collegeId" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-sky-400" />
                        College <span className="text-sky-400">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Select
                          value={formData.collegeId}
                          onValueChange={handleCollegeChange}
                        >
                          <SelectTrigger className="flex-1 border-sky-200 focus:border-sky-400 rounded-xl py-2.5 h-auto bg-white/80">
                            <SelectValue placeholder="Select college" />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingColleges ? (
                              <SelectItem value="loading" disabled>
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span>Loading colleges...</span>
                                </div>
                              </SelectItem>
                            ) : colleges.length > 0 ? (
                              colleges.map((college) => (
                                <SelectItem key={college._id} value={college._id}>
                                  {college.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-colleges" disabled>
                                No colleges available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateCollegeModalOpen(true)}
                          className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-3"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="branchName" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5 text-orange-400" />
                        Branch / Department <span className="text-sky-400">*</span>
                      </Label>
                      <Select
                        value={formData.branchName || undefined}
                        onValueChange={(value) => handleInputChange('branchName', value)}
                        disabled={!selectedCollege || selectedCollege.branches.length === 0}
                      >
                        <SelectTrigger className="border-sky-200 focus:border-sky-400 rounded-xl py-2.5 h-auto bg-white/80">
                          <SelectValue
                            placeholder={
                              !formData.collegeId
                                ? 'Select college first'
                                : selectedCollege && selectedCollege.branches.length > 0
                                  ? 'Select branch'
                                  : 'No branches available'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedCollege && selectedCollege.branches.length > 0 ? (
                            selectedCollege.branches.map((branch) => (
                              <SelectItem key={branch._id} value={branch.name}>
                                {branch.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-branches" disabled>
                              {selectedCollege
                                ? 'No branches defined for this college'
                                : 'Select a college first'}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="collegeYear" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-sky-400" />
                          College Year <span className="text-sky-400">*</span>
                        </Label>
                        <Select
                          value={formData.collegeYear > 0 ? formData.collegeYear.toString() : undefined}
                          onValueChange={(value) => handleInputChange('collegeYear', parseInt(value))}
                        >
                          <SelectTrigger className="border-sky-200 focus:border-sky-400 rounded-xl py-2.5 h-auto bg-white/80">
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4].map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                Year {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="registrationNo" className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <Hash className="h-3.5 w-3.5 text-orange-400" />
                          Registration Number <span className="text-sky-400">*</span>
                        </Label>
                        <Input
                          id="registrationNo"
                          value={formData.registrationNo}
                          onChange={(e) => handleRegistrationChange(e.target.value)}
                          placeholder="REG2024001"
                          className="border-sky-200 focus:border-sky-400 rounded-xl px-4 py-2.5 text-sm bg-white/80"
                          required
                        />
                      </div>
                    </div>

{/* Validation Hint */}
{formData.role === UserRole.STUDENT && (
  <div className="mt-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
    <div className="flex items-start gap-2">
      <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
      <div>
        <p className="text-xs font-medium text-amber-800">Registration number format:</p>
        <p className="text-xs text-amber-600">Only letters and numbers allowed (no spaces or special characters)</p>
      </div>
    </div>
  </div>
)}
                  </CardContent>
                </Card>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-sky-100 bg-gradient-to-r from-sky-50/30 to-orange-50/30">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="w-full sm:w-auto border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-5 py-2.5 text-sm font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
                className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm min-w-[140px]"
              >
                {createUserMutation.isPending || updateUserMutation.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isEditing ? 'Saving...' : 'Creating...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    {isEditing ? <Save className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    <span>{isEditing ? 'Save Changes' : 'Create User'}</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Create College Modal */}
      <Dialog open={isCreateCollegeModalOpen} onOpenChange={setIsCreateCollegeModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-sky-50 via-white to-orange-50 border-b border-sky-100">
            <DialogTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-sky-500" />
              Create College
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              Add a new college to the system. Branches can be added later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="newCollegeName" className="text-xs font-medium text-gray-500">
                College Name
              </Label>
              <Input
                id="newCollegeName"
                value={newCollegeName}
                onChange={(e) => setNewCollegeName(e.target.value)}
                placeholder="e.g., Stanford University"
                className="border-sky-200 focus:border-sky-400 rounded-xl px-4 py-2.5 text-sm bg-white/80"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateCollege();
                  }
                }}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t border-sky-100 bg-gradient-to-r from-sky-50/30 to-orange-50/30">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateCollegeModalOpen(false)}
                className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-4 py-2 text-sm font-medium"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateCollege}
                disabled={createCollegeMutation.isPending}
                className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium"
              >
                {createCollegeMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create College'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}