import { DataTypes } from 'sequelize';
import sequelize from '../config.js'; 

const Document = sequelize.define('Document', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    status: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    
})