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
import Document from "../models/DocumentModel.js";
import CloudServices from "./CloudServices.js";
import { generateDynamicTemplate } from "../AIServices/templateService.js";

export const createDocxFile = async ({ title, paragraphs = [], extractedData = {}, prefix = "template" }) => {
  const processedParagraphs = (paragraphs || []).map((line) => {
    let formattedLine = line;
    Object.keys(extractedData || {}).forEach((key) => {
      const val = extractedData[key] || "...............";
      formattedLine = formattedLine.replace(new RegExp(`{{${key}}}`, "g"), val);
    });
    return formattedLine;
  });

  // Trích xuất hoặc giữ nguyên biến ngày tháng địa danh theo bố cục
  const diaDanh = extractedData.dia_danh || extractedData.dia_diem_lam_don || "{{dia_danh}}";
  const ngay = extractedData.ngay || "{{ngay}}";
  const thang = extractedData.thang || "{{thang}}";
  const nam = extractedData.nam || "{{nam}}";
  const tenNguoiLamDon = extractedData.ten_nguoi_lam_don || extractedData.ho_ten || "";

  // Bảng chữ ký 2 cột (Cột trái trống, Cột phải chứa ngày tháng + chức danh)
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
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ text: "" })],
          }),
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: `${diaDanh}, ngày ${ngay} tháng ${thang} năm ${nam}`,
                    italics: true,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "NGƯỜI LÀM ĐƠN",
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
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
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 800 },
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

  const doc = new DocxDocument({
    sections: [
      {
        properties: {},
        children: [
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
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 150, after: 250 },
            children: [
              new TextRun({ text: (title || "ĐƠN ĐỀ NGHỊ").toUpperCase(), bold: true, size: 28 }),
            ],
          }),
          ...processedParagraphs.map(
            (p) =>
              new Paragraph({
                spacing: { after: 140 },
                children: [new TextRun({ text: p, size: 24 })],
              })
          ),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          signatureTable,
        ],
      },
    ],
  });

  const docBuffer = await Packer.toBuffer(doc);
  const fileName = `${prefix}_${Date.now()}.docx`;
  const cloudResult = await CloudServices.uploadToCloudinary(docBuffer, fileName);

  return { cloudUrl: cloudResult.secure_url };
};

export const createWithDynamicTemplate = async ({ prompt, userId }) => {
  const dynamicTpl = await generateDynamicTemplate(prompt);

  // Khắc phục lỗi: dùng dynamicTpl.name thay vì dynamicTpl.templateTitle
  const templateTitle = dynamicTpl.name || "ĐƠN ĐỀ NGHỊ";

  const { cloudUrl } = await createDocxFile({
    title: templateTitle,
    paragraphs: dynamicTpl.paragraphs,
    extractedData: dynamicTpl.extractedData,
    prefix: "preview_template",
  });

  const newDoc = await Document.create({
    user_id: userId,
    template_id: null,
    status: Boolean(dynamicTpl.isComplete),
    extracted_data: {
      ...dynamicTpl.extractedData,
      _templateDraft: {
        title: templateTitle,
        paragraphs: dynamicTpl.paragraphs,
        fields: dynamicTpl.fields,
      },
    },
    missing_fields: dynamicTpl.missingFields || [],
    file_path: cloudUrl,
  });

  let message = `Tôi đã tạo bản nháp mẫu "${templateTitle}". Bạn có thể xem trước file Word đính kèm.`;
  if (!dynamicTpl.isComplete && dynamicTpl.missingFields?.length > 0) {
    message +=
      `\n\nVui lòng cung cấp thêm các thông tin sau để điền hoàn thiện:\n` +
      dynamicTpl.missingFields.map((f) => `- ${f.question}`).join("\n");
  }

  return {
    status: "OK",
    isDynamicTemplate: true,
    documentId: newDoc.id,
    templateId: null,
    fileUrl: cloudUrl,
    templateData: {
      title: templateTitle,
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