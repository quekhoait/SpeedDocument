import express from 'express';
import AdminController from '../controllers/AdminController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/count-templates',  AdminController.countTemplate);

router.get('/count-documents', authMiddleware.verifyToken, authMiddleware.authAdminMiddleWare, AdminController.countDocument);

router.get('/count-users', authMiddleware.verifyToken, authMiddleware.authAdminMiddleWare, AdminController.countUser);

router.get('/dashboard-analytics', authMiddleware.verifyToken, authMiddleware.authAdminMiddleWare , AdminController.getDashboardAnalytics);

export default router;