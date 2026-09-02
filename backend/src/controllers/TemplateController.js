import TemplateService from "../services/TemplateServices.js";

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ status: "ERR", message: "Tên danh mục không được để trống" });
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

const getAllCategory = async (req, res) => {
    try{
      const data = await TemplateService.getAllCategory();
      return res.status(200).json({
        status: "OK",
        message: "Lấy danh sách loại template thành công",
        data: data,
      });
    }catch(err){
        console.error("Lỗi:", err);
        return res.status(500).json({ status: "ERR", message: err.message });
    }
}

const getTemplates = async (req, res) => {
    try{
      const { cateId, kw } = req.query;
      const data = await TemplateService.getTemplates(cateId, kw);
      return res.status(200).json({
        status: "OK",
        message: "Lấy template thành công",
        data: data,
      });
    }catch(err){
         console.error("Lỗi:", err);
        return res.status(500).json({ status: "ERR", message: err.message });
    }
}

const getTemplate = async (req, res) =>{
  try{
    const { id } = req.params;
    const data = await TemplateService.getTemplate(id);
    return res.status(200).json({
      status: "OK",
      message: "Lấy template thành công",
      data: data,
    });
    }catch(err){
      console.error("Lỗi:", err);
      return res.status(500).json({ status: "ERR", message: err.message });
    }
}

const getAllTemplate = async(req,res)=> {
  try{
    const data = await TemplateService.getAllTemplate();
    return res.status(200).json({
      status: "OK",
      message: "Lấy template thành công",
      data: data
    })
  }catch(err){
    console.error("Lỗi:", err);
    return res.status(500).json({ status: "ERR", message: err.message });
  }
}

const previewTemplateFields = async (req, res) => {
  try {
    const fileBuffer = req.file?.buffer;
    if (!fileBuffer) {
      return res.status(400).json({
        status: "ERR",
        message: "Vui lòng cung cấp đường dẫn file Word hoặc upload file Word",
      });
    }
    const fieldsPreview = await TemplateService.previewFieldsFromWord(fileBuffer);
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
    const { name, description, categoryId, fields, documentId, urlCloud } = req.body;
    const userId = req.user?.id;
    const file = req.file;
    if (!name || !categoryId) {
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
      fileBuffer: file?.buffer,
      fileName: file?.originalname,
      fields: parsedFields,
      documentId: documentId,
      urlCloud: urlCloud,
      userId: userId
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

const removeSoftTemplate = async (req, res) => {
  try {
    const { id } = req.params; 
    if (!id) {
      return res.status(400).json({
        status: "ERR",
        message: "The templateId is required",
      });
    }
    const result = await TemplateService.removeSoftTemplate(id);
    return res.status(200).json({
      status: "OK",
      message: "Khóa template thành công",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      status: "ERR",
      message: error.message || "Internal Server Error",
    });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, description, categoryId, urlCloud, fields, is_active } = req.body;

    // Nếu gửi dạng FormData/multipart, parse chuỗi JSON của fields
    if (typeof fields === "string") {
      try {
        fields = JSON.parse(fields);
      } catch (err) {
        fields = [];
      }
    }

    const payload = {
      name,
      description,
      categoryId,
      urlCloud,
      fields,
      is_active: is_active !== undefined ? is_active : undefined,
    };

    // Nếu có file upload từ multer
    if (req.file) {
      payload.fileBuffer = req.file.buffer;
      payload.fileName = req.file.originalname;
    }

    const updatedTemplate = await TemplateService.updateTemplate(id, payload);

    return res.status(200).json({
      status: "OK",
      message: "Cập nhật template thành công",
      data: updatedTemplate,
    });
  } catch (error) {
    console.error("Lỗi controller updateTemplate:", error);
    return res.status(500).json({
      status: "ERR",
      message: error.message || "Đã xảy ra lỗi khi cập nhật template",
    });
  }
};


export default {
  createCategory,
  previewTemplateFields,
  createTemplate,
  updateField,
  getTemplates,
  getTemplate,
  getAllCategory,
  removeSoftTemplate,
  updateTemplate,
  getAllTemplate
};
