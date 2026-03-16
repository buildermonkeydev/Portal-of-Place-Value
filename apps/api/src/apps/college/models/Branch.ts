import mongoose, { Schema } from 'mongoose';
import { IBranch } from '../interface/Branch';

const branchSchema = new Schema<IBranch>(
    {
        name: {
            type: String,
            required: [true, 'Branch name is required'],
            unique: true,
            trim: true,
            maxlength: [100, 'Branch name cannot exceed 100 characters'],
        },
    },
    {
        timestamps: true,
    }
);


export const Branch = mongoose.model<IBranch>('Branch', branchSchema); 