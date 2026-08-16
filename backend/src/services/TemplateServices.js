import mammoth from "mammoth";
import sequelize from "../config.js";
import {
  TemplateCategory,
  Template,
  TemplateField,
  TemplateFieldMapping,
} from "../models/TemplateModel.js";
import { generateLocalVector } from "../utils/embedding.js";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import InspectModule from "docxtemplater/js/inspect-module.js";
import CloudServices from "./CloudServices.js";
import { Op } from "sequelize";

const createCategoryTemplate = async (data) => {
  const { name, description } = data;

  const newCategory = await TemplateCategory.create({
    name,
    description,
  });
  return newCategory;
};

const getAllCategory = async () => {
  return await TemplateCategory.findAll();
};

// Lấy theo categpry Id và all
const getTemplates = async (cateId, kw) => {
  const condition = { is_active: true };
  if (cateId) {
    condition.template_category_id = cateId;
  }
  if (kw && kw.trim()) {
    condition.name = {
      [Op.iLike]: `%${kw.trim()}%`,
    };
  }
  return await Template.findAll({
    where: condition,
    include: [
      {
        model: TemplateCategory,
        as: "category",
        attributes: ["id", "name"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

const getTemplate = async (id) => {
  return await Template.findByPk(id, {
    include: [
      {
        model: TemplateCategory,
        as: "category",
        attributes: ["id", "name"],
      },
      {
        model: TemplateFieldMapping,
        as: "fieldMappings",
        attributes: ["placeholder", "is_required"],
        include: [
          {
            model: TemplateField,
            as: "field",
          },
        ],
      },
    ],
  });
};

const getFieldTemplate = async (fileInput) => {
  if (!fileInput) {
    throw new Error("Không có file để đọc");
  }

  const result = Buffer.isBuffer(fileInput)
    ? await mammoth.extractRawText({ buffer: fileInput })
    : await mammoth.extractRawText({ path: fileInput });

  const textContent = result.value || "";
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
  existingFields.forEach((f) => existingMap.set(f.field_key, f));
  return fieldKeys.map((key) => {
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
        field_type: "text",
        is_existing: false,
      };
    }
  });
};

const getTemplateById = async (id) => {
  return await Template.findByPk(id, {
    include: [
      { model: TemplateCategory, as: "category" },
      {
        model: TemplateFieldMapping,
        as: "fieldMappings",
        include: [
          {
            model: TemplateField,
            as: "field",
          },
        ],
      },
    ],
  });
};

const createTemplate = async (data) => {
  const {
    name,
    description,
    categoryId,
    fileBuffer,
    fileName,
    fields = [],
  } = data;

  const cloudResult = await CloudServices.uploadToCloudinary(
    fileBuffer,
    fileName,
  );
  const file_path = cloudResult.secure_url;
  const t = await sequelize.transaction();

  try {
   const textToEmbed = `Tên mẫu: ${name}. ${name}. Mục đích sử dụng: ${description}`;
    const vectorData = await generateLocalVector(textToEmbed);
    const newTemplate = await Template.create(
      {
        name,
        description,
        template_category_id: categoryId,
        file_path: file_path,
        is_active: true,
        template_vector: vectorData,
      },
      { transaction: t },
    );

    if (fields.length > 0) {
      const uniqueFields = Array.from(
        new Map(fields.map((f) => [f.field_key, f])).values(),
      );

      for (const item of uniqueFields) {
        let fieldObj = await TemplateField.findOne({
          where: { field_key: item.field_key },
          transaction: t,
        });

        if (!fieldObj) {
          fieldObj = await TemplateField.create(
            {
              field_key: item.field_key,
              field_label: item.field_label,
              field_type: item.field_type || "text",
            },
            { transaction: t },
          );
        }

        await TemplateFieldMapping.create(
          {
            template_id: newTemplate.id,
            template_fields_id: fieldObj.id,
            placeholder: `{{${item.field_key}}}`,
            is_required: item.is_required || false,
          },
          { transaction: t },
        );
      }
    }

    await t.commit();
    return await getTemplateById(newTemplate.id);
  } catch (error) {
    await t.rollback();
    console.error("Lỗi khi tạo Template:", error);
    throw error;
  }
};

const updateField = async (data) => {
  const { id, field_key, field_label, field_type } = data;

  const field = await TemplateField.findByPk(id);

  if (!field) {
    return {
      status: "ERR",
      message: "Không tìm thấy trường dữ liệu (Field) này",
    };
  }
  if (
    field_key == field.field_key &&
    field_label == field.field_label &&
    field_type == field.field_type
  ) {
    return {
      status: "ERR",
      message: "Bạn chưa thay đổi gì cả!!",
    };
  }
  let vectorData;
  if (field_label) {
    vectorData = await generateLocalVector(field_label);
  } else {
    vectorData = field.field_vector;
  }
  await field.update({
    field_key: field_key || field.field_key,
    field_label: field_label || field.field_label,
    field_type: field_type || field.field_type,
    field_vector: vectorData,
  });

  return {
    status: "OK",
    message: "Cập nhật Field thành công",
    data: field,
  };
};

const getFieldByTemplateId = async (templateId) => {
  const template = await Template.findByPk(templateId, {
    include: [
      {
        model: TemplateFieldMapping,
        as: "fieldMappings",
        include: [
          {
            model: TemplateField,
            as: "field",
          },
        ],
      },
    ],
  });
  if (!template) return [];

  return template.fieldMappings
  .filter((m) => !m.placeholder.includes("chu_ky"))
  .map((mapping) => ({
    placeholder: mapping.placeholder,
    is_required: mapping.is_required,

    field_key: mapping.field.field_key,
    field_label: mapping.field.field_label,
    field_type: mapping.field.field_type,
  }));
};

export default {
  createCategoryTemplate,
  getFieldTemplate,
  getTemplateById,
  createTemplate,
  updateField,
  previewFieldsFromWord,
  getFieldByTemplateId,
  getAllCategory,
  getTemplates,
  getTemplate,
};
