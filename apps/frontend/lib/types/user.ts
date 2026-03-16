// User types
export interface User {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    mobileNumber: string;
    college: {
        _id: string;
        name: string;
    };
    branch: {
        _id: string;
        name: string;
    };
    collegeYear: number;
    registrationNo: string;
    role: UserRole;
    isActive: boolean;
    isEmailVerified: boolean;
    isDeleted?: boolean;
    deletedAt?: string;
    emailVerifiedAt?: string;
    lastLogin?: string;
    avatar?: string;
    fullName?: string;
    createdAt: string;
    updatedAt: string;
}

export enum UserRole {
    STUDENT = 'student',
    ADMIN = 'admin'
}

// Form types
export interface CreateUserData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    mobileNumber: string;
    collegeName?: string;
    collegeId?: string;
    branchName?: string;
    branchId?: string;
    collegeYear: number;
    registrationNo: string;
    role?: UserRole;
}

export interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    mobileNumber?: string;
    collegeName?: string;
    collegeId?: string;
    branchName?: string;
    branchId?: string;
    collegeYear?: number;
    registrationNo?: string;
    role?: UserRole;
    isActive?: boolean;
    isEmailVerified?: boolean;
}

// Query types
export interface UserQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    isEmailVerified?: boolean;
} 