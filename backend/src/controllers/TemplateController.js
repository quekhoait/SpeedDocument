import TemplateService from "../services/TemplateServices.js";

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ status: "ERR", message: "Tên danh mục không được để trống" });
    }
    const newCategory = await TemplateService.createCategoryTemplate({
      name,
      description,
    });
    return res.status(201).json({
      status: "OK",
      message: "Tạo danh mục thành công",
      data: newCategory,
    });
  } catch (err) {
    console.error("Lỗi Controller Create Category:", err);
    return res.status(500).json({ status: "ERR", message: err.message });
  }
};

const previewTemplateFields = async (req, res) => {
  try {
    const fileBuffer = req.file?.buffer;
    if (!fileBuffer) {
      return res.status(400).json({
        status: "ERR",
        message: "Vui lòng cung cấp đường dẫn file Word hoặc upload file Word",
      });
    }
    const fieldsPreview =
      await TemplateService.previewFieldsFromWord(fileBuffer);
    return res.status(200).json({
      status: "OK",
      message: "Trích xuất danh sách field thành công",
      data: fieldsPreview,
    });
  } catch (err) {
    console.error("Lỗi Controller Preview Fields:", err);
    return res.status(500).json({ status: "ERR", message: err.message });
  }
};

const createTemplate = async (req, res) => {
  try {
    const { name, description, categoryId, fields } = req.body;
    const file = req.file;

    if (!name || !categoryId || !file) {
      return res.status(400).json({
        status: "ERR",
        message: "Thiếu thông tin bắt buộc (name, categoryId, file)",
      });
    }

    let parsedFields = fields;
    if (typeof fields === "string") {
      try {
        parsedFields = JSON.parse(fields);
      } catch (e) {
        parsedFields = [];
      }
    }

    const newTemplate = await TemplateService.createTemplate({
      name,
      description,
      categoryId,
      fileBuffer: file.buffer,
      fileName: file.originalname,
      fields: parsedFields,
    });

    return res.status(201).json({
      status: "OK",
      message: "Tạo template thành công",
      data: newTemplate,
    });
  } catch (err) {
    console.error("Lỗi Controller Create Template:", err);
    return res.status(500).json({ status: "ERR", message: err.message });
  }
};

const updateField = async (req, res) => {
  try {
    const { id, field_key, field_label, field_type } = req.body;
    if (!id) {
      return res.status(400).json({
        status: "ERR",
        message: "Thiếu id",
      });
    }
    if (!field_key || !field_label || !field_type) {
      return res.status(400).json({
        status: "ERR",
        message: "Bạn chưa điển thông tin!",
      });
    }
    const field = await TemplateService.updateField(req.body);
    return res.status(201).json({
      status: "OK",
      message: "update field thành công",
      data: field,
    });
  } catch (error) {
    console.error("Lỗi Controller Create Template:", err);
    return res.status(500).json({ status: "ERR", message: err.message });
  }
};

export default {
  createCategory,
  previewTemplateFields,
  createTemplate,
  updateField
};
