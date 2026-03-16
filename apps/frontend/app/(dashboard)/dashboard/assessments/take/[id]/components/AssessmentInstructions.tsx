'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, AlertCircle, Loader2 } from 'lucide-react';

interface AssessmentInstructionsProps {
  assessment: any;
  isContinuing: boolean;
  currentAssessmentState: any;
  startAssessmentMutation: any;
  myAssessmentResult: any;
  onStartAssessment: () => Promise<void>;
}

export function AssessmentInstructions({
  assessment,
  isContinuing,
  currentAssessmentState,
  startAssessmentMutation,
  myAssessmentResult,
  onStartAssessment,
}: AssessmentInstructionsProps) {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Session Info Card - Show when continuing */}
      {isContinuing && currentAssessmentState && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Play className="h-5 w-5" />
              <span>Active Assessment Session</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {currentAssessmentState.timeRemaining > 0
                    ? Math.floor(currentAssessmentState.timeRemaining / 60)
                    : 0}
                </div>
                <div className="text-sm text-green-700">Minutes Left</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {currentAssessmentState.responses?.filter(
                    (r: any) =>
                      r.selectedOptions && r.selectedOptions.length > 0
                  ).length || 0}
                </div>
                <div className="text-sm text-green-700">Questions Answered</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(
                    ((currentAssessmentState.responses?.filter(
                      (r: any) =>
                        r.selectedOptions && r.selectedOptions.length > 0
                    ).length || 0) /
                      (assessment.responses?.length || 1)) *
                      100
                  )}
                </div>
                <div className="text-sm text-green-700">Progress %</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {currentAssessmentState.status === 'in_progress'
                    ? '🟢'
                    : '🟡'}
                </div>
                <div className="text-sm text-green-700">Status</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Assessment Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Duration:</strong> {assessment.duration} minutes
            </div>
            <div>
              <strong>Total Marks:</strong> {assessment.totalMarks}
            </div>
            <div>
              <strong>Questions:</strong> {assessment.responses?.length || 0}
            </div>
          </div>

          {isContinuing && currentAssessmentState && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800 font-medium">
                  Continue Your Assessment Session
                </span>
              </div>
              <div className="mt-3 space-y-2">
                <p className="text-blue-700 text-sm">
                  You have an ongoing assessment session that you can continue.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Time Remaining:</strong>{' '}
                    {currentAssessmentState.timeRemaining > 0
                      ? formatTime(currentAssessmentState.timeRemaining)
                      : 'Expired'}
                  </div>
                  <div>
                    <strong>Questions Answered:</strong>{' '}
                    {currentAssessmentState.responses?.filter(
                      (r: any) =>
                        r.selectedOptions && r.selectedOptions.length > 0
                    ).length || 0}{' '}
                    of {assessment.responses?.length || 0}
                  </div>
                  <div>
                    <strong>Status:</strong>{' '}
                    <span className="capitalize">
                      {currentAssessmentState.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <strong>Last Activity:</strong>{' '}
                    {currentAssessmentState.lastActivity
                      ? new Date(
                          currentAssessmentState.lastActivity
                        ).toLocaleString()
                      : 'Unknown'}
                  </div>
                </div>
                <div className="mt-3 p-3 bg-blue-100 rounded border border-blue-300">
                  <p className="text-blue-800 text-sm font-medium">
                    💡 Tip: Click "Continue Assessment" to resume from where you
                    left off. All your previous answers will be loaded
                    automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800 font-medium">
                Important Notes
              </span>
            </div>
            <ul className="text-yellow-700 text-sm mt-2 space-y-1">
              <li>• Do not close this browser tab during the assessment</li>
              <li>
                • Your answers are automatically saved every time you make a
                change
              </li>
              <li>
                • You can also manually save your progress using the "Save
                Progress" button
              </li>
              <li>
                • You can continue the assessment if you accidentally close the
                page
              </li>
              <li>
                • The timer will continue running even if you leave the page
              </li>
              {isContinuing &&
                currentAssessmentState?.timeRemaining &&
                currentAssessmentState.timeRemaining < 300 && (
                  <li className="text-red-600 font-medium">
                    ⚠️ Your session is running low on time! Only{' '}
                    {Math.floor(currentAssessmentState.timeRemaining / 60)}{' '}
                    minutes remaining.
                  </li>
                )}
            </ul>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              onClick={onStartAssessment}
              disabled={
                startAssessmentMutation.isPending ||
                (myAssessmentResult as any)?.status === 'completed'
              }
              size="lg"
              className={`flex items-center space-x-2 ${
                isContinuing
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {startAssessmentMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isContinuing ? (
                <Play className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
              {startAssessmentMutation.isPending
                ? 'Starting...'
                : (myAssessmentResult as any)?.status === 'completed'
                ? 'Already Completed'
                : (myAssessmentResult as any)?.status === 'failed'
                ? 'Retake Assessment'
                : isContinuing
                ? 'Continue Assessment'
                : 'Start Assessment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
