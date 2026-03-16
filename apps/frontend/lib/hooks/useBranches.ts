import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '@/lib/api/branches';
import { Branch, CreateBranchData, UpdateBranchData } from '@/lib/types/branch';
import { toast } from 'sonner';

// Hook to get all branches
export const useBranches = (params?: { search?: string; limit?: number; page?: number }) => {
    return useQuery({
        queryKey: ['branches', params],
        queryFn: () => branchesApi.getBranches(params),
    });
};

// Hook to get a single branch
export const useBranch = (id: string) => {
    return useQuery({
        queryKey: ['branches', id],
        queryFn: () => branchesApi.getBranch(id),
        enabled: !!id,
    });
};

// Hook to create a branch
export const useCreateBranch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateBranchData) => branchesApi.createBranch(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['branches'] });
            toast.success('Branch created successfully');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to create branch');
        },
    });
};

// Hook to update a branch
export const useUpdateBranch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateBranchData }) =>
            branchesApi.updateBranch(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['branches'] });
            queryClient.invalidateQueries({ queryKey: ['branches', id] });
            toast.success('Branch updated successfully');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to update branch');
        },
    });
};

// Hook to delete a branch
export const useDeleteBranch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => branchesApi.deleteBranch(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['branches'] });
            toast.success('Branch deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to delete branch');
        },
    });
};

// Hook to search branches
export const useSearchBranches = (name: string) => {
    return useQuery({
        queryKey: ['branches', 'search', name],
        queryFn: () => branchesApi.searchBranches(name),
        enabled: !!name && name.length > 0,
    });
};

// Hook to bulk import branches
export const useBulkImportBranches = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (branches: CreateBranchData[]) => branchesApi.bulkImport(branches),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['branches'] });
            if (result.success) {
                toast.success(`Bulk import completed: ${result.data?.created} created, ${result.data?.updated} updated`);
            } else {
                toast.error(result.message || 'Bulk import failed');
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to bulk import branches');
        },
    });
};

// Hook to bulk import from file
export const useBulkImportFromFile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => branchesApi.bulkImportFromFile(file),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['branches'] });
            if (result.success) {
                toast.success(`File import completed: ${result.data?.created} created, ${result.data?.updated} updated`);
            } else {
                toast.error(result.message || 'File import failed');
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to import from file');
        },
    });
};

// Hook to find branches by names
export const useFindBranchesByNames = (names: string[]) => {
    return useQuery({
        queryKey: ['branches', 'by-names', names],
        queryFn: () => branchesApi.findBranchesByNames(names),
        enabled: names.length > 0,
    });
};

// Hook to get branch statistics
export const useBranchStats = () => {
    return useQuery({
        queryKey: ['branches', 'stats'],
        queryFn: () => branchesApi.getBranchStats(),
    });
}; 