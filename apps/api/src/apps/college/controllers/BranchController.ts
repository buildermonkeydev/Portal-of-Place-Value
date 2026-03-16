import { branchQuerySchema, bulkImportBranchSchema } from "../dto/branch.dto";
import { createBranchSchema, updateBranchSchema } from "../dto/college.dto";
import { IRequest, IResponse } from "../../../core/types";
import { BranchService } from "../services/BranchService";
import { ResponseUtils } from "../../../utils/responseUtils";


export class BranchController {
    private branchService: BranchService;

    constructor() {
        this.branchService = new BranchService();
    }

    async create(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { error, value } = createBranchSchema.validate(req.body);
            if (error) {
                ResponseUtils.validationError(res, 'Validation error', error.details[0]?.message || 'Validation failed');
                return;
            }

            const branch = await this.branchService.create(value);
            ResponseUtils.created(res, branch, 'Branch created successfully');
        } catch (error: any) {
            ResponseUtils.badRequest(res, 'Failed to create branch', error.message);
        }
    }

    async findById(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { id } = req.params;
            if (!id) {
                ResponseUtils.badRequest(res, 'Branch ID is required');
                return;
            }

            const branch = await this.branchService.findById(id);

            if (!branch) {
                ResponseUtils.notFound(res, 'Branch not found');
                return;
            }

            ResponseUtils.success(res, branch, 'Branch retrieved successfully');
        } catch (error: any) {
            ResponseUtils.error(res, 'Failed to retrieve branch', 500, 'INTERNAL_ERROR', error.message);
        }
    }

    async findAll(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { error, value } = branchQuerySchema.validate(req.query);
            if (error) {
                ResponseUtils.validationError(res, 'Validation error', error.details[0]?.message || 'Validation failed');
                return;
            }

            const result = await this.branchService.findAllWithPagination({}, value);
            ResponseUtils.success(res, result, 'Branches retrieved successfully');
        } catch (error: any) {
            ResponseUtils.error(res, 'Failed to retrieve branches', 500, 'INTERNAL_ERROR', error.message);
        }
    }

    async update(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { id } = req.params;
            if (!id) {
                ResponseUtils.badRequest(res, 'Branch ID is required');
                return;
            }

            const { error, value } = updateBranchSchema.validate(req.body);
            if (error) {
                ResponseUtils.validationError(res, 'Validation error', error.details[0]?.message || 'Validation failed');
                return;
            }

            const branch = await this.branchService.update(id, value);
            if (!branch) {
                ResponseUtils.notFound(res, 'Branch not found');
                return;
            }

            ResponseUtils.success(res, branch, 'Branch updated successfully');
        } catch (error: any) {
            ResponseUtils.badRequest(res, 'Failed to update branch', error.message);
        }
    }

    async delete(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { id } = req.params;
            if (!id) {
                ResponseUtils.badRequest(res, 'Branch ID is required');
                return;
            }

            const success = await this.branchService.delete(id);

            if (!success) {
                ResponseUtils.notFound(res, 'Branch not found');
                return;
            }

            ResponseUtils.success(res, null, 'Branch deleted successfully');
        } catch (error: any) {
            ResponseUtils.badRequest(res, 'Failed to delete branch', error.message);
        }
    }

    async findByName(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { name } = req.query;
            if (!name || typeof name !== 'string') {
                ResponseUtils.badRequest(res, 'Branch name is required');
                return;
            }

            const branch = await this.branchService.findByName(name);
            if (!branch) {
                ResponseUtils.notFound(res, 'Branch not found');
                return;
            }

            ResponseUtils.success(res, branch, 'Branch retrieved successfully');
        } catch (error: any) {
            ResponseUtils.error(res, 'Failed to retrieve branch', 500, 'INTERNAL_ERROR', error.message);
        }
    }

    async bulkImport(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { error, value } = bulkImportBranchSchema.validate(req.body);
            if (error) {
                ResponseUtils.validationError(res, 'Validation error', error.details[0]?.message || 'Validation failed');
                return;
            }

            const result = await this.branchService.bulkImport(value.branches);
            ResponseUtils.success(res, result, result.message);
        } catch (error: any) {
            ResponseUtils.badRequest(res, 'Failed to bulk import branches', error.message);
        }
    }

    async bulkImportFromFile(req: IRequest, res: IResponse): Promise<void> {
        try {
            if (!req.file) {
                ResponseUtils.badRequest(res, 'File is required');
                return;
            }

            if (!req.file.buffer) {
                ResponseUtils.badRequest(res, 'File buffer is required');
                return;
            }

            const fileType = req.file.originalname.split('.').pop()?.toLowerCase() as 'txt' | 'xlsx' | 'csv';

            if (!['txt', 'xlsx', 'csv'].includes(fileType)) {
                ResponseUtils.badRequest(res, 'Unsupported file type. Please use .txt, .xlsx, or .csv');
                return;
            }

            const result = await this.branchService.bulkImportFromFileBuffer(req.file.buffer, fileType);
            ResponseUtils.success(res, result, result.message);
        } catch (error: any) {
            ResponseUtils.badRequest(res, 'Failed to bulk import from file', error.message);
        }
    }

    async findBranchesByNames(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { names } = req.body;
            if (!names || !Array.isArray(names)) {
                ResponseUtils.badRequest(res, 'Branch names array is required');
                return;
            }

            const branches = await this.branchService.findBranchesByNames(names);
            ResponseUtils.success(res, branches, 'Branches retrieved successfully');
        } catch (error: any) {
            ResponseUtils.error(res, 'Failed to retrieve branches', 500, 'INTERNAL_ERROR', error.message);
        }
    }

    async getBranchStats(req: IRequest, res: IResponse): Promise<void> {
        try {
            const stats = await this.branchService.getBranchStats();
            ResponseUtils.success(res, stats, 'Branch statistics retrieved successfully');
        } catch (error: any) {
            ResponseUtils.error(res, 'Failed to retrieve branch statistics', 500, 'INTERNAL_ERROR', error.message);
        }
    }
} 