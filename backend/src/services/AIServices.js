import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY  
});

const analyzeDocumentRequest = async (prompt) => {
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
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });

  return JSON.parse(response.text);
};


const generateDocument = async (data) => {
  const { prompt, fields, previousData = {} } = data;
  const properties = {};

  fields.forEach((field) => {
    properties[field.placeholder] = {
      type: Type.STRING,
      description:  field.field_label,
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
5. Chữ cái bắt đầu cảu mỗi thông tin đều phải viết hoa.
`;

  const userPrompt = `
Dữ liệu đã thu thập ở các lượt trước:
${JSON.stringify(previousData, null, 2)}

Nội dung người dùng nhập mới:
"${prompt}"

Danh sách các trường cần điền:
${fields
  .map((f) => `- ${f.placeholder}: ${f.field_label}`)
  .join("\n")}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
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


const SpeedToText = async (data) => {
  try {
    const { filePath, buffer, mimeType = "audio/m4a" } = data;

    let base64Audio = "";
    if (buffer) {
      base64Audio = buffer.toString("base64");
    } else if (filePath) {
      base64Audio = fs.readFileSync(filePath).toString("base64");
    } else {
      throw new Error("Thiếu dữ liệu audio (cần truyền buffer hoặc filePath)");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio,
              },
            },
            {
              text: "Hãy chuyển toàn bộ file âm thanh tiếng Việt này thành văn bản chính xác nhất. Chú ý nhận diện đúng phương ngữ vùng miền (Bắc, Trung, Nam), viết đúng chính tả tiếng Việt. Chỉ trả về duy nhất chuỗi văn bản đã chuyển đổi, không giải thích hay thêm bớt lời dẫn.",
            },
          ],
        },
      ],
      config: {
        temperature: 0.1,
      },
    });

    return {
      success: true,
      text: response.text ? response.text.trim() : "",
    };
  } catch (error) {
    console.error("Lỗi SpeechToText:", error);
    throw error;
  }
};

export default {analyzeDocumentRequest,
  generateDocument,
  SpeedToText
};












// import OpenAI from "openai";
// import dotenv from "dotenv";
// import fs from "fs";

// dotenv.config();

// // Khởi tạo client OpenRouter
// const openai = new OpenAI({
//   baseURL: "https://api.tokenrouter.com/v1",
//   apiKey: process.env.TOKENROUTER_API_KEY,
//   defaultHeaders: {
//     "HTTP-Referer": "http://localhost:3000", // Tùy chọn để OpenRouter xếp hạng app
//     "X-Title": "Document",
//   },
// });

// console.log("Token check:", process.env.TOKENROUTER_API_KEY)

// // Có thể đổi sang các model Free khác như: "deepseek/deepseek-r1:free", "meta-llama/llama-3.3-70b-instruct:free"
// const DEFAULT_MODEL = "deepseek/deepseek-v4-pro-0813-free";

// /**
//  * Hàm hỗ trợ parse an toàn kết quả JSON từ LLM
//  */
// const safeParseJSON = (rawText) => {
//   try {
//     // Xóa markdown code block ```json ... ``` nếu có
//     const cleaned = rawText.replace(/```json\s*|\s*```/g, "").trim();
//     return JSON.parse(cleaned);
//   } catch (error) {
//     console.error("Lỗi parse JSON:", rawText);
//     throw new Error("Không thể parse dữ liệu trả về từ AI thành JSON.");
//   }
// };

// /**
//  * 1. Phân tích yêu cầu người dùng cho Semantic Vector Search
//  */
// export const analyzeDocumentRequest = async (prompt) => {
//   const systemInstruction = `Phân tích yêu cầu của người dùng để chuẩn bị dữ liệu cho Semantic Vector Search tìm mẫu văn bản hành chính.
// Quy tắc:
// 1. isDocumentRequest: true nếu người dùng thực sự muốn tạo/soạn văn bản, false nếu chỉ trò chuyện hoặc cung cấp thông tin cá nhân.
// 2. documentType: Loại văn bản ngắn gọn (ví dụ: "Đơn xin nghỉ phép", "Giấy xác nhận công tác"). Trả về "" nếu isDocumentRequest = false.
// 3. searchText: Câu tóm tắt mục đích/ngữ cảnh/lý do để vector search. BẮT BUỘC LOẠI BỎ thông tin định danh (họ tên, ngày sinh, CCCD, sđt, địa chỉ). Trả về "" nếu isDocumentRequest = false.
// 4. confidence: Độ tin cậy từ 0.0 đến 1.0.

// BẮT BUỘC trả về đúng định dạng JSON object với cấu trúc:
// {
//   "isDocumentRequest": boolean,
//   "documentType": string,
//   "searchText": string,
//   "confidence": number
// }`;

//   const response = await openai.chat.completions.create({
//     model: DEFAULT_MODEL,
//     temperature: 0,
//     response_format: { type: "json_object" },
//     messages: [
//       { role: "system", content: systemInstruction },
//       { role: "user", content: prompt },
//     ],
//   });

//   const content = response.choices[0]?.message?.content || "{}";
//   return safeParseJSON(content);
// };

// /**
//  * 2. Trích xuất thông tin mẫu văn bản & kiểm tra các trường còn thiếu
//  */
// export const generateDocument = async (data) => {
//   const { prompt, fields, previousData = {} } = data;

//   const fieldDefinitions = fields
//     .map((f) => `- ${f.placeholder}: ${f.field_label}`)
//     .join("\n");

//   const systemPrompt = `Bạn là AI hỗ trợ tạo văn bản hành chính.

// Nhiệm vụ:
// 1. Đọc nội dung người dùng nhập kết hợp với dữ liệu đã trích xuất từ các lượt chat trước (nếu có).
// 2. Trích xuất thông tin để điền vào các placeholder. Nếu thiếu hoặc không có thông tin thì giá trị của placeholder đó phải là chuỗi rỗng "".
// 3. Kiểm tra danh sách placeholder. Bắt buộc tạo danh sách 'missingFields' bao gồm:
//    - placeholder: tên trường thiếu.
//    - label: nhãn hiển thị của trường.
//    - question: câu hỏi tự nhiên, lịch sự yêu cầu người dùng cung cấp thông tin cho trường đó.
// 4. Đánh giá trạng thái 'isComplete':
//    - true: khi TẤT CẢ các placeholder đều đã được điền đầy đủ.
//    - false: khi vẫn còn ít nhất 1 placeholder có giá trị rỗng "".
// 5. Chữ cái bắt đầu của mỗi thông tin đều phải viết hoa.

// BẮT BUỘC trả về đúng định dạng JSON với cấu trúc:
// {
//   "extractedData": {
//     /* [placeholder]: giá trị đã trích xuất */
//   },
//   "missingFields": [
//     {
//       "placeholder": string,
//       "label": string,
//       "question": string
//     }
//   ],
//   "isComplete": boolean
// }`;

//   const userPrompt = `Dữ liệu đã thu thập ở các lượt trước:
// ${JSON.stringify(previousData, null, 2)}

// Nội dung người dùng nhập mới:
// "${prompt}"

// Danh sách các trường cần điền:
// ${fieldDefinitions}`;

//   const response = await openai.chat.completions.create({
//     model: DEFAULT_MODEL,
//     temperature: 0,
//     response_format: { type: "json_object" },
//     messages: [
//       { role: "system", content: systemPrompt },
//       { role: "user", content: userPrompt },
//     ],
//   });

//   const rawContent = response.choices[0]?.message?.content || "{}";
//   const result = safeParseJSON(rawContent);

//   const mergedData = { ...previousData, ...(result.extractedData || {}) };

//   const actualMissingFields = (result.missingFields || []).filter(
//     (item) => !mergedData[item.placeholder] || mergedData[item.placeholder].trim() === ""
//   );

//   const isFullyComplete = actualMissingFields.length === 0;

//   return {
//     isComplete: isFullyComplete,
//     data: mergedData,
//     missingFields: actualMissingFields,
//     followUpQuestion: isFullyComplete
//       ? null
//       : `Vui lòng cung cấp thêm các thông tin sau:\n` +
//         actualMissingFields.map((f) => `- ${f.question}`).join("\n"),
//   };
// };


// export const speechToText = async (data) => {
//   try {
//     const { filePath, buffer, mimeType = "audio/m4a" } = data;

//     let base64Audio = "";
//     if (buffer) {
//       base64Audio = buffer.toString("base64");
//     } else if (filePath) {
//       base64Audio = fs.readFileSync(filePath).toString("base64");
//     } else {
//       throw new Error("Thiếu dữ liệu audio (cần truyền buffer hoặc filePath)");
//     }

//     // Đưa audio dưới dạng data URL cho model hỗ trợ multimodal trên OpenRouter
//     const audioDataUrl = `data:${mimeType};base64,${base64Audio}`;

//     const response = await openai.chat.completions.create({
//       model: "google/gemini-2.0-flash-exp:free", // Model miễn phí hỗ trợ nhận diện Audio qua OpenRouter
//       temperature: 0.1,
//       messages: [
//         {
//           role: "user",
//           content: [
//             {
//               type: "text",
//               text: "Hãy chuyển toàn bộ file âm thanh tiếng Việt này thành văn bản chính xác nhất. Chú ý nhận diện đúng phương ngữ vùng miền (Bắc, Trung, Nam), viết đúng chính tả tiếng Việt. Chỉ trả về duy nhất chuỗi văn bản đã chuyển đổi, không giải thích hay thêm bớt lời dẫn.",
//             },
//             {
//               type: "image_url", // OpenRouter dùng cú pháp data URL tương tự image_url cho inline media
//               image_url: {
//                 url: audioDataUrl,
//               },
//             },
//           ],
//         },
//       ],
//     });

//     return {
//       success: true,
//       text: response.choices[0]?.message?.content?.trim() || "",
//     };
//   } catch (error) {
//     console.error("Lỗi SpeechToText OpenRouter:", error);
//     throw error;
//   }
// };

// export default {
//   analyzeDocumentRequest,
//   generateDocument,
//   speechToText,
// };