import axios from "axios";

export const endpoints = {
    'email_register': '/auth/register',
    'send_otp': '/auth/send-otp',
    'email_login': '/auth/login',
    'get_user': '/auth/user',
    'refresh_token': '/auth/refresh-token',
    'log_out': '/auth/log_out',

    'get_all_category': '/templates/get_categories',
    'get_template': (id) => (id && id !== 'ALL') ? `/templates/category/${id}` : '/templates/category',


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