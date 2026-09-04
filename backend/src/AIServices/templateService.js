import { ai, Type } from "../utils/aiconfig.js";
import dotenv from "dotenv";

dotenv.config();

const templateFieldSchema = {
  type: Type.OBJECT,
  properties: {
    field_key: { type: Type.STRING },
    field_label: { type: Type.STRING },
    field_type: { type: Type.STRING },
    is_required: { type: Type.BOOLEAN },
    question: { type: Type.STRING },
  },
  required: ["field_key", "field_label", "field_type", "is_required", "question"],
};

export const generateDynamicTemplate = async (prompt) => {
  const systemInstruction = `Bạn là chuyên gia soạn thảo văn bản hành chính Việt Nam.
Nhiệm vụ:
1. Tạo MẪU VĂN BẢN chuẩn có chứa các placeholder dạng {{field_key}} (snake_case, không dấu).
2. 'paragraphs': Mảng các dòng văn bản (chỉ chứa Kính gửi, nội dung, lý do, cam đoan; KHÔNG chứa Quốc hiệu, Tiêu ngữ, Ngày tháng, Chữ ký).
3. 'extractedData': Bóc tách thông tin người dùng ĐÃ CÓ trong prompt ban đầu. Nếu chưa có để "".`;

  const response = await ai.models.generateContent({
       model: process.env.MODEL_AI,
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          paragraphs: { type: Type.ARRAY, items: { type: Type.STRING } },
          fields: { type: Type.ARRAY, items: templateFieldSchema },
          extractedData: { type: Type.OBJECT },
          missingFields: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                field_key: { type: Type.STRING },
                field_label: { type: Type.STRING },
                question: { type: Type.STRING },
              },
              required: ["field_key", "field_label", "question"],
            },
          },
          isComplete: { type: Type.BOOLEAN },
        },
        required: ["name", "description", "paragraphs", "fields", "extractedData", "missingFields", "isComplete"],
      },
    },
  });

  return JSON.parse(response.text);
};

export const refineDynamicTemplate = async ({ currentTemplate, feedbackPrompt }) => {
  const systemInstruction = `Bạn là chuyên gia soạn thảo mẫu văn bản hành chính Việt Nam.
Nhiệm vụ:
- Dựa trên MẪU VĂN BẢN HIỆN TẠI và YÊU CẦU ĐIỀU CHỈNH, cập nhật lại cấu trúc mẫu.
- Cập nhật 'paragraphs' (giữ nguyên placeholder dạng {{field_key}}).
- Cập nhật danh sách 'fields'. KHÔNG bóc tách thông tin cá nhân ở bước này.`;

  const response = await ai.models.generateContent({
       model: process.env.MODEL_AI,
    contents: `MẪU HIỆN TẠI:\n${JSON.stringify(currentTemplate, null, 2)}\n\nYÊU CẦU CHỈNH SỬA:\n"${feedbackPrompt}"`,
    config: {
      systemInstruction,
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          paragraphs: { type: Type.ARRAY, items: { type: Type.STRING } },
          fields: { type: Type.ARRAY, items: templateFieldSchema },
        },
        required: ["name", "description", "paragraphs", "fields"],
      },
    },
  });

  return JSON.parse(response.text);
};