import { ai, Type } from "../utils/aiconfig.js";
import dotenv from "dotenv";

dotenv.config();

export const analyzeDocumentRequest = async (prompt) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    config: {
      temperature: 0,
      systemInstruction: `Phân tích yêu cầu của người dùng để chuẩn bị dữ liệu cho Semantic Vector Search tìm mẫu văn bản hành chính.
Quy tắc:
1. isDocumentRequest: true nếu người dùng thực sự muốn tạo/soạn văn bản, false nếu chỉ trò chuyện hoặc cung cấp thông tin cá nhân.
2. documentType: Loại văn bản ngắn gọn (ví dụ: "Đơn xin nghỉ phép", "Giấy xác nhận công tác"). Trả về "" nếu isDocumentRequest = false.
3. searchText: Câu tóm tắt mục đích/ngữ cảnh/lý do để vector search. BẮT BUỘC LOẠI BỎ thông tin định danh (họ tên, ngày sinh, CCCD, sđt, địa chỉ). Trả về "" nếu isDocumentRequest = false.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isDocumentRequest: { type: Type.BOOLEAN },
          documentType: { type: Type.STRING },
          searchText: { type: Type.STRING },
          confidence: { type: Type.NUMBER, description: "Độ tin cậy từ 0.0 đến 1.0" },
        },
        required: ["isDocumentRequest", "documentType", "searchText", "confidence"],
      },
    },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  return JSON.parse(response.text);
};

export const generateDocument = async ({ prompt, fields, previousData = {} }) => {
  const properties = {};
  fields.forEach((field) => {
    properties[field.placeholder] = {
      type: Type.STRING,
      description: field.field_label,
    };
  });

  const systemPrompt = `Bạn là AI hỗ trợ tạo văn bản hành chính.
Nhiệm vụ:
1. Đọc nội dung nhập từ người dùng kết hợp với dữ liệu đã trích xuất từ các lượt chat trước.
2. Trích xuất thông tin để điền vào các placeholder. Nếu thiếu hoặc không có thông tin thì giá trị phải là "".
3. Chữ cái bắt đầu của mỗi thông tin đều phải viết hoa.`;

  const userPrompt = `Dữ liệu đã thu thập:\n${JSON.stringify(previousData, null, 2)}\n\nNội dung mới:\n"${prompt}"\n\nCác trường cần điền:\n${fields.map((f) => `- ${f.placeholder}: ${f.field_label}`).join("\n")}`;

  const response = await ai.models.generateContent({
    model: process.env.MODEL_AI,
    contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
    config: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          extractedData: { type: Type.OBJECT, properties },
          missingFields: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                placeholder: { type: Type.STRING },
                label: { type: Type.STRING },
                question: { type: Type.STRING },
              },
              required: ["placeholder", "label", "question"],
            },
          },
          isComplete: { type: Type.BOOLEAN },
        },
      },
    },
  });

  const result = JSON.parse(response.text);
  const mergedData = { ...previousData, ...result.extractedData };
  const actualMissingFields = result.missingFields.filter(
    (item) => !mergedData[item.placeholder] || mergedData[item.placeholder].trim() === ""
  );
  const isFullyComplete = actualMissingFields.length === 0;

  return {
    isComplete: isFullyComplete,
    data: mergedData,
    missingFields: actualMissingFields,
    followUpQuestion: isFullyComplete
      ? null
      : `Vui lòng cung cấp thêm các thông tin sau:\n` +
        actualMissingFields.map((f) => `- ${f.question}`).join("\n"),
  };
};