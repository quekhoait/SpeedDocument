import TemplateServices from "../services/TemplateServices.js";
import AIServices from "../services/AIServices.js";
import DocumentServices from "../services/DocumentServices.js";

const processDocumentChat = async (req, res) => {
    try {
        const { documentId, templateId, prompt } = req.body;
        const userId = req.user?.id || 1;
        if (documentId) {
            const result = await DocumentServices.updateDocumentProgress(documentId, userId, prompt);
            return res.status(200).json(result);
        }

        let targetTemplateId = templateId;
        if (!targetTemplateId) {
            const searchResult = await DocumentServices.getTemplateNoTemplateId(prompt);
            targetTemplateId = searchResult.templateId;
        }

        const result = await DocumentServices.createDocumentWithTemplate(targetTemplateId, prompt, userId);
        if(result.isComplete) {
            await DocumentServices.fillInformationTemplate(targetTemplateId, result.data);
            
        }
        return res.status(201).json(result);

    } catch (err) {
        console.error("Lỗi processDocumentChat:", err);
        return res.status(500).json({ status: "ERR", message: err.message });
    }
};

export default {
    processDocumentChat,
}
