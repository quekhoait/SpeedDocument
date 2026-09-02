import express from 'express';
import TemplateController from '../controllers/TemplateController.js';
import { uploadSingle } from '../middlewares/uploadMiddleware.js';
import authMiddleWare from '../middlewares/authMiddleware.js';

const router = express.Router();


router.post('/create-category', authMiddleWare.verifyToken, authMiddleWare.authAdminMiddleWare, TemplateController.createCategory);
router.get('/get_categories', TemplateController.getAllCategory);
router.get('/category', TemplateController.getTemplates);

router.get('/get-all', authMiddleWare.verifyToken, authMiddleWare.authAdminMiddleWare, TemplateController.getAllTemplate)
router.get('/search', TemplateController.getTemplates);
router.post('/preview', uploadSingle('file'), TemplateController.previewTemplateFields);
router.post('/create-template', uploadSingle('file'), authMiddleWare.verifyToken, TemplateController.createTemplate);
router.put('/remove-soft/:id', authMiddleWare.verifyToken, authMiddleWare.authAdminMiddleWare, TemplateController.removeSoftTemplate);


router.put('/update/:id', uploadSingle('file'), authMiddleWare.verifyToken, authMiddleWare.authAdminMiddleWare, TemplateController.updateTemplate);

router.get('/:id', TemplateController.getTemplate);

export default router;