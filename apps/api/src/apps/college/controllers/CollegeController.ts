import { CollegeService } from "../services/CollegeService";
import { createCollegeSchema, updateCollegeSchema, addBranchToCollegeSchema, bulkImportCollegeSchema, collegeQuerySchema } from "../dto/college.dto";
import { IRequest, IResponse } from "../../../core/types";
import { ResponseUtils } from "../../../utils/responseUtils";

export class CollegeController {
    private collegeService: CollegeService;

    constructor() {
        this.collegeService = new CollegeService();
    }

    async create(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { error, value } = createCollegeSchema.validate(req.body);
            if (error) {
                ResponseUtils.validationError(res, 'Validation error', error.details[0]?.message || 'Validation failed');
                return;
            }

            const college = await this.collegeService.create(value);
            ResponseUtils.created(res, college, 'College created successfully');
        } catch (error: any) {
            ResponseUtils.badRequest(res, 'Failed to create college', error.message);
        }
    }

    async findById(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { id } = req.params;
            if (!id) {
                ResponseUtils.badRequest(res, 'College ID is required');
                return;
            }

            const college = await this.collegeService.findById(id);

            if (!college) {
                ResponseUtils.notFound(res, 'College not found');
                return;
            }

            ResponseUtils.success(res, college, 'College retrieved successfully');
        } catch (error: any) {
            ResponseUtils.error(res, 'Failed to retrieve college', 500, 'INTERNAL_ERROR', error.message);
        }
    }

    async findAll(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { error, value } = collegeQuerySchema.validate(req.query);
            if (error) {
                ResponseUtils.validationError(res, 'Validation error', error.details[0]?.message || 'Validation failed');
                return;
            }

            const result = await this.collegeService.findAllPaginated({}, value);
            ResponseUtils.success(res, result, 'Colleges retrieved successfully');
        } catch (error: any) {
            ResponseUtils.error(res, 'Failed to retrieve colleges', 500, 'INTERNAL_ERROR', error.message);
        }
    }

    async update(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { id } = req.params;
            if (!id) {
                ResponseUtils.badRequest(res, 'College ID is required');
                return;
            }

            const { error, value } = updateCollegeSchema.validate(req.body);
            if (error) {
                ResponseUtils.validationError(res, 'Validation error', error.details[0]?.message || 'Validation failed');
                return;
            }

            const college = await this.collegeService.update(id, value);
            if (!college) {
                ResponseUtils.notFound(res, 'College not found');
                return;
            }

            ResponseUtils.success(res, college, 'College updated successfully');
        } catch (error: any) {
            ResponseUtils.badRequest(res, 'Failed to update college', error.message);
        }
    }

    async delete(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { id } = req.params;
            if (!id) {
                ResponseUtils.badRequest(res, 'College ID is required');
                return;
            }

            const success = await this.collegeService.delete(id);

            if (!success) {
                ResponseUtils.notFound(res, 'College not found');
                return;
            }

            ResponseUtils.success(res, null, 'College deleted successfully');
        } catch (error: any) {
            ResponseUtils.badRequest(res, 'Failed to delete college', error.message);
        }
    }

    async addBranchToCollege(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { error, value } = addBranchToCollegeSchema.validate(req.body);
            if (error) {
                ResponseUtils.validationError(res, 'Validation error', error.details[0]?.message || 'Validation failed');
                return;
            }

            const college = await this.collegeService.addBranchToCollege(value);
            if (!college) {
                ResponseUtils.notFound(res, 'College not found');
                return;
            }

            ResponseUtils.success(res, college, 'Branch added to college successfully');
        } catch (error: any) {
            ResponseUtils.badRequest(res, 'Failed to add branch to college', error.message);
        }
    }

    async removeBranchFromCollege(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { collegeId, branchId } = req.params;
            if (!collegeId || !branchId) {
                ResponseUtils.badRequest(res, 'College ID and branch ID are required');
                return;
            }

            const college = await this.collegeService.removeBranchFromCollege(collegeId, branchId);

            if (!college) {
                ResponseUtils.notFound(res, 'College or branch not found');
                return;
            }

            ResponseUtils.success(res, college, 'Branch removed from college successfully');
        } catch (error: any) {
            ResponseUtils.badRequest(res, 'Failed to remove branch from college', error.message);
        }
    }

    async updateBranchInCollege(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { collegeId, branchId } = req.params;
            const { name } = req.body;

            if (!name) {
                ResponseUtils.badRequest(res, 'Branch name is required', { collegeId, branchId });
                return;
            }

            if (!collegeId || !branchId) {
                ResponseUtils.badRequest(res, 'College ID and branch ID are required');
                return;
            }

            const college = await this.collegeService.updateBranchInCollege(collegeId, branchId, name);
            if (!college) {
                ResponseUtils.notFound(res, `College or branch not found ${collegeId} ${branchId}`);
                return;
            }

            ResponseUtils.success(res, college, 'Branch updated successfully');
        } catch (error: any) {
            ResponseUtils.badRequest(res, 'Failed to update branch', error.message);
        }
    }

    async bulkImport(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { error, value } = bulkImportCollegeSchema.validate(req.body);
            if (error) {
                ResponseUtils.validationError(res, 'Validation error', error.details[0]?.message || 'Validation failed');
                return;
            }

            const result = await this.collegeService.bulkImport(value.colleges);
            ResponseUtils.success(res, result, result.message);
        } catch (error: any) {
            ResponseUtils.badRequest(res, 'Failed to bulk import colleges', error.message);
        }
    }

    async bulkImportFromFile(req: IRequest, res: IResponse): Promise<void> {
        try {
            if (!req.file) {
                ResponseUtils.badRequest(res, 'File is required');
                return;
            }

            const filePath = req.file.path;
            const fileType = req.file.originalname.split('.').pop()?.toLowerCase() as 'txt' | 'xlsx' | 'csv';

            if (!['txt', 'xlsx', 'csv'].includes(fileType)) {
                ResponseUtils.badRequest(res, 'Unsupported file type. Please use .txt, .xlsx, or .csv');
                return;
            }

            const result = await this.collegeService.bulkImportFromFile(filePath, fileType);
            ResponseUtils.success(res, result, result.message);
        } catch (error: any) {
            ResponseUtils.badRequest(res, 'Failed to bulk import from file', error.message);
        }
    }

    async getCollegesWithBranches(req: IRequest, res: IResponse): Promise<void> {
        try {
            const colleges = await this.collegeService.getCollegesWithBranches();
            ResponseUtils.success(res, colleges, 'Colleges with branches retrieved successfully');
        } catch (error: any) {
            ResponseUtils.error(res, 'Failed to retrieve colleges with branches', 500, 'INTERNAL_ERROR', error.message);
        }
    }

    async getBranchesByCollege(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { collegeId } = req.params;
            if (!collegeId) {
                ResponseUtils.badRequest(res, 'College ID is required');
                return;
            }

            const branches = await this.collegeService.getBranchesByCollege(collegeId);
            ResponseUtils.success(res, branches, 'Branches retrieved successfully');
        } catch (error: any) {
            ResponseUtils.error(res, 'Failed to retrieve branches', 500, 'INTERNAL_ERROR', error.message);
        }
    }
} 