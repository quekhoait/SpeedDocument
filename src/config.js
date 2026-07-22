import { Sequelize } from 'sequelize';
import { Client } from 'pg';

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

export { sequelize, createDatabaseIfNotExists };
export default sequelize;