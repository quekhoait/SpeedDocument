import express from 'express';
import DocumentController from '../controllers/DocumentController.js';
import { uploadSingle } from '../middlewares/uploadMiddleware.js';
import authMiddleWare from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create-document', authMiddleWare.verifyToken, DocumentController.processDocumentChat);
router.get('/user-id', authMiddleWare.verifyToken, DocumentController.getDocumentByUserId)
router.post ('/signature', authMiddleWare.verifyToken, DocumentController.writeSignature)
router.put('/update', authMiddleWare.verifyToken, DocumentController.updateDocument)
router.post('/template', DocumentController.searchTemplateByPrompt)
router.get("/get-all", DocumentController.getAllDocument)
router.get("/:id", authMiddleWare.verifyToken, DocumentController.getDocumentById);


export default router;