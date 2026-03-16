'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CodingQuestionResult } from '@/lib/types';

interface MobileQuestionNavProps {
  questions: any[];
  currentQuestionIndex: number;
  responses: any[];
  onQuestionSelect: (index: number) => void;
  codingQuestions?: CodingQuestionResult[];
  currentQuestionType?: 'mcq' | 'coding';
  currentCodingQuestionIndex?: number;
  onQuestionTypeSelect?: (type: 'mcq' | 'coding', index?: number) => void;
}

export function MobileQuestionNav({
  questions,
  currentQuestionIndex,
  responses,
  onQuestionSelect,
  codingQuestions,
  currentQuestionType = 'mcq',
  currentCodingQuestionIndex = 0,
  onQuestionTypeSelect,
}: MobileQuestionNavProps) {
  // Only return null if there are NO questions at all (neither MCQ nor coding)
  const hasNoMCQQuestions = !questions || questions.length === 0;
  const hasNoCodingQuestions = !codingQuestions || codingQuestions.length === 0;
  
  if (hasNoMCQQuestions && hasNoCodingQuestions) return null;

  // Get question status
  const getQuestionStatus = (questionId: string) => {
    const questionResponseData = responses.find(
      (r) => r.questionId._id === questionId
    );

    if (
      questionResponseData?.selectedOptions &&
      questionResponseData.selectedOptions.length > 0
    ) {
      return 'answered';
    }

    return 'unanswered';
  };

  // Get question status icon
  const getQuestionStatusIcon = (questionId: string) => {
    const status = getQuestionStatus(questionId);

    if (status === 'answered') {
      return <CheckCircle className="h-3 w-3 text-green-600" />;
    }

    return <Circle className="h-3 w-3 text-gray-400" />;
  };

  return (
    <div className="xl:hidden">
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Questions</h3>
          <span className="text-xs text-gray-500">
            {currentQuestionType === 'mcq'
              ? `${currentQuestionIndex + 1} of ${questions.length}`
              : `C${currentCodingQuestionIndex + 1} of ${
                  codingQuestions?.length || 0
                }`}
          </span>
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {/* MCQ Questions */}
          {questions.map((questionResponse, index) => {
            const question = questionResponse.questionId;

            if (!question?._id) {
              return (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 w-8 flex-shrink-0 bg-gray-100"
                >
                  {index + 1}
                </Button>
              );
            }

            const isCurrentQuestion =
              index === currentQuestionIndex && currentQuestionType === 'mcq';
            const status = getQuestionStatus(question._id);
            const isAnswered = status === 'answered';

            return (
              <Button
                key={index}
                variant={isCurrentQuestion ? 'default' : 'outline'}
                size="sm"
                onClick={() => onQuestionSelect(index)}
                className={cn(
                  'h-8 w-8 flex-shrink-0 relative transition-all duration-200',
                  isCurrentQuestion && 'ring-2 ring-blue-500 ring-offset-1',
                  isAnswered &&
                    !isCurrentQuestion &&
                    'border-green-500 bg-green-50 hover:bg-green-100',
                  !isAnswered && !isCurrentQuestion && 'hover:border-gray-400'
                )}
              >
                <span className="text-xs font-medium">{index + 1}</span>

                {/* Status indicator */}
                <div className="absolute -top-1 -right-1">
                  {getQuestionStatusIcon(question._id)}
                </div>
              </Button>
            );
          })}

          {/* Coding Questions */}
          {codingQuestions && codingQuestions.length > 0 && (
            <>
              {codingQuestions.map((codingQuestion, index) => {
                const isCurrentQuestion =
                  index === currentCodingQuestionIndex &&
                  currentQuestionType === 'coding';
                const isAnswered = codingQuestion.isCorrect;

                return (
                  <Button
                    key={`coding-${index}`}
                    variant={isCurrentQuestion ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onQuestionTypeSelect?.('coding', index)}
                    className={cn(
                      'h-8 w-8 flex-shrink-0 relative transition-all duration-200',
                      isCurrentQuestion &&
                        'ring-2 ring-green-500 ring-offset-1',
                      isAnswered &&
                        !isCurrentQuestion &&
                        'border-green-500 bg-green-50 hover:bg-green-100',
                      !isAnswered &&
                        !isCurrentQuestion &&
                        'hover:border-gray-400'
                    )}
                  >
                    <span className="text-xs font-medium">C{index + 1}</span>

                    {/* Status indicator */}
                    <div className="absolute -top-1 -right-1">
                      {isAnswered ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <Circle className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  </Button>
                );
              })}
            </>
          )}
        </div>

        {/* Progress indicator */}
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>
              {(() => {
                const totalQuestions =
                  questions.length + (codingQuestions?.length || 0);
                if (totalQuestions === 0) return 0;
                const answeredMCQ = responses.filter(
                  (r) => r.selectedOptions && r.selectedOptions.length > 0
                ).length;
                const answeredCoding =
                  codingQuestions?.filter((cq) => cq.sourceCode && cq.sourceCode.trim() !== '').length || 0;
                const totalAnswered = answeredMCQ + answeredCoding;
                return Math.round((totalAnswered / totalQuestions) * 100);
              })()}
              %
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${(() => {
                  const totalQuestions =
                    questions.length + (codingQuestions?.length || 0);
                  if (totalQuestions === 0) return 0;
                  const answeredMCQ = responses.filter(
                    (r) => r.selectedOptions && r.selectedOptions.length > 0
                  ).length;
                  const answeredCoding =
                    codingQuestions?.filter((cq) => cq.sourceCode && cq.sourceCode.trim() !== '').length || 0;
                  const totalAnswered = answeredMCQ + answeredCoding;
                  return (totalAnswered / totalQuestions) * 100;
                })()}%`,
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
