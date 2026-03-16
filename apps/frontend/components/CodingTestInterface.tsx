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
import { SimpleCodeEditor } from './SimpleCodeEditor';
import { Loading } from '@/components/ui/Loading';

interface CodingTestInterfaceProps {
  testId: string;
}

export function CodingTestInterface({ testId }: CodingTestInterfaceProps) {
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
  const [activeTab, setActiveTab] = useState<'description' | 'submissions'>(
    'description'
  );
  const [consoleTab, setConsoleTab] = useState<'testcase' | 'result'>(
    'testcase'
  );

  const {
    state: codeState,
    languages,
    selectLanguage,
    updateSourceCode: originalUpdateSourceCode,
    executeCode,
    loadLanguages,
  } = useCodeExecution();

  const updateSourceCode = (code: string, languageId?: number) => {
    // console.log('updateSourceCode called with:', code);
    originalUpdateSourceCode(code);
    // Save to local storage
    const targetLanguageId = languageId || codeState.selectedLanguage?.id;
    if (targetLanguageId !== undefined) {
      saveCodeToLocalStorage(targetLanguageId, code);
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
    loadLanguages(testId); 
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
      let codeToLoad: string | undefined;

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
        const langId = languageToSelect.id;
        const langKey = langId.toString();
        // Check if there's a submitted solution for this specific language
        const submittedSolution = loadSubmittedSolutionForLanguage(langId);
        if (submittedSolution) {
          codeToLoad = submittedSolution.sourceCode ?? '';
          // console.log('Loading submitted solution for language:', langId);
        }
        // Check local storage for this language
        else {
          const savedCode = loadCodeFromLocalStorage(langId);
          if (savedCode !== null) {
            codeToLoad = savedCode;
            // console.log('Loading saved code for language:', langId);
          }
          // Use starter code
          else if (
            test.starterCode &&
            Object.prototype.hasOwnProperty.call(test.starterCode, langKey)
          ) {
            codeToLoad = test.starterCode[langKey] ?? '';
            // console.log('Loading starter code for language:', langId);
          }
        }

        const normalizedCode = codeToLoad ?? '';
        if (normalizedCode !== codeState.sourceCode) {
          updateSourceCode(normalizedCode, langId);
        }
      }
    }
  }, [test, languages, codeState.selectedLanguage]);

  const loadTest = async () => {
    try {
      setLoading(true);
      const testData = await testAPI.getTestByIdForUser(testId);
      setTest(testData);

      // Note: Language selection and starter code initialization is now handled by useEffect
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

  const handleRun = async () => {
    if (!test || !codeState.selectedLanguage) {
      toast.error('Please select a programming language');
      return;
    }

    if (!codeState.sourceCode.trim()) {
      toast.error('Please write some code');
      return;
    }

    try {
      setRunning(true);
      setRunResult(null);
      setSubmissionError(null); // Clear any previous submission errors

      // Submit code - get submissionId and jobId
      const submissionResponse = await testAPI.submitTestSolution(testId, {
        sourceCode: codeState.sourceCode,
        languageId: codeState.selectedLanguage.id,
      });

      // Poll for results (same as submit)
      const maxAttempts = 60;
      let attempts = 0;
      let result: {
        totalTestCases: number;
        passedTestCases: number;
        score: number;
        executionTime: number;
        testResults: any[];
      } | undefined; // Changed from null to undefined for better TypeScript inference

      while (attempts < maxAttempts) {
        try {
          const statusResponse = await testAPI.getSubmissionStatus(submissionResponse.submissionId);
          
          if (statusResponse.status === 'completed' && statusResponse.submission) {
            const submission = statusResponse.submission;
            result = {
              totalTestCases: submission.totalTestCases || 0,
              passedTestCases: submission.passedTestCases || 0,
              score: submission.score || 0,
              executionTime: submission.executionTime || 0,
              testResults: submission.testResults || []
            };
            break;
          } else if (statusResponse.status === 'failed') {
            throw new Error('Execution failed');
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        } catch (pollError) {
          console.error('Poll error:', pollError);
          attempts++;
        }
      }

      if (!result) {
        throw new Error('Execution timed out. Please try again.');
      }

      setRunResult(result);

      if (result.passedTestCases === result.totalTestCases) {
        toast.success('All test cases passed! Ready to submit.');
      } else {
        toast.warning(
          `${result.passedTestCases}/${result.totalTestCases} test cases passed`
        );
      }
    } catch (error: any) {
      console.error('Error running code:', error);

      // Extract meaningful error message
      let errorMessage = 'Failed to run code';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setRunning(false);
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

      // Submit code - get submissionId and jobId
      const submissionResponse = await testAPI.submitTestSolution(testId, {
        sourceCode: codeState.sourceCode,
        languageId: codeState.selectedLanguage.id,
      });

      // Show "processing" toast
      toast.info('Submission queued! Processing your code...');

      // Poll for results
      const maxAttempts = 60; // 60 attempts = 60 seconds max
      let attempts = 0;
      let result: {
        totalTestCases: number;
        passedTestCases: number;
        score: number;
        executionTime: number;
        testResults: any[];
      } | undefined; // Changed from null to undefined for better TypeScript inference

      while (attempts < maxAttempts) {
        try {
          const statusResponse = await testAPI.getSubmissionStatus(submissionResponse.submissionId);
          
          // Check if processing is complete
          if (statusResponse.status === 'completed' && statusResponse.submission) {
            const submission = statusResponse.submission;
            
            // Convert to expected format
            result = {
              totalTestCases: submission.totalTestCases || 0,
              passedTestCases: submission.passedTestCases || 0,
              score: submission.score || 0,
              executionTime: submission.executionTime || 0,
              testResults: submission.testResults || []
            };
            break;
          } else if (statusResponse.status === 'failed') {
            throw new Error('Submission failed during processing');
          }

          // Wait 1 second before next poll
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        } catch (pollError) {
          console.error('Poll error:', pollError);
          attempts++;
        }
      }

      if (!result) {
        throw new Error('Submission timed out. Please try again.');
      }

      setSubmissionResult(result);
      setRunResult(null); // Clear run result when submitting
      setSubmissionError(null); // Clear any previous errors on success

      // Save submitted solution to local storage
      saveSubmittedSolution(
        codeState.sourceCode,
        codeState.selectedLanguage.id
      );

      loadSubmissionHistory();

      if (result.passedTestCases === result.totalTestCases) {
        toast.success('Congratulations! All test cases passed!');
      } else {
        toast.warning(
          `${result.passedTestCases}/${result.totalTestCases} test cases passed`
        );
      }
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
    return <Loading message="Loading test... Behave Like Compiler" size="md" />;
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
    <div className="flex h-screen bg-gray-50 overflow-hidden w-full m-0 p-0">
      {/* Left Sidebar - Problem Description (LeetCode-style: ~40% width) */}
      <div
        className={`${
          sidebarCollapsed
            ? 'w-12'
            : 'w-full sm:w-[40%] md:w-[38%] lg:w-[36%] xl:w-[35%] min-w-[280px] max-w-[600px]'
        } transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 border-b border-gray-200 flex-shrink-0">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {test.title}
              </h1>
              <Badge
                className={`${getDifficultyColor(
                  test.difficulty
                )} text-xs px-2 py-0.5 flex-shrink-0`}
              >
                {test.difficulty}
              </Badge>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 flex-shrink-0"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {!sidebarCollapsed && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs Navigation */}
            <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
              <button
                onClick={() => setActiveTab('description')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'description'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'submissions'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Submissions
              </button>
            </div>

            {/* Tab Content */}
            <ScrollArea className="flex-1 overflow-auto">
              {activeTab === 'description' && (
                <div className="px-3 sm:px-4 md:px-5 py-3 sm:py-4 space-y-4 sm:space-y-5">
                  {/* Problem Statement */}
                  <div>
                    <div className="prose prose-sm max-w-none text-gray-800">
                      <div className="text-[15px] leading-7 whitespace-pre-wrap">
                        {test.problemStatement}
                      </div>
                    </div>
                  </div>

                  {/* Examples Section */}
                  {test.testCases && test.testCases.length > 0 && (
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-3">
                        Examples:
                      </h3>
                      <div className="space-y-4">
                        {test.testCases
                          .filter((tc) => !tc.isHidden)
                          .slice(0, 3)
                          .map((testCase, idx) => (
                            <div key={idx} className="space-y-2">
                              <div className="text-sm font-semibold text-gray-900">
                                Example {idx + 1}:
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-700">
                                      Input:{' '}
                                    </span>
                                    <code className="bg-white px-1.5 py-0.5 rounded text-gray-800 font-mono text-xs">
                                      {testCase.inputs
                                        .map((input) => {
                                          if (Array.isArray(input.value)) {
                                            return `[${input.value.join(',')}]`;
                                          }
                                          return String(input.value);
                                        })
                                        .join(', ')}
                                    </code>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">
                                      Output:{' '}
                                    </span>
                                    <code className="bg-white px-1.5 py-0.5 rounded text-gray-800 font-mono text-xs">
                                      {testCase.expectedOutput}
                                    </code>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Constraints */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                      Constraints:
                    </h3>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans leading-relaxed text-[15px] text-gray-800 bg-gray-50 p-3 rounded border border-gray-200">
                        {test.constraints}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'submissions' && (
                <div className="px-3 sm:px-4 md:px-5 py-3 sm:py-4">
                  {submissionHistory.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold text-gray-900 mb-3">
                        Submission History
                      </h3>
                      {submissionHistory.map((submission, idx) => {
                        const isPassed =
                          submission.passedTestCases ===
                            submission.totalTestCases &&
                          submission.totalTestCases > 0;
                        return (
                          <div
                            key={submission._id || idx}
                            className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Badge
                                  className={
                                    isPassed
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }
                                >
                                  {isPassed ? 'Accepted' : 'Failed'}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {submission.score.toFixed(1)}%
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(
                                    submission.submittedAt
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-sm">No submissions yet</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Main Content Area (LeetCode-style: ~60% width) */}
      <div className="flex-1 flex flex-col min-w-0  w-full  overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 flex-shrink-0 w-full">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-1.5">
                <Code className="w-4 h-4" />
                Code
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={codeState.selectedLanguage?.id || ''}
                onChange={(e) => {
                  const lang = languages.find(
                    (l) => l.id === parseInt(e.target.value)
                  );
                  if (lang) {
                    if (
                      codeState.selectedLanguage &&
                      codeState.sourceCode !== undefined
                    ) {
                      saveCodeToLocalStorage(
                        codeState.selectedLanguage.id,
                        codeState.sourceCode
                      );
                    }

                    selectLanguage(lang);

                    let codeToLoad: string | null | undefined = '';

                    const submittedSolution = loadSubmittedSolutionForLanguage(
                      lang.id
                    );
                    if (submittedSolution) {
                      codeToLoad = submittedSolution.sourceCode ?? '';
                      setLastSubmittedSolution(submittedSolution);
                    } else {
                      const savedCode = loadCodeFromLocalStorage(lang.id);
                      if (savedCode !== null) {
                        codeToLoad = savedCode;
                      } else if (
                        test?.starterCode &&
                        Object.prototype.hasOwnProperty.call(
                          test.starterCode,
                          lang.id.toString()
                        )
                      ) {
                        codeToLoad = test.starterCode[lang.id.toString()] ?? '';
                      }
                    }

                    const normalizedCode = codeToLoad ?? '';
                    if (normalizedCode !== codeState.sourceCode) {
                      updateSourceCode(normalizedCode, lang.id);
                    }
                  }
                }}
                className="px-2.5 py-1 border border-gray-300 rounded text-sm bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  if (codeState.selectedLanguage) {
                    const langId = codeState.selectedLanguage.id;
                    const langKey = langId.toString();
                    let resetCode = '';

                    if (
                      test?.starterCode &&
                      Object.prototype.hasOwnProperty.call(
                        test.starterCode,
                        langKey
                      )
                    ) {
                      resetCode = test.starterCode[langKey] ?? '';
                    }

                    updateSourceCode(resetCode, langId);
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
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
          <div
            className={`${consoleCollapsed ? 'flex-1' : 'flex-1 min-h-0'} bg-white w-full overflow-hidden`}
          >
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
              consoleCollapsed ? 'h-10 flex-shrink-0' : 'flex-1 min-h-[250px]'
            } transition-all duration-300 border-t border-gray-200 bg-white flex flex-col w-full overflow-hidden`}
          >
            {/* Console Header with Tabs */}
            <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 border-b border-gray-200 flex-shrink-0 bg-gray-50 w-full">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setConsoleTab('testcase')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    consoleTab === 'testcase'
                      ? 'text-gray-900 bg-white border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Testcase
                </button>
                <button
                  onClick={() => setConsoleTab('result')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    consoleTab === 'result'
                      ? 'text-gray-900 bg-white border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Test Result
                </button>
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
              <div className="flex-1 overflow-auto bg-white w-full">
                {consoleTab === 'testcase' && (
                  <div className="px-2 sm:px-3 py-2 sm:py-3 w-full">
                    {test?.testCases && test.testCases.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Test Cases:
                        </h4>
                        {test.testCases
                          .filter((tc) => !tc.isHidden)
                          .map((testCase, idx) => (
                            <div
                              key={idx}
                              className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                            >
                              <div className="text-xs font-semibold text-gray-700 mb-2">
                                Test Case {idx + 1}
                              </div>
                              <div className="space-y-1.5 text-xs">
                                <div>
                                  <span className="font-medium text-gray-600">
                                    Input:{' '}
                                  </span>
                                  <code className="bg-white px-1.5 py-0.5 rounded text-gray-800 font-mono">
                                    {testCase.inputs
                                      .map((input) => {
                                        if (Array.isArray(input.value)) {
                                          return `[${input.value.join(',')}]`;
                                        }
                                        return String(input.value);
                                      })
                                      .join(', ')}
                                  </code>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">
                                    Expected Output:{' '}
                                  </span>
                                  <code className="bg-white px-1.5 py-0.5 rounded text-gray-800 font-mono">
                                    {testCase.expectedOutput}
                                  </code>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No test cases available</p>
                      </div>
                    )}
                  </div>
                )}

                {consoleTab === 'result' && (
                  <div className="px-2 sm:px-3 py-2 sm:py-3 w-full overflow-auto flex-1">
                    {/* Submission Error Display */}
                    {submissionError && (
                      <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
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
                      <div className="space-y-2 sm:space-y-3">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                          <div className="bg-white p-2 sm:p-2.5 rounded border">
                            <div className="text-sm sm:text-base font-semibold text-gray-900">
                              {(submissionResult || runResult)!.passedTestCases}
                              /{(submissionResult || runResult)!.totalTestCases}
                            </div>
                            <div className="text-xs text-gray-500">
                              Test Cases
                            </div>
                          </div>
                          <div className="bg-white p-2 sm:p-2.5 rounded border">
                            <div
                              className={`text-sm sm:text-base font-semibold ${getScoreColor(
                                (submissionResult || runResult)!.score
                              )}`}
                            >
                              {(submissionResult || runResult)!.score.toFixed(
                                1
                              )}
                              %
                            </div>
                            <div className="text-xs text-gray-500">Score</div>
                          </div>
                          <div className="bg-white p-2 sm:p-2.5 rounded border">
                            <div className="text-sm sm:text-base font-semibold text-gray-900">
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
                                test?.testCases?.filter((tc) => !tc.isHidden) ||
                                [];
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
                                    className="p-2 sm:p-2.5 cursor-pointer transition-colors hover:bg-opacity-80 hover:shadow-sm"
                                    onClick={() =>
                                      toggleTestCaseExpansion(index)
                                    }
                                  >
                                    <div className="flex items-center justify-between mb-1.5">
                                      <div className="flex items-center gap-1.5 sm:gap-2">
                                        {isExpanded ? (
                                          <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                                        ) : (
                                          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                                        )}
                                        {getTestResultIcon(result.passed)}
                                        <span className="text-xs sm:text-sm font-medium">
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
                                    <div className="px-2 sm:px-3 pb-2 sm:pb-3 border-t border-gray-200">
                                      {/* Test Case Inputs */}
                                      {testCase && testCase.inputs && (
                                        <div className="mt-2 mb-3">
                                          <div className="font-medium text-gray-700 mb-2 text-xs">
                                            Input
                                            {testCase.inputs.length > 1
                                              ? 's'
                                              : ''}
                                            :
                                          </div>
                                          <div className="space-y-1">
                                            {testCase.inputs.map(
                                              (input, inputIndex) => (
                                                <div
                                                  key={inputIndex}
                                                  className="text-xs"
                                                >
                                                  <span className="text-gray-600">
                                                    {testCase.inputs.length >
                                                      1 &&
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
                                      {!result.passed &&
                                        result.errorMessage && (
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
                        <p className="text-sm">
                          Run or submit your code to see test results
                        </p>
                      </div>
                    )}
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
