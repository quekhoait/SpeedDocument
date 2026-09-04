import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const generateDynamicTemplate = async (prompt) => {
  const systemInstruction = `Bạn là chuyên gia soạn thảo văn bản hành chính Việt Nam.

Nhiệm vụ:
1. Tạo một MẪU VĂN BẢN chuẩn có chứa các placeholder dạng {{field_key}} (viết thường, snake_case, không dấu, ví dụ: {{ho_ten}}, {{so_cccd}}, {{ngay_sinh}}).
2. 'name': Tên ngắn gọn chuẩn của mẫu văn bản (ví dụ: Đơn xin xác nhận tạm trú, Giấy ủy quyền).
3. 'description': viết 1 đoạn tóm tắt mục đích sử dụng và cơ quan tiếp nhận (dùng để hiển thị và tìm kiếm ngữ nghĩa).
4. 'paragraphs': Mảng các dòng văn bản đã định dạng chuẩn (chỉ chứa Kính gửi, nội dung chính, lý do, cam đoan; KHÔNG chứa Quốc hiệu, Tiêu ngữ, Ngày tháng và Chữ ký vì hệ thống tự chèn).
5. 'fields': Danh sách các trường cần thu thập cho bảng TemplateField:
   - field_key: Tên biến (khớp với {{field_key}} trong paragraphs).
   - field_label: Tên hiển thị tiếng Việt (ví dụ: "Họ và tên").
   - field_type: "text" | "date" | "number" | "email" (mặc định là "text").
   - is_required: true | false.
   - question: Câu hỏi tự nhiên để hỏi người dùng.
6. 'extractedData': Bóc tách thông tin người dùng ĐÃ CÓ trong prompt ban đầu. Nếu chưa có để "".
7. 'missingFields': Danh sách các trường chưa có thông tin trong 'extractedData'.
8. 'isComplete': true nếu tất cả trường đã có dữ liệu, ngược lại là false.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      description: { type: Type.STRING },
      paragraphs: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      fields: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            field_key: { type: Type.STRING },
            field_label: { type: Type.STRING },
            field_type: { type: Type.STRING },
            is_required: { type: Type.BOOLEAN },
            question: { type: Type.STRING },
          },
          required: ["field_key", "field_label", "field_type", "is_required", "question"],
        },
      },
      extractedData: {
        type: Type.OBJECT,
      },
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
    required: [
      "name",
      "description",
      "paragraphs",
      "fields",
      "extractedData",
      "missingFields",
      "isComplete",
    ],
  };

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  return JSON.parse(response.text);
};



export const refineDynamicTemplate = async ({ currentTemplate, feedbackPrompt }) => {
  const systemInstruction = `Bạn là chuyên gia soạn thảo mẫu văn bản hành chính Việt Nam.

Nhiệm vụ:
- Dựa trên MẪU VĂN BẢN HIỆN TẠI và YÊU CẦU ĐIỀU CHỈNH của người dùng, cập nhật lại cấu trúc mẫu.
- Cập nhật mảng 'paragraphs' (chỉ chứa phần Kính gửi, nội dung chính, điều khoản; KHÔNG chứa Quốc hiệu, Tiêu ngữ, Ngày tháng và Chữ ký).
- Đảm bảo các placeholder trong 'paragraphs' có dạng {{field_key}}.
- Cập nhật danh sách 'fields' tương ứng với các placeholder trong văn bản.
- KHÔNG bóc tách hay hỏi thông tin cá nhân ở bước này, chỉ tập trung hoàn thiện khung mẫu.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      description: { type: Type.STRING },
      paragraphs: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      fields: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            field_key: { type: Type.STRING },
            field_label: { type: Type.STRING },
            field_type: { type: Type.STRING },
            is_required: { type: Type.BOOLEAN },
            question: { type: Type.STRING },
          },
          required: ["field_key", "field_label", "field_type", "is_required", "question"],
        },
      },
    },
    required: ["name", "description", "paragraphs", "fields"],
  };

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: `MẪU HIỆN TẠI:\n${JSON.stringify(currentTemplate, null, 2)}\n\nYÊU CẦU CHỈNH SỬA:\n"${feedbackPrompt}"`,
    config: {
      systemInstruction,
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  return JSON.parse(response.text);
};

export default {
  generateDynamicTemplate,
  refineDynamicTemplate
};