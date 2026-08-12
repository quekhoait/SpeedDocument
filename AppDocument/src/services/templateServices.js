import { Apis, authApis, endpoints } from "../configs/Apis"


export const templateService = {
    getAllCategory: async () => {
        return await Apis().get(endpoints.get_all_category);
    },

    getTemplate: async (id) => {
        return await authApis().get(endpoints.get_template(id))
    }
}