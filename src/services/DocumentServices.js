import { Template } from "../models/TemplateModel.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import { generateLocalVector } from "../utils/embedding.js";
import { QueryTypes, Sequelize } from "sequelize";
import sequelize from "../config.js";
import TemplateServices from "./TemplateServices.js";
import AIServices from "./AIServices.js";
import Document from "../models/DocumentModel.js";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import CloudServices from "./CloudServices.js";

const getTemplateNoTemplateId = async (prompt) => {
  const embedding = await generateLocalVector(prompt);
  const vectorString = `[${embedding.join(",")}]`;
  const template = await Template.findOne({
    where: {
      is_active: true,
    },
    order: [
      sequelize.literal(
        `template_vector <=> CAST('${vectorString}' AS vector)`,
      ),
    ],
  });
  if (!template) {
    throw new Error("Không tìm thấy mẫu phù hợp");
  }
  return { status: "OK", templateId: template.id };
};

const fillInformationTemplate = async (templateId, previousData = {}) => {
  try {
    const template = await Template.findByPk(templateId);
    if (!template || !template.file_path) {
      throw new Error("Không tìm thấy Template hoặc đường dẫn file mẫu!");
    }
    let fileBuffer;
    if (template.file_path) {
      const response = await axios.get(template.file_path, {
        responseType: "arraybuffer",
      });
      fileBuffer = Buffer.from(response.data);
    }
    const zip = new PizZip(fileBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: "{{",
        end: "}}",
      },
    });
    const cleanData = {};
    Object.keys(previousData).forEach((key) => {
      const cleanKey = key.replace(/^\{\{|\}\}$/g, "").trim();
      cleanData[cleanKey] = previousData[key] || "";
    });

    doc.render(cleanData);

    const filledDocBuffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    const outputDir = path.join(process.cwd(), "public", "generated_documents");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `document_${templateId}_${Date.now()}.docx`;
    const outputPath = path.join(outputDir, fileName);

    fs.writeFileSync(outputPath, filledDocBuffer);

    const cloudResult = await CloudServices.uploadToCloudinary(filledDocBuffer);

    return {
      status: "OK",
      filePath: outputPath,
      fileName: fileName,
      cloudUrl: cloudResult.secure_url, 
    };
  } catch (error) {
    console.error("Lỗi khi điền thông tin và lưu file Word local:", error);
    throw new Error(`Xử lý file thất bại: ${error.message}`);
  }
};



const createDocumentWithTemplate = async (templateId, prompt) => {
  const template = await Template.findByPk(templateId);
  if (!template) {
    throw new Error("Template không tồn tại");
  }
  const fields = await TemplateServices.getFieldByTemplateId(templateId);
  const aiResult = await AIServices.generateDocument({
    prompt,
    fields,
    previousData: {},
  });

  let fileInfo = null;  if (aiResult.isComplete) {
    fileInfo = await fillInformationTemplate(templateId, aiResult.data);
  }

  const newDocument = await Document.create({
    template_id: templateId,
    // user_id: 1,
    extracted_data: aiResult.data,
    missing_fields: aiResult.missingFields,
    status: aiResult.isComplete ? "1" : "0",
    file_path: fileInfo ? fileInfo.cloudUrl : null, 
  });

  return {
    status: "OK",
    documentId: newDocument.id,
    isComplete: aiResult.isComplete,
    data: aiResult.data,
    missingFields: aiResult.missingFields,
    message: aiResult.isComplete
      ? "Đã thu thập đủ thông tin để tạo văn bản!"
      : aiResult.followUpQuestion,
  };
};



const updateDocumentProgress = async (documentId, userId, prompt) => {
  const document = await Document.findByPk(documentId);
  if (!document) {
    throw new Error("Không tìm thấy bản nháp tài liệu (Document not found)");
  }
  const fields = await TemplateServices.getFieldByTemplateId(
    document.template_id,
  );
  const previousData = document.extracted_data || {};

  const aiResult = await AIServices.generateDocument({
    prompt,
    fields,
    previousData,
  });

  let fileInfo = null;
  if (aiResult.isComplete) {
    fileInfo = await fillInformationTemplate(document.template_id, aiResult.data);
  }

  await document.update({
    extracted_data: aiResult.data,
    missing_fields: aiResult.missingFields,
    status: aiResult.isComplete ? "1" : "0",
  });

  return {
    status: "OK",
    documentId: document.id,
    isComplete: aiResult.isComplete,
    data: aiResult.data,
    missingFields: aiResult.missingFields,
    message: aiResult.isComplete
      ? "Đã thu thập đủ thông tin để tạo văn bản!"
      : aiResult.followUpQuestion,
  };
};



export default {
  createDocumentWithTemplate,
  updateDocumentProgress,
  getTemplateNoTemplateId,
  fillInformationTemplate,
};
