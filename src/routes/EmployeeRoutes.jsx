// src/routes/EmployeeRoutes.jsx
import { lazy } from "react";

const EmployeeDashboard = lazy(() => import("../employee/EmployeeDashboard"));
const MyTasks = lazy(() => import("../employee/MyTasks"));
const EmployeeAttendance = lazy(() => import("../employee/EmployeeAttendance"));
const MyLeaves = lazy(() => import("../employee/MyLeaves"));
const MyAssets = lazy(() => import("../employee/MyAssets"));
const MyPayroll = lazy(() => import("../employee/MyPayroll"));
const EmployeeNotices = lazy(() => import("../employee/EmployeeNotices"));
const AssetRequests = lazy(() => import("../employee/AssetRequests"));
const TestAPI = lazy(() => import("../employee/TestAPI"));

const routes = [
  { path: "/dashboard", component: EmployeeDashboard, name: "Dashboard", icon: "📊" },
  { path: "/attendance", component: EmployeeAttendance, name: "Attendance", icon: "⏰" },
  // { path: "/my-tasks", component: MyTasks, name: "My Tasks", icon: "📋" },
  { path: "/my-leaves", component: MyLeaves, name: "My Leaves", icon: "📅" },
  { path: "/my-assets", component: MyAssets, name: "My Assets", icon: "💻" },
  // { path: "/asset-requests", component: AssetRequests, name: "Asset Requests", icon: "📦" },
  { path: "/my-payroll", component: MyPayroll, name: "My Payroll", icon: "💰" },
  { path: "/notices", component: EmployeeNotices, name: "Notices", icon: "📢" },
  // { path: "/test-api", component: TestAPI, name: "Test API", icon: "🔧" },
];

export default routes;
