import { BaseRepository, QueryOptions } from "../../../core/types";
import { IBranch, IBranches } from "../interface/Branch";
import { ICollege } from "../interface/College";
import { College } from "../models/College";

export class CollegeRepository implements BaseRepository<ICollege> {
    async create(data: Partial<ICollege>): Promise<ICollege> {
        const college = new College(data);
        return await college.save();
    }

    async findById(id: string): Promise<ICollege | null> {
        return await College.findById(id);
    }

    async findOne(filter: any): Promise<ICollege | null> {
        return await College.findOne(filter);
    }

    async findMany(filter: any = {}, options: QueryOptions = {}): Promise<ICollege[]> {
        const { page = 1, limit = 10, sort, search = '' } = options;

        const queryFilter: any = { ...filter };
        if (search) {
            queryFilter.$or = [
                { name: { $regex: new RegExp(search, 'i') } },
                { 'branches.name': { $regex: new RegExp(search, 'i') } }
            ];
        }

        const query = College.find(queryFilter);

        if (sort) {
            query.sort(sort);
        }

        if (page && limit) {
            const skip = (page - 1) * limit;
            query.skip(skip).limit(limit);
        }

        return await query.exec();
    }

    async update(id: string, data: Partial<ICollege>): Promise<ICollege | null> {
        return await College.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async delete(id: string): Promise<boolean> {
        const result = await College.findByIdAndDelete(id);
        return !!result;
    }

    async count(filter?: any): Promise<number> {
        return await College.countDocuments(filter);
    }

    async findByName(name: string): Promise<ICollege | null> {
        return await College.findOne({ name: { $regex: new RegExp(name, 'i') } });
    }

    async findAll(query: any = {}, options: any = {}): Promise<{ data: ICollege[]; total: number }> {
        const { page = 1, limit = 10, search = '', sortBy = 'name', sortOrder = 'asc' } = options;

        const filter: any = {};
        if (search) {
            filter.$or = [
                { name: { $regex: new RegExp(search, 'i') } },
                { 'branches.name': { $regex: new RegExp(search, 'i') } }
            ];
        }

        const sort: any = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            College.find(filter).sort(sort).skip(skip).limit(limit),
            College.countDocuments(filter)
        ]);

        return { data, total };
    }

    async addBranchToCollege(collegeId: string, branchName: string): Promise<ICollege | null> {
        return await College.findByIdAndUpdate(
            collegeId,
            { $push: { branches: { name: branchName } } },
            { new: true, runValidators: true }
        );
    }

    async removeBranchFromCollege(collegeId: string, branchId: string): Promise<ICollege | null> {
        return await College.findByIdAndUpdate(
            collegeId,
            { $pull: { branches: { _id: branchId } } },
            { new: true }
        );
    }

    async updateBranchInCollege(collegeId: string, branchId: string, branchName: string): Promise<ICollege | null> {
        return await College.findOneAndUpdate(
            { _id: collegeId, 'branches._id': branchId },
            { $set: { 'branches.$.name': branchName } },
            { new: true, runValidators: true }
        );
    }

    async bulkCreate(colleges: Partial<ICollege>[]): Promise<{ success: boolean; data?: ICollege[]; error?: string }> {
        try {
            const data = await College.insertMany(colleges);
            return { success: true, data: data as ICollege[] };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async findCollegesWithBranches(): Promise<ICollege[]> {
        return await College.find().select('name branches');
    }

    async findBranchesByCollege(collegeId: string): Promise<IBranches[]> {
        const college = await College.findById(collegeId).select('branches');
        return (college?.branches as IBranch[])?.map((branch: IBranch): IBranches => ({
            _id: branch._id?.toString() || "",
            name: branch.name || ""
        })) || [];
    }
} 