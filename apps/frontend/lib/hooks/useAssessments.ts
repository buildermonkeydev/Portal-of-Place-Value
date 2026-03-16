import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentAPI } from '@/lib/api';
import {
    Assessment,
    AssessmentWithDetails,
    CreateAssessmentData,
    UpdateAssessmentData,
    AssessmentQueryParams,
    UserAssessment,
} from '@/lib/types';
import { toast } from 'sonner';

export const useAssessments = (params?: AssessmentQueryParams) => {
    return useQuery({
        queryKey: ['assessments', params],
        queryFn: () => assessmentAPI.getAllAssessments(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useAssessment = (id: string) => {
    return useQuery<AssessmentWithDetails>({
        queryKey: ['assessment', id],
        queryFn: () => assessmentAPI.getAssessmentByIdWithQuestion(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

export const useSearchAssessments = (params?: AssessmentQueryParams) => {
    return useQuery({
        queryKey: ['assessments', 'search', params],
        queryFn: () => assessmentAPI.searchAssessments(params),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

export const useAvailableAssessments = (params?: AssessmentQueryParams) => {
    return useQuery({
        queryKey: ['assessments', 'available', params],
        queryFn: () => assessmentAPI.getAvailableAssessments(params),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

export const useCreateAssessment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAssessmentData) => assessmentAPI.createAssessment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessments'] });
            toast.success('Assessment created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create assessment');
        },
    });
};

export const useUpdateAssessment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAssessmentData }) =>
            assessmentAPI.updateAssessment(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['assessments'] });
            queryClient.invalidateQueries({ queryKey: ['assessment', id] });
            toast.success('Assessment updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update assessment');
        },
    });
};

export const useDeleteAssessment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => assessmentAPI.deleteAssessment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessments'] });
            toast.success('Assessment deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete assessment');
        },
    });
};

export const useCloneAssessment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => assessmentAPI.cloneAssessment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessments'] });
            toast.success('Assessment cloned successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to clone assessment');
        },
    });
};

export const useToggleAssessmentStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, action }: { id: string; action: 'activate' | 'deactivate' }) =>
            action === 'activate' ? assessmentAPI.activateAssessment(id) : assessmentAPI.deactivateAssessment(id),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['assessments'] });
            queryClient.invalidateQueries({ queryKey: ['assessment', id] });
            toast.success('Assessment status updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update assessment status');
        },
    });
};

export const useAssignUsersToAssessment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
            assessmentAPI.assignUsersToAssessment(id, userIds),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['assessments'] });
            queryClient.invalidateQueries({ queryKey: ['assessment', id] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Users assigned to assessment successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to assign users to assessment');
        },
    });
};

export const useAssessmentStats = (id: string) => {
    return useQuery({
        queryKey: ['assessment', id, 'stats'],
        queryFn: () => assessmentAPI.getAssessmentStats(id),
        enabled: !!id,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

export const useMyAssessments = () => {
    return useQuery<UserAssessment[]>({
        queryKey: ['assessments', 'my'],
        queryFn: () => assessmentAPI.getMyAssessments(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}; 