import mongoose, { Schema } from 'mongoose';
import { IQuestionDocument, QuestionType } from '../interface/Question';


const questionOptionSchema = new Schema({
    text: {
        type: String,
        required: [true, 'Option text is required'],
        trim: true,
        maxlength: [500, 'Option text cannot exceed 500 characters'],
    },
    isCorrect: {
        type: Boolean,
        required: [true, 'Correct option flag is required'],
        default: false,
    },
});

const questionSchema = new Schema<IQuestionDocument>(
    {
        text: {
            type: String,
            required: [true, 'Question text is required'],
            trim: true,
            maxlength: [1000, 'Question text cannot exceed 1000 characters'],
        },
        section: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            enum: Object.values(QuestionType),
            required: [true, 'Question type is required'],
        },
        options: {
            type: [questionOptionSchema],
            required: [true, 'Question options are required'],
            validate: {
                validator: function (options: any[]) {
                    if (options.length < 2) {
                        return false;
                    }

                    const correctOptions = options.filter(opt => opt.isCorrect);
                    if (correctOptions.length === 0) {
                        return false;
                    }

                    // For single choice questions, only one option can be correct
                    if (this.type === QuestionType.SINGLE_CHOICE && correctOptions.length > 1) {
                        return false;
                    }

                    // For multiple choice questions, multiple options can be correct (but at least one)
                    if (this.type === QuestionType.MULTIPLE_CHOICE && correctOptions.length < 1) {
                        return false;
                    }

                    return true;
                },
                message: 'Question must have at least 2 options and at least one correct option. Single choice questions can have only one correct option. Multiple choice questions can have multiple correct options.',
            },
        },
        marks: {
            type: Number,
            required: [true, 'Marks are required'],
            min: [1, 'Marks must be at least 1'],
            max: [100, 'Marks cannot exceed 100'],
        },
        explanation: {
            type: String,
            trim: true,
            maxlength: [1000, 'Explanation cannot exceed 1000 characters'],
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
questionSchema.index({ createdBy: 1 });
questionSchema.index({ type: 1 });
questionSchema.index({ isActive: 1 });
questionSchema.index({ createdAt: -1 });

export const Question = mongoose.model<IQuestionDocument>('Question', questionSchema); 