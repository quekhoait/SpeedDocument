import axios from "axios";

export const BASE_URL =  import.meta.env.VITE_API_URL;

export const endpoints = {

  'email_login': '/auth/login',
  'get_user': '/auth/user',
  'refresh_token': '/auth/refresh-token',
  'log_out': '/auth/log_out',

  // Categories
  'get_all_category': '/templates/get_categories',
  'create_category': '/admin/templates/category',
  'update_category': (id) => `/admin/templates/category/${id}`,
  'delete_category': (id) => `/admin/templates/category/${id}`,

  // Templates
  'get_templates': (id) => (id && id !== 'ALL') ? `/templates/category/${id}` : '/templates/category',
  'get_template': (id) => `/templates/${id}`,
  'preview': '/templates/preview',
  'create_template': '/templates/create-template'

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