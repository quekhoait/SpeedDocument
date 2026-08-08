import express from 'express';
import TemplateController from '../controllers/TemplateController.js';
import { uploadSingle } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/create-category', TemplateController.createCategory);
router.post('/preview', uploadSingle('file'), TemplateController.previewTemplateFields);
router.post('/create-template', uploadSingle('file'), TemplateController.createTemplate);



export default router;