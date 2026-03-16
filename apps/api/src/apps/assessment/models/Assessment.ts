import mongoose, { Schema } from 'mongoose';
import { AssessmentStatus, AssessmentType, IAssessmentDocument } from '../../../core/types';
import { toIndianTime } from '../../../utils/dateUtils';

const assessmentSchema = new Schema<IAssessmentDocument>(
    {
        title: {
            type: String,
            required: [true, 'Assessment title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            trim: true,
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
        type: {
            type: String,
            enum: Object.values(AssessmentType),
            default: AssessmentType.MCQ,
            required: [true, 'Assessment type is required'],
        },
        instruction: {
            type: String,
            trim: true,
        },
        questions: [{
            type: Schema.Types.ObjectId,
            ref: 'Question',
        }],
        codingQuestions: [{
            _id: {
                type: Schema.Types.ObjectId,
                ref: 'Test',
                required: true,
            },
            section: {
                type: String,
                required: true,
                trim: true,
            },
            score: {
                type: Number,
                required: true,
                min: [0, 'Score must be at least 0'],
            },
        }],
        invitedUsers: [{
            type: String,
            trim: true,
        }],
        totalMarks: {
            type: Number,
            required: [true, 'Total marks are required'],
            min: [1, 'Total marks must be at least 1'],
        },
        duration: {
            type: Number,
            required: [true, 'Duration is required'],
            min: [1, 'Duration must be at least 1 minute'],
            max: [480, 'Duration cannot exceed 8 hours (480 minutes)'],
        },
        status: {
            type: String,
            enum: Object.values(AssessmentStatus),
            default: AssessmentStatus.DRAFT,
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Creator ID is required'],
        },
        assignedUsers: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        isActive: {
            type: Boolean,
            default: true,
        },
        googleForm: {
            type: String,
            trim: true,
        },
        passPercentage: {
            type: Number,
            default: 60,
            min: [0, 'Pass percentage must be at least 0'],
            max: [100, 'Pass percentage cannot exceed 100'],
        },
        showResultsToUsers: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes for better query performance
assessmentSchema.index({ createdBy: 1 });
assessmentSchema.index({ status: 1 });
assessmentSchema.index({ isActive: 1 });
assessmentSchema.index({ assignedUsers: 1 });
assessmentSchema.index({ startDate: 1, endDate: 1 });

// Pre-save middleware to ensure dates are in Indian time
assessmentSchema.pre('save', function (next) {
    if (this.startDate) {
        this.startDate = toIndianTime(this.startDate);
    }
    if (this.endDate) {
        this.endDate = toIndianTime(this.endDate);
    }
    next();
});

// Pre-update middleware to ensure dates are in Indian time
assessmentSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function (next) {
    const update = this.getUpdate() as any;
    if (update.startDate) {
        update.startDate = toIndianTime(update.startDate);
    }
    if (update.endDate) {
        update.endDate = toIndianTime(update.endDate);
    }
    next();
});

// Virtual for calculating total marks from questions
assessmentSchema.virtual('calculatedTotalMarks').get(function () {
    // This would be populated when needed
    return this.totalMarks;
});

export const Assessment = mongoose.model<IAssessmentDocument>('Assessment', assessmentSchema); 