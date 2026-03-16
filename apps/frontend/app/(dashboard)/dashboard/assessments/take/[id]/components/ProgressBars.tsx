'use client';

import { AssessmentResult } from '@/lib/types/assessmentResult';
import { Answer } from '@/lib/types';

interface ProgressBarsProps {
  currentQuestionIndex: number;
  assessmentResult: AssessmentResult;
  responses: Answer[];
}

export function ProgressBars({
  currentQuestionIndex,
  assessmentResult,
  responses,
}: ProgressBarsProps) {
  // Count MCQ questions
  const mcqQuestions = assessmentResult.responses?.length || 0;
  const answeredMcqQuestions = responses.filter(
    (response) =>
      response.selectedOptions && response.selectedOptions.length > 0
  ).length;

  // Count coding questions
  const codingQuestions = assessmentResult.codingQuestions?.length || 0;
  const answeredCodingQuestions = assessmentResult.codingQuestions?.filter(
    (cq) => cq.sourceCode && cq.sourceCode.trim() !== ''
  ).length || 0;

  // Total counts
  const totalQuestions = mcqQuestions + codingQuestions;
  const answeredQuestions = answeredMcqQuestions + answeredCodingQuestions;

  // Calculate percentage safely (avoid NaN)
  const percentage = totalQuestions > 0 
    ? Math.round((answeredQuestions / totalQuestions) * 100) 
    : 0;

  return (
    <div className="space-y-2">
      {/* Question Progress Bar */}
      {/* <div className="flex justify-between text-sm text-gray-600">
        <span>
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </span>
        <span>
          {Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%
          Complete
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{
            width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
          }}
        />
      </div> */}

      <div className="flex justify-between text-sm text-gray-600">
        <span>
          Answered: {answeredQuestions} of {totalQuestions} questions
        </span>
        <span>
          {percentage}% Answered
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-600 h-2 rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      {/* Score Progress Bar */}
      {/* <div className="flex justify-between text-sm text-gray-600">
        <span>
          Score: {assessmentResult.totalMarksObtained} of{' '}
          {assessmentResult.totalMarksPossible} marks
        </span>
        <span>
          {Math.round(
            (assessmentResult.totalMarksObtained /
              assessmentResult.totalMarksPossible) *
              100
          )}
          % Score
        </span>
      </div> */}
      {/* <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
          style={{
            width: `${
              (assessmentResult.totalMarksObtained /
                assessmentResult.totalMarksPossible) *
              100
            }%`,
          }}
        />
      </div> */}
    </div>
  );
}
