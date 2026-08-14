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
  getAllCategory: async () => {
    return await Apis().get(endpoints.get_all_category);
  },

  getTemplates: async (id) => {
    return await authApis().get(endpoints.get_templates(id));
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

 createTemplate: async (data) => {
    const formData = buildTemplateFormData(data);
    return await authApis().post(endpoints.create_template, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  updateTemplate: async (id, data) => {
    const formData = buildTemplateFormData(data);
    return await authApis().put(endpoints.update_template(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
