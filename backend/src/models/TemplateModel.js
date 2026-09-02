import { DataTypes } from 'sequelize';
import sequelize from '../config.js';
import pgvector from 'pgvector/sequelize';
import { User } from './AuthModel.js';

pgvector.registerTypes(sequelize);

const TemplateCategory = sequelize.define('TemplateCategory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'template_category',
  timestamps: false,
});

const Template = sequelize.define('Template', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: {type: DataTypes.INTEGER, allowNull: true},
  name: { type: DataTypes.STRING(150), allowNull: false },
  file_path: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  template_category_id: { type: DataTypes.INTEGER, allowNull: true },
  template_vector: { type: DataTypes.VECTOR(384), allowNull: true },
}, {
  tableName: 'template',
  timestamps: true,
  underscored: true,
});

const TemplateField = sequelize.define('TemplateField', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  field_key: { type: DataTypes.STRING(45), allowNull: false },
  field_label: { type: DataTypes.STRING(255), allowNull: false },
  field_type: { type: DataTypes.STRING(45), allowNull: false },
  }, {
  tableName: 'template_fields',
  timestamps: false,
  underscored: true,
});

const TemplateFieldMapping = sequelize.define('TemplateFieldMapping', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  template_id: { type: DataTypes.INTEGER, allowNull: false },
  template_fields_id: { type: DataTypes.INTEGER, allowNull: false },
  placeholder: { type: DataTypes.STRING(45), allowNull: false },
}, {
  tableName: 'template_field_mapping',
  timestamps: false,
  underscored: true,
});

Template.belongsTo(TemplateCategory, {
  foreignKey: 'template_category_id',
  as: 'category',
});
TemplateCategory.hasMany(Template, {
  foreignKey: 'template_category_id',
  as: 'templates',
});

Template.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});
User.hasMany(Template, {
  foreignKey: 'user_id',
  as: 'templates',
});

TemplateFieldMapping.belongsTo(Template, {
  foreignKey: 'template_id',
  as: 'template',
});
Template.hasMany(TemplateFieldMapping, {
  foreignKey: 'template_id',
  as: 'fieldMappings',
});

TemplateFieldMapping.belongsTo(TemplateField, {
  foreignKey: 'template_fields_id',
  as: 'field',
});
TemplateField.hasMany(TemplateFieldMapping, {
  foreignKey: 'template_fields_id',
  as: 'mappings',
});

export { Template, TemplateCategory, TemplateField, TemplateFieldMapping }; 