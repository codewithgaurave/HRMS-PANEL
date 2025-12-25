import axios from "axios";
import apiRoutes from "../contants/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("hrms-token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

const assetAPI = {
  // Create Asset
  create: (data) =>
    axios.post(`${apiRoutes.assets}`, data, {
      headers: getAuthHeader(),
    }),

  // Get all Assets with filters
  getAll: (params = {}) =>
    axios.get(`${apiRoutes.assets}`, {
      params,
      headers: getAuthHeader(),
    }),

  // Get single Asset by ID
  getById: (id) =>
    axios.get(`${apiRoutes.assets}/${id}`, {
      headers: getAuthHeader(),
    }),

  // Update Asset
  update: (id, data) =>
    axios.put(`${apiRoutes.assets}/${id}`, data, {
      headers: getAuthHeader(),
    }),

  // Delete Asset
  delete: (id) =>
    axios.delete(`${apiRoutes.assets}/${id}`, {
      headers: getAuthHeader(),
    }),

  // Assign Asset
  assign: (id, employeeId) =>
    axios.post(`${apiRoutes.assets}/${id}/assign`, { employeeId }, {
      headers: getAuthHeader(),
    }),

  // Return Asset
  return: (id) =>
    axios.post(`${apiRoutes.assets}/${id}/return`, {}, {
      headers: getAuthHeader(),
    }),

  // Get Assets by Employee
  getAssetsByEmployee: (employeeId) =>
    axios.get(`${apiRoutes.assets}/employee/${employeeId}`, {
      headers: getAuthHeader(),
    }),

  // Get Assets by Employee (alias)
  getByEmployee: (employeeId) =>
    axios.get(`${apiRoutes.assets}/employee/${employeeId}`, {
      headers: getAuthHeader(),
    }),

  // Get Asset Categories
  getCategories: () =>
    axios.get(`${apiRoutes.assets}/categories`, {
      headers: getAuthHeader(),
    }),
};

export default assetAPI;
export { assetAPI };