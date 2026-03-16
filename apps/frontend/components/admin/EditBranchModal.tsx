'use client';

import { useState, useEffect } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUpdateBranch } from '@/lib/hooks/useBranches';
import { Branch, UpdateBranchData } from '@/lib/types/branch';
import { Edit, Loader2, GraduationCap, Sun, Cloud, X, AlertCircle, CheckCircle } from 'lucide-react';

const updateBranchSchema = z.object({
  name: z
    .string()
    .min(2, 'Branch name must be at least 2 characters')
    .max(100, 'Branch name cannot exceed 100 characters'),
});

type UpdateBranchFormData = z.infer<typeof updateBranchSchema>;

interface EditBranchModalProps {
  branch: Branch | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditBranchModal({
  branch,
  isOpen,
  onClose,
}: EditBranchModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateBranchMutation = useUpdateBranch();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UpdateBranchFormData>({
    resolver: zodResolver(updateBranchSchema),
  });

  const branchName = watch('name', '');

  // Set form values when branch changes
  useEffect(() => {
    if (branch) {
      setValue('name', branch.name);
    }
  }, [branch, setValue]);

  const onSubmit = async (data: UpdateBranchData) => {
    if (!branch) return;

    setIsSubmitting(true);
    try {
      await updateBranchMutation.mutateAsync({ id: branch._id, data });
      onClose();
    } catch (error) {
      // Error is handled by the mutation hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  if (!branch) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden rounded-2xl border-sky-100 shadow-xl">
        {/* Decorative Elements */}
        <div className="absolute top-5 right-5 opacity-10 pointer-events-none">
          <Sun className="h-16 w-16 text-orange-300" />
        </div>
        <div className="absolute bottom-5 left-5 opacity-10 pointer-events-none">
          <Cloud className="h-16 w-16 text-sky-300" />
        </div>

        {/* Header with Gradient */}
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-sky-50 via-white to-orange-50 border-b border-sky-100">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="h-10 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
              <div>
                <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-sky-700 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-sky-500" />
                  Edit Branch
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-2">
                  Update the branch information. Branch names must be unique.
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
             
            </button>
          </div>
          
          {/* Branch ID Badge */}
          {branch && (
            <div className="mt-3 ml-11 flex items-center gap-2">
              <span className="text-xs text-gray-400">ID:</span>
              <span className="text-xs font-mono bg-white/80 px-2 py-1 rounded-lg border border-sky-100 text-sky-700">
                {branch._id.slice(0, 8)}...{branch._id.slice(-4)}
              </span>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-5">
            {/* Branch Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-sky-400" />
                Branch Name <span className="text-sky-400">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="name"
                  placeholder="e.g., Computer Science"
                  {...register('name')}
                  className={`w-full pl-4 pr-4 py-2.5 border ${
                    errors.name 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-sky-200 focus:border-sky-400'
                  } rounded-xl bg-white/80 backdrop-blur-sm text-sm transition-colors`}
                />
              </div>
              
              {/* Character Counter */}
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2">
                  {errors.name ? (
                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  ) : branchName.length >= 2 ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-sky-200"></div>
                  )}
                  <span className={`text-xs ${
                    errors.name 
                      ? 'text-red-500' 
                      : branchName.length >= 2 
                        ? 'text-green-600' 
                        : 'text-gray-400'
                  }`}>
                    {branchName.length > 0 
                      ? `${branchName.length}/100 characters` 
                      : 'Enter branch name'}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      errors.name 
                        ? 'bg-red-400' 
                        : branchName.length >= 2 
                          ? 'bg-gradient-to-r from-green-400 to-green-500' 
                          : 'bg-gradient-to-r from-sky-300 to-sky-400'
                    }`}
                    style={{ width: `${Math.min(100, (branchName.length / 100) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Error Message */}
              {errors.name && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.name.message}
                  </p>
                </div>
              )}
            </div>

            {/* Name Format Hint */}
            <div className="mt-4 p-3 bg-gradient-to-r from-sky-50 to-orange-50 rounded-xl border border-sky-100">
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-sky-600">i</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Branch Name Guidelines:</p>
                  <ul className="space-y-1 text-xs text-gray-500">
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-sky-400"></span>
                      Minimum 2 characters required
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-sky-400"></span>
                      Maximum 100 characters allowed
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-orange-400"></span>
                      Branch names must be unique in the system
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Last Updated Info */}
            {branch && branch.updatedAt && (
              <div className="flex items-center gap-2 text-xs text-gray-400 pt-2">
                <span className="h-1 w-1 rounded-full bg-sky-300"></span>
                Last updated: {new Date(branch.updatedAt).toLocaleString()}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <DialogFooter className="p-6 pt-4 border-t border-sky-100 bg-gradient-to-r from-sky-50/30 to-orange-50/30">
            <div className="flex justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-5 py-2.5 text-sm font-medium transition-all"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm min-w-[120px] transition-all"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Edit className="h-4 w-4" />
                    <span>Update Branch</span>
                  </div>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>

        {/* Success Message (would appear after update, but handled by toast) */}
        {updateBranchMutation.isSuccess && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-200 animate-slide-up">
            <p className="text-xs text-green-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Branch updated successfully!
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}