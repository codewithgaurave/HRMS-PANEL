// src/routes/HRRoutes.jsx
import { lazy } from "react";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const Employees = lazy(() => import("../pages/Employees"));
const Attendance = lazy(() => import("../pages/Attendance"));
const LeavesManagement = lazy(() => import("../pages/LeavesManagement"));
const ManageAnnouncements = lazy(() => import("../pages/ManageAnnouncements"));
const TaskManagement = lazy(() => import("../pages/TaskManagement"));
const Payroll = lazy(() => import("../pages/Payroll"));
const Reports = lazy(() => import("../pages/Reports"));
const Settings = lazy(() => import("../pages/Settings"));
const AssetManagement = lazy(() => import("../pages/AssetManagement"));

const routes = [
  { path: "/dashboard", component: Dashboard, name: "Dashboard", icon: "📊" },
  { path: "/employees", component: Employees, name: "Employees", icon: "👥" },
  { path: "/attendance", component: Attendance, name: "Attendance", icon: "⏱️" },
  { path: "/leave-requests", component: LeavesManagement, name: "Manage Leaves", icon: "📅" },
  { path: "/announcements", component: ManageAnnouncements, name: "Manage Announcement", icon: "📢" },
  // { path: "/manage-tasks", component: TaskManagement, name: "Manage Tasks", icon: "📋" },
  { path: "/payroll", component: Payroll, name: "Payroll", icon: "💰" },
  { path: "/reports", component: Reports, name: "Reports", icon: "📈" },
  { path: "/assets", component: AssetManagement, name: "Asset Management", icon: "📦" },
  { path: "/settings", component: Settings, name: "Settings", icon: "⚙️" },
];

export default routes;