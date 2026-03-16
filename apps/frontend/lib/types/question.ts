// Question types
export interface QuestionOption {
    _id: string;
    text: string;
    isCorrect: boolean;
}

export interface CreateQuestionOption {
    text: string;
    isCorrect: boolean;
}

export interface Question {
    _id: string;
    text: string;
    type: QuestionTypeString;
    options: QuestionOption[];
    marks: number;
    explanation?: string;
    section?: string;
    createdBy: string | { firstName: string; lastName: string; email: string };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export enum QuestionType {
    SINGLE_CHOICE = 'single_choice',
    MULTIPLE_CHOICE = 'multiple_choice'
}

// String literal types that match the backend response
export type QuestionTypeString = 'single_choice' | 'multiple_choice';

// Form types
export interface CreateQuestionData {
    text: string;
    type: QuestionType;
    options: CreateQuestionOption[];
    marks: number;
    explanation?: string;
    section?: string;
}

export interface UpdateQuestionData {
    text?: string;
    type?: QuestionType;
    options?: CreateQuestionOption[];
    marks?: number;
    explanation?: string;
    section?: string;
    isActive?: boolean;
}

// Query types
export interface QuestionQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    type?: QuestionType;
    isActive?: boolean;
    createdBy?: string;
} 