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

  // HR Team Employee Reports
  getHRTeamEmployeeReports: () =>
    axios.get(`${apiRoutes.reports}/team/employees`, {
      headers: getAuthHeader(),
    }),

  // Payroll Reports
  getPayrollReports: (params = {}) =>
    axios.get(`${apiRoutes.reports}/payroll`, {
      params,
      headers: getAuthHeader(),
    }),

  // HR Team Payroll Reports
  getHRTeamPayrollReports: (params = {}) =>
    axios.get(`${apiRoutes.reports}/team/payroll`, {
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

  // HR Team Attendance Reports
  getHRTeamAttendanceReports: () =>
    axios.get(`${apiRoutes.reports}/team/attendance`, {
      headers: getAuthHeader(),
    }),

  // Leave Reports
  getLeaveReports: () =>
    axios.get(`${apiRoutes.reports}/leaves`, {
      headers: getAuthHeader(),
    }),

  // HR Team Leave Reports
  getHRTeamLeaveReports: () =>
    axios.get(`${apiRoutes.reports}/team/leaves`, {
      headers: getAuthHeader(),
    }),

  // Department Reports
  getDepartmentReports: () =>
    axios.get(`${apiRoutes.reports}/departments`, {
      headers: getAuthHeader(),
    }),
};

export default reportsAPI;