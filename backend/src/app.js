import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routers/AuthRouter.js';
import templateRouter from './routers/TemplateRouter.js';
import documentRouter from './routers/DocumentRouter.js';
// import uploadRouter from './routers/UploadRouter.js';
import speedToTextRouter from './routers/SpeedToTextRouter.js'
import { sequelize, createDatabaseIfNotExists } from './config.js';
import './models/AuthModel.js';
import './models/DocumentModel.js';
import './models/TemplateModel.js'; 


const app = express();

app.use(cors());
app.use(express.json());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/templates', templateRouter);
app.use('/api/documents', documentRouter);
app.use('/api', speedToTextRouter)


const PORT = 5000;

const startServer = async () => {
    try {
        await createDatabaseIfNotExists();
        await sequelize.authenticate();
        console.log('Kết nối database thành công.');

        await sequelize.sync();
        console.log('Đồng bộ hóa các model thành công. Các bảng đã được giữ nguyên!');

       app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
    } catch (error) {
        console.error('Không thể kết nối hoặc đồng bộ với database:', error);
        process.exit(1);
    }
};

startServer();

export default app;