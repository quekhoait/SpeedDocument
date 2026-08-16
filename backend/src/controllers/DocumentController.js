import DocumentServices from "../services/DocumentServices.js";

const processDocumentChat = async (req, res) => {
  try {
    const { documentId, templateId, prompt } = req.body;
    const userId = req.user?.id;
    let result;

    if (documentId) {
      result = await DocumentServices.updateDocumentProgress(documentId, userId, prompt);
    } else {
      let targetTemplateId = templateId;
      if (!targetTemplateId) {
        const searchResult = await DocumentServices.getTemplateByPrompt(prompt);
        targetTemplateId = searchResult?.templateId;
      }
      result = await DocumentServices.createDocumentWithTemplate(targetTemplateId, prompt, userId);
    }
    return res.status(documentId ? 200 : 201).json(result);
  } catch (err) {
    console.error("Lỗi processDocumentChat:", err);
    return res.status(500).json({ status: "ERR", message: err.message });
  }
};

const getDocumentByUserId = async (req, res) => {
  try {
    const userId = req.user?.id;
    const documents = await DocumentServices.getDocumentByUserId(userId);
    return res.status(200).json({
      status: "OK",
      message: "Lấy danh sách tài liệu thành công",
      data: documents,
    });
  } catch (error) {
    console.error("Lỗi lấy document:", error);
    return res.status(500).json({ status: "ERR", message: error.message });
  }
};

const writeSignature = async (req, res) => {
  try {
    const { documentId, signature } = req.body;
    const userId = req.user?.id;

    if (!documentId) {
      return res.status(400).json({
        status: "ERR",
        message: "Thiếu thông tin documentId cần ký!",
      });
    }

    const result = await DocumentServices.writeSignature(userId, documentId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Lỗi ký văn bản:", error);
    return res.status(500).json({ status: "ERR", message: error.message });
  }
};

const updateDocument = async (req, res)=>{
   try {
    const { documentId, signature } = req.body;
    const userId = req.user?.id;

    if (!documentId) {
      return res.status(400).json({
        status: "ERR",
        message: "Thiếu thông tin documentId cần ký!",
      });
    }

    const result = await DocumentServices.updateSignature(userId, documentId, signature);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Lỗi ký văn bản:", error);
    return res.status(500).json({ status: "ERR", message: error.message });
  }
}

export default {
  processDocumentChat,
  getDocumentByUserId,
  writeSignature,
  updateDocument
};