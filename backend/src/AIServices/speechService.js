import fs from "fs";
import { ai } from "../utils/aiconfig.js";
import dotenv from "dotenv";

dotenv.config();

export const speechToText = async ({ filePath, buffer, mimeType = "audio/m4a" }) => {
  let base64Audio = "";
  if (buffer) {
    base64Audio = buffer.toString("base64");
  } else if (filePath) {
    base64Audio = fs.readFileSync(filePath).toString("base64");
  } else {
    throw new Error("Thiếu dữ liệu audio (cần truyền buffer hoặc filePath)");
  }

  const response = await ai.models.generateContent({
    model: process.env.MODEL_AI,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Audio } },
          {
            text: "Hãy chuyển toàn bộ file âm thanh tiếng Việt này thành văn bản chính xác nhất. Chú ý nhận diện đúng phương ngữ vùng miền (Bắc, Trung, Nam), viết đúng chính tả tiếng Việt. Chỉ trả về duy nhất chuỗi văn bản đã chuyển đổi, không giải thích hay thêm bớt lời dẫn.",
          },
        ],
      },
    ],
    config: { temperature: 0.1 },
  });

  return {
    success: true,
    text: response.text ? response.text.trim() : "",
  };
};