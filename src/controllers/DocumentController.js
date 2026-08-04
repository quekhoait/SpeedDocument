import TemplateServices from "../services/TemplateServices.js";
import AIServices from "../services/AIServices.js";
import DocumentServices from "../services/DocumentServices.js";

const createDocument = async (req, res) => {
    try {
        const { prompt, templateId } = req.body;
        if(templateId == null || templateId == undefined){
           const document =  DocumentServices.createDocumentNoTemplateId(prompt);
           res.status(201).json(document);
        }else{
            const document =  DocumentServices.createDocumentWithTemplateId(templateId, prompt);
           res.status(201).json(document);
        }
      
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export default {
    createDocument,
}
