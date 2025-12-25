import axios from "axios";
import apiRoutes from "../contants/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("hrms-token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

const reportsAPI = {
  // Employee Reports
  getEmployeeReports: () =>
    axios.get(`${apiRoutes.reports}/employees`, {
      headers: getAuthHeader(),
    }),

  // Payroll Reports
  getPayrollReports: (params = {}) =>
    axios.get(`${apiRoutes.reports}/payroll`, {
      params,
      headers: getAuthHeader(),
    }),

  // Asset Reports
  getAssetReports: () =>
    axios.get(`${apiRoutes.reports}/assets`, {
      headers: getAuthHeader(),
    }),

  // Attendance Reports
  getAttendanceReports: () =>
    axios.get(`${apiRoutes.reports}/attendance`, {
      headers: getAuthHeader(),
    }),

  // Leave Reports
  getLeaveReports: () =>
    axios.get(`${apiRoutes.reports}/leaves`, {
      headers: getAuthHeader(),
    }),

  // Department Reports
  getDepartmentReports: () =>
    axios.get(`${apiRoutes.reports}/departments`, {
      headers: getAuthHeader(),
    }),


};

export default reportsAPI;