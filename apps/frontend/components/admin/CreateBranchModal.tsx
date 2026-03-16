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
  Zap
} from 'lucide-react';

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
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
        {/* Background Design */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-orange-50"></div>
        
        {/* Animated Gradient Orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-sky-200/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-orange-200/30 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}></div>

        {/* Floating Icons */}
        <div className="absolute top-6 left-6 opacity-20 animate-float">
          <BookOpen className="h-8 w-8 text-sky-400" />
        </div>
        <div className="absolute bottom-6 right-6 opacity-20 animate-float" style={{ animationDelay: '2s' }}>
          <Sparkles className="h-8 w-8 text-orange-400" />
        </div>

        {/* Main Content */}
        <div className="relative bg-white/70 backdrop-blur-xl">
          {/* Header with Wave Design */}
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-sky-400 to-orange-400 opacity-5"></div>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-400 via-sky-300 to-orange-400"></div>
            
            <DialogHeader className="p-8 pb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* 3D Icon Stack */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-orange-400 rounded-2xl blur-md opacity-60"></div>
                    <div className="relative h-16 w-16 bg-gradient-to-br from-sky-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-xl transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                      <GraduationCap className="h-8 w-8 text-white" />
                     
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <DialogTitle className="text-3xl font-bold tracking-tight">
                      <span className="bg-gradient-to-r from-sky-700 via-sky-600 to-orange-600 bg-clip-text text-transparent">
                        New Branch
                      </span>
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-500 max-w-[250px]">
                      Expand your academic catalog by adding a new branch to the system.
                    </DialogDescription>
                  </div>
                </div>
                
                {/* <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="h-9 w-9 rounded-xl bg-white/80 backdrop-blur-sm border border-sky-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-sky-200 hover:bg-white hover:scale-110 transition-all duration-200 shadow-sm"
                >
                  <X className="h-4 w-4" />
                </button> */}
              </div>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-8 py-4 space-y-8">
              {/* Main Input Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"></span>
                    Branch Details
                  </Label>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    isValid 
                      ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700' 
                      : branchName.length > 0 
                        ? 'bg-amber-50 text-amber-700' 
                        : 'bg-gray-100 text-gray-500'
                  }`}>
                    {isValid ? '✓ Valid' : branchName.length > 0 ? '⋯ Incomplete' : '○ Required'}
                  </span>
                </div>

                <div className={`relative transition-all duration-200 ${
                  focused ? 'transform scale-[1.02]' : ''
                }`}>
                  <Input
                    {...register('name')}
                    placeholder="e.g., Computer Science Engineering"
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={`w-full pl-5 pr-14 py-4 text-base border-2 bg-white/90 rounded-2xl transition-all ${
                      errors.name 
                        ? 'border-red-300 focus:border-red-400 shadow-lg shadow-red-100' 
                        : isValid 
                          ? 'border-green-300 focus:border-green-400 shadow-lg shadow-green-100' 
                          : 'border-sky-100 focus:border-sky-400 shadow-lg shadow-sky-100/50'
                    }`}
                  />
                  
                  {/* Status Icon */}
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    {errors.name ? (
                      <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-red-500 font-bold text-xs">!</span>
                      </div>
                    ) : isValid ? (
                      <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-sky-100 flex items-center justify-center">
                        <ChevronRight className="h-3.5 w-3.5 text-sky-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Ring */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="relative h-10 w-10">
                    <svg className="w-10 h-10 transform -rotate-90">
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 16}
                        strokeDashoffset={2 * Math.PI * 16 * (1 - progress / 100)}
                        className={`transition-all duration-500 ${
                          errors.name 
                            ? 'text-red-400' 
                            : isValid 
                              ? 'text-green-400' 
                              : 'text-sky-400'
                        }`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-gray-500">{branchName.length}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs ${
                      errors.name ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {errors.name ? errors.name.message : `${branchName.length}/100 characters used`}
                    </p>
                    <div className="h-1 w-full bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          errors.name 
                            ? 'bg-red-400' 
                            : isValid 
                              ? 'bg-gradient-to-r from-green-400 to-green-500' 
                              : 'bg-gradient-to-r from-sky-400 to-orange-400'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Suggestions */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  
                  <span className="text-xs font-medium text-gray-500">Quick suggestions</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="group relative px-3 py-2.5 bg-white border border-sky-100 rounded-xl text-left hover:border-sky-300 hover:shadow-md transition-all overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-sky-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="relative text-xs font-medium text-gray-700 group-hover:text-sky-700 transition-colors">
                        {suggestion}
                      </span>
                      <ArrowRight className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-sky-400 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Guidelines Card */}
              <div className="relative bg-gradient-to-br from-sky-50 to-orange-50 rounded-2xl p-5 border border-sky-100 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sky-200 to-transparent rounded-full blur-2xl opacity-50"></div>
                <div className="relative">
                  <h4 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"></span>
                    Branch Name Guidelines
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-green-500 mt-0.5" />
                      <span className="text-xs text-gray-600">2-100 characters</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-green-500 mt-0.5" />
                      <span className="text-xs text-gray-600">Letters & numbers</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-green-500 mt-0.5" />
                      <span className="text-xs text-gray-600">Spaces allowed</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-green-500 mt-0.5" />
                      <span className="text-xs text-gray-600">Basic punctuation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with Action Buttons */}
            <DialogFooter className="p-6 pt-4 border-t border-sky-100 bg-gradient-to-r from-sky-50/50 via-white to-orange-50/50">
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse"></div>
                  <span className="text-xs text-gray-400">Ready to create</span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="border-0 bg-white/80 hover:bg-white text-gray-600 rounded-xl px-6 py-3 text-sm font-medium shadow-sm hover:shadow transition-all"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !isValid}
                    className="bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl px-6 py-3 text-sm font-medium shadow-lg shadow-sky-200/50 min-w-[140px] transition-all hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Creating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <GraduationCap className="h-4 w-4" />
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