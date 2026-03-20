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
import { 
  Building2, 
  GraduationCap, 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  X,
  University,
  Layers,
  BookOpen,
  Zap,
  Shield,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [focused, setFocused] = useState(false);
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
  const collegeName = watch('name', '');
  const isValidName = collegeName.length >= 1 && !errors.name;

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

  const progress = Math.min(100, (collegeName.length / 100) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden rounded-2xl border-white/10 bg-[#0C0C10] shadow-2xl">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-orange-500/5 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-orange-500/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}></div>

        {/* Floating Icons */}
        <div className="absolute top-6 left-6 opacity-20 pointer-events-none">
          <Sparkles className="h-6 w-6 text-indigo-400" />
        </div>
        <div className="absolute bottom-6 right-6 opacity-20 pointer-events-none">
          <Zap className="h-6 w-6 text-orange-400" />
        </div>

        {/* Main Content */}
        <div className="relative bg-transparent">
          {/* Header */}
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-400 to-orange-500"></div>
            <DialogHeader className="p-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                {/* Icon Circle */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-orange-500 rounded-xl blur opacity-60"></div>
                  <div className="relative h-12 w-12 bg-gradient-to-br from-indigo-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <University className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                <div>
                  <DialogTitle className="text-xl font-bold text-white">
                    New Institution
                  </DialogTitle>
                  <DialogDescription className="text-sm text-zinc-400 mt-0.5">
                    Add a new college to expand your educational network
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6 space-y-6">
              {/* College Name Card */}
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="px-5 py-3 border-b border-white/10 bg-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-indigo-400" />
                      <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                        Institution Details
                      </h3>
                    </div>
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      isValidName 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : collegeName.length > 0 
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                          : "bg-white/5 text-zinc-500 border border-white/10"
                    )}>
                      {isValidName ? '✓ Valid' : collegeName.length > 0 ? '⋯ Incomplete' : '○ Required'}
                    </span>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="space-y-2">
                    <div className={cn(
                      "relative transition-all duration-200",
                      focused && "transform scale-[1.02]"
                    )}>
                      <University className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <Input
                        {...register('name')}
                        placeholder="Enter college/university name"
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        className={cn(
                          "pl-10 bg-white/5 border rounded-xl text-white placeholder:text-zinc-600 transition-all",
                          errors.name 
                            ? "border-red-500/50 focus:border-red-500" 
                            : isValidName 
                              ? "border-emerald-500/30 focus:border-emerald-500" 
                              : "border-white/10 focus:border-indigo-500"
                        )}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {errors.name ? (
                          <AlertCircle className="h-4 w-4 text-red-400" />
                        ) : isValidName ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : collegeName.length > 0 ? (
                          <ArrowRight className="h-4 w-4 text-amber-400" />
                        ) : null}
                      </div>
                    </div>
                    {errors.name && (
                      <p className="text-xs text-red-400 flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-red-400"></span>
                        {errors.name.message}
                      </p>
                    )}
                    
                    {/* Progress Bar */}
                    {collegeName.length > 0 && !errors.name && (
                      <div className="mt-2">
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-300",
                              isValidName 
                                ? "bg-gradient-to-r from-emerald-500 to-emerald-400" 
                                : "bg-gradient-to-r from-indigo-500 to-orange-500"
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                          {collegeName.length}/100 characters
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Quick Tip */}
                  <div className="flex items-center gap-2 text-xs text-zinc-500 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                    <Sparkles className="h-3 w-3 text-indigo-400" />
                    <span>Use the full official name for better identification</span>
                  </div>
                </div>
              </div>

              {/* Branches Card */}
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="px-5 py-3 border-b border-white/10 bg-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-orange-400" />
                      <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                        Academic Programs
                      </h3>
                    </div>
                    
                    {/* Branch Counter Badge */}
                    {watchedBranches.length > 0 && (
                      <div className="flex items-center gap-1.5 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                        <CheckCircle2 className="h-3 w-3 text-indigo-400" />
                        <span className="text-xs font-medium text-indigo-400">
                          {watchedBranches.length} branch{watchedBranches.length !== 1 ? 'es' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className={cn(
                    "border-2 border-dashed rounded-xl transition-all",
                    errors.branches 
                      ? "border-red-500/30 bg-red-500/5" 
                      : watchedBranches.length > 0 
                        ? "border-indigo-500/30 bg-indigo-500/5" 
                        : "border-white/10 hover:border-indigo-500/30"
                  )}>
                    <BranchSelector
                      selectedBranches={watchedBranches}
                      onBranchesChange={handleBranchesChange}
                      label="Search or add new branches"
                    />
                  </div>

                  {errors.branches && (
                    <p className="text-xs text-red-400 flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-red-400"></span>
                      {errors.branches.message}
                    </p>
                  )}

                  {/* Branches Grid Preview */}
                  {watchedBranches.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-xs font-medium text-zinc-500">Selected programs</div>
                        <div className="flex-1 h-px bg-gradient-to-r from-indigo-500/20 to-orange-500/20"></div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {watchedBranches.map((branch, index) => (
                          <div
                            key={index}
                            className="group relative bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2 hover:border-indigo-500/50 transition-all"
                          >
                            <GraduationCap className="h-3 w-3 text-orange-400" />
                            <span className="text-xs font-medium text-white">{branch.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Branch Hint */}
                  {watchedBranches.length === 0 && !errors.branches && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Plus className="h-3 w-3 text-indigo-400" />
                      <span>Click above to add branches (e.g., Computer Science, Mechanical Engineering)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <DialogFooter className="p-6 pt-4 border-t border-white/10 bg-white/5">
              <div className="flex items-center justify-between w-full gap-4">
                <div className="flex-1">
                  {/* Progress Steps */}
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "h-1.5 w-8 rounded-full transition-all",
                      watchedBranches.length > 0 ? "bg-gradient-to-r from-indigo-500 to-indigo-500" : "bg-white/10"
                    )} />
                    <div className={cn(
                      "h-1.5 w-8 rounded-full transition-all",
                      watchedBranches.length >= 2 ? "bg-gradient-to-r from-indigo-500 to-orange-500" : "bg-white/10"
                    )} />
                    <div className={cn(
                      "h-1.5 w-8 rounded-full transition-all",
                      watchedBranches.length >= 3 ? "bg-gradient-to-r from-orange-500 to-orange-500" : "bg-white/10"
                    )} />
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    {watchedBranches.length === 0 
                      ? 'Add at least one branch to continue' 
                      : `${watchedBranches.length} branch${watchedBranches.length !== 1 ? 'es' : ''} ready`}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white rounded-xl px-5 py-2.5"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !isValidName || watchedBranches.length === 0}
                    className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 disabled:from-zinc-600 disabled:to-zinc-700 text-white rounded-xl px-6 py-2.5 min-w-[130px] transition-all disabled:cursor-not-allowed"
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