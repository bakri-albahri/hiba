import { useEffect, useState } from "react"
import api from "../../Api/axios"
import Show from "../CRUD/Show"
import Select from "../../Components/input/Select"
import useDataStore from "../../../useDataStore";
import Inputs from "../../Components/input/Input";
import { Link } from "react-router-dom";
import SelectForm from "../../Components/input/Select";

export default function Grades() {
    const [loading , setloading] = useState(false)
    const [stNum , setStNum] = useState()
    const [acdYear , setAcdYear] = useState()
    const [courseID , setCourseID] = useState()
    const [marks , setMarks] = useState()
    
    
    
    const {students , fetchStudents , acdYears , fetchAcdYears , courses , fetchCourses} = useDataStore()
    // console.log(students)
    useEffect(() => {
        if (acdYears.length === 0) {
            fetchAcdYears();
        }
        if (students.length === 0) {
            fetchStudents();
        }
        if (courses.length === 0) {
            fetchCourses();
        }
    }, [acdYears, fetchAcdYears , students , fetchStudents , courses , fetchCourses]);
    console.log(acdYears)
    async function getMarks(e){
        let flag = false
        setloading(true)
        e.preventDefault();
        let studentId = students.filter((st) => st.student_number === stNum).flatMap((st) => st.id || "")
        if(studentId){flag = true}
        try{
            if(flag){
                if(stNum && !acdYear){
                    let res = await api.get(`/students/${studentId}/grades`)
                    console.log(res.data)
                    setMarks(res.data)
                }
                if(stNum && acdYear){
                    let res = await api.get(`/students/${studentId}/academic-years/${acdYear}/grades`)
                    console.log(res.data)
                    setMarks(res.data)
                }
                if(acdYear && courseID){
                    let res = await api.get(`/courses/${courseID}/academic-years/${acdYear}/grades`)
                    console.log(res.data)
                    setMarks(res.data)
                }
                setloading(false)
            }
        }catch(err){
            console.log(err.response)
            setloading(false)
        }
    }

    let showMarks =
        marks ? 
        (stNum && !acdYear) || (stNum && acdYear) ?

            marks?.grades?.map((grades , index) => (
                <tr key={index}>
                    <td>{grades.course_name}</td>
                    <td>{grades.grade.coursework_mark}</td>
                    <td>{grades.grade.practical_mark}</td>
                    <td>{grades.grade.exam_mark}</td>
                    <td>{grades.grade.final_mark}</td>
                </tr>
            )) 

        : (acdYear && courseID) &&
            marks?.students?.map((student , index) => (
                    <tr key={index}>
                        <td>{student.student_name}</td>
                        <td>{student.student_number}</td>
                        <td>{student.grade.coursework_mark}</td>
                        <td>{student.grade.practical_mark}</td>
                        <td>{student.grade.exam_mark}</td>
                        <td>{student.grade.final_mark}</td>
                    </tr>
                )) 
        : null

        

    
    return (
        <div className="grades">
             <div className="bar">
               <Link to="/auth/dashboard/grades/add"> اضافة علامات</Link>
             </div>
             <div className="grade-form">
                <form onSubmit={getMarks}>
                    <Inputs type="text" title="Student Num:" value={stNum} setValue={setStNum}/>
                    <SelectForm title="Academic Year" value={acdYear} setValue={setAcdYear} items={acdYears.data}/>
                    <SelectForm title="Course" value={courseID} setValue={setCourseID} items={courses}/>
                    <div className="btn">
                        <button type="submit" className="button">{loading ? "getting marks............" : "Show"}</button>
                    </div>
                </form>
             </div>
             {marks &&
             <table>
                <thead>
                { marks ? (stNum && !acdYear) || (stNum && acdYear) ? 
                    <tr>
                        <th>Course Name</th>
                        <th>coursework mark</th>
                        <th>practical mark</th>
                        <th>exam mark</th>
                        <th>Final mark</th>
                    </tr>
                    : (acdYear && courseID) ? 
                    <tr>
                        <th>Student Name</th>
                        <th>Student Num</th>
                        <th>coursework mark</th>
                        <th>practical mark</th>
                        <th>exam mark</th>
                        <th>Final mark</th>
                    </tr>
                    :"" 
                    : ""
                }
                </thead>
                <tbody>
                    {showMarks}
                </tbody>
             </table>
             }
        </div>
    )
}