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
import { useUpdateCollege } from '@/lib/hooks/useColleges';
import { College } from '@/lib/types/college';
import { toast } from 'sonner';
import { BranchSelector } from './BranchSelector';
import { Building2, GraduationCap, Sun, Cloud, X, Save } from 'lucide-react';

const updateCollegeSchema = z.object({
  name: z
    .string()
    .min(1, 'College name is required')
    .max(100, 'College name must be less than 100 characters'),
});

type UpdateCollegeFormData = z.infer<typeof updateCollegeSchema>;

interface EditCollegeModalProps {
  college: College | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditCollegeModal({
  college,
  isOpen,
  onClose,
}: EditCollegeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<
    Array<{ name: string }>
  >([]);
  const [branchError, setBranchError] = useState<string>('');
  const updateCollegeMutation = useUpdateCollege();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UpdateCollegeFormData>({
    resolver: zodResolver(updateCollegeSchema),
  });

  // Set form values when college changes
  useEffect(() => {
    if (college) {
      setValue('name', college.name);
      setSelectedBranches(college.branches || []);
      setBranchError('');
    }
  }, [college, setValue]);

  const onSubmit = async (data: UpdateCollegeFormData) => {
    if (!college) return;

    // Validate branches
    if (selectedBranches.length === 0) {
      setBranchError('At least one branch is required');
      return;
    }

    setBranchError('');
    setIsSubmitting(true);

    try {
      const updateData = {
        ...data,
        branches: selectedBranches,
      };

      await updateCollegeMutation.mutateAsync({
        id: college._id,
        data: updateData,
      });
      reset();
      setSelectedBranches([]);
      setBranchError('');
      onClose();
      toast.success('College updated successfully');
    } catch (error) {
      // Error is handled by the mutation hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setSelectedBranches([]);
      setBranchError('');
      onClose();
    }
  };

  if (!college) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden rounded-2xl border-sky-100 shadow-xl">
        {/* Gradient Header with Sky/Sunset Theme */}
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-sky-50 via-white to-orange-50 border-b border-sky-100">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="h-10 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
              <div>
                <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-sky-700 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-sky-500" />
                  Edit College
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-2 max-w-md">
                  Update the college information and branches below. At least one
                  branch is required.
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-sky-200" />
              <Sun className="h-5 w-5 text-orange-200" />
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors ml-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* College ID Badge */}
          {college && (
            <div className="mt-3 ml-11 flex items-center gap-2">
              <span className="text-xs text-gray-400">ID:</span>
              <span className="text-xs font-mono bg-white/80 px-2 py-1 rounded-lg border border-sky-100 text-sky-700">
                {college._id.slice(0, 8)}...{college._id.slice(-4)}
              </span>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-6">
            {/* College Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-sky-400" />
                College Name <span className="text-sky-400">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g., Stanford University"
                  className={`w-full pl-4 pr-4 py-2.5 border ${
                    errors.name 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-sky-200 focus:border-sky-400'
                  } rounded-xl bg-white/80 backdrop-blur-sm text-sm transition-colors`}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <span className="h-1 w-1 rounded-full bg-red-500"></span>
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Branches Field */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-orange-400" />
                College Branches <span className="text-sky-400">*</span>
              </Label>
              
              <div className={`border ${
                branchError ? 'border-red-200' : 'border-sky-100'
              } rounded-xl bg-white/80 backdrop-blur-sm overflow-hidden transition-colors`}>
                <BranchSelector
                  selectedBranches={selectedBranches}
                  onBranchesChange={setSelectedBranches}
                  label="Edit Branches"
                />
              </div>

              {branchError && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <span className="h-1 w-1 rounded-full bg-red-500"></span>
                  {branchError}
                </p>
              )}

              {/* Branch Count Indicator */}
              {selectedBranches.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gradient-to-r from-sky-200 to-orange-200 rounded-full">
                    <div 
                      className="h-1 bg-gradient-to-r from-sky-500 to-orange-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (selectedBranches.length / 5) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium bg-gradient-to-r from-sky-500 to-orange-500 bg-clip-text text-transparent">
                    {selectedBranches.length} branch{selectedBranches.length !== 1 ? 'es' : ''} selected
                  </span>
                </div>
              )}
            </div>

            {/* Last Updated Info */}
            {college && college.updatedAt && (
              <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-sky-100">
                <span className="h-1 w-1 rounded-full bg-sky-300"></span>
                Last updated: {new Date(college.updatedAt).toLocaleString()}
              </div>
            )}
          </div>

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
                className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm min-w-[140px] transition-all"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Updating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Save className="h-4 w-4" />
                    <span>Update College</span>
                  </div>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}