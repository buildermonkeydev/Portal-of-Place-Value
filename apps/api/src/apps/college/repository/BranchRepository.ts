import { BaseRepository, QueryOptions } from "../../../core/types";
import { IBranch } from "../interface/Branch";
import { Branch } from "../models/Branch";

export class BranchRepository implements BaseRepository<IBranch> {
    async create(data: Partial<IBranch>): Promise<IBranch> {
        const branch = new Branch(data);
        return await branch.save();
    }

    async findById(id: string): Promise<IBranch | null> {
        return await Branch.findById(id);
    }

    async findOne(filter: any): Promise<IBranch | null> {
        return await Branch.findOne(filter);
    }

    async findMany(filter: any = {}, options: QueryOptions = {}): Promise<IBranch[]> {
        const { page = 1, limit = 10, sort, search = '' } = options;

        const queryFilter: any = { ...filter };
        if (search) {
            queryFilter.name = { $regex: new RegExp(search, 'i') };
        }

        const query = Branch.find(queryFilter);

        if (sort) {
            query.sort(sort);
        }

        if (page && limit) {
            const skip = (page - 1) * limit;
            query.skip(skip).limit(limit);
        }

        return await query.exec();
    }

    async update(id: string, data: Partial<IBranch>): Promise<IBranch | null> {
        return await Branch.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async delete(id: string): Promise<boolean> {
        const result = await Branch.findByIdAndDelete(id);
        return !!result;
    }

    async count(filter?: any): Promise<number> {
        return await Branch.countDocuments(filter);
    }

    async findByName(name: string): Promise<IBranch | null> {
        return await Branch.findOne({ name: { $regex: new RegExp(name, 'i') } });
    }

    async findAll(query: any = {}, options: any = {}): Promise<{ data: IBranch[]; total: number }> {
        const { page = 1, limit = 10, search = '', sortBy = 'name', sortOrder = 'asc' } = options;

        const filter: any = {};
        if (search) {
            filter.name = { $regex: new RegExp(search, 'i') };
        }

        const sort: any = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            Branch.find(filter).sort(sort).skip(skip).limit(limit),
            Branch.countDocuments(filter)
        ]);

        return { data, total };
    }

    async bulkCreate(branches: Partial<IBranch>[]): Promise<{ success: boolean; data?: IBranch[]; error?: string }> {
        try {
            const data = await Branch.insertMany(branches);
            return { success: true, data: data as IBranch[] };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async findBranchesByNames(names: string[]): Promise<IBranch[]> {
        return await Branch.find({ name: { $in: names } });
    }
} 