import * as xlsx from 'xlsx';
import * as fs from 'fs';

import { AddBranchToCollegeDto, BulkImportCollegeDto } from '../dto/college.dto';
import { BaseService } from '../../../core/types';
import { IBranch, IBranches } from '../interface/Branch';
import { ICollege } from '../interface/College';
import { BranchRepository } from '../repository/BranchRepository';
import { CollegeRepository } from '../repository/CollegeRepository';

export class CollegeService implements BaseService<ICollege> {
    private collegeRepository: CollegeRepository;
    private branchRepository: BranchRepository;


    constructor() {
        this.collegeRepository = new CollegeRepository();
        this.branchRepository = new BranchRepository();

    }

    async create(data: Partial<ICollege>): Promise<ICollege> {
        if (!data.name) {
            throw new Error('College name is required');
        }

        // Check if branches are provided
        if (!data.branches || data.branches.length === 0) {
            throw new Error('At least one branch is required');
        }

        const existingCollege = await this.collegeRepository.findByName(data.name);
        if (existingCollege) {
            throw new Error('College with this name already exists');
        }

        const branchRepository = new BranchRepository();

        const branches = await Promise.all(
            data.branches.map(async (br: any): Promise<{ _id: any; name: string }> => {
                if (!br.name) {
                    throw new Error('Branch name is required');
                }

                // If branch has an _id, validate it exists in Branch collection
                if (br._id) {
                    const existingBranch = await this.branchRepository.findById(br._id);
                    if (!existingBranch) {
                        throw new Error(`Branch with ID ${br._id} not found`);
                    }
                    return {
                        _id: existingBranch._id,
                        name: br.name || existingBranch.name
                    };
                } else {
                    // If no _id, find by name or create new branch
                    const existingBranch = await this.branchRepository.findByName(br.name);
                    if (existingBranch) {
                        return {
                            _id: existingBranch._id,
                            name: existingBranch.name
                        };
                    }
                    const newBranch = await this.branchRepository.create({ name: br.name });
                    return {
                        _id: newBranch._id,
                        name: newBranch.name
                    };
                }
            })
        );

        const collegeCreateData: Partial<ICollege> = {
            name: data.name,
            branches: branches
        };

        return await this.collegeRepository.create(collegeCreateData);
    }

    async findById(id: string): Promise<ICollege | null> {
        return await this.collegeRepository.findById(id);
    }

    async findAll(filter?: any): Promise<ICollege[]> {
        const result = await this.collegeRepository.findAll(filter, {});
        return result.data;
    }

    // Additional method for paginated results
    async findAllPaginated(query: any = {}, options: any = {}): Promise<{ data: ICollege[]; total: number }> {
        return await this.collegeRepository.findAll(query, options);
    }

    async update(id: string, data: Partial<ICollege>): Promise<ICollege | null> {
        const existingCollege = await this.collegeRepository.findById(id);
        if (!existingCollege) {
            throw new Error('College not found');
        }

        // Check if name is being updated and if it conflicts with existing college
        if (data.name && data.name !== existingCollege.name) {
            const collegeWithSameName = await this.collegeRepository.findByName(data.name);
            if (collegeWithSameName) {
                throw new Error('College with this name already exists');
            }
        }

        // Check if branches are being updated and ensure they are provided
        if (data.branches !== undefined) {
            if (!data.branches || data.branches.length === 0) {
                throw new Error('At least one branch is required');
            }

            // Process branches to ensure correct IDs reference Branch model
            const processedBranches = await Promise.all(
                data.branches.map(async (branch: any) => {
                    if (branch._id) {
                        const branchDoc = await this.branchRepository.findById(branch._id);
                        if (!branchDoc) {
                            throw new Error(`Branch with ID ${branch._id} not found`);
                        }
                        return {
                            _id: branch._id,
                            name: branch.name || branchDoc.name
                        };
                    } else {
                        const existingBranch = await this.branchRepository.findByName(branch.name);
                        if (existingBranch) {
                            return {
                                _id: existingBranch._id,
                                name: existingBranch.name
                            };
                        }
                        const newBranch = await this.branchRepository.create({ name: branch.name });
                        return {
                            _id: newBranch._id,
                            name: newBranch.name
                        };
                    }
                })
            );

            // Replace branches array with processed branches
            data.branches = processedBranches;
        }

        return await this.collegeRepository.update(id, data);
    }

    async delete(id: string): Promise<boolean> {
        const existingCollege = await this.collegeRepository.findById(id);
        if (!existingCollege) {
            throw new Error('College not found');
        }

        return await this.collegeRepository.delete(id);
    }

    async addBranchToCollege(data: AddBranchToCollegeDto): Promise<ICollege | null> {
        const college = await this.collegeRepository.findById(data.collegeId);
        if (!college) {
            throw new Error('College not found');
        }

        // Check if branch already exists in this college
        const existingBranch = (college.branches as IBranch[]).find((branch: IBranch) =>
            branch.name?.toLowerCase() === data.branchName.toLowerCase()
        );
        if (existingBranch) {
            throw new Error('Branch already exists in this college');
        }

        return await this.collegeRepository.addBranchToCollege(data.collegeId, data.branchName);
    }

    async removeBranchFromCollege(collegeId: string, branchId: string): Promise<ICollege | null> {
        const college = await this.collegeRepository.findById(collegeId);
        if (!college) {
            throw new Error('College not found');
        }

        const branchExists = (college.branches as IBranch[]).find((branch: IBranch) => branch._id?.toString() === branchId);
        if (!branchExists) {
            throw new Error('Branch not found in this college');
        }

        return await this.collegeRepository.removeBranchFromCollege(collegeId, branchId);
    }

    async updateBranchInCollege(collegeId: string, branchId: string, branchName: string): Promise<ICollege | null> {
        const college = await this.collegeRepository.findById(collegeId);
        if (!college) {
            throw new Error('College not found');
        }

        const branchExists = (college.branches as IBranch[]).find((branch: IBranch) => branch._id?.toString() === branchId);
        if (!branchExists) {
            throw new Error('Branch not found in this college');
        }

        // Check if new name conflicts with existing branch names
        const nameConflict = (college.branches as IBranch[]).find((branch: IBranch) =>
            branch._id?.toString() !== branchId &&
            branch.name?.toLowerCase() === branchName.toLowerCase()
        );
        if (nameConflict) {
            throw new Error('Branch with this name already exists in this college');
        }

        return await this.collegeRepository.updateBranchInCollege(collegeId, branchId, branchName);
    }

    async bulkImportFromFile(filePath: string, fileType: 'txt' | 'xlsx' | 'csv'): Promise<{ success: boolean; message: string; imported: number; failed: number; errors?: string[] }> {
        try {
            let colleges: BulkImportCollegeDto[] = [];

            if (fileType === 'txt') {
                colleges = await this.parseTxtFile(filePath);
            } else if (fileType === 'xlsx') {
                colleges = await this.parseExcelFile(filePath);
            } else if (fileType === 'csv') {
                colleges = await this.parseCsvFile(filePath);
            } else {
                throw new Error('Unsupported file type');
            }

            return await this.bulkImport(colleges);
        } catch (error: any) {
            return {
                success: false,
                message: 'Failed to parse file',
                imported: 0,
                failed: 0,
                errors: [error.message]
            };
        }
    }

    async bulkImport(colleges: BulkImportCollegeDto[]): Promise<{ success: boolean; message: string; imported: number; failed: number; errors?: string[] }> {
        const errors: string[] = [];
        let imported = 0;
        let failed = 0;

        for (const collegeData of colleges) {
            try {
                // Check if college already exists
                const existingCollege = await this.collegeRepository.findByName(collegeData.name);
                if (existingCollege) {
                    errors.push(`College "${collegeData.name}" already exists`);
                    failed++;
                    continue;
                }

                // Check if branches are provided
                if (!collegeData.branches || collegeData.branches.length === 0) {
                    errors.push(`College "${collegeData.name}" skipped: No branches provided`);
                    failed++;
                    continue;
                }

                const branches = await Promise.all(
                    collegeData.branches.map(async (branchName): Promise<Partial<IBranch>> => {
                        const existingBranch = await this.branchRepository.findByName(branchName);
                        if (existingBranch) {
                            return {
                                _id: existingBranch._id + "",
                                name: branchName
                            };
                        }
                        const create = await this.branchRepository.create({ name: branchName });
                        return {
                            _id: create._id + "",
                            name: branchName
                        };
                    })
                );

                const createCollegeData: Partial<ICollege> = {
                    name: collegeData.name,
                    branches: branches
                };

                await this.create(createCollegeData);
                imported++;
            } catch (error: any) {
                errors.push(`Failed to create college "${collegeData.name}": ${error.message}`);
                failed++;
            }
        }

        return {
            success: imported > 0,
            message: `Bulk import completed. ${imported} imported, ${failed} failed.`,
            imported,
            failed,
            errors: errors.length > 0 ? errors : []
        };
    }

    private async parseTxtFile(filePath: string): Promise<BulkImportCollegeDto[]> {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());

        return lines.map(line => {
            const parts = line.split(',').map(part => part.trim());
            const collegeName = parts[0];
            const branches = parts.slice(1).filter(branch => branch);

            // Only include colleges that have branches
            if (branches.length === 0) {
                return null;
            }

            return {
                name: collegeName || '',
                branches: branches
            };
        }).filter(college => college !== null) as BulkImportCollegeDto[];
    }

    private async parseExcelFile(filePath: string): Promise<BulkImportCollegeDto[]> {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
            throw new Error('No sheets found in the Excel file');
        }
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
            throw new Error('Worksheet not found');
        }
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        const colleges: BulkImportCollegeDto[] = [];

        // Skip header row
        for (let i = 1; i < data.length; i++) {
            const row = data[i] as any[];
            if (row[0]) { // College name exists
                const collegeName = row[0].toString().trim();
                const branches = row.slice(1)
                    .filter((cell: any) => cell && cell.toString().trim())
                    .map((cell: any) => cell.toString().trim());

                // Only include colleges that have branches
                if (branches.length > 0) {
                    colleges.push({
                        name: collegeName,
                        branches: branches
                    });
                }
            }
        }

        return colleges;
    }

    private async parseCsvFile(filePath: string): Promise<BulkImportCollegeDto[]> {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());

        const colleges: BulkImportCollegeDto[] = [];

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;
            const parts = line.split(',').map(part => part.trim().replace(/"/g, ''));
            const collegeName = parts[0];
            const branches = parts.slice(1).filter(branch => branch);

            if (collegeName) {
                // Only include colleges that have branches
                if (branches.length > 0) {
                    colleges.push({
                        name: collegeName,
                        branches: branches
                    });
                }
            }
        }

        return colleges;
    }

    async getCollegesWithBranches(): Promise<ICollege[]> {
        return await this.collegeRepository.findCollegesWithBranches();
    }

    async getBranchesByCollege(collegeId: string): Promise<IBranches[]> {
        return await this.collegeRepository.findBranchesByCollege(collegeId);
    }
} 