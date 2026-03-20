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
import { useCreateBranch } from '@/lib/hooks/useBranches';
import { 
  GraduationCap, 
  Sparkles, 
  X, 
  Check, 
  ArrowRight, 
  BookOpen,
  ChevronRight,
  Zap,
  Plus,
  Shield,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const createBranchSchema = z.object({
  name: z
    .string()
    .min(2, 'Branch name must be at least 2 characters')
    .max(100, 'Branch name cannot exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s\-&.]+$/, 'Branch name can only contain letters, numbers, spaces, and basic punctuation (-&.)'),
});

type CreateBranchFormData = z.infer<typeof createBranchSchema>;

interface CreateBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateBranchModal({ isOpen, onClose }: CreateBranchModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);

  const createBranchMutation = useCreateBranch();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateBranchFormData>({
    resolver: zodResolver(createBranchSchema),
    defaultValues: {
      name: '',
    },
  });

  const branchName = watch('name', '');
  const isValid = branchName.length >= 2 && !errors.name;
  const progress = Math.min(100, (branchName.length / 100) * 100);

  const onSubmit = async (data: CreateBranchFormData) => {
    setIsSubmitting(true);
    try {
      await createBranchMutation.mutateAsync(data);
      reset();
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

  // Predefined branch suggestions
  const suggestions = [
    'Computer Science',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering',
    'Electronics & Communication',
    'Information Technology',
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setValue('name', suggestion, { shouldValidate: true });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden rounded-2xl border-white/10 bg-[#0C0C10] shadow-2xl">
        {/* Background Design */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-orange-500/5 pointer-events-none"></div>
        
        {/* Animated Gradient Orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-orange-500/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}></div>

        {/* Floating Icons */}
        <div className="absolute top-6 left-6 opacity-20 pointer-events-none">
          <BookOpen className="h-8 w-8 text-indigo-400" />
        </div>
        <div className="absolute bottom-6 right-6 opacity-20 pointer-events-none">
          <Sparkles className="h-8 w-8 text-orange-400" />
        </div>

        {/* Main Content */}
        <div className="relative bg-transparent">
          {/* Header */}
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-500/5 to-orange-500/5"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-indigo-400 to-orange-500"></div>
            
            <DialogHeader className="p-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-orange-500 rounded-xl blur-md opacity-40"></div>
                    <div className="relative h-14 w-14 bg-gradient-to-br from-indigo-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <GraduationCap className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <DialogTitle className="text-xl font-bold text-white">
                      New Branch
                    </DialogTitle>
                    <DialogDescription className="text-sm text-zinc-400 max-w-[250px]">
                      Expand your academic catalog by adding a new branch to the system.
                    </DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-6 py-4 space-y-6">
              {/* Main Input Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-400 to-orange-400"></span>
                    Branch Details
                  </Label>
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    isValid 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : branchName.length > 0 
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                        : "bg-white/5 text-zinc-500 border border-white/10"
                  )}>
                    {isValid ? '✓ Valid' : branchName.length > 0 ? '⋯ Incomplete' : '○ Required'}
                  </span>
                </div>

                <div className={cn(
                  "relative transition-all duration-200",
                  focused && "transform scale-[1.02]"
                )}>
                  <Input
                    {...register('name')}
                    placeholder="e.g., Computer Science Engineering"
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={cn(
                      "w-full pl-5 pr-14 py-3.5 text-base bg-white/5 border rounded-xl text-white placeholder:text-zinc-600 transition-all",
                      errors.name 
                        ? "border-red-500/50 focus:border-red-500" 
                        : isValid 
                          ? "border-emerald-500/30 focus:border-emerald-500" 
                          : "border-white/10 focus:border-indigo-500"
                    )}
                  />
                  
                  {/* Status Icon */}
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    {errors.name ? (
                      <div className="h-6 w-6 rounded-full bg-red-500/10 flex items-center justify-center">
                        <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                      </div>
                    ) : isValid ? (
                      <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                    ) : branchName.length > 0 ? (
                      <div className="h-6 w-6 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <ChevronRight className="h-3.5 w-3.5 text-amber-400" />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center">
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1">
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-300",
                          errors.name 
                            ? "bg-red-500" 
                            : isValid 
                              ? "bg-gradient-to-r from-emerald-500 to-emerald-400" 
                              : "bg-gradient-to-r from-indigo-500 to-orange-500"
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className={cn(
                      "text-xs mt-1.5",
                      errors.name ? "text-red-400" : "text-zinc-500"
                    )}>
                      {errors.name ? errors.name.message : `${branchName.length}/100 characters used`}
                    </p>
                  </div>
                  <div className="text-xs font-mono text-zinc-500">
                    {branchName.length}/100
                  </div>
                </div>
              </div>

              {/* Quick Suggestions */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="text-xs font-medium text-zinc-500">Quick suggestions</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="group relative px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-left hover:border-indigo-500/50 hover:bg-white/10 transition-all overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="relative text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
                        {suggestion}
                      </span>
                      <ArrowRight className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Guidelines Card */}
              <div className="relative bg-gradient-to-br from-indigo-500/5 to-orange-500/5 rounded-xl p-4 border border-white/10 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-2xl"></div>
                <div className="relative">
                  <h4 className="text-xs font-semibold text-white mb-3 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-indigo-400" />
                    Branch Name Guidelines
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-emerald-400 mt-0.5" />
                      <span className="text-xs text-zinc-400">2-100 characters</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-emerald-400 mt-0.5" />
                      <span className="text-xs text-zinc-400">Letters & numbers</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-emerald-400 mt-0.5" />
                      <span className="text-xs text-zinc-400">Spaces allowed</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-emerald-400 mt-0.5" />
                      <span className="text-xs text-zinc-400">Basic punctuation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with Action Buttons */}
            <DialogFooter className="p-6 pt-4 border-t border-white/10 bg-white/5">
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></div>
                  <span className="text-xs text-zinc-500">Ready to create</span>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 rounded-xl px-5 py-2.5"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !isValid}
                    className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 disabled:from-zinc-600 disabled:to-zinc-700 text-white rounded-xl px-6 py-2.5 min-w-[140px] transition-all disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Creating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span>Create Branch</span>
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