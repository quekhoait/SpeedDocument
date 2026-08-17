import { Apis, authApis, endpoints } from "../configs/Apis";

export const documentServices = {
  createDocument: async (token, { prompt, documentId, templateId }) => {
    return await authApis(token).post(endpoints.create_document, {
      prompt,
      documentId,
      templateId,
    });
  },

  updateSignature: async (token, documentId, signature) => {
    return await authApis(token).put(endpoints.update_document, {
      documentId,
      signature,
    });
  },

  updateSignatureUser: async (token, documentId) => {
    return await authApis(token).put(endpoints.update_document, {
      documentId,
    });
  },

  signature: async (token, documentId) => {
    return await authApis(token).post(endpoints.signature, {
      documentId,
    });
  },

  speedToText: async (audioUri) => {
    const formData = new FormData();  
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a', // hoặc 'audio/mp4'
    name: 'recording.m4a',
  });
    return Apis().post(endpoints.speed_to_text, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }})
  }
};

export default documentServices;