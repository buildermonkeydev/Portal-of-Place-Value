import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUserDocument, UserRole } from '../interface/User';
import crypto from 'crypto';

const userSchema = new Schema<IUserDocument>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters long'],
            select: false, // Don't include password in queries by default
        },
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
            maxlength: [50, 'First name cannot exceed 50 characters'],
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
            maxlength: [50, 'Last name cannot exceed 50 characters'],
        },
        mobileNumber: {
            type: String,
            required: [true, 'Mobile number is required'],
            trim: true,
            match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number'],
        },
        college: {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'College',
                required: function (this: IUserDocument) {
                    return this.role === UserRole.STUDENT;
                },
            },
            name: {
                type: String,
                required: function (this: IUserDocument) {
                    return this.role === UserRole.STUDENT;
                },
                trim: true,
                maxlength: [100, 'College name cannot exceed 100 characters'],
            },
        },
        branch: {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Branch',
                required: function (this: IUserDocument) {
                    return this.role === UserRole.STUDENT;
                },
            },
            name: {
                type: String,
                required: function (this: IUserDocument) {
                    return this.role === UserRole.STUDENT;
                },
                trim: true,
                maxlength: [100, 'Branch name cannot exceed 100 characters'],
            },
        },
        collegeYear: {
            type: Number,
            required: function (this: IUserDocument) {
                return this.role === UserRole.STUDENT;
            },
            min: [1, 'College year must be at least 1'],
            max: [4, 'College year cannot exceed 4'],
        },
        registrationNo: {
            type: String,
            required: function (this: IUserDocument) {
                return this.role === UserRole.STUDENT;
            },
            unique: true,
            trim: true,
            match: [/^[A-Za-z0-9]+$/, 'Registration number must contain only letters and numbers'],
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.STUDENT,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date,
        },
        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        emailVerificationToken: {
            type: String,
        },
        emailVerificationExpires: {
            type: Date,
        },
        emailVerifiedAt: {
            type: Date,
        },
        passwordChangedAt: {
            type: Date,
        },
        lastLogin: {
            type: Date,
        },
        avatar: {
            type: String,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for full name
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// userSchema.index({ email: 1 });
userSchema.index({ isDeleted: 1 });
// userSchema.index({ registrationNo: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'college._id': 1 });
userSchema.index({ 'branch._id': 1 });
userSchema.index({ collegeYear: 1 });
userSchema.index({ isEmailVerified: 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ lastLogin: 1 });

// Compound indexes for common query patterns
userSchema.index({ 'college._id': 1, 'branch._id': 1, collegeYear: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ email: 1, isActive: 1 });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);

        this.passwordChangedAt = new Date();

        next();
    } catch (error) {
        next(error as Error);
    }
});

userSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

userSchema.methods['comparePassword'] = async function (candidatePassword: string): Promise<boolean> {
    try {
        return await bcrypt.compare(candidatePassword, this['password']);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

userSchema.methods['toJSON'] = function () {
    const userObject = this['toObject']();
    delete userObject.password;
    return userObject;
};

userSchema.methods['generateEmailVerificationToken'] = function (): string {
    const verificationToken = crypto.randomBytes(32).toString('hex');

    this['emailVerificationToken'] = verificationToken;
    this['emailVerificationExpires'] = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return verificationToken;
};

// Verify email verification token
userSchema.methods['verifyEmailToken'] = function (token: string): boolean {
    if (this['emailVerificationToken'] !== token) {
        return false;
    }

    if (this['emailVerificationExpires'] && this['emailVerificationExpires'] < new Date()) {
        return false;
    }

    this['isEmailVerified'] = true;
    this['emailVerifiedAt'] = new Date();
    this['emailVerificationToken'] = undefined;
    this['emailVerificationExpires'] = undefined;

    return true;
};


userSchema.statics['findActiveUsers'] = function () {
    return this.find({ isActive: true });
};

export interface IUserModel extends mongoose.Model<IUserDocument> {
    findActiveUsers(): Promise<IUserDocument[]>;
}

export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema); 