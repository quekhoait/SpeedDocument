import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routers/AuthRouter.js';
import templateRouter from './routers/TemplateRouter.js';
// import uploadRouter from './routers/UploadRouter.js';
import { sequelize, createDatabaseIfNotExists } from './config.js';
import './models/AuthModel.js';
import './models/DocumentModel.js';
import './models/TemplateModel.js'; 


const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/templates', templateRouter);


const PORT = 5000;

const startServer = async () => {
    try {
        await createDatabaseIfNotExists();
        await sequelize.authenticate();
        console.log('Kết nối database thành công.');

        await sequelize.sync();
        console.log('Đồng bộ hóa các model thành công. Các bảng đã được giữ nguyên!');

        app.listen(PORT, () => {
            console.log(`=> [Server]: Hệ thống đang chạy tại đường dẫn: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Không thể kết nối hoặc đồng bộ với database:', error);
        process.exit(1);
    }
};

startServer();

export default app;