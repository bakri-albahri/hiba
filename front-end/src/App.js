import { Route, Routes } from 'react-router-dom';
import Home from './Home';
import DashBoard from './Auth/DashBoard/DashBoard';
import Users from './Auth/DashBoard/Users/Users';
import AddUser from './Auth/DashBoard/Users/AddUser';
import UpdateUser from './Auth/DashBoard/Users/UpdateUser';
import Login from './Auth/Login/Login';
import Departments from './Auth/DashBoard/Departments/Departments';
import AddDept from './Auth/DashBoard/Departments/AddDept';
import UpdateDept from './Auth/DashBoard/Departments/UpdateDept';
import Employees from './Auth/DashBoard/Employees/Employees';
import UpdateEmp from './Auth/DashBoard/Employees/UpdateEmp';
import Program from './Auth/DashBoard/Program/Program';
import AddProg from './Auth/DashBoard/Program/AddProg';
import UpdateProg from './Auth/DashBoard/Program/UpdateProg';
import Specializations from './Auth/DashBoard/Specializations/Specializations';
import AddSpec from './Auth/DashBoard/Specializations/AddSpec';
import UpdateSpec from './Auth/DashBoard/Specializations/UpdateSpec';
import Students from './Auth/DashBoard/Students/Students';
import UpdateStu from './Auth/DashBoard/Students/UpdateStu';
import UserDetails from './Auth/DashBoard/Users/UserDetails';
import Courses from './Auth/DashBoard/Courses/Courses';
import AddCourse from './Auth/DashBoard/Courses/AddCourse';
import UpdateCourse from './Auth/DashBoard/Courses/UpdateCourse';
import StudyPlans from './Auth/DashBoard/StudyPlans/StudyPlans';
import AddStudyPan from './Auth/DashBoard/StudyPlans/AddStudyPlan';
import UpdateStuduPlan from './Auth/DashBoard/StudyPlans/UpdateStudyPlan';
import Grades from './Auth/DashBoard/Grades/Grades';
import AcademicYears from './Auth/DashBoard/AcademicYears/AcademicYears';
import ShowAssignments from './Auth/DashBoard/DoctorCourseAssignments/ShowAssignments';
import AddAssignments from './Auth/DashBoard/DoctorCourseAssignments/AddAssignments';
import UpdateAssignment from './Auth/DashBoard/DoctorCourseAssignments/UpdateAssignmetn';
import ClassSchedule from './Auth/DashBoard/ClassSchedule/ClassSchedule';
import AddSchedule from './Auth/DashBoard/ClassSchedule/AddSchedule';
import UpdateSchedule from './Auth/DashBoard/ClassSchedule/UpdateSchedule';
import AddGrade from './Auth/DashBoard/Grades/AddGrade';
import DocProfile from './Auth/Doctor/DocProfile';
import StProfile from './Auth/StudentAcc/StProfile';
import HigherStudiesDept from './Auth/HigherStudiesDept/HigherStudiesDept';
import ExaminationsDepts from './Auth/ExaminationsDepts/ExaminationsDepts';
import StuAffairsDep from './Auth/StuAffairsDep/StuAffairsDep';
import Reports from './Auth/DashBoard/Reports/Reports';
import ActivityLogs from './Auth/DashBoard/ActivityLogs/ActivityLogs';
import EmployeePermissions from './Auth/DashBoard/EmployeePermissions/EmployeePermissions';
import FinanceDept from './Auth/FinanceDept/FinanceDept';
import DocumentVerification from './Auth/StudentAcc/DocumentVerification';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path='login' element={<Login />}/>
        <Route path='verify-document/:code' element={<DocumentVerification />} />
        <Route path="/auth">
          <Route path='doctor/profile' element={<DocProfile />} />
          <Route path='student/profile' element={<StProfile />} />
          <Route path='higherstudiesdept' element={<HigherStudiesDept />} />
          <Route path='examinations-dept' element={<ExaminationsDepts />} />
          <Route path='student-affairs' element={<StuAffairsDep />} />
          <Route path="finance-dept" element={<FinanceDept />} />
          <Route path='dashboard'  element={<DashBoard />}>
            
            <Route path='users' element={<Users />} />
            <Route path='users/add' element={<AddUser />} />
            <Route path='users/:id' element={<UpdateUser />} />
            <Route path='users/:id/details' element={<UserDetails />} />

            <Route path='departments' element={<Departments />} />
            <Route path='departments/add' element={<AddDept />} />
            <Route path='departments/:id' element={<UpdateDept />} />

            <Route path='employees' element={<Employees />} />
            <Route path='employees/:id' element={<UpdateEmp />} />

            <Route path='programs' element={<Program />} />
            <Route path='programs/add' element={<AddProg />} />
            <Route path='programs/:id' element={<UpdateProg />} />

            <Route path='Specializations' element={<Specializations />} />
            <Route path='Specializations/add' element={<AddSpec />} />
            <Route path='Specializations/:id' element={<UpdateSpec />} />

            <Route path='students' element={<Students />} />
            <Route path='students/:id' element={<UpdateStu />} />

            <Route path='courses' element={<Courses />} />
            <Route path='courses/:id' element={<UpdateCourse />} />
            <Route path='courses/add' element={<AddCourse />} />

            <Route path='study-plans' element={<StudyPlans />} />
            <Route path='study-plans/add' element={<AddStudyPan />} />
            <Route path='study-plans/:id' element={<UpdateStuduPlan/>} />

            <Route path='grades' element={<Grades />}/>
            <Route path='grades/add' element={<AddGrade />}/>

            <Route path='academic-years' element={<AcademicYears />}/>


            <Route path='doctor-course-assignments' element={<ShowAssignments />}/>
            <Route path='doctor-course-assignments/add' element={<AddAssignments />}/>
            <Route path='doctor-course-assignments/:id' element={<UpdateAssignment />}/>


            <Route path='class-schedules' element={<ClassSchedule />}/>
            <Route path='class-schedules/add' element={<AddSchedule />}/>
            <Route path='class-schedules/:id' element={<UpdateSchedule />}/>

            <Route path='reports' element={<Reports />}/>
          

            <Route path='activity-logs' element={<ActivityLogs />}/>

            <Route path='employee-premission' element={<EmployeePermissions />}/>
            
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
