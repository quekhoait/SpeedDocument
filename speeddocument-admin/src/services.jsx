import Apis, { authApis, endpoints } from "./configs/Apis";

const buildTemplateFormData = (data) => {
  const formData = new FormData();
  console.log("data", data)
  formData.append('name', data.name);
  formData.append('description', data.description || '');
  formData.append('categoryId', Number(data.categoryId));
  formData.append('is_active', Boolean(data.is_active));
  formData.append('fields', JSON.stringify(data.fields || []));

  if (data.file) {
    const rawFile = data.file.originFileObj || data.file;
    if (rawFile instanceof File) {
      formData.append('file', rawFile);
    }
  }

  return formData;
};

export const services = {
  
  login: async (email, password) => {
    return await Apis().post(endpoints.email_login, { email, password });
  },

  refreshToken: async(token)=> {
    return await authApis(token).get(endpoints.refresh_token)
  },

  getUser: async(token)=>{
    return await authApis(token).get(endpoints.get_user)
  },

  getAllUser: async(token)=>{
    return await authApis(token).get(endpoints.get_all_user)
  },
  
 createCategory: async (token, payload) => {
  return await authApis(token).post(endpoints.create_category, payload);
},

  getAllCategory: async () => {
    return await Apis().get(endpoints.get_all_category);
  },

  get_all_templates: async (cateId, kw) => {
    const params = {};
    if (cateId && cateId !== "All") {
      params.cateId = cateId;
    }
    if (kw && kw.trim()) {
      params.kw = kw.trim();
    }
    return await Apis().get(endpoints.get_all_templates, { params });
  },

  getTemplate: async (id) => {
    return await authApis().get(endpoints.get_template(id));
  },

  previewTemplate: async (file) => {
    const formData = new FormData();
    const rawFile = file.originFileObj || file;
    formData.append("file", rawFile);
    return await authApis().post(endpoints.preview, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

 createTemplate: async (token, data) => {
  const formData = buildTemplateFormData(data);
  return await authApis(token).post(endpoints.create_template, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
},

updateTemplate: async (token, id, data) => {
  const formData = buildTemplateFormData(data);
  return await authApis(token).put(endpoints.update_template(id), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
},

 removeSoftTemplate: async (token, id) => {
  return await authApis(token).put(endpoints.remove_soft(id));
},

countTemplates: async (token, params) => {
  return await authApis(token).get(endpoints.count_templates, { params });
},

countDocuments: async (token, params) => {
  return await authApis(token).get(endpoints.count_documents, { params });
},

countUsers: async (token, params) => {
  return await authApis(token).get(endpoints.count_users, { params });
},

dashboardAnalytics: async (token, params) => {
  return await authApis(token).get(endpoints.dashboard, { params });
},

}
