import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const generateDocument = async (data) => {
  const { prompt, fields } = data;  
  const properties = {};

  fields.forEach((field) => {
    properties[field.placeholder] = {
      type: Type.STRING,
      description: field.prompt_text || field.field_label,
    };
  });

  const systemPrompt = `
Bạn là AI hỗ trợ tạo văn bản hành chính.

Nhiệm vụ:
- Đọc nội dung người dùng.
- Trích xuất thông tin để điền vào các placeholder.
- Nếu không có dữ liệu thì trả về chuỗi rỗng "".
- Chỉ trả về JSON.
`;

  const userPrompt = `
Nội dung người dùng:

"${prompt}"

Các trường cần điền:

${fields
  .map((f) => `- ${f.placeholder}: ${f.prompt_text || f.field_label}`)
  .join("\n")}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: systemPrompt + "\n\n" + userPrompt,
          },
        ],
      },
    ],
    config: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties,
      },
    },
  });

  return JSON.parse(response.text);
};

export default {
  generateDocument,
};
