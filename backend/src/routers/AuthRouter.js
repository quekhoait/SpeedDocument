import express from 'express';
import AuthController from '../controllers/AuthController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { uploadAvatar } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/send-otp', AuthController.sendOTP);
router.post('/register', AuthController.createUser);
router.post('/login', AuthController.loginUser);
router.get('/user',  authMiddleware, AuthController.getUser);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', authMiddleware, AuthController.logoutUser);
router.post('/save-signature', authMiddleware,AuthController.saveSignature )
router.put('/update', authMiddleware, uploadAvatar('avatar'), AuthController.updateUser);

export default router;