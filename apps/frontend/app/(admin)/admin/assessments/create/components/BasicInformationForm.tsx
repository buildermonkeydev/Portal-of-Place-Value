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
  Cloud
} from 'lucide-react';

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
        // Auto-adjust end date to be at least duration minutes after start
        const adjustedEnd = new Date(start.getTime() + durationMs);
        setValue('endDate', adjustedEnd.toISOString().slice(0, 16));
        trigger('endDate');
      } else if (timeGap < minGapMs) {
        // Auto-adjust end date to have at least 30 minutes gap
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

  // Get status color based on assessment type
  const getTypeColor = (type: string) => {
    switch(type) {
      case AssessmentType.MCQ:
        return 'from-sky-500 to-blue-500';
      case AssessmentType.CODING:
        return 'from-orange-500 to-amber-500';
      case AssessmentType.MIXED:
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-sky-500 to-blue-500';
    }
  };

  return (
    <Card className="border-sky-100 shadow-sm overflow-hidden">
      {/* Header with Gradient */}
      <CardHeader className="bg-gradient-to-r from-sky-50/50 to-orange-50/50 border-b border-sky-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-sky-500" />
            Basic Information
          </CardTitle>
        </div>
        <p className="text-sm text-gray-500 mt-1 ml-7">
          Enter the core details of your assessment
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Title and Type Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Assessment Title */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title" className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-sky-400" />
              Assessment Title <span className="text-sky-400">*</span>
            </Label>
            <div className="relative">
              <Input
                id="title"
                placeholder="e.g., JavaScript Fundamentals Test"
                {...register('title')}
                className={`pl-4 pr-4 py-2.5 border ${
                  errors.title 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-sky-200 focus:border-sky-400'
                } rounded-xl bg-white/80 backdrop-blur-sm text-sm transition-colors`}
              />
            </div>
            {errors.title && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Assessment Type */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full bg-gradient-to-r ${getTypeColor(assessmentType)}`}></span>
              Type <span className="text-sky-400">*</span>
            </Label>
            <Select
              value={watch('type')}
              onValueChange={(value) => setValue('type', value as AssessmentType)}
            >
              <SelectTrigger className="w-full border-sky-200 focus:border-sky-400 rounded-xl py-2.5 h-auto">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AssessmentType.MCQ}>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-500"></span>
                    MCQ Only
                  </div>
                </SelectItem>
                <SelectItem value={AssessmentType.CODING}>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                    Coding Only
                  </div>
                </SelectItem>
                <SelectItem value={AssessmentType.MIXED}>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                    Mixed (MCQ + Coding)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.type.message}
              </p>
            )}
          </div>
        </div>

        {/* Duration Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-sky-400" />
              Duration <span className="text-sky-400">*</span>
            </Label>
            <div className="relative">
              <Input
                id="duration"
                type="number"
                min="1"
                max="480"
                placeholder="120"
                {...register('duration', { valueAsNumber: true })}
                className={`pl-4 pr-4 py-2.5 border ${
                  errors.duration 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-sky-200 focus:border-sky-400'
                } rounded-xl bg-white/80 backdrop-blur-sm text-sm`}
              />
            </div>
            {errors.duration && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.duration.message}
              </p>
            )}
            {duration > 0 && (
              <div className="mt-2 p-3 bg-gradient-to-r from-sky-50 to-orange-50 rounded-xl border border-sky-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Duration breakdown</span>
                  <Clock className="h-3.5 w-3.5 text-sky-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-semibold text-gray-900">{duration}</span>
                  <span className="text-sm text-gray-500">minutes</span>
                  {hours > 0 && (
                    <span className="text-sm text-gray-400 ml-2">
                      ({hours}h {minutes > 0 ? `${minutes}m` : ''})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pass Percentage */}
          <div className="space-y-2">
            <Label htmlFor="passPercentage" className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Percent className="h-3.5 w-3.5 text-orange-400" />
              Pass Percentage
            </Label>
            <div className="relative">
              <Input
                id="passPercentage"
                type="number"
                min="0"
                max="100"
                placeholder="60"
                {...register('passPercentage', {
                  valueAsNumber: true,
                  setValueAs: (value) => (value === '' ? undefined : Number(value)),
                })}
                className={`pl-4 pr-4 py-2.5 border ${
                  errors.passPercentage 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-sky-200 focus:border-sky-400'
                } rounded-xl bg-white/80 backdrop-blur-sm text-sm`}
              />
            </div>
            {errors.passPercentage && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.passPercentage.message}
              </p>
            )}
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <span className="h-1 w-1 rounded-full bg-sky-300"></span>
              Default: 60%
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-sky-400" />
            Description <span className="text-gray-400 text-xs">(Optional)</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Enter a detailed description of the assessment..."
            {...register('description')}
            rows={3}
            className="border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 backdrop-blur-sm text-sm resize-none"
          />
        </div>

        {/* Google Form URL */}
        <div className="space-y-2">
          <Label htmlFor="googleForm" className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Link className="h-3.5 w-3.5 text-sky-400" />
            Google Form URL <span className="text-sky-400">*</span>
          </Label>
          <div className="relative">
            <Input
              id="googleForm"
              type="url"
              placeholder="https://forms.gle/..."
              {...register('googleForm')}
              className={`pl-4 pr-4 py-2.5 border ${
                errors.googleForm 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-sky-200 focus:border-sky-400'
              } rounded-xl bg-white/80 backdrop-blur-sm text-sm`}
              required
            />
          </div>
          {errors.googleForm && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.googleForm.message}
            </p>
          )}
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
            <span className="h-1 w-1 rounded-full bg-sky-300"></span>
            Students will be redirected here after completing the assessment
          </p>
        </div>

        {/* Results Visibility Switch */}
        <div className="flex items-start justify-between rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50/30 to-orange-50/30 p-5">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-100 to-orange-100 flex items-center justify-center">
              {showResultsToUsers ? (
                <Eye className="h-4 w-4 text-sky-600" />
              ) : (
                <EyeOff className="h-4 w-4 text-orange-600" />
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Show results to participants
              </Label>
              <p className="text-xs text-gray-500 mt-1 max-w-md">
                When disabled, participants will not see scores or detailed feedback after submission.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium ${showResultsToUsers ? 'text-sky-600' : 'text-orange-600'}`}>
              {showResultsToUsers ? 'Visible' : 'Hidden'}
            </span>
            <Switch
              checked={!!showResultsToUsers}
              onCheckedChange={(checked) =>
                setValue('showResultsToUsers', checked, { shouldDirty: true })
              }
              className="data-[state=checked]:bg-sky-500"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-sky-400" />
              Start Date <span className="text-gray-400 text-xs">(Optional)</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-400 pointer-events-none" />
              <Input
                id="startDate"
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
                className={`pl-10 pr-4 py-2.5 border ${
                  errors.startDate 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-sky-200 focus:border-sky-400'
                } rounded-xl bg-white/80 backdrop-blur-sm text-sm`}
              />
            </div>
            {errors.startDate && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.startDate.message}
              </p>
            )}
            {startDate && (
              <div className="mt-2 p-2 bg-sky-50 rounded-lg border border-sky-100">
                <p className="text-xs text-sky-700">
                  Starts: {new Date(startDate).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-orange-400" />
              End Date <span className="text-gray-400 text-xs">(Optional)</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400 pointer-events-none" />
              <Input
                id="endDate"
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
                className={`pl-10 pr-4 py-2.5 border ${
                  errors.endDate 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-sky-200 focus:border-sky-400'
                } rounded-xl bg-white/80 backdrop-blur-sm text-sm`}
                onChange={handleEndDateChange}
              />
            </div>
            {errors.endDate && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.endDate.message}
              </p>
            )}
            {endDate && startDate && (
              <div className="mt-2 p-2 bg-orange-50 rounded-lg border border-orange-100">
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
                      <p className="text-xs text-orange-700">
                        Ends: {new Date(endDate).toLocaleString()}
                      </p>
                      <p className="text-xs font-medium text-orange-600">
                        Time window: {gapHours > 0 ? `${gapHours}h ` : ''}
                        {gapMinutes}m
                        {duration > 0 && (
                          <span className="text-gray-500 ml-1">
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
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-amber-800 mb-2">Date Validation Requirements</p>
              <ul className="space-y-1 text-xs text-amber-700">
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
      </CardContent>
    </Card>
  );
}