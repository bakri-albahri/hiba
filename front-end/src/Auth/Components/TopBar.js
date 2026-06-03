import { useEffect, useMemo, useState } from "react";
import api from "../Api/axios";

function normalizeRole(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (!value) return "Super Admin";
  return String(value).replaceAll("_", " ");
}

export default function TopBar() {
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

  return (
    <section className="topBar">
      <div className="container">
        <div className="topbar-copy">
          <p className="topbar-eyebrow">Admin Workspace</p>
          <h1>Welcome, {displayName}</h1>
          <p>
            Manage university users, academic structure, schedules, reports,
            and administrative operations.
          </p>
        </div>

        <div className="topbar-actions">
          <form onSubmit={(e) => e.preventDefault()}>
            <input type="search" placeholder="Search for a student..." />
          </form>

          <button type="button" className="topbar-refresh" onClick={() => window.location.reload()}>
            <i className="fa-solid fa-rotate"></i>
            Refresh
          </button>
        </div>

        <div className="topbar-user">
          <span className="topbar-avatar">
            {String(displayName).slice(0, 1).toUpperCase()}
          </span>
          <div>
            <h2 className="userName">{displayName}</h2>
            <p>{roleText}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
