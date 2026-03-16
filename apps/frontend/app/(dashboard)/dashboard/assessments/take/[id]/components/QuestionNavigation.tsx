'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AssessmentResult } from '@/lib/types';

interface QuestionNavigationProps {
  questions: AssessmentResult['responses'];
  currentQuestionIndex: number;
  responses: any[];
  onQuestionSelect: (index: number) => void;
}

export function QuestionNavigation({
  questions,
  currentQuestionIndex,
  responses,
  onQuestionSelect,
}: QuestionNavigationProps) {
  if (!questions || questions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Question Navigation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          {questions.map((questionResponse, index) => {
            // Extract the question data from the nested structure
            const question = questionResponse.questionId;

            // Add safety check for question._id
            if (!question?._id) {
              return (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-10"
                >
                  {index + 1}
                </Button>
              );
            }

            const questionResponseData = responses.find(
              (r) => r.questionId._id === question._id
            );
            const hasAnswer =
              questionResponseData &&
              questionResponseData.selectedOptions &&
              questionResponseData.selectedOptions.length > 0;

            return (
              <Button
                key={index}
                variant={index === currentQuestionIndex ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  onQuestionSelect(index);
                }}
                className={`h-10 relative ${
                  hasAnswer ? 'border-green-500 bg-green-50' : ''
                }`}
              >
                {index + 1}
                {hasAnswer && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
