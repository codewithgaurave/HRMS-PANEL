// src/apis/taskAPI.js
import axios from "axios";
import apiRoutes from "../contants/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("hrms-token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

const taskAPI = {
  // Create a new Task (HR Manager / Team Leader)
  create: (data) =>
    axios.post(`${apiRoutes.tasks}`, data, {
      headers: getAuthHeader(),
    }),

  // Get all Tasks (HR / Team Leader)
  getAll: (params = {}) =>
    axios.get(`${apiRoutes.tasks}`, {
      params: {
        search: params.search || "",
        status: params.status || "",
        priority: params.priority || "",
        assignedTo: params.assignedTo || "",
        deadlineStatus: params.deadlineStatus || "",
        sortBy: params.sortBy || "createdAt",
        sortOrder: params.sortOrder || "desc",
        isActive: params.isActive || 'all',
        page: params.page || 1,
        limit: params.limit || 10,
      },
      headers: getAuthHeader(),
    }),

  // Get tasks assigned to logged-in employee
  getMyTasks: (params = {}) =>
    axios.get(`${apiRoutes.tasks}/my`, {
      params,
      headers: getAuthHeader(),
    }),

  // Get single Task by ID
  getById: (id) =>
    axios.get(`${apiRoutes.tasks}/${id}`, {
      headers: getAuthHeader(),
    }),

  // Update Task
  update: (id, data) =>
    axios.put(`${apiRoutes.tasks}/${id}`, data, {
      headers: getAuthHeader(),
    }),

  // Update Task status (Employee)
  updateStatus: (id, data) =>
    axios.put(`${apiRoutes.tasks}/${id}/status`, data, {
      headers: getAuthHeader(),
    }),

  // Review Task (Approve/Reject) - Updated endpoint
  reviewTask: (id, data) =>
    axios.put(`${apiRoutes.tasks}/${id}/review`, data, {
      headers: getAuthHeader(),
    }),

  // Soft Delete Task (HR / Team Leader)
  delete: (id) =>
    axios.delete(`${apiRoutes.tasks}/${id}`, {
      headers: getAuthHeader(),
    }),

  // Restore Task (HR / Team Leader)
  restoreTask: (id) =>
    axios.patch(`${apiRoutes.tasks}/${id}`, {}, {
      headers: getAuthHeader(),
    }),

  // Get task statistics
  getStats: () =>
    axios.get(`${apiRoutes.tasks}/stats`, {
      headers: getAuthHeader(),
    }),

  // Get employees for task assignment
  getAssignableEmployees: () =>
    axios.get(`${apiRoutes.tasks}/assignable-employees`, {
      headers: getAuthHeader(),
    }),

  // Get deadline alerts
  getDeadlineAlerts: () =>
    axios.get(`${apiRoutes.tasks}/alerts/deadline`, {
      headers: getAuthHeader(),
    }),
};

export default taskAPI;