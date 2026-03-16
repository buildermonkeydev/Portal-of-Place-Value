export interface Branch {
    _id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBranchData {
    name: string;
}

export interface UpdateBranchData {
    name: string;
}

export interface BranchStats {
    totalBranches: number;
    branchesThisMonth: number;
    branchesThisYear: number;
    growthRate: number;
}

export interface BulkImportResult {
    success: boolean;
    message: string;
    data?: {
        created: number;
        updated: number;
        failed: number;
        errors?: string[];
    };
} 