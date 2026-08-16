import { Apis, authApis, endpoints } from "../configs/Apis"


export const documentServices = {

 createDocument: async ({ prompt, documentId, templateId }) => {
    return await Apis().post(endpoints.create_document, {
      prompt,
      documentId,
      templateId,
    });
  },
// #nếu có gửi chữ ksy
  updateSignature: async (token, documentId, signature) => {
    return await Apis().post(endpoints.update_document, {
      documentId, signature
    })
  },
//Nếu user có chữ ký và dùng lại
  updateSignatureUser: async (token, documentId) => {
    return await Apis().post(endpoints.update_document, {
      documentId
    })
  },

  signature: async (token, documentId) => {
    return await Apis().post(endpoints.signature, {
      documentId
    })
  }
    
}