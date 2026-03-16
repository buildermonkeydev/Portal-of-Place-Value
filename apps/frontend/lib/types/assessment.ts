import { Question, QuestionTypeString } from './question';

// Assessment types
export interface Assessment {
    // Count fields for list views (optional for backward compatibility)
    questionsCount?: number;
    assignedUsersCount?: number;
    invitedUsersCount?: number;
    _id: string;
    title: string;
    description?: string;
    type: AssessmentType;
    instruction?: string;
    questions: string[];
    codingQuestions: { _id: string, section: string, score: number }[];
    totalMarks: number;
    duration: number;
    status: AssessmentStatus;
    startDate?: string;
    endDate?: string;
    createdBy: string;
    assignedUsers: string[];
    invitedUsers?: string[];
    isActive: boolean;
    googleForm?: string;
    passPercentage?: number;
    showResultsToUsers: boolean;
    colleges?: {
        _id: string;
        branches?: {
            _id: string;
            name: string;
        }[];
        year?: number[];
    }[];
    createdAt: string;
    updatedAt: string;
}

export interface AssessmentWithDetails extends Omit<Assessment, 'questions' | 'createdBy' | 'assignedUsers' | 'colleges'> {
    questions: Question[];
    createdBy: {
        _id: string;
        email: string;
        firstName: string;
        lastName: string;
        fullName: string;
    };
    assignedUsers: Array<{
        _id: string;
        email: string;
        firstName: string;
        lastName: string;
        fullName: string;
    }>;
    colleges?: string[]; // College IDs
}

export interface AssessmentWithDetailsForUser extends Omit<Assessment, 'numberOfQuestions' | 'isTaken' | 'assessmentResultId' | 'assessmentState'> {
    numberOfQuestions: number;
    isTaken: boolean;
    assessmentResultId?: string | null;
    assessmentState?: {
        status: 'in_progress' | 'paused' | 'failed';
        timeRemaining: number;
        canContinue: boolean;
        isExpired: boolean;
        startTime: string;
        responsesCount: number;
    } | null;
}


export interface UserAssessment extends Assessment {
    isTaken?: boolean;
    assessmentResultId?: string | null;
    assessmentState?: {
        status: 'in_progress' | 'paused' | 'failed';
        timeRemaining: number;
        canContinue: boolean;
        isExpired: boolean;
        startTime: string;
        responsesCount: number;
    } | null;
}

export enum AssessmentStatus {
    DRAFT = 'draft',
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    COMPLETED = 'completed'
}

export enum AssessmentType {
    MCQ = 'mcq',
    CODING = 'coding',
    MIXED = 'mixed'
}

// Form types
export interface CreateAssessmentData {
    title: string;
    description?: string;
    type: AssessmentType;
    instruction?: string;
    questions?: string[];
    questionsToCreate?: CreateQuestionInlineDto[];
    codingQuestions?: { _id: string, section: string, score: number }[];
    totalMarks?: number;
    duration: number;
    startDate?: string;
    endDate?: string;
    assignedUsers: string[] | 'all';
    invitedUsers?: string[];
    googleForm?: string;
    passPercentage?: number;
    showResultsToUsers?: boolean;
    colleges?: {
        _id: string;
        branches?: {
            _id: string;
            name: string;
        }[];
        year?: number[];
    }[];
}

export interface CreateQuestionInlineDto {
    text: string;
    type: QuestionTypeString;
    options: {
        text: string;
        isCorrect: boolean;
    }[];
    marks: number;
    explanation?: string;
}

export interface UpdateAssessmentData {
    title?: string;
    description?: string;
    type?: AssessmentType;
    instruction?: string;
    questions?: string[];
    questionsToCreate?: CreateQuestionInlineDto[];
    codingQuestions?: { _id: string, section: string, score: number }[];
    totalMarks?: number;
    duration?: number;
    startDate?: string;
    endDate?: string;
    assignedUsers?: string[] | 'all';
    invitedUsers?: string[]; // Email addresses of invited users
    status?: AssessmentStatus;
    isActive?: boolean;
    googleForm?: string; // Google Form URL for post-assessment feedback
    passPercentage?: number; // Pass percentage (0-100)
    colleges?: {
        _id: string;
        branches?: {
            _id: string;
            name: string;
        }[];
        year?: number[];
    }[];
    showResultsToUsers?: boolean;
}

// Query types
export interface AssessmentQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: AssessmentStatus;
    createdBy?: string;
    assignedUsers?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}