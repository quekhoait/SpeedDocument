import express from 'express';
import cors from 'cors';
import authRouter from './routers/AuthRouter.js';
import { sequelize, createDatabaseIfNotExists } from './config.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);

const PORT = 5000;

const startServer = async () => {
    try {
        await createDatabaseIfNotExists();
        await sequelize.authenticate();
        console.log('Kết nối database thành công.');

        await sequelize.sync({ force: true });
        console.log('Đồng bộ hóa các model thành công. Các bảng đã được cập nhật!');

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