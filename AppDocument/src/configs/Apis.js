import axios from "axios";

export const endpoints = {
    'email_register': '/auth/register',
    'send_otp': '/auth/send-otp',
    'email_login': '/auth/login',
    'get_user': '/auth/user',
    'refresh_token': '/auth/refresh-token',
    'log_out': '/auth/log_out',
    'save_signature': '/auth/save-signature',
    'update': '/auth/update',

    'get_all_category': '/templates/get_categories',
    'search': '/templates/search',

    'create_document': '/documents/create-document',
    'get_documents': '/documents/user-id',
    'update_document': '/documents/update',
    'signature': '/documents/signature'

};


export const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const Apis = () => {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
           'Content-Type': 'application/json',
        }
    });
}

export const authApis = (token) => {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}

export default Apis;