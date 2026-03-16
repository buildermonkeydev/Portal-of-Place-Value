'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AssessmentResult, CodingQuestionResult } from '@/lib/types';
import { CheckCircle, Circle, Clock, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionSidebarProps {
  questions: AssessmentResult['responses'];
  currentQuestionIndex: number;
  responses: any[];
  onQuestionSelect: (index: number) => void;
  codingQuestions: CodingQuestionResult[];
  currentQuestionType: 'mcq' | 'coding';
  currentCodingQuestionIndex: number;
  onQuestionTypeSelect: (type: 'mcq' | 'coding', index?: number) => void;
  totalMarksPossible?: number;
}

export function QuestionSidebar({
  questions,
  currentQuestionIndex,
  responses,
  onQuestionSelect,
  codingQuestions,
  currentQuestionType,
  currentCodingQuestionIndex,
  onQuestionTypeSelect,
  totalMarksPossible = 0,
}: QuestionSidebarProps) {
  // Only return null if there are NO questions at all (neither MCQ nor coding)
  const hasNoMCQQuestions = !questions || questions.length === 0;
  const hasNoCodingQuestions = !codingQuestions || codingQuestions.length === 0;
  
  if (hasNoMCQQuestions && hasNoCodingQuestions) return null;

  // Group questions by section while maintaining original order
  // This ensures questions appear in the same sequence as they do in the assessment
  // Previously questions were appearing randomly because the order wasn't preserved
  const questionsBySection = questions.reduce(
    (acc, questionResponse, index) => {
      const question = questionResponse.questionId;
      const section = question?.section || 'Uncategorized';

      if (!acc[section]) {
        acc[section] = [];
      }

      // Add the question with its original index to maintain order
      acc[section].push({
        questionResponse,
        originalIndex: index, // Keep track of original position
        question,
      });

      return acc;
    },
    {} as Record<
      string,
      Array<{ questionResponse: any; originalIndex: number; question: any }>
    >
  );

  // Sort sections to ensure consistent order (Technical MCQ first, then Aptitude MCQ, then others)
  const sortedSections = Object.keys(questionsBySection).sort((a, b) => {
    if (a === 'Technical MCQ') return -1;
    if (b === 'Technical MCQ') return 1;
    if (a === 'Aptitude MCQ') return -1;
    if (b === 'Aptitude MCQ') return 1;
    return a.localeCompare(b);
  });

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
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }

    return <Circle className="h-4 w-4 text-gray-400" />;
  };

  // Calculate statistics
  const totalQuestions = questions.length;
  const answeredQuestions = responses.filter(
    (r) => r.selectedOptions && r.selectedOptions.length > 0
  ).length;
  const unansweredQuestions = totalQuestions - answeredQuestions;

  // Coding questions statistics
  const totalCodingQuestions = codingQuestions?.length || 0;
  const answeredCodingQuestions =
    codingQuestions?.filter((cq) => cq.sourceCode && cq.sourceCode.trim() !== '').length || 0;

  const totalAllQuestions = totalQuestions + totalCodingQuestions;
  const totalAnsweredQuestions = answeredQuestions + answeredCodingQuestions;

  const progressPercentage =
    totalAllQuestions > 0
      ? Math.round((totalAnsweredQuestions / totalAllQuestions) * 100)
      : 0;

  return (
    <Card className="h-full shadow-lg border-gray-200 max-w-full">
      <CardHeader className="pb-3 pt-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg text-gray-800">
            Question Navigator
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto px-3 sm:px-4">
          {sortedSections.map((section) => {
            const sectionQuestions = questionsBySection[section];

            return (
              <div key={section} className="space-y-3">
                <div className="bg-white pb-2 -mx-4 px-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    {section}
                  </h3>
                  <div className="text-xs text-gray-500 mt-1">
                    {sectionQuestions.length} question
                    {sectionQuestions.length !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {sectionQuestions.map(
                    ({ questionResponse, originalIndex, question }) => {
                      if (!question?._id) {
                        return (
                          <Button
                            key={originalIndex}
                            variant="outline"
                            size="sm"
                            disabled
                            className="h-10 relative bg-gray-100"
                          >
                            {originalIndex + 1}
                          </Button>
                        );
                      }

                      const isCurrentQuestion =
                        originalIndex === currentQuestionIndex &&
                        currentQuestionType === 'mcq';
                      const status = getQuestionStatus(question._id);
                      const isAnswered = status === 'answered';

                      return (
                        <Button
                          key={originalIndex}
                          variant={isCurrentQuestion ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => onQuestionSelect(originalIndex)}
                          className={cn(
                            'h-10 relative transition-all duration-200 group',
                            isCurrentQuestion &&
                              'ring-2 ring-blue-500 ring-offset-2 shadow-lg',
                            isAnswered &&
                              !isCurrentQuestion &&
                              'border-green-500 bg-green-50 hover:bg-green-100 hover:border-green-600',
                            !isAnswered &&
                              !isCurrentQuestion &&
                              'hover:border-gray-400 hover:bg-gray-50'
                          )}
                        >
                          <span
                            className={cn(
                              'text-sm font-medium',
                              isCurrentQuestion && 'text-white',
                              isAnswered &&
                                !isCurrentQuestion &&
                                'text-green-700'
                            )}
                          >
                            {originalIndex + 1}
                          </span>

                          {/* Status indicator */}
                          <div className="absolute -top-1 -right-1">
                            {getQuestionStatusIcon(question._id)}
                          </div>

                          {/* Current question indicator */}
                          {isCurrentQuestion && (
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                              <div className="w-2 h-2 bg-blue-600 rounded-full shadow-sm"></div>
                            </div>
                          )}

                          {/* Hover tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            {question.text.substring(0, 50)}...
                          </div>
                        </Button>
                      );
                    }
                  )}
                </div>
              </div>
            );
          })}

          {/* Coding Questions Section */}
          {codingQuestions && codingQuestions.length > 0 && (
            <div className="space-y-3">
              <div className="bg-white pb-2 -mx-4 px-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Coding Questions
                </h3>
                <div className="text-xs text-gray-500 mt-1">
                  {codingQuestions.length} question
                  {codingQuestions.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {codingQuestions.map((codingQuestion, index) => {
                  const isCurrentQuestion =
                    currentQuestionType === 'coding' &&
                    index === currentCodingQuestionIndex;
                  const isAnswered =
                    codingQuestion.sourceCode !== null &&
                    codingQuestion.sourceCode !== undefined &&
                    codingQuestion.sourceCode !== '';

                  return (
                    <Button
                      key={codingQuestion._id}
                      variant={isCurrentQuestion ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onQuestionTypeSelect('coding', index)}
                      className={cn(
                        'h-10 relative transition-all duration-200 group',
                        isCurrentQuestion &&
                          'ring-2 ring-green-500 ring-offset-2 shadow-lg',
                        isAnswered &&
                          !isCurrentQuestion &&
                          'border-green-500 bg-green-50 hover:bg-green-100 hover:border-green-600',
                        !isAnswered &&
                          !isCurrentQuestion &&
                          'hover:border-gray-400 hover:bg-gray-50'
                      )}
                    >
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isCurrentQuestion && 'text-white',
                          isAnswered && !isCurrentQuestion && 'text-green-700'
                        )}
                      >
                        C{index + 1}
                      </span>

                      {/* Status indicator */}
                      <div className="absolute -top-1 -right-1">
                        {isAnswered ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                      </div>

                      {/* Current question indicator */}
                      {isCurrentQuestion && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                          <div className="w-2 h-2 bg-green-600 rounded-full shadow-sm"></div>
                        </div>
                      )}

                      {/* Hover tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Coding Question {index + 1}
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Summary at bottom */}
        <div className="border-t border-gray-200 p-4 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-gray-700 font-medium">
                  {totalAnsweredQuestions} answered
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Circle className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700 font-medium">
                  {totalAllQuestions - totalAnsweredQuestions} remaining
                </span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded border text-center">
                <div className="text-gray-500">MCQ</div>
                <div className="font-semibold text-gray-800">
                  {answeredQuestions}/{totalQuestions}
                </div>
              </div>
              <div className="bg-white p-2 rounded border text-center">
                <div className="text-gray-500">Coding</div>
                <div className="font-semibold text-gray-800">
                  {answeredCodingQuestions}/{totalCodingQuestions}
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid gap-2 text-xs">
              <div className="bg-white p-2 rounded border text-center">
                <div className="text-gray-500">Total Marks</div>
                <div className="font-semibold text-gray-800">
                  {totalMarksPossible}
                </div>
              </div>
              {/* <div className="bg-white p-2 rounded border text-center">
                <div className="text-gray-500">Avg. Time</div>
                <div className="font-semibold text-gray-800">
                  {Math.round(
                    questions.reduce((sum, q) => sum + (q.timeSpent || 0), 0) /
                      Math.max(answeredQuestions, 1)
                  )}
                  s
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
