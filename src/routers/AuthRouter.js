import express from 'express';
import AuthController from '../controllers/AuthController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/send-otp', AuthController.sendOTP);
router.post('/register', AuthController.createUser);
router.post('/login', AuthController.loginUser);
router.get('/user',  authMiddleware, AuthController.getUser);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', authMiddleware, AuthController.logoutUser);

export default router;