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

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth">
          <Route path='login' element={<Login />}/>
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

            <Route path='academic-years' element={<AcademicYears />}/>
          
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
