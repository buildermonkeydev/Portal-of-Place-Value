import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionAPI } from '@/lib/api';
import { Question, CreateQuestionData, UpdateQuestionData, QuestionQueryParams } from '@/lib/types';
import { toast } from 'sonner';

export const useQuestions = (params?: QuestionQueryParams) => {
    return useQuery({
        queryKey: ['questions', params],
        queryFn: () => questionAPI.getAllQuestions(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useQuestion = (id: string) => {
    return useQuery({
        queryKey: ['question', id],
        queryFn: () => questionAPI.getQuestionById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

export const useSearchQuestions = (params?: QuestionQueryParams) => {
    return useQuery({
        queryKey: ['questions', 'search', params],
        queryFn: () => questionAPI.searchQuestions(params),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

export const useCreateQuestion = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateQuestionData) => questionAPI.createQuestion(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions'] });
            toast.success('Question created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create question');
        },
    });
};

export const useUpdateQuestion = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateQuestionData }) =>
            questionAPI.updateQuestion(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['questions'] });
            queryClient.invalidateQueries({ queryKey: ['question', id] });
            toast.success('Question updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update question');
        },
    });
};

export const useDeleteQuestion = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => questionAPI.deleteQuestion(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions'] });
            toast.success('Question deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete question');
        },
    });
};

export const useToggleQuestionStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => questionAPI.toggleQuestionStatus(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['questions'] });
            queryClient.invalidateQueries({ queryKey: ['question', id] });
            toast.success('Question status updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update question status');
        },
    });
}; 