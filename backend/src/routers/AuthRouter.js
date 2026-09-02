import express from 'express';
import AuthController from '../controllers/AuthController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { uploadAvatar } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/send-otp', AuthController.sendOTP);
router.post('/register', AuthController.createUser);
router.post('/login', AuthController.loginUser);
router.get('/user',  authMiddleware.verifyToken, AuthController.getUser);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', authMiddleware.verifyToken, AuthController.logoutUser);
router.post('/save-signature', authMiddleware.verifyToken,AuthController.saveSignature )
router.put('/update', authMiddleware.verifyToken, uploadAvatar('avatar'), AuthController.updateUser);
router.get('/get-all-user', authMiddleware.verifyToken, authMiddleware.authAdminMiddleWare, AuthController.getAllUser)

export default router;