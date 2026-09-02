import * as Speech from "expo-speech";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

let activeAudioPlayer = null;


export const generateSpeechFromMissingFields = async (
  missingFields = [],
  isComplete = false
) => {
  if (isComplete || !missingFields || missingFields.length === 0) {
    return "Tôi đã nhận đủ thông tin. Đang tiến hành tạo văn bản cho bạn.";
  }

  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    const labels = missingFields
      .map((f) => f.question || f.field_label || f.label || f)
      .join(", ");
    return `Vui lòng cung cấp thêm các thông tin: ${labels}.`;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const systemInstruction = `Bạn là trợ lý ảo AI đọc câu thoại qua giọng nói (Text-To-Speech).
Nhiệm vụ: Nhận danh sách các trường thông tin còn thiếu (missingFields) và chuyển thành 1 câu thoại tiếng Việt tự nhiên, lịch sự, ngắn gọn và dễ hiểu khi nghe.

Quy tắc:
1. KHÔNG đọc dạng danh sách liệt kê, không gạch đầu dòng, không đọc dấu phẩy cộc lốc.
2. Nối các câu hỏi lại thành 1 câu thoại đàm thoại tự nhiên dưới 25 từ.
3. KHÔNG chứa emoji, markdown (*, #, _) hoặc ký tự đặc biệt.
4. BẮT BUỘC trả về đúng định dạng JSON: {"spokenText": "câu thoại"}`;

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: JSON.stringify(missingFields) }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawText || "{}");

    return (
      parsed.spokenText ||
      "Vui lòng bổ sung thêm các thông tin còn thiếu để hoàn tất văn bản."
    );
  } catch (error) {
    console.error("Lỗi Gemini Speech Prompt:", error);
    const labels = missingFields
      .map((f) => f.question || f.field_label || f.label || f)
      .join(", ");
    return `Vui lòng cung cấp thêm các thông tin: ${labels}.`;
  }
};


export const speakWithOpenAI = async(text)=> {

}

export const stopSpeech = async () => {
  await Speech.stop();

  if (activeAudioPlayer) {
    try {
      activeAudioPlayer.pause();
      activeAudioPlayer.remove();
    } catch (_) {}
    finally {
      activeAudioPlayer = null;
    }
  }
};