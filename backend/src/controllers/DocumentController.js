import Document from "../models/DocumentModel.js";
import AICreateTemplateServices from "../services/AICreateTemplateServices.js";
import DocumentServices from "../services/DocumentServices.js";
import WordServices from "../services/WordServices.js";

export const processDocumentChat = async (req, res) => {
  try {
    const { documentId, templateId, prompt, type } = req.body;
    const userId = req.user?.id;

    // TRƯỜNG HỢP 1: ĐANG TIẾP TỤC TRONG 1 SESSION ĐÃ CÓ DOCUMENT
    if (documentId) {
      const currentDoc = await Document.findByPk(documentId);
      if (!currentDoc) {
        return res.status(404).json({ status: "ERR", message: "Không tìm thấy văn bản." });
      }

      // ── GIAI ĐOẠN 1: CHỈNH SỬA MẪU (template_id === null) ──
      if (currentDoc.template_id === null) {
        const currentTpl = currentDoc.extracted_data?._templateDraft;

        // Gọi AI sửa lại bố cục mẫu
        const updatedTpl = await AICreateTemplateServices.refineDynamicTemplate({
          currentTemplate: currentTpl,
          feedbackPrompt: prompt,
        });

        // Tạo file docx xem trước mới
        const fileName = `preview_${currentDoc.id}_${Date.now()}.docx`;
        const { cloudUrl } = await WordServices.createDocxFile({
          title: updatedTpl.name,
          paragraphs: updatedTpl.paragraphs,
          extractedData: {},
          fileName,
        });

        // Cập nhật lại bản nháp trong Document
        currentDoc.extracted_data = {
          ...currentDoc.extracted_data,
          _templateDraft: updatedTpl,
        };
        currentDoc.file_path = cloudUrl;
        await currentDoc.save();

        return res.status(200).json({
          status: "OK",
          phase: "TEMPLATE_DRAFTING",
          isDynamicTemplate: true,
          documentId: currentDoc.id,
          fileUrl: cloudUrl,
          templateData: updatedTpl,
          message: `Tôi đã cập nhật lại mẫu "${updatedTpl.name}" theo yêu cầu của bạn. Bạn hãy xem trước lại file Word bên dưới, nếu ưng ý hãy bấm "Xác nhận & Lưu mẫu" để bắt đầu điền thông tin.`,
        });
      }

      // ── GIAI ĐOẠN 2: ĐIỀN THÔNG TIN (template_id !== null) ──
      const result = await DocumentServices.updateDocumentProgress(
        documentId,
        userId,
        prompt
      );
      return res.status(200).json({
        ...result,
        phase: "FILLING_DATA",
      });
    }

    // TRƯỜNG HỢP 2: BẮT ĐẦU CHAT MỚI (CHƯA CÓ DOCUMENT_ID)
    let targetTemplateId = templateId;
    if (!targetTemplateId) {
      const searchResult = await DocumentServices.getTemplateByPrompt(prompt.trim());

      if (searchResult.status === "NEED_DOCUMENT_TYPE") {
        return res.status(422).json(searchResult);
      }

      // KHÔNG CÓ MẪU SẴN -> TẠO DYNAMIC TEMPLATE VÀ BẬT PHASE DRAFTING
      if (searchResult.status !== "OK") {
        const dynamicResult = await WordServices.createWithDynamicTemplate({
          prompt,
          userId,
        });
        return res.status(201).json({
          ...dynamicResult,
          phase: "TEMPLATE_DRAFTING",
        });
      }

      targetTemplateId = searchResult.templateId;
    }

    // CÓ MẪU SẴN TRONG DB -> VÀO THẲNG PHASE ĐIỀN THÔNG TIN
    const result = await DocumentServices.createDocumentWithTemplate(
      targetTemplateId,
      prompt,
      userId
    );
    return res.status(201).json({
      ...result,
      phase: "FILLING_DATA",
    });
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

    return res.status(200).json({ status: "OK", result });
  } catch (error) {
    console.error("Lỗi ký văn bản:", error);
    return res.status(500).json({ status: "ERR", message: error.message });
  }
};

const updateDocument = async (req, res) => {
  try {
    const { documentId, signature } = req.body;
    const userId = req.user?.id;

    if (!documentId) {
      return res.status(400).json({
        status: "ERR",
        message: "Thiếu thông tin documentId cần ký!",
      });
    }

    const result = await DocumentServices.updateSignature(
      userId,
      documentId,
      signature,
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Lỗi ký văn bản:", error);
    return res.status(500).json({ status: "ERR", message: error.message });
  }
};

const searchTemplateByPrompt = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt?.trim()) {
      return res.status(400).json({
        success: false,
        status: "INVALID_PROMPT",
        message: "Vui lòng cung cấp nội dung yêu cầu (prompt).",
      });
    }

    const result = await DocumentServices.getTemplateByPrompt(prompt.trim());

    return res.status(200).json(result);

  } catch (error) {
    console.error("Error in searchTemplateByPrompt:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi hệ thống khi xử lý yêu cầu.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; 
    if (!id) {
      return res.status(400).json({
        status: "ERR",
        message: "Thiếu ID văn bản.",
      });
    }
    const document = await DocumentServices.getDocumentById(id, userId);
    return res.status(200).json({
      status: "OK",
      message: "Lấy thông tin văn bản thành công.",
      data: document,
    });
  } catch (err) {
    console.error("Lỗi getDocumentById Controller:", err);
    return res.status(500).json({
      status: "ERR",
      message: err.message || "Lỗi server khi lấy chi tiết văn bản.",
    });
  }
};


const getAllDocument = async (req, res) => {
  try {
    const documents = await DocumentServices.getAllDocument(req.query);

    if (!documents || documents.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Danh sách tài liệu trống',
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('Lỗi lấy tài liệu:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server nội bộ',
    });
  }
};

export default {getDocumentById,
  processDocumentChat,
  getDocumentByUserId,
  writeSignature,
  updateDocument,
  searchTemplateByPrompt,
   getAllDocument
};
