import mongoose, { Schema } from 'mongoose';
import { IAssessmentResultDocument } from '../interface/AssessmentResult';

const questionResponseSchema = new Schema({
    questionId: {
        type: Schema.Types.ObjectId,
        ref: 'Question',
        required: [true, 'Question ID is required'],
    },
    section: {
        type: String,
    },
    selectedOptions: [{
        type: String,
        // required: [true, 'Selected options are required'],
    }],
    isCorrect: {
        type: Boolean,
        // required: [true, 'Correct flag is required'],
    },
    marksObtained: {
        type: Number,
        default: 0,

    },
    timeSpent: {
        type: Number,
        // required: [true, 'Time spent is required'],
        min: [0, 'Time spent cannot be negative'],
    },
});

const sectionScoreSchema = new Schema({
    sectionName: {
        type: String,
        required: [true, 'Section name is required'],
    },
    marksObtained: {
        type: Number,
        required: [true, 'Marks obtained is required'],
        min: [0, 'Marks obtained cannot be negative'],
    },
    totalMarks: {
        type: Number,
        required: [true, 'Total marks is required'],
        min: [0, 'Total marks cannot be negative'],
    },
    percentage: {
        type: Number,
        required: [true, 'Percentage is required'],
        min: [0, 'Percentage cannot be negative'],
        max: [100, 'Percentage cannot exceed 100'],
    },
    questionsCount: {
        type: Number,
        required: [true, 'Questions count is required'],
        min: [0, 'Questions count cannot be negative'],
    },
});

const codingQuestionResponseSchema = new Schema({
    testId: {
        type: Schema.Types.ObjectId,
        ref: 'Test',
    },
    section: {
        type: String,
    },
    sourceCode: {
        type: String,
        default: '',
    },
    languageId: {
        type: Number,
    },
    isCorrect: {
        type: Boolean,
    },
    marksObtained: {
        type: Number,
    },
    timeSpent: {
        type: Number,
    },
    score: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

const assessmentResultSchema = new Schema<IAssessmentResultDocument>(
    {
        assessmentId: {
            type: Schema.Types.ObjectId,
            ref: 'Assessment',
            required: [true, 'Assessment ID is required'],
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        userInfo: {
            collegeName: {
                type: String,
                required: [true, 'College name is required'],
            },
            collegeId: {
                type: Schema.Types.ObjectId,
                required: [true, 'College ID is required'],
            },
            branchName: {
                type: String,
                required: [true, 'Branch name is required'],
            },
            branchId: {
                type: Schema.Types.ObjectId,
                required: [true, 'Branch ID is required'],
            },
            collegeYear: {
                type: Number,
                required: [true, 'College year is required'],
                min: [1, 'College year must be at least 1'],
                max: [5, 'College year cannot exceed 5'],
            },
        },
        codingQuestions: [codingQuestionResponseSchema],
        responses: [questionResponseSchema],
        sectionScores: [sectionScoreSchema],
        totalMarksObtained: {
            type: Number,
            required: [true, 'Total marks obtained are required'],
            min: [0, 'Total marks obtained cannot be negative'],
        },
        totalMarksPossible: {
            type: Number,
            required: [true, 'Total marks possible are required'],
            min: [0, 'Total marks possible cannot be negative'],
        },
        percentage: {
            type: Number,
            required: [true, 'Percentage is required'],
            min: [0, 'Percentage cannot be negative'],
            max: [100, 'Percentage cannot exceed 100'],
        },
        startTime: {
            type: Date,
            required: [true, 'Start time is required'],
            default: Date.now,
        },
        endTime: {
            type: Date,
        },
        duration: {
            type: Number,
            required: [true, 'Duration is required'],
            min: [0, 'Duration cannot be negative'],
        },
        status: {
            type: String,
            enum: ['in_progress', 'completed', 'abandoned', 'failed', 'expired'],
            default: 'in_progress',
        },
        resumeTime: {
            type: Date,
        },
        timeRemaining: {
            type: Number,
            required: [true, 'Time remaining is required'],
            min: [0, 'Time remaining cannot be negative'],
        },
        type: {
            type: String,
            enum: ['mcq', 'coding', 'mixed'],
            default: 'mcq',
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

assessmentResultSchema.index({ assessmentId: 1 });
assessmentResultSchema.index({ userId: 1 });
assessmentResultSchema.index({ status: 1 });
assessmentResultSchema.index({ createdAt: -1 });


assessmentResultSchema.index(
    { userId: 1, assessmentId: 1 },
    {
        unique: true,
        name: 'unique_user_assessment',
        partialFilterExpression: { isDeleted: { $ne: true } }
    }
);




export const AssessmentResult = mongoose.model<IAssessmentResultDocument>('AssessmentResult', assessmentResultSchema); 