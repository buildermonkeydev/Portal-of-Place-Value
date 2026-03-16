'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, StopCircle, Loader2 } from 'lucide-react';
import { AssessmentResult } from '@/lib/types';
import { processQuestionText } from '@/lib/utils/textProcessing';

interface ReviewModalProps {
  showReviewModal: boolean;
  assessment: AssessmentResult;
  responses: any[];
  submitAssessmentMutation: any;
  onCloseModal: () => void;
  onSubmitAssessment: () => Promise<void>;
}

export function ReviewModal({
  showReviewModal,
  assessment,
  responses,
  submitAssessmentMutation,
  onCloseModal,
  onSubmitAssessment,
}: ReviewModalProps) {
  if (!showReviewModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="sticky bg-white py-3  -top-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Review Your Answers</h2>
          <Button
            variant="ghost"
            onClick={onCloseModal}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4">
          {assessment.responses?.map((questionResponse: any, index: number) => {
            // Extract the actual question data from the nested structure
            const question = questionResponse.questionId;

            // Add safety check for question._id
            if (!question?._id) {
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Question {index + 1}</h3>
                    <Badge variant="destructive">Error Loading Question</Badge>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Question could not be loaded
                  </p>
                </div>
              );
            }

            const response = responses.find(
              (r) => r.questionId._id === question._id
            );

            // Debug logging
            // console.log('Question ID:', question._id);
            // console.log('Response found:', response);
            // console.log('All responses:', responses);

            const hasAnswer =
              response &&
              response.selectedOptions &&
              response.selectedOptions.length > 0;

            return (
              <div key={question._id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Question {index + 1}</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant={hasAnswer ? 'default' : 'destructive'}>
                      {hasAnswer ? 'Answered' : 'Not Answered'}
                    </Badge>
                    <Badge variant="outline">
                      {question.type === 'single_choice'
                        ? 'Single Choice'
                        : question.type === 'multiple_choice'
                        ? 'Multiple Choice'
                        : 'Unknown Type'}
                    </Badge>
                    <Badge variant="outline">{question.marks || 0} marks</Badge>
                  </div>
                </div>

                <div className="text-gray-700 mb-3 whitespace-pre-wrap">
                  {processQuestionText(question.text) ||
                    'Question text not available'}
                </div>

                {hasAnswer ? (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-sm font-medium text-green-800 mb-1">
                      Your Answer:
                    </p>
                    <div className="space-y-1">
                      {response.selectedOptions?.map(
                        (optionId: string, optIndex: number) => {
                          // Find the option text by matching the optionId
                          const option = question.options?.find(
                            (opt: any) => opt._id === optionId
                          );
                          return (
                            <div
                              key={optIndex}
                              className="flex items-center space-x-2"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-700">
                                {option?.text || optionId}
                              </span>
                            </div>
                          );
                        }
                      ) || (
                        <span className="text-sm text-gray-500">
                          No options selected
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm font-medium text-red-800 mb-1">
                      No Answer Selected
                    </p>
                    <p className="text-sm text-red-700">
                      You have not selected an answer for this question.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="text-sm text-gray-600">
            <p>Total Questions: {assessment.responses?.length || 0}</p>
            <p>
              Answered:{' '}
              {
                responses.filter(
                  (r) => r.selectedOptions && r.selectedOptions.length > 0
                ).length
              }
            </p>
            <p>
              Unanswered:{' '}
              {assessment.responses?.length -
                responses.filter(
                  (r) => r.selectedOptions && r.selectedOptions.length > 0
                ).length}
            </p>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onCloseModal}>
              Close
            </Button>
            <Button
              onClick={() => {
                onCloseModal();
                onSubmitAssessment();
              }}
              disabled={submitAssessmentMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitAssessmentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <StopCircle className="h-4 w-4 mr-2" />
              )}
              Submit Assessment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
