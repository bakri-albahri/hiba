import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../Api/axios";

const menuItems = [
   {
    label: "Reports",
    path: "/auth/dashboard/reports",
    icon: "fa-solid fa-chart-line",
  },
  {
    label: "Users",
    path: "/auth/dashboard/users",
    icon: "fa-solid fa-users-gear",
  },
  {
    label: "Students",
    path: "/auth/dashboard/students",
    icon: "fa-solid fa-user-graduate",
  },
  {
    label: "Courses",
    path: "/auth/dashboard/courses",
    icon: "fa-solid fa-book-open",
  },
  {
    label: "Study Plans",
    path: "/auth/dashboard/study-plans",
    icon: "fa-solid fa-diagram-project",
  },
  {
    label: "Departments",
    path: "/auth/dashboard/departments",
    icon: "fa-solid fa-building-columns",
  },
  {
    label: "Grades",
    path: "/auth/dashboard/grades",
    icon: "fa-solid fa-square-poll-vertical",
  },
  {
    label: "Employees",
    path: "/auth/dashboard/employees",
    icon: "fa-solid fa-id-badge",
  },
  {
    label: "Programs",
    path: "/auth/dashboard/programs",
    icon: "fa-solid fa-layer-group",
  },
  {
    label: "Specializations",
    path: "/auth/dashboard/specializations",
    icon: "fa-solid fa-sitemap",
  },
  {
    label: "Academic Years",
    path: "/auth/dashboard/academic-years",
    icon: "fa-solid fa-calendar-days",
  },
  {
    label: "Doctor Assignments",
    path: "/auth/dashboard/doctor-course-assignments",
    icon: "fa-solid fa-chalkboard-user",
  },
  {
    label: "Class Schedule",
    path: "/auth/dashboard/class-schedules",
    icon: "fa-solid fa-calendar-week",
  },
  {
    label: "Activity Logs",
    path: "/auth/dashboard/activity-logs",
    icon: "fa-solid fa-clock-rotate-left",
  },
  {
    label: "Employee Premission",
    path: "/auth/dashboard/employee-premission",
    icon: "fa-solid fa-clock-rotate-left",
  },
];

function normalizeRole(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (!value) return "System Administrator";
  return String(value).replaceAll("_", " ");
}

export default function SideBar() {
  const [userInfo, setUserInfo] = useState({});
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const fetchdata = async () => {
      try {
        const res = await api.get("me");
        setUserInfo(res.data?.user || res.data || {});
        setUserRole(res.data?.roles || res.data?.role || "");
      } catch (err) {
        console.log(err?.response || err);
      }
    };

    fetchdata();
  }, []);

  const displayName = userInfo?.full_name || userInfo?.name || "Super Admin";
  const roleText = useMemo(() => normalizeRole(userRole), [userRole]);

  async function logout() {
    try {
      await api.post("/logout");
    } catch (_) {}
    localStorage.removeItem("token");
    window.location.pathname = "/login";
  }

  return (
    <aside className="SideBar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <i className="fa-solid fa-user-shield"></i>
        </div>
        <div>
          <h2>Admin Portal</h2>
          <p>University Management System</p>
        </div>
      </div>

      <div className="sidebar-profile">
        <div className="sidebar-avatar">
          {String(displayName).slice(0, 1).toUpperCase()}
        </div>
        <div>
          <strong>{displayName}</strong>
          <p>{roleText}</p>
          <p>Control Panel</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button type="button" className="sidebar-logout" onClick={logout}>
        <i className="fa-solid fa-arrow-right-from-bracket"></i>
        Logout
      </button>
    </aside>
  );
}
