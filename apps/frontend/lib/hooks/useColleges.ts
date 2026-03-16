import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { collegesApi } from '../api/colleges';
import { CreateCollegeData, UpdateCollegeData } from '../types/college';

// Hook to get all colleges
export const useColleges = (params?: { search?: string | ''; limit?: number; page?: number }) => {
    return useQuery({
        queryKey: ['colleges', params],
        queryFn: () => collegesApi.getColleges(params),
    });
};

// Hook to get a single college
export const useCollege = (id: string) => {
    return useQuery({
        queryKey: ['colleges', id],
        queryFn: () => collegesApi.getCollege(id),
        enabled: !!id,
    });
};

// Hook to create a college
export const useCreateCollege = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCollegeData) => collegesApi.createCollege(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['colleges'] });
            toast.success('College created successfully');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to create college');
        },
    });
};

// Hook to update a college
export const useUpdateCollege = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateCollegeData }) =>
            collegesApi.updateCollege(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['colleges'] });
            queryClient.invalidateQueries({ queryKey: ['colleges', id] });
            toast.success('College updated successfully');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to update college');
        },
    });
};

// Hook to delete a college
export const useDeleteCollege = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => collegesApi.deleteCollege(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['colleges'] });
            toast.success('College deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to delete college');
        },
    });
};

// Hook to search colleges
export const useSearchColleges = (name: string) => {
    return useQuery({
        queryKey: ['colleges', 'search', name],
        queryFn: () => collegesApi.searchColleges(name),
        enabled: !!name && name.length > 0,
    });
};

// Hook to bulk import colleges
export const useBulkImportColleges = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (colleges: CreateCollegeData[]) => collegesApi.bulkImport(colleges),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['colleges'] });
            if (result.success) {
                toast.success(`Bulk import completed: ${result.created} created, ${result.updated} updated`);
            } else {
                toast.error(result.message || 'Bulk import failed');
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to bulk import colleges');
        },
    });
};

// Hook to bulk import from file
export const useBulkImportFromFile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => collegesApi.bulkImportFromFile(file),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['colleges'] });
            if (result.success) {
                toast.success(
                    `File import completed: ${result.created} created, ${result.updated} updated`
                );
            } else {
                toast.error(result.message || 'File import failed');
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to import from file');
        },
    });
};

// Hook to find colleges by names
export const useFindCollegesByNames = (names: string[]) => {
    return useQuery({
        queryKey: ['colleges', 'by-names', names],
        queryFn: () => collegesApi.findCollegesByNames(names),
        enabled: names.length > 0,
    });
};

// Hook to get colleges with branches
export const useCollegesWithBranches = () => {
    return useQuery({
        queryKey: ['colleges', 'with-branches'],
        queryFn: () => collegesApi.getCollegesWithBranches(),
    });
}; 