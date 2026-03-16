import mongoose, { Schema } from 'mongoose';
import { ITestSubmissionDocument } from '../interface/Test';

const testResultSchema = new Schema({
    testCaseId: {
        type: String,
        required: [true, 'Test case ID is required'],
    },
    passed: {
        type: Boolean,
        required: [true, 'Test result passed status is required'],
    },
    actualOutput: {
        type: String,
        trim: true,
    },
    expectedOutput: {
        type: String,
        required: [true, 'Expected output is required'],
        trim: true,
    },
    executionTime: {
        type: Number,
        min: [0, 'Execution time cannot be negative'],
    },
    memoryUsed: {
        type: Number,
        min: [0, 'Memory used cannot be negative'],
    },
    errorMessage: {
        type: String,
        trim: true,
    },
});

const testSubmissionSchema = new Schema<ITestSubmissionDocument>(
    {
        testId: {
            type: Schema.Types.ObjectId,
            ref: 'Test',
            required: [true, 'Test ID is required'],
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        sourceCode: {
            type: String,
            required: [true, 'Source code is required'],
            trim: true,
        },
        languageId: {
            type: Number,
            required: [true, 'Language ID is required'],
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending',
        },
        testResults: {
            type: [testResultSchema],
            required: [true, 'Test results are required'],
        },
        totalTestCases: {
            type: Number,
            required: [true, 'Total test cases count is required'],
            min: [0, 'Total test cases cannot be negative'],
        },
        passedTestCases: {
            type: Number,
            required: [true, 'Passed test cases count is required'],
            min: [0, 'Passed test cases cannot be negative'],
        },
        score: {
            type: Number,
            required: [true, 'Score is required'],
            min: [0, 'Score cannot be negative'],
            max: [100, 'Score cannot exceed 100'],
        },
        executionTime: {
            type: Number,
            required: [true, 'Execution time is required'],
            min: [0, 'Execution time cannot be negative'],
        },
        submittedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes for better query performance
testSubmissionSchema.index({ testId: 1, userId: 1 });
testSubmissionSchema.index({ userId: 1 });
testSubmissionSchema.index({ testId: 1 });
testSubmissionSchema.index({ submittedAt: -1 });
testSubmissionSchema.index({ score: -1 });

// Virtual for pass/fail status
testSubmissionSchema.virtual('isPassed').get(function () {
    return this.passedTestCases === this.totalTestCases;
});

// Virtual for completion percentage
testSubmissionSchema.virtual('completionPercentage').get(function () {
    return this.totalTestCases > 0 ? (this.passedTestCases / this.totalTestCases) * 100 : 0;
});

// Export the model with overwrite protection
export const TestSubmission = mongoose.models.TestSubmission || mongoose.model<ITestSubmissionDocument>('TestSubmission', testSubmissionSchema);
