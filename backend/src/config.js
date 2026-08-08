import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import { Client } from 'pg';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const DB_NAME = 'document';
const DB_USER = 'postgres';
const DB_PASSWORD = '123456';
const DB_HOST = 'localhost';
const DB_PORT = 5433;

const createDatabaseIfNotExists = async () => {
    const client = new Client({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: 'postgres',
    });

    try {
        await client.connect();
        const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
        if (result.rowCount === 0) {
            await client.query(`CREATE DATABASE "${DB_NAME}"`);
            console.log(`Database "${DB_NAME}" đã được tạo thành công.`);
        } else {
            console.log(`Database "${DB_NAME}" đã tồn tại.`);
        }
    } finally {
        await client.end();
    }
};

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    logging: false,
    timezone: '+07:00',
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (fileBuffer, options = {}) => {
    const { folder = 'speed-document', resource_type = 'auto', public_id } = options;

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary chưa được cấu hình. Vui lòng thêm CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY và CLOUDINARY_API_SECRET vào file .env');
    }

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type,
                public_id,
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result);
            }
        );

        stream.end(fileBuffer);
    });
};

export { sequelize, createDatabaseIfNotExists, cloudinary, uploadToCloudinary };
export default sequelize;