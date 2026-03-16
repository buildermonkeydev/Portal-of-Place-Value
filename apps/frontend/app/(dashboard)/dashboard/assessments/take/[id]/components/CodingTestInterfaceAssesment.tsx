'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play,
  Clock,
  HardDrive,
  Code,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  History,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Settings,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { testAPI } from '@/lib/api/tests';
import { codeExecutionApi } from '@/lib/api/codeExecution';
import { useCodeExecution } from '@/lib/hooks/useCodeExecution';
import {
  Test,
  TestDifficulty,
  TestSubmissionResult,
  TestResult,
} from '@/lib/types/test';
import { Language } from '@/lib/types/codeExecution';
import { toast } from 'sonner';
import { SimpleCodeEditor } from '@/components/SimpleCodeEditor';
import { assessmentResultAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/ui/Loading';

interface CodingTestInterfaceProps {
  testId: string;
  assessmentId: string;
  assessmentTitle?: string;
  googleFormUrl?: string;
  onSubmitAssessment?: () => Promise<void>;
  submitAssessmentMutation?: any;
  onCodeSubmitted?: () => void; // Callback to refresh data after code submission
}

export function CodingTestInterfaceAssessment({
  testId,
  assessmentId,
  assessmentTitle,
  googleFormUrl,
  onSubmitAssessment,
  submitAssessmentMutation,
  onCodeSubmitted,
}: CodingTestInterfaceProps) {
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<{
    totalTestCases: number;
    passedTestCases: number;
    score: number;
    executionTime: number;
    testResults: TestResult[];
  } | null>(null);
  const [runResult, setRunResult] = useState<{
    totalTestCases: number;
    passedTestCases: number;
    score: number;
    executionTime: number;
    testResults: TestResult[];
  } | null>(null);
  const [submissionHistory, setSubmissionHistory] = useState<
    TestSubmissionResult[]
  >([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedTestCases, setExpandedTestCases] = useState<Set<number>>(
    new Set()
  );
  const [lastSubmittedSolution, setLastSubmittedSolution] = useState<{
    sourceCode: string;
    languageId: number;
  } | null>(null);

  // LeetCode-style layout states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'problem'>('problem');

  const router = useRouter();

  const {
    state: codeState,
    languages,
    selectLanguage,
    updateSourceCode: originalUpdateSourceCode,
    executeCode,
    loadLanguages,
  } = useCodeExecution();

  const updateSourceCode = (code: string) => {
    // console.log('updateSourceCode called with:', code);
    originalUpdateSourceCode(code);
    // Save to local storage
    if (codeState.selectedLanguage) {
      saveCodeToLocalStorage(codeState.selectedLanguage.id, code);
    }
  };

  // Local storage functions
  const getStorageKey = (languageId: number) =>
    `test_${testId}_code_${languageId}`;
  const getSubmittedStorageKey = (languageId: number) =>
    `test_${testId}_submitted_${languageId}`;

  const saveCodeToLocalStorage = (languageId: number, code: string) => {
    try {
      localStorage.setItem(getStorageKey(languageId), code);
    } catch (error) {
      console.error('Failed to save code to localStorage:', error);
    }
  };

  const loadCodeFromLocalStorage = (languageId: number): string | null => {
    try {
      return localStorage.getItem(getStorageKey(languageId));
    } catch (error) {
      console.error('Failed to load code from localStorage:', error);
      return null;
    }
  };

  const saveSubmittedSolution = (sourceCode: string, languageId: number) => {
    try {
      const submittedData = { sourceCode, languageId };
      localStorage.setItem(
        getSubmittedStorageKey(languageId),
        JSON.stringify(submittedData)
      );
      setLastSubmittedSolution(submittedData);
    } catch (error) {
      console.error('Failed to save submitted solution:', error);
    }
  };

  const loadSubmittedSolution = () => {
    // This function is now deprecated - we load language-specific solutions instead
    return null;
  };

  const loadSubmittedSolutionForLanguage = (languageId: number) => {
    try {
      const saved = localStorage.getItem(getSubmittedStorageKey(languageId));
      if (saved) {
        const submittedData = JSON.parse(saved);
        return submittedData;
      }
    } catch (error) {
      console.error('Failed to load submitted solution for language:', error);
    }
    return null;
  };

  useEffect(() => {
    loadTest();
    loadLanguages();
    loadSubmissionHistory();
    loadSubmittedSolution();
  }, [testId]);

  // Initialize starter code when both test data and languages are loaded
  useEffect(() => {
    // console.log('CodingTestInterface useEffect triggered:', {
    //   hasTest: !!test,
    //   languagesLength: languages.length,
    //   allowedLanguages: test?.allowedLanguages,
    //   currentLanguage: codeState.selectedLanguage,
    //   starterCode: test?.starterCode,
    //   currentSourceCode: codeState.sourceCode,
    //   lastSubmittedSolution,
    // });

    if (test && languages.length > 0 && test.allowedLanguages.length > 0) {
      const currentLanguage = codeState.selectedLanguage;
      let languageToSelect = currentLanguage;
      let codeToLoad = '';

      // Priority 1: If no language is selected, prefer JavaScript if available, then first allowed language
      if (!currentLanguage) {
        let defaultLanguage = languages.find(
          (lang) => test.allowedLanguages.includes(lang.id) && lang.id === 63 // JavaScript
        );

        // If JavaScript is not available, use the first allowed language
        if (!defaultLanguage) {
          defaultLanguage = languages.find((lang) =>
            test.allowedLanguages.includes(lang.id)
          );
        }

        if (defaultLanguage) {
          // console.log('Selecting default language:', defaultLanguage);
          languageToSelect = defaultLanguage;
          selectLanguage(defaultLanguage);
        }
      }

      // Load code for the selected language
      if (languageToSelect) {
        // Check if there's a submitted solution for this specific language
        const submittedSolution = loadSubmittedSolutionForLanguage(
          languageToSelect.id
        );
        if (submittedSolution) {
          codeToLoad = submittedSolution.sourceCode;
          // console.log(
          //   'Loading submitted solution for language:',
          //   languageToSelect.id
          // );
        }
        // Check local storage for this language
        else {
          const savedCode = loadCodeFromLocalStorage(languageToSelect.id);
          if (savedCode) {
            codeToLoad = savedCode;
            // console.log(
            //   'Loading saved code for language:',
            //   languageToSelect.id
            // );
          }
          // Use starter code
          else if (
            test.starterCode &&
            test.starterCode[languageToSelect.id.toString()]
          ) {
            codeToLoad = test.starterCode[languageToSelect.id.toString()];
            // console.log(
            //   'Loading starter code for language:',
            //   languageToSelect.id
            // );
          }
        }

        if (codeToLoad && codeToLoad !== codeState.sourceCode) {
          updateSourceCode(codeToLoad);
        }
      }
    }
  }, [test, languages, codeState.selectedLanguage]);

  const loadTest = async () => {
    try {
      setLoading(true);
      const testData = await testAPI.getTestByIdForUser(testId);
      setTest(testData);
    } catch (error) {
      console.error('Error loading test:', error);
      toast.error('Failed to load test');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissionHistory = async () => {
    try {
      const history = await testAPI.getUserSubmissionHistory(testId);
      setSubmissionHistory(history);
    } catch (error) {
      console.error('Error loading submission history:', error);
    }
  };

  const handleSubmit = async () => {
    if (!test || !codeState.selectedLanguage) {
      toast.error('Please select a programming language');
      return;
    }

    if (!codeState.sourceCode.trim()) {
      toast.error('Please write some code');
      return;
    }

    try {
      setSubmitting(true);
      setSubmissionError(null); // Clear previous errors

      const result = await assessmentResultAPI.submitTestSolution(testId, {
        sourceCode: codeState.sourceCode,
        testId,
        assessmentId,
        languageId: codeState.selectedLanguage.id,
      });

      setSubmissionResult(result);
      setRunResult(null); // Clear run result when submitting
      setSubmissionError(null); // Clear any previous errors on success

      // Save submitted solution to local storage
      saveSubmittedSolution(
        codeState.sourceCode,
        codeState.selectedLanguage.id
      );

      loadSubmissionHistory();

      // Show success message
      if (result.passedTestCases === result.totalTestCases) {
        toast.success('All test cases passed! You can now submit the assessment.');
      } else {
        toast.warning(
          `${result.passedTestCases}/${result.totalTestCases} test cases passed. You can still submit the assessment.`
        );
      }

      // Refresh assessment data to update sidebar
      if (onCodeSubmitted) {
        onCodeSubmitted();
      }

      // Note: Removed auto-redirect - user should click "Submit Assessment" button
    } catch (error: any) {
      console.error('Error submitting solution:', error);

      // Extract meaningful error message
      let errorMessage = 'Failed to submit solution';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Add context based on status code
      if (error.response?.status === 400) {
        errorMessage = `Invalid request: ${errorMessage}`;
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage =
          'Access denied. You may not have permission to submit this test.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Test not found or no longer available.';
      } else if (error.response?.status === 429) {
        errorMessage =
          'Too many requests. Please wait before submitting again.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      setSubmissionError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty: TestDifficulty) => {
    switch (difficulty) {
      case TestDifficulty.EASY:
        return 'bg-green-100 text-green-800';
      case TestDifficulty.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case TestDifficulty.HARD:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTestResultIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  const toggleTestCaseExpansion = (index: number) => {
    setExpandedTestCases((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Loading message="Loading assessment... Behave Like Compiler" size="md" />
    );
  }

  if (!test) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Test not found or you don't have permission to access it.
        </AlertDescription>
      </Alert>
    );
  }
  // console.log('Codestate', codeState);
  // console.log('test', test);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Problem Description */}
      <div
        className={`${
          sidebarCollapsed ? 'w-12' : 'w-96'
        } transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-gray-900">
                {test.title}
              </h1>
              <Badge
                className={`${getDifficultyColor(
                  test.difficulty
                )} text-xs px-2 py-1`}
              >
                {test.difficulty}
              </Badge>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {!sidebarCollapsed && (
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Problem Statement */}
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-3">
                  Problem Statement
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                    {test.problemStatement}
                  </pre>
                </div>
              </div>

              {/* Constraints */}
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-3">
                  Constraints
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                    {test.constraints}
                  </pre>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Problem</h2>
            </div>

            <div className="flex items-center gap-2">
                  <select
                    value={codeState.selectedLanguage?.id || ''}
                    onChange={(e) => {
                      const lang = languages.find(
                        (l) => l.id === parseInt(e.target.value)
                      );
                      if (lang) {
                        // Save current code before switching
                        if (codeState.selectedLanguage && codeState.sourceCode) {
                          saveCodeToLocalStorage(
                            codeState.selectedLanguage.id,
                            codeState.sourceCode
                          );
                        }

                        selectLanguage(lang);

                        // Load code with priority: submitted solution > local storage > starter code
                        let codeToLoad = '';

                        // Priority 1: Check if there's a submitted solution for this language
                        const submittedSolution = loadSubmittedSolutionForLanguage(
                          lang.id
                        );
                        if (submittedSolution) {
                          codeToLoad = submittedSolution.sourceCode;
                          setLastSubmittedSolution(submittedSolution);
                        }
                        // Priority 2: Check local storage for this language
                        else {
                          const savedCode = loadCodeFromLocalStorage(lang.id);
                          if (savedCode) {
                            codeToLoad = savedCode;
                          }
                          // Priority 3: Use starter code
                          else if (
                            test?.starterCode &&
                            test.starterCode[lang.id.toString()]
                          ) {
                            codeToLoad = test.starterCode[lang.id.toString()];
                          }
                        }

                        // Update source code unconditionally (or with empty string fallback)
                        // Use originalUpdateSourceCode to avoid stale state in the wrapper and redundant saving
                        originalUpdateSourceCode(codeToLoad || '');
                      }
                    }}
                    className="px-3 py-1 border border-gray-300 rounded text-sm bg-white max-w-[150px] sm:max-w-[200px]"
                  >
                <option value="">Select Language</option>
                {languages
                  .filter((lang) => test?.allowedLanguages.includes(lang.id))
                  .map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (test?.starterCode && codeState.selectedLanguage) {
                    updateSourceCode(
                      test.starterCode[
                        codeState.selectedLanguage.id.toString()
                      ] || ''
                    );
                  }
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>

              {/* <Button
                onClick={handleRun}
                disabled={
                  running ||
                  !codeState.selectedLanguage ||
                  !codeState.sourceCode.trim()
                }
                variant="outline"
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                {running ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run
                  </>
                )}
              </Button> */}

              <Button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !codeState.selectedLanguage ||
                  !codeState.sourceCode.trim()
                }
                variant="outline"
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run
                  </>
                )}
              </Button>

              {/* Submit Assessment Button */}
              {onSubmitAssessment && (
                <Button
                  onClick={async () => {
                    // Auto-evaluate code first if not already evaluated in this session
                    if (!submissionResult && codeState.sourceCode?.trim()) {
                      try {
                        // Run the code to evaluate and set isCorrect
                        await handleSubmit();
                      } catch (error) {
                        console.error('Error auto-evaluating code:', error);
                        // Continue with submission even if evaluation fails
                      }
                    }
                    // Now submit the assessment
                    await onSubmitAssessment();
                  }}
                  disabled={submitAssessmentMutation?.isPending || submitting || !codeState.sourceCode?.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {(submitAssessmentMutation?.isPending || submitting) ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-white">
            <SimpleCodeEditor
              value={codeState.sourceCode || ''}
              onChange={(code) => updateSourceCode(code)}
              language={codeState.selectedLanguage?.name || 'python'}
              readOnly={false}
              height="100%"
            />
          </div>

          {/* Console Area */}
          <div
            className={`${
              consoleCollapsed ? 'h-12' : 'h-64'
            } transition-all duration-300 border-t border-gray-200 bg-gray-50`}
          >
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-700">
                  {submissionResult
                    ? 'Submission Results'
                    : runResult
                      ? 'Run Results'
                      : 'Console'}
                </h3>
                {(submissionResult || runResult) && (
                  <Badge
                    className={`${getScoreColor(
                      (submissionResult || runResult)!.score
                    )} text-xs`}
                  >
                    {(submissionResult || runResult)!.score.toFixed(1)}%
                  </Badge>
                )}
                {runResult && !submissionResult && (
                  <Badge
                    variant="outline"
                    className="text-blue-600 border-blue-200 text-xs"
                  >
                    Test Run
                  </Badge>
                )}
                {submissionResult && (
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-200 text-xs"
                  >
                    Submitted
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConsoleCollapsed(!consoleCollapsed)}
                className="p-1"
              >
                {consoleCollapsed ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </Button>
            </div>

            {!consoleCollapsed && (
              <div className="p-4 h-full overflow-auto">
                {/* Submission Error Display */}
                {submissionError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium text-red-800 mb-1">
                            Submission Error
                          </h4>
                          <p className="text-sm text-red-700">
                            {submissionError}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSubmissionError(null)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        aria-label="Close error"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {submissionResult || runResult ? (
                  <div className="space-y-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-white p-3 rounded border">
                        <div className="text-lg font-semibold text-gray-900">
                          {(submissionResult || runResult)!.passedTestCases}/
                          {(submissionResult || runResult)!.totalTestCases}
                        </div>
                        <div className="text-xs text-gray-500">Test Cases</div>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <div
                          className={`text-lg font-semibold ${getScoreColor(
                            (submissionResult || runResult)!.score
                          )}`}
                        >
                          {(submissionResult || runResult)!.score.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">Score</div>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <div className="text-lg font-semibold text-gray-900">
                          {(submissionResult || runResult)!.executionTime}ms
                        </div>
                        <div className="text-xs text-gray-500">Runtime</div>
                      </div>
                    </div>

                    {/* Test Case Results */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Test Case Results:
                      </h4>
                      <p className="text-xs text-gray-500 mb-3">
                        Click on any test case to view inputs and outputs
                      </p>
                      {(submissionResult || runResult)!.testResults.map(
                        (result, index) => {
                          // Find the corresponding test case (skip hidden ones)
                          const visibleTestCases =
                            test?.testCases?.filter((tc) => !tc.isHidden) || [];
                          const testCase = visibleTestCases[index];
                          const isExpanded = expandedTestCases.has(index);

                          return (
                            <div
                              key={index}
                              className={`rounded border ${
                                result.passed
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-red-50 border-red-200'
                              }`}
                            >
                              <div
                                className="p-3 cursor-pointer transition-colors hover:bg-opacity-80 hover:shadow-sm"
                                onClick={() => toggleTestCaseExpansion(index)}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-gray-500" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-gray-500" />
                                    )}
                                    {getTestResultIcon(result.passed)}
                                    <span className="text-sm font-medium">
                                      Test Case {index + 1}
                                    </span>
                                    {result.executionTime && (
                                      <span className="text-xs text-gray-500">
                                        ({result.executionTime}ms)
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    {result.passed ? (
                                      <span className="text-xs font-medium text-green-600">
                                        PASSED
                                      </span>
                                    ) : (
                                      <span className="text-xs font-medium text-red-600">
                                        FAILED
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Expanded Content */}
                              {isExpanded && (
                                <div className="px-3 pb-3 border-t border-gray-200">
                                  {/* Test Case Inputs */}
                                  {testCase && testCase.inputs && (
                                    <div className="mt-2 mb-3">
                                      <div className="font-medium text-gray-700 mb-2 text-xs">
                                        Input
                                        {testCase.inputs.length > 1 ? 's' : ''}:
                                      </div>
                                      <div className="space-y-1">
                                        {testCase.inputs.map(
                                          (input, inputIndex) => (
                                            <div
                                              key={inputIndex}
                                              className="text-xs"
                                            >
                                              <span className="text-gray-600">
                                                {testCase.inputs.length > 1 &&
                                                  `Input ${inputIndex + 1}: `}
                                              </span>
                                              <code className="bg-gray-100 px-2 py-1 rounded font-mono">
                                                {input.value}
                                              </code>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Expected Output */}
                                  <div className="mb-2">
                                    <div className="font-medium text-gray-700 mb-1 text-xs">
                                      Expected Output:
                                    </div>
                                    <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs block">
                                      {result.expectedOutput}
                                    </code>
                                  </div>

                                  {/* Actual Output */}
                                  <div className="mb-2">
                                    <div className="font-medium text-gray-700 mb-1 text-xs">
                                      Actual Output:
                                    </div>
                                    <code
                                      className={`px-2 py-1 rounded font-mono text-xs block ${
                                        result.passed
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {result.actualOutput || 'No output'}
                                    </code>
                                  </div>

                                  {/* Error Message Display */}
                                  {!result.passed && result.errorMessage && (
                                    <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs">
                                      <div className="font-medium text-red-800 mb-1">
                                        Error:
                                      </div>
                                      <pre className="text-red-700 whitespace-pre-wrap font-mono text-xs">
                                        {result.errorMessage}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Run or submit your code to see test results</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
