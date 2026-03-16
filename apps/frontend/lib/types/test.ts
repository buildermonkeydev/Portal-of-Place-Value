export enum TestDifficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard'
}

export enum TestStatus {
    DRAFT = 'draft',
    PUBLISHED = 'published',
    ARCHIVED = 'archived'
}

export interface TestInput {
    _id?: string;
    value: string;
    order: number; // Order/position of this input (1, 2, 3, etc.)
    inputFormat?: 'array' | 'string' | 'number' | 'object' | 'mixed';
    applicableLanguages?: number[]; // Language IDs this input applies to (empty means all languages)
}

export interface TestCase {
    _id?: string;
    inputs: TestInput[]; // Multiple inputs instead of single input
    expectedOutput: string;
    isHidden: boolean;
    outputFormat?: 'array' | 'string' | 'number' | 'boolean' | 'object';
}

export interface Test {
    _id: string;
    title: string;
    description: string;
    problemStatement: string;
    difficulty: TestDifficulty;
    tags: string[];
    colleges?: {
        _id: string;
        branches?: {
            _id: string;
            name: string;
        }[];
        year?: number[];
    }[];
    assignedUsers?: string[];
    assignAllUsers?: boolean;
    testCases: TestCase[];
    constraints: string;
    allowedLanguages: number[];
    starterCode: Record<string, string>; // Language ID (as string) -> starter code mapping
    executeCodeName: string; // Function/class name to execute (e.g., "threeSum", "Solution")
    status: TestStatus;
    createdBy: string | { firstName: string; lastName: string; email: string };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface TestListItem {
    _id: string;
    title: string;
    description: string;
    difficulty: TestDifficulty;
    tags: string[];
    allowedLanguages: number[];
    status: TestStatus;
    createdBy: string | { firstName: string; lastName: string; email: string };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTestData {
    title: string;
    problemStatement: string;
    difficulty: TestDifficulty;
    tags: string[];
    colleges?: {
        _id: string;
        branches?: {
            _id: string;
            name: string;
        }[];
        year?: number[];
    }[];
    assignedUsers?: string[];
    assignAllUsers?: boolean;
    testCases: Omit<TestCase, '_id'>[];
    constraints: string;
    allowedLanguages: number[];
    starterCode?: Record<string, string>;
    executeCodeName: string; // Function/class name to execute (e.g., "threeSum", "Solution")
    status?: TestStatus;
}

export interface UpdateTestData extends Partial<CreateTestData> {
    isActive?: boolean;
}

export interface TestSubmission {
    sourceCode: string;
    languageId: number;
    testId?: string
    assessmentId?: string
}

export interface TestResult {
    testCaseId: string;
    passed: boolean;
    actualOutput?: string;
    expectedOutput: string;
    executionTime?: number;
    memoryUsed?: number;
    errorMessage?: string;
}

export interface TestSubmissionResult {
    _id: string;
    testId: string;
    userId: string;
    sourceCode: string;
    languageId: number;
    testResults: TestResult[];
    totalTestCases: number;
    passedTestCases: number;
    score: number;
    executionTime: number;
    submittedAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface TestQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    difficulty?: TestDifficulty;
    tags?: string[];
    status?: TestStatus;
    createdBy?: string;
    sortBy?: 'title' | 'difficulty' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
}

export interface TestSubmissionQueryParams {
    page?: number;
    limit?: number;
    testId?: string;
    userId?: string;
    sortBy?: 'submittedAt' | 'score' | 'executionTime';
    sortOrder?: 'asc' | 'desc';
}

export interface TestStats {
    total: number;
    published: number;
    draft: number;
    archived: number;
    byDifficulty: Record<TestDifficulty, number>;
}

export interface TestSubmissionStats {
    totalSubmissions: number;
    uniqueUsers: number;
    averageScore: number;
    passRate: number;
}

// Form data types for UI components
export interface TestFormData {
    title: string;
    problemStatement: string;
    difficulty: TestDifficulty;
    tags: string[];
    testCases: Omit<TestCase, '_id'>[];
    constraints: string;
    allowedLanguages: number[];
    status: TestStatus;
}

export interface TestInputFormData {
    value: string;
    order: number;
    inputFormat: 'array' | 'string' | 'number' | 'object' | 'mixed';
    applicableLanguages?: number[];
}

export interface TestCaseFormData {
    inputs: TestInputFormData[];
    expectedOutput: string;
    isHidden: boolean;
    outputFormat: 'array' | 'string' | 'number' | 'boolean' | 'object';
}

// Re-export Language from codeExecution types for convenience
export type { Language } from './codeExecution';
