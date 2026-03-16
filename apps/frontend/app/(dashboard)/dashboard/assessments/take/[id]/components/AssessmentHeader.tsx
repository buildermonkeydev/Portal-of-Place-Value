'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Clock, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Answer } from '@/lib/types';

interface AssessmentHeaderProps {
  assessment: any;
  isStarted: boolean;
  isContinuing: boolean;
  responses: Answer[];
  onPauseAssessment: () => Promise<void>;
  assessmentId: string;
}

export function AssessmentHeader({
  assessment,
  isStarted,
  isContinuing,
  responses,
  onPauseAssessment,
  assessmentId,
}: AssessmentHeaderProps) {
  const router = useRouter();

  const handleBack = async () => {
    if (isStarted) {
      await onPauseAssessment();
    }

    // Clear localStorage
    localStorage.removeItem(`assessment_responses_${assessmentId}`);
    router.push('/dashboard/assessments');
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${
      remainingMinutes !== 1 ? 's' : ''
    }`;
  };

  const formatStartTime = (startTime: string): string => {
    const date = new Date(startTime);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
            {assessment.assessmentId?.title || assessment.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 line-clamp-2">
            {assessment.assessmentId?.description ||
              assessment.description ||
              'Complete the assessment below'}
          </p>
        </div>

        {/* Assessment Info - Compact */}
        {isStarted && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 flex-shrink-0">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
              <span className="whitespace-nowrap">
                Duration:{' '}
                {formatDuration(
                  assessment.assessmentId?.duration || assessment.duration || 0
                )}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
              <span className="whitespace-nowrap">
                Started: {formatStartTime(assessment.startTime)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Instructions - Below title if present */}
      {assessment.assessmentId?.instruction || assessment.instruction ? (
        <div className="mt-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs sm:text-sm font-medium text-blue-800 mb-1">
            Instructions:
          </p>
          <p className="text-xs sm:text-sm text-blue-700">
            {assessment.assessmentId?.instruction || assessment.instruction}
          </p>
        </div>
      ) : null}
    </div>
  );
}
