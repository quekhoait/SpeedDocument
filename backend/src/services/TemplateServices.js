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
import Document from "../models/DocumentModel.js";
import { User } from "../models/AuthModel.js";

const createCategoryTemplate = async (data) => {
  const { name, description } = data;
  const newCategory = await TemplateCategory.create({ name, description });
  return newCategory;
};

const getAllCategory = async () => {
  return await TemplateCategory.findAll();
};

//Lấy template theo cateId 
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
    order: [["created_at", "DESC"]],
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

const getAllTemplate = async () => {
  return await Template.findAll({
    order: [["created_at", "DESC"]],
  });
};



const getFieldTemplate = async (fileInput) => {
  if (!fileInput) {
    throw new Error("Không có file để đọc");
  }
  let result;
  // const result = Buffer.isBuffer(fileInput)
  //   ? await mammoth.extractRawText({ buffer: fileInput })
  //   : await mammoth.extractRawText({ path: fileInput });
  if(Buffer.isBuffer(fileInput)){
    result = await mammoth.extractRawText({path: fileInput})
  }
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
  const {name, description, categoryId, fileBuffer, fileName, fields = [], documentId, urlCloud, userId } = data;
  let file_path = urlCloud;
  if (!fileBuffer || !file_path) {
      throw new Error("Thiếu fileBuffer hoặc urlCloud để tạo template.");
    }
  if (!file_path) {
    const cloudResult = await CloudServices.uploadToCloudinary(fileBuffer, fileName);
    file_path = cloudResult.secure_url;
  }

  const t = await sequelize.transaction();  
  try {
   const textToEmbed = `Tên mẫu: ${name}. Mục đích sử dụng: ${description}`;
    const vectorData = await generateLocalVector(textToEmbed);
    const newTemplate = await Template.create({ name, description, template_category_id: categoryId,
        file_path: file_path, is_active: true, template_vector: vectorData, user_id: userId }, { transaction: t },
    );
    if (fields.length > 0) {
      const fieldMap = new Map();
      fields.forEach((field)=>{
        fieldMap.set(field.field_key, field)
      })
      const uniqueFields = Array.from(fieldMap.values())

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
    if (documentId) {
      await Document.update(
        { template_id: newTemplate.id },
        { where: { id: documentId }, transaction: t }
      );
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
  if (field_key == field.field_key && field_label == field.field_label && field_type == field.field_type) {
    return {
      status: "ERR",
      message: "Bạn chưa thay đổi gì cả!!",
    };
  }
  await field.update({
    field_key: field_key || field.field_key,
    field_label: field_label || field.field_label,
    field_type: field_type || field.field_type,
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
  return template.fieldMappings.filter((m) => !m.placeholder.includes("chu_ky")).map((mapping) => ({
    placeholder: mapping.placeholder,
    is_required: mapping.is_required,
    field_key: mapping.field.field_key,
    field_label: mapping.field.field_label,
    field_type: mapping.field.field_type,
  }));
};

const removeSoftTemplate = async (templateId)=> {
  const template = await Template.findByPk(templateId)
  if (!template) {
    throw new Error(`Template with id ${templateId} not found`);
  }
 const documentCount = await Document.count({
    where: {
      template_id: template.id,
    },
  });
  if(documentCount){
   template.is_active = false;
    await template.save();
    return template;
  }else{
    await template.destroy();
    return { message: "Template deleted permanently", id: templateId };
  } 
}

const updateTemplate = async (templateId, data) => {
  const { name, description, categoryId, fileBuffer, fileName, urlCloud, fields = [], is_active} = data;
  const template = await Template.findByPk(templateId);
  if (!template) {
    throw new Error(`Template with id ${templateId} not found`);
  }
  //  Xử lý file (ưu tiên urlCloud -> fileBuffer -> giữ nguyên file cũ)
  let file_path = template.file_path;
  if (urlCloud) {
    file_path = urlCloud;
  } else if (fileBuffer) {
    const uploadRes = await CloudServices.uploadToCloudinary(fileBuffer, fileName);
    file_path = uploadRes.secure_url;
  }
  const t = await sequelize.transaction();
  try {
    const newName = name || template.name;
    const newDesc = description || template.description;    
    let vectorData = template.template_vector;
    if (name || description) {
      const textToEmbed = `Tên mẫu: ${newName}. Mục đích sử dụng: ${newDesc}`;
      vectorData = await generateLocalVector(textToEmbed);
    }

    await template.update(
      {
        name: newName,
        description: newDesc,
        template_category_id: categoryId || template.template_category_id,
        file_path: file_path,
        template_vector: vectorData,
        is_active: is_active ?? template.is_active,
      },
      { transaction: t }
    );

    // Bước 3: Cập nhật Field và làm mới Field Mapping
    if (fields.length > 0) {
      // 3.1. Lọc bỏ các field bị trùng key trong danh sách truyền lên
      const uniqueFields = Array.from(
        new Map(fields.map((f) => [f.field_key, f])).values()
      );

      // 3.2. Xóa các mapping cũ của template
      await TemplateFieldMapping.destroy({
        where: { template_id: templateId },
        transaction: t,
      });

      // 3.3. Duyệt danh sách field: cập nhật (nếu có) hoặc tạo mới
      for (const item of uniqueFields) {
        let fieldObj = await TemplateField.findOne({
          where: { field_key: item.field_key },
          transaction: t,
        });

        if (fieldObj) {
          // Field đã tồn tại -> cập nhật label/type nếu người dùng sửa
          await fieldObj.update(
            {
              field_label: item.field_label || fieldObj.field_label,
              field_type: item.field_type || fieldObj.field_type,
            },
            { transaction: t }
          );
        } else {
          // Field chưa có -> tạo mới
          fieldObj = await TemplateField.create(
            {
              field_key: item.field_key,
              field_label: item.field_label || item.field_key,
              field_type: item.field_type || "text",
            },
            { transaction: t }
          );
        }

        // 3.4. Tạo mapping mới cho template
        await TemplateFieldMapping.create(
          {
            template_id: template.id,
            template_fields_id: fieldObj.id,
            placeholder: `{{${item.field_key}}}`,
            is_required: item.is_required || false,
          },
          { transaction: t }
        );
      }
    }

    await t.commit();
    return await getTemplateById(template.id);
  } catch (error) {
    await t.rollback();
    console.error("Lỗi khi update Template:", error);
    throw error;
  }
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
  removeSoftTemplate,
  updateTemplate,
  getAllTemplate
};
