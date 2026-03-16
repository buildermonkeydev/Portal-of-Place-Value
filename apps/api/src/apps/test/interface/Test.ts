import mongoose, { Document } from "mongoose";

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

export enum SubmissionStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

export interface ITestInput {
    _id?: string;
    value: string;
    order: number; // Order/position of this input (1, 2, 3, etc.)
    inputFormat?: 'array' | 'string' | 'number' | 'object' | 'mixed';
    applicableLanguages?: number[]; // Language IDs this input applies to (empty means all languages)
}

export interface ITestCase {
    _id?: string;
    inputs: ITestInput[]; // Multiple inputs instead of single input
    expectedOutput: string;
    isHidden: boolean; // Hidden test cases are not shown to users
    outputFormat?: 'array' | 'string' | 'number' | 'boolean' | 'object';
}

export interface ITest {
    _id: mongoose.Schema.Types.ObjectId | string;
    title: string;
    description: string;
    problemStatement: string;
    difficulty: TestDifficulty;
    tags: string[];
    colleges: {
        _id: string;
        branches?: {
            _id: string;
            name: string;
        }[];
        year?: number[];
    }[];
    assignedUsers: mongoose.Schema.Types.ObjectId[] | string[];
    testCases: ITestCase[];
    constraints: string;
    allowedLanguages: number[]; // Language IDs from code execution service
    starterCode: Map<string, string>; // Language ID (as string) -> starter code mapping
    executeCodeName: string; // Function/class name to execute (e.g., "threeSum", "Solution")
    status: TestStatus;
    createdBy: mongoose.Schema.Types.ObjectId | string; // Admin ID
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ITestDocument extends Omit<ITest, '_id'>, Document { }

export interface ITestSubmission {
    _id: mongoose.Schema.Types.ObjectId | string;
    testId: mongoose.Schema.Types.ObjectId | string;
    userId: mongoose.Schema.Types.ObjectId | string;
    sourceCode: string;
    languageId: number;
    status?: SubmissionStatus; // Submission status enum
    colleges: {
        _id: string;
        branches?: {
            _id: string;
            name: string;
        }[];
        year?: number[];
    }[],
    assignedUsers: string[];
    testResults: Array<{
        testCaseId: string;
        passed: boolean;
        actualOutput?: string;
        expectedOutput: string;
        executionTime?: number;
        memoryUsed?: number;
        errorMessage?: string;
    }>;
    totalTestCases: number;
    passedTestCases: number;
    score: number; // Percentage score
    executionTime: number; // Total execution time in milliseconds
    submittedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ITestSubmissionDocument extends Omit<ITestSubmission, '_id'>, Document { }
