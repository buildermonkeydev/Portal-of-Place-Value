import mongoose, { Document } from "mongoose";

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




export interface IAssessment {
    _id: mongoose.Schema.Types.ObjectId | string;
    title: string;
    description?: string;
    type: AssessmentType;
    instruction?: string;
    questions: string[];
    codingQuestions: { _id: string, section: string, score: number }[],
    totalMarks: number;
    showResultsToUsers: boolean;
    colleges: {
        _id: string;
        branches?: {
            _id: string;
            name: string;
        }[];
        year?: number[];
    }[],
    duration: number;
    status: AssessmentStatus;
    startDate?: Date;
    endDate?: Date;
    createdBy: mongoose.Schema.Types.ObjectId | string; // Admin ID
    assignedUsers: string[]; // User IDs
    invitedUsers?: string[]; // Email addresses of invited users
    isActive: boolean;
    googleForm?: string;
    passPercentage?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAssessmentDocument extends Omit<IAssessment, '_id'>, Document { } 