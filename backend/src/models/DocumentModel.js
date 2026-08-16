import { DataTypes } from 'sequelize';
import sequelize from '../config.js'; 
import {User} from '../models/AuthModel.js'
import { Template } from './TemplateModel.js';

const Document = sequelize.define('Document', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    status: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    extracted_data: { type: DataTypes.JSON, allowNull: true },
    missing_fields: { type: DataTypes.JSON, allowNull: true },
    file_path: { type: DataTypes.STRING(255), allowNull: true },
    file_pdf: { type: DataTypes.STRING(255), allowNull: true },
    template_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    signature: { type: DataTypes.JSON, allowNull: true },
}, {
    tableName: 'document',
    timestamps: true,
    underscored: true,
})

Document.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
});

User.hasMany(Document, {
    foreignKey: 'user_id',
    as: 'documents',
});
Document.belongsTo(Template, {
    foreignKey: 'template_id',
    as: 'template',
});
Template.hasMany(Document, {
    foreignKey: 'template_id',
    as: 'documents',
});
export default Document;