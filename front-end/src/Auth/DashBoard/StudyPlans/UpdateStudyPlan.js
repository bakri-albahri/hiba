    import { useEffect, useState } from "react";
import Update from "../CRUD/Update";
import api from "../../Api/axios";
export default function UpdateStuduPlan(){
    
    const [courses , setCourses] = useState([])
  
    useEffect(() => {
        const fetchData = async () => {
            try{
                let res = await api.get('courses')
                setCourses(res.data.data)
            }catch(err){
                console.log(err.response)
            }
        }
        fetchData()
    },[])
    console.log(courses)
    
    return(
        <div className="update-studyPlan">
             <Update page="updateStudyPlan" endPoint="study-plans" pTitle="Study Plan" allBtn="Study Plans" coursesData = {courses} />
        </div>
    )
}