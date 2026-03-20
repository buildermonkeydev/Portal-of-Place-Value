'use client';

import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AssessmentFormData, User } from '../types';
import { AssessmentType } from '@/lib/types/assessment';
import { useEffect } from 'react';
import { toLocalISOString } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Link, 
  Percent, 
  Eye, 
  EyeOff,
  AlertCircle,
  Sun,
  Cloud,
  Sparkles,
  Info,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BasicInformationFormProps {
  form: UseFormReturn<AssessmentFormData>;
}

export function BasicInformationForm({ form }: BasicInformationFormProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = form;

  const duration = watch('duration') || 0;
  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const showResultsToUsers = watch('showResultsToUsers') ?? false;
  const assessmentType = watch('type');

  // Get current date in local ISO string format for min attribute
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    return toLocalISOString(now);
  };

  // Convert duration to hours and minutes for display
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  // Auto-update end date when start date or duration changes
  useEffect(() => {
    if (startDate && duration > 0) {
      const start = new Date(startDate);
      const newEndDate = new Date(start.getTime() + duration * 60 * 1000);
      const realEndDate = toLocalISOString(newEndDate);
      setValue('endDate', realEndDate);
    }
  }, [startDate, duration, setValue, trigger]);

  // Validate end date when it changes
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    if (newEndDate && startDate) {
      const start = new Date(startDate);
      const end = new Date(newEndDate);
      const timeGap = end.getTime() - start.getTime();
      const durationMs = duration * 60 * 1000;
      const minGapMs = 30 * 60 * 1000;

      if (timeGap < durationMs) {
        const adjustedEnd = new Date(start.getTime() + durationMs);
        setValue('endDate', adjustedEnd.toISOString().slice(0, 16));
        trigger('endDate');
      } else if (timeGap < minGapMs) {
        const adjustedEnd = new Date(start.getTime() + minGapMs);
        setValue('endDate', adjustedEnd.toISOString().slice(0, 16));
        trigger('endDate');
      }
    }
  };

  // Validate that date is not in the past
  const validateFutureDate = (dateString: string) => {
    const selectedDate = new Date(dateString);
    const now = new Date();
    return selectedDate >= now;
  };

  // Get type color and icon
  const getTypeStyle = (type: string) => {
    switch(type) {
      case AssessmentType.MCQ:
        return { color: 'indigo', bg: 'bg-indigo-500/10', text: 'text-indigo-400', icon: '📝' };
      case AssessmentType.CODING:
        return { color: 'orange', bg: 'bg-orange-500/10', text: 'text-orange-400', icon: '💻' };
      case AssessmentType.MIXED:
        return { color: 'purple', bg: 'bg-purple-500/10', text: 'text-purple-400', icon: '🎯' };
      default:
        return { color: 'indigo', bg: 'bg-indigo-500/10', text: 'text-indigo-400', icon: '📋' };
    }
  };

  const typeStyle = getTypeStyle(assessmentType);

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Basic Information</h2>
        </div>
        <p className="text-xs text-zinc-500 mt-1 ml-6">
          Enter the core details of your assessment
        </p>
      </div>

      <div className="p-5 space-y-6">
        {/* Title and Type Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Assessment Title */}
          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              Assessment Title <span className="text-indigo-400">*</span>
            </Label>
            <div className="relative">
              <Input
                placeholder="e.g., JavaScript Fundamentals Test"
                {...register('title')}
                className={cn(
                  "pl-4 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-xl",
                  errors.title && "border-red-500/50 focus:border-red-500"
                )}
              />
            </div>
            {errors.title && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Assessment Type */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full", typeStyle.bg)}></div>
              Type <span className="text-indigo-400">*</span>
            </Label>
            <Select
              value={watch('type')}
              onValueChange={(value) => setValue('type', value as AssessmentType)}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A2A] border-white/10 text-white">
                <SelectItem value={AssessmentType.MCQ}>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
                    MCQ Only
                  </div>
                </SelectItem>
                <SelectItem value={AssessmentType.CODING}>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-400"></span>
                    Coding Only
                  </div>
                </SelectItem>
                <SelectItem value={AssessmentType.MIXED}>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-400"></span>
                    Mixed (MCQ + Coding)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.type.message}
              </p>
            )}
          </div>
        </div>

        {/* Duration and Pass Percentage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              Duration <span className="text-indigo-400">*</span>
            </Label>
            <div className="relative">
              <Input
                type="number"
                min="1"
                max="480"
                placeholder="120"
                {...register('duration', { valueAsNumber: true })}
                className={cn(
                  "bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-xl",
                  errors.duration && "border-red-500/50 focus:border-red-500"
                )}
              />
            </div>
            {errors.duration && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.duration.message}
              </p>
            )}
            {duration > 0 && (
              <div className="mt-2 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-500">Duration breakdown</span>
                  <Clock className="h-3 w-3 text-indigo-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-white">{duration}</span>
                  <span className="text-sm text-zinc-500">minutes</span>
                  {hours > 0 && (
                    <span className="text-sm text-zinc-600 ml-2">
                      ({hours}h {minutes > 0 ? `${minutes}m` : ''})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pass Percentage */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Percent className="h-3.5 w-3.5 text-orange-400" />
              Pass Percentage
            </Label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="60"
                {...register('passPercentage', {
                  valueAsNumber: true,
                  setValueAs: (value) => (value === '' ? undefined : Number(value)),
                })}
                className={cn(
                  "bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-xl",
                  errors.passPercentage && "border-red-500/50 focus:border-red-500"
                )}
              />
            </div>
            {errors.passPercentage && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.passPercentage.message}
              </p>
            )}
            <p className="text-xs text-zinc-600 flex items-center gap-1 mt-1">
              <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
              Default: 60%
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-zinc-400 flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-indigo-400" />
            Description <span className="text-zinc-600">(Optional)</span>
          </Label>
          <Textarea
            placeholder="Enter a detailed description of the assessment..."
            {...register('description')}
            rows={3}
            className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-xl resize-none"
          />
        </div>

        {/* Google Form URL */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-zinc-400 flex items-center gap-2">
            <Link className="h-3.5 w-3.5 text-indigo-400" />
            Google Form URL <span className="text-indigo-400">*</span>
          </Label>
          <div className="relative">
            <Input
              type="url"
              placeholder="https://forms.gle/..."
              {...register('googleForm')}
              className={cn(
                "bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-xl",
                errors.googleForm && "border-red-500/50 focus:border-red-500"
              )}
              required
            />
          </div>
          {errors.googleForm && (
            <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              {errors.googleForm.message}
            </p>
          )}
          <p className="text-xs text-zinc-600 flex items-center gap-1 mt-1">
            <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
            Students will be redirected here after completing the assessment
          </p>
        </div>

        {/* Results Visibility Switch */}
        <div className="flex items-start justify-between rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="flex gap-3">
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center",
              showResultsToUsers ? "bg-indigo-500/10" : "bg-orange-500/10"
            )}>
              {showResultsToUsers ? (
                <Eye className="h-4 w-4 text-indigo-400" />
              ) : (
                <EyeOff className="h-4 w-4 text-orange-400" />
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-white">
                Show results to participants
              </Label>
              <p className="text-xs text-zinc-500 mt-1 max-w-md">
                When disabled, participants will not see scores or detailed feedback after submission.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn(
              "text-xs font-medium",
              showResultsToUsers ? "text-indigo-400" : "text-orange-400"
            )}>
              {showResultsToUsers ? 'Visible' : 'Hidden'}
            </span>
            <Switch
              checked={!!showResultsToUsers}
              onCheckedChange={(checked) =>
                setValue('showResultsToUsers', checked, { shouldDirty: true })
              }
              className="data-[state=checked]:bg-indigo-500"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              Start Date <span className="text-zinc-600">(Optional)</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              <Input
                type="datetime-local"
                min={getCurrentDateTimeLocal()}
                {...register('startDate', {
                  validate: (value) => {
                    if (!value) return true;
                    return (
                      validateFutureDate(value) ||
                      'Start date must be today or in the future'
                    );
                  },
                })}
                className={cn(
                  "pl-10 bg-white/5 border-white/10 text-white rounded-xl",
                  errors.startDate && "border-red-500/50 focus:border-red-500"
                )}
              />
            </div>
            {errors.startDate && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.startDate.message}
              </p>
            )}
            {startDate && (
              <div className="mt-2 p-2 bg-indigo-500/5 rounded-lg border border-indigo-500/20">
                <p className="text-xs text-indigo-400">
                  Starts: {new Date(startDate).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-orange-400" />
              End Date <span className="text-zinc-600">(Optional)</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              <Input
                type="datetime-local"
                min={startDate || getCurrentDateTimeLocal()}
                {...register('endDate', {
                  validate: (value) => {
                    if (!value) return true;
                    return (
                      validateFutureDate(value) ||
                      'End date must be today or in the future'
                    );
                  },
                })}
                className={cn(
                  "pl-10 bg-white/5 border-white/10 text-white rounded-xl",
                  errors.endDate && "border-red-500/50 focus:border-red-500"
                )}
                onChange={handleEndDateChange}
              />
            </div>
            {errors.endDate && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.endDate.message}
              </p>
            )}
            {endDate && startDate && (
              <div className="mt-2 p-2 bg-orange-500/5 rounded-lg border border-orange-500/20">
                {(() => {
                  const start = new Date(startDate);
                  const end = new Date(endDate);
                  const timeGap = end.getTime() - start.getTime();
                  const gapHours = Math.floor(timeGap / (60 * 60 * 1000));
                  const gapMinutes = Math.floor(
                    (timeGap % (60 * 60 * 1000)) / (60 * 1000)
                  );

                  return (
                    <div className="space-y-1">
                      <p className="text-xs text-orange-400">
                        Ends: {new Date(endDate).toLocaleString()}
                      </p>
                      <p className="text-xs font-medium text-orange-400">
                        Time window: {gapHours > 0 ? `${gapHours}h ` : ''}
                        {gapMinutes}m
                        {duration > 0 && (
                          <span className="text-zinc-500 ml-1">
                            (Duration: {duration}m)
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Validation Info */}
        <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Info className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-amber-400 mb-2">Date Validation Requirements</p>
              <ul className="space-y-1 text-xs text-zinc-500">
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-amber-400"></span>
                  Start and end dates must be today or in the future
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-amber-400"></span>
                  End date must be at least {duration || 'duration'} minutes after start
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-amber-400"></span>
                  Minimum gap between dates: 30 minutes
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}