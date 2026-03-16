import mongoose, { Document } from "mongoose";
import { IBranch, IBranches } from "./Branch";


export interface ICollege extends Document {
    name: string;
    branches: Partial<IBranches>[]
}