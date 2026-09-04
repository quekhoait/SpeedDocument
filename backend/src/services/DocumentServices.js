import axios from "axios";
import util from "util";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { PDFDocument, rgb } from "pdf-lib";
import libre from "libreoffice-convert";
import sequelize from "../config.js";
import { Template } from "../models/TemplateModel.js";
import Document from "../models/DocumentModel.js";
import { User } from "../models/AuthModel.js";
import TemplateServices from "./TemplateServices.js";
import CloudServices from "./CloudServices.js";
import { generateLocalVector } from "../utils/embedding.js";
import PdfServices from "./PdfServices.js";
import { v2 as cloudinary } from "cloudinary";
import { analyzeDocumentRequest, generateDocument } from "../AIServices/documentService.js";

const getTemplateByPrompt = async (prompt) => {
  const analysis = await analyzeDocumentRequest(prompt);

  if (!analysis?.isDocumentRequest || !analysis?.documentType) {
    return {
      status: "NEED_DOCUMENT_TYPE",
      message: "Tôi chưa xác định được loại văn bản bạn muốn tạo. Vui lòng mô tả rõ hơn.",
    };
  }

  const queryToEmbed = analysis.searchText 
    ? `${analysis.documentType}: ${analysis.searchText}` 
    : analysis.documentType;

  const embedding = await generateLocalVector(queryToEmbed);
  const vectorString = `[${embedding.join(",")}]`;

  const distanceSql = sequelize.literal(`template_vector <=> CAST(:vectorString AS vector)`);

  const template = await Template.findOne({
    where: { is_active: true },
    attributes: {
      include: [[distanceSql, "distance"]],
    },
    replacements: { vectorString },
    order: [[distanceSql, "ASC"]],
  });

  if (!template) {
    return {
      status: "TEMPLATE_NOT_FOUND",
      message: `Không tìm thấy mẫu phù hợp với "${analysis.documentType}".`,
    };
  }

  const distance = Number(template.get("distance"));
  console.log("Distance to template:", distance);
  const MAX_DISTANCE = 0.27; 

  if (distance > MAX_DISTANCE) {
    return {
      status: "TEMPLATE_NOT_CONFIDENT",
      message: `Chưa tìm thấy mẫu phù hợp với "${analysis.documentType}".`,
      documentType: analysis.documentType,
      distance,
    };
  }

  return {
    status: "OK",
    templateId: template.id,
    templateTitle: template.title,
    documentType: analysis.documentType,
    distance,
    confidence: analysis.confidence,
  };
};



const fillAndUploadTemplate = async (templateId, extractedData = {}) => {
  const template = await Template.findByPk(templateId);
  if (!template || !template.file_path) {
    throw new Error("Không tìm thấy Template hoặc đường dẫn file mẫu!");
  }
  const response = await axios.get(template.file_path, {
    responseType: "arraybuffer",
  });
  const zip = new PizZip(Buffer.from(response.data));
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
  });
  const cleanData = {};

  Object.keys(extractedData).forEach((key) => {
    const cleanKey = key.replace(/^\{\{|\}\}$/g, "").trim();
    cleanData[cleanKey] = extractedData[key] || "";
  });
  cleanData["chu_ky_nguoi_viet"] = "";

  doc.render(cleanData);
  const filledDocBuffer = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
  const fileName = `doc_${templateId}_${Date.now()}.docx`;
  const cloudResult = await CloudServices.uploadToCloudinary(
    filledDocBuffer,
    fileName,
  );
  const cloudUrl = cloudResult.secure_url;
  return { cloudUrl };
};

const createDocumentWithTemplate = async (templateId, prompt, userId = 1) => {
  const template = await Template.findByPk(templateId);
  if (!template) throw new Error("Template không tồn tại");
  const fields = await TemplateServices.getFieldByTemplateId(templateId);
  const aiResult = await generateDocument({
    prompt,
    fields,
    previousData: {},
  });

  let fileInfo = null;
  if (aiResult.isComplete) {
    fileInfo = await fillAndUploadTemplate(templateId, aiResult.data);
  }

  const newDocument = await Document.create({
    template_id: templateId,
    user_id: userId,
    extracted_data: aiResult.data,
    missing_fields: aiResult.missingFields,
    status: aiResult.isComplete ? true : false,
    file_path: fileInfo?.cloudUrl,
  });

  return {
    status: "OK",
    documentId: newDocument.id,
    isComplete: aiResult.isComplete,
    data: aiResult.data,
    missingFields: aiResult.missingFields,
    fileUrl: fileInfo?.cloudUrl,
    message: aiResult.isComplete
      ? "Đã thu thập đủ thông tin để tạo văn bản!"
      : aiResult.followUpQuestion,
  };
};

const updateDocumentProgress = async (documentId, userId, prompt) => {
  const document = await Document.findByPk(documentId);
  if (!document) throw new Error("Không tìm thấy bản nháp tài liệu!");
  const fields = await TemplateServices.getFieldByTemplateId(
    document.template_id,
  );
  const aiResult = await generateDocument({
    prompt,
    fields,
    previousData: document.extracted_data || {},
  });

  let fileInfo = null;
  if (aiResult.isComplete) {
    fileInfo = await fillAndUploadTemplate(document.template_id, aiResult.data);
  }
  await document.update({
    extracted_data: aiResult.data,
    missing_fields: aiResult.missingFields,
    status: aiResult.isComplete ? true : false,
    ...(fileInfo && {
      file_path: fileInfo.cloudUrl,
    }),
  });

  return {
    status: "OK",
    documentId: document.id,
    isComplete: aiResult.isComplete,
    data: aiResult.data,
    missingFields: aiResult.missingFields,
    fileUrl: fileInfo?.cloudUrl || null,
    message: aiResult.isComplete
      ? "Đã thu thập đủ thông tin để tạo văn bản!"
      : aiResult.followUpQuestion,
  };
};

const getDocumentByUserId = async (userId) => {
  const documents = await Document.findAll({
    where: {
      user_id: userId,
    },
    order: [["createdAt", "DESC"]],
  });
  return documents;
};

const convertAsync = util.promisify(libre.convert);

const SIGN_MARKER = "[[SIGN]]";

export const writeSignature = async (userId, documentId) => {
  const docRecord = await Document.findByPk(documentId);
  if (!docRecord) throw new Error("Không tìm thấy tài liệu!");

  const template = await Template.findByPk(docRecord.template_id);
  if (!template || !template.file_path) {
    throw new Error("Không tìm thấy Template hoặc file mẫu!");
  }

  const templateResponse = await axios.get(template.file_path, {
    responseType: "arraybuffer",
  });
  const zip = new PizZip(Buffer.from(templateResponse.data));

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
  });

  const cleanData = {};
  const extractedData = docRecord.extracted_data;
  Object.keys(extractedData).forEach((key) => {
    const cleanKey = key.replace(/^\{\{|\}\}$/g, "").trim();
    cleanData[cleanKey] = extractedData[key] || " ";
  });

  cleanData["chu_ky_nguoi_viet"] = SIGN_MARKER;
  doc.render(cleanData);

  const filledDocxBuffer = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });


  const pdfBuffer = await convertAsync(filledDocxBuffer, ".pdf", undefined);

  const coords = await PdfServices.findTextCoordinates(pdfBuffer, SIGN_MARKER);

  const pdfDoc = await PDFDocument.load(pdfBuffer);

  const signatureData =
    typeof docRecord.signature === "string"
      ? JSON.parse(docRecord.signature)
      : docRecord.signature;

  if (coords && signatureData && signatureData.url) {
    const sigResponse = await axios.get(signatureData.url, {
      responseType: "arraybuffer",
    });
    const signatureImage = await pdfDoc.embedPng(sigResponse.data);

    const targetPage = pdfDoc.getPages()[coords.pageIndex];

    targetPage.drawRectangle({
      x: coords.x - 5,
      y: coords.y - 5,
      width: 150,
      height: 25,
      color: rgb(1, 1, 1),
    });

    targetPage.drawImage(signatureImage, {
      x: coords.x,
      y: coords.y - 15,
      width: 130,
      height: 55,
    });
  }

  const finalPdfBytes = await pdfDoc.save();
  const finalPdfBuffer = Buffer.from(finalPdfBytes);

  const fileName = `doc_${docRecord.template_id}_signed_${Date.now()}.pdf`;
  const cloudResult = await CloudServices.uploadToCloudinary(
    finalPdfBuffer,
    fileName,
  );

  const cloudUrl = cloudResult.secure_url;
  const file_pdf = `https://docs.google.com/gview?url=${encodeURIComponent(cloudUrl)}&embedded=true`;

  await docRecord.update({
    file_path: cloudUrl,
    file_pdf: file_pdf,
  });

  return {
    document: docRecord,
    cloudUrl,
    file_pdf,
  };
};

const updateSignature = async (userId, documentId, signature) => {
  try {
    const user = await User.findByPk(userId);
    const document = await Document.findByPk(documentId);
    if (!signature && user.signature === null) {
      throw new Error("Không tìm thấy dữ liệu chữ ký (Base64)!");
    }
    let signatureData = null;
    if (signature) {
      const uploadResponse = await cloudinary.uploader.upload(signature, {
        folder: "signatures",
        resource_type: "image",
        format: "png",
      });

      signatureData = {
        type: "image",
        url: uploadResponse.secure_url,
        public_id: uploadResponse.public_id,
        updatedAt: new Date().toISOString(),
      };

      if (!document || document.user_id !== userId) {
        throw new Error("Tài liệu không hợp lệ");
      }
      document.signature = signatureData;
    } else {
      document.signature = user.signature;
    }
    await document.save();

    return {
      status: "OK",
      message: "Lưu chữ ký thành công!",
      signature: signatureData,
    };
  } catch (error) {
    console.error("Lỗi Save Signature Service:", error);
    throw new Error(`Lưu chữ ký thất bại: ${error.message}`);
  }
};

const getDocumentById = async (id, userId = null) => {
  const whereCondition = { id };  
  if (userId) {
    whereCondition.user_id = userId;
  }
  const document = await Document.findOne({
    where: whereCondition,
    include: [
      {
        model: Template,
        as: "template",
        attributes: ["id", "name", "description", "file_path", "template_category_id"],
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "username", "email"],
      },
    ],
  });
  if (!document) {
    throw new Error("Văn bản không tồn tại hoặc bạn không có quyền truy cập.");
  }
  return document;
};

const getAllDocument = async ()=> {
    return await Document.findAll();
}

export default {
  getDocumentById,
  createDocumentWithTemplate,

  updateDocumentProgress,

  getTemplateByPrompt,

  fillAndUploadTemplate,

  getDocumentByUserId,
  writeSignature,
  updateSignature,
  getAllDocument
};
