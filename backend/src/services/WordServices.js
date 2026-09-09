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

export const createDocxFile = async ({ title, paragraphs = [], extractedData = {}, prefix = "template", signature = null, signatures = [] }) => {
  const processedParagraphs = (paragraphs || []).map((line) => {
    let formattedLine = line;
    Object.keys(extractedData || {}).forEach((key) => {
      const val = extractedData[key] || "...............";
      formattedLine = formattedLine.replace(new RegExp(`{{${key}}}`, "g"), val);
    });
    return formattedLine;
  });

  const diaDanh = extractedData.dia_danh || extractedData.dia_diem_lam_don || "{{dia_danh}}";
  const ngay = extractedData.ngay || "{{ngay}}";
  const thang = extractedData.thang || "{{thang}}";
  const nam = extractedData.nam || "{{nam}}";
  const tenNguoiLamDon = extractedData.ten_nguoi_lam_don || extractedData.ho_ten || "";

  const resolveSignatureField = (placeholder) => {
    if (!placeholder) return "";
    const key = placeholder.replace(/[{}]/g, "");
    return extractedData[key] || "";
  };

  const buildSignatureBlock = (signatureConfig = {}) => {
    const config = { position: "right", title: "NGƯỜI LÀM ĐƠN", ...signatureConfig };
    const position = config.position === "left" ? "left" : "right";
    const dateText = config.date_label || `${diaDanh}, ngày ${ngay} tháng ${thang} năm ${nam}`;
    const titleText = config.title || "NGƯỜI LÀM ĐƠN";
    const fixedName = resolveSignatureField(config.name_placeholder) || tenNguoiLamDon;
    const signatureName = config.name || fixedName;

    const alignment = position === "left" ? AlignmentType.LEFT : AlignmentType.RIGHT;

    return new Table({
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
              width: { size: position === "left" ? 55 : 35, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ text: "" })],
            }),
            new TableCell({
              width: { size: position === "left" ? 45 : 65, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment,
                  spacing: { after: 120 },
                  children: [new TextRun({ text: dateText, italics: true, size: 24 })],
                }),
                new Paragraph({
                  alignment,
                  children: [new TextRun({ text: titleText, bold: true, size: 24 })],
                }),
                new Paragraph({
                  alignment,
                  children: [new TextRun({ text: "(Ký và ghi rõ họ tên)", italics: true, size: 22 })],
                }),
                new Paragraph({
                  alignment,
                  spacing: { before: 800 },
                  children: [new TextRun({ text: signatureName, bold: true, size: 24 })],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  };

  const signatureBlocks = Array.isArray(signatures) && signatures.length > 0
    ? signatures.filter((item) => item?.enabled !== false).map((item) => buildSignatureBlock(item))
    : signature && signature.enabled !== false
      ? [buildSignatureBlock(signature)]
      : [buildSignatureBlock({ title: "NGƯỜI LÀM ĐƠN", position: "right" })];

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
          ...signatureBlocks,
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

  const templateTitle = dynamicTpl.name || "ĐƠN ĐỀ NGHỊ";

  const { cloudUrl } = await createDocxFile({
    title: templateTitle,
    paragraphs: dynamicTpl.paragraphs,
    extractedData: dynamicTpl.extractedData,
    signature: dynamicTpl.signature,
    signatures: dynamicTpl.signatures,
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