import axios from "axios";
import apiRoutes from "../contants/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("hrms-token");
  return { Authorization: `Bearer ${token}` };
};

const assetCategoryAPI = {
  create: (data) =>
    axios.post(apiRoutes.assetCategories, data, { headers: getAuthHeader() }),

  getAll: (params = {}) =>
    axios.get(apiRoutes.assetCategories, {
      params: {
        search: params.search || "",
        status: params.status || "",
        sortBy: params.sortBy || "createdAt",
        sortOrder: params.sortOrder || "desc",
        page: params.page || 1,
        limit: params.limit || 10,
      },
      headers: getAuthHeader(),
    }),

  getById: (id) =>
    axios.get(`${apiRoutes.assetCategories}/${id}`, { headers: getAuthHeader() }),

  update: (id, data) =>
    axios.put(`${apiRoutes.assetCategories}/${id}`, data, { headers: getAuthHeader() }),

  delete: (id) =>
    axios.delete(`${apiRoutes.assetCategories}/${id}`, { headers: getAuthHeader() }),
};

export default assetCategoryAPI;
