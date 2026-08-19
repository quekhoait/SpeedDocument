import express from 'express';
import TemplateController from '../controllers/TemplateController.js';
import { uploadSingle } from '../middlewares/uploadMiddleware.js';
import authMiddleWare from '../middlewares/authMiddleware.js';

const router = express.Router();


router.post('/create-category', TemplateController.createCategory);
router.get('/get_categories', TemplateController.getAllCategory)
router.get('/category', TemplateController.getTemplates)
router.post('/preview', uploadSingle('file'), TemplateController.previewTemplateFields);
router.post('/create-template', uploadSingle('file'), authMiddleWare, TemplateController.createTemplate);
router.get('/search', TemplateController.getTemplates)
router.get('/:id', TemplateController.getTemplate)


export default router;