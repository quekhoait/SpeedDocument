import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
} from "docx";
import fs from "fs";
import path from "path";
import Document from "../models/DocumentModel.js";
import CloudServices from "./CloudServices.js";
import { generateDynamicTemplate } from "../AIServices/templateService.js";

export const createDocxFile = async ({ title, paragraphs = [], extractedData = {}, prefix = "template" }) => {
  // 1. Điền dữ liệu vào các placeholder trong nội dung chính
  const processedParagraphs = (paragraphs || []).map((line) => {
    let formattedLine = line;
    Object.keys(extractedData || {}).forEach((key) => {
      const val = extractedData[key] || "...............";
      formattedLine = formattedLine.replace(new RegExp(`{{${key}}}`, "g"), val);
    });
    return formattedLine;


  });

  // Lấy dữ liệu ngày tháng & tên người làm đơn
  const diaDiem = extractedData.dia_diem_lam_don || "TP. Hồ Chí Minh";
  const ngay = extractedData.ngay_lam_don || "ngày ... tháng ... năm 20...";
  const tenNguoiLamDon = extractedData.ten_nguoi_lam_don || extractedData.ho_ten || "";

  // 2. Tạo bảng chữ ký 2 cột ẩn viền (Trái: Để trống hoặc Cơ quan xác nhận, Phải: Người làm đơn)
  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [
      new TableRow({
        children: [
          // Cột bên trái (Để trống hoặc cơ quan xác nhận)
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ text: "" })],
          }),

          // Cột bên phải: Ngày tháng & Chữ ký người làm đơn
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              // Địa điểm, ngày tháng (In nghiêng, căn giữa cột phải)
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${diaDiem}, ${ngay}`,
                    italics: true,
                    size: 24,
                  }),
                ],
              }),

              // Chức danh: Người làm đơn (In đậm)
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100 },
                children: [
                  new TextRun({
                    text: "NGƯỜI LÀM ĐƠN",
                    bold: true,
                    size: 24,
                  }),
                ],
              }),

              // (Ký và ghi rõ họ tên) (In nghiêng)
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "(Ký và ghi rõ họ tên)",
                    italics: true,
                    size: 22,
                  }),
                ],
              }),

              // Khoảng trống ký tên & Tên người làm đơn
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 800 }, // Tạo khoảng trống 3-4 dòng để ký
                children: [
                  new TextRun({
                    text: tenNguoiLamDon,
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // 3. Đóng gói tài liệu Docx
  const doc = new DocxDocument({
    sections: [
      {
        properties: {},
        children: [
          // Quốc hiệu & Tiêu ngữ
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true, size: 24 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", bold: true, size: 24 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: "-----------------------", size: 20 })],
          }),

          // Tiêu đề đơn
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 150, after: 250 },
            children: [
              new TextRun({ text: (title || "ĐƠN ĐỀ NGHỊ").toUpperCase(), bold: true, size: 28 }),
            ],
          }),

          // Nội dung các dòng chính
          ...processedParagraphs.map(
            (p) =>
              new Paragraph({
                spacing: { after: 140 },
                children: [new TextRun({ text: p, size: 24 })],
              })
          ),

          // Khoảng cách trước khi tới chữ ký
          new Paragraph({ spacing: { before: 200 }, children: [] }),

          // Chèn bảng chữ ký đã căn phải
          signatureTable,
        ],
      },
    ],
  });

 const docBuffer = await Packer.toBuffer(doc);

  const fileName = `${prefix}_${Date.now()}.docx`;
  const cloudResult = await CloudServices.uploadToCloudinary(docBuffer, fileName);
  const cloudUrl = cloudResult.secure_url;

  return { cloudUrl };
};

export const createWithDynamicTemplate = async ({ prompt, userId }) => {
  // 1. Gọi AI sinh template
  const dynamicTpl = await generateDynamicTemplate(prompt);

  const { cloudUrl } = await createDocxFile({
    title: dynamicTpl.templateTitle,
    paragraphs: dynamicTpl.paragraphs,
    extractedData: dynamicTpl.extractedData,
    prefix: "preview_template",
  });

  // 3. Lưu bản nháp Document
  const newDoc = await Document.create({
    user_id: userId,
    template_id: null,
    status: Boolean(dynamicTpl.isComplete),
    extracted_data: {
      ...dynamicTpl.extractedData,
      _templateDraft: {
        title: dynamicTpl.templateTitle,
        paragraphs: dynamicTpl.paragraphs,
        fields: dynamicTpl.fields,
      },
    },
    missing_fields: dynamicTpl.missingFields || [],
    file_path: cloudUrl,
  });

  let message = `Tôi đã tạo bản nháp mẫu "${dynamicTpl.templateTitle}". Bạn có thể xem trước file Word đính kèm.`;
  if (!dynamicTpl.isComplete && dynamicTpl.missingFields?.length > 0) {
    message += `\n\nVui lòng cung cấp thêm các thông tin sau để điền hoàn thiện:\n` +
      dynamicTpl.missingFields.map((f) => `- ${f.question}`).join("\n");
  }

  return {
    status: "OK",
    isDynamicTemplate: true,
    documentId: newDoc.id,
    templateId: null,
    fileUrl: cloudUrl,
    templateData: {
      title: dynamicTpl.templateTitle,
      paragraphs: dynamicTpl.paragraphs,
      fields: dynamicTpl.fields,
    },
    missingFields: dynamicTpl.missingFields,
    isComplete: dynamicTpl.isComplete,
    message,
    document: newDoc,
  };
};

export default { createDocxFile, createWithDynamicTemplate };