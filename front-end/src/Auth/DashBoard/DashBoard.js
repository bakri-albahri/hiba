import { Outlet } from "react-router-dom";
import SideBar from "../Components/SideBar";
import TopBar from "../Components/TopBar";

export default function DashBoard(){
    return(
        <div className="dashBoard">
            <TopBar />
            <div className="dashBoard-body">
                <SideBar />
                <div className="db-content">
                   
                    <Outlet />
                </div>
            </div>
        </div>
    )
}