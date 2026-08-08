import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const generateDocument = async (data) => {
  const { prompt, fields, previousData = {} } = data;
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
1. Đọc nội dung nhập từ người dùng kết hợp với dữ liệu đã trích xuất từ các lượt chat trước (nếu có).
2. Trích xuất thông tin để điền vào các placeholder. Nếu thiếu hoặc không có thông tin thì giá trị của placeholder đó phải là chuỗi rỗng "".
3. Kiểm tra danh sách placeholder. Bắt buộc tạo danh sách 'missingFields' bao gồm:
   - placeholder: tên trường thiếu.
   - label: nhãn hiển thị của trường.
   - question: câu hỏi tự nhiên, lịch sự yêu cầu người dùng cung cấp thông tin cho trường đó.
4. Đánh giá trạng thái 'isComplete':
   - true: khi TẤT CẢ các placeholder đều đã được điền đầy đủ.
   - false: khi vẫn còn ít nhất 1 placeholder có giá trị rỗng "".
`;

  const userPrompt = `
Dữ liệu đã thu thập ở các lượt trước:
${JSON.stringify(previousData, null, 2)}

Nội dung người dùng nhập mới:
"${prompt}"

Danh sách các trường cần điền:
${fields
  .map((f) => `- ${f.placeholder}: ${f.prompt_text || f.field_label}`)
  .join("\n")}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: systemPrompt + "\n\n" + userPrompt }],
      },
    ],
    config: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          extractedData: {
            type: Type.OBJECT,
            properties,
          },
          missingFields: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                placeholder: { type: Type.STRING },
                label: { type: Type.STRING },
                question: { type: Type.STRING },
              },
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

export default {
  generateDocument,
};