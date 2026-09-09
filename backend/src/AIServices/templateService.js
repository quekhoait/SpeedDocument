import { ai, Type } from "../utils/aiconfig.js";
import dotenv from "dotenv";
import { readFile } from "node:fs/promises";

dotenv.config();

const loadSystemInstruction = async () => {
  const filePath = new URL("../../promt.txt", import.meta.url);
  return readFile(filePath, "utf8");
};

const templateFieldSchema = {
  type: Type.OBJECT,
  properties: {
    field_key: { type: Type.STRING },
    field_label: { type: Type.STRING },
    field_type: { type: Type.STRING },
    is_required: { type: Type.BOOLEAN },
    question: { type: Type.STRING },
  },
  required: ["field_key", "field_label", "field_type", "is_required", "question"],
};

const signatureSchema = {
  type: Type.OBJECT,
  properties: {
    enabled: { type: Type.BOOLEAN },
    position: { type: Type.STRING },
    title: { type: Type.STRING },
    date_label: { type: Type.STRING },
    signature_placeholder: { type: Type.STRING },
    name_placeholder: { type: Type.STRING },
    name: { type: Type.STRING },
  },
  required: ["enabled", "position", "title"],
};

export const generateDynamicTemplate = async (prompt) => {
  const systemInstruction = await loadSystemInstruction();
  const response = await ai.models.generateContent({
       model: process.env.MODEL_AI,
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          paragraphs: { type: Type.ARRAY, items: { type: Type.STRING } },
          fields: { type: Type.ARRAY, items: templateFieldSchema },
          signature: signatureSchema,
          signatures: { type: Type.ARRAY, items: signatureSchema },
          extractedData: { type: Type.OBJECT },
          missingFields: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                field_key: { type: Type.STRING },
                field_label: { type: Type.STRING },
                question: { type: Type.STRING },
              },
              required: ["field_key", "field_label", "question"],
            },
          },
          isComplete: { type: Type.BOOLEAN },
        },
        required: ["name", "description", "paragraphs", "fields", "signature", "signatures", "extractedData", "missingFields", "isComplete"],
      },
    },
  });

  return JSON.parse(response.text);
};

export const refineDynamicTemplate = async ({ currentTemplate, feedbackPrompt }) => {
  const systemInstruction = await loadSystemInstruction();

  const response = await ai.models.generateContent({
       model: process.env.MODEL_AI,
    contents: `MẪU HIỆN TẠI:\n${JSON.stringify(currentTemplate, null, 2)}\n\nYÊU CẦU CHỈNH SỬA:\n"${feedbackPrompt}"`,
    config: {
      systemInstruction,
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          paragraphs: { type: Type.ARRAY, items: { type: Type.STRING } },
          fields: { type: Type.ARRAY, items: templateFieldSchema },
          signature: signatureSchema,
          signatures: { type: Type.ARRAY, items: signatureSchema },
        },
        required: ["name", "description", "paragraphs", "fields", "signature", "signatures"],
      },
    },
  });

  return JSON.parse(response.text);
};