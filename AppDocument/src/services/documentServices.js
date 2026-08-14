import { Apis, authApis, endpoints } from "../configs/Apis"


export const documentServices = {

 createDocument: async ({ prompt, documentId, templateId }) => {
    return await Apis().post(endpoints.create_document, {
      prompt,
      documentId,
      templateId,
    });
  }
    
}