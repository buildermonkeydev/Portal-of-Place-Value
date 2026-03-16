import mongoose, { Schema } from 'mongoose';
import { ITestDocument, TestDifficulty, TestStatus } from '../interface/Test';

const testInputSchema = new Schema({
    value: {
        type: String,
        required: [true, 'Input value is required'],
        trim: true,
    },
    order: {
        type: Number,
        required: [true, 'Input order is required'],
        min: [1, 'Input order must be at least 1'],
    },
    inputFormat: {
        type: String,
        enum: ['array', 'string', 'number', 'object', 'mixed'],
        default: 'array',
    },
    applicableLanguages: [{
        type: Number,
    }],
});

const testCaseSchema = new Schema({
    inputs: {
        type: [testInputSchema],
        required: [true, 'Test case inputs are required'],
        validate: {
            validator: function (inputs: any[]) {
                return inputs.length > 0;
            },
            message: 'At least one input is required for each test case',
        },
    },
    expectedOutput: {
        type: String,
        required: [true, 'Test case expected output is required'],
        trim: true,
    },
    isHidden: {
        type: Boolean,
        default: false,
    },
    outputFormat: {
        type: String,
        enum: ['array', 'string', 'number', 'boolean', 'object'],
        default: 'array',
    },
});

const testSchema = new Schema<ITestDocument>(
    {
        title: {
            type: String,
            required: [true, 'Test title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        colleges: [{
            _id: {
                type: Schema.Types.ObjectId,
                ref: 'College',
                required: true,
            },
            branches: [{
                _id: {
                    type: String,
                    required: true,
                },
                name: {
                    type: String,
                    required: true,
                },
            }],
            year: [{
                type: Number,
            }],
        }],
        assignedUsers: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        description: {
            type: String,
            required: false,
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        problemStatement: {
            type: String,
            required: [true, 'Problem statement is required'],
            trim: true,
            maxlength: [10000, 'Problem statement cannot exceed 10000 characters'],
        },
        difficulty: {
            type: String,
            enum: Object.values(TestDifficulty),
            required: [true, 'Difficulty is required'],
        },
        tags: [{
            type: String,
            trim: true,
            maxlength: [50, 'Tag cannot exceed 50 characters'],
        }],
        testCases: {
            type: [testCaseSchema],
            required: [true, 'Test cases are required'],
            validate: {
                validator: function (testCases: any[]) {
                    return testCases.length > 0;
                },
                message: 'At least one test case is required',
            },
        },
        constraints: {
            type: String,
            required: [true, 'Constraints are required'],
            trim: true,
            maxlength: [2000, 'Constraints cannot exceed 2000 characters'],
        },
        allowedLanguages: [{
            type: Number,
            required: [true, 'Language ID is required'],
        }],
        starterCode: {
            type: Map,
            of: String,
            default: new Map(),
        },
        executeCodeName: {
            type: String,
            required: [true, 'Execute code name is required'],
            trim: true,
            maxlength: [100, 'Execute code name cannot exceed 100 characters'],
        },
        status: {
            type: String,
            enum: Object.values(TestStatus),
            default: TestStatus.DRAFT,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Creator ID is required'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes for better query performance
testSchema.index({ title: 'text', description: 'text', tags: 'text' });
testSchema.index({ difficulty: 1 });
testSchema.index({ status: 1 });
testSchema.index({ createdBy: 1 });
testSchema.index({ isActive: 1 });

// Virtual for public test cases (non-hidden)
testSchema.virtual('publicTestCases').get(function () {
    return this.testCases ? this.testCases.filter((testCase: any) => !testCase.isHidden) : [];
});

// Virtual for hidden test cases count
testSchema.virtual('hiddenTestCasesCount').get(function () {
    return this.testCases ? this.testCases.filter((testCase: any) => testCase.isHidden).length : 0;
});

// Export the model with overwrite protection
export const Test = mongoose.models.Test || mongoose.model<ITestDocument>('Test', testSchema);
