import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI } from '@/lib/api';
import { User, UpdateUserData, UserQueryParams, CreateUserData } from '@/lib/types';
import { getErrorMessage } from '@/lib/utils';

export const useUsers = (params?: UserQueryParams) => {
    return useQuery({
        queryKey: ['users', params],
        queryFn: () => userAPI.getAllUsers(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useUser = (id: string) => {
    return useQuery({
        queryKey: ['user', id],
        queryFn: () => userAPI.getUserById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

export const useSearchUsers = (params?: UserQueryParams) => {
    return useQuery({
        queryKey: ['users', 'search', params],
        queryFn: () => userAPI.searchUsers(params),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};



export const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
            userAPI.updateUserById(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user', id] });
            toast.success('User updated successfully');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Failed to update user'));
        },
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => userAPI.deleteUserById(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User deleted successfully');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Failed to delete user'));
        },
    });
};

export const useToggleUserStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, action }: { id: string; action: 'activate' | 'deactivate' }) =>
            action === 'activate' ? userAPI.activateUser(id) : userAPI.deactivateUser(id),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user', id] });
            toast.success('User status updated successfully');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Failed to update user status'));
        },
    });
};

export const useUpdateUserRole = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, role }: { id: string; role: string }) =>
            userAPI.updateUserRole(id, role),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user', id] });
            toast.success('User role updated successfully');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Failed to update user role'));
        },
    });
};

export const useBulkDeleteUsers = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userIds: string[]) => userAPI.bulkDeleteUsers(userIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Users deleted successfully');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Failed to delete users'));
        },
    });
};

export const useBulkUpdateUserRoles = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userIds, role }: { userIds: string[]; role: string }) =>
            userAPI.bulkUpdateUserRoles(userIds, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User roles updated successfully');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Failed to update user roles'));
        },
    });
};

export const useBulkAssignAssessment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userIds, assessmentId }: { userIds: string[]; assessmentId: string }) =>
            userAPI.bulkAssignAssessment(userIds, assessmentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['assessments'] });
            toast.success('Assessment assigned to users successfully');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Failed to assign assessment'));
        },
    });
};

export const useSendInvitations = () => {
    return useMutation({
        mutationFn: ({ emails, message }: { emails: string[]; message?: string }) =>
            userAPI.sendInvitations(emails, message),
        onSuccess: () => {
            // toast.success('Invitations sent successfully');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Failed to send invitations'));
        },
    });
};

export const useSendInvitationsFromFile = () => {
    return useMutation({
        mutationFn: (file: File) => userAPI.sendInvitationsFromFile(file),
        onSuccess: () => {
            toast.success('Invitations sent from file successfully');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Failed to send invitations from file'));
        },
    });
};

export const useCreateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userData: CreateUserData) => userAPI.createUser(userData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User created successfully');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Failed to create user'));
        },
    });
}; 