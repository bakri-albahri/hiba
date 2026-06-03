import { Outlet } from "react-router-dom";
import SideBar from "../Components/SideBar";
import TopBar from "../Components/TopBar";

export default function DashBoard() {
  return (
    <div className="dashBoard">
      <SideBar />

      <main className="db-main">
        {/* <TopBar /> */}

        <div className="db-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
