import { Apis, authApis, endpoints } from "../configs/Apis";

export const authService = {
    registerWithEmail: async (data) => {
        return await Apis().post(endpoints.email_register, data);
    },

    sendOtp: async (email) => {
        return await Apis().post(endpoints.send_otp, { email });
    },

    loginWithEmail: async (data) => {
        return await Apis(data).post(endpoints.email_login, data);
    },

    currentUser: async (token) => {
        return await authApis(token).get(endpoints.get_user);
    },

    refreshToken: async (token) => {
        return await authApis(token).get(endpoints.refresh_token);
    },

    saveSignature: async (token, signatureData) => {
        return await authApis(token).post(endpoints.save_signature, {
        signatureData: signatureData,
        });
    },

    updateUser: async (token, data) => {
        return await authApis(token).put(endpoints.update, data, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
        });
    },

    getDocuments: async (token) => {
        return await authApis(token).get(endpoints.get_documents)
    },

    logout: async (token) => {
        return await authApis(token).post(endpoints.log_out);
    },

   loginWithGoogle: async (returnUrl) => {
  const res = await Apis().get(endpoints.google_login, {
    params: { returnUrl },
  });
  return res.data;
},
};
