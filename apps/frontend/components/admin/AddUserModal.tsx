'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserRole } from '@/lib/types';
import { toast } from 'sonner';
import { UserPlus, Mail, User, Phone, Building } from 'lucide-react';
import { useCreateUser } from '@/lib/hooks/useUsers';

const addUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits'),
  collegeName: z.string().min(2, 'College name must be at least 2 characters'),
  branchName: z.string().min(2, 'Branch name must be at least 2 characters'),
  collegeYear: z
    .number()
    .min(1, 'College year must be at least 1')
    .max(6, 'College year cannot exceed 6'),
  registrationNo: z.string().min(1, 'Registration number is required'),
  role: z.nativeEnum(UserRole),
});

type AddUserData = z.infer<typeof addUserSchema>;

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded?: () => void;
}

export function AddUserModal({
  isOpen,
  onClose,
  onUserAdded,
}: AddUserModalProps) {
  const createUserMutation = useCreateUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AddUserData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      role: UserRole.STUDENT,
      collegeYear: 1,
      registrationNo: '',
    },
  });

  const watchedRole = watch('role');

  const handleAddUser = async (data: AddUserData) => {
    // Add password field for new users
    const userData = {
      ...data,
      firstName: data.firstName.toUpperCase(),
      lastName: data.lastName.toUpperCase(),
      registrationNo: data.registrationNo.toUpperCase(),
      password: 'temporaryPassword123', // This will be changed by the user
    };

    createUserMutation.mutate(userData, {
      onSuccess: () => {
        reset();
        onClose();
        onUserAdded?.();
      },
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New User
          </DialogTitle>
          <DialogDescription>
            Manually add a new user to the system. The user will receive an
            email notification to set their password.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleAddUser)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                First Name
              </Label>
              <Input
                id="firstName"
                placeholder="Enter first name"
                {...register('firstName')}
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Last Name
              </Label>
              <Input
                id="lastName"
                placeholder="Enter last name"
                {...register('lastName')}
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
            <p className="text-xs text-gray-500">
              The user will receive an email to set their password.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobileNumber" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Mobile Number
            </Label>
            <Input
              id="mobileNumber"
              placeholder="Enter mobile number"
              {...register('mobileNumber')}
              className={errors.mobileNumber ? 'border-red-500' : ''}
            />
            {errors.mobileNumber && (
              <p className="text-sm text-red-500">
                {errors.mobileNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="collegeName" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              College/Institution Name
            </Label>
            <Input
              id="collegeName"
              placeholder="Enter college or institution name"
              {...register('collegeName')}
              className={errors.collegeName ? 'border-red-500' : ''}
            />
            {errors.collegeName && (
              <p className="text-sm text-red-500">
                {errors.collegeName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="branchName" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Branch/Department Name
            </Label>
            <Input
              id="branchName"
              placeholder="Enter branch or department name"
              {...register('branchName')}
              className={errors.branchName ? 'border-red-500' : ''}
            />
            {errors.branchName && (
              <p className="text-sm text-red-500">
                {errors.branchName.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="collegeYear">College Year</Label>
              <Input
                id="collegeYear"
                type="number"
                min="1"
                max="6"
                placeholder="1-6"
                {...register('collegeYear', { valueAsNumber: true })}
                className={errors.collegeYear ? 'border-red-500' : ''}
              />
              {errors.collegeYear && (
                <p className="text-sm text-red-500">
                  {errors.collegeYear.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationNo">Registration Number</Label>
              <Input
                id="registrationNo"
                type="text"
                placeholder="Enter registration number"
                {...register('registrationNo', {
                  onChange: (e) =>
                    setValue(
                      'registrationNo',
                      e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
                    ),
                })}
                className={errors.registrationNo ? 'border-red-500' : ''}
              />
              {errors.registrationNo && (
                <p className="text-sm text-red-500">
                  {errors.registrationNo.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">User Role</Label>
            <Select
              value={watchedRole}
              onValueChange={(value) => setValue('role', value as UserRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.STUDENT}>Student</SelectItem>
                <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role.message}</p>
            )}
            <p className="text-xs text-gray-500">
              {watchedRole === UserRole.ADMIN
                ? 'Admins have full access to manage users, assessments, and system settings.'
                : 'Students can take assessments and view their results.'}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createUserMutation.isPending}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {createUserMutation.isPending ? 'Adding User...' : 'Add User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
