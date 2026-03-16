import multer from 'multer';
import { Request } from 'express';

// Configure multer for memory storage (no files saved to disk)
const storage = multer.memoryStorage();

// File filter to allow .txt, .xlsx, .xls, and .csv files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = [
        'text/plain',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv',
        'application/csv'
    ];

    const allowedExtensions = ['.txt', '.xlsx', '.xls', '.csv'];

    if (allowedMimeTypes.includes(file.mimetype) ||
        allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext))) {
        cb(null, true);
    } else {
        cb(new Error('Only .txt, .xlsx, .xls, and .csv files are allowed'));
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit for Excel/CSV files
    },
});

export default upload; 