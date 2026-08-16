import { Apis, authApis, endpoints } from "../configs/Apis"


export const templateService = {
    getAllCategory: async () => {
        return await Apis().get(endpoints.get_all_category);
    },

    getTemplate: async (id) => {
        return await authApis().get(endpoints.get_template(id))
    },

    search: async (cateId, kw) => {
        const params = {};
        if(cateId && cateId !== 'All'){
            params.cateId = cateId;
        }
        if(kw && kw.trim()){
            params.kw = kw.trim()
        }
        return await Apis().get(endpoints.search, { params });
    }
}