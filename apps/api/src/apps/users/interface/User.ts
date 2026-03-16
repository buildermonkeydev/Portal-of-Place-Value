import mongoose, { Document } from "mongoose";

// User types
export interface IUser {
    _id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    mobileNumber: string;
    college: {
        _id: mongoose.Types.ObjectId | string;
        name: string;
    };
    branch: {
        _id: mongoose.Types.ObjectId | string;
        name: string;
    };
    collegeYear: number;
    registrationNo: string;
    role: UserRole;
    isActive: boolean;
    isEmailVerified: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;
    emailVerifiedAt?: Date;
    passwordChangedAt?: Date;
    lastLogin?: Date;
    avatar?: string;
    createdAt: Date;
    updatedAt: Date;
}

export enum UserRole {
    STUDENT = 'student',
    ADMIN = 'admin'
}

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
    _id: Document['_id'];
    comparePassword(candidatePassword: string): Promise<boolean>;
    generateEmailVerificationToken(): string;
    verifyEmailToken(token: string): boolean;
    toJSON(): any;
}