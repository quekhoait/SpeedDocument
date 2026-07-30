import mammoth from 'mammoth';
import sequelize from '../config.js';
import { 
  TemplateCategory, 
  Template, 
  TemplateField, 
  TemplateFieldMapping 
} from "../models/TemplateModel.js";
import {generateLocalVector} from '../utils/embedding.js'
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

const createCategoryTemplate = async (data) => {
    const { name, description } = data;

    const newCategory = await TemplateCategory.create({
        name,
        description,
    });
    return newCategory;
};

const getFieldTemplate = async (fileInput) => {
    if (!fileInput) {
        throw new Error('Không có file để đọc');
    }

    const result = Buffer.isBuffer(fileInput)
        ? await mammoth.extractRawText({ buffer: fileInput })
        : await mammoth.extractRawText({ path: fileInput });

    const textContent = result.value || '';
    const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    const fields = new Set();
    let match;

    while ((match = regex.exec(textContent)) !== null) {
        fields.add(match[1]);
    }

    return Array.from(fields);
};

const previewFieldsFromWord = async (file_path) => {
    const fieldKeys = await getFieldTemplate(file_path);

    if (!fieldKeys || fieldKeys.length === 0) {
        return [];
    }
    const existingFields = await TemplateField.findAll({
        where: { field_key: fieldKeys },
    });

    const existingMap = new Map();
    existingFields.forEach(f => existingMap.set(f.field_key, f));
    return fieldKeys.map(key => {
        if (existingMap.has(key)) {
            const field = existingMap.get(key);
            return {
                field_key: key,
                field_label: field.field_label,
                field_type: field.field_type,
                is_existing: true, 
            };
        } else {
            return {
                field_key: key,
                field_label: key,
                field_type: 'text',
                is_existing: false, 
            };
        }
    });
};


const getTemplateById = async (id) => {
    return await Template.findByPk(id, {
        include: [
            { model: TemplateCategory, as: 'category' },
            {
                model: TemplateFieldMapping,
                as: 'fieldMappings',
                include: [{ 
                    model: TemplateField,
                    as: 'field'
                }]
            }
        ]
    });
};

const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'templates',
                resource_type: 'raw', // Bắt buộc cho file Word (.docx)
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

const createTemplate = async (data) => {
    const { name, description, categoryId, fileBuffer, fields = [] } = data;

    const cloudResult = await uploadToCloudinary(fileBuffer);
    const file_path = cloudResult.secure_url;

    const t = await sequelize.transaction();

    try {
        const newTemplate = await Template.create({
            name,
            description,
            template_category_id: categoryId,
            file_path: file_path, 
            is_active: true, 
        }, { transaction: t });

        if (fields.length > 0) {
            for (const item of fields) {
                const labelToEmbed = item.field_label || item.field_key;
                const vectorData = await generateLocalVector(labelToEmbed);

                const [fieldObj, created] = await TemplateField.findOrCreate({
                    where: { field_key: item.field_key },
                    defaults: {
                        field_key: item.field_key,
                        field_label: labelToEmbed,
                        field_type: item.field_type || 'text',
                        field_vector: vectorData,
                    },
                    transaction: t,
                });

                if (!created && !fieldObj.field_vector && vectorData) {
                    await fieldObj.update(
                        { field_vector: vectorData }, 
                        { transaction: t }
                    );
                }

                await TemplateFieldMapping.create({
                    template_id: newTemplate.id,
                    template_fields_id: fieldObj.id,
                    placeholder: `{{${item.field_key}}}`,
                    is_required: item.is_required || false,
                    prompt_text: item.prompt_text || `Nhập giá trị cho ${labelToEmbed}`,
                }, { transaction: t });
            }
        }

        await t.commit();
        return await getTemplateById(newTemplate.id);

    } catch (error) {
        await t.rollback();
        console.error('Lỗi khi tạo Template:', error);
        throw error;
    }
};


export default {
    createCategoryTemplate,
    getFieldTemplate,
    previewFieldsFromWord,
    getTemplateById,
    createTemplate,
};