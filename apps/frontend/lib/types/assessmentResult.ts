import { Question } from './question';


export interface AssessmentInfo {
    _id: string;
    title: string;
    description: string;
    duration: number;
    googleForm?: string;
    showResultsToUsers?: boolean;
}

export interface UserInfo {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName?: string
}

export interface UserCollegeInfo {
    collegeName: string;
    collegeId: string;
    branchName: string;
    branchId: string;
    collegeYear: number;
}

export interface CodingQuestionResult {
    testId: string;
    section: string;
    isCorrect: boolean;
    sourceCode: string;
    marksObtained: number;
    score: number; // Total marks possible for this question
    languageId?: number;
    timeSpent: number;
    _id: string;
    createdAt: string;
    updatedAt: string;
}
// Assessment Result types
export interface AssessmentResult {
    _id: string;
    assessmentId: AssessmentInfo;
    userId: UserInfo;
    responses: Answer[];
    sectionScores: SectionScore[];
    codingQuestions?: CodingQuestionResult[];
    totalMarksObtained: number;
    totalMarksPossible: number;
    percentage: number;
    startTime: string;
    endTime?: string;
    duration: number;
    status: string;
    resumeTime?: string;
    timeRemaining: number;
    isDeleted?: boolean;
    type?: 'mcq' | 'coding' | 'mixed';
    createdAt: string;
    updatedAt: string;
}

export interface Answer {
    _id: string;
    questionId: Question | any; // This contains the actual question data (any for coding questions)
    section?: string;
    selectedOptions: string[]; // Array of selected option IDs or code submissions
    isCorrect: boolean;
    marksObtained: number;
    timeSpent: number;
}

// Helper type for the API response structure
export interface AssessmentResultResponse {
    success: boolean;
    message: string;
    data: AssessmentResult;
    timestamp: string;
}

export type AssessmentResultStatus = 'in_progress' | 'completed' | 'abandoned' | 'failed' | 'paused';

// Interface for section-wise scores
export interface SectionScore {
    sectionName: string;
    marksObtained: number;
    totalMarks: number;
    percentage: number;
    questionsCount: number;
}

// Enhanced assessment result with college information
export interface AssessmentResultWithCollegeInfo {
    _id: string;
    assessmentId: string;
    userId: string;
    totalMarksObtained: number;
    totalMarksPossible: number;
    percentage: number;
    status: string;
    startTime: string;
    endTime?: string;
    duration: number;
    createdAt: string;
    updatedAt: string;
    user: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        registrationNo: number;
        collegeName: string;
        branchName: string;
        collegeYear?: number;
    };
    assessment: {
        _id: string;
        title: string;
        description: string;
        allowedColleges: string[];
        totalMarks: number;
        duration: number;
    };
    responses: {
        _id: string;
        questionId: string;
        section?: string;
        selectedOptions: string[];
        isCorrect: boolean;
        marksObtained: number;
        timeSpent: number;
        question: {
            _id: string;
            text: string;
            type: string;
            section?: string;
            options: Array<{
                text: string;
                isCorrect?: boolean;
            }>;
            marks: number;
            explanation: string;
            correctAnswer: string[];
        } | null;
    }[];
    sectionScores?: SectionScore[];
    codingQuestions?: CodingQuestionResult[];
    type?: 'mcq' | 'coding' | 'mixed';
}



export interface AssessmentResponse {
    options: AssessmentOption[];
    questionId: AssessmentQuestion;
    section: string;
    selectedOptions: string[];
    marksObtained: number;
    timeSpent: number;
    _id: string;
}

export interface AssessmentOption {
    text: string;
    _id: string;
}

export interface AssessmentQuestion {
    _id: string;
    text: string;
    section: string;
    type: string;
    options: AssessmentOption[];
    marks: number;
    explanation: string;
}

export interface SectionScore {
    sectionName: string;
    marksObtained: number;
    totalMarks: number;
    questionsCount: number;
}