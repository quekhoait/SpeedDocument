import { Template } from "../models/TemplateModel.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import { generateLocalVector } from "../utils/embedding.js";
import { Sequelize } from "sequelize";

const createDocumentNoTemplateId = async ( prompt) => {
    const embedding = await generateLocalVector(prompt);
    
        const [template] = await Sequelize.query(
        `
        SELECT *
        FROM template
        WHERE is_active = true
        ORDER BY template_vector <=> CAST(:vector AS vector)
        LIMIT 1
        `,
        {
            replacements: {
                vector: `[${embedding.join(",")}]`
            },
            type: QueryTypes.SELECT
        }
    );
    if (!template) {
        throw new Error("Không tìm thấy mẫu phù hợp");
    }
    console.log("Template found:", template.name);

    // return await createDocumentWithTemplateId(
    //     template.id,
    //     prompt
    // );

}

const createDocumentWithTemplateId = async (templateId, data) => {

    const template = await Template.findByPk(templateId);
    if (!template) {
        throw new Error("Template not found");
    }
 
};

export default {
  createDocumentNoTemplateId,
  createDocumentWithTemplateId,
};
