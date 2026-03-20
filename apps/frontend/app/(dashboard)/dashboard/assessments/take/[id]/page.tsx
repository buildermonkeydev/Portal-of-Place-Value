'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  useSubmitAssessment,
  usePauseAssessment,
  useSaveAnswer,
  useMyAssessmentOnGoingResult,
  useClearAnswer,
} from '@/lib/hooks/useAssessmentResults';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Loader2,
  XCircle,
  Clock,
  Save,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { debounce } from 'lodash';
import {
  AssessmentHeader,
  AssessmentTimer,
  ProgressBars,
  QuestionDisplay,
  QuestionSidebar,
  MobileQuestionNav,
  ReviewModal,
} from './components';
import { Answer, AssessmentResult } from '@/lib/types';
import Image from 'next/image';
import { Loading } from '@/components/ui/Loading';
import { cn } from '@/lib/utils';

export default function TakeAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [assessmentId, setAssessmentId] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<AssessmentResult>();
  const [isContinuing, setIsContinuing] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingUI, setIsUpdatingUI] = useState(false);
  const [failedSaves, setFailedSaves] = useState<Set<string>>(new Set());
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentQuestionType, setCurrentQuestionType] = useState<
    'mcq' | 'coding'
  >('mcq');
  const [currentCodingQuestionIndex, setCurrentCodingQuestionIndex] =
    useState(0);

  const submitAssessmentMutation = useSubmitAssessment();
  const pauseAssessmentMutation = usePauseAssessment();
  const saveAnswerMutation = useSaveAnswer();
  const {
    data: assessment,
    isLoading: isLoadingAssessment,
    error: assessmentError,
    refetch: refetchAssessment,
  } = useMyAssessmentOnGoingResult(assessmentId);
  const { mutate: saveAnswer, isPending } = useSaveAnswer();
  const { mutate: clearAnswer, isPending: isPendingClearAnswer } =
    useClearAnswer();

  const calculateTimeLeft = useCallback(
    (assessment: AssessmentResult): number => {
      if (!assessment?.assessmentId?.duration || !assessment?.startTime) {
        return 0;
      }

      const durationInMinutes = assessment.assessmentId.duration;
      const startTime = new Date(assessment.startTime);
      const now = new Date();

      const elapsedSeconds = Math.floor(
        (now.getTime() - startTime.getTime()) / 1000
      );

      const remainingSeconds = durationInMinutes * 60 - elapsedSeconds;

      return Math.max(0, remainingSeconds);
    },
    []
  );

  const redirectToResults = () => {
    router.push(`/dashboard/assessments/take/success/${assessmentId}`);
  };

  // Handle API errors
  useEffect(() => {
    if (assessmentError) {
      console.error('Assessment API Error:', assessmentError);
      setApiError('Failed to load assessment. Please try again.');
      toast.error(
        'Failed to load assessment. Please check your connection and try again.'
      );
    }
  }, [assessmentError]);

  const debouncedSave = useCallback(
    (questionId: string, selectedOptions: string[]) => {
      if (isStarted && !isCompleted && assessmentId) {
        const currentQuestion = assessment?.responses?.find(
          (r) => r.questionId._id === questionId
        )?.questionId;
        const section = currentQuestion?.section;

        setIsSaving(true);

        saveAnswerMutation.mutate(
          {
            assessmentId: assessment?.assessmentId?._id || '',
            questionId,
            selectedOptions,
            section,
          },
          {
            onSuccess: () => {
              setLastSavedTime(new Date());
              setIsSaving(false);
              setFailedSaves((prev) => {
                const newSet = new Set(prev);
                newSet.delete(questionId);
                return newSet;
              });
              const now = Date.now();
              if (!lastSavedTime || now - lastSavedTime.getTime() > 2000) {
                toast.success('Answer saved automatically', {
                  duration: 1500,
                  position: 'bottom-right',
                });
              }
            },
            onError: (error: any) => {
              setIsSaving(false);
              setFailedSaves((prev) => new Set(prev).add(questionId));
              const errorMessage =
                error?.response?.data?.message ||
                'Failed to save answer. Please try again.';
              toast.error(errorMessage);
              console.error('Save answer error:', error);
            },
          }
        );
      }
    },
    [
      isStarted,
      isCompleted,
      assessmentId,
      saveAnswerMutation,
      lastSavedTime,
      assessment,
    ]
  );

  const debouncedSaveWithDelay = useMemo(
    () => debounce(debouncedSave, 500),
    [debouncedSave]
  );

  const saveAllResponses = useCallback(async () => {
    if (
      Array.isArray(responses?.responses) &&
      responses.responses.length > 0 &&
      isStarted &&
      !isCompleted &&
      assessmentId
    ) {
      try {
        const savePromises = responses?.responses?.map((response) =>
          saveAnswerMutation.mutateAsync({
            assessmentId: assessment?.assessmentId?._id || '',
            questionId: response.questionId._id,
            selectedOptions: response.selectedOptions,
            section: response.questionId.section || response.section,
          })
        );

        await Promise.all(savePromises);
        setLastSavedTime(new Date());
        toast.success('All answers saved successfully');
      } catch (error: any) {
        console.error('Failed to save all responses:', error);
        const errorMessage =
          error?.response?.data?.message ||
          'Failed to save some answers. Please check your connection.';
        toast.error(errorMessage);
      }
    }
  }, [responses, isStarted, isCompleted, assessmentId, saveAnswerMutation]);

  const retryFailedSaves = useCallback(async () => {
    if (failedSaves.size > 0) {
      try {
        const retryPromises = Array.from(failedSaves)
          .map((questionId) => {
            const response = responses?.responses.find(
              (r) => r.questionId._id === questionId
            );
            if (response) {
              return saveAnswerMutation.mutateAsync({
                assessmentId: assessment?.assessmentId?._id || '',
                questionId,
                selectedOptions: response.selectedOptions,
                section: response.questionId.section || response.section,
              });
            }
          })
          .filter(Boolean);

        await Promise.all(retryPromises);
        setFailedSaves(new Set());
        toast.success('All failed saves retried successfully');
      } catch (error: any) {
        console.error('Failed to retry saves:', error);
        const errorMessage =
          error?.response?.data?.message ||
          'Some saves still failed. Please check your connection.';
        toast.error(errorMessage);
      }
    }
  }, [failedSaves, responses, assessmentId, saveAnswerMutation]);

  const clearAllAnswers = useCallback(async () => {
    if (
      confirm(
        'Are you sure you want to clear all your answers? This action cannot be undone.'
      )
    ) {
      if (assessment && assessment?.responses.length > 0) {
        setResponses({
          ...assessment,
          responses: assessment?.responses?.map((r) => ({
            ...r,
            selectedOptions: [],
          })) as unknown as Answer[],
        });
      }

      clearAnswer({
        assessmentId,
      });

      try {
        localStorage.removeItem(`assessment_responses_${assessmentId}`);
      } catch (error) {
        console.error('Failed to clear localStorage:', error);
      }

      toast.success('All answers cleared. You can start over.');
    }
  }, [assessmentId, assessment, responses, clearAnswer]);

  const handleSubmitAssessment = useCallback(async () => {
    if (isCompleted) return;

    try {
      if (failedSaves.size > 0) {
        toast.error(
          `Please retry the ${failedSaves.size} failed save${
            failedSaves.size > 1 ? 's' : ''
          } before submitting.`
        );
        return;
      }

      const updatedAssessment = responses?.responses.map((r) => {
        return {
          selectedOptions: r.selectedOptions,
          questionId: r.questionId._id + '',
          section: r.section || r.questionId.section || '',
        };
      });

      await submitAssessmentMutation.mutateAsync({
        assessmentId: assessment?.assessmentId?._id || '',
        responses: updatedAssessment || [],
      });

      setIsCompleted(true);

      localStorage.removeItem(`assessment_responses_${assessmentId}`);

      toast.success('Assessment submitted successfully!');

      setTimeout(() => {
        router.push(`/dashboard/assessments/take/success/${assessmentId}`);
      }, 2000);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Failed to submit assessment';
      toast.error(errorMessage);
      console.error('Submit assessment error:', error);
    }
  }, [
    isCompleted,
    responses,
    submitAssessmentMutation,
    assessmentId,
    router,
    failedSaves,
  ]);

  useEffect(() => {
    if (!assessment || !isStarted || isCompleted) {
      return;
    }

    const initialTimeLeft = calculateTimeLeft(assessment);
    setTimeLeft(initialTimeLeft);

    const timerInterval = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1;

        if (newTime === 300) {
          toast.warning(
            '⚠️ 5 minutes remaining! Please submit your assessment soon.',
            {
              duration: 5000,
              position: 'top-center',
            }
          );
        }

        if (newTime === 60) {
          toast.error(
            '🚨 1 minute remaining! Submit now or session will be expired!',
            {
              duration: 10000,
              position: 'top-center',
            }
          );
        }

        if (newTime <= 0) {
          clearInterval(timerInterval);
          handleSubmitAssessment();
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => {
      clearInterval(timerInterval);
    };
  }, [assessment, isStarted, isCompleted, calculateTimeLeft]);

  useEffect(() => {
    params.then((resolvedParams) => {
      setAssessmentId(resolvedParams.id);
    });
  }, [params]);

  const handleAnswerChange = useCallback(
    (questionId: string, selectedOptions: string[]) => {
      const currentQuestion = assessment?.responses?.find(
        (r) => r.questionId._id === questionId
      )?.questionId;
      const section = currentQuestion?.section;

      setResponses((prevResponses) => {
        if (!prevResponses) return prevResponses;

        const updatedResponses = prevResponses.responses.map((prev) => {
          if (prev.questionId._id === questionId) {
            return {
              ...prev,
              selectedOptions,
              section: section,
            };
          }
          return prev;
        });

        return {
          ...prevResponses,
          responses: updatedResponses,
        };
      });

      setIsUpdatingUI(true);
      setTimeout(() => setIsUpdatingUI(false), 300);

      saveAnswer({
        assessmentId: assessment?.assessmentId?._id || '',
        questionId,
        selectedOptions,
        section,
      });

      debouncedSaveWithDelay(questionId, selectedOptions);
    },
    [
      isStarted,
      isCompleted,
      assessmentId,
      saveAnswer,
      debouncedSaveWithDelay,
      assessment,
    ]
  );

  const getCurrentQuestionResponse = useCallback(() => {
    const currentQuestionId =
      assessment?.responses?.[currentQuestionIndex]?.questionId?._id;
    if (!currentQuestionId) return null;

    const foundResponse = responses?.responses?.find(
      (r) => r.questionId._id === currentQuestionId
    );

    if (!foundResponse) {
      const fallbackResponse = assessment?.responses?.find(
        (r) => r.questionId._id === currentQuestionId
      );
      return fallbackResponse;
    }

    return foundResponse;
  }, [assessment?.responses, currentQuestionIndex, responses]);

  useEffect(() => {
    if (assessment) {
      const calculatedTimeLeft = calculateTimeLeft(assessment);
      if (calculatedTimeLeft <= 0) {
        setIsCompleted(true);
        toast.error('Assessment time has expired. Submitting automatically...');
        return;
      }

      setResponses(assessment);

      if (!isStarted) {
        setIsStarted(true);
      }
    }
  }, [assessment, isStarted, calculateTimeLeft]);

  // Auto-switch to coding mode if no MCQ questions but coding questions exist
  useEffect(() => {
    if (assessment) {
      const hasMCQQuestions = assessment.responses && assessment.responses.length > 0;
      const hasCodingQuestions = assessment.codingQuestions && assessment.codingQuestions.length > 0;
      
      if (!hasMCQQuestions && hasCodingQuestions && currentQuestionType === 'mcq') {
        setCurrentQuestionType('coding');
        setCurrentCodingQuestionIndex(0);
      }
    }
  }, [assessment, currentQuestionType]);

  const handleNextQuestion = () => {
    if (currentQuestionType === 'mcq') {
      if (currentQuestionIndex >= (assessment?.responses?.length || 0) - 1) {
        if (
          assessment?.codingQuestions &&
          assessment.codingQuestions.length > 0
        ) {
          setCurrentQuestionType('coding');
          setCurrentCodingQuestionIndex(0);
        }
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    } else if (currentQuestionType === 'coding') {
      if (
        currentCodingQuestionIndex <
        (assessment?.codingQuestions?.length || 0) - 1
      ) {
        setCurrentCodingQuestionIndex((prev) => prev + 1);
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionType === 'mcq') {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex((prev) => prev - 1);
      }
    } else if (currentQuestionType === 'coding') {
      if (currentCodingQuestionIndex <= 0) {
        setCurrentQuestionType('mcq');
        setCurrentQuestionIndex((assessment?.responses?.length || 0) - 1);
      } else {
        setCurrentCodingQuestionIndex((prev) => prev - 1);
      }
    }
  };

  const handlePauseAssessment = async () => {
    if (isStarted && !isCompleted && assessmentId) {
      try {
        if (responses?.responses && responses.responses.length > 0) {
          await saveAllResponses();
        }

        await pauseAssessmentMutation.mutateAsync({
          assessmentId,
        });
        toast.success('Assessment paused. You can continue later.');
      } catch (error: any) {
        console.error('Failed to pause assessment:', error);
        const errorMessage =
          error?.response?.data?.message || 'Failed to pause assessment';
        toast.error(errorMessage);
      }
    }
  };

  const handleQuestionTypeSelect = (type: 'mcq' | 'coding', index?: number) => {
    setCurrentQuestionType(type);
    if (type === 'coding' && index !== undefined) {
      setCurrentCodingQuestionIndex(index);
    }
  };

  const handleMCQQuestionSelect = (index: number) => {
    setCurrentQuestionType('mcq');
    setCurrentQuestionIndex(index);
  };

  // Show API error state
  if (apiError) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-screen w-screen bg-[#0C0C10] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Error Loading Assessment
              </h1>
              <p className="text-zinc-400 mb-4">{apiError}</p>
              <div className="space-x-4">
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white"
                >
                  <Loader2 className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <Button
                  onClick={() => router.push('/dashboard/assessments')}
                  variant="outline"
                  className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Assessments
                </Button>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!assessmentId || isLoadingAssessment) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-screen w-screen bg-[#0C0C10] flex items-center justify-center">
            <div className="text-center">
              <div className="relative inline-flex mb-4">
                <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin"></div>
              </div>
              <p className="text-zinc-400">Loading assessment...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!assessment) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-screen w-screen bg-[#0C0C10] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Assessment Not Found
              </h1>
              <p className="text-zinc-400 mb-4">
                The assessment you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button
                onClick={() => router.push('/dashboard/assessments')}
                className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Assessments
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (isCompleted) {
    redirectToResults();
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-screen w-screen bg-[#0C0C10] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Assessment Completed!
              </h1>
              <p className="text-zinc-400 mb-4">
                Thank you for completing the assessment.
              </p>
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mx-auto" />
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (assessment.status === 'failed') {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-screen w-screen bg-[#0C0C10] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Session Expired!
              </h1>
              <p className="text-zinc-400 mb-4">Your session has expired.</p>
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mx-auto" />
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const currentQuestion =
    currentQuestionType === 'mcq'
      ? assessment.responses?.[currentQuestionIndex]
      : null;
  const currentResponse =
    currentQuestionType === 'mcq' ? getCurrentQuestionResponse() : null;

  const hasMCQQuestions = assessment.responses && assessment.responses.length > 0;
  const hasCodingQuestions = assessment.codingQuestions && assessment.codingQuestions.length > 0;

  if (!hasMCQQuestions && !hasCodingQuestions) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-screen w-screen bg-[#0C0C10] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                No Questions Found
              </h1>
              <p className="text-zinc-400 mb-4">
                This assessment doesn't have any questions. Please contact the administrator.
              </p>
              <Button
                onClick={() => router.push('/dashboard/assessments')}
                className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Assessments
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (currentQuestionType === 'mcq' && hasMCQQuestions && !currentQuestion) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-screen w-screen bg-[#0C0C10] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Question Not Found
              </h1>
              <p className="text-zinc-400 mb-4">
                The current question could not be loaded. Please try refreshing the page.
              </p>
              <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white">
                Refresh Page
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const questionData =
    currentQuestionType === 'mcq' ? currentQuestion?.questionId : null;
  if (currentQuestionType === 'mcq' && hasMCQQuestions && !questionData) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-screen w-screen bg-[#0C0C10] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Question Data Not Found
              </h1>
              <p className="text-zinc-400 mb-4">
                The question data could not be loaded. Please try refreshing the page.
              </p>
              <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white">
                Refresh Page
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const answeredQuestions =
    responses?.responses?.filter(
      (r) => r.selectedOptions && r.selectedOptions.length > 0
    ).length || 0;

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0C0C10] relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom,rgba(249,115,22,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="w-full max-w-full space-y-4 sm:space-y-6 overflow-hidden">
            {/* Header */}
            <div className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 overflow-hidden bg-white/5 rounded-xl border border-white/10 p-4 sm:p-6 backdrop-blur-sm">
              <div className="flex-shrink-0">
                <Image
                  src={'/logo.png'}
                  width={120}
                  height={60}
                  alt="compiler"
                  className="h-12 sm:h-14 w-auto object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <AssessmentHeader
                  assessment={assessment}
                  isStarted={isStarted}
                  isContinuing={isContinuing}
                  responses={responses?.responses || []}
                  onPauseAssessment={handlePauseAssessment}
                  assessmentId={assessmentId}
                />
              </div>
            </div>

            {/* Timer */}
            <div className="w-full overflow-hidden">
              <AssessmentTimer
                timeLeft={timeLeft}
                isStarted={isStarted}
                isSaving={isSaving}
                lastSavedTime={lastSavedTime}
                failedSaves={failedSaves}
                onRetryFailedSaves={retryFailedSaves}
              />
            </div>

            {/* Countdown Warning Banner */}
            {timeLeft <= 300 && timeLeft > 0 && (
              <div
                className={cn(
                  "w-full p-4 rounded-xl border-2 overflow-hidden backdrop-blur-sm",
                  timeLeft <= 60
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium break-words">
                      {timeLeft <= 60
                        ? '🚨 Time is almost up! Submit your assessment now!'
                        : '⚠️ Time is running out! Please submit your assessment soon.'}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-mono whitespace-nowrap">
                      {formatTimeRemaining(timeLeft)} remaining
                    </div>
                    {timeLeft <= 60 && (
                      <div className="text-xs text-red-400 whitespace-nowrap">
                        Auto-submit in {timeLeft} seconds
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Question Navigation */}
            <div className="w-full overflow-hidden xl:hidden">
              <MobileQuestionNav
                questions={assessment.responses || []}
                currentQuestionIndex={currentQuestionIndex}
                responses={responses?.responses || []}
                onQuestionSelect={handleMCQQuestionSelect}
                codingQuestions={assessment.codingQuestions || []}
                currentQuestionType={currentQuestionType}
                currentCodingQuestionIndex={currentCodingQuestionIndex}
                onQuestionTypeSelect={handleQuestionTypeSelect}
              />
            </div>

            {/* Main Content Layout */}
            <div className="w-full flex flex-col xl:flex-row gap-4 xl:gap-8 overflow-hidden">
              {/* Left Sidebar - Question Navigator */}
              <div className="w-full xl:w-80 xl:flex-shrink-0 order-2 xl:order-1 overflow-hidden">
                <div className="hidden xl:block">
                  <QuestionSidebar
                    questions={assessment.responses || []}
                    currentQuestionIndex={currentQuestionIndex}
                    responses={responses?.responses || []}
                    onQuestionSelect={handleMCQQuestionSelect}
                    codingQuestions={assessment.codingQuestions || []}
                    currentQuestionType={currentQuestionType}
                    currentCodingQuestionIndex={currentCodingQuestionIndex}
                    onQuestionTypeSelect={handleQuestionTypeSelect}
                    totalMarksPossible={assessment.totalMarksPossible || 0}
                  />
                </div>
              </div>

              {/* Right Content Area */}
              <div className="flex-1 w-full min-w-0 space-y-6 order-1 xl:order-2 overflow-hidden">
                {/* Progress Bars */}
                <div className="w-full overflow-hidden">
                  <ProgressBars
                    currentQuestionIndex={currentQuestionIndex}
                    assessmentResult={assessment}
                    responses={responses?.responses || []}
                  />
                </div>

                {/* Question Display */}
                <div className="w-full overflow-hidden">
                  <QuestionDisplay
                    currentQuestion={
                      currentQuestion ||
                      assessment.responses?.[0] ||
                      ({} as any)
                    }
                    currentQuestionIndex={currentQuestionIndex}
                    totalQuestions={assessment.responses?.length || 0}
                    currentResponse={currentResponse}
                    lastSavedTime={lastSavedTime}
                    isSaving={isSaving}
                    isUpdatingUI={isUpdatingUI}
                    submitAssessmentMutation={submitAssessmentMutation}
                    onAnswerChange={handleAnswerChange}
                    onNextQuestion={handleNextQuestion}
                    onPreviousQuestion={handlePreviousQuestion}
                    onSaveAllResponses={saveAllResponses}
                    onClearAllAnswers={clearAllAnswers}
                    onShowReviewModal={() => setShowReviewModal(true)}
                    onSubmitAssessment={handleSubmitAssessment}
                    onNavigateToCoding={() => {
                      setCurrentQuestionType('coding');
                      setCurrentCodingQuestionIndex(0);
                    }}
                    onCodeSubmitted={() => {
                      refetchAssessment();
                    }}
                    responses={responses?.responses || []}
                    codingQuestions={assessment.codingQuestions || []}
                    currentQuestionType={currentQuestionType}
                    currentCodingQuestionIndex={currentCodingQuestionIndex}
                    assessmentId={assessmentId}
                    assessmentTitle={assessment.assessmentId?.title}
                    googleFormUrl={assessment.assessmentId?.googleForm}
                  />
                </div>
              </div>
            </div>

            <ReviewModal
              showReviewModal={showReviewModal}
              assessment={assessment}
              responses={responses?.responses || []}
              submitAssessmentMutation={submitAssessmentMutation}
              onCloseModal={() => setShowReviewModal(false)}
              onSubmitAssessment={handleSubmitAssessment}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}