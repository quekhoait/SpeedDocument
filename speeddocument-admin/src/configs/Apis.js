import axios from "axios";

export const BASE_URL =  import.meta.env.VITE_API_URL;

export const endpoints = {

  'email_login': '/auth/login',
  'get_user': '/auth/user',
  'get_all_user': '/auth/get-all-user',
  'refresh_token': '/auth/refresh-token',
  'log_out': '/auth/log_out',

  // Categories
  'get_all_category': '/templates/get_categories',
  'create_category': '/templates/create-category',
  'update_category': (id) => `/admin/templates/category/${id}`,
  'delete_category': (id) => `/admin/templates/category/${id}`,

  // Templates
  'get_all_templates': '/templates/get-all',
  'get_template': (id) => `/templates/${id}`,
  'preview': '/templates/preview',
  'create_template': '/templates/create-template',
  'remove_soft': (id)=>`/templates/remove-soft/${id}`,
  'update_template': (id) => `/templates/update/${id}`,

  //count
  'count_templates': '/admin/count-templates',
  'count_documents': '/admin/count-documents',
  'count_users': '/admin/count-users',
  'dashboard': '/admin/dashboard-analytics'

};

export const Apis = () => {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    }
  });
};

export const authApis = (token) => {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

export default Apis;