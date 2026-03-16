import mongoose, { Schema, Document } from 'mongoose';
import { ICollege } from '../interface/College';


const collegeSchema = new Schema<ICollege>(
    {
        name: {
            type: String,
            required: [true, 'College name is required'],
            unique: true,
            trim: true,
            maxlength: [100, 'College name cannot exceed 100 characters'],
        },
        branches: [{
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Branch',
                required: true,
            },
            name: {
                type: String,
                required: [true, 'Branch name is required'],
                trim: true,
                maxlength: [100, 'Branch name cannot exceed 100 characters'],
            },
        }],
    },
    {
        timestamps: true,
    }
);

collegeSchema.index({ 'branches.name': 1 });

export const College = mongoose.model<ICollege>('College', collegeSchema);
