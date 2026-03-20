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
  GraduationCap,
  AlertCircle,
  Sparkles,
  Key,
  Users,
  Briefcase
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
import { cn } from '@/lib/utils';

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
  const [isCreateCollegeModalOpen, setIsCreateCollegeModalOpen] = useState(false);

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
  const { data: collegesData, isLoading: isLoadingColleges } = useCollegesWithBranches();
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
    setFormData((prev) => ({ ...prev, [field]: value }));
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

    if (!formData.firstName || !formData.lastName || !formData.email || (!isEditing && !formData.password) || !formData.mobileNumber) {
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

        await updateUserMutation.mutateAsync({ id: user._id, data: updateData });
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
        <div className="relative bg-[#0C0C10] rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden border border-white/10">
          
          {/* Decorative Elements */}
          <div className="absolute top-10 right-10 opacity-10 pointer-events-none">
            <Sparkles className="h-20 w-20 text-indigo-400" />
          </div>
          <div className="absolute bottom-10 left-10 opacity-10 pointer-events-none">
            <GraduationCap className="h-20 w-20 text-orange-400" />
          </div>

          {/* Header */}
          <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-1 bg-gradient-to-b from-indigo-400 to-orange-400 rounded-full"></div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {isEditing ? 'Edit User' : 'Create New User'}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    {isEditing 
                      ? `Editing ${user?.firstName} ${user?.lastName}`
                      : 'Add a new user to the system'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Personal Information Card */}
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-white">Personal Information</h3>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 ml-6">
                    Basic user details and account information
                  </p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                        First Name <span className="text-indigo-400">*</span>
                      </Label>
                      <Input
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="John"
                        className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                        Last Name <span className="text-indigo-400">*</span>
                      </Label>
                      <Input
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Doe"
                        className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-indigo-400" />
                      Email Address <span className="text-indigo-400">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="john.doe@example.com"
                      className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-xl"
                      required
                      disabled={isEditing}
                    />
                    {isEditing && (
                      <p className="text-xs text-zinc-500 mt-1">Email cannot be changed</p>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                        <Key className="h-3.5 w-3.5 text-orange-400" />
                        Password <span className="text-indigo-400">*</span>
                      </Label>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="••••••••"
                        className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-xl"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-indigo-400" />
                      Mobile Number <span className="text-indigo-400">*</span>
                    </Label>
                    <Input
                      value={formData.mobileNumber}
                      onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-orange-400" />
                      User Role <span className="text-indigo-400">*</span>
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => handleInputChange('role', value as UserRole)}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                        <SelectItem value={UserRole.STUDENT}>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-indigo-400" />
                            <span>Student</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={UserRole.ADMIN}>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-orange-400" />
                            <span>Admin</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isEditing && (
                    <div className="flex flex-wrap gap-6 pt-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => handleInputChange('isActive', !!checked)}
                          className="border-white/30 data-[state=checked]:bg-emerald-500"
                        />
                        <Label htmlFor="isActive" className="text-sm text-zinc-300 flex items-center gap-1 cursor-pointer">
                          {formData.isActive ? (
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-400" />
                          )}
                          Active Account
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="isEmailVerified"
                          checked={formData.isEmailVerified}
                          onCheckedChange={(checked) => handleInputChange('isEmailVerified', !!checked)}
                          className="border-white/30 data-[state=checked]:bg-emerald-500"
                        />
                        <Label htmlFor="isEmailVerified" className="text-sm text-zinc-300 flex items-center gap-1 cursor-pointer">
                          {formData.isEmailVerified ? (
                            <Mail className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Mail className="h-4 w-4 text-orange-400" />
                          )}
                          Email Verified
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* College Information Card */}
              {formData.role !== UserRole.ADMIN && (
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-orange-400" />
                      <h3 className="text-sm font-semibold text-white">Academic Information</h3>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 ml-6">
                      College and academic details
                    </p>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                        College <span className="text-indigo-400">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Select value={formData.collegeId} onValueChange={handleCollegeChange}>
                          <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white rounded-xl">
                            <SelectValue placeholder="Select college" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
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
                          className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 rounded-xl px-3"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5 text-orange-400" />
                        Branch / Department <span className="text-indigo-400">*</span>
                      </Label>
                      <Select
                        value={formData.branchName || undefined}
                        onValueChange={(value) => handleInputChange('branchName', value)}
                        disabled={!selectedCollege || selectedCollege.branches.length === 0}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
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
                        <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
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
                        <Label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                          College Year <span className="text-indigo-400">*</span>
                        </Label>
                        <Select
                          value={formData.collegeYear > 0 ? formData.collegeYear.toString() : undefined}
                          onValueChange={(value) => handleInputChange('collegeYear', parseInt(value))}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                            {[1, 2, 3, 4].map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                Year {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                          <Hash className="h-3.5 w-3.5 text-orange-400" />
                          Registration Number <span className="text-indigo-400">*</span>
                        </Label>
                        <Input
                          value={formData.registrationNo}
                          onChange={(e) => handleRegistrationChange(e.target.value)}
                          placeholder="REG2024001"
                          className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-xl uppercase"
                          required
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-amber-400">Registration number format:</p>
                          <p className="text-xs text-amber-400/70">Only letters and numbers allowed (no spaces or special characters)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-white/5">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 rounded-xl px-5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
                className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white rounded-xl px-6 min-w-[140px]"
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
        <DialogContent className="bg-[#0C0C10] border-white/10 rounded-2xl max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-400" />
              Create College
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Add a new college to the system. Branches can be added later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">College Name</Label>
              <Input
                value={newCollegeName}
                onChange={(e) => setNewCollegeName(e.target.value)}
                placeholder="e.g., Stanford University"
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-xl"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCollege()}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateCollegeModalOpen(false)}
              className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateCollege}
              disabled={createCollegeMutation.isPending}
              className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white rounded-xl"
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.03);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </>
  );
}