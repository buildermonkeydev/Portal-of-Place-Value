import { User } from '../models/User';
import { BaseRepository, IUserDocument, QueryOptions, UserRole } from '../../../core/types';
import { IBranch } from '../../college/interface/Branch';
import { logger } from '../../../utils/logger';
import { College } from '../../college/models/College';
import { ClientSession , FlattenMaps } from 'mongoose';


export class UserRepository implements BaseRepository<IUserDocument> {
    /**
     * Helper method to apply soft-delete filter to query filters.
     * By default, excludes soft-deleted users (isDeleted !== true) unless explicitly specified.
     * 
     * @param filter - The filter object to apply the soft-delete filter to
     * @returns The filter with soft-delete filter applied if not already specified
     */
    private applySoftDeleteFilter(filter: any): any {
        const finalFilter = { ...filter };
        if (finalFilter.isDeleted === undefined) {
            finalFilter.isDeleted = { $ne: true };
        }
        return finalFilter;
    }

    async create(data: Partial<IUserDocument>): Promise<IUserDocument> {
        try {
            const user = new User(data);
            const savedUser = await user.save();
            logger.info(`User created with ID: ${savedUser._id}`);
            return savedUser;
        } catch (error) {
            logger.error('Error creating user:', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async findById(id: string): Promise<IUserDocument | null> {
        try {
            const filter = this.applySoftDeleteFilter({ _id: id });
            const user = await User.findOne(filter).select('+password');
            return user;
        } catch (error) {
            logger.error('Error finding user by ID', `id: ${id}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async findOne(filter: any): Promise<IUserDocument | null> {
        try {
            const finalFilter = this.applySoftDeleteFilter(filter);
            const user = await User.findOne(finalFilter).select('+password');
            return user;
        } catch (error) {
            logger.error('Error finding user', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async findMany(filter: any = {}, options: QueryOptions = {}): Promise<IUserDocument[]> {
        try {
            const { sort = { createdAt: -1 }, select, populate, search } = options;

            // Build the complete filter combining original filter with search
            let finalFilter = this.applySoftDeleteFilter(filter);

            if (search) {
                // Ensure search is a valid string to prevent casting errors
                if (typeof search === 'string' && search.trim() && search !== '{}' && search !== 'null' && search !== 'undefined') {
                    const searchTerm = search.trim();
                    const searchConditions: any[] = [
                        { firstName: { $regex: searchTerm, $options: 'i' } },
                        { lastName: { $regex: searchTerm, $options: 'i' } },
                        { email: { $regex: searchTerm, $options: 'i' } },
                        { 'college.name': { $regex: searchTerm, $options: 'i' } },
                        { 'branch.name': { $regex: searchTerm, $options: 'i' } },
                    ];

                    // Add numeric search conditions if the search term is a valid number
                    const searchNumber = Number(searchTerm);
                    if (!isNaN(searchNumber)) {
                        searchConditions.push(
                            { registrationNo: searchNumber },
                            { collegeYear: searchNumber }
                        );
                    }

                    const searchFilter = { $or: searchConditions };

                    // If there's an existing $or in the filter, combine them properly
                    if (finalFilter.$or) {
                        finalFilter = {
                            $and: [finalFilter, searchFilter]
                        };
                    } else {
                        finalFilter = { ...finalFilter, ...searchFilter };
                    }
                }
                // If search is not a valid string, ignore it to prevent casting errors
            }

            // Build the query with proper chaining
            let query = User.find(finalFilter);

            // Apply sorting
            query = query.sort(sort);

            // Apply field selection
            if (select) {
                query = query.select<IUserDocument>(select);
            }

            // Apply population
            if (populate) {
                if (Array.isArray(populate)) {
                    populate.forEach(field => {
                        query = query.populate(field);
                    });
                } else {
                    query = query.populate(populate);
                }
            }

            const users = await query.exec();
            return users as IUserDocument[];
        } catch (error) {
            logger.error('Error finding users', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async findManyWithPagination(filter: any = {}, options: QueryOptions = {}): Promise<{
        users: IUserDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        try {
            const { page = 1, limit = 10, sort = { createdAt: -1 }, select, populate, search } = options;

            // Build the complete filter combining original filter with search
            let finalFilter = this.applySoftDeleteFilter(filter);

            if (search) {
                // Ensure search is a valid string to prevent casting errors
                if (typeof search === 'string' && search.trim() && search !== '{}' && search !== 'null' && search !== 'undefined') {
                    const searchTerm = search.trim();
                    const searchConditions: any[] = [
                        { firstName: { $regex: searchTerm, $options: 'i' } },
                        { lastName: { $regex: searchTerm, $options: 'i' } },
                        { email: { $regex: searchTerm, $options: 'i' } },
                        { 'college.name': { $regex: searchTerm, $options: 'i' } },
                        { 'branch.name': { $regex: searchTerm, $options: 'i' } },
                    ];

                    // Add numeric search conditions if the search term is a valid number
                    const searchNumber = Number(searchTerm);
                    if (!isNaN(searchNumber)) {
                        searchConditions.push(
                            { registrationNo: searchNumber },
                            { collegeYear: searchNumber }
                        );
                    }

                    const searchFilter = { $or: searchConditions };

                    // If there's an existing $or in the filter, combine them properly
                    if (finalFilter.$or) {
                        finalFilter = {
                            $and: [finalFilter, searchFilter]
                        };
                    } else {
                        finalFilter = { ...finalFilter, ...searchFilter };
                    }
                }
                // If search is not a valid string, ignore it to prevent casting errors
            }

            // Get total count for pagination
            const total = await User.countDocuments(finalFilter);

            // Build the query with proper chaining
            let query = User.find(finalFilter);

            // Apply pagination
            const skip = (page - 1) * limit;
            query = query.skip(skip).limit(limit);

            // Apply sorting
            query = query.sort(sort);

            // Apply field selection
            if (select) {
                query = query.select<IUserDocument>(select);
            }

            // Apply population
            if (populate) {
                if (Array.isArray(populate)) {
                    populate.forEach(field => {
                        query = query.populate(field);
                    });
                } else {
                    query = query.populate(populate);
                }
            }

            const users = await query.exec();
            const totalPages = Math.ceil(total / limit);

            return {
                users: users as IUserDocument[],
                total,
                page,
                limit,
                totalPages
            };
        } catch (error) {
            logger.error('Error finding users with pagination', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async update(id: string, data: Partial<IUserDocument>): Promise<IUserDocument | null> {
        try {
            const updatedUser = await User.findByIdAndUpdate(
                id,
                { ...data, updatedAt: new Date() },
                { new: true, runValidators: true }
            ).select('+password');

            if (updatedUser) {
                logger.info(`User updated with ID: ${id}`);
            }

            return updatedUser;
        } catch (error) {
            logger.error('Error updating user', `id: ${id}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            const result = await User.findByIdAndDelete(id);
            const success = !!result;

            if (success) {
                logger.info(`User deleted with ID: ${id}`);
            }

            return success;
        } catch (error) {
            logger.error('Error deleting user', `id: ${id}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }



async softDeleteUser(id: string, data: Partial<IUserDocument>, session?: ClientSession): Promise<FlattenMaps<IUserDocument> | null> {
    try {
        const options: any = { new: true, runValidators: false };
        if (session) {
            options.session = session;
        }
        
        const updateData = {
            ...data,
            isDeleted: true,
            deletedAt: data.deletedAt || new Date(),
            updatedAt: new Date(),
        };
        
        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            options
        ).lean(); // Now return plain object

        if (updatedUser) {
            logger.info(`User soft deleted with ID: ${id}`);
        }

        return updatedUser;
    } catch (error) {
        logger.error('Error soft deleting user', `id: ${id}`, error instanceof Error ? error.message : String(error));
        throw error;
    }
}
    async count(filter: any = {}): Promise<number> {
        try {
            const finalFilter = this.applySoftDeleteFilter(filter);
            const count = await User.countDocuments(finalFilter);
            return count;
        } catch (error) {
            logger.error('Error counting users', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    // Custom methods specific to User repository
    async findByEmail(email: string): Promise<IUserDocument | null> {
        try {
            const filter = this.applySoftDeleteFilter({ email: email.toLowerCase() });
            const user = await User.findOne(filter).select('+password');
            return user;
        } catch (error) {
            logger.error('Error finding user by email', `email: ${email}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async findByVerificationToken(token: string): Promise<IUserDocument | null> {
        try {
            const user = await User.findOne({
                emailVerificationToken: token,
                emailVerificationExpires: { $gt: new Date() }
            });
            return user;
        } catch (error) {
            logger.error('Error finding user by verification token', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async findActiveUsers(): Promise<IUserDocument[]> {
        try {
            const users = await User.findActiveUsers();
            return users;
        } catch (error) {
            logger.error('Error finding active users', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async updateLastLogin(id: string): Promise<void> {
        try {
            await User.findByIdAndUpdate(id, { lastLogin: new Date() });
            logger.info(`Last login updated for user: ${id}`);
        } catch (error) {
            logger.error('Error updating last login', `id: ${id}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async searchUsers(searchTerm: string, options: QueryOptions = {}): Promise<IUserDocument[]> {
        try {
            const searchFilter = {
                $or: [
                    { firstName: { $regex: searchTerm, $options: 'i' } },
                    { lastName: { $regex: searchTerm, $options: 'i' } },
                    { email: { $regex: searchTerm, $options: 'i' } },
                ],
            };

            return await this.findMany(searchFilter, options);
        } catch (error) {
            logger.error('Error searching users', `searchTerm: ${searchTerm}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async getUsersWithPagination(filter: any = {}, options: QueryOptions = {}) {
        try {
            const { page = 1, limit = 10 } = options;

            const [users, total] = await Promise.all([
                this.findMany(filter, options),
                this.count(filter),
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            };
        } catch (error) {
            logger.error('Error getting users with pagination', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    /**
     * Bulk delete users by IDs
     */
    async bulkDelete(userIds: string[]): Promise<{ deletedCount: number; failedIds: string[] }> {
        try {
            const results = await Promise.allSettled(
                userIds.map(id => this.delete(id))
            );

            const deletedCount = results.filter(result =>
                result.status === 'fulfilled' && result.value === true
            ).length;

            const failedIds = userIds.filter((_, index) => {
                const result = results[index];
                if (!result) return false;
                return result.status === 'rejected' ||
                    (result.status === 'fulfilled' && result.value === false);
            });

            logger.info(`Bulk delete completed: ${deletedCount} deleted, ${failedIds.length} failed`);
            return { deletedCount, failedIds };
        } catch (error) {
            logger.error('Bulk delete failed', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    /**
     * Bulk update user roles
     */
    async bulkUpdateRoles(userIds: string[], role: UserRole): Promise<{ updatedCount: number; failedIds: string[] }> {
        try {
            const results = await Promise.allSettled(
                userIds.map(id => this.update(id, { role }))
            );

            const updatedCount = results.filter(result =>
                result.status === 'fulfilled' && (result as PromiseFulfilledResult<IUserDocument | null>).value !== null
            ).length;

            const failedIds = userIds.filter((_, index) => {
                const result = results[index];
                if (!result) return false;
                return result.status === 'rejected' ||
                    (result.status === 'fulfilled' && (result as PromiseFulfilledResult<IUserDocument | null>).value === null);
            });

            logger.info(`Bulk role update completed: ${updatedCount} updated, ${failedIds.length} failed`);
            return { updatedCount, failedIds };
        } catch (error) {
            logger.error('Bulk role update failed', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    /**
     * Find users by role
     */
    async findByRole(role: string): Promise<IUserDocument[]> {
        try {
            const filter = this.applySoftDeleteFilter({ role });
            const users = await User.find(filter).select('-password');
            return users;
        } catch (error) {
            logger.error('Error finding users by role', `role: ${role}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    /**
     * Find active users by role
     */
    async findActiveByRole(role: string): Promise<IUserDocument[]> {
        try {
            const filter = this.applySoftDeleteFilter({ role, isActive: true });
            const users = await User.find(filter).select('-password');
            return users;
        } catch (error) {
            logger.error('Error finding active users by role', `role: ${role}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    /**
     * Get user statistics
     */
    async getUserStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        verified: number;
        unverified: number;
        byRole: { [key: string]: number };
    }> {
        try {
            const [total, active, verified] = await Promise.all([
                this.count({}),
                this.count({ isActive: true }),
                this.count({ isEmailVerified: true })
            ]);

            const inactive = total - active;
            const unverified = total - verified;

            // Get counts by role
            const roleStats = await User.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } }
            ]);

            const byRole: { [key: string]: number } = {};
            roleStats.forEach(stat => {
                byRole[stat._id] = stat.count;
            });

            return {
                total,
                active,
                inactive,
                verified,
                unverified,
                byRole
            };
        } catch (error) {
            logger.error('Error getting user statistics', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    /**
     * Find users by multiple IDs
     */
    async findByIds(userIds: string[]): Promise<IUserDocument[]> {
        try {
            const filter = this.applySoftDeleteFilter({ _id: { $in: userIds } });
            const users = await User.find(filter).select('-password');
            return users;
        } catch (error) {
            logger.error('Error finding users by IDs', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    /**
     * Update multiple users
     */
    async updateMany(userIds: string[], updateData: Partial<IUserDocument>): Promise<{ updatedCount: number; failedIds: string[] }> {
        try {
            const results = await Promise.allSettled(
                userIds.map(id => this.update(id, updateData))
            );

            const updatedCount = results.filter(result =>
                result.status === 'fulfilled' && (result as PromiseFulfilledResult<IUserDocument | null>).value !== null
            ).length;

            const failedIds = userIds.filter((_, index) => {
                const result = results[index];
                if (!result) return false;
                return result.status === 'rejected' ||
                    (result.status === 'fulfilled' && (result as PromiseFulfilledResult<IUserDocument | null>).value === null);
            });

            logger.info(`Bulk update completed: ${updatedCount} updated, ${failedIds.length} failed`);
            return { updatedCount, failedIds };
        } catch (error) {
            logger.error('Bulk update failed', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    /**
     * Find user by registration number
     */
    async findByRegistrationNo(registrationNo: string): Promise<IUserDocument | null> {
        try {
            const filter = this.applySoftDeleteFilter({ registrationNo });
            const user = await User.findOne(filter);
            return user;
        } catch (error) {
            logger.error('Error finding user by registration number', `registrationNo: ${registrationNo}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    /**
     * Find college by name
     */
    async findCollegeByName(collegeName: string): Promise<{ _id: string; name: string; branches: IBranch[] } | null> {
        try {
            // Import College model dynamically to avoid circular dependencies
            const college = await College.findOne({ name: { $regex: new RegExp(`^${collegeName}$`, 'i') } }).populate('branches');

            if (college) {
                return {
                    _id: college._id + "",
                    name: college.name,
                    branches: college.branches as IBranch[]
                };
            }
            return null;
        } catch (error) {
            logger.error('Error finding college by name', `collegeName: ${collegeName}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
}
