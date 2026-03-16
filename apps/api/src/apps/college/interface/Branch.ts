import mongoose, { Document } from "mongoose";

export interface IBranch extends Document {
    _id: mongoose.Types.ObjectId | string
    name: string;
}

export interface IBranches {
    _id: mongoose.Types.ObjectId | string
    name: string;
}