import express from 'express';
import SpeedToTextController from '../controllers/SpeedToTextController.js';
import { uploadAudio } from '../middlewares/uploadMiddleware.js';


const router = express.Router();

router.post('/speed-to-text', uploadAudio("file"),  SpeedToTextController.speedToText);


export default router;