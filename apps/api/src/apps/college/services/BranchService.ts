import { BranchRepository } from '../repository/BranchRepository';
import { CreateBranchDto, UpdateBranchDto, BulkImportBranchDto } from '../dto/branch.dto';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import { IBranch } from '../interface/Branch';
import { BaseService } from '../../../core/types';

export class BranchService implements BaseService<IBranch> {
    private branchRepository: BranchRepository;

    constructor() {
        this.branchRepository = new BranchRepository();
    }

    async create(data: CreateBranchDto): Promise<IBranch> {
        // Check if branch with same name already exists
        const existingBranch = await this.branchRepository.findByName(data.name);
        if (existingBranch) {
            throw new Error('Branch with this name already exists');
        }

        return await this.branchRepository.create(data);
    }

    async findById(id: string): Promise<IBranch | null> {
        return await this.branchRepository.findById(id);
    }

    async findAll(filter?: any): Promise<IBranch[]> {
        const result = await this.branchRepository.findAll(filter, {});
        return result.data;
    }

    async update(id: string, data: UpdateBranchDto): Promise<IBranch | null> {
        const existingBranch = await this.branchRepository.findById(id);
        if (!existingBranch) {
            throw new Error('Branch not found');
        }

        // Check if name is being updated and if it conflicts with existing branch
        if (data.name && data.name !== existingBranch.name) {
            const branchWithSameName = await this.branchRepository.findByName(data.name);
            if (branchWithSameName) {
                throw new Error('Branch with this name already exists');
            }
        }

        return await this.branchRepository.update(id, data);
    }

    async delete(id: string): Promise<boolean> {
        const existingBranch = await this.branchRepository.findById(id);
        if (!existingBranch) {
            throw new Error('Branch not found');
        }

        return await this.branchRepository.delete(id);
    }

    async findAllWithPagination(query: any = {}, options: any = {}): Promise<{ data: IBranch[]; total: number }> {
        return await this.branchRepository.findAll(query, options);
    }

    async findByName(name: string): Promise<IBranch | null> {
        return await this.branchRepository.findByName(name);
    }

    async bulkImportFromFile(filePath: string, fileType: 'txt' | 'xlsx' | 'csv'): Promise<{ success: boolean; message: string; imported: number; failed: number; errors?: string[] }> {
        try {
            let branches: BulkImportBranchDto[] = [];

            if (fileType === 'txt') {
                branches = await this.parseTxtFile(filePath);
            } else if (fileType === 'xlsx') {
                branches = await this.parseExcelFile(filePath);
            } else if (fileType === 'csv') {
                branches = await this.parseCsvFile(filePath);
            } else {
                throw new Error('Unsupported file type');
            }

            return await this.bulkImport(branches);
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

    async bulkImportFromFileBuffer(fileBuffer: Buffer, fileType: 'txt' | 'xlsx' | 'csv'): Promise<{ success: boolean; message: string; imported: number; failed: number; errors?: string[] }> {
        try {
            let branches: BulkImportBranchDto[] = [];

            if (fileType === 'txt') {
                branches = await this.parseTxtBuffer(fileBuffer);
            } else if (fileType === 'xlsx') {
                branches = await this.parseExcelBuffer(fileBuffer);
            } else if (fileType === 'csv') {
                branches = await this.parseCsvBuffer(fileBuffer);
            } else {
                throw new Error('Unsupported file type');
            }

            return await this.bulkImport(branches);
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

    async bulkImport(branches: BulkImportBranchDto[]): Promise<{ success: boolean; message: string; imported: number; failed: number; errors?: string[] }> {
        const errors: string[] = [];
        let imported = 0;
        let failed = 0;

        for (const branchData of branches) {
            try {
                // Check if branch already exists
                const existingBranch = await this.branchRepository.findByName(branchData.name);
                if (existingBranch) {
                    errors.push(`Branch "${branchData.name}" already exists`);
                    failed++;
                    continue;
                }

                await this.branchRepository.create(branchData);
                imported++;
            } catch (error: any) {
                errors.push(`Failed to create branch "${branchData.name}": ${error.message}`);
                failed++;
            }
        }

        return {
            success: imported > 0,
            message: `Bulk import completed. ${imported} imported, ${failed} failed.`,
            imported,
            failed,
            ...(errors.length > 0 && { errors })
        };
    }

    private async parseTxtFile(filePath: string): Promise<BulkImportBranchDto[]> {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());

        return lines.map(line => ({
            name: line.trim()
        }));
    }

    private async parseExcelFile(filePath: string): Promise<BulkImportBranchDto[]> {
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

        const branches: BulkImportBranchDto[] = [];

        // Skip header row
        for (let i = 1; i < data.length; i++) {
            const row = data[i] as any[];
            if (row[0]) { // Branch name exists
                const branchName = row[0].toString().trim();
                if (branchName) {
                    branches.push({ name: branchName });
                }
            }
        }

        return branches;
    }

    private async parseCsvFile(filePath: string): Promise<BulkImportBranchDto[]> {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());

        const branches: BulkImportBranchDto[] = [];

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line) {
                const branchName = line.trim().replace(/"/g, '');
                if (branchName) {
                    branches.push({ name: branchName });
                }
            }
        }

        return branches;
    }

    private async parseTxtBuffer(fileBuffer: Buffer): Promise<BulkImportBranchDto[]> {
        const content = fileBuffer.toString('utf-8');
        const lines = content.split('\n').filter(line => line.trim());

        return lines.map(line => ({
            name: line.trim()
        }));
    }

    private async parseExcelBuffer(fileBuffer: Buffer): Promise<BulkImportBranchDto[]> {
        const workbook = xlsx.read(fileBuffer);
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
            throw new Error('No sheets found in the Excel file');
        }
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
            throw new Error('Worksheet not found');
        }
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        const branches: BulkImportBranchDto[] = [];

        // Skip header row
        for (let i = 1; i < data.length; i++) {
            const row = data[i] as any[];
            if (row[0]) { // Branch name exists
                const branchName = row[0].toString().trim();
                if (branchName) {
                    branches.push({ name: branchName });
                }
            }
        }

        return branches;
    }

    private async parseCsvBuffer(fileBuffer: Buffer): Promise<BulkImportBranchDto[]> {
        const content = fileBuffer.toString('utf-8');
        const lines = content.split('\n').filter(line => line.trim());

        const branches: BulkImportBranchDto[] = [];

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line) {
                const branchName = line.trim().replace(/"/g, '');
                if (branchName) {
                    branches.push({ name: branchName });
                }
            }
        }

        return branches;
    }

    async findBranchesByNames(names: string[]): Promise<IBranch[]> {
        return await this.branchRepository.findBranchesByNames(names);
    }

    async getBranchStats(): Promise<{
        totalBranches: number;
        branchesThisMonth: number;
        branchesThisYear: number;
        growthRate: number;
    }> {
        const totalBranches = await this.branchRepository.count();

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const branchesThisMonth = await this.branchRepository.count({
            createdAt: { $gte: startOfMonth }
        });

        const branchesThisYear = await this.branchRepository.count({
            createdAt: { $gte: startOfYear }
        });

        // Calculate growth rate (simple calculation)
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const branchesLastMonth = await this.branchRepository.count({
            createdAt: { $gte: lastMonth, $lte: endOfLastMonth }
        });

        const growthRate = branchesLastMonth > 0
            ? ((branchesThisMonth - branchesLastMonth) / branchesLastMonth) * 100
            : branchesThisMonth > 0 ? 100 : 0;

        return {
            totalBranches,
            branchesThisMonth,
            branchesThisYear,
            growthRate: Math.round(growthRate * 10) / 10 // Round to 1 decimal place
        };
    }
} 