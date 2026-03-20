import mongoose, { Document } from "mongoose";

// Remove _id from Document and redeclare with union type
export interface IBranch extends Omit<Document, '_id'> {
    _id: mongoose.Types.ObjectId | string;
    name: string;
}

// Keep IBranches as is
export interface IBranches {
    _id: mongoose.Types.ObjectId | string;
    name: string;
}