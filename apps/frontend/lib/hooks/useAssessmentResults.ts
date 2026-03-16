import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentResultAPI } from '@/lib/api';
import { AssessmentResult } from '@/lib/types';
import { toast } from 'sonner';

export const useAssessmentResults = (params?: any) => {
    return useQuery({
        queryKey: ['assessment-results', params],
        queryFn: () => assessmentResultAPI.getAllResults(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useAssessmentResult = (id: string) => {
    return useQuery({
        queryKey: ['assessment-result', id],
        queryFn: () => assessmentResultAPI.getMyResultById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

export const useResultsByAssessment = (assessmentId: string) => {
    return useQuery({
        queryKey: ['assessment-results', 'assessment', assessmentId],
        queryFn: () => assessmentResultAPI.getResultsByAssessment(assessmentId),
        enabled: !!assessmentId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

export const useResultsByUser = (userId: string) => {
    return useQuery({
        queryKey: ['assessment-results', 'user', userId],
        queryFn: () => assessmentResultAPI.getResultsByUser(userId),
        enabled: !!userId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

export const useMyResults = () => {
    return useQuery({
        queryKey: ['assessment-results', 'my'],
        queryFn: () => assessmentResultAPI.getMyResults(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

export const useMyAssessmentResult = (assessmentId: string) => {
    return useQuery({
        queryKey: ['assessment-result', 'my', assessmentId],
        queryFn: () => assessmentResultAPI.getMyAssessmentResult(assessmentId),
        enabled: !!assessmentId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};


    export const useMyAssessmentOnGoingResult = (assessmentId: string) => {
    return useQuery({
        queryKey: ['assessment-result', 'my', assessmentId],
        queryFn: () => assessmentResultAPI.getMyOnGoingAssessmentResult(assessmentId),
        enabled: !!assessmentId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

export const useStartAssessment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { assessmentId: string; userId: string }) =>
            assessmentResultAPI.startAssessment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessment-results'] });
            toast.success('Assessment started successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to start assessment');
        },
    });
};

export const useSubmitAssessment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { assessmentId: string; responses: any[] }) =>
            assessmentResultAPI.submitAssessment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessment-results'] });
            toast.success('Assessment submitted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to submit assessment');
        },
    });
};

export const usePauseAssessment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { assessmentId: string }) =>
            assessmentResultAPI.pauseAssessment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessment-results'] });
            toast.success('Assessment paused successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to pause assessment');
        },
    });
};

export const useCurrentAssessmentState = (assessmentId: string) => {
    return useQuery({
        queryKey: ['assessment-state', assessmentId],
        queryFn: () => assessmentResultAPI.getCurrentAssessmentState(assessmentId),
        enabled: !!assessmentId,
        staleTime: 1 * 60 * 1000, // 1 minute
    });
};

export const useSubmitAssessmentResult = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => assessmentResultAPI.submitResult(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessment-results'] });
            queryClient.invalidateQueries({ queryKey: ['assessments'] });
            toast.success('Assessment submitted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to submit assessment');
        },
    });
};

export const useUpdateAssessmentResult = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            assessmentResultAPI.updateResult(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['assessment-results'] });
            queryClient.invalidateQueries({ queryKey: ['assessment-result', id] });
            toast.success('Assessment result updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update assessment result');
        },
    });
};

export const useDeleteAssessmentResult = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => assessmentResultAPI.deleteResult(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessment-results'] });
            toast.success('Assessment result deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete assessment result');
        },
    });
};

export const useSaveAnswer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: assessmentResultAPI.saveAnswer,
        onSuccess: (data, variables) => {
            // Invalidate the current assessment state to refresh data
            queryClient.invalidateQueries({
                queryKey: ['currentAssessmentState', variables.assessmentId]
            });
        },
        onError: (error: any) => {
            console.error('Failed to save answer:', error);
        }
    });
};



export const useClearAnswer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: assessmentResultAPI.clearAnswer,
        onSuccess: (data, variables) => {
            // Invalidate the current assessment state to refresh data
            queryClient.invalidateQueries({
                queryKey: ['currentAssessmentState', variables.assessmentId]
            });
        },
        onError: (error: any) => {
            console.error('Failed to save answer:', error);
        }
    });
};