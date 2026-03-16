export interface College {
    _id: string;
    name: string;
    branches: Array<{
        _id: string;
        name: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCollegeData {
    name: string;
    branches: Array<{
        name: string;
    }>;
}

export interface UpdateCollegeData {
    name?: string;
    branches: Array<{
        name: string;
    }>;
}

export interface BulkImportResult {
    success: boolean;
    message: string;
    created: number;
    updated: number;
    failed: number;
    errors?: string[];
} 