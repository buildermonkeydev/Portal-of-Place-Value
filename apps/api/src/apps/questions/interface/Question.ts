import mongoose, { Document } from "mongoose";

export enum QuestionType {
    SINGLE_CHOICE = 'single_choice',
    MULTIPLE_CHOICE = 'multiple_choice'
}

export interface IQuestionOption {
    text: string;
    isCorrect: boolean;
}

export interface IQuestion {
    _id: string;
    text: string;
    type: QuestionType;
    options: IQuestionOption[];
    marks: number;
    explanation?: string;
    section?: string;
    createdBy: mongoose.Schema.Types.ObjectId | string; // Admin ID
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IQuestionDocument extends Omit<IQuestion, '_id'>, Document { } 