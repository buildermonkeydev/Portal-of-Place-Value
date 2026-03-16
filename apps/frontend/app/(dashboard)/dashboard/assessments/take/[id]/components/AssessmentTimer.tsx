'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface AssessmentTimerProps {
  timeLeft: number;
  isStarted: boolean;
  isSaving: boolean;
  lastSavedTime: Date | null;
  failedSaves: Set<string>;
  onRetryFailedSaves: () => Promise<void>;
  // onRefreshAnswers: () => Promise<void>;
}

export function AssessmentTimer({
  timeLeft,
  isStarted,
  isSaving,
  lastSavedTime,
  failedSaves,
  onRetryFailedSaves,
}: // onRefreshAnswers,
AssessmentTimerProps) {
  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '00:00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const getTimerVariant = (
    timeLeft: number
  ): 'default' | 'destructive' | 'secondary' => {
    if (timeLeft <= 300) return 'destructive'; // 5 minutes or less
    if (timeLeft <= 600) return 'secondary'; // 10 minutes or less
    return 'default';
  };

  const getTimerClassName = (timeLeft: number): string => {
    let baseClass = 'text-lg font-mono';

    if (timeLeft <= 300) {
      baseClass += ' animate-pulse';
    } else if (timeLeft <= 600) {
      baseClass += ' animate-bounce';
    }

    return baseClass;
  };

  if (!isStarted) return null;

  return (
    <div className="flex justify-between items-center space-x-4">
      {/* Save Status */}
      <div className="flex items-center space-x-2">
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        ) : lastSavedTime ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : null}
        <span className="text-sm text-gray-600">
          {isSaving
            ? 'Saving...'
            : lastSavedTime
            ? `Saved ${lastSavedTime.toLocaleTimeString()}`
            : 'Not saved yet'}
        </span>

        {failedSaves.size > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetryFailedSaves}
            className="ml-2 text-red-600 border-red-300 hover:bg-red-50"
          >
            <AlertCircle className="h-3 w-4 mr-1" />
            Retry {failedSaves.size} failed save
            {failedSaves.size > 1 ? 's' : ''}
          </Button>
        )}
        {/* 
        <Button
          variant="outline"
          size="sm"
          // onClick={onRefreshAnswers}
          className="ml-2 text-blue-600 border-blue-300 hover:bg-blue-50"
          // disabled={!currentAssessmentState}
        >
          <Loader2 className="h-3 w-3 mr-1" />
          Refresh Answers
        </Button> */}
      </div>

      <div className="flex items-center space-x-2">
        <Clock
          className={`h-5 w-5 ${
            timeLeft <= 300
              ? 'text-red-500'
              : timeLeft <= 600
              ? 'text-yellow-500'
              : 'text-blue-500'
          }`}
        />
        <Badge
          variant={getTimerVariant(timeLeft)}
          className={getTimerClassName(timeLeft)}
        >
          {formatTime(timeLeft)}
        </Badge>
        {timeLeft <= 300 && (
          <span className="text-xs text-red-600 font-medium">
            Time running out!
          </span>
        )}
      </div>
    </div>
  );
}
