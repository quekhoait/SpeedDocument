import express from 'express';
import DocumentController from '../controllers/DocumentController.js';
import { uploadSingle } from '../middlewares/uploadMiddleware.js';
import authMiddleWare from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create-document', authMiddleWare, DocumentController.processDocumentChat);
router.get('/user-id', authMiddleWare, DocumentController.getDocumentByUserId)
router.post ('/signature', authMiddleWare, DocumentController.writeSignature)
router.put('/update', authMiddleWare, DocumentController.updateDocument)
router.post('/template', DocumentController.searchTemplateByPrompt)
router.get("/:id", authMiddleWare, DocumentController.getDocumentById);
export default router;