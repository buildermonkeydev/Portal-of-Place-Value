'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle,
  Loader2,
  XCircle,
  StopCircle,
  Code,
  Play,
  Save,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Test } from '@/lib/types/test';
import { Language } from '@/lib/types/codeExecution';
import { useCodeExecution } from '@/lib/hooks/useCodeExecution';
import { toast } from 'sonner';

interface CodingQuestionDisplayProps {
  test: Test;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentResponse: any;
  lastSavedTime: Date | null;
  isSaving: boolean;
  timeLeft: number; // in seconds
  onAnswerChange: (questionId: string, codeSubmission: any) => void;
  onNextQuestion: () => void;
  onPreviousQuestion: () => void;
  onSaveAllResponses: () => Promise<void>;
  onClearAllAnswers: () => void;
  onShowReviewModal: () => void;
  onSubmitAssessment: () => Promise<void>;
  submitAssessmentMutation: any;
}

export function CodingQuestionDisplay({
  test,
  currentQuestionIndex,
  totalQuestions,
  currentResponse,
  lastSavedTime,
  isSaving,
  timeLeft,
  onAnswerChange,
  onNextQuestion,
  onPreviousQuestion,
  onSaveAllResponses,
  onClearAllAnswers,
  onShowReviewModal,
  onSubmitAssessment,
  submitAssessmentMutation,
}: CodingQuestionDisplayProps) {
  const [sourceCode, setSourceCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(
    null
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastExecutionResult, setLastExecutionResult] = useState<any>(null);

  const {
    state,
    languages,
    isLoadingLanguages,
    loadLanguages,
    selectLanguage,
    updateSourceCode,
    executeCode,
  } = useCodeExecution();

  // Initialize languages and set default
  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  // Set default language when languages load
  useEffect(() => {
    if (languages.length > 0 && !selectedLanguage) {
      const defaultLang =
        languages.find((lang) => lang.id === 71) || languages[0]; // Default to Python
      setSelectedLanguage(defaultLang);
      selectLanguage(defaultLang);
    }
  }, [languages, selectedLanguage, selectLanguage]);

  // Load existing response
  useEffect(() => {
    if (currentResponse?.sourceCode) {
      setSourceCode(currentResponse.sourceCode);
    } else if (test.starterCode && selectedLanguage) {
      const starterCode = test.starterCode[selectedLanguage.id.toString()];
      if (starterCode) {
        setSourceCode(starterCode);
      }
    }
  }, [currentResponse, test.starterCode, selectedLanguage]);

  // Auto-save when source code changes
  useEffect(() => {
    if (sourceCode && selectedLanguage) {
      const codeSubmission = {
        sourceCode,
        languageId: selectedLanguage.id,
        executionResult: lastExecutionResult,
        submittedAt: new Date().toISOString(),
      };

      // Debounced save
      const timeoutId = setTimeout(() => {
        onAnswerChange(test._id, codeSubmission);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [
    sourceCode,
    selectedLanguage,
    lastExecutionResult,
    test._id,
    onAnswerChange,
  ]);

  const handleLanguageChange = (languageId: string) => {
    const language = languages.find(
      (lang) => lang.id.toString() === languageId
    );
    if (language) {
      setSelectedLanguage(language);
      selectLanguage(language);

      // Load starter code for the selected language
      const starterCode = test.starterCode?.[languageId];
      if (starterCode) {
        setSourceCode(starterCode);
      }
    }
  };

  const handleExecuteCode = async () => {
    if (!selectedLanguage || !sourceCode.trim()) {
      toast.error('Please select a language and write some code');
      return;
    }

    setIsExecuting(true);
    try {
      updateSourceCode(sourceCode);
      await executeCode();
      setLastExecutionResult(state.executionResult);

      if (state.executionResult) {
        if (state.executionResult.status.id === 3) {
          toast.success('Code executed successfully!');
        } else {
          toast.error(
            `Execution failed: ${state.executionResult.status.description}`
          );
        }
      }
    } catch (error) {
      toast.error('Failed to execute code');
      console.error('Execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div>
              <CardTitle className="text-lg">
                Coding Question {currentQuestionIndex + 1}
              </CardTitle>
              <div className="text-sm text-blue-600 font-medium mt-1">
                {test.title}
              </div>
            </div>
            {currentResponse && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>In Progress</span>
                {lastSavedTime && (
                  <span>• Saved {lastSavedTime.toLocaleTimeString()}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Time remaining */}
            <div className="flex items-center space-x-1 text-sm text-orange-600">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* Save indicator */}
            {isSaving && (
              <div className="flex items-center space-x-1 text-sm text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Saving...</span>
              </div>
            )}

            <Badge variant="outline">
              <Code className="h-3 w-3 mr-1" />
              Coding Question
            </Badge>
            <Badge variant="outline">
              {test.testCases?.length || 0} test cases
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Problem Statement */}
        <div className="space-y-4">
          <div className="text-lg text-gray-900 break-words overflow-hidden">
            {test.problemStatement || 'No problem statement available'}
          </div>

          {/* Constraints */}
          {test.constraints && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-semibold text-yellow-800">
                  Constraints
                </span>
              </div>
              <div className="text-sm text-yellow-700 whitespace-pre-wrap">
                {test.constraints}
              </div>
            </div>
          )}
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
          <Label>Programming Language</Label>
          <Select
            value={selectedLanguage?.id.toString() || ''}
            onValueChange={handleLanguageChange}
            disabled={isLoadingLanguages}
          >
            <SelectTrigger className="w-64">
              <SelectValue
                placeholder={
                  isLoadingLanguages ? 'Loading...' : 'Select language'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {languages.map((language) => (
                <SelectItem key={language.id} value={language.id.toString()}>
                  <div className="flex items-center space-x-2">
                    <Code className="w-4 h-4" />
                    <span>{language.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Code Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Your Solution</Label>
            <Button
              onClick={handleExecuteCode}
              disabled={!selectedLanguage || !sourceCode.trim() || isExecuting}
              size="sm"
              className="flex items-center space-x-2"
            >
              {isExecuting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>{isExecuting ? 'Running...' : 'Run Code'}</span>
            </Button>
          </div>

          <Textarea
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            placeholder="Write your code here..."
            className="min-h-[400px] font-mono text-sm"
            spellCheck={false}
          />
        </div>

        {/* Execution Results */}
        {state.executionResult && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span className="font-semibold">Execution Results</span>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2">
              {state.executionResult.status.id === 3 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span
                className={`text-sm font-medium ${
                  state.executionResult.status.id === 3
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {state.executionResult.status.description}
              </span>
              {state.executionResult.execution_time && (
                <span className="text-sm text-gray-500">
                  ({state.executionResult.execution_time}ms)
                </span>
              )}
            </div>

            {/* Output */}
            {state.executionResult.stdout && (
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                <div className="text-gray-400 text-xs mb-2">Output:</div>
                <pre className="whitespace-pre-wrap">
                  {state.executionResult.stdout}
                </pre>
              </div>
            )}

            {/* Error Output */}
            {state.executionResult.stderr && (
              <div className="bg-red-900 text-red-300 p-4 rounded-lg font-mono text-sm">
                <div className="text-red-400 text-xs mb-2">Error:</div>
                <pre className="whitespace-pre-wrap">
                  {state.executionResult.stderr}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
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
              disabled={!sourceCode.trim()}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              Save Progress
            </Button>

            {/* Clear Answer Button */}
            <Button
              variant="outline"
              onClick={() => {
                setSourceCode('');
                onAnswerChange(test._id, null);
              }}
              disabled={!sourceCode.trim()}
              className="flex items-center space-x-2 text-red-600 border-red-300 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4" />
              Clear Answer
            </Button>

            {/* Review Answers Button */}
            <Button
              variant="outline"
              onClick={onShowReviewModal}
              className="flex items-center space-x-2 text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <CheckCircle className="h-4 w-4" />
              Review Answers
            </Button>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <Button onClick={onNextQuestion}>Next Question</Button>
            ) : (
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

        {/* Time Warning */}
        {timeLeft < 300 &&
          timeLeft > 0 && ( // Less than 5 minutes
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-red-800 text-sm font-medium">
                  Time Warning: {formatTime(timeLeft)} remaining
                </span>
              </div>
              <p className="text-red-700 text-sm mt-1">
                Please save your work and submit before time runs out.
              </p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
