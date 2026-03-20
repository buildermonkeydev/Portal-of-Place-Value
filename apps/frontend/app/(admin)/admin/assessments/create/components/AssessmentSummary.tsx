'use client';

import { UseFormReturn, UseFormWatch } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, 
  FileQuestion, 
  Code2, 
  Users, 
  Eye, 
  EyeOff,
  CheckCircle2,
  XCircle,
  BarChart3,
  Target
} from 'lucide-react';
import { AssessmentFormData, User } from '../types';
import { cn } from '@/lib/utils';

interface AssessmentSummaryProps {
  form: UseFormReturn<AssessmentFormData>;
  totalMarks: number;
  totalMarksError: string | null;
}

export function AssessmentSummary({
  form,
  totalMarks,
  totalMarksError,
}: AssessmentSummaryProps) {
  const { watch } = form;
  const questionFields = watch('questionsToCreate') || [];
  const existingQuestions = watch('existingQuestions') || [];
  const codingQuestions = watch('codingQuestions') || [];
  const assignAllUsers = watch('assignAllUsers');
  const assignedUsers = watch('assignedUsers') || [];
  const showResultsToUsers = watch('showResultsToUsers') ?? false;

  const totalQuestions =
    questionFields.length + existingQuestions.length + codingQuestions.length;
  const assignedUsersCount = assignAllUsers
    ? 'All Users'
    : assignedUsers.length;

  const mcqCount = questionFields.length + existingQuestions.length;
  const codingCount = codingQuestions.length;
  const hasCodingQuestions = codingCount > 0;
  const hasMcqQuestions = mcqCount > 0;

  // Determine if total marks are valid
  const isTotalMarksValid = !totalMarksError && totalMarks > 0;
  const isTotalMarksExceeded = totalMarksError?.includes('exceeds');
  const isTotalMarksBelow = totalMarksError?.includes('less than');

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Assessment Summary</h2>
        </div>
        <p className="text-xs text-zinc-500 mt-1 ml-6">
          Review your assessment configuration and statistics
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Questions */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <FileQuestion className="h-3.5 w-3.5 text-indigo-400" />
                </div>
                <span className="text-xs text-zinc-500">Total Questions</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{totalQuestions}</p>
            <div className="flex items-center gap-3 mt-2 text-xs">
              {hasMcqQuestions && (
                <span className="text-zinc-500">
                  MCQ: {mcqCount}
                </span>
              )}
              {hasCodingQuestions && (
                <span className="text-zinc-500">
                  Coding: {codingCount}
                </span>
              )}
              {totalQuestions === 0 && (
                <span className="text-zinc-600">No questions added</span>
              )}
            </div>
          </div>

          {/* Total Marks */}
          <div className={cn(
            "bg-white/5 rounded-xl p-4 border",
            isTotalMarksValid && "border-emerald-500/30",
            totalMarksError && "border-red-500/30"
          )}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-6 w-6 rounded-lg flex items-center justify-center",
                  isTotalMarksValid && "bg-emerald-500/10",
                  totalMarksError && "bg-red-500/10"
                )}>
                  <Target className={cn(
                    "h-3.5 w-3.5",
                    isTotalMarksValid && "text-emerald-400",
                    totalMarksError && "text-red-400"
                  )} />
                </div>
                <span className="text-xs text-zinc-500">Total Marks</span>
              </div>
              {isTotalMarksValid && (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              )}
              {totalMarksError && (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
            </div>
            <p className={cn(
              "text-2xl font-bold",
              isTotalMarksValid && "text-emerald-400",
              totalMarksError && "text-red-400",
              !totalMarksError && totalMarks > 0 && "text-white"
            )}>
              {totalMarks}
            </p>
            {totalMarksError && (
              <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Max: 100 marks
              </p>
            )}
            {!totalMarksError && totalMarks > 0 && totalMarks < 100 && (
              <p className="text-xs text-emerald-400 mt-2">
                {100 - totalMarks} marks remaining
              </p>
            )}
            {!totalMarksError && totalMarks === 100 && (
              <p className="text-xs text-emerald-400 mt-2">
                Perfect! Maximum marks reached
              </p>
            )}
          </div>

          {/* Assigned Users */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 text-orange-400" />
                </div>
                <span className="text-xs text-zinc-500">Assigned Users</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-white">
              {assignedUsersCount}
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              {assignAllUsers 
                ? 'All registered users will have access'
                : `${assignedUsers.length} user(s) selected`}
            </p>
          </div>
        </div>

        {/* Result Visibility Card */}
        <div className={cn(
          "rounded-xl p-4 border",
          showResultsToUsers 
            ? "bg-emerald-500/5 border-emerald-500/20" 
            : "bg-orange-500/5 border-orange-500/20"
        )}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                showResultsToUsers ? "bg-emerald-500/10" : "bg-orange-500/10"
              )}>
                {showResultsToUsers ? (
                  <Eye className="h-4 w-4 text-emerald-400" />
                ) : (
                  <EyeOff className="h-4 w-4 text-orange-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Participant result visibility
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {showResultsToUsers
                    ? 'Learners will be able to view their scores immediately after completing the assessment.'
                    : 'Learners will not be able to see their scores or detailed feedback after completing the assessment.'}
                </p>
              </div>
            </div>
            <span className={cn(
              "rounded-lg px-3 py-1 text-xs font-medium whitespace-nowrap",
              showResultsToUsers 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
            )}>
              {showResultsToUsers ? 'Visible to users' : 'Hidden from users'}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {totalMarksError && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-sm text-red-400">
              {totalMarksError}
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Summary */}
        <div className="pt-2 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-1.5 w-1.5 rounded-full",
                totalQuestions > 0 ? "bg-emerald-400" : "bg-red-400"
              )}></div>
              <span className="text-zinc-500">
                Questions: {totalQuestions > 0 ? '✓ Added' : 'Missing'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-1.5 w-1.5 rounded-full",
                isTotalMarksValid ? "bg-emerald-400" : "bg-red-400"
              )}></div>
              <span className="text-zinc-500">
                Marks: {isTotalMarksValid ? '✓ Valid' : 'Invalid'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-1.5 w-1.5 rounded-full",
                assignedUsersCount !== 0 ? "bg-emerald-400" : "bg-red-400"
              )}></div>
              <span className="text-zinc-500">
                Users: {assignedUsersCount !== 0 ? '✓ Assigned' : 'Not assigned'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}