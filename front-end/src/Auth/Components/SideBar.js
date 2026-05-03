import { Link } from "react-router-dom";

export default function SideBar(){
    return(
        <div className="SideBar">
            <ul>
                <li><Link to="/auth/dashboard">DashBoard</Link></li>
                <li><Link to="/auth/dashboard/users">Users</Link></li>
                <li><Link to="/auth/dashboard/students">Students</Link></li>
                <li><Link to="/auth/dashboard/courses">Courses</Link></li>
                <li><Link to="/auth/dashboard/study-plans">Study Plans</Link></li>
                <li><Link to="/auth/dashboard/departments">Departments</Link></li>
                <li><Link to="/auth/dashboard/grades">Grades</Link></li>
                <li><Link to="/auth/dashboard/employees">Employees</Link></li>
                <li><Link to="/auth/dashboard/programs">Programs</Link></li>
                <li><Link to="/auth/dashboard/specializations">Specializations</Link></li>
                <li><Link to="/auth/dashboard/academic-years">Academic Years</Link></li>
            </ul>
        </div>
    )
}