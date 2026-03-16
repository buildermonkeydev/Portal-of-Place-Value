import { Router } from "express";
import { authenticateToken } from '../../../middleware/auth.middleware';
import upload from '../../../middleware/fileUpload';
import { BranchController } from "../controllers/BranchController";

const router: Router = Router();
const branchController = new BranchController();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Branch CRUD operations
router.post('/', branchController.create.bind(branchController));
router.get('/', branchController.findAll.bind(branchController));

// Utility routes - must come before /:id routes
router.get('/stats', branchController.getBranchStats.bind(branchController));
router.get('/search/name', branchController.findByName.bind(branchController));
router.post('/by-names', branchController.findBranchesByNames.bind(branchController));

// Bulk operations
router.post('/bulk-import', branchController.bulkImport.bind(branchController));
router.post('/bulk-import/file', upload.single('file'), branchController.bulkImportFromFile.bind(branchController));

// ID-based routes - must come last
router.get('/:id', branchController.findById.bind(branchController));
router.put('/:id', branchController.update.bind(branchController));
router.delete('/:id', branchController.delete.bind(branchController));

export default router; 