'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  Loader2,
  XCircle,
  StopCircle,
  Code,
  Copy,
  Check,
} from 'lucide-react';
import { Answer, AssessmentResult, CodingQuestionResult } from '@/lib/types';
import { CodingTestInterfaceAssessment } from './CodingTestInterfaceAssesment';

// Enhanced utility function to process text and detect code blocks
const processQuestionText = (text: string) => {
  if (!text) return '';

  // Split by \n and create array of lines
  const lines = text.split('\\n');

  // Function to detect if a line looks like code
  const isCodeLine = (line: string) => {
    const codeIndicators = [
      // C/C++ keywords
      '#include',
      'int main',
      'void',
      'char',
      'printf',
      'scanf',
      'return',
      'if (',
      'while (',
      'for (',
      'switch (',
      'case',
      'default',
      'struct',
      'typedef',
      'enum',
      'union',
      'const',
      'static',
      'malloc',
      'free',
      'sizeof',
      '&',
      '*',
      '->',
      '.',
      '//',
      '/*',
      '*/',
      '&&',
      '||',
      '==',
      '!=',
      '<=',
      '>=',
      '+=',
      '-=',
      '*=',
      '/=',
      '%=',
      '++',
      '--',
      // Java keywords
      'public',
      'private',
      'protected',
      'class',
      'interface',
      'extends',
      'implements',
      'new',
      'this',
      'super',
      'final',
      'abstract',
      'synchronized',
      // Python keywords
      'def ',
      'class ',
      'import ',
      'from ',
      'if __name__',
      'print(',
      'range(',
      'len(',
      'append(',
      'pop(',
      'insert(',
      'remove(',
      // General programming patterns
      'function ',
      'var ',
      'let ',
      'const ',
      '=>',
      'async ',
      'await ',
      'try {',
      'catch (',
      'finally {',
      'throw ',
      'new Error(',
      // Data structures
      'Stack',
      'Queue',
      'LinkedList',
      'ArrayList',
      'HashMap',
      'HashSet',
      'push(',
      'pop(',
      'enqueue(',
      'dequeue(',
      'add(',
      'remove(',
    ];

    const trimmedLine = line.trim();

    // Check for code indicators
    const hasCodeIndicators = codeIndicators.some((indicator) =>
      trimmedLine.includes(indicator)
    );

    // Check for code-like patterns
    const hasCodePatterns = /[{}();=<>+\-*/&|!\[\]]/.test(trimmedLine);

    // Check for variable assignments or function calls
    const hasAssignments = /[a-zA-Z_][a-zA-Z0-9_]*\s*[=+\-*/%]/.test(
      trimmedLine
    );

    // Check for function definitions
    const hasFunctionDef = /[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*\{?/.test(
      trimmedLine
    );

    return (
      hasCodeIndicators || hasCodePatterns || hasAssignments || hasFunctionDef
    );
  };

  // Function to detect if a block of lines is code
  const detectCodeBlock = (lines: string[], startIndex: number) => {
    let codeLines = 0;
    let totalLines = 0;

    // Check next few lines to see if they're code
    for (let i = startIndex; i < Math.min(startIndex + 5, lines.length); i++) {
      if (lines[i].trim()) {
        totalLines++;
        if (isCodeLine(lines[i])) {
          codeLines++;
        }
      }
    }

    // If more than 60% of lines look like code, consider it a code block
    return totalLines > 0 && codeLines / totalLines > 0.6;
  };

  const processedLines: React.ReactElement[] = [];
  const processedIndices = new Set<number>();

  for (let index = 0; index < lines.length; index++) {
    // Skip if this line was already processed as part of a code block
    if (processedIndices.has(index)) {
      continue;
    }

    const line = lines[index];
    const trimmedLine = line.trim();

    // Check if this line starts a code block
    const startsCodeBlock = detectCodeBlock(lines, index);

    if (startsCodeBlock) {
      // Find the end of the code block (next empty line or non-code line)
      let codeBlockEnd = index;
      for (let i = index; i < lines.length; i++) {
        if (!lines[i].trim() || !isCodeLine(lines[i])) {
          codeBlockEnd = i;
          break;
        }
        codeBlockEnd = i + 1;
      }

      // Create the code block
      const codeBlock = (
        <div key={`code-${index}`} className="mb-3">
          <div className="flex items-center space-x-2 mb-3">
            <Code className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Code Block
            </span>
            <div className="flex-1 h-px bg-gray-300"></div>
            <button
              onClick={() => {
                const codeText = lines.slice(index, codeBlockEnd).join('\n');
                navigator.clipboard.writeText(codeText);
                // You could add a toast notification here
              }}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-150"
              title="Copy code"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 p-5 rounded-xl font-mono text-sm overflow-x-auto border border-gray-700 shadow-lg">
            <div className="space-y-1">
              {lines.slice(index, codeBlockEnd).map((codeLine, codeIndex) => (
                <div
                  key={`code-line-${index}-${codeIndex}`}
                  className="whitespace-pre-wrap break-words text-gray-200 leading-relaxed hover:bg-gray-700 hover:text-white px-2 py-1 rounded transition-colors duration-150"
                >
                  {codeLine || ' '}
                </div>
              ))}
            </div>
          </div>
        </div>
      );

      // Mark these lines as processed
      for (let i = index; i < codeBlockEnd; i++) {
        processedIndices.add(i);
      }

      processedLines.push(codeBlock);
    } else {
      // Regular text line
      processedLines.push(
        <span key={index} className="block">
          {line}
          {index < lines.length - 1 && <br />}
        </span>
      );
    }
  }

  return processedLines;
};

interface QuestionDisplayProps {
  currentQuestion: Answer; // Updated to use Answer type
  currentQuestionIndex: number;
  totalQuestions: number;
  currentResponse: any;
  lastSavedTime: Date | null;
  isSaving: boolean;
  isUpdatingUI: boolean;
  submitAssessmentMutation: any;
  onAnswerChange: (questionId: string, selectedOptions: string[]) => void;
  onNextQuestion: () => void;
  onPreviousQuestion: () => void;
  onSaveAllResponses: () => Promise<void>;
  onClearAllAnswers: () => void;
  onShowReviewModal: () => void;
  onSubmitAssessment: () => Promise<void>;
  onNavigateToCoding?: () => void; // Navigate to coding questions
  onCodeSubmitted?: () => void; // Refresh data after code submission
  responses: any[];
  codingQuestions: CodingQuestionResult[];
  currentQuestionType: 'mcq' | 'coding';
  currentCodingQuestionIndex: number;
  assessmentId: string;
  assessmentTitle?: string;
  googleFormUrl?: string;
}

export function QuestionDisplay({
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  currentResponse,
  lastSavedTime,
  isSaving,
  isUpdatingUI,
  submitAssessmentMutation,
  onAnswerChange,
  onNextQuestion,
  onPreviousQuestion,
  onSaveAllResponses,
  onClearAllAnswers,
  onShowReviewModal,
  onSubmitAssessment,
  onNavigateToCoding,
  onCodeSubmitted,
  responses,
  codingQuestions,
  currentQuestionType,
  currentCodingQuestionIndex,
  assessmentId,
  assessmentTitle,
  googleFormUrl,
}: QuestionDisplayProps) {
  // Handle coding questions
  if (currentQuestionType === 'coding') {
    const currentCodingQuestion = codingQuestions?.[currentCodingQuestionIndex];
    if (currentCodingQuestion) {
      return (
        <div className="w-full">
          <CodingTestInterfaceAssessment
            testId={currentCodingQuestion.testId}
            assessmentId={assessmentId}
            assessmentTitle={assessmentTitle}
            googleFormUrl={googleFormUrl}
            onSubmitAssessment={onSubmitAssessment}
            submitAssessmentMutation={submitAssessmentMutation}
            onCodeSubmitted={onCodeSubmitted}
          />
        </div>
      );
    }
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No coding question available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) return null;

  // Extract the actual question data from the nested structure
  const question = currentQuestion.questionId;

  if (!question) return null;

  // Use currentResponse if available, otherwise fall back to currentQuestion
  const activeResponse = currentResponse || currentQuestion;

  const answeredQuestions = responses?.filter(
    (r) => r.selectedOptions && r.selectedOptions.length > 0
  ).length;

  return (
    <Card className=" w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div>
              <CardTitle className="text-lg">
                Question {currentQuestionIndex + 1}
              </CardTitle>
              {question.section && (
                <div className="text-sm text-blue-600 font-medium mt-1">
                  {question.section}
                </div>
              )}
            </div>
            {currentQuestion && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Answered</span>
                {lastSavedTime && (
                  <span>• Saved {lastSavedTime.toLocaleTimeString()}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Save indicator for current question */}
            {isSaving && (
              <div className="flex items-center space-x-1 text-sm text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
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
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="text-lg text-gray-900 break-words overflow-hidden">
            {processQuestionText(question.text) ||
              'Question text not available'}
          </div>

          {question.type === 'single_choice' ? (
            <div className="space-y-3">
              {question.options?.map((option: any, index: number) => (
                <div
                  key={index}
                  onClick={() => {
                    // Make entire row clickable for single choice
                    onAnswerChange(question._id, [option.text]);
                  }}
                  className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-150 cursor-pointer select-none transform ${
                    activeResponse?.selectedOptions?.includes(option.text)
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 active:bg-gray-100 active:scale-95'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question._id}`}
                    value={option.text}
                    checked={activeResponse?.selectedOptions?.includes(
                      option.text
                    )}
                    onChange={(e) => {
                      // Prevent double triggering when clicking the radio button
                      e.stopPropagation();
                      if (e.target.checked) {
                        onAnswerChange(question._id, [option.text]);
                      }
                    }}
                    className="cursor-pointer transition-all duration-150 hover:scale-110"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Label
                    className={`text-base cursor-pointer select-none transition-colors duration-150 ${
                      activeResponse?.selectedOptions?.includes(option.text)
                        ? 'text-blue-700 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {option.text}
                  </Label>
                </div>
              )) || (
                <div className="text-red-500 text-sm">
                  No options available for this question
                </div>
              )}
            </div>
          ) : question.type === 'multiple_choice' ? (
            <div className="space-y-3">
              {question.options?.map((option: any, index: number) => (
                <div
                  key={index}
                  onClick={() => {
                    // Make entire row clickable for multiple choice
                    const currentOptions =
                      activeResponse?.selectedOptions || [];
                    const isCurrentlySelected = currentOptions.includes(
                      option.text
                    );

                    if (isCurrentlySelected) {
                      // Remove if already selected
                      const newOptions = currentOptions.filter(
                        (opt) => opt !== option.text
                      );
                      onAnswerChange(question._id, newOptions);
                    } else {
                      // Add if not selected
                      const newOptions = [...currentOptions, option.text];
                      onAnswerChange(question._id, newOptions);
                    }
                  }}
                  className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-150 cursor-pointer select-none transform ${
                    activeResponse?.selectedOptions?.includes(option.text)
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 active:bg-gray-100 active:scale-95'
                  }`}
                >
                  <Checkbox
                    checked={
                      activeResponse?.selectedOptions?.includes(option.text) ||
                      false
                    }
                    onCheckedChange={(checked) => {
                      // Prevent double triggering when clicking the checkbox
                      const currentOptions =
                        activeResponse.selectedOptions || [];
                      let newOptions: string[];

                      if (checked) {
                        newOptions = [...currentOptions, option.text];
                      } else {
                        newOptions = currentOptions.filter(
                          (opt) => opt !== option.text
                        );
                      }

                      onAnswerChange(question._id, newOptions);
                    }}
                    className="cursor-pointer transition-all duration-150 hover:scale-110"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Label
                    className={`text-base cursor-pointer select-none transition-colors duration-150 ${
                      activeResponse?.selectedOptions?.includes(option.text)
                        ? 'text-blue-700 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {option.text}
                  </Label>
                </div>
              )) || (
                <div className="text-red-500 text-sm">
                  No options available for this question
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-500 text-sm">
              Unknown question type: {question.type}
            </div>
          )}

          {/* Answer Status */}
          {activeResponse && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800 font-medium">
                  Answer Status
                </span>
                <div className="flex items-center space-x-2">
                  {isUpdatingUI && (
                    <div className="flex items-center space-x-1 text-xs text-green-600">
                      <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                      <span>Updating...</span>
                    </div>
                  )}
                  {isSaving && !isUpdatingUI && (
                    <div className="flex items-center space-x-1 text-xs text-blue-600">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Saving...</span>
                    </div>
                  )}
                  {lastSavedTime && (
                    <span className="text-xs text-blue-600">
                      Last saved: {lastSavedTime.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                {activeResponse.selectedOptions.length > 0
                  ? `Selected ${activeResponse.selectedOptions.length} option${
                      activeResponse.selectedOptions.length > 1 ? 's' : ''
                    }`
                  : 'No option selected'}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={onPreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <div className="flex space-x-2">
            {/* Manual Save Button */}
            <Button
              variant="outline"
              onClick={onSaveAllResponses}
              disabled={responses.length === 0}
              className="flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              Save Progress
            </Button>

            {/* Clear Answers Button */}
            <Button
              variant="outline"
              onClick={onClearAllAnswers}
              disabled={responses.length === 0}
              className="flex items-center space-x-2 text-red-600 border-red-300 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4" />
              Clear All
            </Button>

            {/* Review Answers Button */}
            <Button
              variant="outline"
              onClick={onShowReviewModal}
              disabled={responses.length === 0}
              className="flex items-center space-x-2 text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <CheckCircle className="h-4 w-4" />
              Review Answers
            </Button>

            {/* Show Next if more MCQ questions exist */}
            {currentQuestionIndex < totalQuestions - 1 ? (
              <Button onClick={onNextQuestion}>Next Question</Button>
            ) : codingQuestions && codingQuestions.length > 0 && onNavigateToCoding ? (
              /* Show Next (Coding) if on last MCQ and coding questions exist */
              <Button onClick={onNavigateToCoding} className="bg-purple-600 hover:bg-purple-700">
                Next (Coding)
              </Button>
            ) : (
              /* Show Submit Assessment if no more questions */
              <Button
                onClick={onSubmitAssessment}
                disabled={submitAssessmentMutation.isPending}
                className="flex items-center space-x-2"
              >
                {submitAssessmentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <StopCircle className="h-4 w-4" />
                )}
                {submitAssessmentMutation.isPending
                  ? 'Submitting...'
                  : 'Submit Assessment'}
              </Button>
            )}
          </div>
        </div>

        {/* Warning for unanswered questions */}
        {answeredQuestions < totalQuestions && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-800 text-sm font-medium">
                Warning: You have {totalQuestions - answeredQuestions}{' '}
                unanswered questions
              </span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              You can still submit, but unanswered questions will be marked as
              incorrect.
            </p>
          </div>
        )}

        {/* Completion indicator */}
        {answeredQuestions === totalQuestions && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-800 text-sm font-medium">
                All questions answered! Ready to submit.
              </span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              You have answered all questions. You can now submit your
              assessment.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
