import mongoose, { Document } from "mongoose";
import { IQuestion } from "../../questions/interface/Question";

export interface IQuestionResponse {
    questionId: mongoose.Schema.Types.ObjectId | string;
    section?: string;
    selectedOptions: string[];
    isCorrect: boolean;
    marksObtained: number;
    timeSpent: number;
}

export interface ISectionScore {
    sectionName: string;
    marksObtained: number;
    totalMarks: number;
    percentage: number;
    questionsCount: number;
}

export interface IUserInfo {
    collegeName: string;
    collegeId: mongoose.Schema.Types.ObjectId | string;
    branchName: string;
    branchId: mongoose.Schema.Types.ObjectId | string;
    collegeYear: number;
}


export interface ICodingQuestionResponse {
    testId: mongoose.Schema.Types.ObjectId | string;
    section: string;
    sourceCode?: string;
    languageId?: number;
    isCorrect?: boolean;
    marksObtained?: number;
    timeSpent?: number;
    score: number;

}
export interface IAssessmentResult {
    _id: string;
    assessmentId: mongoose.Schema.Types.ObjectId | string;
    userId: mongoose.Schema.Types.ObjectId | string;
    userInfo: IUserInfo;
    responses: IQuestionResponse[];
    sectionScores: ISectionScore[];
    totalMarksObtained: number;
    totalMarksPossible: number;
    codingQuestions: ICodingQuestionResponse[]
    percentage: number;
    startTime: Date;
    endTime?: Date;
    duration: number;
    status: 'in_progress' | 'completed' | 'abandoned' | 'failed' | 'paused';
    resumeTime?: Date;
    timeRemaining: number;
    type?: 'mcq' | 'coding' | 'mixed';
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAssessmentResultDocument extends Omit<IAssessmentResult, '_id'>, Document {

}



export interface IQuestionResponseWithQuestion {
    questionId: IQuestion
    section: string;
    selectedOptions: string[];
    isCorrect: boolean;
    marksObtained: number;
    timeSpent: number;
}
