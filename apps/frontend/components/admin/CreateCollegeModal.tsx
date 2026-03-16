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
import { toast } from 'sonner';
import { useCreateCollege } from '@/lib/hooks/useColleges';
import { BranchSelector } from './BranchSelector';
import { Building2, GraduationCap, Sparkles, Plus, CheckCircle2, X } from 'lucide-react';

const createCollegeSchema = z.object({
  name: z
    .string()
    .min(1, 'College name is required')
    .max(100, 'College name must be less than 100 characters'),
  branches: z
    .array(
      z.object({
        name: z.string().min(1, 'Branch name is required'),
      })
    )
    .min(1, 'At least one branch is required'),
});

type CreateCollegeFormData = z.infer<typeof createCollegeSchema>;

interface CreateCollegeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCollegeModal({
  isOpen,
  onClose,
}: CreateCollegeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createCollegeMutation = useCreateCollege();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    trigger,
  } = useForm<CreateCollegeFormData>({
    resolver: zodResolver(createCollegeSchema),
    defaultValues: {
      name: '',
      branches: [],
    },
  });

  const watchedBranches = watch('branches') || [];

  const onSubmit = async (data: CreateCollegeFormData) => {
    if (!data.branches || data.branches.length === 0) {
      toast.error('At least one branch is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const collegeData = {
        name: data.name,
        branches: data.branches,
      };

      const result = await createCollegeMutation.mutateAsync(collegeData);

      reset();
      onClose();
      toast.success('College created successfully');
    } catch (error: any) {
      console.error('Error creating college:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create college. Please try again.');
      }
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

  const handleBranchesChange = (branches: Array<{ name: string }>) => {
    setValue('branches', branches);
    trigger('branches');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-orange-50 opacity-90"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-sky-200/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-orange-200/20 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        {/* Floating Icons */}
        <div className="absolute top-6 left-6 opacity-20">
          <Sparkles className="h-6 w-6 text-sky-400" />
        </div>
        <div className="absolute bottom-6 right-6 opacity-20">
          <Sparkles className="h-6 w-6 text-orange-400" />
        </div>

        {/* Main Content */}
        <div className="relative bg-white/60 backdrop-blur-xl">
          {/* Header */}
          <DialogHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Icon Circle */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-orange-400 rounded-2xl blur opacity-40"></div>
                  <div className="relative h-14 w-14 bg-gradient-to-br from-sky-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <Building2 className="h-7 w-7 text-white" />
                  </div>
                </div>
                
                <div>
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-sky-700 to-orange-600 bg-clip-text text-transparent">
                    New Institution
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-500 mt-1.5 max-w-sm">
                    Add a new college to expand your educational network. Each college needs at least one branch.
                  </DialogDescription>
                </div>
              </div>
              
              
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-8 pt-2 space-y-8">
              {/* College Name Card */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-sky-100 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
                    <Label htmlFor="name" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Institution Details
                    </Label>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder="Enter college/university name"
                        className={`w-full pl-12 pr-4 py-3 border-0 bg-white rounded-xl text-sm placeholder:text-gray-400 focus:ring-2 transition-all ${
                          errors.name 
                            ? 'ring-2 ring-red-200 focus:ring-red-300' 
                            : 'ring-1 ring-sky-100 focus:ring-2 focus:ring-sky-300'
                        }`}
                      />
                      <Building2 className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                        errors.name ? 'text-red-400' : 'text-sky-400'
                      }`} />
                    </div>
                    {errors.name && (
                      <p className="text-xs text-red-500 flex items-center gap-1.5 pl-2">
                        <span className="h-1 w-1 rounded-full bg-red-500"></span>
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Quick Tip */}
                  <div className="flex items-center gap-2 text-xs text-gray-400 bg-sky-50/50 rounded-lg px-3 py-2">
                 
                    <span>Use the full official name for better identification</span>
                  </div>
                </div>
              </div>

              {/* Branches Card */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-sky-100 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-1 bg-gradient-to-b from-orange-400 to-sky-400 rounded-full"></div>
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Academic Programs
                      </Label>
                    </div>
                    
                    {/* Branch Counter Badge */}
                    {watchedBranches.length > 0 && (
                      <div className="flex items-center gap-1.5 bg-gradient-to-r from-sky-100 to-orange-100 px-3 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3 text-sky-600" />
                        <span className="text-xs font-medium text-sky-700">
                          {watchedBranches.length} branch{watchedBranches.length !== 1 ? 'es' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className={`border-2 border-dashed rounded-xl transition-all ${
                    errors.branches 
                      ? 'border-red-200 bg-red-50/30' 
                      : watchedBranches.length > 0 
                        ? 'border-sky-200 bg-sky-50/30' 
                        : 'border-gray-200 hover:border-sky-200'
                  }`}>
                    <BranchSelector
                      selectedBranches={watchedBranches}
                      onBranchesChange={handleBranchesChange}
                      label="Search or add new branches"
                    />
                  </div>

                  {errors.branches && (
                    <p className="text-xs text-red-500 flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-red-500"></span>
                      {errors.branches.message}
                    </p>
                  )}

                  {/* Branches Grid Preview */}
                  {watchedBranches.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-xs font-medium text-gray-400">Selected programs</div>
                        <div className="flex-1 h-px bg-gradient-to-r from-sky-200 to-orange-200"></div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {watchedBranches.map((branch, index) => (
                          <div
                            key={index}
                            className="group relative bg-white border border-sky-100 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
                          >
                            <GraduationCap className="h-3 w-3 text-orange-400" />
                            <span className="text-xs font-medium text-gray-700">{branch.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Branch Hint */}
                  {watchedBranches.length === 0 && !errors.branches && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Plus className="h-3 w-3 text-sky-400" />
                      <span>Click above to add branches (e.g., Computer Science, Mechanical Engineering)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <DialogFooter className="p-6 pt-4 border-t border-sky-100 bg-gradient-to-r from-sky-50/50 via-white to-orange-50/50">
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex-1">
                  {/* Progress Steps */}
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-8 rounded-full transition-all ${
                      watchedBranches.length > 0 ? 'bg-gradient-to-r from-sky-400 to-sky-400' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-1.5 w-8 rounded-full transition-all ${
                      watchedBranches.length >= 2 ? 'bg-gradient-to-r from-sky-400 to-orange-400' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-1.5 w-8 rounded-full transition-all ${
                      watchedBranches.length >= 3 ? 'bg-gradient-to-r from-orange-400 to-orange-400' : 'bg-gray-200'
                    }`}></div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="border-0 bg-white/80 hover:bg-white text-gray-600 rounded-xl px-6 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-600 hover:to-orange-600 text-white rounded-xl px-6 py-2.5 text-sm font-medium shadow-lg shadow-sky-200/50 min-w-[130px] transition-all hover:scale-[1.02]"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Creating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span>Create College</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}