import express from 'express';
import AuthController from '../controllers/AuthController.js';

const router = express.Router();

router.post('/register', AuthController.createUser);
// router.post('/login', AuthController.loginUser);

export default router;