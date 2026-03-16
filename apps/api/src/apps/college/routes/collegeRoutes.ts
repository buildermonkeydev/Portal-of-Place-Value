import { Router } from 'express';
import { CollegeController } from '../controllers/CollegeController';
import { authenticateToken } from '../../../middleware/auth.middleware';
import upload from '../../../middleware/fileUpload';

const router: Router = Router();
const collegeController = new CollegeController();

// Public routes (no auth required)
router.get('/with-branches/list', collegeController.getCollegesWithBranches.bind(collegeController));

// Apply auth middleware to all other routes
router.use(authenticateToken);

// College CRUD operations
router.post('/', collegeController.create.bind(collegeController));
router.get('/', collegeController.findAll.bind(collegeController));

// Utility routes - must come before /:id routes
// router.get('/with-branches/list', collegeController.getCollegesWithBranches.bind(collegeController));

// Bulk operations
router.post('/bulk-import', collegeController.bulkImport.bind(collegeController));
router.post('/bulk-import/file', upload.single('file'), collegeController.bulkImportFromFile.bind(collegeController));

// ID-based routes - must come last
router.get('/:id', collegeController.findById.bind(collegeController));
router.put('/:id', collegeController.update.bind(collegeController));
router.delete('/:id', collegeController.delete.bind(collegeController));

// Branch management within college
router.post('/:collegeId/branches', collegeController.addBranchToCollege.bind(collegeController));
router.delete('/:collegeId/branches/:branchId', collegeController.removeBranchFromCollege.bind(collegeController));
router.put('/:collegeId/branches/:branchId', collegeController.updateBranchInCollege.bind(collegeController));
router.get('/:collegeId/branches', collegeController.getBranchesByCollege.bind(collegeController));

export default router; 