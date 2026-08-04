import express from 'express';
import DocumentController from '../controllers/DocumentController.js';
import { uploadSingle } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/create-document', DocumentController.createDocument);




export default router;