'use client';

import { UseFormReturn, UseFormWatch } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { AssessmentFormData, User } from '../types';

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <p className="text-2xl font-bold text-blue-600">{totalQuestions}</p>
            <p className="text-sm text-gray-600">Total Questions</p>
            <div className="text-xs text-gray-500 space-y-1">
              <div>MCQ: {questionFields.length + existingQuestions.length}</div>
              <div>Coding: {codingQuestions.length}</div>
            </div>
          </div>
          <div className="space-y-2">
            <p
              className={`text-2xl font-bold ${
                totalMarksError ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {totalMarks}
            </p>
            <p className="text-sm text-gray-600">Total Marks</p>
            {totalMarksError && (
              <p className="text-xs text-red-500 mt-1">Max: 100 marks</p>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-purple-600">
              {assignedUsersCount}
            </p>
            <p className="text-sm text-gray-600">Assigned Users</p>
          </div>
        </div>
        {totalMarksError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{totalMarksError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardContent>
        <div className="mt-2 flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Participant result visibility
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {showResultsToUsers
                ? 'Learners will be able to view their scores immediately after completing the assessment.'
                : 'Learners will not be able to see their scores or detailed feedback after completing the assessment.'}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              showResultsToUsers
                ? 'bg-green-100 text-green-700'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {showResultsToUsers ? 'Visible to users' : 'Hidden from users'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
