import { useEffect, useState } from "react";
import Update from "../CRUD/Update";
import api from "../../Api/axios";
export default function UpdateAssignment(){
    const [doctors, setDoctors] = useState([])
    const [courses, setCourses] = useState([])
    const [acdYears, setAcdYears] = useState([])
    useEffect(() => {
       try{
        let getData = async () => {
            let docRes = await api.get('doctors')
            let corRes = await api.get('courses')
            let acdYearRes = await api.get('academic-years')
            setDoctors(docRes.data)
            setCourses(corRes.data.data)
            setAcdYears(acdYearRes.data.data)
            console.log(docRes)
        }
        getData()
       }catch(err){
            console.log(err.response)
       }
    } , [])
    return(
        <div className="doctor-assignments">
             <Update 
                page="updateAssignment" 
                endPoint="doctor-course-assignments" 
                pTitle="Assignment" 
                allBtn="Assignments" 
                doctors = {doctors}
                courses = {courses}
                acdYears = {acdYears}
                />
        </div>
    )
}