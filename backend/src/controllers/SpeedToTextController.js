import AIServices from "../services/AIServices.js";


export const speedToText = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "ERROR",
        message: "Vui lòng tải lên file âm thanh (audio).",
      });
    }

    const mimeType = req.file.mimetype || "audio/m4a";

    const result = await AIServices.SpeedToText({
      buffer: req.file.buffer,
      mimeType: mimeType,
    });

    return res.status(200).json({
      status: "OK",
      message: "Chuyển đổi âm thanh thành văn bản thành công.",
      data: {
        text: result.text,
      },
    });
  } catch (error) {
    console.error("Lỗi tại speechToTextController:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Đã xảy ra lỗi khi xử lý giọng nói với AI.",
      error: error.message,
    });
  }
};



export default {
  speedToText,
};